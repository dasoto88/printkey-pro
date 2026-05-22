"""
PrintKey Pro — Backend API (FastAPI)
API completa para tienda de resets de impresoras.
"""
import os, json, shutil, threading, time
import smtplib, secrets, time as _time
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import (FastAPI, HTTPException, Depends, UploadFile, File,
                     Form, BackgroundTasks, Request)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from jose import jwt, JWTError
from passlib.context import CryptContext
import mercadopago
import httpx
from dotenv import load_dotenv

import sheets_db as db

load_dotenv()

# ── Keep-alive: ping propio cada 4 minutos para que Render no duerma ──
def _keep_alive():
    """Hilo en background que evita que el servidor se duerma en Render free."""
    time.sleep(60)  # Esperar 1 min al arranque antes del primer ping
    while True:
        try:
            backend_url = os.getenv("BACKEND_URL", "")
            if backend_url:
                import urllib.request
                urllib.request.urlopen(f"{backend_url}/api/health", timeout=10)
        except Exception:
            pass
        time.sleep(240)  # cada 4 minutos

_t = threading.Thread(target=_keep_alive, daemon=True)
_t.start()

# ── Configuración ─────────────────────────────────────────────
SECRET_KEY   = os.getenv("SECRET_KEY", "printkey-super-secret-2026-xK9p")
ALGORITHM    = "HS256"
TOKEN_EXPIRE = 60 * 24 * 7   # 7 días en minutos
MP_TOKEN     = os.getenv("MP_ACCESS_TOKEN", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
EMAIL_FROM   = os.getenv("EMAIL_FROM", "")
EMAIL_PASS   = os.getenv("EMAIL_PASS", "")
_reset_codes: dict = {}   # email → {code, expires}
_admin_2fa:   dict = {}   # email → {code, expires, new_hash}
UPLOAD_DIR    = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
FRONTEND_DIR  = Path(__file__).parent / "static_frontend"

app = FastAPI(title="PrintKey Pro API", version="2.0.0", docs_url="/api/docs", redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos de uploads (imágenes de productos)
app.mount("/static", StaticFiles(directory=str(UPLOAD_DIR)), name="static")

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ══════════════════════════════════════════════════════════════
#  AUTH — JWT
# ══════════════════════════════════════════════════════════════

def crear_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


def get_usuario_actual(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    payload = verificar_token(auth.split(" ")[1])
    uid  = payload.get("sub")
    user = db.get_usuario(uid)
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


def get_admin(request: Request) -> dict:
    user = get_usuario_actual(request)
    if user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Acceso solo para administradores")
    return user


# ══════════════════════════════════════════════════════════════
#  EMAIL HELPER
# ══════════════════════════════════════════════════════════════

def _enviar_email(to: str, subject: str, body_html: str) -> bool:
    if not EMAIL_FROM or not EMAIL_PASS:
        print(f"[EMAIL] Sin configurar. Destinatario: {to} | Asunto: {subject}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"PrintKey Pro <{EMAIL_FROM}>"
        msg["To"]      = to
        msg.attach(MIMEText(body_html, "html", "utf-8"))
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as s:
            s.ehlo()
            s.starttls()
            s.login(EMAIL_FROM, EMAIL_PASS)
            s.sendmail(EMAIL_FROM, to, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL] Error enviando a {to}: {e}")
        return False


# ══════════════════════════════════════════════════════════════
#  MODELOS PYDANTIC
# ══════════════════════════════════════════════════════════════

class RegistroModel(BaseModel):
    email: str
    nombre: str
    apellido: str
    password: str
    telefono: str = ""

class LoginModel(BaseModel):
    email: str
    password: str

class CompraModel(BaseModel):
    productos_ids: list[str]

class ForumPostModel(BaseModel):
    titulo: str
    contenido: str
    categoria: str = "general"

class ForumReplyModel(BaseModel):
    contenido: str

class BlogPostModel(BaseModel):
    titulo: str
    resumen: str = ""
    contenido: str
    autor: str = "PrintKey Pro"
    imagen_url: str = ""
    semana: str = ""
    categoria: str = "tecnologia"

class ProductoUpdateModel(BaseModel):
    nombre: Optional[str] = None
    descripcion_corta: Optional[str] = None
    descripcion_larga: Optional[str] = None
    precio: Optional[float] = None
    precio_oferta: Optional[float] = None
    activo: Optional[str] = None
    es_oferta: Optional[str] = None
    es_bundle: Optional[str] = None
    compatibilidad: Optional[str] = None

class RecuperarPassModel(BaseModel):
    email: str

class ResetPassModel(BaseModel):
    email: str
    codigo: str
    nueva_password: str

class CambiarPassAdminSolicitar(BaseModel):
    nueva_password: str

class CambiarPassAdminConfirmar(BaseModel):
    codigo: str

class WebCreateModel(BaseModel):
    titulo: str
    url: str
    descripcion: str = ""
    imagen_url: str = ""
    categoria: str = "general"
    orden: int = 0


# ══════════════════════════════════════════════════════════════
#  HEALTH CHECK
# ══════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "app": "PrintKey Pro"}


# ══════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ══════════════════════════════════════════════════════════════

@app.post("/api/auth/registro")
async def registro(data: RegistroModel):
    try:
        user = db.crear_usuario(
            data.email, data.nombre, data.apellido,
            data.password, data.telefono)
        token = crear_token({"sub": user["id"], "rol": "user"})
        return {"access_token": token, "token_type": "bearer", "usuario": _user_publico(user)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Login con form-data (OAuth2 estándar — frontend usa FormData con campo 'username')
@app.post("/api/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    user = db.verificar_credenciales(username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    token = crear_token({"sub": user["id"], "rol": user.get("rol","user")})
    return {"access_token": token, "token_type": "bearer", "usuario": _user_publico(user)}


@app.get("/api/auth/perfil")
async def perfil(request: Request):
    user = get_usuario_actual(request)
    compras = db.get_compras_usuario(user["id"])
    pagadas = [c for c in compras if c.get("estado") == "pagado"]
    return {**_user_publico(user), "total_compras": len(pagadas)}


def _user_publico(u: dict) -> dict:
    return {k: u[k] for k in ("id","email","nombre","apellido","rol","telefono")
            if k in u}


# ══════════════════════════════════════════════════════════════
#  PRODUCTOS
# ══════════════════════════════════════════════════════════════

@app.get("/api/productos")
async def listar_productos(categoria: str = None, oferta: bool = None):
    prods = db.get_productos(solo_activos=True)
    if categoria:
        prods = [p for p in prods if p.get("categoria") == categoria]
    if oferta is True:
        prods = [p for p in prods if p.get("es_oferta")]
    return prods


@app.get("/api/productos/ofertas")
async def ofertas():
    prods = db.get_productos(solo_activos=True)
    return [p for p in prods if p.get("es_oferta")]


@app.get("/api/productos/{pid}")
async def detalle_producto(pid: str):
    prod = db.get_producto(pid)
    if not prod or str(prod.get("activo","1")) != "1":
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    # No devolver la ruta interna del archivo
    prod.pop("archivo_path", None)
    return prod


# ══════════════════════════════════════════════════════════════
#  COMPRAS Y PAGOS
# ══════════════════════════════════════════════════════════════

@app.post("/api/pago/crear")
async def crear_pago(data: CompraModel, request: Request):
    user = get_usuario_actual(request)

    # Validar productos
    productos = []
    for pid in data.productos_ids:
        p = db.get_producto(pid)
        if not p:
            raise HTTPException(status_code=404, detail=f"Producto {pid} no encontrado")
        productos.append(p)

    if not productos:
        raise HTTPException(status_code=400, detail="Sin productos")

    # Calcular total
    total = sum(
        p["precio_oferta"] if p.get("es_oferta") and p["precio_oferta"] > 0
        else p["precio"]
        for p in productos
    )

    # Crear compra en Sheets (estado: pendiente)
    compra = db.crear_compra(
        usuario_id     = user["id"],
        usuario_email  = user["email"],
        productos_ids  = [p["id"] for p in productos],
        productos_nombres = [p["nombre"] for p in productos],
        total          = total,
        mp_preference_id = "",   # se actualiza abajo
    )

    # Crear preferencia MercadoPago
    if not MP_TOKEN:
        # Modo demo sin MercadoPago
        return {
            "compra_id":   compra["id"],
            "init_point":  f"{FRONTEND_URL}/pago-exitoso?compra_id={compra['id']}&demo=1",
            "total":       total,
        }

    sdk = mercadopago.SDK(MP_TOKEN)
    items_mp = [{
        "id":           p["id"],
        "title":        p["nombre"],
        "description":  p["descripcion_corta"],
        "quantity":     1,
        "unit_price":   float(
            p["precio_oferta"] if p.get("es_oferta") and p["precio_oferta"] > 0
            else p["precio"]
        ),
        "currency_id":  "ARS",
    } for p in productos]

    pref = sdk.preference().create({
        "items":       items_mp,
        "payer":       {"email": user["email"]},
        "back_urls": {
            "success": f"{FRONTEND_URL}/pago-exitoso?compra_id={compra['id']}",
            "failure": f"{FRONTEND_URL}/pago-fallido",
            "pending": f"{FRONTEND_URL}/pago-pendiente",
        },
        "auto_return":       "approved",
        "notification_url":  f"{os.getenv('BACKEND_URL','')}/api/pago/webhook",
        "external_reference": compra["id"],
    })

    pref_id   = pref["response"]["id"]
    init_point = pref["response"]["init_point"]

    # Guardar preference_id en la compra
    db.actualizar_producto.__doc__  # just a ref to avoid unused import
    ws = db._sheet("compras")
    rows = ws.get_all_values()
    if rows:
        cabs = rows[0]
        for i, row in enumerate(rows[1:], start=2):
            if row and row[0] == compra["id"]:
                col = cabs.index("mp_preference_id") + 1
                ws.update_cell(i, col, pref_id)
                break

    return {
        "compra_id":  compra["id"],
        "preference_id": pref_id,
        "init_point": init_point,
        "total":      total,
    }


@app.post("/api/pago/webhook")
async def webhook_mp(request: Request, bg: BackgroundTasks):
    try:
        body = await request.json()
    except Exception:
        return {"ok": True}

    topic  = body.get("type") or body.get("topic","")
    pay_id = None

    if topic == "payment":
        pay_id = str(body.get("data", {}).get("id") or body.get("id",""))
    elif topic == "merchant_order":
        order_id = str(body.get("data", {}).get("id",""))
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://api.mercadopago.com/merchant_orders/{order_id}",
                headers={"Authorization": f"Bearer {MP_TOKEN}"})
            if r.status_code == 200:
                payments = r.json().get("payments", [])
                for pmt in payments:
                    if pmt.get("status") == "approved":
                        pay_id = str(pmt["id"])
                        break

    if pay_id:
        bg.add_task(_confirmar_pago_bg, pay_id)

    return {"ok": True}


async def _confirmar_pago_bg(pay_id: str):
    """Confirma el pago en background consultando MP."""
    if not MP_TOKEN:
        return
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://api.mercadopago.com/v1/payments/{pay_id}",
                headers={"Authorization": f"Bearer {MP_TOKEN}"})
            if r.status_code != 200:
                return
            pago = r.json()
            if pago.get("status") != "approved":
                return
            ext_ref = pago.get("external_reference","")
            if ext_ref:
                db.confirmar_compra(ext_ref, pay_id)
    except Exception:
        pass


@app.get("/api/pago/confirmar-demo")
async def confirmar_demo(compra_id: str, request: Request):
    """Solo para desarrollo — confirma manualmente una compra."""
    db.confirmar_compra(compra_id, "DEMO_" + compra_id)
    return {"ok": True}


@app.get("/api/pago/estado/{compra_id}")
async def estado_compra(compra_id: str, request: Request):
    user   = get_usuario_actual(request)
    compra = db.get_compra(compra_id)
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    if compra["usuario_id"] != user["id"] and user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Sin acceso")
    return {
        "estado":     compra["estado"],
        "productos":  compra["productos_ids"],
        "total":      compra["total"],
        "fecha_pago": compra.get("fecha_pago",""),
    }


# ══════════════════════════════════════════════════════════════
#  DESCARGAS (solo con pago confirmado)
# ══════════════════════════════════════════════════════════════

@app.get("/api/descargar/{compra_id}/{producto_id}")
async def descargar(compra_id: str, producto_id: str, request: Request):
    user = get_usuario_actual(request)

    # Verificar que la compra pertenece al usuario y está pagada
    compra = db.get_compra(compra_id)
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    if compra["usuario_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if compra["estado"] != "pagado":
        raise HTTPException(status_code=402, detail="Pago no confirmado")
    if producto_id not in compra["productos_ids"]:
        raise HTTPException(status_code=403, detail="Producto no incluido en esta compra")

    prod = db.get_producto(producto_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    archivo_path = prod.get("archivo_path","")
    if not archivo_path:
        raise HTTPException(status_code=404, detail="Archivo no disponible aún")

    ruta = Path(archivo_path)
    if not ruta.is_absolute():
        ruta = UPLOAD_DIR / archivo_path

    if not ruta.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado en el servidor")

    # Registrar descarga
    db.incrementar_descargas(producto_id)

    return FileResponse(
        path=str(ruta),
        filename=prod.get("archivo_nombre", ruta.name),
        media_type="application/octet-stream",
    )


@app.get("/api/mis-compras")
async def mis_compras(request: Request):
    user    = get_usuario_actual(request)
    compras = db.get_compras_usuario(user["id"])
    resultado = []
    for c in compras:
        # Asegurar que productos_ids y productos_nombres sean strings pipe-sep
        if isinstance(c.get("productos_ids"), list):
            c["productos_ids"]     = "|".join(c["productos_ids"])
        if isinstance(c.get("productos_nombres"), list):
            c["productos_nombres"] = "|".join(c["productos_nombres"])
        try:
            c["total"] = float(c.get("total", 0) or 0)
        except Exception:
            c["total"] = 0
        resultado.append(c)
    return resultado


# ══════════════════════════════════════════════════════════════
#  FORUM
# ══════════════════════════════════════════════════════════════

@app.get("/api/forum")
async def forum_posts(categoria: str = None):
    return db.get_forum_posts(categoria)


@app.get("/api/forum/{post_id}")
async def forum_post(post_id: str):
    post = db.get_forum_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    return post


@app.post("/api/forum")
async def crear_post(data: ForumPostModel, request: Request):
    user = get_usuario_actual(request)
    nombre = f"{user.get('nombre','')} {user.get('apellido','')}".strip()
    post = db.crear_forum_post(
        user["id"], nombre, data.titulo, data.contenido, data.categoria)
    return post


@app.post("/api/forum/{post_id}/reply")
async def reply_post(post_id: str, data: ForumReplyModel, request: Request):
    user = get_usuario_actual(request)
    nombre = f"{user.get('nombre','')} {user.get('apellido','')}".strip()
    return db.crear_forum_reply(post_id, user["id"], nombre, data.contenido)


@app.patch("/api/forum/{post_id}/reply/{reply_id}/solucion")
async def marcar_solucion(post_id: str, reply_id: str, request: Request):
    user = get_usuario_actual(request)
    post = db.get_forum_post(post_id)
    if not post:
        raise HTTPException(status_code=404)
    if post["usuario_id"] != user["id"] and user.get("rol") != "admin":
        raise HTTPException(status_code=403)
    db.marcar_solucion(reply_id, post_id)
    return {"ok": True}


# ══════════════════════════════════════════════════════════════
#  BLOG
# ══════════════════════════════════════════════════════════════

@app.get("/api/blog")
async def blog_posts():
    return db.get_blog_posts()


@app.get("/api/blog/{bid}")
async def blog_post(bid: str):
    post = db.get_blog_post(bid)
    if not post:
        raise HTTPException(status_code=404)
    return post


# ══════════════════════════════════════════════════════════════
#  CONFIG PÚBLICA
# ══════════════════════════════════════════════════════════════

@app.get("/api/config")
async def config_publica():
    return {
        "sitio_nombre":    db.get_config("sitio_nombre", "PrintKey Pro"),
        "soporte_whatsapp": db.get_config("soporte_whatsapp", ""),
        "soporte_email":   db.get_config("soporte_email", ""),
        "banner_texto":    db.get_config("banner_texto", "La solución para tus impresoras"),
        "moneda":          db.get_config("moneda", "ARS"),
    }


# ══════════════════════════════════════════════════════════════
#  ADMIN ROUTES
# ══════════════════════════════════════════════════════════════

@app.get("/api/admin/estadisticas")
@app.get("/api/admin/stats")
async def admin_stats(request: Request):
    get_admin(request)
    prods   = db.get_productos(solo_activos=False)
    usuarios = []
    try:
        ws = db._sheet("usuarios")
        rows = ws.get_all_values()
        usuarios = rows[1:] if len(rows) > 1 else []
    except Exception:
        pass
    compras = []
    ventas  = 0.0
    try:
        ws = db._sheet("compras")
        rows = ws.get_all_values()
        if len(rows) > 1:
            cabs = rows[0]
            compras = [db._fila_a_dict(cabs, r) for r in rows[1:]]
            pagadas = [c for c in compras if c.get("estado") == "pagado"]
            ventas  = sum(float(c.get("total",0) or 0) for c in pagadas)
    except Exception:
        pass
    return {
        "total_productos": len(prods),
        "productos_activos": sum(1 for p in prods if str(p.get("activo","1"))=="1"),
        "total_descargas": sum(int(p.get("descargas",0) or 0) for p in prods),
        "usuarios_total":  len(usuarios),
        "compras_pagadas": len([c for c in compras if c.get("estado")=="pagado"]),
        "ventas_total":    ventas,
    }


@app.get("/api/admin/productos")
async def admin_listar_productos(request: Request):
    get_admin(request)
    return db.get_productos(solo_activos=False)


class ProductoCreateModel(BaseModel):
    nombre: str
    descripcion_corta: str = ""
    descripcion_larga: str = ""
    precio: float
    precio_oferta: Optional[float] = None
    categoria: str = "Epson"
    compatibilidad: str = ""
    es_oferta: bool = False
    es_bundle: bool = False


@app.post("/api/admin/productos")
async def admin_crear_producto(data: ProductoCreateModel, request: Request):
    get_admin(request)
    prod = db.crear_producto({
        "nombre":             data.nombre,
        "descripcion_corta":  data.descripcion_corta,
        "descripcion_larga":  data.descripcion_larga,
        "precio":             data.precio,
        "precio_oferta":      data.precio_oferta or 0,
        "imagen_url":         "",
        "archivo_nombre":     "",
        "archivo_path":       "",
        "categoria":          data.categoria,
        "compatibilidad":     data.compatibilidad,
        "es_oferta":          data.es_oferta,
        "es_bundle":          data.es_bundle,
    })
    return prod


@app.patch("/api/admin/productos/{pid}")
async def admin_actualizar_producto(
    pid: str, request: Request):
    get_admin(request)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body inválido")
    updates = {k: v for k, v in body.items() if v is not None}
    # Convertir booleans a "1"/"0" string si vienen como bool
    for k in ("activo", "es_oferta", "es_bundle"):
        if k in updates and isinstance(updates[k], bool):
            updates[k] = "1" if updates[k] else "0"
    prod = db.actualizar_producto(pid, updates)
    if not prod:
        raise HTTPException(status_code=404)
    return prod


# ── Upload routes usadas por el admin panel (producto_id en form-data) ──

@app.post("/api/admin/upload-imagen")
async def admin_upload_imagen(
    request: Request,
    file: UploadFile = File(...),
    producto_id: str = Form(...),
):
    get_admin(request)
    ext      = Path(file.filename).suffix
    img_path = UPLOAD_DIR / f"img_{producto_id}{ext}"
    with open(img_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    url = f"/static/img_{producto_id}{ext}"
    db.actualizar_producto(producto_id, {"imagen_url": url})
    return {"ok": True, "url": url}


@app.post("/api/admin/upload-archivo")
async def admin_upload_archivo(
    request: Request,
    file: UploadFile = File(...),
    producto_id: str = Form(...),
):
    get_admin(request)
    arch_path = UPLOAD_DIR / f"file_{producto_id}_{file.filename}"
    with open(arch_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    db.actualizar_producto(producto_id, {
        "archivo_nombre": file.filename,
        "archivo_path":   str(arch_path),
    })
    return {"ok": True, "archivo": file.filename}


@app.post("/api/admin/productos/{pid}/archivo")
async def admin_subir_archivo(
    pid: str, archivo: UploadFile = File(...), request: Request = None):
    get_admin(request)
    prod = db.get_producto(pid)
    if not prod:
        raise HTTPException(status_code=404)
    arch_path = UPLOAD_DIR / f"file_{pid}_{archivo.filename}"
    with open(arch_path, "wb") as f:
        shutil.copyfileobj(archivo.file, f)
    db.actualizar_producto(pid, {
        "archivo_nombre": archivo.filename,
        "archivo_path": str(arch_path),
    })
    return {"ok": True, "archivo": archivo.filename}


@app.post("/api/admin/productos/{pid}/imagen")
async def admin_subir_imagen(
    pid: str, imagen: UploadFile = File(...), request: Request = None):
    get_admin(request)
    ext      = Path(imagen.filename).suffix
    img_path = UPLOAD_DIR / f"img_{pid}{ext}"
    with open(img_path, "wb") as f:
        shutil.copyfileobj(imagen.file, f)
    url = f"/static/img_{pid}{ext}"
    db.actualizar_producto(pid, {"imagen_url": url})
    return {"ok": True, "url": url}


@app.post("/api/admin/blog")
async def admin_crear_blog(data: BlogPostModel, request: Request):
    get_admin(request)
    return db.crear_blog_post(data.dict())


@app.patch("/api/admin/blog/{bid}")
async def admin_actualizar_blog(bid: str, data: dict, request: Request):
    get_admin(request)
    # Actualizar campos en Sheets
    ws   = db._sheet("blog")
    rows = ws.get_all_values()
    if not rows:
        raise HTTPException(status_code=404)
    cabs = rows[0]
    for i, row in enumerate(rows[1:], start=2):
        if row and row[0] == bid:
            for campo, val in data.items():
                if campo in cabs:
                    col = cabs.index(campo) + 1
                    ws.update_cell(i, col, str(val))
            return {"ok": True}
    raise HTTPException(status_code=404)


@app.post("/api/admin/config")
async def admin_config(data: dict, request: Request):
    get_admin(request)
    for k, v in data.items():
        db.set_config(k, str(v))
    return {"ok": True}


@app.get("/api/admin/compras")
async def admin_compras(request: Request):
    get_admin(request)
    ws   = db._sheet("compras")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return []
    cabs  = rows[0]
    items = [db._fila_a_dict(cabs, r) for r in rows[1:]]
    for c in items:
        c["productos_ids"]     = c.get("productos_ids","").split("|")
        c["productos_nombres"] = c.get("productos_nombres","").split("|")
        try:
            c["total"] = float(c.get("total",0) or 0)
        except Exception:
            c["total"] = 0
    return items


# ── Recuperar contraseña (usuarios) ─────────────────────────
@app.post("/api/auth/recuperar-password")
async def recuperar_password(data: RecuperarPassModel):
    user = db.get_usuario_por_email(data.email)
    if user:
        code = str(secrets.randbelow(900000) + 100000)
        _reset_codes[data.email.lower()] = {
            "code": code, "expires": _time.time() + 900
        }
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#0ea5e9">🔑 Recuperar contraseña — PrintKey Pro</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p style="font-size:2.4rem;font-weight:bold;background:#e0f2fe;color:#0c4a6e;
             padding:20px;border-radius:10px;text-align:center;letter-spacing:10px">{code}</p>
          <p style="color:#64748b;font-size:0.88rem">⏱️ Este código expira en <strong>15 minutos</strong>.<br>
          Si no solicitaste esto, ignora este mensaje.</p>
        </div>"""
        _enviar_email(data.email, "🔑 Código de recuperación — PrintKey Pro", html)
    return {"ok": True, "mensaje": "Si el correo existe recibirás un código en tu bandeja."}


@app.post("/api/auth/reset-password")
async def reset_password(data: ResetPassModel):
    email = data.email.lower().strip()
    entry = _reset_codes.get(email)
    if not entry:
        raise HTTPException(400, "Código inválido o expirado")
    if _time.time() > entry["expires"]:
        _reset_codes.pop(email, None)
        raise HTTPException(400, "El código ha expirado. Solicita uno nuevo.")
    if entry["code"] != data.codigo.strip():
        raise HTTPException(400, "Código incorrecto")
    if len(data.nueva_password) < 6:
        raise HTTPException(400, "La contraseña debe tener al menos 6 caracteres")
    new_hash = db._hash_pass(data.nueva_password)
    ok = db.actualizar_password_por_email(email, new_hash)
    if not ok:
        raise HTTPException(404, "Usuario no encontrado")
    _reset_codes.pop(email, None)
    return {"ok": True, "mensaje": "Contraseña actualizada correctamente"}


# ── Cambio de contraseña admin con 2FA ──────────────────────
@app.post("/api/admin/cambiar-password/solicitar")
async def admin_cambiar_pass_solicitar(data: CambiarPassAdminSolicitar, request: Request):
    user = get_admin(request)
    if len(data.nueva_password) < 6:
        raise HTTPException(400, "La contraseña debe tener al menos 6 caracteres")
    code     = str(secrets.randbelow(900000) + 100000)
    email    = user["email"]
    new_hash = db._hash_pass(data.nueva_password)
    _admin_2fa[email.lower()] = {
        "code": code, "expires": _time.time() + 600, "new_hash": new_hash
    }
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#f472b6">🔐 Verificación Admin — PrintKey Pro</h2>
      <p>Se solicitó un <strong>cambio de contraseña de administrador</strong>.</p>
      <p style="font-size:2.4rem;font-weight:bold;background:#fce7f3;color:#831843;
         padding:20px;border-radius:10px;text-align:center;letter-spacing:10px">{code}</p>
      <p style="color:#64748b;font-size:0.88rem">⏱️ Código válido por <strong>10 minutos</strong>.<br>
      ⚠️ Si no fuiste tú, cambia tu contraseña de email inmediatamente.</p>
    </div>"""
    sent = _enviar_email(email, "🔐 Código 2FA — Cambio contraseña Admin", html)
    return {"ok": True, "email_enviado": sent, "email": email}


@app.post("/api/admin/cambiar-password/confirmar")
async def admin_cambiar_pass_confirmar(data: CambiarPassAdminConfirmar, request: Request):
    user  = get_admin(request)
    email = user["email"].lower()
    entry = _admin_2fa.get(email)
    if not entry:
        raise HTTPException(400, "No hay solicitud pendiente. Vuelve a iniciar el proceso.")
    if _time.time() > entry["expires"]:
        _admin_2fa.pop(email, None)
        raise HTTPException(400, "Código expirado. Solicita uno nuevo.")
    if entry["code"] != data.codigo.strip():
        raise HTTPException(400, "Código incorrecto")
    ok = db.actualizar_password_por_email(email, entry["new_hash"])
    if not ok:
        raise HTTPException(500, "Error al actualizar contraseña")
    _admin_2fa.pop(email, None)
    return {"ok": True, "mensaje": "Contraseña de admin actualizada correctamente"}


# ── Webs Sugeridas ───────────────────────────────────────────
@app.get("/api/webs")
async def listar_webs():
    return db.get_webs(solo_activas=True)


@app.post("/api/admin/webs")
async def admin_crear_web(data: WebCreateModel, request: Request):
    get_admin(request)
    return db.crear_web(data.dict())


@app.patch("/api/admin/webs/{wid}")
async def admin_actualizar_web(wid: str, request: Request):
    get_admin(request)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Body inválido")
    result = db.actualizar_web(wid, body)
    if not result:
        raise HTTPException(404, "Web no encontrada")
    return result


@app.delete("/api/admin/webs/{wid}")
async def admin_eliminar_web(wid: str, request: Request):
    get_admin(request)
    db.actualizar_web(wid, {"activo": "0"})
    return {"ok": True}


@app.delete("/api/admin/productos/{pid}")
async def admin_eliminar_producto(pid: str, request: Request):
    get_admin(request)
    ok = db.eliminar_producto(pid)
    if not ok:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"ok": True}


@app.post("/api/admin/upload-imagen-web")
async def admin_upload_imagen_web(
    request: Request,
    file: UploadFile = File(...),
    web_id: str = Form(...),
):
    get_admin(request)
    ext      = Path(file.filename).suffix or ".jpg"
    img_path = UPLOAD_DIR / f"web_{web_id}{ext}"
    with open(img_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    url = f"/static/web_{web_id}{ext}"
    db.actualizar_web(web_id, {"imagen_url": url})
    return {"ok": True, "url": url}


# ── Servir el frontend React (build) ──────────────────────────────
# Solo se activa si existe la carpeta static_frontend (producción)
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Rutas de API no deben llegar aquí, pero por si acaso:
        if full_path.startswith("api/") or full_path.startswith("static/"):
            raise HTTPException(status_code=404)
        index = FRONTEND_DIR / "index.html"
        if index.exists():
            return HTMLResponse(content=index.read_text(encoding="utf-8"))
        raise HTTPException(status_code=404)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

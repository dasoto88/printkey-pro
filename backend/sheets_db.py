"""
PrintKey Pro — Capa de base de datos sobre Google Sheets
Todas las operaciones CRUD van aquí.
"""
import gspread
from google.oauth2.service_account import Credentials
from pathlib import Path
import json, os, hashlib, uuid
from datetime import datetime

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

# Nombre del Google Spreadsheet
SHEET_NAME = os.getenv("GOOGLE_SHEET_NAME", "PrintKeyPro_DB")

# ── Hojas (pestañas) dentro del spreadsheet ──────────────────
HOJAS = {
    "productos":      "PRODUCTOS",
    "usuarios":       "USUARIOS",
    "compras":        "COMPRAS",
    "forum_posts":    "FORUM_POSTS",
    "forum_replies":  "FORUM_REPLIES",
    "blog":           "BLOG",
    "config":         "CONFIG",
    "webs_sugeridas": "WEBS_SUGERIDAS",
}

_gc   = None   # cliente gspread
_book = None   # spreadsheet abierto


def _cliente() -> gspread.Client:
    global _gc
    if _gc:
        return _gc
    creds_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
    if creds_json:
        info = json.loads(creds_json)
    else:
        creds_path = Path(__file__).parent / "google_credentials.json"
        info = json.loads(creds_path.read_text())
    creds = Credentials.from_service_account_info(info, scopes=SCOPES)
    _gc   = gspread.authorize(creds)
    return _gc


def _sheet(nombre: str) -> gspread.Worksheet:
    global _book
    gc = _cliente()
    if not _book:
        _book = gc.open(SHEET_NAME)
    try:
        return _book.worksheet(HOJAS[nombre])
    except gspread.WorksheetNotFound:
        ws = _book.add_worksheet(title=HOJAS[nombre], rows=1000, cols=26)
        _inicializar_hoja(ws, nombre)
        return ws


def _inicializar_hoja(ws: gspread.Worksheet, nombre: str):
    """Agrega cabeceras si la hoja está vacía."""
    cabeceras = {
        "productos": [
            "id","nombre","descripcion_corta","descripcion_larga",
            "precio","precio_oferta","imagen_url","archivo_nombre",
            "archivo_path","categoria","activo","es_oferta",
            "es_bundle","compatibilidad","fecha_creacion","descargas"
        ],
        "usuarios": [
            "id","email","nombre","apellido","password_hash",
            "fecha_registro","rol","activo","telefono"
        ],
        "compras": [
            "id","usuario_id","usuario_email","productos_ids",
            "productos_nombres","total","estado","mp_payment_id",
            "mp_preference_id","fecha_creacion","fecha_pago"
        ],
        "forum_posts": [
            "id","usuario_id","usuario_nombre","titulo","contenido",
            "categoria","fecha","vistas","fijado","resuelto","activo"
        ],
        "forum_replies": [
            "id","post_id","usuario_id","usuario_nombre",
            "contenido","fecha","es_solucion","likes"
        ],
        "blog": [
            "id","titulo","resumen","contenido","imagen_url",
            "autor","fecha_publicacion","activo","semana","categoria"
        ],
        "config": ["clave","valor"],
        "webs_sugeridas": ["id","titulo","url","descripcion","imagen_url","categoria","activo","orden","fecha_creacion"],
    }
    if nombre in cabeceras:
        ws.append_row(cabeceras[nombre])


def _uid() -> str:
    return str(uuid.uuid4())[:8].upper()


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _fila_a_dict(cabeceras: list, fila: list) -> dict:
    d = {}
    for i, cab in enumerate(cabeceras):
        d[cab] = fila[i] if i < len(fila) else ""
    return d


# ══════════════════════════════════════════════════════════════
#  PRODUCTOS
# ══════════════════════════════════════════════════════════════

def get_productos(solo_activos: bool = True) -> list:
    ws   = _sheet("productos")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return []
    cabs  = rows[0]
    items = [_fila_a_dict(cabs, r) for r in rows[1:]]
    if solo_activos:
        items = [p for p in items if str(p.get("activo","1")) == "1"]
    # Convertir numéricos
    for p in items:
        p["precio"]        = float(p.get("precio", 0) or 0)
        p["precio_oferta"] = float(p.get("precio_oferta", 0) or 0)
        p["descargas"]     = int(p.get("descargas", 0) or 0)
        p["es_oferta"]     = str(p.get("es_oferta","0")) == "1"
        p["es_bundle"]     = str(p.get("es_bundle","0")) == "1"
    return items


def get_producto(pid: str) -> dict | None:
    prods = get_productos(solo_activos=False)
    return next((p for p in prods if p["id"] == pid), None)


def crear_producto(data: dict) -> dict:
    ws  = _sheet("productos")
    pid = _uid()
    fila = [
        pid,
        data.get("nombre",""),
        data.get("descripcion_corta",""),
        data.get("descripcion_larga",""),
        str(data.get("precio",0)),
        str(data.get("precio_oferta",0)),
        data.get("imagen_url",""),
        data.get("archivo_nombre",""),
        data.get("archivo_path",""),
        data.get("categoria","reset"),
        "1",                            # activo
        "1" if data.get("es_oferta") else "0",
        "1" if data.get("es_bundle") else "0",
        data.get("compatibilidad",""),
        _now(),
        "0",
    ]
    ws.append_row(fila)
    return get_producto(pid)


def actualizar_producto(pid: str, data: dict) -> dict | None:
    ws   = _sheet("productos")
    rows = ws.get_all_values()
    if not rows:
        return None
    cabs = rows[0]
    for i, row in enumerate(rows[1:], start=2):
        if row and row[0] == pid:
            for campo, val in data.items():
                if campo in cabs:
                    col = cabs.index(campo) + 1
                    ws.update_cell(i, col, str(val))
            return get_producto(pid)
    return None


def incrementar_descargas(pid: str):
    p = get_producto(pid)
    if p:
        nuevas = int(p.get("descargas", 0)) + 1
        actualizar_producto(pid, {"descargas": str(nuevas)})


# ══════════════════════════════════════════════════════════════
#  USUARIOS
# ══════════════════════════════════════════════════════════════

def _hash_pass(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_usuario_por_email(email: str) -> dict | None:
    ws   = _sheet("usuarios")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return None
    cabs = rows[0]
    for row in rows[1:]:
        d = _fila_a_dict(cabs, row)
        if d.get("email","").lower() == email.lower():
            return d
    return None


def get_usuario(uid: str) -> dict | None:
    ws   = _sheet("usuarios")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return None
    cabs = rows[0]
    for row in rows[1:]:
        d = _fila_a_dict(cabs, row)
        if d.get("id") == uid:
            return d
    return None


def crear_usuario(email: str, nombre: str, apellido: str,
                  password: str, telefono: str = "") -> dict:
    if get_usuario_por_email(email):
        raise ValueError("El email ya está registrado")
    ws  = _sheet("usuarios")
    uid = _uid()
    ws.append_row([
        uid, email.lower(), nombre, apellido,
        _hash_pass(password), _now(), "user", "1", telefono
    ])
    return get_usuario(uid)


def verificar_credenciales(email: str, password: str) -> dict | None:
    u = get_usuario_por_email(email)
    if not u:
        return None
    if u.get("password_hash") != _hash_pass(password):
        return None
    if str(u.get("activo","1")) != "1":
        return None
    return u


# ══════════════════════════════════════════════════════════════
#  COMPRAS
# ══════════════════════════════════════════════════════════════

def crear_compra(usuario_id: str, usuario_email: str,
                 productos_ids: list, productos_nombres: list,
                 total: float, mp_preference_id: str) -> dict:
    ws  = _sheet("compras")
    cid = _uid()
    ws.append_row([
        cid,
        usuario_id,
        usuario_email,
        "|".join(productos_ids),
        "|".join(productos_nombres),
        str(total),
        "pendiente",
        "",                  # mp_payment_id (se llena al confirmar)
        mp_preference_id,
        _now(),
        "",                  # fecha_pago
    ])
    return get_compra(cid)


def get_compra(cid: str) -> dict | None:
    ws   = _sheet("compras")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return None
    cabs = rows[0]
    for row in rows[1:]:
        d = _fila_a_dict(cabs, row)
        if d.get("id") == cid:
            d["productos_ids"]    = d.get("productos_ids","").split("|")
            d["productos_nombres"] = d.get("productos_nombres","").split("|")
            d["total"]            = float(d.get("total", 0) or 0)
            return d
    return None


def get_compra_por_preference(pref_id: str) -> dict | None:
    ws   = _sheet("compras")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return None
    cabs = rows[0]
    for row in rows[1:]:
        d = _fila_a_dict(cabs, row)
        if d.get("mp_preference_id") == pref_id:
            d["productos_ids"]     = d.get("productos_ids","").split("|")
            d["productos_nombres"] = d.get("productos_nombres","").split("|")
            d["total"]             = float(d.get("total", 0) or 0)
            return d
    return None


def confirmar_compra(cid: str, mp_payment_id: str) -> bool:
    ws   = _sheet("compras")
    rows = ws.get_all_values()
    if not rows:
        return False
    cabs = rows[0]
    for i, row in enumerate(rows[1:], start=2):
        if row and row[0] == cid:
            col_estado  = cabs.index("estado") + 1
            col_pay_id  = cabs.index("mp_payment_id") + 1
            col_fecha   = cabs.index("fecha_pago") + 1
            ws.update_cell(i, col_estado, "pagado")
            ws.update_cell(i, col_pay_id, mp_payment_id)
            ws.update_cell(i, col_fecha, _now())
            return True
    return False


def get_compras_usuario(usuario_id: str) -> list:
    ws   = _sheet("compras")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return []
    cabs  = rows[0]
    items = []
    for row in rows[1:]:
        d = _fila_a_dict(cabs, row)
        if d.get("usuario_id") == usuario_id:
            d["productos_ids"]     = d.get("productos_ids","").split("|")
            d["productos_nombres"] = d.get("productos_nombres","").split("|")
            d["total"]             = float(d.get("total", 0) or 0)
            items.append(d)
    return items


def usuario_compro_producto(usuario_id: str, producto_id: str) -> dict | None:
    """Devuelve la compra confirmada si el usuario compró ese producto."""
    compras = get_compras_usuario(usuario_id)
    for c in compras:
        if (c.get("estado") == "pagado"
                and producto_id in c.get("productos_ids", [])):
            return c
    return None


# ══════════════════════════════════════════════════════════════
#  FORUM
# ══════════════════════════════════════════════════════════════

def get_forum_posts(categoria: str = None) -> list:
    ws   = _sheet("forum_posts")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return []
    cabs  = rows[0]
    items = [_fila_a_dict(cabs, r) for r in rows[1:]]
    items = [p for p in items if str(p.get("activo","1")) == "1"]
    if categoria:
        items = [p for p in items if p.get("categoria") == categoria]
    for p in items:
        p["vistas"] = int(p.get("vistas", 0) or 0)
        p["fijado"] = str(p.get("fijado","0")) == "1"
        p["resuelto"] = str(p.get("resuelto","0")) == "1"
    items.sort(key=lambda x: (not x["fijado"], x["fecha"]), reverse=False)
    return items


def get_forum_post(post_id: str) -> dict | None:
    ws   = _sheet("forum_posts")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return None
    cabs = rows[0]
    for i, row in enumerate(rows[1:], start=2):
        d = _fila_a_dict(cabs, row)
        if d.get("id") == post_id:
            # Incrementar vistas
            col_v = cabs.index("vistas") + 1
            nuevas = int(d.get("vistas", 0) or 0) + 1
            ws.update_cell(i, col_v, str(nuevas))
            d["vistas"] = nuevas
            d["respuestas"] = get_forum_replies(post_id)
            return d
    return None


def crear_forum_post(usuario_id: str, usuario_nombre: str,
                     titulo: str, contenido: str,
                     categoria: str = "general") -> dict:
    ws  = _sheet("forum_posts")
    pid = _uid()
    ws.append_row([
        pid, usuario_id, usuario_nombre, titulo, contenido,
        categoria, _now(), "0", "0", "0", "1"
    ])
    return {"id": pid, "titulo": titulo}


def get_forum_replies(post_id: str) -> list:
    ws   = _sheet("forum_replies")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return []
    cabs  = rows[0]
    items = [_fila_a_dict(cabs, r) for r in rows[1:]]
    return [r for r in items if r.get("post_id") == post_id]


def crear_forum_reply(post_id: str, usuario_id: str,
                      usuario_nombre: str, contenido: str) -> dict:
    ws  = _sheet("forum_replies")
    rid = _uid()
    ws.append_row([
        rid, post_id, usuario_id, usuario_nombre,
        contenido, _now(), "0", "0"
    ])
    return {"id": rid}


def marcar_solucion(reply_id: str, post_id: str):
    ws   = _sheet("forum_replies")
    rows = ws.get_all_values()
    if not rows:
        return
    cabs = rows[0]
    for i, row in enumerate(rows[1:], start=2):
        if row and row[0] == reply_id:
            col = cabs.index("es_solucion") + 1
            ws.update_cell(i, col, "1")
    # Marcar el post como resuelto
    ws2   = _sheet("forum_posts")
    rows2 = ws2.get_all_values()
    if not rows2:
        return
    cabs2 = rows2[0]
    for i, row in enumerate(rows2[1:], start=2):
        if row and row[0] == post_id:
            col = cabs2.index("resuelto") + 1
            ws2.update_cell(i, col, "1")


# ══════════════════════════════════════════════════════════════
#  BLOG
# ══════════════════════════════════════════════════════════════

def get_blog_posts(solo_activos: bool = True) -> list:
    ws   = _sheet("blog")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return []
    cabs  = rows[0]
    items = [_fila_a_dict(cabs, r) for r in rows[1:]]
    if solo_activos:
        items = [p for p in items if str(p.get("activo","1")) == "1"]
    items.sort(key=lambda x: x.get("fecha_publicacion",""), reverse=True)
    return items


def get_blog_post(bid: str) -> dict | None:
    posts = get_blog_posts(solo_activos=False)
    return next((p for p in posts if p["id"] == bid), None)


def crear_blog_post(data: dict) -> dict:
    ws  = _sheet("blog")
    bid = _uid()
    ws.append_row([
        bid,
        data.get("titulo",""),
        data.get("resumen",""),
        data.get("contenido",""),
        data.get("imagen_url",""),
        data.get("autor","Admin"),
        _now(),
        "1",
        data.get("semana",""),
        data.get("categoria","tecnologia"),
    ])
    return get_blog_post(bid)


# ══════════════════════════════════════════════════════════════
#  CONFIG
# ══════════════════════════════════════════════════════════════

def get_config(clave: str, default: str = "") -> str:
    ws   = _sheet("config")
    rows = ws.get_all_values()
    for row in rows:
        if row and row[0] == clave:
            return row[1] if len(row) > 1 else default
    return default


def set_config(clave: str, valor: str):
    ws   = _sheet("config")
    rows = ws.get_all_values()
    for i, row in enumerate(rows, start=1):
        if row and row[0] == clave:
            ws.update_cell(i, 2, valor)
            return
    ws.append_row([clave, valor])


# ══════════════════════════════════════════════════════════════
#  WEBS SUGERIDAS
# ══════════════════════════════════════════════════════════════

def get_webs(solo_activas: bool = True) -> list:
    ws   = _sheet("webs_sugeridas")
    rows = ws.get_all_values()
    if len(rows) < 2:
        return []
    cabs  = rows[0]
    items = [_fila_a_dict(cabs, r) for r in rows[1:]]
    if solo_activas:
        items = [w for w in items if str(w.get("activo","1")) == "1"]
    try:
        items.sort(key=lambda w: int(w.get("orden",0) or 0))
    except Exception:
        pass
    return items


def crear_web(data: dict) -> dict:
    ws  = _sheet("webs_sugeridas")
    wid = _uid()
    ws.append_row([
        wid,
        data.get("titulo",""),
        data.get("url",""),
        data.get("descripcion",""),
        data.get("imagen_url",""),
        data.get("categoria",""),
        "1",
        str(data.get("orden", 0)),
        _now(),
    ])
    return next((w for w in get_webs(solo_activas=False) if w["id"] == wid), {})


def actualizar_web(wid: str, data: dict) -> dict | None:
    ws   = _sheet("webs_sugeridas")
    rows = ws.get_all_values()
    if not rows:
        return None
    cabs = rows[0]
    for i, row in enumerate(rows[1:], start=2):
        if row and row[0] == wid:
            for campo, val in data.items():
                if campo in cabs:
                    col = cabs.index(campo) + 1
                    ws.update_cell(i, col, str(val))
            break
    return next((w for w in get_webs(solo_activas=False) if w["id"] == wid), None)


def actualizar_password_por_email(email: str, new_hash: str) -> bool:
    ws   = _sheet("usuarios")
    rows = ws.get_all_values()
    if not rows:
        return False
    cabs  = rows[0]
    email = email.lower().strip()
    for i, row in enumerate(rows[1:], start=2):
        d = _fila_a_dict(cabs, row)
        if d.get("email","").lower() == email:
            col = cabs.index("password_hash") + 1
            ws.update_cell(i, col, new_hash)
            return True
    return False

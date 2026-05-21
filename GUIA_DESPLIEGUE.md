# PrintKey Pro — Guía de Despliegue Paso a Paso

## Arquitectura

```
PrintKey Pro
├── backend/          ← FastAPI (Python)
│   ├── main.py       ← API + sirve el frontend en producción
│   ├── sheets_db.py  ← Base de datos Google Sheets
│   ├── requirements.txt
│   └── uploads/      ← Imágenes y archivos de productos (se crea automático)
├── frontend/         ← React + Vite
│   └── src/          ← Código fuente
└── render.yaml       ← Configuración de despliegue
```

---

## PASO 1 — Google Sheets (Base de Datos)

### 1.1 Crear proyecto en Google Cloud
1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto: `PrintKeyPro`
3. Activa las APIs:
   - **Google Sheets API**
   - **Google Drive API**
   (Busca cada una en "APIs y servicios" → "Biblioteca")

### 1.2 Crear cuenta de servicio
1. En tu proyecto → **APIs y servicios** → **Credenciales**
2. Clic en **"+ CREAR CREDENCIALES"** → **Cuenta de servicio**
3. Nombre: `printkey-sheets`
4. Haz clic en la cuenta creada → pestaña **Claves**
5. **Agregar clave** → **Crear nueva clave** → **JSON**
6. Se descarga un archivo JSON (ej: `printkey-sheets-xxxx.json`)
   ⚠️ GUARDA ESTE ARCHIVO — es tu contraseña de acceso

### 1.3 Crear la hoja de Google Sheets
1. Ve a https://sheets.google.com
2. Crea una hoja nueva llamada exactamente: **`PrintKeyPro_DB`**
3. Copia el email de la cuenta de servicio (lo ves en el JSON como `client_email`)
   Ejemplo: `printkey-sheets@printkeypro.iam.gserviceaccount.com`
4. En la hoja de Sheets → **Compartir** → pega ese email → rol: **Editor**
5. La primera vez que el backend arranque creará todas las pestañas automáticamente

---

## PASO 2 — MercadoPago

### 2.1 Obtener credenciales
1. Ve a https://www.mercadopago.com/developers/
2. Inicia sesión con tu cuenta de MercadoPago
3. Ve a **Credenciales** → **Credenciales de prueba** (para testear)
4. Copia el **Access Token** de TEST: `APP_USR-xxxx...`
5. Para producción real: usa las **Credenciales de producción**

---

## PASO 3 — Despliegue en Render.com (Gratis)

### 3.1 Preparar el repositorio
1. Crea una cuenta en https://github.com si no tienes
2. Crea un repositorio nuevo: `printkey-pro`
3. Sube todos los archivos del proyecto:
   ```bash
   git init
   git add .
   git commit -m "PrintKey Pro inicial"
   git remote add origin https://github.com/TU_USUARIO/printkey-pro.git
   git push -u origin main
   ```

### 3.2 Desplegar en Render
1. Ve a https://render.com y crea cuenta (gratis)
2. **New +** → **Web Service**
3. Conecta tu repositorio de GitHub
4. Configuración:
   - **Name:** `printkey-pro`
   - **Region:** Oregon (US West) o la más cercana
   - **Branch:** `main`
   - **Build Command:**
     ```
     pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
     ```
   - **Start Command:**
     ```
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan:** Free

### 3.3 Configurar variables de entorno en Render
En la sección **Environment** del servicio, agrega estas variables:

| Variable | Valor |
|----------|-------|
| `SECRET_KEY` | (genera una cadena larga aleatoria, ej: `openssl rand -hex 32`) |
| `MP_ACCESS_TOKEN` | Tu access token de MercadoPago |
| `FRONTEND_URL` | `https://printkey-pro.onrender.com` (la URL que te da Render) |
| `BACKEND_URL` | `https://printkey-pro.onrender.com` |
| `GOOGLE_SHEET_NAME` | `PrintKeyPro_DB` |
| `GOOGLE_CREDENTIALS_JSON` | *(ver abajo)* |

**Para `GOOGLE_CREDENTIALS_JSON`:**
1. Abre el archivo JSON de la cuenta de servicio con un editor de texto
2. Copia TODO el contenido
3. En Render, pégalo como valor de la variable (en una sola línea si es posible)
4. Si tiene saltos de línea, Render los maneja correctamente

### 3.4 Primer despliegue
1. Haz clic en **Create Web Service**
2. Espera ~5 minutos mientras Render construye e instala todo
3. Cuando diga **Live**, tu sitio estará en: `https://printkey-pro.onrender.com`

---

## PASO 4 — Configuración inicial

### 4.1 Crear el admin
1. Ve a tu sitio → `/registro`
2. Crea una cuenta con tu email
3. Entra a Google Sheets → pestaña `USUARIOS`
4. Busca tu usuario → cambia la columna `rol` de `user` a `admin`
5. Ahora tienes acceso al panel de admin en `/admin`

### 4.2 Subir tu primer producto
1. Ve a `/admin` → pestaña **Nuevo Producto**
2. Completa los datos (nombre, precio, descripción, etc.)
3. Guarda el producto
4. Ve a pestaña **Productos**
5. Usa el botón 🖼️ para subir la imagen del producto
6. Usa el botón 📄 para subir el archivo .zip/.exe del reset

---

## PASO 5 — Dominio personalizado (Opcional, más adelante)

1. En Render → tu servicio → pestaña **Custom Domains**
2. Agrega tu dominio (ej: `printkeypro.com`)
3. Render te da instrucciones para configurar los DNS
4. Actualiza la variable `FRONTEND_URL` y `BACKEND_URL` con el nuevo dominio

---

## Desarrollo Local

Para probar en tu PC antes de subir:

```bash
# 1. Instalar dependencias del backend
cd C:\Users\pc\Desktop\printkey-pro
pip install -r backend/requirements.txt

# 2. Crear el archivo .env
copy .env.example .env
# Edita .env con tus credenciales reales

# 3. Iniciar el backend
cd backend
uvicorn main:app --reload --port 8000

# 4. En otra terminal — iniciar el frontend
cd C:\Users\pc\Desktop\printkey-pro\frontend
npm install
npm run dev
# → Abre http://localhost:5173
```

---

## Notas Importantes

- **Render free tier:** El servicio "duerme" después de 15 min de inactividad.
  La primera carga puede tardar ~30 segundos.
  
- **Archivos subidos:** En Render free, los archivos se pierden en cada redeploy
  (filesystem efímero). Para una solución permanente, usa Cloudinary (imágenes)
  o Google Drive (archivos de software) en el futuro.

- **MercadoPago Sandbox:** Para probar pagos sin dinero real, usa el Access Token
  de TEST y las tarjetas de prueba de MercadoPago:
  - Tarjeta: `5031 7557 3453 0604`
  - Vencimiento: cualquier fecha futura
  - CVV: `123`
  - Nombre: `APRO` (para aprobar)

---

## URLs de referencia

| Recurso | URL |
|---------|-----|
| Google Cloud Console | https://console.cloud.google.com |
| Google Sheets | https://sheets.google.com |
| MercadoPago Developers | https://www.mercadopago.com/developers |
| Render.com | https://render.com |
| Documentación API | `https://tu-sitio.onrender.com/api/docs` |

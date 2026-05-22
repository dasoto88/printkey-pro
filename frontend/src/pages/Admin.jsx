import { useEffect, useState, useRef } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import {
  FiPackage, FiShoppingBag, FiUsers, FiDollarSign,
  FiPlus, FiEdit2, FiUpload, FiImage, FiFile,
  FiToggleLeft, FiToggleRight, FiBook, FiSettings,
  FiDownload, FiCheck, FiGlobe, FiShield, FiKey, FiTrash2, FiLink,
  FiEdit3, FiSave, FiX
} from 'react-icons/fi'

const TABS = ['Estadísticas', 'Productos', 'Nuevo Producto', 'Blog', 'Compras', 'Webs Sugeridas', 'Seguridad', 'Configuración']

export default function Admin() {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ paddingTop:88 }}>
      <div className="container section">
        <div style={{ marginBottom:36 }}>
          <p style={{ color:'#f472b6', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>ADMINISTRACIÓN</p>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800 }}>Panel de Admin</h1>
        </div>

        {/* Tab nav */}
        <div style={{ display:'flex', gap:6, marginBottom:32, overflowX:'auto', paddingBottom:4, borderBottom:'1px solid rgba(56,189,248,0.1)' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              style={{ padding:'9px 18px', borderRadius:'8px 8px 0 0', fontSize:'0.85rem', fontWeight:600, cursor:'pointer', border:'none', whiteSpace:'nowrap', transition:'all 0.2s',
                background: tab===i ? 'rgba(244,114,182,0.12)' : 'transparent',
                color: tab===i ? '#f472b6' : '#64748b',
                borderBottom: tab===i ? '2px solid #f472b6' : '2px solid transparent',
              }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && <TabStats />}
        {tab === 1 && <TabProductos />}
        {tab === 2 && <TabNuevoProducto />}
        {tab === 3 && <TabBlog />}
        {tab === 4 && <TabCompras />}
        {tab === 5 && <TabWebsSugeridas />}
        {tab === 6 && <TabSeguridad />}
        {tab === 7 && <TabConfig />}
      </div>
    </div>
  )
}

/* ── Statistics ────────────────────────────────────────── */
function TabStats() {
  const [stats, setStats] = useState(null)
  useEffect(() => { api.get('/admin/stats').then(r => setStats(r.data)) }, [])
  if (!stats) return <div className="page-loader"><div className="spinner" /></div>

  const cards = [
    { icon:<FiDollarSign size={22} />, color:'#4ade80', label:'Ventas totales', value:`$${Number(stats.ventas_total||0).toFixed(2)}` },
    { icon:<FiShoppingBag size={22} />, color:'#38bdf8', label:'Compras confirmadas', value:stats.compras_pagadas||0 },
    { icon:<FiUsers size={22} />, color:'#a78bfa', label:'Usuarios registrados', value:stats.usuarios_total||0 },
    { icon:<FiPackage size={22} />, color:'#fbbf24', label:'Productos activos', value:stats.productos_activos||0 },
  ]

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:20 }}>
      {cards.map(c => (
        <div key={c.label} className="glass-card" style={{ padding:24 }}>
          <div style={{ width:44, height:44, background:`${c.color}15`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:c.color, marginBottom:16 }}>
            {c.icon}
          </div>
          <div style={{ fontSize:'1.8rem', fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
          <div style={{ color:'#64748b', fontSize:'0.82rem', marginTop:6 }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Products list ─────────────────────────────────────── */
function TabProductos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null) // producto being edited

  const load = () => api.get('/admin/productos').then(r => setProductos(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggleActivo = async (p) => {
    try {
      await api.patch(`/admin/productos/${p.id}`, { activo: !p.activo })
      toast.success(p.activo ? 'Producto desactivado' : 'Producto activado')
      load()
    } catch { toast.error('Error') }
  }

  const toggleOferta = async (p) => {
    try {
      await api.patch(`/admin/productos/${p.id}`, { es_oferta: !p.es_oferta })
      toast.success('Actualizado')
      load()
    } catch { toast.error('Error') }
  }

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/admin/productos/${p.id}`)
      toast.success('Producto eliminado')
      load()
    } catch { toast.error('Error al eliminar') }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {productos.length === 0 && (
        <div style={{ textAlign:'center', padding:48, color:'#475569' }}>
          <FiPackage size={40} style={{ marginBottom:12, opacity:0.3 }} />
          <p>Sin productos. Usa "Nuevo Producto" para agregar.</p>
        </div>
      )}
      {productos.map(p => <ProductoRow key={p.id} p={p} onToggleActivo={toggleActivo} onToggleOferta={toggleOferta} onEdit={setEditing} onSaved={load} onEliminar={eliminar} />)}
    </div>
  )
}

function ProductoRow({ p, onToggleActivo, onToggleOferta, onEdit, onSaved, onEliminar }) {
  const [editPrice, setEditPrice] = useState(false)
  const [precio, setPrecio]       = useState(p.precio)
  const [oferta, setOferta]       = useState(p.precio_oferta || '')
  const [editOpen, setEditOpen]   = useState(false)
  const [editForm, setEditForm]   = useState({
    nombre: p.nombre,
    descripcion_corta: p.descripcion_corta || '',
    descripcion_larga: p.descripcion_larga || '',
    precio: p.precio,
    precio_oferta: p.precio_oferta || '',
    categoria: p.categoria || '',
    compatibilidad: p.compatibilidad || '',
  })
  const [saving, setSaving] = useState(false)

  const savePrice = async () => {
    try {
      await api.patch(`/admin/productos/${p.id}`, { precio, precio_oferta: oferta || null })
      toast.success('Precio actualizado')
      onSaved()
      setEditPrice(false)
    } catch { toast.error('Error') }
  }

  const saveEdit = async () => {
    setSaving(true)
    try {
      await api.patch(`/admin/productos/${p.id}`, {
        ...editForm,
        precio: Number(editForm.precio),
        precio_oferta: editForm.precio_oferta ? Number(editForm.precio_oferta) : null,
      })
      toast.success('Producto actualizado')
      setEditOpen(false)
      onSaved()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        {/* Image thumb */}
        <div style={{ width:52, height:52, background:'#1e293b', borderRadius:8, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {p.imagen_url ? <img src={p.imagen_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <FiPackage size={18} color="#334155" />}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontWeight:700, fontSize:'0.92rem' }}>{p.nombre}</span>
            {!p.activo && <span className="badge badge-red">Inactivo</span>}
            {p.es_oferta && <span className="badge badge-orange">Oferta</span>}
            {p.es_bundle && <span className="badge badge-purple">Bundle</span>}
          </div>
          <span style={{ color:'#475569', fontSize:'0.78rem' }}>{p.categoria || '—'} · {p.descargas||0} descargas</span>
        </div>

        {/* Price */}
        <div style={{ minWidth:160 }}>
          {editPrice ? (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <input className="input" style={{ padding:'6px 10px', fontSize:'0.82rem' }} placeholder="Precio" value={precio} onChange={e=>setPrecio(e.target.value)} />
              <input className="input" style={{ padding:'6px 10px', fontSize:'0.82rem' }} placeholder="Precio oferta (opcional)" value={oferta} onChange={e=>setOferta(e.target.value)} />
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={savePrice} className="btn btn-primary btn-sm">Guardar</button>
                <button onClick={() => setEditPrice(false)} className="btn btn-ghost btn-sm">X</button>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:700, color:'#38bdf8' }}>${Number(p.precio||0).toFixed(2)}</span>
              {p.precio_oferta && <span style={{ color:'#4ade80', fontSize:'0.8rem' }}>${Number(p.precio_oferta).toFixed(2)}</span>}
              <button onClick={() => setEditPrice(true)} className="btn btn-ghost btn-sm" style={{ padding:'4px 8px' }}><FiEdit2 size={12} /></button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={() => onToggleOferta(p)} className="btn btn-ghost btn-sm" title={p.es_oferta ? 'Quitar oferta' : 'Marcar como oferta'}>
            <FiDollarSign size={13} style={{ color: p.es_oferta ? '#fb923c' : '#475569' }} />
          </button>
          <button onClick={() => onToggleActivo(p)} className="btn btn-ghost btn-sm">
            {p.activo ? <FiToggleRight size={18} color="#4ade80" /> : <FiToggleLeft size={18} color="#475569" />}
          </button>
          <UploadFileBtn productoId={p.id} tipo="imagen" />
          <UploadFileBtn productoId={p.id} tipo="archivo" />
          <button onClick={() => setEditOpen(prev => !prev)} className="btn btn-ghost btn-sm" title="Editar producto">
            <FiEdit3 size={13} color="#38bdf8" />
          </button>
          <button onClick={() => onEliminar(p)} className="btn btn-ghost btn-sm" title="Eliminar producto">
            <FiTrash2 size={13} color="#f87171" />
          </button>
        </div>
      </div>

      {editOpen && (
        <div style={{ borderTop:'1px solid rgba(56,189,248,0.1)', padding:'16px 20px', background:'rgba(0,0,0,0.2)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="input" value={editForm.nombre} onChange={e=>setEditForm(p=>({...p,nombre:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="select" value={editForm.categoria} onChange={e=>setEditForm(p=>({...p,categoria:e.target.value}))}>
                {['Epson','Canon','Software','Bundle','Servicio'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom:12 }}>
            <label className="form-label">Descripción corta</label>
            <input className="input" value={editForm.descripcion_corta} onChange={e=>setEditForm(p=>({...p,descripcion_corta:e.target.value}))} />
          </div>
          <div className="form-group" style={{ marginBottom:12 }}>
            <label className="form-label">Descripción larga</label>
            <textarea className="textarea" rows={4} value={editForm.descripcion_larga} onChange={e=>setEditForm(p=>({...p,descripcion_larga:e.target.value}))} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
            <div className="form-group">
              <label className="form-label">Precio</label>
              <input type="number" className="input" value={editForm.precio} onChange={e=>setEditForm(p=>({...p,precio:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Precio oferta</label>
              <input type="number" className="input" value={editForm.precio_oferta} onChange={e=>setEditForm(p=>({...p,precio_oferta:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Compatibilidad</label>
              <input className="input" value={editForm.compatibilidad} onChange={e=>setEditForm(p=>({...p,compatibilidad:e.target.value}))} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={saveEdit} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Guardando...' : <><FiSave size={13}/> Guardar</>}
            </button>
            <button onClick={()=>setEditOpen(false)} className="btn btn-ghost btn-sm">
              <FiX size={13}/> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function UploadFileBtn({ productoId, tipo }) {
  const ref     = useRef()
  const [uping, setUping] = useState(false)

  const handle = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUping(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('producto_id', productoId)
    try {
      await api.post(`/admin/upload-${tipo}`, fd)
      toast.success(`${tipo === 'imagen' ? 'Imagen' : 'Archivo'} subido`)
    } catch { toast.error('Error al subir') }
    finally { setUping(false); e.target.value = '' }
  }

  return (
    <>
      <input ref={ref} type="file" style={{ display:'none' }} accept={tipo==='imagen' ? 'image/*' : '*'} onChange={handle} />
      <button onClick={() => ref.current.click()} disabled={uping} className="btn btn-ghost btn-sm" title={tipo==='imagen' ? 'Subir imagen' : 'Subir archivo'}>
        {tipo === 'imagen' ? <FiImage size={13} /> : <FiFile size={13} />}
      </button>
    </>
  )
}

/* ── New product form ──────────────────────────────────── */
function TabNuevoProducto() {
  const empty = { nombre:'', descripcion_corta:'', descripcion_larga:'', precio:'', precio_oferta:'', categoria:'Epson', compatibilidad:'', es_oferta:false, es_bundle:false }
  const [form, setForm]     = useState(empty)
  const [sending, setSending] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const tog = k => () => setForm(p => ({ ...p, [k]: !p[k] }))

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/admin/productos', { ...form, precio: Number(form.precio), precio_oferta: form.precio_oferta ? Number(form.precio_oferta) : null })
      toast.success('Producto creado')
      setForm(empty)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear')
    } finally { setSending(false) }
  }

  return (
    <div style={{ maxWidth:640 }}>
      <div className="glass-card" style={{ padding:28 }}>
        <h2 style={{ fontWeight:700, marginBottom:24 }}>Crear nuevo producto</h2>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label">Nombre del producto *</label>
            <input required className="input" placeholder="Ej: Reset Epson L3250" value={form.nombre} onChange={set('nombre')} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="select" value={form.categoria} onChange={set('categoria')}>
                {['Epson','Canon','Software','Bundle','Servicio'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Compatibilidad</label>
              <input className="input" placeholder="L3250, L4260, ..." value={form.compatibilidad} onChange={set('compatibilidad')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción corta</label>
            <input className="input" placeholder="Una línea descriptiva" value={form.descripcion_corta} onChange={set('descripcion_corta')} />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción larga</label>
            <textarea className="textarea" rows={5} placeholder="Instrucciones, características, requisitos..." value={form.descripcion_larga} onChange={set('descripcion_larga')} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Precio *</label>
              <input required type="number" step="0.01" min="0" className="input" placeholder="9.99" value={form.precio} onChange={set('precio')} />
            </div>
            <div className="form-group">
              <label className="form-label">Precio oferta (opcional)</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="7.99" value={form.precio_oferta} onChange={set('precio_oferta')} />
            </div>
          </div>

          <div style={{ display:'flex', gap:16 }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:'0.88rem', color:'#94a3b8' }}>
              <input type="checkbox" checked={form.es_oferta} onChange={tog('es_oferta')} style={{ accentColor:'#fb923c', width:16, height:16 }} />
              Marcar como oferta
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:'0.88rem', color:'#94a3b8' }}>
              <input type="checkbox" checked={form.es_bundle} onChange={tog('es_bundle')} style={{ accentColor:'#a78bfa', width:16, height:16 }} />
              Es paquete bundle
            </label>
          </div>

          <button type="submit" disabled={sending} className="btn btn-primary" style={{ alignSelf:'flex-start' }}>
            {sending ? 'Guardando...' : <><FiPlus size={15} /> Crear Producto</>}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding:20, marginTop:16 }}>
        <p style={{ color:'#64748b', fontSize:'0.82rem', lineHeight:1.7 }}>
          <strong style={{ color:'#94a3b8' }}>Nota:</strong> Después de crear el producto, usa los botones
          <FiImage size={12} style={{ verticalAlign:'middle', margin:'0 4px' }} /> y
          <FiFile size={12} style={{ verticalAlign:'middle', margin:'0 4px' }} /> en la lista de Productos para subir la imagen y el archivo descargable.
        </p>
      </div>
    </div>
  )
}

/* ── Blog ──────────────────────────────────────────────── */
function TabBlog() {
  const empty = { titulo:'', resumen:'', contenido:'', autor:'' }
  const [form, setForm]     = useState(empty)
  const [sending, setSending] = useState(false)
  const set = k => e => setForm(p => ({...p, [k]: e.target.value}))

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/admin/blog', form)
      toast.success('Artículo publicado')
      setForm(empty)
    } catch { toast.error('Error') }
    finally { setSending(false) }
  }

  return (
    <div style={{ maxWidth:640 }}>
      <div className="glass-card" style={{ padding:28 }}>
        <h2 style={{ fontWeight:700, marginBottom:24 }}>Publicar artículo de blog</h2>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input required className="input" placeholder="Ej: Cómo mantener tu impresora Epson" value={form.titulo} onChange={set('titulo')} />
          </div>
          <div className="form-group">
            <label className="form-label">Autor</label>
            <input className="input" placeholder="PrintKey Pro" value={form.autor} onChange={set('autor')} />
          </div>
          <div className="form-group">
            <label className="form-label">Resumen (se muestra en la lista)</label>
            <textarea className="textarea" rows={3} placeholder="Breve descripción del artículo..." value={form.resumen} onChange={set('resumen')} />
          </div>
          <div className="form-group">
            <label className="form-label">Contenido completo *</label>
            <textarea required className="textarea" rows={10} placeholder="Escribe el artículo aquí..." value={form.contenido} onChange={set('contenido')} />
          </div>
          <button type="submit" disabled={sending} className="btn btn-primary" style={{ alignSelf:'flex-start' }}>
            {sending ? 'Publicando...' : <><FiBook size={14} /> Publicar</>}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Compras ───────────────────────────────────────────── */
function TabCompras() {
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/admin/compras').then(r => setCompras(r.data)).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {compras.length === 0 && <p style={{ color:'#475569', textAlign:'center', padding:40 }}>Sin compras registradas</p>}
      {compras.map(c => (
        <div key={c.id} className="glass-card" style={{ padding:'14px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span className={`badge ${c.estado==='pagado' ? 'badge-green' : 'badge-yellow'}`}>{c.estado}</span>
                <span style={{ fontWeight:600, fontSize:'0.88rem' }}>#{c.id}</span>
              </div>
              <span style={{ color:'#64748b', fontSize:'0.8rem' }}>{c.usuario_email} · {c.productos_nombres}</span>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontWeight:800, color:'#4ade80', fontSize:'1rem' }}>${Number(c.total||0).toFixed(2)}</div>
              <div style={{ color:'#334155', fontSize:'0.75rem' }}>{c.fecha_creacion?.slice(0,10)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── WebRow ─────────────────────────────────────────────── */
function WebRow({ web, onDeleted, onSaved }) {
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    titulo: web.titulo,
    url: web.url,
    descripcion: web.descripcion || '',
    categoria: web.categoria || '',
    orden: web.orden || 0,
  })
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const imgRef = useRef()

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const saveEdit = async () => {
    setSaving(true)
    try {
      await api.patch(`/admin/webs/${web.id}`, form)
      toast.success('Web actualizada')
      setEditOpen(false)
      onSaved()
    } catch { toast.error('Error') }
    finally { setSaving(false) }
  }

  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar "${web.titulo}"?`)) return
    try {
      await api.delete(`/admin/webs/${web.id}`)
      toast.success('Eliminada')
      onDeleted()
    } catch { toast.error('Error') }
  }

  const subirImagen = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('web_id', web.id)
    try {
      await api.post('/admin/upload-imagen-web', fd)
      toast.success('Imagen subida')
      onSaved()
    } catch { toast.error('Error al subir imagen') }
    finally { setUploading(false); e.target.value = '' }
  }

  return (
    <div className="glass-card" style={{ padding: 0, overflow:'hidden', marginBottom: 8 }}>
      <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
        {/* Thumbnail */}
        <div style={{ width:52, height:52, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {web.imagen_url
            ? <img src={web.imagen_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <FiGlobe size={20} color="#334155" />}
        </div>
        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{web.titulo}</div>
          <a href={web.url} target="_blank" rel="noopener noreferrer"
            style={{ color:'#a78bfa', fontSize:'0.78rem', textDecoration:'none' }}>
            {web.url.length > 50 ? web.url.slice(0,50)+'...' : web.url}
          </a>
        </div>
        {/* Actions */}
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={subirImagen} />
          <button onClick={()=>imgRef.current.click()} disabled={uploading} className="btn btn-ghost btn-sm" title="Subir imagen desde PC">
            <FiImage size={13} color="#38bdf8" />
          </button>
          <button onClick={()=>setEditOpen(p=>!p)} className="btn btn-ghost btn-sm" title="Editar">
            <FiEdit3 size={13} color="#38bdf8" />
          </button>
          <button onClick={eliminar} className="btn btn-ghost btn-sm" title="Eliminar">
            <FiTrash2 size={13} color="#f87171" />
          </button>
        </div>
      </div>
      {editOpen && (
        <div style={{ borderTop:'1px solid rgba(167,139,250,0.15)', padding:'16px 18px', background:'rgba(0,0,0,0.2)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div className="form-group">
              <label className="form-label">Título</label>
              <input className="input" value={form.titulo} onChange={set('titulo')} />
            </div>
            <div className="form-group">
              <label className="form-label">URL</label>
              <input type="url" className="input" value={form.url} onChange={set('url')} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom:12 }}>
            <label className="form-label">Descripción</label>
            <textarea className="textarea" rows={3} value={form.descripcion} onChange={set('descripcion')} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <input className="input" value={form.categoria} onChange={set('categoria')} />
            </div>
            <div className="form-group">
              <label className="form-label">Orden</label>
              <input type="number" className="input" value={form.orden} onChange={set('orden')} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={saveEdit} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Guardando...' : <><FiSave size={13}/> Guardar</>}
            </button>
            <button onClick={()=>setEditOpen(false)} className="btn btn-ghost btn-sm">
              <FiX size={13}/> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Webs Sugeridas ────────────────────────────────────── */
function TabWebsSugeridas() {
  const empty = { titulo: '', url: '', descripcion: '', imagen_url: '', categoria: '', orden: 0 }
  const [webs, setWebs]       = useState([])
  const [form, setForm]       = useState(empty)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/webs').then(r => setWebs(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/admin/webs', form)
      toast.success('Web agregada')
      setForm(empty)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar')
    } finally { setSending(false) }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      {/* Form */}
      <div className="glass-card" style={{ padding: 28 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiGlobe size={18} /> Agregar web
        </h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input required className="input" placeholder="Ej: ViralCraft AI Studio" value={form.titulo} onChange={set('titulo')} />
          </div>
          <div className="form-group">
            <label className="form-label">URL *</label>
            <input required type="url" className="input" placeholder="https://..." value={form.url} onChange={set('url')} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="textarea" rows={3} placeholder="¿Qué hace esta web?" value={form.descripcion} onChange={set('descripcion')} />
          </div>
          <div className="form-group">
            <label className="form-label">URL imagen (opcional)</label>
            <input className="input" placeholder="https://imagen.png" value={form.imagen_url} onChange={set('imagen_url')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <input className="input" placeholder="herramientas, diseño..." value={form.categoria} onChange={set('categoria')} />
            </div>
            <div className="form-group">
              <label className="form-label">Orden</label>
              <input type="number" className="input" value={form.orden} onChange={set('orden')} min="0" />
            </div>
          </div>
          <button type="submit" disabled={sending} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            {sending ? 'Guardando...' : <><FiPlus size={14} /> Agregar</>}
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiLink size={18} /> {webs.length} web{webs.length !== 1 ? 's' : ''} publicada{webs.length !== 1 ? 's' : ''}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {webs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
              <FiGlobe size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
              <p>Aún no has agregado webs</p>
            </div>
          )}
          {webs.map(w => <WebRow key={w.id} web={w} onDeleted={load} onSaved={load} />)}
        </div>
      </div>
    </div>
  )
}

/* ── Seguridad (Cambio contraseña admin con 2FA) ────────── */
function TabSeguridad() {
  const [paso, setPaso]     = useState(1)  // 1=form contraseña, 2=código 2FA
  const [form, setForm]     = useState({ nueva_password: '', confirmar: '' })
  const [codigo, setCodigo] = useState('')
  const [emailEnviado, setEmailEnviado] = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const solicitar = async (e) => {
    e.preventDefault()
    if (form.nueva_password !== form.confirmar) { toast.error('Las contraseñas no coinciden'); return }
    if (form.nueva_password.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    setLoading(true)
    try {
      const r = await api.post('/admin/cambiar-password/solicitar', { nueva_password: form.nueva_password })
      setEmailEnviado(r.data.email)
      setPaso(2)
      toast.success('Código enviado a tu correo')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al enviar código')
    } finally { setLoading(false) }
  }

  const confirmar = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/admin/cambiar-password/confirmar', { codigo })
      toast.success('¡Contraseña de admin actualizada!')
      setPaso(1)
      setForm({ nueva_password: '', confirmar: '' })
      setCodigo('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="glass-card" style={{ padding: 28 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiShield size={20} color="#f472b6" /> Cambiar contraseña de admin
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>
          Se enviará un código de verificación a tu correo para confirmar el cambio.
        </p>

        {paso === 1 ? (
          <form onSubmit={solicitar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label"><FiKey size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Nueva contraseña</label>
              <input type="password" required className="input" placeholder="Mínimo 6 caracteres" value={form.nueva_password} onChange={set('nueva_password')} />
            </div>
            <div className="form-group">
              <label className="form-label"><FiKey size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Confirmar contraseña</label>
              <input type="password" required className="input" placeholder="Repite la contraseña" value={form.confirmar} onChange={set('confirmar')} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              {loading ? 'Enviando código...' : <><FiShield size={14} /> Enviar código de verificación</>}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 10, padding: 16, fontSize: '0.85rem', color: '#94a3b8' }}>
              📬 Código enviado a <strong style={{ color: '#f1f5f9' }}>{emailEnviado}</strong>. Expira en 10 minutos.
            </div>
            <div className="form-group">
              <label className="form-label"><FiKey size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Código de verificación</label>
              <input required className="input" placeholder="123456" maxLength={6} value={codigo} onChange={e => setCodigo(e.target.value)}
                style={{ letterSpacing: '0.4em', fontSize: '1.2rem', textAlign: 'center' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Verificando...' : '✅ Confirmar cambio'}
              </button>
              <button type="button" onClick={() => setPaso(1)} className="btn btn-ghost">Cancelar</button>
            </div>
          </form>
        )}
      </div>

      <div className="glass-card" style={{ padding: 18, marginTop: 14 }}>
        <p style={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.7 }}>
          <strong style={{ color: '#f472b6' }}>⚙️ Configuración de email requerida:</strong><br />
          Para que funcione el envío de códigos, agrega estas variables de entorno en Render:<br />
          <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>EMAIL_FROM</code> = tu Gmail<br />
          <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>EMAIL_PASS</code> = contraseña de aplicación Gmail (16 chars)
        </p>
      </div>
    </div>
  )
}

/* ── Config ────────────────────────────────────────────── */
function TabConfig() {
  const [cfg, setCfg]   = useState({})
  const [loading, set]  = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/config').then(r => setCfg(r.data)).finally(() => set(false)) }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/admin/config', cfg)
      toast.success('Configuración guardada')
    } catch { toast.error('Error') }
    finally { setSaving(false) }
  }

  const upd = k => e => setCfg(p => ({ ...p, [k]: e.target.value }))

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div style={{ maxWidth:500 }}>
      <div className="glass-card" style={{ padding:28 }}>
        <h2 style={{ fontWeight:700, marginBottom:24 }}>Configuración del sitio</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label">Nombre del sitio</label>
            <input className="input" value={cfg.sitio_nombre||''} onChange={upd('sitio_nombre')} />
          </div>
          <div className="form-group">
            <label className="form-label">Correo de soporte</label>
            <input className="input" type="email" value={cfg.soporte_email||''} onChange={upd('soporte_email')} />
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp de soporte</label>
            <input className="input" placeholder="+5491112345678" value={cfg.soporte_whatsapp||''} onChange={upd('soporte_whatsapp')} />
          </div>
          <div className="form-group">
            <label className="form-label">Texto banner principal</label>
            <input className="input" value={cfg.banner_texto||''} onChange={upd('banner_texto')} />
          </div>
          <button onClick={save} disabled={saving} className="btn btn-primary" style={{ alignSelf:'flex-start' }}>
            {saving ? 'Guardando...' : <><FiSettings size={14} /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import { FiDownload, FiShield, FiZap, FiCheck, FiPackage, FiTag, FiHeadphones, FiLoader } from 'react-icons/fi'

export default function ProductoDetalle() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [producto,  setProducto]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [paying,    setPaying]    = useState(false)
  const [comprado,  setComprado]  = useState(false)
  const [compraId,  setCompraId]  = useState(null)

  useEffect(() => {
    api.get(`/productos/${id}`).then(r => setProducto(r.data)).catch(() => navigate('/tienda')).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user) return
    api.get('/mis-compras').then(r => {
      const compra = r.data.find(c => c.estado === 'pagado' && c.productos_ids?.includes(id))
      if (compra) { setComprado(true); setCompraId(compra.id) }
    }).catch(() => {})
  }, [user, id])

  const handleComprar = async () => {
    if (!user) { navigate('/login'); return }
    setPaying(true)
    try {
      const r = await api.post('/pago/crear', { productos_ids: [id] })
      const { init_point, demo_url } = r.data
      if (demo_url) window.location.href = demo_url
      else if (init_point) window.location.href = init_point
    } catch (e) {
      toast.error('Error al iniciar el pago. Intente nuevamente.')
      setPaying(false)
    }
  }

  const handleDescargar = async () => {
    try {
      const url = `/api/descargar/${compraId}/${id}`
      window.location.href = url
    } catch {
      toast.error('Error al descargar.')
    }
  }

  if (loading) return <div className="page-loader" style={{ paddingTop:120 }}><div className="spinner" /></div>
  if (!producto) return null

  const {
    nombre, descripcion_larga, descripcion_corta, precio, precio_oferta,
    imagen_url, categoria, es_oferta, es_bundle, compatibilidad, descargas,
  } = producto

  const precioFinal   = (es_oferta && precio_oferta) ? Number(precio_oferta) : Number(precio)
  const precioOriginal = Number(precio)
  const descuento      = es_oferta && precio_oferta ? Math.round(100 - (precioFinal / precioOriginal) * 100) : 0

  const compats = compatibilidad ? compatibilidad.split(',').map(s=>s.trim()) : []

  return (
    <div style={{ paddingTop:88 }}>
      <div className="container section">
        {/* Breadcrumb */}
        <div style={{ display:'flex', gap:8, marginBottom:32, color:'#475569', fontSize:'0.83rem' }}>
          <Link to="/" style={{ color:'#38bdf8' }}>Inicio</Link> /
          <Link to="/tienda" style={{ color:'#38bdf8' }}>Tienda</Link> /
          <span style={{ color:'#94a3b8' }}>{nombre}</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:40, alignItems:'start' }}>
          {/* Left */}
          <div>
            {/* Image */}
            <div style={{ background:'#1e293b', borderRadius:16, overflow:'hidden', border:'1px solid rgba(56,189,248,0.1)', marginBottom:32, height:300, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
              {imagen_url ? (
                <img src={imagen_url} alt={nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <div style={{ fontSize:80, opacity:0.25 }}>🖨️</div>
              )}
              <div style={{ position:'absolute', top:14, left:14, display:'flex', gap:8, flexWrap:'wrap' }}>
                {es_bundle && <span className="badge badge-purple"><FiPackage size={10} /> Bundle</span>}
                {es_oferta && <span className="badge badge-orange"><FiTag size={10} /> -{descuento}%</span>}
              </div>
            </div>

            {/* Description */}
            <div>
              {categoria && <p style={{ color:'#38bdf8', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>{categoria}</p>}
              <h1 style={{ fontSize:'1.8rem', fontWeight:800, marginBottom:16 }}>{nombre}</h1>
              {descripcion_corta && <p style={{ color:'#94a3b8', fontSize:'1rem', lineHeight:1.7, marginBottom:24, borderLeft:'3px solid #38bdf8', paddingLeft:16 }}>{descripcion_corta}</p>}

              {descripcion_larga && (
                <div style={{ color:'#64748b', fontSize:'0.9rem', lineHeight:1.8, whiteSpace:'pre-wrap' }}>
                  {descripcion_larga}
                </div>
              )}

              {compats.length > 0 && (
                <div style={{ marginTop:28 }}>
                  <h3 style={{ fontSize:'0.85rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Compatibilidad</h3>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {compats.map(c => (
                      <span key={c} style={{ background:'rgba(56,189,248,0.08)', color:'#38bdf8', border:'1px solid rgba(56,189,248,0.2)', borderRadius:8, padding:'5px 12px', fontSize:'0.83rem', fontWeight:500 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Buy card */}
          <div style={{ position:'sticky', top:90 }}>
            <div className="glass-card" style={{ padding:28 }}>
              {/* Price */}
              <div style={{ marginBottom:24 }}>
                {es_oferta && precio_oferta ? (
                  <>
                    <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:4 }}>
                      <span style={{ fontSize:'2.4rem', fontWeight:900, color:'#4ade80' }}>${precioFinal.toFixed(2)}</span>
                      <span style={{ fontSize:'1rem', color:'#475569', textDecoration:'line-through' }}>${precioOriginal.toFixed(2)}</span>
                    </div>
                    <span className="badge badge-orange" style={{ fontSize:'0.78rem' }}>Ahorra ${(precioOriginal - precioFinal).toFixed(2)} ({descuento}% off)</span>
                  </>
                ) : (
                  <span style={{ fontSize:'2.4rem', fontWeight:900, color:'#38bdf8' }}>${precioFinal.toFixed(2)}</span>
                )}
              </div>

              {/* Perks */}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                {[
                  [<FiZap size={14} />, '#fbbf24', 'Descarga inmediata tras el pago'],
                  [<FiShield size={14} />, '#38bdf8', 'Pago seguro con MercadoPago'],
                  [<FiDownload size={14} />, '#4ade80', 'Acceso desde tu cuenta siempre'],
                ].map(([icon, color, txt]) => (
                  <div key={txt} style={{ display:'flex', alignItems:'center', gap:10, color:'#94a3b8', fontSize:'0.85rem' }}>
                    <span style={{ color }}>{icon}</span> {txt}
                  </div>
                ))}
              </div>

              <hr className="divider" />

              {comprado ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'#4ade80', fontSize:'0.88rem', fontWeight:600 }}>
                    <FiCheck size={16} /> ¡Ya compraste este producto!
                  </div>
                  <button onClick={handleDescargar} className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                    <FiDownload size={16} /> Descargar Ahora
                  </button>
                </div>
              ) : (
                <button onClick={handleComprar} disabled={paying} className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center' }}>
                  {paying ? <><FiLoader size={16} style={{ animation:'spin 0.8s linear infinite' }} /> Procesando...</> : <><FiZap size={16} /> Comprar Ahora</>}
                </button>
              )}

              {!user && (
                <p style={{ color:'#475569', fontSize:'0.78rem', textAlign:'center', marginTop:12 }}>
                  <Link to="/login" style={{ color:'#38bdf8' }}>Inicia sesión</Link> o{' '}
                  <Link to="/registro" style={{ color:'#38bdf8' }}>regístrate</Link> para comprar
                </p>
              )}

              {/* Support note */}
              <div style={{ marginTop:20, padding:14, background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'#4ade80', fontSize:'0.82rem', fontWeight:600, marginBottom:4 }}>
                  <FiHeadphones size={14} /> Soporte incluido
                </div>
                <p style={{ color:'#475569', fontSize:'0.78rem', lineHeight:1.6 }}>
                  Si tienes problemas con la instalación, te asistimos por WhatsApp o email. Solo para clientes con compra verificada.
                </p>
              </div>

              {descargas > 0 && (
                <p style={{ color:'#334155', fontSize:'0.75rem', textAlign:'center', marginTop:14 }}>
                  <FiDownload size={11} style={{ verticalAlign:'middle' }} /> {descargas} descargas realizadas
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 380px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  )
}

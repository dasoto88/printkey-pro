import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import { FiDownload, FiPackage, FiUser, FiMail, FiCalendar, FiCheck, FiClock, FiShoppingBag } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Dashboard() {
  const { user }        = useAuth()
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/mis-compras')
      .then(r => setCompras(r.data))
      .catch(() => toast.error('Error al cargar compras'))
      .finally(() => setLoading(false))
  }, [])

  const handleDescargar = (compraId, productoId) => {
    window.location.href = `/api/descargar/${compraId}/${productoId}`
  }

  const formatFecha = (str) => {
    if (!str) return '—'
    try { return format(new Date(str), "d MMM yyyy, HH:mm", { locale: es }) } catch { return str }
  }

  return (
    <div style={{ paddingTop:88 }}>
      <div className="container section">
        <div style={{ marginBottom:40 }}>
          <p style={{ color:'#38bdf8', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>MI CUENTA</p>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800 }}>Dashboard</h1>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:28, alignItems:'start' }}>
          {/* Profile card */}
          <div>
            <div className="glass-card" style={{ padding:24, marginBottom:16 }}>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ width:60, height:60, background:'linear-gradient(135deg, #0ea5e9, #2dd4bf)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <FiUser size={24} color="#0f172a" />
                </div>
                <h3 style={{ fontWeight:700 }}>{user?.nombre} {user?.apellido}</h3>
                <span className={`badge ${user?.rol === 'admin' ? 'badge-purple' : 'badge-cyan'}`} style={{ marginTop:6 }}>
                  {user?.rol === 'admin' ? 'Administrador' : 'Cliente'}
                </span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', fontSize:'0.83rem' }}>
                  <FiMail size={13} /> {user?.email}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', fontSize:'0.83rem' }}>
                  <FiCalendar size={13} /> Desde {formatFecha(user?.fecha_registro)}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', fontSize:'0.83rem' }}>
                  <FiShoppingBag size={13} /> {compras.filter(c=>c.estado==='pagado').length} compra{compras.filter(c=>c.estado==='pagado').length!==1?'s':''} confirmada{compras.filter(c=>c.estado==='pagado').length!==1?'s':''}
                </div>
              </div>
            </div>
            {user?.rol === 'admin' && (
              <Link to="/admin" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                Panel de Administración
              </Link>
            )}
          </div>

          {/* Compras */}
          <div>
            <h2 style={{ fontWeight:700, marginBottom:20, fontSize:'1.1rem' }}>Mis Compras</h2>

            {loading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : compras.length === 0 ? (
              <div className="glass-card" style={{ padding:48, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16, opacity:0.3 }}>🛒</div>
                <h3 style={{ color:'#64748b', fontWeight:600, marginBottom:8 }}>Sin compras aún</h3>
                <p style={{ color:'#475569', fontSize:'0.85rem', marginBottom:20 }}>Visita la tienda para comprar tu primer reset</p>
                <Link to="/tienda" className="btn btn-primary">Ver productos</Link>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {compras.map(c => <CompraCard key={c.id} compra={c} onDescargar={handleDescargar} formatFecha={formatFecha} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 280px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

function CompraCard({ compra, onDescargar, formatFecha }) {
  const pagado = compra.estado === 'pagado'
  const nombres = compra.productos_nombres?.split('|') || []
  const ids     = compra.productos_ids?.split('|') || []

  return (
    <div className="glass-card" style={{ padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            {pagado
              ? <FiCheck size={14} color="#4ade80" />
              : <FiClock size={14} color="#fbbf24" />}
            <span style={{ fontWeight:700, fontSize:'0.88rem' }}>Compra #{compra.id}</span>
          </div>
          <span style={{ color:'#475569', fontSize:'0.78rem' }}>{formatFecha(compra.fecha_creacion)}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className={`badge ${pagado ? 'badge-green' : 'badge-yellow'}`}>{compra.estado}</span>
          <span style={{ fontWeight:800, color:'#38bdf8', fontSize:'1rem' }}>${Number(compra.total||0).toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {ids.map((pid, i) => (
          <div key={pid} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(56,189,248,0.04)', borderRadius:10, padding:'10px 14px', border:'1px solid rgba(56,189,248,0.08)', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <FiPackage size={14} color="#38bdf8" />
              <span style={{ fontSize:'0.88rem', fontWeight:500 }}>{nombres[i] || 'Producto'}</span>
            </div>
            {pagado && (
              <button onClick={() => onDescargar(compra.id, pid)} className="btn btn-primary btn-sm">
                <FiDownload size={12} /> Descargar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

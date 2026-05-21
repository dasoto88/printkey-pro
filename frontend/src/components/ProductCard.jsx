import { Link } from 'react-router-dom'
import { FiDownload, FiTag, FiPackage } from 'react-icons/fi'

export default function ProductCard({ producto }) {
  const {
    id, nombre, descripcion_corta, precio, precio_oferta,
    imagen_url, categoria, es_oferta, es_bundle, compatibilidad,
  } = producto

  const precioFinal = (es_oferta && precio_oferta) ? Number(precio_oferta) : Number(precio)
  const precioOriginal = Number(precio)
  const descuento = es_oferta && precio_oferta
    ? Math.round(100 - (precioFinal / precioOriginal) * 100)
    : 0

  const imgSrc = imagen_url || null

  return (
    <Link to={`/producto/${id}`} style={{ textDecoration:'none', display:'block' }}>
      <article style={{
        background:'#0f172a',
        border:'1px solid rgba(56,189,248,0.1)',
        borderRadius:16,
        overflow:'hidden',
        transition:'all 0.25s ease',
        cursor:'pointer',
        height:'100%',
        display:'flex',
        flexDirection:'column',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.border = '1px solid rgba(56,189,248,0.35)'
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(56,189,248,0.12)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.border = '1px solid rgba(56,189,248,0.1)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}>

        {/* Image */}
        <div style={{ position:'relative', background:'#1e293b', height:160, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          {imgSrc ? (
            <img src={imgSrc} alt={nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity:0.4 }}>
              <FiPackage size={40} color="#38bdf8" />
              <span style={{ color:'#475569', fontSize:'0.75rem' }}>{categoria || 'Software'}</span>
            </div>
          )}
          {/* Badges */}
          <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:6, flexWrap:'wrap' }}>
            {es_bundle && <span className="badge badge-purple"><FiPackage size={10} /> Bundle</span>}
            {es_oferta && <span className="badge badge-orange"><FiTag size={10} /> -{descuento}%</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'16px 18px 20px', flex:1, display:'flex', flexDirection:'column', gap:10 }}>
          {categoria && (
            <span style={{ color:'#38bdf8', fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>
              {categoria}
            </span>
          )}
          <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#f1f5f9', lineHeight:1.35 }}>{nombre}</h3>
          {descripcion_corta && (
            <p style={{ color:'#64748b', fontSize:'0.82rem', lineHeight:1.6, flex:1 }}>{descripcion_corta}</p>
          )}

          {compatibilidad && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {compatibilidad.split(',').map(c => (
                <span key={c} style={{ background:'rgba(56,189,248,0.07)', color:'#64748b', fontSize:'0.7rem', padding:'2px 8px', borderRadius:6, border:'1px solid rgba(56,189,248,0.1)' }}>
                  {c.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div>
              {es_oferta && precio_oferta ? (
                <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                  <span style={{ fontSize:'1.2rem', fontWeight:800, color:'#4ade80' }}>${precioFinal.toFixed(2)}</span>
                  <span style={{ fontSize:'0.82rem', color:'#475569', textDecoration:'line-through' }}>${precioOriginal.toFixed(2)}</span>
                </div>
              ) : (
                <span style={{ fontSize:'1.2rem', fontWeight:800, color:'#38bdf8' }}>${precioFinal.toFixed(2)}</span>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(56,189,248,0.1)', padding:'6px 12px', borderRadius:8, color:'#38bdf8', fontSize:'0.8rem', fontWeight:600 }}>
              <FiDownload size={13} /> Descargar
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

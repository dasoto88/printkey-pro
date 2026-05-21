import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiTag, FiDownload } from 'react-icons/fi'

export default function OfertasCarousel({ productos }) {
  const [idx, setIdx]   = useState(0)
  const [anim, setAnim] = useState(true)
  const timer = useRef(null)

  const ofertas = productos.filter(p => p.es_oferta || p.es_bundle)
  const total = ofertas.length

  const go = (dir) => {
    setAnim(false)
    setTimeout(() => {
      setIdx(i => (i + dir + total) % total)
      setAnim(true)
    }, 80)
  }

  useEffect(() => {
    if (total < 2) return
    timer.current = setInterval(() => go(1), 5000)
    return () => clearInterval(timer.current)
  }, [total])

  if (!total) return null

  const p = ofertas[idx]
  const precioFinal = (p.es_oferta && p.precio_oferta) ? Number(p.precio_oferta) : Number(p.precio)
  const descuento   = (p.es_oferta && p.precio_oferta)
    ? Math.round(100 - (precioFinal / Number(p.precio)) * 100) : 0

  return (
    <div style={{ position:'relative', borderRadius:20, overflow:'hidden', background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border:'1px solid rgba(56,189,248,0.2)', boxShadow:'0 0 40px rgba(56,189,248,0.08)' }}>
      {/* Glow strip */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, #38bdf8, #2dd4bf, transparent)' }} />

      <div style={{ display:'flex', alignItems:'center', minHeight:220 }}>
        {/* Image */}
        <div style={{ width:200, flexShrink:0, height:220, background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
          {p.imagen_url ? (
            <img src={p.imagen_url} alt={p.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', opacity: anim ? 1 : 0, transition:'opacity 0.15s' }} />
          ) : (
            <div style={{ fontSize:60, opacity:0.3 }}>🖨️</div>
          )}
          {/* Grid overlay */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(56,189,248,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.05) 1px, transparent 1px)', backgroundSize:'20px 20px' }} />
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:'28px 32px', opacity: anim ? 1 : 0, transition:'opacity 0.15s' }}>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {p.es_oferta && <span className="badge badge-orange"><FiTag size={10} /> OFERTA -{descuento}%</span>}
            {p.es_bundle && <span className="badge badge-purple">PAQUETE COMPLETO</span>}
            {p.categoria && <span className="badge badge-cyan">{p.categoria}</span>}
          </div>
          <h2 style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:'1.5rem', fontWeight:800, color:'#f1f5f9', marginBottom:8, lineHeight:1.25 }}>{p.nombre}</h2>
          {p.descripcion_corta && <p style={{ color:'#64748b', fontSize:'0.88rem', lineHeight:1.65, maxWidth:500, marginBottom:20 }}>{p.descripcion_corta}</p>}

          <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <div>
              {p.es_oferta && p.precio_oferta ? (
                <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                  <span style={{ fontSize:'2rem', fontWeight:900, color:'#4ade80', lineHeight:1 }}>${precioFinal.toFixed(2)}</span>
                  <span style={{ fontSize:'1rem', color:'#475569', textDecoration:'line-through' }}>${Number(p.precio).toFixed(2)}</span>
                </div>
              ) : (
                <span style={{ fontSize:'2rem', fontWeight:900, color:'#38bdf8', lineHeight:1 }}>${precioFinal.toFixed(2)}</span>
              )}
            </div>
            <Link to={`/producto/${p.id}`} className="btn btn-primary">
              <FiDownload size={16} /> Ver y Comprar
            </Link>
          </div>
        </div>

        {/* Navigation */}
        {total > 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:8, paddingRight:16, alignSelf:'center' }}>
            <button onClick={() => go(-1)} style={{ width:36, height:36, borderRadius:'50%', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.2)', color:'#38bdf8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FiChevronLeft size={18} />
            </button>
            <button onClick={() => go(1)} style={{ width:36, height:36, borderRadius:'50%', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.2)', color:'#38bdf8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FiChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'10px 0 14px' }}>
          {ofertas.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width: i===idx ? 20 : 6, height:6, borderRadius:3, background: i===idx ? '#38bdf8' : '#334155', border:'none', cursor:'pointer', transition:'all 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

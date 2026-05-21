import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { FiBook, FiClock, FiArrowRight } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/blog').then(r => setPosts(r.data)).finally(() => setLoading(false))
  }, [])

  const fmt = (s) => { try { return format(new Date(s), "d 'de' MMMM yyyy", { locale:es }) } catch { return s } }

  return (
    <div style={{ paddingTop:88 }}>
      <div className="container section">
        <div style={{ marginBottom:40 }}>
          <p style={{ color:'#a78bfa', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>INFORMACIÓN</p>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800, marginBottom:10 }}>Blog de Impresoras</h1>
          <p style={{ color:'#64748b', fontSize:'0.9rem' }}>Artículos semanales sobre tecnología, mantenimiento y soluciones para impresoras</p>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#475569' }}>
            <FiBook size={48} style={{ marginBottom:16, opacity:0.3 }} />
            <h3 style={{ marginBottom:8 }}>Próximamente</h3>
            <p style={{ fontSize:'0.88rem' }}>Estamos preparando artículos de calidad para ti</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {posts[0] && (
              <Link to={`/blog/${posts[0].id}`} style={{ display:'block', marginBottom:28, textDecoration:'none' }}>
                <div className="glass-card" style={{ overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:280, transition:'all 0.25s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(167,139,250,0.35)'; e.currentTarget.style.transform='translateY(-3px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(56,189,248,0.15)'; e.currentTarget.style.transform='translateY(0)'}}>
                  <div style={{ background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:72, opacity:0.5, borderRight:'1px solid rgba(56,189,248,0.1)' }}>
                    {posts[0].imagen_url ? <img src={posts[0].imagen_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:1 }} /> : '🖨️'}
                  </div>
                  <div style={{ padding:32, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                    <div>
                      <span className="badge badge-purple" style={{ marginBottom:14 }}>DESTACADO</span>
                      <h2 style={{ fontSize:'1.4rem', fontWeight:800, marginBottom:12, lineHeight:1.3 }}>{posts[0].titulo}</h2>
                      <p style={{ color:'#64748b', fontSize:'0.88rem', lineHeight:1.7 }}>{posts[0].resumen}</p>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20 }}>
                      <span style={{ color:'#475569', fontSize:'0.78rem' }}><FiClock size={11} style={{ verticalAlign:'middle' }} /> {fmt(posts[0].fecha_publicacion)}</span>
                      <span style={{ color:'#a78bfa', fontSize:'0.85rem', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>Leer <FiArrowRight size={13} /></span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:20 }}>
              {posts.slice(1).map(post => (
                <Link key={post.id} to={`/blog/${post.id}`} style={{ textDecoration:'none' }}>
                  <div className="glass-card" style={{ overflow:'hidden', height:'100%', display:'flex', flexDirection:'column', transition:'all 0.25s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(167,139,250,0.3)'; e.currentTarget.style.transform='translateY(-4px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(56,189,248,0.15)'; e.currentTarget.style.transform='translateY(0)'}}>
                    <div style={{ background:'#1e293b', height:140, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, opacity:0.4 }}>
                      {post.imagen_url ? <img src={post.imagen_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:1 }} /> : '📄'}
                    </div>
                    <div style={{ padding:'18px 20px 22px', flex:1, display:'flex', flexDirection:'column' }}>
                      <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:8, lineHeight:1.35 }}>{post.titulo}</h3>
                      <p style={{ color:'#64748b', fontSize:'0.82rem', lineHeight:1.65, flex:1 }}>{post.resumen}</p>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color:'#334155', fontSize:'0.75rem' }}>{fmt(post.fecha_publicacion)}</span>
                        <span style={{ color:'#a78bfa', fontSize:'0.8rem', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>Leer <FiArrowRight size={12} /></span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { FiArrowLeft, FiClock, FiUser } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function BlogPost() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [post, setPost]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/blog/${id}`)
      .then(r => setPost(r.data))
      .catch(() => navigate('/blog'))
      .finally(() => setLoading(false))
  }, [id])

  const fmt = (s) => { try { return format(new Date(s), "d 'de' MMMM yyyy", { locale:es }) } catch { return s } }

  if (loading) return <div className="page-loader" style={{ paddingTop:120 }}><div className="spinner" /></div>
  if (!post) return null

  return (
    <div style={{ paddingTop:88 }}>
      <div className="container section" style={{ maxWidth:760 }}>
        <Link to="/blog" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#64748b', fontSize:'0.85rem', marginBottom:32, transition:'color 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.color='#a78bfa'}
          onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>
          <FiArrowLeft size={14} /> Volver al blog
        </Link>

        {post.imagen_url && (
          <div style={{ borderRadius:16, overflow:'hidden', marginBottom:36, maxHeight:360 }}>
            <img src={post.imagen_url} alt={post.titulo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        )}

        <h1 style={{ fontSize:'clamp(1.5rem, 4vw, 2.2rem)', fontWeight:900, lineHeight:1.2, marginBottom:16 }}>{post.titulo}</h1>

        <div style={{ display:'flex', alignItems:'center', gap:20, color:'#475569', fontSize:'0.82rem', marginBottom:36, flexWrap:'wrap' }}>
          {post.autor && (
            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
              <FiUser size={13} /> {post.autor}
            </span>
          )}
          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
            <FiClock size={13} /> {fmt(post.fecha_publicacion)}
          </span>
        </div>

        {post.resumen && (
          <p style={{ color:'#94a3b8', fontSize:'1rem', lineHeight:1.75, borderLeft:'3px solid #a78bfa', paddingLeft:20, marginBottom:32 }}>
            {post.resumen}
          </p>
        )}

        <div style={{ color:'#94a3b8', fontSize:'0.92rem', lineHeight:1.9, whiteSpace:'pre-wrap' }}>
          {post.contenido}
        </div>

        <div style={{ marginTop:48, paddingTop:28, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:12 }}>
          <Link to="/blog" className="btn btn-ghost btn-sm">Ver más artículos</Link>
          <Link to="/forum" className="btn btn-outline btn-sm">Hacer una pregunta</Link>
        </div>
      </div>
    </div>
  )
}

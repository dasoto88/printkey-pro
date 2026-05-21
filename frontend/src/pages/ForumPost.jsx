import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiMessageCircle, FiCheck, FiUser, FiSend, FiStar } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ForumPost() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [post,    setPost]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply,   setReply]   = useState('')
  const [sending, setSending] = useState(false)

  const load = () => api.get(`/forum/${id}`).then(r => setPost(r.data)).catch(() => navigate('/forum')).finally(() => setLoading(false))

  useEffect(() => { load() }, [id])

  const submitReply = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!reply.trim()) return
    setSending(true)
    try {
      await api.post(`/forum/${id}/reply`, { contenido: reply })
      setReply('')
      toast.success('Respuesta publicada')
      load()
    } catch { toast.error('Error al responder') }
    finally { setSending(false) }
  }

  const markSolution = async (replyId) => {
    try {
      await api.patch(`/forum/${id}/reply/${replyId}/solucion`)
      toast.success('Marcado como solución')
      load()
    } catch { toast.error('Error') }
  }

  const fmt = (s) => { try { return format(new Date(s), "d MMM yyyy, HH:mm", { locale:es }) } catch { return s } }

  if (loading) return <div className="page-loader" style={{ paddingTop:120 }}><div className="spinner" /></div>
  if (!post) return null

  return (
    <div style={{ paddingTop:88 }}>
      <div className="container section" style={{ maxWidth:780 }}>
        {/* Back */}
        <Link to="/forum" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#64748b', fontSize:'0.85rem', marginBottom:28, transition:'color 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.color='#38bdf8'}
          onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>
          <FiArrowLeft size={14} /> Volver al foro
        </Link>

        {/* Main post */}
        <div className="glass-card" style={{ padding:28, marginBottom:20 }}>
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {post.solucionado && <span className="badge badge-green"><FiCheck size={10} /> Resuelto</span>}
            {post.categoria   && <span className="badge badge-cyan">{post.categoria}</span>}
          </div>
          <h1 style={{ fontSize:'1.3rem', fontWeight:800, marginBottom:14 }}>{post.titulo}</h1>
          <p style={{ color:'#94a3b8', lineHeight:1.8, fontSize:'0.92rem', whiteSpace:'pre-wrap', marginBottom:20 }}>{post.contenido}</p>
          <div style={{ display:'flex', alignItems:'center', gap:12, color:'#475569', fontSize:'0.78rem', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:14 }}>
            <FiUser size={12} /> {post.autor_nombre || 'Usuario'} &nbsp;·&nbsp;
            {fmt(post.fecha_creacion)}
          </div>
        </div>

        {/* Replies */}
        <h2 style={{ fontSize:'1rem', fontWeight:700, marginBottom:14, color:'#94a3b8' }}>
          <FiMessageCircle size={15} style={{ verticalAlign:'middle', marginRight:6 }} />
          {post.replies?.length || 0} respuesta{post.replies?.length !== 1 ? 's' : ''}
        </h2>

        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:28 }}>
          {(post.replies || []).map(r => (
            <div key={r.id} className="glass-card" style={{ padding:20, borderColor: r.es_solucion ? 'rgba(74,222,128,0.3)' : 'rgba(56,189,248,0.1)', background: r.es_solucion ? 'rgba(74,222,128,0.04)' : undefined }}>
              {r.es_solucion && (
                <div style={{ display:'flex', alignItems:'center', gap:6, color:'#4ade80', fontSize:'0.78rem', fontWeight:700, marginBottom:10 }}>
                  <FiStar size={12} /> SOLUCIÓN MARCADA
                </div>
              )}
              <p style={{ color:'#94a3b8', fontSize:'0.9rem', lineHeight:1.75, whiteSpace:'pre-wrap', marginBottom:14 }}>{r.contenido}</p>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                <span style={{ color:'#475569', fontSize:'0.76rem' }}>
                  <FiUser size={11} style={{ verticalAlign:'middle' }} /> {r.autor_nombre || 'Usuario'} &nbsp;·&nbsp; {fmt(r.fecha_creacion)}
                </span>
                {user && user.id === post.autor_id && !post.solucionado && (
                  <button onClick={() => markSolution(r.id)} className="btn btn-ghost btn-sm" style={{ color:'#4ade80', borderColor:'rgba(74,222,128,0.3)' }}>
                    <FiCheck size={12} /> Marcar solución
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reply form */}
        {user ? (
          <div className="glass-card" style={{ padding:24 }}>
            <h3 style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:16 }}>Tu respuesta</h3>
            <form onSubmit={submitReply} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <textarea required className="textarea" rows={4} placeholder="Escribe tu respuesta aquí..." value={reply} onChange={e=>setReply(e.target.value)} />
              <button type="submit" disabled={sending} className="btn btn-primary" style={{ alignSelf:'flex-start' }}>
                {sending ? 'Enviando...' : <><FiSend size={14} /> Responder</>}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:28, background:'rgba(56,189,248,0.05)', borderRadius:14, border:'1px solid rgba(56,189,248,0.1)' }}>
            <p style={{ color:'#64748b', marginBottom:14 }}>Inicia sesión para responder</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <Link to="/login" className="btn btn-primary btn-sm">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn-ghost btn-sm">Registrarse</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

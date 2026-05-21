import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import { FiMessageCircle, FiPlus, FiCheck, FiClock, FiUser, FiTag } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const CATEGORIAS = ['General', 'Epson', 'Canon', 'Instalación', 'Error', 'Otro']

export default function Forum() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]     = useState({ titulo:'', contenido:'', categoria:'General' })
  const [sending, setSending] = useState(false)

  const load = () => api.get('/forum').then(r => setPosts(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setSending(true)
    try {
      await api.post('/forum', form)
      toast.success('Pregunta publicada')
      setForm({ titulo:'', contenido:'', categoria:'General' })
      setShowForm(false)
      load()
    } catch { toast.error('Error al publicar') }
    finally { setSending(false) }
  }

  const fmt = (s) => { try { return format(new Date(s), "d MMM yyyy", { locale:es }) } catch { return s } }

  return (
    <div style={{ paddingTop:88 }}>
      <div className="container section">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:40, flexWrap:'wrap', gap:16 }}>
          <div>
            <p style={{ color:'#38bdf8', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>COMUNIDAD</p>
            <h1 style={{ fontSize:'1.8rem', fontWeight:800 }}>Foro Técnico</h1>
            <p style={{ color:'#64748b', fontSize:'0.88rem', marginTop:8 }}>Pregunta y responde sobre impresoras Epson y Canon</p>
          </div>
          <button onClick={() => { if(!user){ navigate('/login'); return } setShowForm(p=>!p) }} className="btn btn-primary">
            <FiPlus size={15} /> Nueva pregunta
          </button>
        </div>

        {/* New post form */}
        {showForm && (
          <div className="glass-card" style={{ padding:28, marginBottom:28 }}>
            <h3 style={{ fontWeight:700, marginBottom:20 }}>Nueva pregunta</h3>
            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="select" value={form.categoria} onChange={e => setForm(p=>({...p,categoria:e.target.value}))}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input required className="input" placeholder="Describe tu problema brevemente..." value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción detallada</label>
                <textarea required className="textarea" placeholder="Explica el error, modelo de impresora, lo que has intentado..." value={form.contenido} onChange={e=>setForm(p=>({...p,contenido:e.target.value}))} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" disabled={sending} className="btn btn-primary">{sending ? 'Publicando...' : 'Publicar pregunta'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Posts list */}
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#475569' }}>
            <FiMessageCircle size={48} style={{ marginBottom:16, opacity:0.3 }} />
            <h3 style={{ marginBottom:8 }}>Sin preguntas aún</h3>
            <p style={{ fontSize:'0.88rem' }}>¡Sé el primero en preguntar!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {posts.map(post => (
              <Link key={post.id} to={`/forum/${post.id}`} style={{ textDecoration:'none' }}>
                <div className="glass-card" style={{ padding:'18px 22px', transition:'all 0.2s', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(56,189,248,0.3)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(56,189,248,0.15)'}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    {/* Icon */}
                    <div style={{ width:40, height:40, borderRadius:10, background: post.solucionado ? 'rgba(74,222,128,0.12)' : 'rgba(56,189,248,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {post.solucionado ? <FiCheck size={18} color="#4ade80" /> : <FiMessageCircle size={18} color="#38bdf8" />}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                        {post.solucionado && <span className="badge badge-green">Resuelto</span>}
                        {post.categoria && <span className="badge badge-cyan"><FiTag size={9} /> {post.categoria}</span>}
                      </div>
                      <h3 style={{ fontSize:'0.95rem', fontWeight:700, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{post.titulo}</h3>
                      <p style={{ color:'#64748b', fontSize:'0.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.contenido}</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, color:'#475569', fontSize:'0.78rem', marginBottom:4 }}>
                        <FiMessageCircle size={11} /> {post.replies_count || 0} resp.
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, color:'#334155', fontSize:'0.75rem' }}>
                        <FiClock size={11} /> {fmt(post.fecha_creacion)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

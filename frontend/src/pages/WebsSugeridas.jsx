import { useEffect, useState } from 'react'
import api from '../api'
import { FiExternalLink, FiGlobe } from 'react-icons/fi'

export default function WebsSugeridas() {
  const [webs, setWebs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat]         = useState('todas')

  useEffect(() => {
    api.get('/webs').then(r => setWebs(r.data)).finally(() => setLoading(false))
  }, [])

  const cats = ['todas', ...new Set(webs.map(w => w.categoria).filter(Boolean))]
  const filtered = cat === 'todas' ? webs : webs.filter(w => w.categoria === cat)

  return (
    <div style={{ paddingTop: 88 }}>
      <div className="container section">
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            RECURSOS RECOMENDADOS
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10 }}>Webs Sugeridas</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Páginas web y herramientas online que recomendamos para ti
          </p>
        </div>

        {/* Category pills */}
        {cats.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{
                  padding: '8px 16px', borderRadius: 999, fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer', border: '1px solid', transition: 'all 0.2s',
                  background: cat === c ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color: cat === c ? '#a78bfa' : '#64748b',
                  borderColor: cat === c ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)',
                }}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
            <FiGlobe size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <h3 style={{ color: '#64748b', marginBottom: 8 }}>Pronto habrá webs aquí</h3>
            <p style={{ fontSize: '0.88rem' }}>Estamos preparando las mejores recomendaciones para ti</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(w => <WebCard key={w.id} web={w} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function WebCard({ web }) {
  return (
    <a href={web.url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}>
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(167,139,250,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}>

        {/* Image or placeholder */}
        <div style={{ height: 160, background: 'linear-gradient(135deg, #1e1b4b, #2e1065)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {web.imagen_url ? (
            <img src={web.imagen_url} alt={web.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <FiGlobe size={48} color="rgba(167,139,250,0.4)" />
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '18px 20px 20px' }}>
          {web.categoria && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {web.categoria}
            </span>
          )}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '6px 0 8px', color: '#f1f5f9' }}>{web.titulo}</h3>
          {web.descripcion && (
            <p style={{ color: '#64748b', fontSize: '0.83rem', lineHeight: 1.6, marginBottom: 14 }}>{web.descripcion}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a78bfa', fontSize: '0.82rem', fontWeight: 600 }}>
            <FiExternalLink size={13} />
            Visitar sitio
          </div>
        </div>
      </div>
    </a>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import ProductCard from '../components/ProductCard'
import OfertasCarousel from '../components/OfertasCarousel'
import { FiZap, FiDownload, FiShield, FiHeadphones, FiMessageCircle, FiBook, FiArrowRight, FiStar, FiPrinter } from 'react-icons/fi'

export default function Home() {
  const [productos, setProductos]   = useState([])
  const [ofertas, setOfertas]       = useState([])
  const [config, setConfig]         = useState({})
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/productos'),
      api.get('/productos/ofertas'),
      api.get('/config'),
    ]).then(([p, o, c]) => {
      setProductos(p.data)
      setOfertas(o.data)
      setConfig(c.data)
    }).finally(() => setLoading(false))
  }, [])

  const features = [
    { icon:<FiZap size={22} />, color:'#fbbf24', title:'Descarga Instantánea', desc:'Recibe el software al instante tras confirmar el pago.' },
    { icon:<FiShield size={22} />, color:'#38bdf8', title:'Pago 100% Seguro', desc:'Procesado por MercadoPago, el líder en pagos de LatAm.' },
    { icon:<FiHeadphones size={22} />, color:'#4ade80', title:'Soporte Técnico', desc:'Asistencia remota por chat o WhatsApp para clientes.' },
    { icon:<FiDownload size={22} />, color:'#a78bfa', title:'Re-descarga Gratis', desc:'Accede de nuevo a tus programas desde tu cuenta cuando quieras.' },
  ]

  return (
    <div style={{ paddingTop:68 }}>
      {/* ── Hero ─────────────────────────────── */}
      <section style={{ padding:'80px 0 56px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }} />
        <div className="container" style={{ textAlign:'center', position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:999, padding:'6px 16px', marginBottom:28 }}>
            <div style={{ width:6, height:6, background:'#4ade80', borderRadius:'50%', animation:'pulse-glow 2s infinite' }} />
            <span style={{ color:'#38bdf8', fontSize:'0.8rem', fontWeight:600, letterSpacing:'0.05em' }}>SOFTWARE PROFESIONAL PARA IMPRESORAS</span>
          </div>
          <h1 style={{ fontSize:'clamp(2.2rem, 5vw, 3.5rem)', fontWeight:900, lineHeight:1.1, marginBottom:20 }}>
            Reset de Almohadilla<br />
            <span className="gradient-text">Epson & Canon</span>
          </h1>
          <p style={{ color:'#64748b', fontSize:'1.05rem', maxWidth:540, margin:'0 auto 36px', lineHeight:1.7 }}>
            Soluciones profesionales para reiniciar el contador de la almohadilla de impresoras. Descarga instantánea, sin intermediarios.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/tienda" className="btn btn-primary btn-lg">
              <FiPrinter size={18} /> Ver Productos
            </Link>
            <Link to="/forum" className="btn btn-outline btn-lg">
              <FiMessageCircle size={18} /> Foro Técnico
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', justifyContent:'center', gap:40, marginTop:56, flexWrap:'wrap' }}>
            {[['500+','Clientes satisfechos'], ['2','Marcas soportadas'], ['24/7','Soporte técnico'], ['100%','Seguro y verificado']].map(([n, l]) => (
              <div key={n} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.8rem', fontWeight:900, color:'#38bdf8', lineHeight:1 }}>{n}</div>
                <div style={{ color:'#475569', fontSize:'0.8rem', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Offers carousel ──────────────────── */}
      {(ofertas.length > 0 || productos.filter(p=>p.es_oferta).length > 0) && (
        <section className="section-sm">
          <div className="container">
            <SectionHeader badge="OFERTAS ACTIVAS" title="Promociones Especiales" />
            <OfertasCarousel productos={[...ofertas, ...productos.filter(p=>p.es_bundle)]} />
          </div>
        </section>
      )}

      {/* ── Features ─────────────────────────── */}
      <section className="section-sm" style={{ background:'rgba(15,23,42,0.5)' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20 }}>
            {features.map(f => (
              <div key={f.title} className="glass-card" style={{ padding:24 }}>
                <div style={{ width:44, height:44, background:`${f.color}18`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:f.color, marginBottom:14 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:6 }}>{f.title}</h3>
                <p style={{ color:'#64748b', fontSize:'0.83rem', lineHeight:1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products grid ─────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:36, flexWrap:'wrap', gap:16 }}>
            <SectionHeader badge="CATÁLOGO" title="Todos los Productos" noMargin />
            <Link to="/tienda" style={{ display:'flex', alignItems:'center', gap:6, color:'#38bdf8', fontSize:'0.88rem', fontWeight:600 }}>
              Ver todos <FiArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : productos.length === 0 ? (
            <EmptyState icon="🖨️" title="Próximamente" desc="Estamos cargando los productos. Vuelve pronto." />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:20 }}>
              {productos.slice(0, 8).map(p => <ProductCard key={p.id} producto={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Services banner ──────────────────── */}
      <section className="section-sm">
        <div className="container">
          <div className="glass-card" style={{ padding:'40px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:32, flexWrap:'wrap', background:'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(167,139,250,0.06) 100%)', borderColor:'rgba(56,189,248,0.25)' }}>
            <div style={{ flex:1, minWidth:260 }}>
              <span className="badge badge-cyan" style={{ marginBottom:14 }}><FiHeadphones size={10} /> SERVICIO PREMIUM</span>
              <h2 style={{ fontSize:'1.6rem', fontWeight:800, marginBottom:10 }}>¿Necesitas ayuda remota?</h2>
              <p style={{ color:'#64748b', fontSize:'0.9rem', lineHeight:1.7 }}>
                Nuestros técnicos te asisten en tiempo real vía TeamViewer o AnyDesk. Solucionamos el error de almohadilla en minutos.
              </p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'flex-start' }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['Epson', 'Canon', 'Verificado', 'Garantía'].map(t => (
                  <span key={t} className="badge badge-cyan">{t}</span>
                ))}
              </div>
              <Link to="/tienda" className="btn btn-primary">
                <FiHeadphones size={16} /> Contratar Soporte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Forum & Blog teaser ──────────────── */}
      <section className="section-sm" style={{ paddingBottom:80 }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24 }}>
            <TeaserCard
              icon={<FiMessageCircle size={24} />}
              color="#38bdf8"
              badge="COMUNIDAD"
              title="Foro Técnico"
              desc="Pregunta a otros técnicos y usuarios. Resuelve dudas sobre errores de impresoras, instalación y configuración."
              to="/forum"
              cta="Ir al Foro"
            />
            <TeaserCard
              icon={<FiBook size={24} />}
              color="#a78bfa"
              badge="BLOG"
              title="Info sobre Impresoras"
              desc="Artículos semanales sobre tecnología de impresión, trucos, mantenimiento y novedades del sector."
              to="/blog"
              cta="Leer artículos"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ badge, title, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 32 }}>
      {badge && <p style={{ color:'#38bdf8', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{badge}</p>}
      <h2 style={{ fontSize:'1.7rem', fontWeight:800 }}>{title}</h2>
    </div>
  )
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 0', color:'#475569' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>{icon}</div>
      <h3 style={{ color:'#64748b', marginBottom:8 }}>{title}</h3>
      <p style={{ fontSize:'0.88rem' }}>{desc}</p>
    </div>
  )
}

function TeaserCard({ icon, color, badge, title, desc, to, cta }) {
  return (
    <div className="glass-card" style={{ padding:28, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, background:`${color}15`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color }}>
        {icon}
      </div>
      <div>
        <span style={{ color, fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>{badge}</span>
        <h3 style={{ fontSize:'1.1rem', fontWeight:700, margin:'6px 0 8px' }}>{title}</h3>
        <p style={{ color:'#64748b', fontSize:'0.85rem', lineHeight:1.7 }}>{desc}</p>
      </div>
      <Link to={to} style={{ display:'inline-flex', alignItems:'center', gap:6, color, fontSize:'0.88rem', fontWeight:600, marginTop:'auto' }}>
        {cta} <FiArrowRight size={14} />
      </Link>
    </div>
  )
}

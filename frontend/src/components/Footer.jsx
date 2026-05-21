import { Link } from 'react-router-dom'
import { FiPrinter, FiMail, FiMessageCircle, FiShield } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer style={{ background:'#020817', borderTop:'1px solid rgba(56,189,248,0.1)', marginTop:80 }}>
      <div className="container" style={{ padding:'56px 24px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:40, marginBottom:48 }}>

          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:36, height:36, background:'linear-gradient(135deg, #0ea5e9, #2dd4bf)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FiPrinter size={18} color="#0f172a" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:'1.1rem' }}>
                <span className="neon-text">PrintKey</span> <span style={{ color:'#475569' }}>Pro</span>
              </span>
            </div>
            <p style={{ color:'#475569', fontSize:'0.85rem', lineHeight:1.7, maxWidth:240 }}>
              Soluciones profesionales para resetear la almohadilla de impresoras Epson y Canon. Descarga instantánea tras el pago.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color:'#94a3b8', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Navegación</h4>
            <nav style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[['/', 'Inicio'], ['/tienda', 'Tienda'], ['/forum', 'Foro Técnico'], ['/blog', 'Info & Blog']].map(([to, label]) => (
                <Link key={to} to={to} style={{ color:'#475569', fontSize:'0.88rem', transition:'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#38bdf8'}
                  onMouseLeave={e => e.target.style.color = '#475569'}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Products */}
          <div>
            <h4 style={{ color:'#94a3b8', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Productos</h4>
            <nav style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {['Reset Epson', 'Reset Canon', 'Paquete Completo', 'Soporte Remoto'].map(l => (
                <Link key={l} to="/tienda" style={{ color:'#475569', fontSize:'0.88rem', transition:'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#38bdf8'}
                  onMouseLeave={e => e.target.style.color = '#475569'}>
                  {l}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color:'#94a3b8', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Contacto</h4>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <a href="mailto:soporte@printkeypro.com" style={{ display:'flex', alignItems:'center', gap:10, color:'#475569', fontSize:'0.88rem', transition:'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                <FiMail size={15} /> soporte@printkeypro.com
              </a>
              <a href="https://wa.me/1234567890" target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:10, color:'#475569', fontSize:'0.88rem', transition:'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                <FiMessageCircle size={15} /> WhatsApp Soporte
              </a>
              <div style={{ display:'flex', alignItems:'center', gap:10, color:'#475569', fontSize:'0.82rem' }}>
                <FiShield size={15} style={{ color:'#38bdf8', flexShrink:0 }} />
                Pago seguro con MercadoPago
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <p style={{ color:'#334155', fontSize:'0.8rem' }}>
            © {new Date().getFullYear()} PrintKey Pro — Todos los derechos reservados
          </p>
          <div style={{ display:'flex', gap:16 }}>
            {['Términos de uso', 'Privacidad'].map(l => (
              <span key={l} style={{ color:'#334155', fontSize:'0.8rem', cursor:'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

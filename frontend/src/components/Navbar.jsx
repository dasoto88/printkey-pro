import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { FiPrinter, FiMenu, FiX, FiUser, FiLogOut, FiShield, FiPackage } from 'react-icons/fi'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen]         = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  const links = [
    { to: '/',       label: 'Inicio' },
    { to: '/tienda', label: 'Tienda' },
    { to: '/forum',  label: 'Foro' },
    { to: '/blog',   label: 'Info' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      background: scrolled ? 'rgba(2,8,23,0.92)' : 'rgba(2,8,23,0.6)',
      backdropFilter: 'blur(20px)',
      borderBottom: scrolled ? '1px solid rgba(56,189,248,0.15)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:68 }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:'1.2rem' }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg, #0ea5e9, #2dd4bf)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FiPrinter size={18} color="#0f172a" strokeWidth={2.5} />
          </div>
          <span className="neon-text">PrintKey</span>
          <span style={{ color:'#94a3b8', fontWeight:400 }}>Pro</span>
        </Link>

        {/* Desktop links */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }} className="desktop-nav">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to==='/'} style={({ isActive }) => ({
              padding:'8px 14px', borderRadius:8, fontSize:'0.88rem', fontWeight:500,
              color: isActive ? '#38bdf8' : '#94a3b8',
              background: isActive ? 'rgba(56,189,248,0.1)' : 'transparent',
              transition:'all 0.2s',
            })}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Auth */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }} className="desktop-nav">
          {user ? (
            <div style={{ position:'relative' }}>
              <button
                onClick={() => setDropOpen(p => !p)}
                style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:999, padding:'7px 14px 7px 10px', cursor:'pointer', color:'#f1f5f9', fontSize:'0.85rem', fontWeight:500 }}>
                <div style={{ width:28, height:28, background:'linear-gradient(135deg, #0ea5e9, #2dd4bf)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <FiUser size={14} color="#0f172a" strokeWidth={2.5} />
                </div>
                {user.nombre}
              </button>
              {dropOpen && (
                <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'#1e293b', border:'1px solid rgba(56,189,248,0.15)', borderRadius:12, padding:8, minWidth:180, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:100 }}>
                  <DropItem icon={<FiPackage size={14} />} label="Mis compras" to="/dashboard" close={() => setDropOpen(false)} />
                  {user.rol === 'admin' && <DropItem icon={<FiShield size={14} />} label="Admin Panel" to="/admin" close={() => setDropOpen(false)} />}
                  <hr style={{ border:'none', borderTop:'1px solid rgba(56,189,248,0.1)', margin:'6px 0' }} />
                  <button onClick={() => { setDropOpen(false); handleLogout() }}
                    style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 12px', background:'transparent', border:'none', color:'#f87171', cursor:'pointer', borderRadius:8, fontSize:'0.85rem', fontWeight:500 }}>
                    <FiLogOut size={14} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn-primary btn-sm">Registrarse</Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(p => !p)} style={{ display:'none', background:'transparent', border:'none', color:'#94a3b8', cursor:'pointer' }} className="mobile-burger">
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background:'rgba(2,8,23,0.97)', borderTop:'1px solid rgba(56,189,248,0.1)', padding:'16px 24px 24px' }}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} style={{ display:'block', padding:'12px 0', color:'#94a3b8', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              {l.label}
            </NavLink>
          ))}
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center' }}>Dashboard</Link>
                <button onClick={() => { setOpen(false); handleLogout() }} className="btn btn-danger btn-sm" style={{ flex:1, justifyContent:'center' }}>Salir</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center' }}>Iniciar sesión</Link>
                <Link to="/registro" onClick={() => setOpen(false)} className="btn btn-primary btn-sm" style={{ flex:1, justifyContent:'center' }}>Registrarse</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-burger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}

function DropItem({ icon, label, to, close }) {
  return (
    <Link to={to} onClick={close}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8, color:'#94a3b8', fontSize:'0.85rem', fontWeight:500, transition:'all 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {icon} {label}
    </Link>
  )
}

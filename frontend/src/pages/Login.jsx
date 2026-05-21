import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import { FiPrinter, FiMail, FiLock, FiLogIn } from 'react-icons/fi'

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`¡Bienvenido, ${user.nombre}!`)
      navigate(user.rol === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Credenciales incorrectas'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'100px 24px 40px' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg, #0ea5e9, #2dd4bf)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <FiPrinter size={24} color="#0f172a" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, marginBottom:6 }}>Iniciar sesión</h1>
          <p style={{ color:'#475569', fontSize:'0.88rem' }}>Accede a tus compras y descargas</p>
        </div>

        <div className="glass-card" style={{ padding:32 }}>
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="form-group">
              <label className="form-label"><FiMail size={13} style={{ verticalAlign:'middle', marginRight:6 }} />Correo electrónico</label>
              <input
                type="email" required className="input"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label"><FiLock size={13} style={{ verticalAlign:'middle', marginRight:6 }} />Contraseña</label>
              <input
                type="password" required className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
            </div>

            {error && <p style={{ color:'#f87171', fontSize:'0.83rem', textAlign:'center' }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:4 }}>
              {loading ? 'Verificando...' : <><FiLogIn size={15} /> Iniciar sesión</>}
            </button>
          </form>

          <hr className="divider" />

          <p style={{ textAlign:'center', color:'#475569', fontSize:'0.85rem' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" style={{ color:'#38bdf8', fontWeight:600 }}>Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

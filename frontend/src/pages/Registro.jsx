import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import toast from 'react-hot-toast'
import { FiPrinter, FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi'

export default function Registro() {
  const { registro } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]     = useState({ nombre:'', apellido:'', email:'', password:'', password2:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password2) { setError('Las contraseñas no coinciden'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      const user = await registro({ nombre: form.nombre, apellido: form.apellido, email: form.email, password: form.password })
      toast.success('¡Cuenta creada! Bienvenido a PrintKey Pro')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'100px 24px 40px' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg, #0ea5e9, #2dd4bf)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <FiPrinter size={24} color="#0f172a" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, marginBottom:6 }}>Crear cuenta</h1>
          <p style={{ color:'#475569', fontSize:'0.88rem' }}>Regístrate para comprar y gestionar tus descargas</p>
        </div>

        <div className="glass-card" style={{ padding:32 }}>
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input type="text" required className="input" placeholder="Juan" value={form.nombre} onChange={set('nombre')} />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input type="text" required className="input" placeholder="García" value={form.apellido} onChange={set('apellido')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><FiMail size={13} style={{ verticalAlign:'middle', marginRight:6 }} />Correo electrónico</label>
              <input type="email" required className="input" placeholder="tu@email.com" value={form.email} onChange={set('email')} />
            </div>

            <div className="form-group">
              <label className="form-label"><FiLock size={13} style={{ verticalAlign:'middle', marginRight:6 }} />Contraseña</label>
              <input type="password" required className="input" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} />
            </div>

            <div className="form-group">
              <label className="form-label"><FiLock size={13} style={{ verticalAlign:'middle', marginRight:6 }} />Confirmar contraseña</label>
              <input type="password" required className="input" placeholder="Repite tu contraseña" value={form.password2} onChange={set('password2')} />
            </div>

            {error && <p style={{ color:'#f87171', fontSize:'0.83rem', textAlign:'center' }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:4 }}>
              {loading ? 'Creando cuenta...' : <><FiUserPlus size={15} /> Crear cuenta</>}
            </button>
          </form>

          <hr className="divider" />

          <p style={{ textAlign:'center', color:'#475569', fontSize:'0.85rem' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color:'#38bdf8', fontWeight:600 }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

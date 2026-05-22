import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import { FiLock, FiMail, FiKey, FiArrowLeft, FiPrinter } from 'react-icons/fi'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', codigo: '', nueva_password: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handle = async (e) => {
    e.preventDefault()
    if (form.nueva_password !== form.confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (form.nueva_password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email: form.email,
        codigo: form.codigo,
        nueva_password: form.nueva_password,
      })
      toast.success('¡Contraseña actualizada! Ya puedes iniciar sesión.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al restablecer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 40px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #0ea5e9, #2dd4bf)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FiPrinter size={24} color="#0f172a" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Nueva contraseña</h1>
          <p style={{ color: '#475569', fontSize: '0.88rem' }}>Ingresa el código que recibiste por correo</p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label"><FiMail size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Tu correo</label>
              <input type="email" required className="input" placeholder="tu@email.com" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label"><FiKey size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Código de verificación</label>
              <input required className="input" placeholder="123456" maxLength={6} value={form.codigo} onChange={set('codigo')}
                style={{ letterSpacing: '0.3em', fontSize: '1.1rem', textAlign: 'center' }} />
            </div>
            <div className="form-group">
              <label className="form-label"><FiLock size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Nueva contraseña</label>
              <input type="password" required className="input" placeholder="Mínimo 6 caracteres" value={form.nueva_password} onChange={set('nueva_password')} />
            </div>
            <div className="form-group">
              <label className="form-label"><FiLock size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Confirmar contraseña</label>
              <input type="password" required className="input" placeholder="Repite la contraseña" value={form.confirmar} onChange={set('confirmar')} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Actualizando...' : '🔓 Establecer nueva contraseña'}
            </button>
          </form>

          <hr className="divider" />
          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
            <Link to="/recuperar-password" style={{ color: '#38bdf8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FiArrowLeft size={13} /> No recibí el código
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

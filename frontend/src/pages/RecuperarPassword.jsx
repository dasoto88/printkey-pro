import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import toast from 'react-hot-toast'
import { FiMail, FiArrowLeft, FiPrinter } from 'react-icons/fi'

export default function RecuperarPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/recuperar-password', { email })
      setEnviado(true)
      toast.success('Código enviado. Revisa tu correo.')
    } catch {
      toast.error('Error al enviar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 40px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #0ea5e9, #2dd4bf)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FiPrinter size={24} color="#0f172a" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Recuperar contraseña</h1>
          <p style={{ color: '#475569', fontSize: '0.88rem' }}>Te enviaremos un código por correo</p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          {!enviado ? (
            <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label"><FiMail size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Correo electrónico</label>
                <input
                  type="email" required className="input"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Enviando...' : 'Enviar código de recuperación'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h3 style={{ marginBottom: 8 }}>¡Código enviado!</h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 20 }}>
                Si <strong>{email}</strong> está registrado, recibirás un código en tu correo. Revisa también el spam.
              </p>
              <Link to="/reset-password" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', display: 'flex' }}>
                Ingresar mi código →
              </Link>
            </div>
          )}

          <hr className="divider" />
          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
            <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FiArrowLeft size={13} /> Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

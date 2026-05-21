import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api'
import { FiCheck, FiDownload, FiMail, FiMessageCircle, FiPackage, FiAlertTriangle } from 'react-icons/fi'

export default function PagoExitoso() {
  const [params]    = useSearchParams()
  const compraId    = params.get('compra_id')
  const demo        = params.get('demo') === '1'

  const [compra,   setCompra]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [polling,  setPolling]  = useState(true)

  useEffect(() => {
    if (!compraId) { setLoading(false); return }
    let tries = 0
    const check = async () => {
      try {
        const r = await api.get(`/pago/estado/${compraId}`)
        setCompra(r.data)
        if (r.data.estado === 'pagado' || tries >= 12) {
          setPolling(false)
          setLoading(false)
          return
        }
      } catch { setPolling(false); setLoading(false); return }
      tries++
      setTimeout(check, 3000)
    }
    check()
  }, [compraId])

  const handleDescargar = (pid) => {
    window.location.href = `/api/descargar/${compraId}/${pid}`
  }

  if (loading) return (
    <div style={{ paddingTop:120, minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
      <div style={{ width:60, height:60, border:'3px solid rgba(56,189,248,0.2)', borderTopColor:'#38bdf8', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'#64748b', fontSize:'0.9rem' }}>Verificando tu pago{polling ? '...' : ''}</p>
      {polling && <p style={{ color:'#334155', fontSize:'0.8rem' }}>Esto puede tardar unos segundos</p>}
    </div>
  )

  if (!compraId) return (
    <div style={{ paddingTop:120, textAlign:'center', padding:'120px 24px' }}>
      <FiAlertTriangle size={48} color="#f87171" style={{ marginBottom:16 }} />
      <h2>Página no válida</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop:20 }}>Volver al inicio</Link>
    </div>
  )

  const pagado = compra?.estado === 'pagado'
  const nombres = compra?.productos_nombres?.split('|') || []
  const ids     = compra?.productos_ids?.split('|')     || []

  return (
    <div style={{ paddingTop:88, minHeight:'80vh' }}>
      <div className="container section" style={{ maxWidth:640, margin:'0 auto' }}>
        {/* Status header */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ width:72, height:72, background: pagado ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.1)', border:`2px solid ${pagado ? '#4ade80' : '#fbbf24'}`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            {pagado ? <FiCheck size={32} color="#4ade80" strokeWidth={2.5} /> : <FiAlertTriangle size={32} color="#fbbf24" />}
          </div>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800, marginBottom:8 }}>
            {pagado ? '¡Pago Confirmado!' : 'Pago Pendiente'}
          </h1>
          <p style={{ color:'#64748b', fontSize:'0.9rem' }}>
            {pagado
              ? 'Tu compra fue procesada exitosamente. Ya puedes descargar tu software.'
              : 'Estamos esperando la confirmación de MercadoPago. Puede tardar unos minutos.'}
          </p>
          {demo && (
            <div style={{ marginTop:12, padding:'8px 20px', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.25)', borderRadius:10, display:'inline-block' }}>
              <span style={{ color:'#fbbf24', fontSize:'0.8rem', fontWeight:600 }}>Modo demo — pago simulado</span>
            </div>
          )}
        </div>

        {/* Order card */}
        {compra && (
          <div className="glass-card" style={{ padding:28, marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:'1rem', fontWeight:700 }}>Detalle de la compra</h2>
              <span className={`badge ${pagado ? 'badge-green' : 'badge-yellow'}`}>
                {compra.estado}
              </span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
              {ids.map((pid, i) => (
                <div key={pid} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'rgba(56,189,248,0.05)', borderRadius:10, border:'1px solid rgba(56,189,248,0.1)', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:36, height:36, background:'rgba(56,189,248,0.1)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <FiPackage size={16} color="#38bdf8" />
                    </div>
                    <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{nombres[i] || 'Producto'}</span>
                  </div>
                  {pagado && (
                    <button onClick={() => handleDescargar(pid)} className="btn btn-primary btn-sm">
                      <FiDownload size={13} /> Descargar
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:16, display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'#94a3b8', fontSize:'0.88rem' }}>Total pagado</span>
              <span style={{ fontWeight:800, fontSize:'1.1rem', color:'#4ade80' }}>${Number(compra.total || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Installation guide */}
        {pagado && (
          <div className="glass-card" style={{ padding:28, marginBottom:24, borderColor:'rgba(56,189,248,0.2)' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:700, marginBottom:18 }}>📋 Cómo usar tu reset</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                ['1', 'Descarga el archivo con el botón de arriba'],
                ['2', 'Extrae el ZIP en una carpeta de tu PC'],
                ['3', 'Ejecuta el programa como Administrador (clic derecho → Ejecutar como administrador)'],
                ['4', 'Conecta tu impresora por USB y asegúrate de que esté encendida'],
                ['5', 'Sigue las instrucciones en pantalla para completar el reset'],
                ['6', 'Reinicia la impresora al finalizar'],
              ].map(([n, txt]) => (
                <div key={n} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ width:24, height:24, background:'rgba(56,189,248,0.15)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#38bdf8', fontSize:'0.75rem', fontWeight:700 }}>{n}</div>
                  <p style={{ color:'#94a3b8', fontSize:'0.87rem', lineHeight:1.6, paddingTop:2 }}>{txt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support — only shown after payment */}
        {pagado && (
          <div style={{ padding:24, background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:14, marginBottom:24 }}>
            <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#4ade80', marginBottom:12 }}>¿Necesitas ayuda?</h3>
            <p style={{ color:'#64748b', fontSize:'0.85rem', marginBottom:16, lineHeight:1.65 }}>
              Como cliente verificado tienes acceso a soporte técnico. Puedes contactarnos por:
            </p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <a href="mailto:soporte@printkeypro.com" className="btn btn-ghost btn-sm">
                <FiMail size={14} /> Email Soporte
              </a>
              <a href="https://wa.me/1234567890?text=Hola,%20necesito%20ayuda%20con%20mi%20compra%20%23{compraId}" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ color:'#4ade80' }}>
                <FiMessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Link to="/dashboard" className="btn btn-outline" style={{ flex:1, justifyContent:'center' }}>
            Ver mis compras
          </Link>
          <Link to="/tienda" className="btn btn-ghost" style={{ flex:1, justifyContent:'center' }}>
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}

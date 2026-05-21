import { useEffect, useState } from 'react'
import api from '../api'
import ProductCard from '../components/ProductCard'
import { FiSearch, FiFilter } from 'react-icons/fi'

export default function Tienda() {
  const [productos, setProductos] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const [cat, setCat]             = useState('todos')

  useEffect(() => {
    api.get('/productos')
      .then(r => { setProductos(r.data); setFiltered(r.data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let res = [...productos]
    if (query) res = res.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase()) || (p.descripcion_corta||'').toLowerCase().includes(query.toLowerCase()))
    if (cat === 'ofertas')  res = res.filter(p => p.es_oferta)
    if (cat === 'bundles')  res = res.filter(p => p.es_bundle)
    if (cat !== 'todos' && cat !== 'ofertas' && cat !== 'bundles') res = res.filter(p => p.categoria === cat)
    setFiltered(res)
  }, [query, cat, productos])

  const cats = ['todos', 'ofertas', 'bundles', ...new Set(productos.map(p=>p.categoria).filter(Boolean))]

  return (
    <div style={{ paddingTop:88 }}>
      <div className="container section">
        {/* Header */}
        <div style={{ marginBottom:40 }}>
          <p style={{ color:'#38bdf8', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>CATÁLOGO COMPLETO</p>
          <h1 style={{ fontSize:'2rem', fontWeight:800, marginBottom:10 }}>Tienda de Resets</h1>
          <p style={{ color:'#64748b', fontSize:'0.9rem' }}>Software para resetear la almohadilla de impresoras Epson y Canon</p>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:12, marginBottom:32, flexWrap:'wrap', alignItems:'center' }}>
          {/* Search */}
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <FiSearch size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
            <input
              className="input"
              placeholder="Buscar producto..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft:40 }}
            />
          </div>
          {/* Category pills */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding:'8px 16px', borderRadius:999, fontSize:'0.82rem', fontWeight:600, cursor:'pointer', border:'1px solid', transition:'all 0.2s',
                  background: cat===c ? 'rgba(56,189,248,0.15)' : 'transparent',
                  color: cat===c ? '#38bdf8' : '#64748b',
                  borderColor: cat===c ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.08)',
                }}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#475569' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
            <h3 style={{ color:'#64748b', marginBottom:8 }}>Sin resultados</h3>
            <p style={{ fontSize:'0.88rem' }}>Prueba con otro término o categoría</p>
          </div>
        ) : (
          <>
            <p style={{ color:'#475569', fontSize:'0.82rem', marginBottom:20 }}>{filtered.length} producto{filtered.length!==1?'s':''} encontrado{filtered.length!==1?'s':''}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:20 }}>
              {filtered.map(p => <ProductCard key={p.id} producto={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

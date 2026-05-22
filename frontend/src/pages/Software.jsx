import { useEffect, useState } from 'react'
import api from '../api'
import ProductCard from '../components/ProductCard'
import { FiSearch } from 'react-icons/fi'

export default function Software() {
  const [productos, setProductos] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')

  useEffect(() => {
    api.get('/productos', { params: { categoria: 'Software' } })
      .then(r => { setProductos(r.data); setFiltered(r.data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let res = [...productos]
    if (query) res = res.filter(p =>
      p.nombre.toLowerCase().includes(query.toLowerCase()) ||
      (p.descripcion_corta||'').toLowerCase().includes(query.toLowerCase())
    )
    setFiltered(res)
  }, [query, productos])

  return (
    <div style={{ paddingTop: 88 }}>
      <div className="container section">
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            SOFTWARE PROPIO
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10 }}>Software Propio</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Herramientas y programas desarrollados por nosotros</p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <FiSearch size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              className="input"
              placeholder="Buscar software..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ color: '#64748b', marginBottom: 8 }}>Sin resultados</h3>
            <p style={{ fontSize: '0.88rem' }}>Prueba con otro término de búsqueda</p>
          </div>
        ) : (
          <>
            <p style={{ color: '#475569', fontSize: '0.82rem', marginBottom: 20 }}>
              {filtered.length} programa{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
              {filtered.map(p => <ProductCard key={p.id} producto={p} accentColor="#4ade80" />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Tienda from './pages/Tienda'
import ProductoDetalle from './pages/ProductoDetalle'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import Forum from './pages/Forum'
import ForumPost from './pages/ForumPost'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import PagoExitoso from './pages/PagoExitoso'
import Admin from './pages/Admin'
import Software          from './pages/Software'
import WebsSugeridas     from './pages/WebsSugeridas'
import RecuperarPassword from './pages/RecuperarPassword'
import ResetPassword     from './pages/ResetPassword'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><div className="spinner" /></div>
  if (!user || user.rol !== 'admin') return <Navigate to="/" replace />
  return children
}

function AppInner() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '12px' },
          success: { iconTheme: { primary: '#4ade80', secondary: '#0f172a' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#0f172a' } },
        }}
      />
      <Navbar />
      <main>
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/tienda"            element={<Tienda />} />
          <Route path="/producto/:id"      element={<ProductoDetalle />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/registro"          element={<Registro />} />
          <Route path="/forum"             element={<Forum />} />
          <Route path="/forum/:id"         element={<ForumPost />} />
          <Route path="/blog"              element={<Blog />} />
          <Route path="/blog/:id"          element={<BlogPost />} />
          <Route path="/pago-exitoso"      element={<PagoExitoso />} />
          <Route path="/dashboard"           element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/admin"             element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="/software"          element={<Software />} />
          <Route path="/webs"              element={<WebsSugeridas />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/reset-password"    element={<ResetPassword />} />
          <Route path="*"                  element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

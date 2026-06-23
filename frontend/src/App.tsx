import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { ToastProvider } from '@/components/ui/Toast'

// Lazy-load all route-level components for optimal bundle splitting
const LandingPage      = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage        = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage     = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const DashboardPage    = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const VehiclesPage     = lazy(() => import('@/pages/VehiclesPage').then(m => ({ default: m.VehiclesPage })))
const VehicleDetailPage = lazy(() => import('@/pages/VehicleDetailPage').then(m => ({ default: m.VehicleDetailPage })))
const NotFoundPage     = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function PageLoader() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--orange-500)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected — wrapped in AppLayout which guards auth */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard"       element={<DashboardPage />} />
              <Route path="/vehicles"        element={<VehiclesPage />} />
              <Route path="/vehicles/:id"    element={<VehicleDetailPage />} />
            </Route>

            {/* Fallbacks */}
            <Route path="/404"  element={<NotFoundPage />} />
            <Route path="*"     element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

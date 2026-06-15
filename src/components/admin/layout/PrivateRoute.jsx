import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import Sidebar from './Sidebar'
import Header from './Header'

export default function PrivateRoute() {
  const token = useAuthStore((s) => s.token)

  if (!token) {
    return <Navigate to="/admin/live/login" replace />
  }

  return (
    <div className="flex h-screen bg-[#EEEEEE]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

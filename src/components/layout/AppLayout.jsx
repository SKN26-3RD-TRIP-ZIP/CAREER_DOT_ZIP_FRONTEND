import { Outlet } from 'react-router-dom'
import TopNav from './TopNav.jsx'

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#EEEEEE] text-[#000000]">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout

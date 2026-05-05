import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useUserStore } from './store/userStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Chat from './pages/Chat'
import ImageGenerator from './pages/ImageGenerator'
import Steps from './pages/Steps'
import Track from './pages/Track'
import Profile from './pages/Profile'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = useUserStore((state) => state.token)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children || <Outlet />}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/chat" />} />
        <Route path="chat" element={<Chat />} />
        <Route path="image" element={<ImageGenerator />} />
        <Route path="steps" element={<Steps />} />
        <Route path="track" element={<Track />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
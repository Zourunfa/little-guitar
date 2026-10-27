import { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import cloudbase from './utils/cloudbase'
import TunerPage from './pages/TunerPage'
import BluesPage from './pages/BluesPage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import './App.css'

function App() {
  useEffect(() => {
    // 初始化登录
    const initAuth = async () => {
      try {
        console.log('开始登录...');
        await cloudbase.ensureLogin()
        console.log('登录成功');
      } catch (error) {
        console.error('登录失败', error)
      }
    }

    initAuth()
  }, [])

  console.log('渲染主应用UI');
  
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Navigate to="/blues" replace />} />
            <Route path="/tuner" element={<TunerPage />} />
            <Route path="/blues" element={<BluesPage />} />
            <Route path="*" element={<Navigate to="/blues" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App

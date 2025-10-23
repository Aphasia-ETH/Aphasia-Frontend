import Logo from '@/assets/crx.svg'
import { useState } from 'react'
import { App as RouterApp } from '@/router'
import './App.css'

function AppContent() {
  const [show, setShow] = useState(false)
  
  const toggle = () => setShow(!show)

  return (
    <div className="popup-container">
      {show && (
        <div className={`popup-content ${show ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-80 h-96">
            <RouterApp />
          </div>
        </div>
      )}
      <button className="toggle-button" onClick={toggle}>
        <img src={Logo} alt="CRXJS logo" className="button-icon" />
      </button>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App

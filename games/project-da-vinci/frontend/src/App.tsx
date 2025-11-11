import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Lobby from '@/pages/Lobby'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        {/* TODO: 추가 라우트
        <Route path="/game/:roomId" element={<GameRoom />} />
        <Route path="/results" element={<Results />} />
        */}
      </Routes>
    </BrowserRouter>
  )
}

export default App

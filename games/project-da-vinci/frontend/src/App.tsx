import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* TODO: 추가 라우트
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game/:roomId" element={<GameRoom />} />
        <Route path="/results" element={<Results />} />
        */}
      </Routes>
    </BrowserRouter>
  )
}

export default App

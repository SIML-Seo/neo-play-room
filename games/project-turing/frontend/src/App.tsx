import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Lobby from '@/pages/Lobby'
import GameRoom from '@/pages/GameRoom'
import Results from '@/pages/Results'
import Leaderboard from '@/pages/Leaderboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/game/:roomId" element={<GameRoom />} />
        <Route path="/results/:roomId" element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

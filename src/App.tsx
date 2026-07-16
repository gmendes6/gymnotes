import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Treino from './pages/Treino'
import Sessao from './pages/Sessao'
import Exercicio from './pages/Exercicio'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/treino/:id" element={<Treino />} />
        <Route path="/treino/:id/sessao/:sessaoId" element={<Sessao />} />
        <Route path="/treino/:id/exercicio/:exId" element={<Exercicio />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

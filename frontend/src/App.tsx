import { BrowserRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="flex h-screen items-center justify-center text-xl font-semibold text-gray-600">Acabou o Mony</div>} />
      </Routes>
    </BrowserRouter>
  )
}

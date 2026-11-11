import { Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import { ToastProvider } from './components/Toast.jsx'
import ExplainPage from './pages/ExplainPage.jsx'
import PracticePage from './pages/PracticePage.jsx'
import WordsPage from './pages/WordsPage.jsx'

export default function App() {
  return (
    <ToastProvider>
      <Header />
      <Routes>
        <Route path="/" element={<ExplainPage />} />
        <Route path="/words" element={<WordsPage />} />
        <Route path="/practice" element={<PracticePage />} />
      </Routes>
    </ToastProvider>
  )
}

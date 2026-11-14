import { Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import { ToastProvider } from './components/Toast.jsx'
import ExplainPage from './pages/ExplainPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PracticePage from './pages/PracticePage.jsx'
import SharedPage from './pages/SharedPage.jsx'
import WordsPage from './pages/WordsPage.jsx'

export default function App() {
  return (
    <ToastProvider>
      <Header />
      <Routes>
        <Route path="/" element={<ExplainPage />} />
        <Route path="/words" element={<WordsPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/s" element={<SharedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  )
}

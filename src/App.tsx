import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Suspense } from 'react'

// Pages
import { HomePageFixed } from './pages/HomePageFixed'
import { AuthPageFixed } from './pages/AuthPageFixed'
import { DashboardPageFixed } from './pages/DashboardPageFixed'
import { PredictionPageFixed } from './pages/PredictionPageFixed'
import { MusicPageFixed } from './pages/MusicPageFixed'
import { ProfilePageFixed } from './pages/ProfilePageFixed'
import { HistoryPageFixed } from './pages/HistoryPageFixed'

// Components
import { LoadingSpinner } from './components/ui/LoadingSpinner'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePageFixed />} />
            <Route path="/auth" element={<AuthPageFixed />} />
            <Route path="/app" element={<DashboardPageFixed />} />
            <Route path="/app/prediction" element={<PredictionPageFixed />} />
            <Route path="/app/music" element={<MusicPageFixed />} />
            <Route path="/app/profile" element={<ProfilePageFixed />} />
            <Route path="/app/history" element={<HistoryPageFixed />} />
            <Route path="/app/history" element={<HistoryPageFixed />} />
          </Routes>
        </Suspense>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
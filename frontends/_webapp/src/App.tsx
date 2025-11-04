import { Routes, Route, useSearchParams } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import LoadingSpinner from './components/ui/LoadingSpinner'
import FontLoader from './components/ui/FontLoader'

// Import both layouts
const LayoutOld = lazy(() => import('../src_old/components/Layout'))
const LayoutNew = lazy(() => import('./components/LayoutNew'))

// Lazy load pages from old structure
const HomeOld = lazy(() => import('../src_old/pages/Home'))
const PetDetailsOld = lazy(() => import('../src_old/pages/PetDetails'))
const EconomyOld = lazy(() => import('../src_old/pages/Economy'))
const HistoryOld = lazy(() => import('../src_old/pages/History'))
const AdminOld = lazy(() => import('../src_old/pages/Admin'))
const SettingsOld = lazy(() => import('../src_old/pages/Settings'))
const ComponentsDemo = lazy(() => import('../src_old/pages/Components'))
const GamesRunner = lazy(() => import('../src_old/pages/GamesRunner'))
const GamesPuzzle = lazy(() => import('../src_old/pages/GamesPuzzle'))
const GamesMatch3 = lazy(() => import('../src_old/pages/GamesMatch3'))
const GamesEgg = lazy(() => import('../src_old/pages/GamesEgg'))
const MarketOld = lazy(() => import('../src_old/pages/Market'))

// Lazy load new pages
const HomeNew = lazy(() => import('./pages/Home'))
const PetDetailsNew = lazy(() => import('./pages/PetDetails'))
const EconomyNew = lazy(() => import('./pages/Economy'))
const HistoryNew = lazy(() => import('./pages/History'))
const AdminNew = lazy(() => import('./pages/Admin'))
const SettingsNew = lazy(() => import('./pages/Settings'))
const MarketNew = lazy(() => import('./pages/Market'))

function AppContent() {
  const [searchParams] = useSearchParams()
  const uiMode = searchParams.get('ui') || 'new' // default to new UI

  if (uiMode === 'old') {
    // Old UI with sidebar
    return (
      <LayoutOld>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomeOld />} />
            <Route path="/pet/:petId" element={<PetDetailsOld />} />
            <Route path="/economy" element={<EconomyOld />} />
            <Route path="/history" element={<HistoryOld />} />
            <Route path="/market" element={<MarketOld />} />
            <Route path="/admin" element={<AdminOld />} />
            <Route path="/settings" element={<SettingsOld />} />
            <Route path="/components" element={<ComponentsDemo />} />
            <Route path="/games/runner" element={<GamesRunner />} />
            <Route path="/games/puzzle" element={<GamesPuzzle />} />
            <Route path="/games/match3" element={<GamesMatch3 />} />
            <Route path="/games/egg" element={<GamesEgg />} />
          </Routes>
        </Suspense>
      </LayoutOld>
    )
  }

  // New UI with Dock
  return (
    <LayoutNew>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomeNew />} />
          <Route path="/pet/:petId" element={<PetDetailsNew />} />
          <Route path="/economy" element={<EconomyNew />} />
          <Route path="/history" element={<HistoryNew />} />
          <Route path="/market" element={<MarketNew />} />
          <Route path="/admin" element={<AdminNew />} />
          <Route path="/settings" element={<SettingsNew />} />
          <Route path="/components" element={<ComponentsDemo />} />
          <Route path="/games/runner" element={<GamesRunner />} />
          <Route path="/games/puzzle" element={<GamesPuzzle />} />
          <Route path="/games/match3" element={<GamesMatch3 />} />
          <Route path="/games/egg" element={<GamesEgg />} />
        </Routes>
      </Suspense>
    </LayoutNew>
  )
}

function App() {
  return (
    <FontLoader>
      <AppContent />
    </FontLoader>
  )
}

export default App

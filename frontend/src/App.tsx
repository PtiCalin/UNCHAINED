import { useEffect } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import TrackList from './components/TrackList'
import MetadataTool from './components/MetadataTool'
import MetadataDiff from './components/MetadataDiff'

export default function App() {
  useEffect(() => {
    // placeholder for app init
  }, [])
  return (
    <div className="min-h-screen">
      <header className="px-4 py-3 border-b border-neutral-800 flex items-center gap-4">
        <h1 className="text-xl font-semibold">UNCHAINED</h1>
        <nav className="flex gap-3 text-sm">
          <Link to="/" className="hover:underline">Library</Link>
          <Link to="/metadata" className="hover:underline">Metadata</Link>
        </nav>
      </header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<TrackList />} />
          <Route path="/metadata" element={<MetadataTool />} />
          <Route path="/metadata/diff/:trackId" element={<MetadataDiff />} />
        </Routes>
      </main>
    </div>
  )
}

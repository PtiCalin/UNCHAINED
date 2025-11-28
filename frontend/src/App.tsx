import { Routes, Route } from 'react-router-dom'
import MetadataDiff from './components/MetadataDiff'
import { AppShell } from './layouts/AppShell'
import SpotifyHome from './views/Player/Home'
import ArtistPage from './views/Player/Artist'
import AlbumPage from './views/Player/Album'
import ITunesPro from './views/Library/Index'
import VinylTimeline from './views/Collection/Timeline'
import MinimalPlayer from './views/Focus/Index'
import AnalyticsIndex from './views/Dashboard/Index'
import DJStudio from './views/Studio/Studio'

export default function App() {
  return (
    <Routes>
      <Route
        path="/studio"
        element={<DJStudio />}
      />
      <Route
        path="/*"
        element={
          <AppShell>
            <Routes>
              <Route path="/" element={<SpotifyHome />} />
              <Route path="/artists/:name" element={<ArtistPage />} />
              <Route path="/albums/:artist/:album" element={<AlbumPage />} />
              <Route path="/pro" element={<ITunesPro />} />
              <Route path="/vinyl" element={<VinylTimeline />} />
              <Route path="/minimal" element={<MinimalPlayer />} />
              <Route path="/analytics" element={<AnalyticsIndex />} />
              <Route path="/metadata/diff/:trackId" element={<MetadataDiff />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  )
}

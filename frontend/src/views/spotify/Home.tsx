import React from 'react'
import TrackList from '../../components/TrackList'

export default function SpotifyHome() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Home</h2>
      <div>
        <h3 className="text-lg mb-2">Recently Added</h3>
        <TrackList />
      </div>
    </div>
  )
}

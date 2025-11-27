import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="px-3 py-2 text-xs uppercase text-[#B3B3B3]">{title}</div>
    <div className="flex flex-col">{children}</div>
  </div>
)

const Item: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link to={to} className={`px-3 py-2 hover:bg-[#1e1e1e] ${active ? 'bg-[#1e1e1e] text-white' : 'text-[#B3B3B3]'}`}>{label}</Link>
  )
}

export const Sidebar: React.FC = () => {
  return (
    <aside className="bg-[#181818] border-r border-[#222] min-h-[calc(100vh-48px-56px)]">
      <nav className="py-2 space-y-3">
        <Section title="Primary Navigation">
          <Item to="/" label="Home" />
          <Item to="/artists" label="Artists" />
          <Item to="/albums" label="Albums" />
          <Item to="/songs" label="Songs" />
          <Item to="/playlists" label="Playlists" />
        </Section>
        <Section title="Metadata">
          <Item to="/genres" label="Genres" />
          <Item to="/keys" label="Keys (Camelot)" />
          <Item to="/bpm" label="BPM Range" />
          <Item to="/years" label="Years" />
          <Item to="/labels" label="Labels" />
          <Item to="/countries" label="Countries" />
        </Section>
        <Section title="Utility">
          <Item to="/imported-today" label="Imported Today" />
          <Item to="/unanalyzed" label="Unanalyzed Files" />
          <Item to="/missing-meta" label="Missing Metadata" />
          <Item to="/duplicates" label="Duplicates" />
          <Item to="/draft-mixes" label="Draft Mixes" />
        </Section>
        <Section title="User Tools">
          <Item to="/samples" label="Sample Library" />
          <Item to="/mixes" label="Mix Library" />
          <Item to="/pad-presets" label="Pad Presets" />
          <Item to="/analysis-graphs" label="Analysis Graphs" />
        </Section>
      </nav>
    </aside>
  )
}

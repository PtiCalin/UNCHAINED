import React from 'react';
import { toast } from '../store/useToastStore'
import { localScan } from '../services/api'

interface Props {
  open: boolean;
  onClose: () => void;
  onChoose: (choice: 'local' | 'itunes' | 'bandcamp') => void;
}

export const MediaChoiceModal: React.FC<Props> = ({ open, onClose, onChoose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="glass-panel neo-border rounded shadow-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-3">Choose media source</h2>
        <p className="text-sm mb-4">Select how you'd like to import or index new media.</p>
        <div className="space-y-2">
          <button
            className="w-full py-2 btn-primary focus-accent"
            onClick={async () => {
              onChoose('local')
              try {
                // @ts-ignore
                if ((window as any).__TAURI__) {
                  const dialog = await import('@tauri-apps/api/dialog')
                  const folder = await dialog.open({ directory: true, multiple: false })
                  if (folder && typeof folder === 'string') {
                    toast('Scanning folder...', 'info')
                    try {
                      const r = await localScan(folder, false)
                      toast(`Indexed ${r.indexed} files`, 'success')
                    } catch (e: any) {
                      toast(e.message || 'Scan failed', 'error')
                    }
                  }
                } else {
                  toast('Tauri environment not detected', 'error')
                }
              } catch (e: any) {
                toast(e.message || 'Folder pick failed', 'error')
              }
            }}
          >Local Scan</button>
          <button className="w-full py-2 btn-primary focus-accent" onClick={() => onChoose('itunes')}>iTunes Import</button>
          <button className="w-full py-2 btn-primary focus-accent" onClick={() => onChoose('bandcamp')}>Bandcamp Links</button>
        </div>
        <button className="mt-4 w-full py-2 btn-brutal focus-accent" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

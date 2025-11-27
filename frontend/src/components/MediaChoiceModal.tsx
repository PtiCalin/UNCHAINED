import React from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onChoose: (choice: 'local' | 'itunes' | 'bandcamp') => void;
}

export const MediaChoiceModal: React.FC<Props> = ({ open, onClose, onChoose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-3">Choose media source</h2>
        <p className="text-sm mb-4">Select how you'd like to import or index new media.</p>
        <div className="space-y-2">
          <button className="w-full py-2 bg-blue-600 text-white rounded" onClick={() => onChoose('local')}>Local Scan</button>
          <button className="w-full py-2 bg-blue-600 text-white rounded" onClick={() => onChoose('itunes')}>iTunes Import</button>
          <button className="w-full py-2 bg-blue-600 text-white rounded" onClick={() => onChoose('bandcamp')}>Bandcamp Links</button>
        </div>
        <button className="mt-4 w-full py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

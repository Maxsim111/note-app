import { useState, useEffect } from 'react';
import type { Folder, FolderChildren } from '../types';
import { SiblingDropdown } from './SiblingDropdown';
import { api } from '../hooks/useApi';

interface Props {
  folder: Folder;
  isLast: boolean;
  onNavigate: (id: string) => void;
}

export function BreadcrumbSegment({ folder, isLast, onNavigate }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [siblings, setSiblings] = useState<FolderChildren | null>(null);
  const [loadingSiblings, setLoadingSiblings] = useState(false);

  useEffect(() => {
    if (showDropdown && !siblings) {
      setLoadingSiblings(true);
      api.get<FolderChildren>(`/folders/${folder.id}/siblings`)
        .then(setSiblings)
        .catch(() => {})
        .finally(() => setLoadingSiblings(false));
    }
  }, [showDropdown, folder.id, siblings]);

  return (
    <div
      className="breadcrumb-segment"
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => { setShowDropdown(false); setSiblings(null); }}
    >
      <button
        className={`breadcrumb-btn ${isLast ? 'current' : ''}`}
        onClick={() => onNavigate(folder.id)}
      >
        {folder.name}
      </button>
      {showDropdown && (
        <SiblingDropdown
          siblings={siblings}
          loading={loadingSiblings}
          currentFolderId={folder.id}
          onSelect={(id) => { onNavigate(id); setShowDropdown(false); setSiblings(null); }}
        />
      )}
    </div>
  );
}

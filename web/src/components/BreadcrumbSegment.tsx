import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Folder, FolderChildren, Note } from '../types';
import { SiblingDropdown } from './SiblingDropdown';
import { api } from '../hooks/useApi';

interface Props {
  folder: Folder;
  isLast: boolean;
  onNavigate: (id: string) => void;
  onOpenNote: (note: Note) => void;
}

export function BreadcrumbSegment({ folder, isLast, onNavigate, onOpenNote }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [siblings, setSiblings] = useState<FolderChildren | null>(null);
  const [loadingSiblings, setLoadingSiblings] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const hideTimer = useRef<number>(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showDropdown && !siblings) {
      setLoadingSiblings(true);
      api.get<FolderChildren>(`/folders/${folder.id}/siblings`)
        .then(setSiblings)
        .catch(() => {})
        .finally(() => setLoadingSiblings(false));
    }
  }, [showDropdown, folder.id, siblings]);

  const open = () => {
    clearTimeout(hideTimer.current);
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setShowDropdown(true);
  };

  const close = () => {
    hideTimer.current = window.setTimeout(() => {
      setShowDropdown(false);
      setSiblings(null);
    }, 200);
  };

  return (
    <div className="breadcrumb-segment" onMouseEnter={open} onMouseLeave={close}>
      <button ref={btnRef} className={`breadcrumb-btn ${isLast ? 'current' : ''}`} onClick={() => onNavigate(folder.id)}>
        {folder.name}
      </button>
      {showDropdown && createPortal(
        <div style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 200 }} onMouseEnter={open} onMouseLeave={close}>
          <SiblingDropdown
            siblings={siblings} loading={loadingSiblings} currentFolderId={folder.id}
            onNavigate={(id) => { onNavigate(id); setShowDropdown(false); setSiblings(null); }}
            onOpenNote={(note) => { onOpenNote(note); setShowDropdown(false); setSiblings(null); }}
            onMouseEnter={open} onMouseLeave={close}
          />
        </div>,
        document.body
      )}
    </div>
  );
}

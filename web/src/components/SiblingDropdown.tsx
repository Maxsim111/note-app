import type { FolderChildren } from '../types';

interface Props {
  siblings: FolderChildren | null;
  loading: boolean;
  currentFolderId: string;
  onSelect: (id: string) => void;
}

export function SiblingDropdown({ siblings, loading, currentFolderId, onSelect }: Props) {
  return (
    <div className="sibling-dropdown">
      {loading && <div style={{ padding: 8, color: 'var(--text-dim)', fontSize: 12 }}>Loading...</div>}
      {siblings && siblings.folders.length === 0 && siblings.notes.length === 0 && (
        <div style={{ padding: 8, color: 'var(--text-dim)', fontSize: 12 }}>Empty</div>
      )}
      {siblings && siblings.folders.length > 0 && (
        <>
          <div className="sibling-divider">Folders</div>
          {siblings.folders.map((f) => (
            <div
              key={f.id}
              className="sibling-item"
              onClick={() => onSelect(f.id)}
              style={f.id === currentFolderId ? { background: 'rgba(88,166,255,0.1)' } : undefined}
            >
              <span className="si-icon">📁</span>
              <span className="si-color" style={{ backgroundColor: f.color }} />
              <span className="si-name">{f.name}</span>
            </div>
          ))}
        </>
      )}
      {siblings && siblings.notes.length > 0 && (
        <>
          <div className="sibling-divider">Notes</div>
          {siblings.notes.map((n) => (
            <div
              key={n.id}
              className="sibling-item"
              onClick={() => onSelect(n.folder_id)}
            >
              <span className="si-icon">📄</span>
              <span className="si-color" style={{ backgroundColor: n.color }} />
              <span className="si-name">{n.title}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

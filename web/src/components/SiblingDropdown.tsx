import type { FolderChildren, Note } from '../types';
import { CONTENT_TYPE_ICONS, getNoteExt } from '../utils';

interface Props {
  siblings: FolderChildren | null;
  loading: boolean;
  currentFolderId: string;
  onNavigate: (id: string) => void;
  onOpenNote: (note: Note) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function SiblingDropdown({ siblings, loading, currentFolderId, onNavigate, onOpenNote, onMouseEnter, onMouseLeave }: Props) {
  return (
    <div className="sibling-dropdown" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {loading && <div style={{ padding: 8, color: 'var(--text-dim)', fontSize: 12 }}>Loading...</div>}
      {siblings && siblings.folders.length === 0 && siblings.notes.length === 0 && (
        <div style={{ padding: 8, color: 'var(--text-dim)', fontSize: 12 }}>Empty</div>
      )}
      {siblings && siblings.folders.length > 0 && (
        <>
          <div className="sibling-divider">Folders</div>
          {siblings.folders.map((f) => (
            <div key={f.id} className="sibling-item"
              onClick={() => onNavigate(f.id)}
              style={f.id === currentFolderId ? { background: 'rgba(88,166,255,0.1)' } : undefined}>
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
            <div key={n.id} className="sibling-item"
              onClick={() => onOpenNote(n)}>
              <span className="si-icon">{CONTENT_TYPE_ICONS[n.content_type] || '📄'}</span>
              <span className="si-color" style={{ backgroundColor: n.color }} />
              <span className="si-name">{n.title}{getNoteExt(n)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

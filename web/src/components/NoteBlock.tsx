import type { Note } from '../types';
import { CONTENT_TYPE_ICONS } from '../utils';

interface Props {
  note: Note;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function NoteBlock({ note, onClick, onEdit, onDelete }: Props) {
  const icon = CONTENT_TYPE_ICONS[note.content_type] || '📄';
  const hasThumb = note.content_type === 'image' && note.thumbnail_path;

  return (
    <div
      className="block-card note"
      style={{ backgroundColor: note.color + '22', borderColor: note.color }}
      onClick={onClick}
    >
      <div className="block-actions">
        <button className="block-action-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }}>✎</button>
        <button className="block-action-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>✕</button>
      </div>
      {hasThumb ? (
        <img
          className="block-thumb"
          src={`/api/thumbnails/${note.id}`}
          alt={note.title}
        />
      ) : (
        <span className="block-icon">{icon}</span>
      )}
      <span className="block-name">{note.title}</span>
      {note.content && (
        <span className="block-meta">{note.content.slice(0, 60)}{note.content.length > 60 ? '...' : ''}</span>
      )}
      {note.file_name && (
        <span className="block-meta">{note.file_name}</span>
      )}
    </div>
  );
}

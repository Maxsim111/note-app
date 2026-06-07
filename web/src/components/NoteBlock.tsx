import type { Note } from '../types';
import { CONTENT_TYPE_ICONS, getNoteExt } from '../utils';

interface Props {
  note: Note;
  onClick: () => void;
  onDelete: () => void;
  onBookmark: (id: string, bookmarked: boolean) => void;
}

export function NoteBlock({ note, onClick, onDelete, onBookmark }: Props) {
  const icon = CONTENT_TYPE_ICONS[note.content_type] || '📄';
  const hasThumb = note.content_type === 'image' && note.thumbnail_path;

  return (
    <div className="block-card note" style={{ borderLeftColor: note.color }} onClick={onClick} draggable
      onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ id: note.id, type: 'note' })); }}>
      <div className="block-actions">
        <button className={`block-action-btn ${note.bookmarked ? 'bookmarked' : ''}`} onClick={(e) => { e.stopPropagation(); onBookmark(note.id, note.bookmarked); }} title={note.bookmarked ? 'Remove bookmark' : 'Add bookmark'}>🔖</button>
        <button className="block-action-btn btn-trash" onClick={(e) => { e.stopPropagation(); onDelete(); }}>🗑</button>
      </div>
      {hasThumb ? <img className="block-thumb" src={`/api/thumbnails/${note.id}`} alt={note.title} /> : <span className="block-icon">{icon}</span>}
      <span className="block-name">{note.title}{getNoteExt(note)}</span>
      {note.content && <span className="block-meta">{note.content.slice(0, 60)}{note.content.length > 60 ? '...' : ''}</span>}
    </div>
  );
}

import { useState } from 'react';
import type { Note } from '../types';
import { Modal } from './Modal';
import { ColorPicker } from './ColorPicker';

interface Props {
  note: Note | null;
  onSave: (data: { title: string; content: string; color: string; content_type: string }) => void;
  onClose: () => void;
}

export function NoteEditor({ note, onSave, onClose }: Props) {
  const isNew = !note;
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || '#58a6ff');
  const [contentType, setContentType] = useState<string>(note?.content_type || 'text');

  const isFile = note && note.file_name;
  const isImage = note?.content_type === 'image';

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), content, color, content_type: contentType });
  };

  return (
    <Modal title={isNew ? 'New Note' : 'Edit Note'} onClose={onClose}>
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        />
      </div>

      {isFile && (
        <div className="file-preview">
          {isImage && note.thumbnail_path && (
            <img src={`/api/thumbnails/${note.id}`} alt={note.title} />
          )}
          <div className="file-info">
            {note.file_name} — {note.file_size != null ? `${(note.file_size / 1024).toFixed(1)} KB` : ''}
          </div>
        </div>
      )}

      {!isFile && (
        <>
          <div className="form-group">
            <label>Content Type</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
              <option value="text">Plain Text</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={10}
            />
          </div>
        </>
      )}

      {isFile && (
        <div className="form-group">
          <label>Caption</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a caption..."
            rows={3}
          />
        </div>
      )}

      <div className="form-group">
        <label>Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="form-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>
          {isNew ? 'Create' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

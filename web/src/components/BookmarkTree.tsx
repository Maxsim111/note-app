import { useState, useEffect } from 'react';
import type { Folder, Note } from '../types';
import { api } from '../hooks/useApi';
import { BookmarkPicker } from './BookmarkPicker';
import { FolderEditor } from './FolderEditor';
import { CONTENT_TYPE_ICONS, getNoteExt } from '../utils';

interface Props {
  onOpenNote: (note: Note) => void;
  onRefresh: () => void;
}

export function BookmarkTree({ onOpenNote, onRefresh }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarks, setBookmarks] = useState<Note[]>([]);
  const [bookmarkMap, setBookmarkMap] = useState<Record<string, string>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const load = async () => {
    const [f, b, ids] = await Promise.all([
      api.get<Folder[]>('/bookmarks/folders'), api.get<Note[]>('/bookmarks'), api.get<Record<string, string>>('/bookmarks/ids'),
    ]);
    setFolders(f || []); setBookmarks(b || []); setBookmarkMap(ids || {});
  };

  useEffect(() => { load(); }, []);

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this group? Bookmarks will become ungrouped.')) return;
    await api.del(`/bookmarks/folders/${id}`); load(); onRefresh();
  };

  const handleDeleteBookmark = async (noteId: string) => {
    await api.del(`/bookmarks/${noteId}`); load(); onRefresh();
  };

  const handleSaveFolder = async (data: { name: string; color: string; parent_id?: string }) => {
    if (editingFolder) { await api.put(`/bookmarks/folders/${editingFolder.id}`, data); }
    setEditingFolder(null); load(); onRefresh();
  };

  const handleDropOnFolder = async (folderId: string, e: React.DragEvent) => {
    e.preventDefault();
    try {
      const d = JSON.parse(e.dataTransfer.getData('application/json'));
      if (d.noteId) {
        await api.put(`/bookmarks/${d.noteId}/move`, { folder_id: folderId });
        load(); onRefresh();
      }
    } catch {}
  };

  const handleDropOnUngrouped = async (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const d = JSON.parse(e.dataTransfer.getData('application/json'));
      if (d.noteId) {
        await api.put(`/bookmarks/${d.noteId}/move`, { folder_id: '' });
        load(); onRefresh();
      }
    } catch {}
  };

  const bookmarksInFolder = (folderId: string) => bookmarks.filter((b) => bookmarkMap[b.id] === folderId);
  const ungroupedBookmarks = bookmarks.filter((b) => !bookmarkMap[b.id] || bookmarkMap[b.id] === '');

  return (
    <div className="bookmark-tree">
      <div className="bookmark-header">
        <span>Bookmarks</span>
        <button className="btn btn-sm" onClick={() => setShowPicker(true)}>+</button>
      </div>

      {folders.map((f) => (
        <div key={f.id} className="bookmark-folder">
          <div className="tree-row" style={{ paddingLeft: 12 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropOnFolder(f.id, e)}>
            <span className="tree-icon">📁</span>
            <span className="tree-color" style={{ backgroundColor: f.color }} />
            <span className="tree-name">{f.name}</span>
            <button className="tree-action-btn" onClick={() => setEditingFolder(f)} style={{ opacity: 1 }} title="Edit">✎</button>
            <button className="tree-action-btn" onClick={() => handleDeleteFolder(f.id)} style={{ opacity: 1 }} title="Delete group">🗑</button>
          </div>
          {bookmarksInFolder(f.id).map((note) => (
            <div key={note.id} className="tree-row" style={{ paddingLeft: 28 }} onClick={() => onOpenNote(note)}
              draggable onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ noteId: note.id })); }}>
              <span className="tree-icon">{CONTENT_TYPE_ICONS[note.content_type] || '📄'}</span>
              <span className="tree-color" style={{ backgroundColor: note.color }} />
              <span className="tree-name">{note.title}{getNoteExt(note)}</span>
              <button className="tree-action-btn" onClick={(e) => { e.stopPropagation(); handleDeleteBookmark(note.id); }} style={{ opacity: 1 }} title="Remove bookmark">×</button>
            </div>
          ))}
        </div>
      ))}

      {ungroupedBookmarks.length > 0 && (
        <div className="bookmark-folder"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnUngrouped}>
          <div className="tree-row" style={{ paddingLeft: 12 }}>
            <span className="tree-icon">📌</span>
            <span className="tree-name" style={{ color: 'var(--text-dim)' }}>Ungrouped</span>
          </div>
          {ungroupedBookmarks.map((note) => (
            <div key={note.id} className="tree-row" style={{ paddingLeft: 28 }} onClick={() => onOpenNote(note)}
              draggable onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ noteId: note.id })); }}>
              <span className="tree-icon">{CONTENT_TYPE_ICONS[note.content_type] || '📄'}</span>
              <span className="tree-color" style={{ backgroundColor: note.color }} />
              <span className="tree-name">{note.title}{getNoteExt(note)}</span>
              <button className="tree-action-btn" onClick={(e) => { e.stopPropagation(); handleDeleteBookmark(note.id); }} style={{ opacity: 1 }} title="Remove bookmark">×</button>
            </div>
          ))}
        </div>
      )}

      {showPicker && (
        <BookmarkPicker folders={folders} noteId="" onSelect={async (_nid, fid, name, color) => {
          if (!fid && name) { await api.post('/bookmarks/folders', { name, color: color || '#d2991d' }); }
          setShowPicker(false); load(); onRefresh();
        }} onClose={() => setShowPicker(false)} />
      )}

      {editingFolder && (
        <FolderEditor folder={editingFolder} onSave={handleSaveFolder} onClose={() => setEditingFolder(null)} allFolders={[]} />
      )}
    </div>
  );
}

import { useState } from 'react';
import type { Folder } from '../types';
import { Modal } from './Modal';
import { ColorPicker } from './ColorPicker';

interface Props {
  folders: Folder[];
  noteId: string;
  onSelect: (noteId: string, folderId: string, name: string, color: string) => void;
  onClose: () => void;
}

export function BookmarkPicker({ folders, noteId, onSelect, onClose }: Props) {
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#d2991d');
  const [creating, setCreating] = useState(false);

  return (
    <Modal title="Add Bookmark" onClose={onClose}>
      {!creating && (
        <>
          <div className="form-group">
            <label>Select Group</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">— No group —</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <button className="btn btn-sm" onClick={() => setCreating(true)}>+ Create New Group</button>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSelect(noteId, selectedId, '', '')}>Confirm</button>
          </div>
        </>
      )}
      {creating && (
        <>
          <div className="form-group">
            <label>Group Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name" autoFocus />
          </div>
          <div className="form-group">
            <label>Color</label>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>
          <div className="form-actions">
            <button className="btn btn-sm" onClick={() => setCreating(false)}>← Back</button>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSelect(noteId, '', newName, newColor)} disabled={!newName.trim()}>
              Create & Confirm
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

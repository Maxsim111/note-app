import { useState } from 'react';
import type { Folder } from '../types';
import { Modal } from './Modal';
import { ColorPicker } from './ColorPicker';

interface Props {
  folder: Folder | null;
  onSave: (data: { name: string; color: string }) => void;
  onClose: () => void;
}

export function FolderEditor({ folder, onSave, onClose }: Props) {
  const isNew = !folder;
  const [name, setName] = useState(folder?.name || '');
  const [color, setColor] = useState(folder?.color || '#3fb950');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <Modal title={isNew ? 'New Folder' : 'Edit Folder'} onClose={onClose}>
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        />
      </div>
      <div className="form-group">
        <label>Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="form-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
          {isNew ? 'Create' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

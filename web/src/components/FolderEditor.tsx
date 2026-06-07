import { useState } from 'react';
import type { Folder, TreeNode } from '../types';
import { Modal } from './Modal';
import { ColorPicker } from './ColorPicker';

interface Props {
  folder: Folder | null;
  onSave: (data: { name: string; color: string; parent_id?: string }) => void;
  onClose: () => void;
  allFolders: TreeNode[];
}

function flattenFolders(nodes: TreeNode[]): { id: string; name: string }[] {
  let result: { id: string; name: string }[] = [];
  for (const n of nodes) {
    if (n.type === 'folder') {
      result.push({ id: n.id, name: n.name });
      result = result.concat(flattenFolders(n.children));
    }
  }
  return result;
}

export function FolderEditor({ folder, onSave, onClose, allFolders }: Props) {
  const isNew = !folder;
  const [name, setName] = useState(folder?.name || '');
  const [color, setColor] = useState(folder?.color || '#3fb950');
  const [moveTo, setMoveTo] = useState('');

  const folderList = flattenFolders(allFolders);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      color,
      ...(moveTo ? { parent_id: moveTo } : {}),
    });
  };

  return (
    <Modal title={isNew ? 'New Folder' : 'Edit Folder'} onClose={onClose}>
      <div className="form-group">
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }} />
      </div>
      <div className="form-group">
        <label>Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      {!isNew && (
        <div className="form-group">
          <label>Move to Folder</label>
          <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            <option value="">— Keep current —</option>
            {folderList.filter((f) => f.id !== folder?.id).map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="form-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
          {isNew ? 'Create' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

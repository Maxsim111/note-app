import type { Folder } from '../types';

interface Props {
  folder: Folder;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FolderBlock({ folder, onClick, onEdit, onDelete }: Props) {
  return (
    <div
      className="block-card folder"
      style={{ backgroundColor: folder.color + '22', borderColor: folder.color }}
      onClick={onClick}
    >
      <div className="block-actions">
        <button className="block-action-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }}>✎</button>
        <button className="block-action-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>✕</button>
      </div>
      <span className="block-icon">📁</span>
      <span className="block-name">{folder.name}</span>
    </div>
  );
}

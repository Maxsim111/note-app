import type { Folder } from '../types';

interface Props {
  folder: Folder;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FolderBlock({ folder, onClick, onEdit, onDelete }: Props) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: folder.id, type: 'folder' }));
    (e.target as HTMLElement).classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('dragging');
  };

  return (
    <div
      className="block-card folder"
      style={{ borderLeftColor: folder.color }}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="block-actions">
        <button className="block-action-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }}>✎</button>
        <button className="block-action-btn btn-trash" onClick={(e) => { e.stopPropagation(); onDelete(); }}>🗑</button>
      </div>
      <span className="block-icon">📁</span>
      <span className="block-name">{folder.name}</span>
    </div>
  );
}

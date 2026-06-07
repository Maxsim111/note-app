import { useState } from 'react';
import type { TreeNode } from '../types';
import { CONTENT_TYPE_ICONS, getTreeNodeExt } from '../utils';

interface Props {
  node: TreeNode;
  depth: number;
  currentFolderId: string;
  onSelect: (id: string) => void;
  onEdit: (id: string, type: 'folder' | 'note') => void;
  onOpenNote: (id: string) => void;
  onDrop: (targetId: string, dragId: string, dragType: string) => void;
  onBookmark: (id: string, bookmarked: boolean) => void;
}

export function TreeNodeComponent({ node, depth, currentFolderId, onSelect, onEdit, onOpenNote, onDrop, onBookmark }: Props) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [dragOver, setDragOver] = useState(false);
  const hasChildren = node.children.length > 0;
  const isFolder = node.type === 'folder';
  const isNote = node.type === 'note';
  const icon = isFolder ? '📁' : (CONTENT_TYPE_ICONS[node.content_type || ''] || '📄');
  const displayName = node.name + getTreeNodeExt(node);

  return (
    <div className="tree-node">
      <div className={`tree-row ${node.id === currentFolderId ? 'active' : ''} ${dragOver ? 'drop-target' : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }} draggable
        onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ id: node.id, type: node.type })); }}
        onClick={() => { if (isFolder) { onSelect(node.id); if (hasChildren) setExpanded(!expanded); } else onOpenNote(node.id); }}
        onDragOver={(e) => { if (isFolder) { e.preventDefault(); setDragOver(true); } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!isFolder) return;
          try { const d = JSON.parse(e.dataTransfer.getData('application/json')); if (d.id !== node.id) onDrop(node.id, d.id, d.type); } catch {} }}>
        <span className={`tree-chevron ${expanded ? 'open' : ''}`} onClick={(e) => { e.stopPropagation(); if (hasChildren) setExpanded(!expanded); }}>{hasChildren ? '▶' : ''}</span>
        <span className="tree-icon">{icon}</span>
        <span className="tree-color" style={{ backgroundColor: node.color }} />
        <span className="tree-name">{displayName}</span>
        {isNote && <button className={`tree-action-btn ${node.bookmarked ? 'bookmarked' : ''}`} onClick={(e) => { e.stopPropagation(); onBookmark(node.id, node.bookmarked); }}>🔖</button>}
        <button className="tree-detail-btn" onClick={(e) => { e.stopPropagation(); onEdit(node.id, node.type); }}>⋮</button>
      </div>
      {expanded && hasChildren && <div className="tree-children">{node.children.map((c) => <TreeNodeComponent key={c.id} node={c} depth={depth+1} currentFolderId={currentFolderId} onSelect={onSelect} onEdit={onEdit} onOpenNote={onOpenNote} onDrop={onDrop} onBookmark={onBookmark} />)}</div>}
    </div>
  );
}

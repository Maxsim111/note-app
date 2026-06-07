import { useState } from 'react';
import type { TreeNode } from '../types';

interface Props {
  node: TreeNode;
  depth: number;
  currentFolderId: string;
  onSelect: (id: string) => void;
}

export function TreeNodeComponent({ node, depth, currentFolderId, onSelect }: Props) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const isActive = node.id === currentFolderId;

  return (
    <div className="tree-node">
      <div
        className={`tree-row ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        <span
          className={`tree-chevron ${expanded ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded(!expanded);
          }}
        >
          {hasChildren ? '▶' : ''}
        </span>
        <span className="tree-icon">📁</span>
        <span className="tree-color" style={{ backgroundColor: node.color }} />
        <span className="tree-name">{node.name}</span>
      </div>
      {expanded && hasChildren && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              currentFolderId={currentFolderId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

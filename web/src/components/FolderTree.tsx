import type { TreeNode } from '../types';
import { TreeNodeComponent } from './TreeNode';

interface Props {
  tree: TreeNode[];
  currentFolderId: string;
  onSelect: (id: string) => void;
}

export function FolderTree({ tree, currentFolderId, onSelect }: Props) {
  return (
    <div>
      {tree.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          depth={0}
          currentFolderId={currentFolderId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

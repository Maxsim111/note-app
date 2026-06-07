import type { TreeNode } from '../types';
import { TreeNodeComponent } from './TreeNode';

interface Props {
  tree: TreeNode[];
  currentFolderId: string;
  onSelect: (id: string) => void;
  onEdit: (id: string, type: 'folder' | 'note') => void;
  onOpenNote: (id: string) => void;
  onDrop: (targetId: string, dragId: string, dragType: string) => void;
  onBookmark: (id: string, bookmarked: boolean) => void;
}

export function FolderTree({ tree, currentFolderId, onSelect, onEdit, onOpenNote, onDrop, onBookmark }: Props) {
  return <div>{tree.map((n) => <TreeNodeComponent key={n.id} node={n} depth={0} currentFolderId={currentFolderId} onSelect={onSelect} onEdit={onEdit} onOpenNote={onOpenNote} onDrop={onDrop} onBookmark={onBookmark} />)}</div>;
}

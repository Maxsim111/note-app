import type { Folder, Note } from '../types';
import { BreadcrumbSegment } from './BreadcrumbSegment';

interface Props {
  path: Folder[];
  onNavigate: (id: string) => void;
  onOpenNote: (note: Note) => void;
}

export function Breadcrumb({ path, onNavigate, onOpenNote }: Props) {
  return (
    <div className="breadcrumb-bar">
      {path.map((folder, i) => (
        <span key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BreadcrumbSegment folder={folder} isLast={i === path.length - 1} onNavigate={onNavigate} onOpenNote={onOpenNote} />
          {i < path.length - 1 && <span className="breadcrumb-sep">›</span>}
        </span>
      ))}
    </div>
  );
}

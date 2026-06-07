import type { Folder } from '../types';
import { BreadcrumbSegment } from './BreadcrumbSegment';

interface Props {
  path: Folder[];
  onNavigate: (id: string) => void;
}

export function Breadcrumb({ path, onNavigate }: Props) {
  return (
    <div className="breadcrumb-bar">
      {path.map((folder, i) => (
        <span key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BreadcrumbSegment
            folder={folder}
            isLast={i === path.length - 1}
            onNavigate={onNavigate}
          />
          {i < path.length - 1 && <span className="breadcrumb-sep">›</span>}
        </span>
      ))}
    </div>
  );
}

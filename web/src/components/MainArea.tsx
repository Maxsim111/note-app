import type { Folder, FolderChildren, Note } from '../types';
import { Breadcrumb } from './Breadcrumb';
import { ContentGrid } from './ContentGrid';

interface Props {
  breadcrumb: Folder[];
  children: FolderChildren;
  currentFolderId: string;
  onNavigate: (id: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onEditNote: (note: Note) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteNote: (id: string) => void;
  onDeleteFolder: (id: string) => void;
}

export function MainArea({
  breadcrumb,
  children,
  currentFolderId,
  onNavigate,
  onCreateNote,
  onCreateFolder,
  onEditNote,
  onEditFolder,
  onDeleteNote,
  onDeleteFolder,
}: Props) {
  return (
    <div className="main-panel">
      <Breadcrumb path={breadcrumb} onNavigate={onNavigate} />
      <div className="content-area">
        <div className="toolbar">
          <button className="btn btn-primary" onClick={onCreateFolder}>
            + Create Folder
          </button>
          <button className="btn" onClick={onCreateNote}>
            + Create Note
          </button>
        </div>
        <ContentGrid
          folders={children.folders}
          notes={children.notes}
          currentFolderId={currentFolderId}
          onFolderClick={onNavigate}
          onNoteClick={onEditNote}
          onEditFolder={onEditFolder}
          onDeleteNote={onDeleteNote}
          onDeleteFolder={onDeleteFolder}
          onCreateFolder={onCreateFolder}
          onCreateNote={onCreateNote}
        />
      </div>
    </div>
  );
}

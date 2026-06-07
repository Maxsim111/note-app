import type { Folder, Note } from '../types';
import { FolderBlock } from './FolderBlock';
import { NoteBlock } from './NoteBlock';

interface Props {
  folders: Folder[];
  notes: Note[];
  currentFolderId: string;
  onFolderClick: (id: string) => void;
  onNoteClick: (note: Note) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteNote: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateFolder: () => void;
  onCreateNote: () => void;
}

export function ContentGrid({
  folders,
  notes,
  onFolderClick,
  onNoteClick,
  onEditFolder,
  onDeleteNote,
  onDeleteFolder,
  onCreateFolder,
  onCreateNote,
}: Props) {
  const isEmpty = folders.length === 0 && notes.length === 0;

  return (
    <div className="content-grid">
      {folders.map((folder) => (
        <FolderBlock
          key={folder.id}
          folder={folder}
          onClick={() => onFolderClick(folder.id)}
          onEdit={() => onEditFolder(folder)}
          onDelete={() => onDeleteFolder(folder.id)}
        />
      ))}
      {notes.map((note) => (
        <NoteBlock
          key={note.id}
          note={note}
          onClick={() => onNoteClick(note)}
          onEdit={() => onNoteClick(note)}
          onDelete={() => onDeleteNote(note.id)}
        />
      ))}
      {/* New item buttons */}
      <div className="block-card block-new" onClick={onCreateFolder}>
        <span className="block-icon">+</span>
        <span className="block-name">New Folder</span>
      </div>
      <div className="block-card block-new" onClick={onCreateNote}>
        <span className="block-icon">+</span>
        <span className="block-name">New Note</span>
      </div>
      {isEmpty && (
        <div className="empty-folder" style={{ gridColumn: '1 / -1' }}>
          <p>This folder is empty.</p>
          <p style={{ marginTop: 4 }}>Create a folder or note to get started.</p>
        </div>
      )}
    </div>
  );
}

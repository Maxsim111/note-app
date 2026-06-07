import type { Folder, Note } from '../types';
import { FolderBlock } from './FolderBlock';
import { NoteBlock } from './NoteBlock';

interface Props {
  folders: Folder[];
  notes: Note[];
  onFolderClick: (id: string) => void;
  onNoteClick: (note: Note) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteNote: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onBookmark: (id: string, bookmarked: boolean) => void;
}

export function ContentGrid({ folders, notes, onFolderClick, onNoteClick, onEditFolder, onDeleteNote, onDeleteFolder, onBookmark }: Props) {
  return (
    <div className="content-grid">
      {folders.map((folder) => (
        <FolderBlock key={folder.id} folder={folder} onClick={() => onFolderClick(folder.id)} onEdit={() => onEditFolder(folder)} onDelete={() => onDeleteFolder(folder.id)} />
      ))}
      {notes.map((note) => (
        <NoteBlock key={note.id} note={note} onClick={() => onNoteClick(note)} onDelete={() => onDeleteNote(note.id)} onBookmark={onBookmark} />
      ))}
    </div>
  );
}

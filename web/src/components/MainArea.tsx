import { useRef } from 'react';
import type { Folder, FolderChildren, Note } from '../types';
import { api } from '../hooks/useApi';
import { Breadcrumb } from './Breadcrumb';
import { ContentGrid } from './ContentGrid';

interface Props {
  breadcrumb: Folder[];
  children: FolderChildren;
  currentFolderId: string;
  onNavigate: (id: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onOpenNote: (note: Note) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteNote: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onRefresh: () => void;
  onBookmark: (id: string, bookmarked: boolean) => void;
}

export function MainArea({ breadcrumb, children, currentFolderId, onNavigate, onCreateNote, onCreateFolder, onOpenNote, onEditFolder, onDeleteNote, onDeleteFolder, onRefresh, onBookmark }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData(); fd.append('file', files[i]); fd.append('folder_id', currentFolderId);
      try { await api.upload('/upload', fd); } catch (err) { console.error('Upload failed', err); }
    }
    onRefresh(); if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="main-panel">
      <Breadcrumb path={breadcrumb} onNavigate={onNavigate} onOpenNote={onOpenNote} />
      <div className="content-area">
        <div className="toolbar">
          <button className="btn btn-primary" onClick={onCreateFolder}>+ Create Folder</button>
          <button className="btn" onClick={onCreateNote}>+ Create Note</button>
          <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>📤 Upload</button>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
        </div>
        <ContentGrid folders={children.folders} notes={children.notes} onFolderClick={onNavigate} onNoteClick={onOpenNote} onEditFolder={onEditFolder} onDeleteNote={onDeleteNote} onDeleteFolder={onDeleteFolder} onBookmark={onBookmark} />
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { api } from '../hooks/useApi';
import { getNoteExt } from '../utils';
import type { TreeNode, Folder, FolderChildren, Note } from '../types';
import { SettingsPanel } from './SettingsPanel';
import { FolderTree } from './FolderTree';
import { SearchPanel } from './SearchPanel';
import { BookmarkTree } from './BookmarkTree';
import { BookmarkPicker } from './BookmarkPicker';
import { MainArea } from './MainArea';
import { NotePage } from './NotePage';
import { NoteEditor } from './NoteEditor';
import { FolderEditor } from './FolderEditor';
import { SettingsModal } from './SettingsModal';
import { ConfirmDialog } from './ConfirmDialog';

export function NoteApp() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [breadcrumb, setBreadcrumb] = useState<Folder[]>([]);
  const [children, setChildren] = useState<FolderChildren>({ folders: [], notes: [] });
  const [loading, setLoading] = useState(true);

  const [openTabs, setOpenTabs] = useState<Note[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [creatingNote, setCreatingNote] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<'folder' | 'note' | null>(null);

  // UI modes
  const [showSettings, setShowSettings] = useState(false);
  const [treeVisible, setTreeVisible] = useState(true);
  const [treeMode, setTreeMode] = useState<'folder' | 'search' | 'bookmark'>('folder');

  // Bookmark state
  const [bookmarkingNoteId, setBookmarkingNoteId] = useState<string | null>(null);
  const [unbookmarkingNoteId, setUnbookmarkingNoteId] = useState<string | null>(null);
  const [showBookmarkPicker, setShowBookmarkPicker] = useState(false);
  const [bookmarkFolderList, setBookmarkFolderList] = useState<Folder[]>([]);

  // Load settings on mount
  useEffect(() => {
    api.get<Record<string, string>>('/settings').then((s) => {
      if (s.theme) applyTheme(s.theme as 'dark' | 'light');
      if (s.accent_color) document.documentElement.style.setProperty('--accent', s.accent_color);
      if (s.font_size) { document.documentElement.style.setProperty('--font-size', s.font_size + 'px'); document.body.style.fontSize = s.font_size + 'px'; }
    }).catch(() => {});
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    if (t === 'light') {
      document.documentElement.style.setProperty('--bg', '#ffffff'); document.documentElement.style.setProperty('--card-bg', '#f6f8fa');
      document.documentElement.style.setProperty('--text', '#24292f'); document.documentElement.style.setProperty('--text-dim', '#656d76'); document.documentElement.style.setProperty('--border', '#d0d7de');
    } else {
      document.documentElement.style.setProperty('--bg', '#0d1117'); document.documentElement.style.setProperty('--card-bg', '#161b22');
      document.documentElement.style.setProperty('--text', '#c9d1d9'); document.documentElement.style.setProperty('--text-dim', '#8b949e'); document.documentElement.style.setProperty('--border', '#30363d');
    }
  };

  const loadBookmarkFolders = async () => {
    try { const fl = await api.get<Folder[]>('/bookmarks/folders'); setBookmarkFolderList(fl || []); } catch {}
  };

  const handleToggleTree = () => setTreeVisible((v) => !v);

  const handleShowFolderTree = () => {
    setTreeMode('folder');
    if (!treeVisible) setTreeVisible(true);
  };

  const handleToggleSearch = () => {
    if (treeMode === 'search') { setTreeMode('folder'); return; }
    setTreeMode('search');
    if (!treeVisible) setTreeVisible(true);
  };

  const handleToggleBookmarks = () => {
    if (treeMode === 'bookmark') { setTreeMode('folder'); return; }
    loadBookmarkFolders();
    setTreeMode('bookmark');
    if (!treeVisible) setTreeVisible(true);
  };

  // Bookmark a note
  const handleBookmark = async (noteId: string, isBookmarked: boolean) => {
    if (isBookmarked) {
      setUnbookmarkingNoteId(noteId);
    } else {
      await loadBookmarkFolders();
      setBookmarkingNoteId(noteId);
      setShowBookmarkPicker(true);
    }
  };

  const confirmBookmark = async (noteId: string, folderId: string, name: string, color: string) => {
    try {
      let fid = folderId;
      if (!fid && name) { const f = await api.post<Folder>('/bookmarks/folders', { name, color: color || '#d2991d' }); if (f?.id) fid = f.id; }
      await api.post('/bookmarks', { note_id: noteId, folder_id: fid || '' });
    } catch (e) { console.error('Bookmark failed', e); }
    setShowBookmarkPicker(false);
    setBookmarkingNoteId(null);
    refreshTree();
    handleRefresh();
  };

  const confirmUnbookmark = async () => {
    if (!unbookmarkingNoteId) return;
    try { await api.del(`/bookmarks/${unbookmarkingNoteId}`); } catch (e) { console.error('Unbookmark failed', e); }
    setUnbookmarkingNoteId(null);
    refreshTree();
    handleRefresh();
  };

  // Load root folder ID and tree
  useEffect(() => {
    (async () => {
      try {
        const { root_folder_id } = await api.get<{ root_folder_id: string }>('/folders/root');
        setCurrentFolderId(root_folder_id);
        const treeData = await api.get<TreeNode[]>('/folders/tree');
        setTree(treeData);
      } catch (e) {
        console.error('Failed to load app', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadFolder = useCallback(async (folderId: string) => {
    try {
      const [childrenData, breadcrumbData] = await Promise.all([
        api.get<FolderChildren>(`/folders/${folderId}/children`),
        api.get<Folder[]>(`/folders/${folderId}/breadcrumb`),
      ]);
      setChildren(childrenData);
      setBreadcrumb(breadcrumbData);
    } catch (e) {
      console.error('Failed to load folder', e);
    }
  }, []);

  useEffect(() => {
    if (currentFolderId) loadFolder(currentFolderId);
  }, [currentFolderId, loadFolder]);

  const refreshTree = useCallback(async () => {
    const treeData = await api.get<TreeNode[]>('/folders/tree');
    setTree(treeData);
  }, []);

  const handleRefresh = useCallback(() => {
    loadFolder(currentFolderId);
  }, [currentFolderId, loadFolder]);

  const handleOpenNote = useCallback((note: Note) => {
    setOpenTabs((prev) => {
      const exists = prev.find((t) => t.id === note.id);
      if (exists) {
        setActiveTabId(note.id);
        return prev;
      }
      setActiveTabId(note.id);
      return [...prev, note];
    });
  }, []);

  const handleCloseTab = useCallback((id: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        setActiveTabId(null);
      } else if (activeTabId === id) {
        setActiveTabId(next[next.length - 1].id);
      }
      return next;
    });
  }, [activeTabId]);

  const handleNoteUpdated = useCallback((note: Note) => {
    setOpenTabs((prev) => prev.map((t) => (t.id === note.id ? note : t)));
    handleRefresh();
    refreshTree();
  }, [handleRefresh, refreshTree]);

  const handleTreeOpenNote = useCallback(async (id: string) => {
    try {
      const n = await api.get<Note>(`/notes/${id}`);
      handleOpenNote(n);
    } catch {}
  }, [handleOpenNote]);

  const handleTreeEdit = useCallback(async (id: string, type: 'folder' | 'note') => {
    if (type === 'folder') {
      const findNode = (nodes: TreeNode[]): TreeNode | null => {
        for (const n of nodes) {
          if (n.id === id) return n;
          const found = findNode(n.children);
          if (found) return found;
        }
        return null;
      };
      const node = findNode(tree);
      if (node) {
        setEditingFolder({ id: node.id, name: node.name, color: node.color, parent_id: null, sort_order: 0, created_at: '', updated_at: '' });
      }
    } else {
      try {
        const n = await api.get<Note>(`/notes/${id}`);
        setEditingNote(n);
      } catch {}
    }
  }, [tree]);

  const handleDrop = useCallback(async (targetId: string, dragId: string, dragType: string) => {
    try {
      if (dragType === 'folder') {
        await api.put(`/folders/${dragId}/move`, { parent_id: targetId });
      } else {
        await api.put(`/notes/${dragId}/move`, { folder_id: targetId });
      }
      refreshTree();
      handleRefresh();
    } catch (e) {
      console.error('Move failed', e);
    }
  }, [refreshTree, handleRefresh]);

  const handleSaveNote = async (data: { title: string; content: string; color: string; content_type: string; folder_id?: string }) => {
    if (creatingNote) {
      await api.post('/notes', { ...data, folder_id: data.folder_id || currentFolderId });
    } else if (editingNote) {
      const updated = await api.put<Note>(`/notes/${editingNote.id}`, data);
      setOpenTabs((prev) => prev.map((t) => (t.id === editingNote.id ? updated : t)));
    }
    setCreatingNote(false);
    setEditingNote(null);
    handleRefresh();
    refreshTree();
  };

  const handleSaveFolder = async (data: { name: string; color: string; parent_id?: string }) => {
    if (creatingFolder) {
      await api.post('/folders', { ...data, parent_id: data.parent_id || currentFolderId });
    } else if (editingFolder) {
      await api.put(`/folders/${editingFolder.id}`, data);
    }
    setCreatingFolder(false);
    setEditingFolder(null);
    handleRefresh();
    refreshTree();
  };

  const handleDelete = async () => {
    if (!deletingId || !deletingType) return;
    if (deletingType === 'folder') {
      await api.del(`/folders/${deletingId}`);
      refreshTree();
    } else {
      await api.del(`/notes/${deletingId}`);
      handleCloseTab(deletingId);
    }
    setDeletingId(null);
    setDeletingType(null);
    if (deletingType === 'folder' && deletingId === currentFolderId && breadcrumb.length > 1) {
      setCurrentFolderId(breadcrumb[breadcrumb.length - 2].id);
    } else {
      handleRefresh();
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  const showTabBar = openTabs.length > 0;
  const activeNote = activeTabId ? openTabs.find((t) => t.id === activeTabId) : null;

  return (
    <div className={`app-layout ${!treeVisible ? 'tree-hidden' : ''}`}>
      <SettingsPanel
        onToggleTree={handleToggleTree}
        onShowFolderTree={handleShowFolderTree}
        onToggleSearch={handleToggleSearch}
        onToggleBookmarks={handleToggleBookmarks}
        onOpenSettings={() => setShowSettings(true)}
        treeVisible={treeVisible}
        treeMode={treeMode}
      />

      {treeVisible && (
        <div className="folder-tree-panel">
          {treeMode === 'search' && <SearchPanel onOpenNote={handleOpenNote} />}
          {treeMode === 'bookmark' && <BookmarkTree onOpenNote={handleOpenNote} onRefresh={loadBookmarkFolders} />}
          {treeMode === 'folder' && (
            <FolderTree
              tree={tree}
              currentFolderId={currentFolderId}
              onSelect={setCurrentFolderId}
              onEdit={handleTreeEdit}
              onOpenNote={handleTreeOpenNote}
              onDrop={handleDrop}
              onBookmark={handleBookmark}
            />
          )}
        </div>
      )}

      <div className="main-panel">
        {showTabBar && (
          <div className="tab-bar">
            <button
              className={`tab-back ${activeTabId ? '' : 'active'}`}
              onClick={() => setActiveTabId(null)}
              title="Back to folder"
            >
              ←
            </button>
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="tab-color" style={{ backgroundColor: tab.color }} />
                <span>{tab.title}{getNoteExt(tab)}</span>
                <button className="tab-close" onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}>×</button>
              </div>
            ))}
          </div>
        )}

        {activeTabId && activeNote ? (
          <NotePage note={activeNote} tabs={openTabs} activeTabId={activeTabId} onCloseTab={handleCloseTab} onSwitchTab={setActiveTabId} onNoteUpdated={handleNoteUpdated} />
        ) : (
          <MainArea
            breadcrumb={breadcrumb} children={children} currentFolderId={currentFolderId}
            onNavigate={setCurrentFolderId}
            onCreateNote={() => setCreatingNote(true)} onCreateFolder={() => setCreatingFolder(true)}
            onOpenNote={handleOpenNote} onEditFolder={(folder) => setEditingFolder(folder)}
            onDeleteNote={(id) => { setDeletingId(id); setDeletingType('note'); }}
            onDeleteFolder={(id) => { setDeletingId(id); setDeletingType('folder'); }}
            onRefresh={handleRefresh} onBookmark={handleBookmark}
          />
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {(creatingNote || editingNote) && (
        <NoteEditor note={editingNote} onSave={handleSaveNote} onClose={() => { setCreatingNote(false); setEditingNote(null); }} allFolders={tree} />
      )}

      {(creatingFolder || editingFolder) && (
        <FolderEditor folder={editingFolder} onSave={handleSaveFolder} onClose={() => { setCreatingFolder(false); setEditingFolder(null); }} allFolders={tree} />
      )}

      {showBookmarkPicker && (
        <BookmarkPicker folders={bookmarkFolderList} noteId={bookmarkingNoteId || ''} onSelect={confirmBookmark} onClose={() => { setShowBookmarkPicker(false); setBookmarkingNoteId(null); }} />
      )}

      {unbookmarkingNoteId && (
        <ConfirmDialog
          title="Remove Bookmark"
          message="Are you sure you want to remove this bookmark?"
          onConfirm={confirmUnbookmark}
          onCancel={() => setUnbookmarkingNoteId(null)}
        />
      )}

      {deletingId && deletingType && (
        <ConfirmDialog
          title={`Delete ${deletingType}`}
          message={`Are you sure you want to delete this ${deletingType}? ${deletingType === 'folder' ? 'All contents will be permanently removed.' : ''}`}
          onConfirm={handleDelete}
          onCancel={() => { setDeletingId(null); setDeletingType(null); }}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { api } from '../hooks/useApi';
import type { TreeNode, Folder, FolderChildren, Note } from '../types';
import { SettingsPanel } from './SettingsPanel';
import { FolderTree } from './FolderTree';
import { MainArea } from './MainArea';
import { NoteEditor } from './NoteEditor';
import { FolderEditor } from './FolderEditor';
import { ConfirmDialog } from './ConfirmDialog';

export function NoteApp() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [breadcrumb, setBreadcrumb] = useState<Folder[]>([]);
  const [children, setChildren] = useState<FolderChildren>({ folders: [], notes: [] });
  const [loading, setLoading] = useState(true);

  // Editor state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [creatingNote, setCreatingNote] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<'folder' | 'note' | null>(null);

  // Load root folder ID and tree on mount
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

  // Load children and breadcrumb when folder changes
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
    if (currentFolderId) {
      loadFolder(currentFolderId);
    }
  }, [currentFolderId, loadFolder]);

  const refreshTree = useCallback(async () => {
    const treeData = await api.get<TreeNode[]>('/folders/tree');
    setTree(treeData);
  }, []);

  const handleNavigate = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
  }, []);

  const handleRefresh = useCallback(() => {
    loadFolder(currentFolderId);
  }, [currentFolderId, loadFolder]);

  // Save handlers
  const handleSaveNote = async (data: { title: string; content: string; color: string; content_type: string }) => {
    if (creatingNote) {
      await api.post('/notes', { ...data, folder_id: currentFolderId });
    } else if (editingNote) {
      await api.put(`/notes/${editingNote.id}`, data);
    }
    setCreatingNote(false);
    setEditingNote(null);
    handleRefresh();
  };

  const handleSaveFolder = async (data: { name: string; color: string }) => {
    if (creatingFolder) {
      await api.post('/folders', { ...data, parent_id: currentFolderId });
    } else if (editingFolder) {
      await api.put(`/folders/${editingFolder.id}`, data);
    }
    setCreatingFolder(false);
    setEditingFolder(null);
    handleRefresh();
    refreshTree();
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deletingId || !deletingType) return;
    if (deletingType === 'folder') {
      await api.del(`/folders/${deletingId}`);
      refreshTree();
    } else {
      await api.del(`/notes/${deletingId}`);
    }
    setDeletingId(null);
    setDeletingType(null);
    // If the deleted folder was the current one, navigate to parent
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

  return (
    <div className="app-layout">
      <SettingsPanel
        currentFolderId={currentFolderId}
        onUploaded={handleRefresh}
      />
      <div className="folder-tree-panel">
        <FolderTree
          tree={tree}
          currentFolderId={currentFolderId}
          onSelect={handleNavigate}
        />
      </div>
      <MainArea
        breadcrumb={breadcrumb}
        children={children}
        currentFolderId={currentFolderId}
        onNavigate={handleNavigate}
        onCreateNote={() => setCreatingNote(true)}
        onCreateFolder={() => setCreatingFolder(true)}
        onEditNote={(note) => setEditingNote(note)}
        onEditFolder={(folder) => setEditingFolder(folder)}
        onDeleteNote={(id) => { setDeletingId(id); setDeletingType('note'); }}
        onDeleteFolder={(id) => { setDeletingId(id); setDeletingType('folder'); }}
      />

      {/* Modals */}
      {(creatingNote || editingNote) && (
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onClose={() => { setCreatingNote(false); setEditingNote(null); }}
        />
      )}

      {(creatingFolder || editingFolder) && (
        <FolderEditor
          folder={editingFolder}
          onSave={handleSaveFolder}
          onClose={() => { setCreatingFolder(false); setEditingFolder(null); }}
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

interface Props {
  onToggleTree: () => void;
  onShowFolderTree: () => void;
  onToggleSearch: () => void;
  onToggleBookmarks: () => void;
  onOpenSettings: () => void;
  treeVisible: boolean;
  treeMode: 'folder' | 'search' | 'bookmark';
}

export function SettingsPanel({ onToggleTree, onShowFolderTree, onToggleSearch, onToggleBookmarks, onOpenSettings, treeVisible, treeMode }: Props) {
  return (
    <div className="settings-panel">
      <button className="settings-btn" onClick={onOpenSettings} title="Settings">⋮</button>
      <button className="settings-icon" onClick={onToggleTree} title={treeVisible ? 'Hide panel' : 'Show panel'}>
        {treeVisible ? '◀' : '▶'}
      </button>
      <button className={`settings-icon ${treeMode === 'folder' ? 'active' : ''}`} onClick={onShowFolderTree} title="Folder Tree">📁</button>
      <button className={`settings-icon ${treeMode === 'search' ? 'active' : ''}`} onClick={onToggleSearch} title="Search">🔍</button>
      <button className={`settings-icon ${treeMode === 'bookmark' ? 'active' : ''}`} onClick={onToggleBookmarks} title="Bookmarks">🔖</button>
    </div>
  );
}

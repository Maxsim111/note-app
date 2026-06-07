import { UploadZone } from './UploadZone';

interface Props {
  currentFolderId: string;
  onUploaded: () => void;
}

export function SettingsPanel({ currentFolderId, onUploaded }: Props) {
  return (
    <div className="settings-panel">
      <div>
        <h3>Upload Files</h3>
        <UploadZone folderId={currentFolderId} onUploaded={onUploaded} />
      </div>

      <div>
        <h3>Info</h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          Click a folder in the tree or grid to navigate.
          Create notes and folders to organize your content.
        </p>
      </div>

      <div>
        <h3>Supported Files</h3>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          Images (PNG, JPG, GIF, WebP), PDF, DOC, TXT, Markdown.
          Files are uploaded as notes with auto-generated thumbnails.
        </p>
      </div>
    </div>
  );
}

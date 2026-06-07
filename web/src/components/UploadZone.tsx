import { useState, useRef } from 'react';
import { api } from '../hooks/useApi';

interface Props {
  folderId: string;
  onUploaded: () => void;
}

export function UploadZone({ folderId, onUploaded }: Props) {
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append('file', files[i]);
      fd.append('folder_id', folderId);
      try {
        await api.upload('/upload', fd);
      } catch (e) {
        console.error('Upload failed', e);
      }
    }
    setUploading(false);
    onUploaded();
  };

  return (
    <div
      className={`upload-zone ${dragover ? 'dragover' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => { e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <span className="upload-zone-icon">{uploading ? '⏳' : '📤'}</span>
      {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
      />
    </div>
  );
}

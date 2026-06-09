import { useState, useEffect, useRef } from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import type { Note } from '../types';
import { api } from '../hooks/useApi';

interface Props {
  note: Note;
  tabs: Note[];
  activeTabId: string;
  onCloseTab: (id: string) => void;
  onSwitchTab: (id: string) => void;
  onNoteUpdated: (note: Note) => void;
  previewMap: Record<string, 'edit' | 'preview'>;
  onPreviewChange: (id: string, mode: 'edit' | 'preview') => void;
}

export function NotePage({ note, onNoteUpdated, previewMap, onPreviewChange }: Props) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const preview = previewMap[note.id] || 'edit';
  const setPreview = (mode: 'edit' | 'preview') => onPreviewChange(note.id, mode);
  const [colorMode, setColorMode] = useState(() => document.documentElement.getAttribute('data-color-mode') || 'dark');
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<number>(0);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const mode = document.documentElement.getAttribute('data-color-mode');
      if (mode) setColorMode(mode);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
    return () => observer.disconnect();
  }, []);

  // Auto-save after 1.5s of no typing
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      if (!title.trim() && !content) return;
      setSaving(true);
      try {
        const updated = await api.put<Note>(`/notes/${note.id}`, { title: title.trim(), content, content_type: note.content_type });
        onNoteUpdated(updated);
      } catch {}
      setSaving(false);
    }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [title, content]);

  // Save immediately when component unmounts (tab closed)
  useEffect(() => {
    return () => {
      if (!title.trim() && !content) return;
      api.put(`/notes/${note.id}`, { title: title.trim(), content, content_type: note.content_type }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  const isFile = !!note.file_name && note.content_type !== 'markdown' && note.content_type !== 'text';
  const isImage = note.content_type === 'image';
  const isPdf = note.content_type === 'pdf';
  const isDoc = note.content_type === 'doc';

  const handleSave = async () => {
    const updated = await api.put<Note>(`/notes/${note.id}`, {
      title: title.trim(),
      content,
      content_type: note.content_type,
    });
    onNoteUpdated(updated);
  };

  const handleImageUpload = async (file: File): Promise<{ url: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder_id', note.folder_id);
    const imgNote = await api.upload<Note>('/upload', fd);
    return { url: `/api/files/${imgNote.id}` };
  };

  // Custom image command for MDEditor
  const imageCommand: commands.ICommand = {
    name: 'image',
    keyCommand: 'image',
    buttonProps: { 'aria-label': 'Insert image' },
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20">
        <path fill="currentColor" d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"/>
      </svg>
    ),
    execute: (_state, api) => {
      imageInputRef.current?.click();
    },
  };

  return (
    <div className="tab-editor-body">
      <div className="tab-editor-toolbar">
        <input className="tab-editor-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
        {!isFile && (
          <button className="btn btn-sm" onClick={() => setPreview(preview === 'edit' ? 'preview' : 'edit')}>
            {preview === 'edit' ? 'Preview' : 'Edit'}
          </button>
        )}
        <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ minWidth: 70 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const { url } = await handleImageUpload(file);
          // Insert markdown image at current position by appending
          setContent((prev) => prev + `\n![](${url})`);
        } catch (err) { console.error('Upload failed', err); }
        if (imageInputRef.current) imageInputRef.current.value = '';
      }} />

      {isImage && (
        <div className="file-preview-area">
          {note.thumbnail_path && <img src={`/api/thumbnails/${note.id}`} alt={note.title} />}
        </div>
      )}

      {isPdf && <iframe src={`/api/files/${note.id}`} className="pdf-viewer" title={note.title} />}

      {isDoc && (
        <div className="doc-viewer" style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <p style={{ color: 'var(--text-dim)' }}>
            <a href={`/api/files/${note.id}`} download>Download {note.file_name}</a>
          </p>
        </div>
      )}

      {(isFile) && (
        <div className="file-caption">
          <textarea className="file-caption-input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a caption..." rows={2} />
        </div>
      )}

      {!isFile && (
        <div className="md-editor-wrap" data-color-mode={colorMode}>
          {preview === 'edit' ? (
            <MDEditor
              value={content}
              onChange={(v) => setContent(v || '')}
              commands={[imageCommand, commands.divider, commands.bold, commands.italic, commands.strikethrough, commands.link, commands.quote, commands.code, commands.unorderedListCommand, commands.orderedListCommand, commands.title]}
              extraCommands={[imageCommand]}
              preview="edit"
              height="100%"
              visibleDragbar={false}
            />
          ) : (
            <div style={{ padding: 16, overflow: 'auto', flex: 1 }} className="md-preview">
              <MDEditor.Markdown
                source={content}
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import katex from 'katex';
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
}

function renderMath(text: string): string {
  const blocks: string[] = [];

  // Replace display math $$...$$ with placeholders
  let html = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
      blocks.push(rendered);
      return `%%MATHBLOCK${blocks.length - 1}%%`;
    } catch { return _; }
  });

  // Replace inline math $...$ with placeholders
  html = html.replace(/\$(.+?)\$/g, (_, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
      blocks.push(rendered);
      return `%%MATHBLOCK${blocks.length - 1}%%`;
    } catch { return _; }
  });

  // Process markdown
  html = html
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([\s\S]+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<li>(.+)<\/li>/g, (_, items) => {
    const lis = items.split(/<\/li>\s*<li>/).map((s: string) => `<li>${s}</li>`).join('');
    return `<ul>${lis}</ul>`;
  });
  html = html.replace(/<p><\/p>/g, '');

  // Restore math blocks
  html = html.replace(/%%MATHBLOCK(\d+)%%/g, (_, i) => blocks[parseInt(i)] || '');

  return html;
}

export function NotePage({ note, onNoteUpdated }: Props) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [contentType, setContentType] = useState<string>(note?.content_type || 'markdown');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setContentType(note.content_type || 'markdown');
    setPreview(false);
  }, [note.id]);

  const isFile = !!note.file_name;
  const isImage = note.content_type === 'image';

  const handleSave = async () => {
    const updated = await api.put<Note>(`/notes/${note.id}`, {
      title: title.trim(),
      content,
      content_type: contentType,
    });
    onNoteUpdated(updated);
  };

  return (
    <div className="tab-editor-body">
      <div className="tab-editor-toolbar">
        <input className="tab-editor-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
        {!isFile && (
          <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="sort-select">
            <option value="text">Text</option>
            <option value="markdown">Markdown</option>
          </select>
        )}
        {!isFile && (
          <button className="btn btn-sm" onClick={() => setPreview(!preview)}>
            {preview ? 'Edit' : 'Preview'}
          </button>
        )}
        <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
      </div>

      {isImage && (
        <div className="file-preview-area">
          {note.thumbnail_path && <img src={`/api/thumbnails/${note.id}`} alt={note.title} />}
        </div>
      )}

      {!isImage && preview && contentType === 'markdown' && (
        <div className="tab-editor-preview" dangerouslySetInnerHTML={{ __html: renderMath(content) }} />
      )}
      {!isImage && preview && contentType !== 'markdown' && (
        <div className="tab-editor-preview" style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
      )}
      {!isImage && !preview && (
        <textarea className="tab-editor-textarea" style={{ borderRight: 'none', flex: 1 }}
          value={content} onChange={(e) => setContent(e.target.value)}
          placeholder={isFile ? 'Add a caption...' : 'Write here...'} />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../hooks/useApi';

const APP_VERSION = '1.0.0';
const APP_GITHUB = 'https://github.com/Maxsim111/note-app';
const APP_AUTHOR = 'Maxim';

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const [dataPath, setDataPath] = useState('');
  const [folderCount, setFolderCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [accentColor, setAccentColor] = useState('#58a6ff');
  const [fontSize, setFontSize] = useState('14');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    api.get<Record<string, string>>('/settings').then((s) => {
      if (s.data_path) setDataPath(s.data_path);
      if (s.accent_color) setAccentColor(s.accent_color);
      if (s.font_size) setFontSize(s.font_size);
      if (s.theme) setTheme(s.theme as 'dark' | 'light');
    });
    api.get<{ folder_count: number; note_count: number; total_size: number }>('/stats').then((s) => {
      setFolderCount(s.folder_count);
      setNoteCount(s.note_count);
      setTotalSize(s.total_size);
    });
  }, []);

  const save = (key: string, value: string) => {
    api.put('/settings', { [key]: value });
    if (key === 'accent_color') document.documentElement.style.setProperty('--accent', value);
    if (key === 'font_size') document.documentElement.style.setProperty('--font-size', value + 'px');
    if (key === 'theme') {
      document.documentElement.setAttribute('data-color-mode', value);
      if (value === 'light') {
        document.documentElement.style.setProperty('--bg', '#ffffff');
        document.documentElement.style.setProperty('--card-bg', '#f6f8fa');
        document.documentElement.style.setProperty('--text', '#24292f');
        document.documentElement.style.setProperty('--text-dim', '#656d76');
        document.documentElement.style.setProperty('--border', '#d0d7de');
      } else {
        document.documentElement.style.setProperty('--bg', '#0d1117');
        document.documentElement.style.setProperty('--card-bg', '#161b22');
        document.documentElement.style.setProperty('--text', '#c9d1d9');
        document.documentElement.style.setProperty('--text-dim', '#8b949e');
        document.documentElement.style.setProperty('--border', '#30363d');
      }
    }
  };

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="form-group">
        <label>Data Path</label>
        <input value={dataPath} onChange={(e) => setDataPath(e.target.value)} onBlur={() => save('data_path', dataPath)} />
      </div>
      <div className="form-group">
        <label>Storage Stats</label>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          {folderCount} folders, {noteCount} notes{totalSize > 0 ? `, ${(totalSize / 1024).toFixed(1)} KB` : ''}
        </p>
      </div>
      <div className="form-group">
        <label>Theme</label>
        <select value={theme} onChange={(e) => { setTheme(e.target.value as 'dark' | 'light'); save('theme', e.target.value); }}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      <div className="form-group">
        <label>Accent Color</label>
        <input type="color" value={accentColor} onChange={(e) => { setAccentColor(e.target.value); save('accent_color', e.target.value); }} />
      </div>
      <div className="form-group">
        <label>Font Size</label>
        <select value={fontSize} onChange={(e) => { setFontSize(e.target.value); save('font_size', e.target.value); }}>
          <option value="12">12px</option>
          <option value="14">14px</option>
          <option value="16">16px</option>
          <option value="18">18px</option>
        </select>
      </div>
      <div className="form-group">
        <label>Developer</label>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Author: {APP_AUTHOR}</span>
          <span>Version: {APP_VERSION}</span>
          <a href={APP_GITHUB} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 12 }}>
            {APP_GITHUB}
          </a>
        </div>
      </div>
    </Modal>
  );
}

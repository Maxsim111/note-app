import { useState, useEffect, useRef } from 'react';
import type { Note } from '../types';
import { api } from '../hooks/useApi';
import { CONTENT_TYPE_ICONS, getNoteExt } from '../utils';

interface Props {
  onOpenNote: (note: Note) => void;
}

export function SearchPanel({ onOpenNote }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = window.setTimeout(async () => {
      try {
        const data = await api.get<Note[]>(`/search?q=${encodeURIComponent(query)}`);
        setResults(data || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <div className="search-panel">
      <input
        ref={inputRef}
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes..."
      />
      {loading && <div className="search-status">Searching...</div>}
      <div className="search-results">
        {results.map((note) => (
          <div
            key={note.id}
            className="search-item"
            onClick={() => onOpenNote(note)}
          >
            <span className="si-icon">{CONTENT_TYPE_ICONS[note.content_type] || '📄'}</span>
            <span className="si-color" style={{ backgroundColor: note.color }} />
            <span className="si-name">{note.title}{getNoteExt(note)}</span>
          </div>
        ))}
        {!loading && query && results.length === 0 && (
          <div className="search-status">No results</div>
        )}
      </div>
    </div>
  );
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export const CONTENT_TYPE_ICONS: Record<string, string> = {
  image: '🖼',
  pdf: '📕',
  doc: '📘',
  txt: '📄',
  markdown: '📝',
  text: '📄',
};

export const DEFAULT_PALETTE = [
  '#3fb950', '#58a6ff', '#f85149', '#d2991d',
  '#bc8cff', '#79c0ff', '#56d364', '#ffa657',
  '#ff7b72', '#a5d6ff', '#d2a8ff', '#f778ba',
  '#7ee787', '#fdae54', '#e3b341', '#8b949e',
];

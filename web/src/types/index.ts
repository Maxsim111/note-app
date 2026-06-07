export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  folder_id: string;
  sort_order: number;
  content_type: 'text' | 'markdown' | 'image' | 'pdf' | 'doc' | 'txt';
  file_name: string | null;
  file_size: number | null;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreeNode {
  id: string;
  name: string;
  color: string;
  children: TreeNode[];
}

export interface FolderChildren {
  folders: Folder[];
  notes: Note[];
}

package model

type Folder struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	ParentID  *string `json:"parent_id"`
	Color     string  `json:"color"`
	SortOrder int     `json:"sort_order"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

type Note struct {
	ID            string  `json:"id"`
	Title         string  `json:"title"`
	Content       string  `json:"content"`
	Color         string  `json:"color"`
	FolderID      string  `json:"folder_id"`
	SortOrder     int     `json:"sort_order"`
	ContentType   string  `json:"content_type"`
	FileName      *string `json:"file_name"`
	FileSize      *int64  `json:"file_size"`
	ThumbnailPath *string `json:"thumbnail_path"`
	CreatedAt     string  `json:"created_at"`
	UpdatedAt     string  `json:"updated_at"`
}

type TreeNode struct {
	ID       string     `json:"id"`
	Name     string     `json:"name"`
	Color    string     `json:"color"`
	Children []TreeNode `json:"children"`
}

type FolderChildren struct {
	Folders []Folder `json:"folders"`
	Notes   []Note   `json:"notes"`
}

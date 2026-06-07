package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"

	"github.com/Maxsim111/note-app/internal/color"
	"github.com/Maxsim111/note-app/internal/model"
	"github.com/google/uuid"
)

type Store struct {
	db      *sql.DB
	dataDir string
}

func NewStore(dataDir string) (*Store, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}
	dbPath := filepath.Join(dataDir, "note-app.db")
	db, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	db.SetMaxOpenConns(1)

	s := &Store{db: db, dataDir: dataDir}
	if err := s.initSchema(); err != nil {
		return nil, err
	}
	if err := s.ensureRootFolder(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) initSchema() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS folders (
			id         TEXT PRIMARY KEY,
			name       TEXT NOT NULL,
			parent_id  TEXT REFERENCES folders(id) ON DELETE CASCADE,
			color      TEXT NOT NULL DEFAULT '#3fb950',
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
		CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);

		CREATE TABLE IF NOT EXISTS notes (
			id             TEXT PRIMARY KEY,
			title          TEXT NOT NULL,
			content        TEXT NOT NULL DEFAULT '',
			color          TEXT NOT NULL DEFAULT '#58a6ff',
			folder_id      TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
			sort_order     INTEGER NOT NULL DEFAULT 0,
			content_type   TEXT NOT NULL DEFAULT 'text',
			file_name      TEXT,
			file_size      INTEGER,
			thumbnail_path TEXT,
			created_at     TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
		);
		CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);

		CREATE TABLE IF NOT EXISTS settings (
			key   TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`)
	return err
}

const rootFolderID = "00000000-0000-0000-0000-000000000000"

func (s *Store) ensureRootFolder() error {
	var count int
	if err := s.db.QueryRow("SELECT COUNT(*) FROM folders WHERE id = ?", rootFolderID).Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		_, err := s.db.Exec(
			"INSERT INTO folders (id, name, parent_id, color, sort_order) VALUES (?, 'Home', NULL, '#3fb950', 0)",
			rootFolderID,
		)
		return err
	}
	return nil
}

func (s *Store) DataDir() string { return s.dataDir }

// ─── Folders ────────────────────────────────────────────────────────

func (s *Store) CreateFolder(name, parentID string, clr string) (*model.Folder, error) {
	if clr == "" {
		used, _ := s.getUsedColorsInFolder(parentID)
		clr = color.AssignColor(used)
	}
	id := uuid.New().String()
	now := sqlNow()
	var maxOrder int
	s.db.QueryRow("SELECT COALESCE(MAX(sort_order), -1) FROM folders WHERE parent_id IS ?", nullable(parentID)).Scan(&maxOrder)
	_, err := s.db.Exec(
		"INSERT INTO folders (id, name, parent_id, color, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		id, name, nullable(parentID), clr, maxOrder+1, now, now,
	)
	if err != nil {
		return nil, err
	}
	return s.GetFolder(id)
}

func (s *Store) GetFolder(id string) (*model.Folder, error) {
	f := &model.Folder{}
	var parentID sql.NullString
	err := s.db.QueryRow(
		"SELECT id, name, parent_id, color, sort_order, created_at, updated_at FROM folders WHERE id = ?", id,
	).Scan(&f.ID, &f.Name, &parentID, &f.Color, &f.SortOrder, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if parentID.Valid {
		f.ParentID = &parentID.String
	}
	return f, nil
}

func (s *Store) UpdateFolder(id, name, clr string) (*model.Folder, error) {
	now := sqlNow()
	if name != "" {
		_, _ = s.db.Exec("UPDATE folders SET name = ?, updated_at = ? WHERE id = ?", name, now, id)
	}
	if clr != "" {
		_, _ = s.db.Exec("UPDATE folders SET color = ?, updated_at = ? WHERE id = ?", clr, now, id)
	}
	return s.GetFolder(id)
}

func (s *Store) DeleteFolder(id string) error {
	if id == rootFolderID {
		return fmt.Errorf("cannot delete root folder")
	}
	// Clean up uploaded files for all notes in subtree
	s.cleanupFilesInFolder(id)
	_, err := s.db.Exec("DELETE FROM folders WHERE id = ?", id)
	return err
}

func (s *Store) GetRootFolderID() string {
	return rootFolderID
}

func (s *Store) GetFolderChildren(folderID string) (*model.FolderChildren, error) {
	result := &model.FolderChildren{Folders: []model.Folder{}, Notes: []model.Note{}}

	rows, err := s.db.Query(
		"SELECT id, name, parent_id, color, sort_order, created_at, updated_at FROM folders WHERE parent_id IS ? ORDER BY sort_order",
		nullable(folderID),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var f model.Folder
		var pid sql.NullString
		rows.Scan(&f.ID, &f.Name, &pid, &f.Color, &f.SortOrder, &f.CreatedAt, &f.UpdatedAt)
		if pid.Valid {
			f.ParentID = &pid.String
		}
		result.Folders = append(result.Folders, f)
	}

	nRows, err := s.db.Query(
		"SELECT id, title, content, color, folder_id, sort_order, content_type, file_name, file_size, thumbnail_path, created_at, updated_at FROM notes WHERE folder_id = ? ORDER BY sort_order",
		folderID,
	)
	if err != nil {
		return nil, err
	}
	defer nRows.Close()
	for nRows.Next() {
		var n model.Note
		nRows.Scan(&n.ID, &n.Title, &n.Content, &n.Color, &n.FolderID, &n.SortOrder,
			&n.ContentType, &n.FileName, &n.FileSize, &n.ThumbnailPath, &n.CreatedAt, &n.UpdatedAt)
		result.Notes = append(result.Notes, n)
	}
	return result, nil
}

func (s *Store) GetFolderTree() ([]model.TreeNode, error) {
	return s.buildTree(nil)
}

func (s *Store) buildTree(parentID *string) ([]model.TreeNode, error) {
	rows, err := s.db.Query(
		"SELECT id, name, color FROM folders WHERE parent_id IS ? ORDER BY sort_order",
		nullablePtr(parentID),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var nodes []model.TreeNode
	for rows.Next() {
		var n model.TreeNode
		rows.Scan(&n.ID, &n.Name, &n.Color)
		children, _ := s.buildTree(&n.ID)
		n.Children = children
		nodes = append(nodes, n)
	}
	return nodes, nil
}

func (s *Store) GetBreadcrumb(folderID string) ([]model.Folder, error) {
	var path []model.Folder
	current := folderID
	for current != "" {
		f, err := s.GetFolder(current)
		if err != nil {
			break
		}
		// prepend
		path = append([]model.Folder{*f}, path...)
		if f.ParentID == nil {
			break
		}
		current = *f.ParentID
	}
	return path, nil
}

func (s *Store) GetSiblings(folderID string) (*model.FolderChildren, error) {
	f, err := s.GetFolder(folderID)
	if err != nil {
		return nil, err
	}
	parentID := rootFolderID
	if f.ParentID != nil {
		parentID = *f.ParentID
	}
	return s.GetFolderChildren(parentID)
}

func (s *Store) ReorderFolders(ids []string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for i, id := range ids {
		if _, err := tx.Exec("UPDATE folders SET sort_order = ? WHERE id = ?", i, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ─── Notes ──────────────────────────────────────────────────────────

func (s *Store) CreateNote(title, content, folderID, clr, contentType string) (*model.Note, error) {
	if clr == "" {
		used, _ := s.getUsedColorsInFolder(folderID)
		clr = color.AssignColor(used)
	}
	if contentType == "" {
		contentType = "text"
	}
	id := uuid.New().String()
	now := sqlNow()
	var maxOrder int
	s.db.QueryRow("SELECT COALESCE(MAX(sort_order), -1) FROM notes WHERE folder_id = ?", folderID).Scan(&maxOrder)
	_, err := s.db.Exec(
		`INSERT INTO notes (id, title, content, color, folder_id, sort_order, content_type, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, title, content, clr, folderID, maxOrder+1, contentType, now, now,
	)
	if err != nil {
		return nil, err
	}
	return s.GetNote(id)
}

func (s *Store) GetNote(id string) (*model.Note, error) {
	n := &model.Note{}
	err := s.db.QueryRow(
		"SELECT id, title, content, color, folder_id, sort_order, content_type, file_name, file_size, thumbnail_path, created_at, updated_at FROM notes WHERE id = ?", id,
	).Scan(&n.ID, &n.Title, &n.Content, &n.Color, &n.FolderID, &n.SortOrder,
		&n.ContentType, &n.FileName, &n.FileSize, &n.ThumbnailPath, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return n, nil
}

func (s *Store) UpdateNote(id, title, content, folderID, clr, contentType string) (*model.Note, error) {
	now := sqlNow()
	if title != "" {
		s.db.Exec("UPDATE notes SET title = ?, updated_at = ? WHERE id = ?", title, now, id)
	}
	if content != "" {
		s.db.Exec("UPDATE notes SET content = ?, updated_at = ? WHERE id = ?", content, now, id)
	}
	if folderID != "" {
		s.db.Exec("UPDATE notes SET folder_id = ?, updated_at = ? WHERE id = ?", folderID, now, id)
	}
	if clr != "" {
		s.db.Exec("UPDATE notes SET color = ?, updated_at = ? WHERE id = ?", clr, now, id)
	}
	if contentType != "" {
		s.db.Exec("UPDATE notes SET content_type = ?, updated_at = ? WHERE id = ?", contentType, now, id)
	}
	return s.GetNote(id)
}

func (s *Store) SetNoteFile(id string, fileName string, fileSize int64, thumbnailPath string) error {
	now := sqlNow()
	_, err := s.db.Exec(
		"UPDATE notes SET file_name = ?, file_size = ?, thumbnail_path = ?, updated_at = ? WHERE id = ?",
		fileName, fileSize, nullable(thumbnailPath), now, id,
	)
	return err
}

func (s *Store) DeleteNote(id string) error {
	n, err := s.GetNote(id)
	if err != nil {
		return err
	}
	s.cleanupNoteFiles(n)
	_, err = s.db.Exec("DELETE FROM notes WHERE id = ?", id)
	return err
}

func (s *Store) ReorderNotes(ids []string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for i, id := range ids {
		if _, err := tx.Exec("UPDATE notes SET sort_order = ? WHERE id = ?", i, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ─── Settings ───────────────────────────────────────────────────────

func (s *Store) GetSettings() (map[string]string, error) {
	rows, err := s.db.Query("SELECT key, value FROM settings")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := map[string]string{}
	for rows.Next() {
		var k, v string
		rows.Scan(&k, &v)
		result[k] = v
	}
	return result, nil
}

func (s *Store) UpdateSettings(updates map[string]string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for k, v := range updates {
		_, err := tx.Exec("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", k, v)
		if err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ─── Helpers ────────────────────────────────────────────────────────

func (s *Store) getUsedColorsInFolder(folderID string) (map[string]int, error) {
	result := map[string]int{}
	rows, _ := s.db.Query("SELECT color, COUNT(*) FROM folders WHERE parent_id IS ? GROUP BY color", nullable(folderID))
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var c string
			var n int
			rows.Scan(&c, &n)
			result[c] += n
		}
	}
	nRows, _ := s.db.Query("SELECT color, COUNT(*) FROM notes WHERE folder_id = ? GROUP BY color", folderID)
	if nRows != nil {
		defer nRows.Close()
		for nRows.Next() {
			var c string
			var n int
			nRows.Scan(&c, &n)
			result[c] += n
		}
	}
	return result, nil
}

func (s *Store) cleanupNoteFiles(n *model.Note) {
	if n.FileName != nil {
		noteDir := filepath.Join(s.dataDir, "uploads", n.ID)
		os.RemoveAll(noteDir)
	}
	if n.ThumbnailPath != nil && *n.ThumbnailPath != "" {
		os.Remove(filepath.Join(s.dataDir, *n.ThumbnailPath))
	}
}

func (s *Store) cleanupFilesInFolder(folderID string) {
	rows, err := s.db.Query("SELECT id FROM notes WHERE folder_id = ?", folderID)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		rows.Scan(&id)
		n, err := s.GetNote(id)
		if err == nil {
			s.cleanupNoteFiles(n)
		}
	}
	// Also recurse into sub-folders
	subRows, err := s.db.Query("SELECT id FROM folders WHERE parent_id = ?", folderID)
	if err != nil {
		return
	}
	defer subRows.Close()
	for subRows.Next() {
		var subID string
		subRows.Scan(&subID)
		s.cleanupFilesInFolder(subID)
	}
}

func nullable(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}

func nullablePtr(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *s, Valid: true}
}

func sqlNow() string {
	return time.Now().UTC().Format(time.RFC3339)
}

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Maxsim111/note-app/internal/model"
)

func getBookmarkFolders(c *gin.Context) {
	folders, err := svcStore.GetBookmarkFolders()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if folders == nil {
		folders = []model.Folder{}
	}
	c.JSON(http.StatusOK, folders)
}

func createBookmarkFolder(c *gin.Context) {
	var req struct {
		Name  string `json:"name" binding:"required"`
		Color string `json:"color"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	f, err := svcStore.CreateBookmarkFolder(req.Name, req.Color)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, f)
}

func updateBookmarkFolder(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if err := svcStore.UpdateBookmarkFolder(id, req.Name, req.Color); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func deleteBookmarkFolder(c *gin.Context) {
	id := c.Param("id")
	if err := svcStore.DeleteBookmarkFolder(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func getBookmarks(c *gin.Context) {
	notes, err := svcStore.GetBookmarks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, notes)
}

func getBookmarkedIDs(c *gin.Context) {
	ids, err := svcStore.GetBookmarkedNoteIDs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ids)
}

func addBookmark(c *gin.Context) {
	var req struct {
		NoteID   string `json:"note_id" binding:"required"`
		FolderID string `json:"folder_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "note_id is required"})
		return
	}
	if err := svcStore.AddBookmark(req.NoteID, req.FolderID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true})
}

func moveBookmark(c *gin.Context) {
	noteID := c.Param("noteId")
	var req struct {
		FolderID string `json:"folder_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if err := svcStore.MoveBookmark(noteID, req.FolderID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func removeBookmark(c *gin.Context) {
	noteID := c.Param("noteId")
	if err := svcStore.RemoveBookmark(noteID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

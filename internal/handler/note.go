package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func getNote(c *gin.Context) {
	id := c.Param("id")
	n, err := svcStore.GetNote(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "note not found"})
		return
	}
	c.JSON(http.StatusOK, n)
}

func createNote(c *gin.Context) {
	var req struct {
		Title       string `json:"title" binding:"required"`
		Content     string `json:"content"`
		FolderID    string `json:"folder_id" binding:"required"`
		Color       string `json:"color"`
		ContentType string `json:"content_type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title and folder_id are required"})
		return
	}
	n, err := svcStore.CreateNote(req.Title, req.Content, req.FolderID, req.Color, req.ContentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, n)
}

func updateNote(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Title       string `json:"title"`
		Content     string `json:"content"`
		FolderID    string `json:"folder_id"`
		Color       string `json:"color"`
		ContentType string `json:"content_type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	n, err := svcStore.UpdateNote(id, req.Title, req.Content, req.FolderID, req.Color, req.ContentType)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "note not found"})
		return
	}
	c.JSON(http.StatusOK, n)
}

func reorderNotes(c *gin.Context) {
	var req struct {
		IDs []string `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids array required"})
		return
	}
	if err := svcStore.ReorderNotes(req.IDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func deleteNote(c *gin.Context) {
	id := c.Param("id")
	if err := svcStore.DeleteNote(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

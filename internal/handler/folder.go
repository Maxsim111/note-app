package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func getFolderTree(c *gin.Context) {
	tree, err := svcStore.GetFolderTree()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tree)
}

func getRootFolder(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"root_folder_id": svcStore.GetRootFolderID()})
}

func getFolderChildren(c *gin.Context) {
	id := c.Param("id")
	children, err := svcStore.GetFolderChildren(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "folder not found"})
		return
	}
	c.JSON(http.StatusOK, children)
}

func getFolderBreadcrumb(c *gin.Context) {
	id := c.Param("id")
	path, err := svcStore.GetBreadcrumb(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "folder not found"})
		return
	}
	c.JSON(http.StatusOK, path)
}

func getFolderSiblings(c *gin.Context) {
	id := c.Param("id")
	siblings, err := svcStore.GetSiblings(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "folder not found"})
		return
	}
	c.JSON(http.StatusOK, siblings)
}

func createFolder(c *gin.Context) {
	var req struct {
		Name     string `json:"name" binding:"required"`
		ParentID string `json:"parent_id"`
		Color    string `json:"color"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	if req.ParentID == "" {
		req.ParentID = svcStore.GetRootFolderID()
	}
	f, err := svcStore.CreateFolder(req.Name, req.ParentID, req.Color)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, f)
}

func updateFolder(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	f, err := svcStore.UpdateFolder(id, req.Name, req.Color)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "folder not found"})
		return
	}
	c.JSON(http.StatusOK, f)
}

func reorderFolders(c *gin.Context) {
	var req struct {
		IDs []string `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids array required"})
		return
	}
	if err := svcStore.ReorderFolders(req.IDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func deleteFolder(c *gin.Context) {
	id := c.Param("id")
	if err := svcStore.DeleteFolder(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

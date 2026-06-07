package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/Maxsim111/note-app/internal/store"
)

var svcStore *store.Store

func InitStore(s *store.Store) { svcStore = s }

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// Folders
		api.GET("/folders/tree", getFolderTree)
		api.GET("/folders/root", getRootFolder)
		api.GET("/folders/:id/children", getFolderChildren)
		api.GET("/folders/:id/breadcrumb", getFolderBreadcrumb)
		api.GET("/folders/:id/siblings", getFolderSiblings)
		api.POST("/folders", createFolder)
		api.PUT("/folders/:id", updateFolder)
		api.PUT("/folders/reorder", reorderFolders)
		api.DELETE("/folders/:id", deleteFolder)

		// Notes
		api.GET("/notes/:id", getNote)
		api.POST("/notes", createNote)
		api.PUT("/notes/:id", updateNote)
		api.PUT("/notes/reorder", reorderNotes)
		api.DELETE("/notes/:id", deleteNote)

		// Files
		api.POST("/upload", uploadFile)
		api.GET("/files/:noteId", serveFile)
		api.GET("/thumbnails/:noteId", serveThumbnail)

		// Settings
		api.GET("/settings", getSettings)
		api.PUT("/settings", updateSettings)
	}
}

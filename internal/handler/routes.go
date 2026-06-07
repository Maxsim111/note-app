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
		api.PUT("/folders/:id/move", moveFolder)
		api.DELETE("/folders/:id", deleteFolder)

		// Notes
		api.GET("/notes/:id", getNote)
		api.POST("/notes", createNote)
		api.PUT("/notes/:id", updateNote)
		api.PUT("/notes/reorder", reorderNotes)
		api.PUT("/notes/:id/move", moveNote)
		api.DELETE("/notes/:id", deleteNote)

		// Files
		api.POST("/upload", uploadFile)
		api.GET("/files/:noteId", serveFile)
		api.GET("/thumbnails/:noteId", serveThumbnail)

		// Settings
		api.GET("/settings", getSettings)
		api.PUT("/settings", updateSettings)

		// Stats
		api.GET("/stats", getStats)

		// Search
		api.GET("/search", searchNotes)

		// Bookmarks
		api.GET("/bookmarks/folders", getBookmarkFolders)
		api.POST("/bookmarks/folders", createBookmarkFolder)
		api.PUT("/bookmarks/folders/:id", updateBookmarkFolder)
		api.DELETE("/bookmarks/folders/:id", deleteBookmarkFolder)
		api.GET("/bookmarks", getBookmarks)
		api.GET("/bookmarks/ids", getBookmarkedIDs)
		api.POST("/bookmarks", addBookmark)
		api.PUT("/bookmarks/:noteId/move", moveBookmark)
		api.DELETE("/bookmarks/:noteId", removeBookmark)
	}
}

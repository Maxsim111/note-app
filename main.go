package main

import (
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/Maxsim111/note-app/internal/handler"
	"github.com/Maxsim111/note-app/internal/store"
)

func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.RedirectTrailingSlash = false
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type"},
	}))

	// Init data store
	dataDir := os.Getenv("NOTE_APP_DATA_DIR")
	if dataDir == "" {
		cfgDir, err := os.UserConfigDir()
		if err != nil {
			cfgDir = os.TempDir()
		}
		dataDir = filepath.Join(cfgDir, "note-app")
	}

	svcStore, err := store.NewStore(dataDir)
	if err != nil {
		log.Fatalf("Failed to init store: %v", err)
	}
	handler.InitStore(svcStore)

	handler.RegisterRoutes(r)

	// Serve embedded frontend
	distFS, err := fs.Sub(WebAssets, "web/dist")
	if err != nil {
		log.Println("No embedded frontend, use Vite dev server at :5173")
	} else {
		httpFS := http.FS(distFS)
		fileServer := http.FileServer(httpFS)
		r.GET("/", func(c *gin.Context) {
			c.Request.URL.Path = "/"
			fileServer.ServeHTTP(c.Writer, c.Request)
		})
		r.NoRoute(func(c *gin.Context) {
			_, err := httpFS.Open(c.Request.URL.Path)
			if err == nil {
				fileServer.ServeHTTP(c.Writer, c.Request)
				return
			}
			c.Request.URL.Path = "/"
			fileServer.ServeHTTP(c.Writer, c.Request)
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Note App running on http://0.0.0.0:%s (data: %s)\n", port, dataDir)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

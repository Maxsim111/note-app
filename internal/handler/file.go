package handler

import (
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/image/draw"
)

func uploadFile(c *gin.Context) {
	folderID := c.PostForm("folder_id")
	if folderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "folder_id is required"})
		return
	}
	title := c.PostForm("title")
	color := c.PostForm("color")

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	if title == "" {
		title = header.Filename
		ext := filepath.Ext(title)
		if ext != "" {
			title = title[:len(title)-len(ext)]
		}
	}

	contentType := detectContentType(header.Filename, file)
	// Reset read position
	file.Seek(0, io.SeekStart)

	// Read content for text/markdown files — import as regular notes, not file notes
	if contentType == "txt" || contentType == "markdown" {
		data, _ := io.ReadAll(io.LimitReader(file, 1024*1024))
		content := string(data)
		contentType = "markdown"
		note, err := svcStore.CreateNote(title, content, folderID, color, contentType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, note)
		return
	}

	note, err := svcStore.CreateNote(title, "", folderID, color, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save file to disk
	noteDir := filepath.Join(svcStore.DataDir(), "uploads", note.ID)
	os.MkdirAll(noteDir, 0755)
	safeName := sanitizeFilename(header.Filename)
	destPath := filepath.Join(noteDir, safeName)
	dst, err := os.Create(destPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}
	defer dst.Close()
	fileSize, _ := io.Copy(dst, file)

	// Generate thumbnail for images
	var thumbPath string
	if contentType == "image" {
		thumbPath = generateThumbnail(destPath, note.ID, svcStore.DataDir())
	}

	svcStore.SetNoteFile(note.ID, safeName, fileSize, thumbPath)
	note, _ = svcStore.GetNote(note.ID)
	c.JSON(http.StatusCreated, note)
}

func serveFile(c *gin.Context) {
	noteID := c.Param("noteId")
	note, err := svcStore.GetNote(noteID)
	if err != nil || note.FileName == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}
	filePath := filepath.Join(svcStore.DataDir(), "uploads", noteID, *note.FileName)
	c.File(filePath)
}

func serveThumbnail(c *gin.Context) {
	noteID := c.Param("noteId")
	note, err := svcStore.GetNote(noteID)
	if err != nil || note.ThumbnailPath == nil || *note.ThumbnailPath == "" {
		// Return a placeholder SVG
		c.Header("Content-Type", "image/svg+xml")
		c.String(http.StatusOK, `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#21262d"/><text x="100" y="110" font-size="48" text-anchor="middle" fill="#8b949e">📄</text></svg>`)
		return
	}
	thumbPath := filepath.Join(svcStore.DataDir(), *note.ThumbnailPath)
	c.File(thumbPath)
}

func detectContentType(filename string, reader io.Reader) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg":
		return "image"
	case ".pdf":
		return "pdf"
	case ".md", ".markdown":
		return "markdown"
	case ".txt", ".log", ".csv":
		return "txt"
	case ".doc", ".docx":
		return "doc"
	default:
		// Try to detect by reading first bytes
		buf := make([]byte, 512)
		n, _ := reader.Read(buf)
		if n > 0 {
			mime := http.DetectContentType(buf[:n])
			if strings.HasPrefix(mime, "image/") {
				return "image"
			}
			if mime == "application/pdf" {
				return "pdf"
			}
		}
		return "text"
	}
}

func generateThumbnail(srcPath, noteID, dataDir string) string {
	thumbDir := filepath.Join(dataDir, "thumbnails")
	os.MkdirAll(thumbDir, 0755)

	src, err := os.Open(srcPath)
	if err != nil {
		return ""
	}
	defer src.Close()

	img, _, err := image.Decode(src)
	if err != nil {
		return ""
	}

	bounds := img.Bounds()
	srcW, srcH := bounds.Dx(), bounds.Dy()
	const thumbSize = 200
	var dstW, dstH int
	if srcW > srcH {
		dstW = thumbSize
		dstH = srcH * thumbSize / srcW
	} else {
		dstH = thumbSize
		dstW = srcW * thumbSize / srcH
	}

	dst := image.NewRGBA(image.Rect(0, 0, dstW, dstH))
	draw.BiLinear.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)

	outPath := filepath.Join(thumbDir, noteID+".jpg")
	out, err := os.Create(outPath)
	if err != nil {
		return ""
	}
	defer out.Close()

	jpeg.Encode(out, dst, &jpeg.Options{Quality: 80})
	return "thumbnails/" + noteID + ".jpg"
}

func sanitizeFilename(name string) string {
	name = filepath.Base(name)
	name = strings.Map(func(r rune) rune {
		if r == '/' || r == '\\' || r == ':' || r == '*' || r == '?' || r == '"' || r == '<' || r == '>' || r == '|' {
			return '_'
		}
		return r
	}, name)
	return name
}

// Keep png import for type registration even if not directly used
var _ = png.Decode

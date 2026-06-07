package color

var DefaultPalette = []string{
	"#3fb950", // green
	"#58a6ff", // blue
	"#f85149", // red
	"#d2991d", // orange
	"#bc8cff", // purple
	"#79c0ff", // light blue
	"#56d364", // light green
	"#ffa657", // amber
	"#ff7b72", // salmon
	"#a5d6ff", // sky blue
	"#d2a8ff", // lavender
	"#f778ba", // pink
	"#7ee787", // mint
	"#fdae54", // warm orange
	"#e3b341", // gold
	"#8b949e", // neutral gray
}

func AssignColor(usedCounts map[string]int) string {
	minCount := int(^uint(0) >> 1) // max int
	var bestColor string
	for _, c := range DefaultPalette {
		count := usedCounts[c]
		if count < minCount {
			minCount = count
			bestColor = c
		}
	}
	if bestColor == "" {
		bestColor = DefaultPalette[0]
	}
	return bestColor
}

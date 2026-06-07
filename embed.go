package main

import "embed"

//go:embed web/dist/*
var WebAssets embed.FS

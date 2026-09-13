package main

import (
	"log"
	"net/http"
	"os"

	"github.com/k8s-defense/game/internal/api"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	handler := api.NewAPIHandler()
	mux := http.NewServeMux()

	// Probes for Kubernetes / OpenShift
	mux.HandleFunc("GET /healthz", handler.HandleHealth)

	// Serve static built SPA frontend
	fs := http.FileServer(http.Dir("./frontend/dist"))
	mux.Handle("/", fs)

	log.Printf("[Kubernetes Defense] Stateless Web & API Server listening on port :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

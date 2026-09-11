package main

import (
	"log"
	"net/http"
	"os"

	"github.com/openshift-defense/game/internal/api"
	"github.com/openshift-defense/game/internal/simulator"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	namespace := os.Getenv("CLUSTER_NAMESPACE")
	if namespace == "" {
		namespace = "chapter1-level1"
	}

	engine := simulator.NewClusterEngine(namespace)
	handler := api.NewAPIHandler(engine)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handler.HandleHealth)
	mux.HandleFunc("GET /api/cluster/state", handler.HandleClusterState)
	mux.HandleFunc("GET /api/events/stream", handler.HandleSSEEvents)

	// Serve static built frontend files if present
	fs := http.FileServer(http.Dir("./frontend/dist"))
	mux.Handle("/", fs)

	log.Printf("[OpenShift Defense] API Server listening on port :%s (Namespace: %s)", port, namespace)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

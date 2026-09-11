package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/openshift-defense/game/internal/simulator"
)

type APIHandler struct {
	engine *simulator.ClusterEngine
}

func NewAPIHandler(engine *simulator.ClusterEngine) *APIHandler {
	return &APIHandler{
		engine: engine,
	}
}

func (h *APIHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "openshift-defense-api",
		"version": "v1.0",
	})
}

func (h *APIHandler) HandleClusterState(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	state := h.engine.GetState()
	json.NewEncoder(w).Encode(state)
}

func (h *APIHandler) HandleSSEEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	state := h.engine.GetState()
	data, _ := json.Marshal(state)
	fmt.Fprintf(w, "data: %s\n\n", string(data))
	flusher.Flush()
}

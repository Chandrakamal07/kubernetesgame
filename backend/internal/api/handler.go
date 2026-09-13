package api

import (
	"encoding/json"
	"net/http"
)

type APIHandler struct{}

func NewAPIHandler() *APIHandler {
	return &APIHandler{}
}

func (h *APIHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "k8s-defense-api",
		"version": "v1.30.0",
	})
}

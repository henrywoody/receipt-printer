package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

func main() {
	http.HandleFunc("/print", corsMiddleware(handlePrint))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server is running on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "*")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

type PrintRequest struct {
	Text     string `json:"text"`
	FontSize byte   `json:"fontSize"`
}

func handlePrint(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var request PrintRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if request.FontSize < 1 {
		request.FontSize = 1
	}
	if request.FontSize > 8 {
		request.FontSize = 8
	}

	if err := printText(request.Text, request.FontSize); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func printText(text string, fontSize byte) error {
	printJob := NewPrintJob()
	if err := printJob.Connect(); err != nil {
		return err
	}
	defer printJob.Close()

	if err := printJob.Begin(); err != nil {
		return err
	}

	if err := printJob.SetFontSize(fontSize, fontSize); err != nil {
		return err
	}

	if err := printJob.WriteString(text); err != nil {
		return err
	}

	if err := printJob.NewLine(7); err != nil {
		return err
	}
	if err := printJob.WriteString(" "); err != nil {
		return err
	}
	if err := printJob.Cut(); err != nil {
		return err
	}
	return nil
}

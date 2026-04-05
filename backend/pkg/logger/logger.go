package logger

import (
	"io"
	"log"
	"os"
)

var (
	Info  = log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
	Warn  = log.New(os.Stdout, "WARNING: ", log.Ldate|log.Ltime|log.Lshortfile)
	Error = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile)
)

func Init() {
	f, err := os.OpenFile("server.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Println("Could not open server.log for writing")
		return
	}
	mw := io.MultiWriter(os.Stdout, f)
	log.SetOutput(mw)
	Info.SetOutput(mw)
	Warn.SetOutput(mw)
	mwErr := io.MultiWriter(os.Stderr, f)
	Error.SetOutput(mwErr)
}

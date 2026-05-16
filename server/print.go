package main

import (
	"os"
	"strings"
)

var (
	ESC = byte(0x1B)
	GS  = byte(0x1D)
)

type PrintJob struct {
	file *os.File
}

func NewPrintJob() *PrintJob {
	return &PrintJob{}
}

func (p *PrintJob) Connect() error {
	file, err := os.OpenFile("/dev/usb/lp0", os.O_RDWR, 0600)
	if err != nil {
		return err
	}
	p.file = file
	return nil
}

func (p *PrintJob) Close() error {
	return p.file.Close()
}

func (p *PrintJob) Begin() error {
	_, err := p.file.Write([]byte{ESC, '@'})
	return err
}

func (p *PrintJob) Cut() error {
	_, err := p.file.Write([]byte{ESC, '@', GS, 'V', '1'})
	return err
}

func (p *PrintJob) NewLine(count int) error {
	lines := strings.Repeat("\x0A", count)
	_, err := p.file.WriteString(lines)
	return err
}

func (p *PrintJob) WriteString(s string) error {
	_, err := p.file.WriteString(s)
	return err
}

func (p *PrintJob) SetFontSize(width, height byte) error {
	n := ((width - 1) << 4) | (height - 1)
	_, err := p.file.Write([]byte{GS, '!', n})
	return err
}

# Print Server

This program was written for use on a Raspberry Pi (3) to print on an EPSON TM-T20III thermal receipt printer.

## Setup (on the server)

Create a file `/etc/udev/rules.d/99-escpos.rules` with the following content:

```
SUBSYSTEM=="usb", ATTRS{idVendor}=="04b8", ATTRS{idProduct}=="0202", MODE="0664", GROUP="lp"
```

Then reload rules:

```shell
sudo udevadm control --reload-rules
sudo udevadm trigger
```

And add the relevant user to the `lp` group:

```shell
sudo usermod -aG lp <username>
```

If using the current user, log out and then back in for the change to take effect.

## Build

Build this application for Linux:

```shell
GOOS=linux GOARCH=arm64 go build -o print-server .
```
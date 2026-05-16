type PrintFormatConfig = {
	lineWidth: number;
	commandStartChar: string;
	commandLength: number;
	commands: Record<
		"beginReceipt" | "alignLeft" | "alignCenter" | "alignRight" | "beginBold" | "endBold" | "setFontSize" | "newLine" | "cutPaper",
		string
	>;
};

class PrintFormatter {
	config: PrintFormatConfig;

	constructor(config: PrintFormatConfig) {
		this.config = config;
	}

	formatString(s: string) {
		let cmds = this.beginReceipt();
		cmds += this.setFontSize(1, 1);
		cmds += s
		cmds += this.newLine(7);
		cmds += " ";
		cmds += this.cutPaper();
		return cmds;
	}

	getLength(line: string) {
		let length = 0;
		for (let i = 0; i < line.length; i++) {
			if (line[i] === this.config.commandStartChar) {
				i += this.config.commandLength;
			} else {
				length++;
			}
		}
		return length;
	}

	addCorrectLineBreak(firstSentence: string, sentence: string, preSentenceLimit = 0) {
		const words = sentence.split(" ");
		let characterLength = 0;
		let formattedSentence = firstSentence;
		let limit = this.config.lineWidth - this.getLength(firstSentence) - preSentenceLimit;
		words.forEach((word, ind) => {
			if (characterLength + this.getLength(word) > limit) {
				limit = this.config.lineWidth;
				formattedSentence += this.newLine();
				characterLength = 0;
			}

			formattedSentence += word;
			characterLength += this.getLength(word);

			if (characterLength === limit) {
				limit = this.config.lineWidth;
				characterLength = 0;
			} else if (ind < words.length - 1) {
				formattedSentence += " ";
				characterLength += 1;
			}
		});

		return formattedSentence;
	}

	spaceBetween(a: string, b: string, sep = " ") {
		const spacing = sep.repeat(this.config.lineWidth - this.getLength(a) - this.getLength(b));
		return a + spacing + b;
	}

	beginReceipt() {
		return this.config.commands.beginReceipt;
	}

	alignLeft() {
		return this.config.commands.alignLeft;
	}

	alignCenter() {
		return this.config.commands.alignCenter;
	}

	alignRight() {
		return this.config.commands.alignRight;
	}

	beginBold() {
		return this.config.commands.beginBold;
	}

	endBold() {
		return this.config.commands.endBold;
	}

	setFontSize(width: number, height: number) {
		const n = (width << 4) | height;
		return this.config.commands.setFontSize + String.fromCharCode(n);
	}

	resetFontSize() {
		return this.setFontSize(0, 0);
	}

	newLine(num = 1) {
		return this.config.commands.newLine.repeat(num);
	}

	horizontalLine() {
		return "_".repeat(this.config.lineWidth);
	}

	cutPaper() {
		return this.config.commands.cutPaper;
	}
}

export class EPSONPrintFormatter extends PrintFormatter {
	constructor(printerInfo: PrinterInfo | null | undefined) {
		const esc = "\x1B";

		let lineWidth: number | undefined;
		try {
			lineWidth = lineWidthFromEPSONPrinterInfo(printerInfo);
		} catch {}

		const config: PrintFormatConfig = {
			lineWidth: lineWidth ?? 48,
			commandStartChar: esc,
			commandLength: 2,
			commands: {
				beginReceipt: esc + "@",
				alignLeft: esc + "a" + "\x00",
				alignCenter: esc + "a" + "\x01",
				alignRight: esc + "a" + "\x02",
				beginBold: esc + "!" + "\x08",
				endBold: esc + "!" + "\x00",
				setFontSize: "\x1D!",
				newLine: "\x0A",
				cutPaper: esc + "@\x1DV1",
			},
		};

		super(config);
	}
}

function lineWidthFromEPSONPrinterInfo(printerInfo: PrinterInfo | null | undefined) {
	if (!printerInfo) {
		return undefined;
	}

	if (printerInfo.name === "EPSON TM-T20III") {
		return 48;
	}
	if (printerInfo.name === "EPSON TM-P20II" || printerInfo.name.startsWith("EPSON TM-P20II ")) {
		return 32;
	}
	return undefined;
}

export class ConsolePrintFormatter extends PrintFormatter {
	constructor() {
		const config: PrintFormatConfig = {
			lineWidth: 48,
			commandStartChar: "",
			commandLength: 0,
			commands: {
				beginReceipt: "BEGIN",
				alignLeft: "LEFT",
				alignCenter: "CENTER",
				alignRight: "RIGHT",
				beginBold: "BOLD",
				endBold: "ENDBOLD",
				setFontSize: "FONT",
				newLine: "\n",
				cutPaper: "CUT",
			},
		};

		super(config);
	}
}

// From JSPM
export type PrinterInfo = {
	IDIEnabled: boolean;
	XDPI: number;
	YDPI: number;
	connected: boolean;
	customPaperSupport: boolean;
	default: boolean;
	duplex: boolean;
	isLocal: boolean;
	isNetwork: boolean;
	isShared: boolean;
	manufacturer: string;
	mediaTypes: string[];
	name: string;
	papers: string[];
	port: string;
	trays: string[];
};

export function newPrintFormatter(printerInfo: PrinterInfo | null | undefined) {
	switch (printerInfo?.manufacturer) {
		case "EPSON":
			return new EPSONPrintFormatter(printerInfo);
		default:
			return new EPSONPrintFormatter(printerInfo);
	}
}

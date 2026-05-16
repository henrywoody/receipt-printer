import React from "react";
import * as JSPM from "jsprintmanager";
import { newPrintFormatter, type PrinterInfo } from "./format";

export default function App() {
	React.useEffect(() => {
		startPrintContext();
	}, []);

	const [text, setText] = React.useState("");

	return (
		<main>
			<h1>Receipt Printer</h1>

			<div>
				<textarea value={text} onChange={(e) => setText(e.target.value)} />
			</div>

			<button onClick={() => print(text)}>Print</button>
		</main>
	);
}

function startPrintContext() {
	JSPM.JSPrintManager.auto_reconnect = true;
	JSPM.JSPrintManager.start();
}

async function print(text: string) {
	const { printJob, formatter } = await newPrintJob();
	printJob.printerCommands = formatter.formatString(text);
	await printJob.sendToClient();
}

async function newPrintJob() {
	const printJob = new JSPM.ClientPrintJob();
	printJob.clientPrinter = new JSPM.DefaultPrinter();
	const printerInfo = await getDefaultPrinterInfo();
	const formatter = newPrintFormatter(printerInfo);
	return { printJob, formatter };
}

async function getDefaultPrinterInfo() {
	const printersInfo = (await JSPM.JSPrintManager.getPrintersInfo()) as PrinterInfo[]; // JSPM types are wrong
	return printersInfo.find((e: any) => e.default);
}

import React from "react";
import styles from "./App.module.css";

type PrintHistoryEntry = {
	text: string;
	timestamp: number;
};

const textLocalStorageKey = "text";
const fontSizeLocalStorageKey = "fontSize";
const printHistoryLocalStorageKey = "printHistory";

export default function App() {
	const inputRef = React.useRef<HTMLTextAreaElement>(null);

	const [text, setText] = React.useState(localStorage.getItem(textLocalStorageKey) || "");
	const [fontSize, setFontSize] = React.useState(() => {
		try {
			const storedValue = Number(localStorage.getItem(fontSizeLocalStorageKey));
			if (storedValue >= 1 && storedValue <= 8) {
				return storedValue;
			}
		} catch {}
		return 1;
	});
	const [printHistory, setPrintHistory] = React.useState<PrintHistoryEntry[]>(() => {
		try {
			const storedValue = JSON.parse(localStorage.getItem(printHistoryLocalStorageKey));
			if (Array.isArray(storedValue)) {
				return storedValue;
			}
		} catch {}
		return [];
	});

	React.useEffect(() => {
		localStorage.setItem(textLocalStorageKey, text);
	}, [text]);
	React.useEffect(() => {
		localStorage.setItem(fontSizeLocalStorageKey, fontSize.toString());
	}, [fontSize]);
	React.useEffect(() => {
		localStorage.setItem(printHistoryLocalStorageKey, JSON.stringify(printHistory));
	}, [printHistory]);

	const [isPrinting, setIsPrinting] = React.useState(false);
	const onPrintClick = async () => {
		setIsPrinting(true);
		print(text, fontSize);
		setPrintHistory((prev) => {
			if (prev.length > 0 && text === prev[0].text) {
				return prev;
			}
			return [{ text, timestamp: Date.now() }, ...prev];
		});
		setText("");
		setIsPrinting(false);
		inputRef.current?.focus();
	};

	const onCopyHistoryEntry = (text: string) => {
		setText(text);
		if (inputRef.current) {
			inputRef.current.focus();
			window.scrollTo(0, 0);
		}
	};

	const onDeleteHistoryEntry = (timestamp: number) => {
		setPrintHistory((prev) => prev.filter(({ timestamp: t }) => t !== timestamp));
	};

	const onClearHistory = () => {
		const ok = window.confirm("Are you sure you want to clear the whole history?");
		if (!ok) {
			return;
		}
		setPrintHistory([]);
	};

	return (
		<main className={styles["main"]}>
			<h1>Receipt Printer</h1>

			<div className={styles["print-form"]}>
				<label className={styles["print-form__font-size"]}>
					Font Size:
					<select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
						<option value={1}>1</option>
						<option value={2}>2</option>
						<option value={3}>3</option>
						<option value={4}>4</option>
						<option value={5}>5</option>
						<option value={6}>6</option>
						<option value={7}>7</option>
						<option value={8}>8</option>
					</select>
				</label>

				<textarea
					ref={inputRef}
					value={text}
					onChange={(e) => setText(e.target.value)}
					autoFocus
					disabled={isPrinting}
					className={styles["print-form__text"]}
					rows={8}
				/>

				<button
					onClick={onPrintClick}
					disabled={text === "" || isPrinting}
					className={styles["print-form__print-button"]}
				>
					Print
				</button>
			</div>

			{printHistory.length > 0 && (
				<div>
					<div className={styles["print-history__header"]}>
						<h2>History</h2>
						<button onClick={onClearHistory}>Clear</button>
					</div>

					<div className={styles["print-history__list"]}>
						{printHistory.map(({ text, timestamp }) => (
							<TextHistoryItem
								key={timestamp}
								text={text}
								timestamp={timestamp}
								onReprint={(text) => print(text, fontSize)}
								onCopy={onCopyHistoryEntry}
								onDelete={onDeleteHistoryEntry}
							/>
						))}
					</div>
				</div>
			)}
		</main>
	);
}

type TextHistoryItemProps = {
	text: string;
	timestamp: number;
	onReprint: (text: string) => void;
	onCopy: (text: string) => void;
	onDelete: (timestamp: number) => void;
};

function TextHistoryItem({ text, timestamp, onReprint, onCopy, onDelete }: TextHistoryItemProps) {
	return (
		<div className={styles["print-history__item"]}>
			<pre className={styles["print-history__item__text"]}>{text}</pre>

			<div className={styles["print-history__menu"]}>
				<time dateTime={new Date(timestamp).toISOString()}>{new Date(timestamp).toLocaleString()}</time>

				<div className={styles["print-history__menu__buttons"]}>
					<button onClick={() => onReprint(text)}>Reprint</button>
					<button onClick={() => onCopy(text)}>Copy</button>
					<button onClick={() => onDelete(timestamp)}>Delete</button>
				</div>
			</div>
		</div>
	);
}

async function print(text: string, fontSize = 1) {
	await fetch(import.meta.env.VITE_API_URL + "/print", {
		method: "POST",
		body: JSON.stringify({ text, fontSize }),
	});
}

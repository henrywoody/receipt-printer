import React from "react";
import styles from "./App.module.css";

type PrintHistoryEntry = {
	text: string;
	timestamp: number;
};

const printHistoryLocalStorageKey = "printHistory";

export default function App() {
	const inputRef = React.useRef<HTMLTextAreaElement>(null);

	const [text, setText] = React.useState("");
	const [printHistory, setPrintHistory] = React.useState<PrintHistoryEntry[]>(() => {
		try {
			const storedValue = JSON.parse(localStorage.getItem(printHistoryLocalStorageKey));
			if (Array.isArray(storedValue)) {
				return storedValue;
			}
		} catch {}
		return [];
	});

	const [isPrinting, setIsPrinting] = React.useState(false);
	const onPrintClick = async () => {
		setIsPrinting(true);
		print(text, 1);
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

	React.useEffect(() => {
		localStorage.setItem(printHistoryLocalStorageKey, JSON.stringify(printHistory));
	}, [printHistory]);

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
				<textarea
					ref={inputRef}
					value={text}
					onChange={(e) => setText(e.target.value)}
					autoFocus
					disabled={isPrinting}
					className={styles["print-form__textarea"]}
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
	onCopy: (text: string) => void;
	onDelete: (timestamp: number) => void;
};

function TextHistoryItem({ text, timestamp, onCopy, onDelete }: TextHistoryItemProps) {
	return (
		<div className={styles["print-history__item"]}>
			<pre className={styles["print-history__item__text"]}>{text}</pre>

			<div className={styles["print-history__menu"]}>
				<time dateTime={new Date(timestamp).toISOString()}>{new Date(timestamp).toLocaleString()}</time>

				<div className={styles["print-history__menu__buttons"]}>
					<button onClick={() => print(text)}>Reprint</button>
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

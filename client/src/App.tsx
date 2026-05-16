import React from "react";

export default function App() {
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

async function print(text: string, fontSize = 1) {
	await fetch(import.meta.env.VITE_API_URL + "/print", {
		method: "POST",
		body: JSON.stringify({ text, fontSize }),
	});
}

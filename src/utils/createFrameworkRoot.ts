export function createFrameworkRoot() {
	const div = document.createElement("div");
	div.style.setProperty("display", "contents", "!important");
	return document.body.appendChild(div);
}

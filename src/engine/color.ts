export function fromHex(hex: string) {
	return hex;
}

export function fromRGB(...args: [number, number, number]) {
	return args.reduce((acc, cur) => acc + cur.toString(16).padStart(2, "0"), "#");
}

export function random() {
	return `#${Math.floor(Math.random() * 0xffffff).toString(16)}`;
}

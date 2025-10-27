/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Engine's Color namespace
 * @copyright Tomáš Wróbel 2025
 */
export function fromHex(hex: string) {
	return hex;
}

export function fromRGB(...args: [number, number, number]) {
	return args.reduce((acc, cur) => acc + cur.toString(16).padStart(2, "0"), "#");
}

export function random() {
	return `#${Math.floor(Math.random() * 0xffffff).toString(16)}`;
}

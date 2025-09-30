/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview A function to use to transform data URL to file
 * @copyright Tomáš Wróbel 2025
 */
/**
 *
 * @param dataURL
 * @param filename
 * @returns
 */
export function dataURLToFile(dataURL: string, filename: string) {
	const parts = dataURL.split(";");
	const [, type] = parts[0].split(":");
	const [, base64Data] = parts[1].split(",");
	const binaryString = window.atob(base64Data);
	const bytes = new Uint8Array(binaryString.length);

	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	return new File([bytes], filename, {type});
}

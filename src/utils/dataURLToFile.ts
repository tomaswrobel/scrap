/**
 * This file is a part of Scrap Native, an app for helping to migrate
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
	const mimeType = parts[0].split(":")[1];
	const base64Data = parts[1].split(",")[1];
	const binaryString = window.atob(base64Data);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);

	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	return new File([bytes], filename, {type: mimeType});
}

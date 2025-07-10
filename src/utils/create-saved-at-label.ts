/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview A helper function for displaying the path of the saved file.
 * @copyright Tomáš Wróbel 2025
 *
 * @param path The path of the saved file.
 * @returns The element with the path of the saved file.
 */
export default function createSavedAtLabel(path: string) {
	const span = document.createElement("span");
	const italic = document.createElement("i");
	italic.innerText = path;
	span.append("File saved at ", italic, ".");
	return span;
}

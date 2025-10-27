/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Engine's internal utilities for speech bubbles
 * @copyright Tomáš Wróbel 2025
 */
export const target = new EventTarget();

export function submit(id: string) {
	const input = document.getElementById(id) as HTMLInputElement;
	target.dispatchEvent(new CustomEvent(id, {detail: input.value}));
}

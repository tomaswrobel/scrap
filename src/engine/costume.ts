/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Helper for Sprites' assets
 * @copyright Tomáš Wróbel 2025
 */
export default class Costume {
	public width = 0;
	public height = 0;
	public readonly src: string;

	constructor(src: string) {
		this.src = src;
	}

	public async load() {
		const img = new Image();
		img.src = this.src;

		if (!img.complete) {
			await new Promise(resolve => {
				img.addEventListener("load", resolve, {once: true});
			});
		}

		this.width = img.width;
		this.height = img.height;
	}
}

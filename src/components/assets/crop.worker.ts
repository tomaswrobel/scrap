/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Worker for cropping images in the paint editor
 * @copyright Tomáš Wróbel 2024
 */
type CropEvent = MessageEvent<{
	imageData: ImageData;
	width: number;
	height: number;
}>;

self.onmessage = function (e: CropEvent) {
	let minX = e.data.width;
	let minY = e.data.height;

	let maxX = 0;
	let maxY = 0;

	for (let y = 0; y < e.data.height; y++) {
		for (let x = 0; x < e.data.width; x++) {
			const i = (y * e.data.width + x) * 4;
			if (e.data.imageData.data[i + 3] > 0) {
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);

				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
	}

	self.postMessage({
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
	});
};

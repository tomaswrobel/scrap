/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Worker for cropping images in the paint editor
 * @author Tomáš Wróbel
 */
type CropEvent = MessageEvent<{
	imageData: ImageData;
	width: number;
	height: number;
}>;

self.onmessage = function (e) {
	const width = e.data.width as number;
	const height = e.data.height as number;
	const {data} = e.data.imageData as ImageData;

	let minX = width;
	let minY = height;

	let maxX = 0;
	let maxY = 0;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			if (data[i + 3] > 0) {
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
		height: maxY - minY
	});
};

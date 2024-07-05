/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Worker for filling areas in the paint editor
 * @author Tomáš Wróbel
 */
self.onmessage = function (e) {
	const data: ImageData = e.data.data;
	const color: string = e.data.color;
	const index = (e.data.y * data.width + e.data.x) * 4;
	const targetR = data.data[index];
    const targetG = data.data[index + 1];
    const targetB = data.data[index + 2];
    const targetA = data.data[index + 3];
	const stack: [number, number][] = [[e.data.x, e.data.y]];

	const r = Number.parseInt(color.slice(1, 3), 16);
	const g = Number.parseInt(color.slice(3, 5), 16);
	const b = Number.parseInt(color.slice(5, 7), 16);

	while (stack.length > 0) {
		if (self.closed) {
			return;
		}

		const [x, y] = stack.pop()!;
		const index = (y * 480 + x) * 4;
		const pixel = data.data.slice(index, index + 4);

		if (pixel[3] === 0) {
			data.data[index] = r;
			data.data[index + 1] = g;
			data.data[index + 2] = b;
			data.data[index + 3] = 255;
		}

		if (pixel[0] === targetR && pixel[1] === targetG && pixel[2] === targetB && pixel[3] === targetA) {
			data.data[index + 3] = 0;

			if (x > 0) {
				stack.push([x - 1, y]);
			}

			if (x < 480 - 1) {
				stack.push([x + 1, y]);
			}

			if (y > 0) {
				stack.push([x, y - 1]);
			}

			if (y < 360 - 1) {
				stack.push([x, y + 1]);
			}
		}
	}

	self.postMessage(data);
};
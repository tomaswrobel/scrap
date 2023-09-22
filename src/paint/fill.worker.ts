onmessage = function (e) {
	const data: ImageData = e.data.imageData;
	const target: ImageData["data"] = e.data.target;
	const color: string = e.data.color;
	const stack: [number, number][] = [[e.data.x, e.data.y]];

	const r = parseInt(color.slice(1, 3), 16);
	const g = parseInt(color.slice(3, 5), 16);
	const b = parseInt(color.slice(5, 7), 16);

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

		if (pixel[0] === target[0] && pixel[1] === target[1] && pixel[2] === target[2] && pixel[3] === target[3]) {
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

	postMessage(data);
};
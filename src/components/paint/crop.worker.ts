onmessage = function (e) {
	const data: ImageData["data"] = e.data.imageData.data;
	const used = new Set<number>();

	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] > 0) {
			used.add(i / 4);
		}
	}

	const array = Array.from(used);

	const x = Math.min(...array.map(i => i % 480));
	const y = Math.min(...array.map(i => Math.floor(i / 480)));
	const width = Math.max(...array.map(i => i % 480)) - x;
	const height = Math.max(...array.map(i => Math.floor(i / 480))) - y;

    postMessage({
        x,
        y,
        width,
        height,
    })
};

class Timer {
	now = Date.now();
	listeners: [number, number, () => void][] = [];

	public reset() {
		this.now = Date.now();

		for (const data of this.listeners) {
			window.clearTimeout(data[0]);
			data[0] = window.setTimeout(data[2], data[1] - (Date.now() - this.now));
		}
	}

	public whenElapsed(time: number, callback: () => Promise<void>) {
		this.listeners.push([
			window.setTimeout(callback, time - (Date.now() - this.now)),
			time,
			callback,
		]);
	}
}

export default Timer;
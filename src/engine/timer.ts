/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Engine's timer utility
 * @copyright Tomáš Wróbel 2025
 */
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

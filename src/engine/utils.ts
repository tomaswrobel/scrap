/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Engine's utilities
 * @copyright Tomáš Wróbel 2025
 */
export const abort = new AbortController();

/*
 * Thanks to message, we can stop
 * Scrap project from IDE
 */
export function stop() {
	window.postMessage("STOP", "*");
}

window.addEventListener("message", e => {
	if (e.data === "STOP") {
		abort.abort();
	}
});

export class StopError extends Error {
	constructor() {
		super("The project has been stopped.");
		this.name = "Scrap.StopError";
	}
}

export function isTurbo() {
	return frameElement?.getAttribute("data-turbo") !== "false";
}

/**
 * This is a loop guard function. It is injected
 * by Scrap IDE to prevent infinite loops.
 * @param resolve Promise resolve function.
 * @param reject Promise reject function.
 * @private
 */
export function loop(resolve: VoidFunction, reject: (reason: Error) => void) {
	if (abort.signal.aborted) {
		reject(new StopError());
	} else {
		window.setTimeout(resolve);
	}
}

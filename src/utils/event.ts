import type {EventHandler} from "svelte/elements";
import {on} from "svelte/events";

export function event(event: string, action?: EventHandler) {
	return function (element: Element) {
		return action && on(element, event, action as EventListener);
	};
}

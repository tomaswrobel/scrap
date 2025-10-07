/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/unified-signatures */
import type {Attachment} from "svelte/attachments";
import type {EventHandler} from "svelte/elements";
import {on} from "svelte/events";

export function event<E extends keyof HTMLElementEventMap, T extends HTMLElement>(
	event: E,
	action?: EventHandler<HTMLElementEventMap[E], T>,
): Attachment<T>;
export function event<E extends keyof SVGElementEventMap, T extends SVGElement>(
	event: E,
	action?: EventHandler<SVGElementEventMap[E], T>,
): Attachment<T>;
export function event<E extends keyof MathMLElementEventMap, T extends MathMLElement>(
	event: E,
	action?: EventHandler<MathMLElementEventMap[E], T>,
): Attachment<T>;
export function event<E extends string, T extends Element>(
	event: E,
	action?: EventHandler<Event, T>,
): Attachment<T>;
export function event(event: string, action?: EventHandler): Attachment {
	return function (element) {
		return action && on(element, event, action as EventListener);
	};
}

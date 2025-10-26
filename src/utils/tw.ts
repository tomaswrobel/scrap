import type {ClassArray} from "clsx";
import type {ClassValue} from "svelte/elements";

/** Provides autocompletion for tailwindcss */
export function tw<T extends ClassArray>(...classes: T): T {
	return classes;
}

tw.map = function <K extends string>(object: Record<K, ClassValue>) {
	return object;
};

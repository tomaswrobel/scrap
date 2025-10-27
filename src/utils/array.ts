import type {SpreadParameters} from "@scrap/types/SpreadParameters";

export function array<const T extends SpreadParameters>(...array: T) {
	return array;
}

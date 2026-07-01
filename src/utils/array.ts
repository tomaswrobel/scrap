import type {SpreadParameters} from "@juvofy/lib/utils/SpreadParameters";

export function array<const T extends SpreadParameters>(...array: T) {
	return array;
}

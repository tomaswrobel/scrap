import type {Entity} from "./Enity.svelte.ts";
import type {EntityMode} from "./EntityMode";

function decorator() {}

export interface EntityModeSwitcher {
	switch(entity: Entity): void;
}

export declare namespace EntityModeSwitcher {
	export type Decorator = (
		from: EntityMode,
		to: EntityMode,
	) => (constructor: EntityModeSwitcher) => void;
}

export const EntityModeSwitcher: EntityModeSwitcher.Decorator = () => decorator;

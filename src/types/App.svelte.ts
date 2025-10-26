import type Dialog from "@scrap/components/controls/Dialog.svelte";
import {Entity} from "@scrap/types/Enity.svelte.ts";

export class App {
	public turboExecution = $state(false);
	public name = $state("");
	public size = $state(360);
	public dialog = $state<Dialog>({
		cancel: () => undefined,
		close: () => undefined,
		fire: () => Promise.resolve(false),
		isOpen: () => false,
	});

	public current: Entity;
	public entities: Entity[];
	public readonly stage: Entity;

	constructor() {
		const Scrappy = Entity.createSprite("Scrappy");
		this.stage = Entity.createStage();
		this.current = $state(Scrappy);
		this.entities = $state([this.stage, Scrappy]);
	}
}

export const app = new App();

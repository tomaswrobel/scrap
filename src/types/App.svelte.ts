/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview App's global state
 * @copyright Tomáš Wróbel 2025
 */
import type Dialog from "@juvofy/lib/components/actions/Dialog";
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

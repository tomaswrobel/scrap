import {SvelteSet} from "svelte/reactivity";
import type { NonEmptyArray } from "./NonEmptyArray";

export class TabsController<const ID extends string> {
	public ids: ID[];
	public currentTab: ID;
	public disabledIds = new SvelteSet<ID>();

	constructor(...ids: NonEmptyArray<ID>) {
		this.ids = $state(ids);
		this.currentTab = $state(ids[0]);
	}

	public disable(id: ID) {
		this.disabledIds.add(id);
	}
}

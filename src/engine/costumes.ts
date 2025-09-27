import type Entity from "./entity";

export default class Costumes {
	public readonly all: string[];
	public readonly entity: Entity;

	constructor(entity: Entity) {
		this.entity = entity;
		this.all = Object.keys(entity.images);
	}

	public get name() {
		return this.entity.current;
	}

	public set name(name: string) {
		this.entity.current = name;
		this.entity.update();
	}

	public get index() {
		return this.all.indexOf(this.name);
	}

	public set index(index: number) {
		this.name = this.all[index];
	}
}

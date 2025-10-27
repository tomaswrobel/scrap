/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Helper for Sprites' assets
 * @copyright Tomáš Wróbel 2025
 */
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

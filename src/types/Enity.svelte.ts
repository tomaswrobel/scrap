import { dataURLToFile } from "@scrap/utils/dataURLToFile";
import * as Blockly from "blockly/core";
import type JSZip from "jszip";
import * as path from "path";
import type { Variable } from "./Variable";
import click from "./assets/sounds/click.mp3?url&inline";
import scrappy from "./assets/svgs/scrappy.svg?raw";
import stage from "./assets/svgs/stage.svg?raw";

export class Entity {
	public current = 0;
	public sounds = [dataURLToFile(click, "click.mp3")];
	public init: {};

	public name: string;
	public readonly isStage: boolean;
	public readonly costumes: File[];
	public variables = $state<Variable[]>([]);

	public mode = $state<"code" | "blocks">("code");
	private typescript = $state<string>();

	private constructor(name: string, isStage: boolean, costume: File, init = {}) {
		this.costumes = $state([costume]);
		this.init = $state(init);
		this.name = $state(name);
		this.isStage = isStage;
	}

	public static createSprite(name: string) {
		const sprite = new this(
			name,
			false,
			new File([scrappy], "Scrappy.svg", { type: "image/svg+xml" }),
			{
				x: 0,
				y: 0,
				direction: 90,
				size: 100,
				rotationStyle: 0,
				visible: true,
				draggable: false,
			}
		);
		return sprite;
	}

	public static createStage() {
		return new this(
			"Stage",
			true,
			new File([stage], "Stage.svg", { type: "image/svg+xml" })
		);
	}

	/** Helper workspace for generating code. */
	public readonly workspace = new Blockly.Workspace();

	public get code() {
		if (this.typescript !== undefined) {
			return this.typescript;
		}
		return Blockly.serialization.workspaces.save(this.workspace);
	}

	public set code(value: Record<string, unknown> | string) {
		if (typeof value === "string") {
			this.typescript = value;
		} else {
			delete this.typescript;
			Blockly.serialization.workspaces.load(value, this.workspace, {
				recordUndo: false,
			});
		}
	}

	/**
	 * Get the URLs of the files.
	 * If {@link zip} provided, the
	 * files will be added to the zip.
	 * If not, Blob URLs will be returned.
	 */
	public getURLs(type: "costumes" | "sounds", zip?: JSZip) {
		if (!zip) {
			// No zip provided
			return this[type].reduce<Record<string, string>>(
				(urls, file) => ({
					...urls,
					[path.parse(file.name).name]: URL.createObjectURL(file),
				}),
				{}
			);
		}

		return this[type].reduce<Record<string, string>>((urls, file) => {
			zip.file(file.name, file);
			return {
				...urls,
				// Path to file in zip
				[path.parse(file.name).name]: path.join(this.name, file.name),
			};
		}, {});
	}
}

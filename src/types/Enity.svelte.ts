/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Entity reactive model
 * @copyright Tomáš Wróbel 2025
 */
import * as Blockly from "blockly/core";
import type JSZip from "jszip";
import * as path from "path";
import type {Variable} from "./Variable";
import click from "../assets/sounds/click.mp3?url&inline";
import scrappy from "../assets/svgs/scrappy.svg?raw";
import stage from "../assets/svgs/stage.svg?raw";
import BlocksToCode from "@scrap/code-transformers/blocksToCode";
import * as SWC from "@scrap/utils/swc";
import {EntityAsset} from "./EntityAsset.svelte";
import {assert} from "@juvofy/lib/utils/assert";
import {ConnectionChecker} from "@scrap/blockly/plugins/ConnectionChecker";

const scrappyAsset = new EntityAsset([scrappy], "Scrappy.svg", {type: "image/svg+xml"});

export class Entity {
	public currentCostume: EntityAsset;
	public readonly sounds = $state([EntityAsset.fromDataURL(click, "click.mp3")]);
	public init: Record<string, unknown>;

	public name: string;
	public readonly isStage: boolean;
	public readonly costumes: EntityAsset[];
	public readonly variables = $state<Variable[]>([]);

	public mode = $state<"code" | "blocks" | "costumes" | "sounds">("blocks");
	public typescript = $state<string>();

	public constructor(name: string, isStage: boolean, costume: EntityAsset, init = {}) {
		this.costumes = $state([costume]);
		this.currentCostume = $state(costume);
		this.init = $state(init);
		this.name = $state(name);
		this.isStage = isStage;

		this.workspace.connectionChecker = new ConnectionChecker();
	}

	public static createSprite(name: string, asset = scrappyAsset) {
		const sprite = new this(name, false, asset, {
			x: 0,
			y: 0,
			direction: 90,
			size: 100,
			rotationStyle: 0,
			visible: true,
			draggable: false,
		});
		return sprite;
	}

	public static createStage() {
		return new this(
			"Stage",
			true,
			new EntityAsset([stage], "Stage.svg", {type: "image/svg+xml"}),
		);
	}

	/** Helper workspace for generating code. */
	public readonly workspace = new Blockly.Workspace();

	private getFileURLs(
		zip: JSZip | undefined | null,
		urls: Record<string, string>,
		file: EntityAsset,
	) {
		return {
			...urls,
			[file.name]: zip?.file(file.fullName, file.arrayBuffer())
				? path.join(this.name, file.fullName)
				: file.blobUrl,
		};
	}

	private blocksToCode?: BlocksToCode;

	public generateProductionCode(zip?: JSZip) {
		const typescript = this.generatePreviewCode(false);
		const result = SWC.transform(typescript);
		const body = this.blocksToCode?.prefixLines(result, "\t");
		const reducer = this.getFileURLs.bind(this, zip?.folder(this.name));
		const configuration = {
			...this.init,
			current: this.costumes.indexOf(this.currentCostume),
			images: this.costumes.reduce<Record<string, string>>(reducer, {}),
			sounds: this.sounds.reduce<Record<string, string>>(reducer, {}),
		};
		const entity = `$[${JSON.stringify(this.name)}]`;
		const init = `${entity} = new Scrap.${
			this.isStage ? "Stage" : "Sprite"
		}(${JSON.stringify(configuration, null, "\t")});`;
		return `${init}\n${entity}.init(async self => {\n${body}});\n${
			this.isStage ? "" : `${entity}.addTo($["Stage"])`
		}\n`;
	}

	public generatePreviewCode(prettify: boolean) {
		const codeGenerator = (this.blocksToCode ??= new BlocksToCode(this.variables));
		codeGenerator.INDENT = prettify ? "\t" : "";
		return this.typescript || codeGenerator.workspaceToCode(this.workspace);
	}

	public saveIntoZip(zip: JSZip) {
		const folder = zip.folder(this.name);

		function saveFile(file: EntityAsset) {
			assert(folder, "Failed to create folder");
			folder.file(file.fullName, file.arrayBuffer());
			return file.fullName;
		}

		return {
			name: this.name,
			costumes: this.costumes.map(saveFile),
			sounds: this.sounds.map(saveFile),
			code: this.typescript ?? Blockly.serialization.workspaces.save(this.workspace),
			currentCostume: this.costumes.indexOf(this.currentCostume),
			variables: this.variables,
			isStage: this.isStage,
			init: this.init,
		};
	}

	public static async loadFromState(zip: JSZip, state: ReturnType<Entity["saveIntoZip"]>) {
		async function loadFile(fileName: string) {
			const blob = await zip.file(path.join(state.name, fileName))?.async("blob");
			assert(blob, "Couldn't load a file in the zip");
			return new EntityAsset([blob], fileName, {type: blob.type});
		}
		const costumes = await Promise.all(state.costumes.map(loadFile));
		const sounds = await Promise.all(state.sounds.map(loadFile));
		const entity = new this(
			state.name,
			state.isStage,
			costumes[state.currentCostume],
			state.init,
		);

		entity.costumes.splice(0, entity.costumes.length, ...costumes);
		entity.sounds.splice(0, entity.sounds.length, ...sounds);

		if (typeof state.code === "string") {
			entity.typescript = state.code;
		} else {
			Blockly.serialization.workspaces.load(state.code, entity.workspace);
		}

		entity.variables.splice(0, entity.variables.length, ...state.variables);

		return entity;
	}
}

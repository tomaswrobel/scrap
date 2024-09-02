/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Main application entry point.
 */
import {Entity, Sprite, Stage} from "./components/entity";
import {version} from "scrap-engine/package.json";
import Workspace from "./components/workspace";
import Paint from "./components/paint";
import CodeEditor from "./code/editor";

import fs from "fs";
import * as Parley from "parley.js";

import JSZip from "jszip";
import {saveAs} from "file-saver";
import Sound from "./components/sounds";

import SB3 from "./code/transformers/sb3";
import Tabs from "./components/tabs";

import * as Blockly from "blockly";

const engineStyle = fs.readFileSync("node_modules/scrap-engine/dist/style.css", "utf-8");
const engineScript = fs.readFileSync("node_modules/scrap-engine/dist/engine.js", "utf-8");
const engineCDN = "https://unpkg.com/scrap-engine@" + version;

export class App {
    public readonly container = document.getElementById("app")!;
    private readonly output = document.querySelector("iframe")!;
    private readonly inputs = document.querySelectorAll("input");

    private spritePanelBlock!: Blockly.BlockSvg;
    private tabs!: Tabs;

    private readonly workspace = new Workspace();
    public readonly code = new CodeEditor();

    entities = new Array<Entity>();
    current!: Entity;

    public readonly spritePanel = document.getElementById("sprites")!;
    public readonly stagePanel = document.getElementById("stage")!;

    private scratchFiles = new SB3();

    start(version: string) {
        this.mode("paced");
        this.current = new Stage();
        this.entities.push(this.current);
        this.tabs = new Tabs(
            this.workspace,
            this.code,
            new Paint(),
            new Sound()
        );

        this.stagePanel.addEventListener("click", () => {
            this.stagePanel.classList.add("selected");
            for (const s of this.spritePanel.getElementsByClassName("selected")) {
                s.classList.remove("selected");
            }
            this.select(this.entities[0]);
        });

        this.current.render(this.stagePanel);

        this.output.addEventListener("load", async () => {
            const document = this.output.contentDocument!;

            const engine = document.createElement("script");
            engine.textContent = engineScript;

            const script = document.createElement("script");
            let code = "var $ = {};\n\n";

            try {
                for (const entity of this.entities) {
                    code += await entity.preview();
                    code += "\n\n";
                }

                script.textContent = code;

                Object.assign(this.output.contentWindow || {}, {
                    alert: (message: string) => Parley.fire({
                        title: "Project Alert",
                        body: message,
                        input: "none",
                        cancelButtonHTML: "",
                        confirmButtonHTML: "OK"
                    }),
                    prompt: (message: string) => Parley.fire({
                        title: "Project prompts you...",
                        body: message,
                        input: "text",
                        inputOptions: {
                            placeholder: "Your answer here",
                        },
                        cancelButtonHTML: "Cancel",
                        confirmButtonHTML: "OK"
                    }),
                    confirm: (message: string) => Parley.fire({
                        title: "Project needs to confirm...",
                        body: message,
                        input: "none",
                        cancelButtonHTML: "No",
                        confirmButtonHTML: "Yes"
                    }),
                });

                document.body.append(engine, script);
            } catch (e) {
                await Parley.fire({
                    title: "Runtime Error",
                    body: String(e),
                    input: "none"
                });
            }
        });

        document.getElementById("add")!.addEventListener("click", () => {
            for (var n = 1, name = "Scrappy"; this.entities.some(e => e.name === name); name = `Scrappy ${n++}`);
            this.addSprite(new Sprite(name));
        });

        this.inputs[0].addEventListener("change", () => {
            if (this.inputs[0].accept === ".scrap") {
                this.open(version, this.inputs[0].files![0]);
            }
            if (this.inputs[0].accept === ".sb3") {
                this.import(this.inputs[0].files![0]);
            }
        });

        document.getElementById("handler")!.addEventListener(
            "mousedown",
            this
        );

        this.saveAs = App.save.bind(this, version);

        // Sprite panel
        const workspace = Blockly.inject(
            this.spritePanel.querySelector(".sprite-info")!,
            {
                renderer: "scrap",
                zoom: {
                    startScale: 0.65,
                }
            }
        );
        workspace.showContextMenu = () => {};

        this.spritePanelBlock = workspace.newBlock("spriteinfo", "root");
        this.setUpSpritePanelBlock();

        const scrappy = new Sprite("Scrappy");
        scrappy.variables.push(["My variable", "number"]);
        this.addSprite(scrappy);

        // Finalize
        document.title = `Scrap - Editor v${version}`;
    }

    async select(entity: Entity) {
        if (this.current === entity) {
            return;
        }

        await this.current.dispose();
        this.current = entity;

        // Update the tabs
        // Different sprites may use blocks or code differently
        if (entity.isUsingBlocks() && this.tabs.active === this.code) {
            this.tabs.set(this.workspace);
        } else if (entity.isUsingCode() && this.tabs.active === this.workspace) {
            this.tabs.set(this.code);
        } else if (this.tabs.active) {
            this.tabs.active.update();
        }

        // Update the sprite panel
        if (entity.isStage()) {
            this.spritePanelBlock.setEditable(false);
        } else {
            this.spritePanelBlock.setEditable(true);

            this.spritePanelBlock.getInput("x")!.connection!.targetBlock()!.setFieldValue(entity.getInit("x"), "NUM");
            this.spritePanelBlock.getInput("y")!.connection!.targetBlock()!.setFieldValue(entity.getInit("y"), "NUM");
            this.spritePanelBlock.getInput("size")!.connection!.targetBlock()!.setFieldValue(entity.getInit("size"), "NUM");
            this.spritePanelBlock.getInput("direction")!.connection!.targetBlock()!.setFieldValue(entity.getInit("direction"), "VALUE");

            this.spritePanelBlock.getField("draggable")!.setValue(entity.getInit("draggable") ? "TRUE" : "FALSE");
            this.spritePanelBlock.getField("visible")!.setValue(entity.getInit("visible") ? "TRUE" : "FALSE");
        }
    }

    /**
     * Set up the sprite panel block
     */
    private setUpSpritePanelBlock() {
        const x = this.spritePanelBlock.getInput("x")!;
        const y = this.spritePanelBlock.getInput("y")!;
        const size = this.spritePanelBlock.getInput("size")!;
        const direction = this.spritePanelBlock.getInput("direction")!;

        const draggable = this.spritePanelBlock.getField("draggable") as Blockly.FieldCheckbox;
        const visible = this.spritePanelBlock.getField("visible") as Blockly.FieldCheckbox;

        x.connection!.setShadowState({
            type: "math_number",
            fields: {
                NUM: 0
            }
        });

        y.connection!.setShadowState({
            type: "math_number",
            fields: {
                NUM: 0
            }
        });

        size.connection!.setShadowState({
            type: "math_number",
            fields: {
                NUM: 100
            }
        });

        direction.connection!.setShadowState({
            type: "motion_angle",
            fields: {
                VALUE: 90
            }
        });

        x.connection!.targetBlock()!.getField("NUM")!.setValidator(x => {
            if (!this.current.isStage()) {
                Object.assign(this.current.init, {x});
            } else {
                return null;
            }
        });

        y.connection!.targetBlock()!.getField("NUM")!.setValidator(y => {
            if (!this.current.isStage()) {
                Object.assign(this.current.init, {y});
            } else {
                return null;
            }
        });

        size.connection!.targetBlock()!.getField("NUM")!.setValidator(size => {
            if (!this.current.isStage()) {
                Object.assign(this.current.init, {size});
            } else {
                return null;
            }
        });

        direction.connection!.targetBlock()!.getField("VALUE")!.setValidator(direction => {
            if (!this.current.isStage()) {
                Object.assign(this.current.init, {direction});
            } else {
                return null;
            }
        });

        draggable.setValidator(s => {
            if (!this.current.isStage()) {
                Object.assign(this.current.init, {
                    draggable: s === "TRUE"
                });
            } else {
                return null;
            }
        });

        visible.setValidator(s => {
            if (!this.current.isStage()) {
                Object.assign(this.current.init, {
                    visible: s === "TRUE"
                });
            } else {
                return null;
            }
        });

        visible.setCheckCharacter("\u2714");
        draggable.setCheckCharacter("\u2714");

        this.spritePanelBlock.setDeletable(false);
        this.spritePanelBlock.setMovable(false);
        this.spritePanelBlock.initSvg();
    }

    /**
     * Adds sprite to the panel
     * @param sprite Sprite to add
     * @param select whether to select the sprite immediately
     */
    addSprite(sprite: Sprite, select = true) {
        const element = sprite.render(this.spritePanel);

        const selector = () => {
            this.stagePanel.classList.remove("selected");
            for (const s of this.spritePanel.getElementsByClassName("selected")) {
                s.classList.remove("selected");
            }
            element.classList.add("selected");

            this.select(sprite);
        };

        this.entities.push(sprite);
        this.code.updateLib();

        if (this.workspace.workspace && select) {
            selector();
        } else {
            this.current = sprite;
            element.classList.add("selected");
        }

        element.addEventListener("click", selector);
    }

    /**
     * Removes sprite from the database
     * 
     * @param sprite Sprite to remove
     */
    removeSprite(sprite: Sprite) {
        const index = this.entities.indexOf(sprite);

        if (index === -1) {
            return;
        }

        this.entities.splice(index, 1);
        this.code.updateLib();

        if (sprite === this.current) {
            this.selectStage();
        }
    }

    /**
     * Select the stage and update the tabs
     * Used only when the project is loaded
     * by {@link open} and {@link import}
     * For other cases, use {@link select}
     */
    private selectStage() {
        this.stagePanel.classList.add("selected");
        for (const s of this.spritePanel.getElementsByClassName("selected")) {
            s.classList.remove("selected");
        }

        this.current = this.entities[0];
        const blocks = this.current.isUsingBlocks();

        if (blocks && this.tabs.active === this.code) {
            this.tabs.set(this.workspace);
        } else if (!blocks && this.tabs.active === this.workspace) {
            this.tabs.set(this.code);
        } else if (this.tabs.active) {
            this.tabs.active.update();
        }
    }

    /**
     * Load a project from a file
     * @param currentVersion Version of the current editor
     * @param file SCRAP file to open
     */
    async open(currentVersion: string, file: File | null) {
        if (!file) {
            return;
        }

        this.showLoader("Loading project");
        const zip = await JSZip.loadAsync(file);

        const {version = "0", entities, name, size = 380} = JSON.parse(
            await zip.file("project.json")!.async("string")
        );

        // Check if the project is compatible with the current version
        if (version.split(".")[0] !== currentVersion.split(".")[0]) {
            this.hideLoader();

            const open = await Parley.fire({
                title: "Error",
                body: "This project was created with an incompatible version of Scrap. Do you want to try to open it anyway?",
                input: "none"
            });

            if (open) {
                this.showLoader(`Loading project (v${version})`);
            } else {
                return;
            }
        }

        this.inputs[1].value = name;
        this.container.style.setProperty("--output", `${size}`);

        this.entities = [];
        this.cleanPanels();

        for (const data of entities) {
            const entity = await Entity.load(zip, data);

            if (entity instanceof Stage) {
                this.entities.push(entity);
                entity.render(this.stagePanel);
            } else {
                this.addSprite(entity, false);
            }
        }

        this.selectStage();
        this.hideLoader();
    }

    /**
     * Import a project from a file
     * @param file SB3 file to import
     */
    async import(file?: File | null) {
        if (!file) {
            return;
        }

        this.showLoader("Transforming project");
        this.entities = [];
        this.cleanPanels();

        try {
            await this.scratchFiles.transform(file);
            this.selectStage();
        } catch (e) {
            await Parley.fire({
                title: "Error",
                body: String(e),
                input: "none"
            });
        }

        this.current = this.entities[0];
        this.hideLoader();
    }

    /**
     * Removes all the entities from the DOM
     */
    private cleanPanels() {
        for (let i = 1; i < this.spritePanel.children.length; i++) {
            this.spritePanel.children[i].remove();
        }

        this.stagePanel.innerHTML = '<span class="name">Stage</span>';
    }

    /**
     * Export the project to a zip file
     * containing all the entities and the engine
     */
    async export() {
        const type = await Parley.fire({
            title: "Export",
            body: "How do you want to include the engine?",
            input: "select",
            inputOptions: {
                "inline": "Inline (larger file size)",
                "external": "External (requires internet connection to run)"
            }
        });

        if (type === false) {
            return;
        }

        const zip = new JSZip();

        if (type === "inline") {
            zip.file("engine.js", engineScript);
            zip.file("style.css", engineStyle);
        }

        let scripts = "<script>var $ = {};</script>";

        for (const e of this.entities) {
            await e.export(zip);
            scripts += `<script src="${e.name}/script.js"></script>`;
        }

        const index = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>Scrap Project</title>
                <meta charset="utf-8">
                <link href="${type === "inline" ? "style.css" : engineCDN + "/dist/style.css"}" rel="stylesheet">
                <script src="${type === "inline" ? "engine.js" : engineCDN + "/dist/engine.js"}"></script>
            </head>
            <body>
                ${scripts}
            </body>
        `;

        const indent = /[\r\n]| {4}/g;
        const {width, height} = this.getOutputSize();

        const sized = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>Scrap Project</title>
                <meta charset="utf-8">
            </head>
            <body>
                <iframe id="output" width="${width}" height="${height}" src="index.html"></iframe>
            </body>
        `;

        zip.file("index.html", index.replace(indent, ""));
        zip.file(`${width}x${height}.html`, sized.replace(indent, ""));

        saveAs(await zip.generateAsync({type: "blob"}), this.inputs[1].value + ".zip");
    }

    private static async save(this: App, version: string) {
        const zip = new JSZip();
        const entities = this.entities.map(e => e.save(zip));
        zip.file(
            "project.json",
            JSON.stringify({
                entities,
                version,
                size: +this.container.style.getPropertyValue("--output"),
                name: this.inputs[1].value
            })
        );

        saveAs(await zip.generateAsync({type: "blob"}), this.inputs[1].value + ".scrap");
    }

    /**
     * Handle the resize of the output
     */
    handleEvent(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "mousedown") {
            this.output.style.setProperty("pointer-events", "none");
            document.addEventListener("mousemove", this);
            document.addEventListener("mouseup", this);
        } else if (e.type === "mousemove") {
            this.tabs.effects.hide();

            let output = +this.container.style.getPropertyValue("--output");

            output -= e.movementX;

            if (output > 620) {
                output = 620;
            }

            if (output < 260) {
                output = 260;
            }

            if (output >= 375 && output <= 385) {
                output = 380;
            }

            this.container.style.setProperty(
                "--output",
                `${output}`
            );
            this.workspace.workspace.resize();
        } else if (e.type === "mouseup") {
            this.tabs.effects.show();
            this.output.style.removeProperty("pointer-events");
            document.removeEventListener("mousemove", this);
            document.removeEventListener("mouseup", this);
        }
    }

    getOutputSize() {
        const size = this.container.style.getPropertyValue("--output");
        const width = +size + 100;
        return {
            width,
            height: Math.round(width * .75)
        };
    }

    /**
     * Hide the loading indicator
     * @see showLoader
     */
    hideLoader() {
        document.body.removeAttribute("data-loading");
    }

    /**
     * Show a loading indicator
     * @param reason Reason for showing the loader
     * @see hideLoader
     */
    showLoader(reason: string) {
        document.body.dataset.loading = reason;
    }

    // For index.html
    dropdowns = document.querySelectorAll<HTMLLIElement>("li.dropdown")!;
    modes = document.querySelectorAll<HTMLAnchorElement>("[data-for]");

    dropdown(i: number) {
        if (this.dropdowns[i].classList.toggle("shown")) {
            document.addEventListener(
                "mousedown",
                e => {
                    if (!this.dropdowns[i].contains(e.target as Node)) {
                        e.preventDefault();
                        this.dropdowns[i].classList.remove("shown");
                    }
                },
                {once: true}
            );
        }
    }

    /**
     * Set the mode of the frame (paced or turbo)
     * @param mode mode to set
     */
    mode(mode: string) {
        this.output.dataset.mode = mode;

        for (const m of this.modes) {
            m.style.setProperty("visibility", m.dataset.for === mode ? "visible" : "hidden");
        }
    }

    /**
     * Picks a file from the file system
     * @param accept mime type of the file
     */
    pick(accept: string) {
        this.inputs[0].accept = accept;
        this.inputs[0].showPicker();
    }

    // For index.html
    saveAs?: () => void;
}
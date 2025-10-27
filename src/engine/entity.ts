/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Engine's Entities (sprite / stage)
 * @copyright Tomáš Wróbel 2025
 */
import {assert} from "@scrap/utils/assert";
import {event, method} from "./decorators";
import Messages from "./messages";
import Timer from "./timer";
import {abort, isTurbo} from "./utils";
import {
	DefaultVariableValues,
	isVariableType,
	type Variable,
	type VariableType,
} from "./variables";

const toEvent = {
	"clicked": "click",
	"pressed": "mousedown",
	"released": "mouseup",
	"left": "mouseleave",
	"entered": "mouseenter",
	"moved": "mousemove",
	"double-clicked": "dblclick",
};

const backdrops = new Messages();
const messages = new Messages();
const timer = new Timer();

abstract class Entity {
	public readonly variables = new Map<string, Variable>();
	public readonly stopController = new EventTarget();
	protected abort = abort;

	public effects = {
		brightness: 100,
		color: 0,
		ghost: 0,
		grayscale: 0,
	};
	public volume = 100;

	public get pace() {
		return isTurbo() ? 0 : 33;
	}

	public readonly images: Entity.Assets;
	public readonly sounds: Entity.Assets;

	public abstract element: HTMLElement;
	public abstract whenFlag(fn: Entity.Callback): Promise<void>;

	public audios: HTMLAudioElement[] = [];
	public current: string;

	constructor(options: Entity.Options) {
		this.images = options.images;
		this.sounds = options.sounds;
		this.current = Object.keys(this.images)[options.current];
	}

	protected generateID() {
		return Date.now().toString(36);
	}

	protected getBackdrops() {
		return backdrops;
	}

	public init(fn: Entity.Callback) {
		window.setTimeout(fn, 0, this);
	}

	/**
	 * Clears the effects of the entity.
	 */
	@method
	public async clearEffects() {
		this.effects.brightness = 100;
		this.effects.color = 0;
		this.effects.ghost = 0;
		this.effects.grayscale = 0;
	}

	abstract update(): void;
	abstract updateVariables(): void;

	/**
	 * @returns CSS filter string.
	 */
	toFilter() {
		return `brightness(${this.effects.brightness}%) hue-rotate(${
			this.effects.color * 3.6
		}deg) grayscale(${this.effects.grayscale}%) opacity(${100 - this.effects.ghost}%)`;
	}

	/**
	 * Changes the effect of the entity.
	 * @param effect effect to change
	 * @param value value to change the effect by
	 */
	@method
	async changeEffect(effect: keyof Entity["effects"], value: number) {
		this.effects[effect] += value;
		this.update();
	}

	/**
	 * Sets the effect of the entity.
	 * @param effect effect to set
	 * @param value value to set the effect to
	 */
	@method
	async setEffect(effect: keyof Entity["effects"], value: number) {
		this.effects[effect] = value;
		this.update();
	}

	/**
	 * Waits for the specified amount of seconds.
	 * @param seconds Seconds to wait.
	 * @returns a void promise.
	 */
	@method
	public wait(seconds: number) {
		return new Promise(resolve => window.setTimeout(resolve, seconds * 1000));
	}

	/**
	 * @param fn Function to execute when the entity is fully loaded.
	 */
	@event
	async whenLoaded(fn: Entity.Callback) {
		window.setTimeout(fn, 0, this);
	}

	@event
	async whenKeyPressed(key: string, fn: Entity.Callback) {
		window.addEventListener(
			"keydown",
			e => {
				if (key === "any" || e.key === key) {
					void fn(this);
				}
			},
			{signal: this.abort.signal},
		);
	}

	/**
	 * @param event Event to listen for.
	 * @param fn Function to execute when the event is triggered.
	 */
	@event
	async whenMouse(event: keyof typeof toEvent, fn: Entity.Callback) {
		this.element.addEventListener(
			toEvent[event],
			e => {
				void fn(this);
				e.stopPropagation();
			},
			{signal: this.abort.signal},
		);
	}

	/**
	 * @param msg Event to listen for.
	 * @param fn Function to execute when the event is triggered.
	 */
	@event
	async whenReceiveMessage(msg: string, fn: Entity.Callback) {
		const listenerId = this.generateID();

		messages.listeners.push({msg, listenerId});
		messages.addEventListener(
			msg,
			e => {
				const {detail} = e as Messages.Event;

				void fn(this).then(() =>
					document.dispatchEvent(
						new CustomEvent("ScrapMessageDone", {
							detail: {
								listenerId,
								msgId: detail,
							},
						}),
					),
				);
			},
			{signal: this.abort.signal},
		);
	}

	/**
	 * Broadcasts a message to all entities.
	 * @param msg Message to broadcast
	 */
	@method
	async broadcastMessage(msg: string) {
		messages.dispatchEvent(new CustomEvent(msg, {detail: this.generateID()}));
	}

	/**
	 * Broadcasts a message to all entities and waits for them to finish executing the message.
	 * @param msg Message to broadcast
	 * @returns a promise that resolves when all entities have finished executing the message
	 */
	@method
	broadcastMessageWait(msg: string) {
		const msgId = this.generateID();

		let listeners = messages.listeners.filter(listener => listener.msg === msg);

		messages.dispatchEvent(new CustomEvent(msg, {detail: msgId}));

		return new Promise<void>(resolve => {
			document.addEventListener(
				"ScrapMessageDone",
				function done(e) {
					if (e.detail.msgId === msgId) {
						listeners = listeners.filter(
							listener => listener.listenerId !== e.detail.listenerId,
						);

						if (!listeners.length) {
							document.removeEventListener("ScrapMessageDone", done);
							resolve();
						}
					}
				},
				{signal: this.abort.signal},
			);
		});
	}

	/**
	 * Switches the backdrop to the specified backdrop.
	 * @param value Name or index of the backdrop
	 * @returns the id of the listeners
	 */
	abstract switchBackdropTo(value: number | string): Promise<string>;

	@method
	async nextBackdrop() {
		const backdrops = Object.keys(this.images);
		const index = backdrops.indexOf(this.current);
		await this.switchBackdropTo((index + 1) % backdrops.length);
	}

	/**
	 * Listens for a backdrop change.
	 * @param name Name of the backdrop to listen for
	 * @param fn Function to execute when the backdrop changes
	 */
	@event
	async whenBackdropChangesTo(name: string, fn: Entity.Callback) {
		const listenerId = this.generateID();

		backdrops.listeners.push({msg: name, listenerId});
		backdrops.addEventListener(
			name,
			e => {
				const {detail} = e as Messages.Event;

				void fn(this).then(() =>
					document.dispatchEvent(
						new CustomEvent("ScrapMessageDone", {
							detail: {
								listenerId,
								msgId: detail,
							},
						}),
					),
				);
			},
			{signal: this.abort.signal},
		);
	}

	/**
	 * Switch to backdrop and wait for all listeners to finish executing.
	 * @param name Name of the backdrop
	 * @returns a promise that resolves when all listeners have finished executing
	 */
	@method
	async switchBackdropToWait(name: string) {
		let listeners = backdrops.listeners.filter(listener => listener.msg === name);

		const msgId = await this.switchBackdropTo(name);

		return new Promise<void>(resolve => {
			document.addEventListener(
				"ScrapMessageDone",
				function done(e) {
					if (e.detail.msgId === msgId) {
						listeners = listeners.filter(
							listener => listener.listenerId !== e.detail.listenerId,
						);

						if (!listeners.length) {
							document.removeEventListener("ScrapMessageDone", done);
							resolve();
						}
					}
				},
				{signal: this.abort.signal},
			);
		});
	}

	/**
	 * Starts a sound.
	 * @param name Sound to play
	 */
	@method
	async playSound(name: string) {
		const audio = new Audio(this.sounds[name]);
		audio.volume = this.volume / 100;
		this.audios.push(audio);

		audio.onended = () => {
			this.audios = this.audios.filter(a => a !== audio);
		};

		await audio.play();
	}

	/**
	 * Starts a sound and waits for it to finish playing.
	 * @param name Sound to play
	 * @returns a promise that resolves when the sound has finished playing
	 */
	@method
	playSoundUntilDone(name: string) {
		return new Promise<void>(resolve => {
			const audio = new Audio(this.sounds[name]);
			audio.volume = this.volume / 100;
			this.audios.push(audio);

			audio.onended = () => {
				this.audios = this.audios.filter(a => a !== audio);
				resolve();
			};

			void audio.play();
		});
	}

	/**
	 * Sets the volume of the
	 * entity and all active
	 * sounds
	 * @param volume 0-100
	 */
	@method
	async setVolume(volume: number) {
		this.volume = volume;
		this.updateVolume();
	}

	/**
	 * Changes the volume of the
	 * entity and all active
	 * sounds
	 * @param volume 0-100
	 */
	@method
	async changeVolume(volume: number) {
		this.volume += volume;
		this.updateVolume();
	}

	private updateVolume() {
		for (const audio of this.audios) {
			audio.volume = this.volume / 100;
		}
	}

	/**
	 * @param name Name of the variable
	 * @returns the variable
	 */
	@method
	async getVariable(name: string) {
		const variable = this.variable(name);
		assert(variable, new ReferenceError(`Variable called "${name}" wasn't declared.`));
		return variable.value;
	}

	/**
	 * @param name Name of the variable
	 * @param value Value to set the variable to
	 * @param operator Operator to use when setting the variable
	 */
	@method
	async setVariable(name: string, value: any) {
		const variable = this.variable(name);
		assert(variable, new ReferenceError(`Variable called "${name}" wasn't declared.`));

		if (variable.types.some(type => !isVariableType(type, value))) {
			throw new TypeError(
				`Invalid value received. Variable called "${name}" requires values of type ${variable.types.join(" | ")}.`,
			);
		}

		variable.value = value;

		if (variable.visible) {
			this.updateVariables();
		}
	}

	@method
	async changeVariable(name: string, value: number) {
		const variable = this.variable(name);
		assert(variable, new ReferenceError(`Variable called "${name}" wasn't declared.`));

		if (variable.types.some(type => !isVariableType(type, value))) {
			throw new TypeError(
				`Invalid value received. Variable called "${name}" requires values of type ${variable.types.join(" | ")}.`,
			);
		}

		variable.value = value;

		if (variable.visible) {
			this.updateVariables();
		}
	}

	/**
	 * Declares a variable.
	 * @param name The name of the variable
	 * @param value The value of the variable
	 */
	@method
	async declareVariable(name: string, ...types: VariableType[]) {
		this.variables.set(name, {
			value: DefaultVariableValues[types[0]],
			visible: false,
			types,
		});
	}

	/**
	 * @param name Name of the variable to hide
	 */
	@method
	async hideVariable(name: string) {
		const variable = this.variable(name);
		assert(variable, new ReferenceError(`Variable called "${name}" wasn't declared.`));
		variable.visible = false;
		this.updateVariables();
	}

	/**
	 * @param name Name of the variable to show
	 */
	@method
	async showVariable(name: string) {
		const variable = this.variable(name);
		assert(variable, new ReferenceError(`Variable called "${name}" wasn't declared.`));
		variable.visible = true;
		this.updateVariables();
	}

	@method
	async getTimer() {
		return (Date.now() - timer.now) / 1000;
	}

	@method
	async resetTimer() {
		timer.reset();
	}

	@event
	async whenTimerElapsed(seconds: number, fn: Entity.Callback) {
		timer.whenElapsed(seconds * 1000, () => fn(this));
	}

	variable(name: string) {
		return this.variables.get(name);
	}

	public createSelf(): this {
		return Object.create(this);
	}

	public stopOtherScripts() {
		this.stopController.dispatchEvent(new CustomEvent("stop", {detail: this}));
	}
}

declare namespace Entity {
	export type Callback = (this: void, self: Entity) => Promise<void>;
	export type Assets = Record<string, string>;

	export interface Options {
		images: Assets;
		sounds: Assets;
		current: number;
	}
}

export default Entity;

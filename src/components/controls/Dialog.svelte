<script lang="ts" module>
	/**
	 * This file is a part of Scrap, an app for helping to migrate
	 * from block-based programming into text-based programming languages.
	 *
	 * You should have received a copy of the MIT License, if not, please
	 * visit https://opensource.org/licenses/MIT. To verify the code, visit
	 * the official repository at https://github.com/tomaswrobel/scrap.
	 *
	 * @license MIT
	 * @fileoverview Dialog component.
	 * @copyright Tomáš Wróbel 2025
	 */
	import type {HTMLAttributes, MouseEventHandler, HTMLInputAttributes} from "svelte/elements";
	import Button from "./Button.svelte";
	import type {Snippet} from "svelte";
	import {event} from "@scrap/utils/event.ts";

	/**
	 * Map of input types to their options.
	 */
	export interface Inputs {
		none: [boolean, Record<never, never>];
		file: [FileList, FileOptions];
		range: [number, NumberOptions];
		number: [number, NumberOptions];
		tel: [string, TextOptions];
		text: [string, TextOptions];
		email: [string, TextOptions];
		search: [string, TextOptions];
		password: [string, TextOptions];
		radio: [string, SelectionOptions];
		select: [string, SelectionOptions];
		textarea: [string, TextareaOptions];
		checkbox: [string[], SelectionOptions];
		toggle: [string[], SelectionOptions];
	}

	export interface CommonInputOptions {}

	export type DialogOptions<I extends keyof Inputs = keyof Inputs> = {
		type: I;
		closeWhenBackdropClicked?: boolean;
		inputOptions?: Inputs[I][1];
		title?: string | Snippet;
		value?: Inputs[I][0];
		body?: string | Snippet;
		cancelButton?: string | boolean | Snippet;
		confirmButton?: string | boolean | Snippet;
	};

	export interface FileOptions {
		accept?: string;
		multiple?: boolean;
	}

	export interface NumberOptions {
		min?: number;
		max?: number;
		step?: number;
		placeholder?: string;
	}

	export interface TextareaOptions {
		rows?: number;
		cols?: number;
		placeholder?: string;
	}

	export interface TextOptions {
		/**
		 * Regular expression used to validate the input
		 */
		pattern?: RegExp;
		placeholder?: string;
	}

	export interface SelectionOptions {
		[x: string]: string;
	}

	export interface Props extends HTMLAttributes<HTMLDialogElement> {
		element?: HTMLDialogElement;
		onclick?: undefined;
		children?: undefined;
	}

	function isInputType<I extends keyof Inputs>(
		options: Record<"type", keyof Inputs>,
		...inputs: I[]
	): options is DialogOptions<I> {
		return inputs.includes(options.type as I);
	}

	export const escapeOnBackdrop: MouseEventHandler<HTMLDialogElement> = event => {
		if (event.target === event.currentTarget) {
			event.currentTarget.close();
		}
	};

	const SAVE_VALUE = "dialog-save-value";
</script>

<script lang="ts">
	let {element = $bindable(), class: customClass, ...attributes}: Props = $props();
	let options = $state<DialogOptions>();

	export function close() {
		element?.close(SAVE_VALUE);
	}

	export function cancel() {
		element?.close();
	}

	export function isOpen() {
		return element ? element.open : false;
	}

	export function fire<I extends keyof Inputs = "none">({
		type = "none" as I,
		...dialogOptions
	}: Partial<DialogOptions<I>>) {
		return new Promise<Inputs[I][0] | false>((resolve, reject) => {
			if (!element) {
				return reject("Dialog element is not initialized.");
			}

			if (isOpen()) {
				return reject("Dialog is already open.");
			}

			options = {
				type,
				...dialogOptions,
			};
			element.showModal();

			element.addEventListener(
				"close",
				function (this) {
					if (!options || !isInputType(options, options.type)) {
						return;
					}
					resolve(
						this.returnValue === SAVE_VALUE && (options.value ?? type === "none"),
					);
					this.returnValue = "";
					options = undefined;
				},
				{once: true},
			);
		});
	}

	const id = $props.id();
</script>

{#snippet dialogPart(value: string | true | Snippet, defaultValue?: string)}
	{#if typeof value === "function"}
		{@render value()}
	{:else if typeof value === "string"}
		{value}
	{:else}
		{defaultValue}
	{/if}
{/snippet}

<dialog
	bind:this={element}
	class={[customClass, "modal"]}
	{...attributes}
	{id}
	{@attach event(
		"click",
		(options?.closeWhenBackdropClicked ?? true) ? escapeOnBackdrop : () => {},
	)}
>
	{#if options}
		<div class="modal-box">
			<h3 class="text-lg font-bold empty:hidden">
				{options.title}
			</h3>
			{#if options.body}
				<p class="py-4">
					{@render dialogPart(options.body)}
				</p>
			{/if}
			{#if isInputType(options, "select")}
				<select class="select w-full" bind:value={options.value}>
					{#each Object.entries(options.inputOptions ?? {}) as [value, label] (value + label)}
						<option {value}>{label}</option>
					{/each}
				</select>
			{:else if isInputType(options, "textarea")}
				<textarea
					class="textarea w-full"
					{...options.inputOptions}
					bind:value={options.value}
				></textarea>
			{:else if isInputType(options, "checkbox", "toggle", "radio")}
				{@const rest: HTMLInputAttributes = {class: options.type, name: id}}
				<div class="flex flex-col gap-2">
					{#each Object.entries(options.inputOptions ?? {}) as [value, label], i (value + label)}
						<label class="flex gap-2">
							{#if options.type === "radio"}
								<input
									defaultChecked={!i}
									{...rest}
									{value}
									type="radio"
									bind:group={options.value}
								/>
							{:else}
								<input
									{...rest}
									{value}
									type="checkbox"
									bind:group={options.value}
								/>
							{/if}
							<span>{label}</span>
						</label>
					{/each}
				</div>
			{:else if isInputType(options, "number", "range")}
				<input
					{...options.inputOptions}
					class={[{number: "number", range: "range"}[options.type], "w-full"]}
					bind:value={() => options!.value, v => (options!.value = Number(v))}
				/>
			{:else if isInputType(options, "tel", "email", "search", "text", "password")}
				{@const {pattern, ...props} = options.inputOptions ?? {}}
				<input
					{...props}
					class="input w-full"
					pattern={pattern?.source}
					bind:value={options.value}
				/>
			{:else if isInputType(options, "file")}
				<input
					type="file"
					class="file-input w-full"
					{...options.inputOptions}
					bind:files={options.value}
				/>
			{/if}

			<form class="modal-action" action="javascript:{id}.close('{SAVE_VALUE}')">
				{#if options.confirmButton !== false}
					<Button
						variant="primary"
						formmethod="post"
						type="submit"
						disabled={!options.value && options?.type !== "none"}
					>
						{@render dialogPart(options?.confirmButton ?? true, "OK")}
					</Button>
				{/if}
				{#if options.cancelButton !== false}
					<Button formmethod="dialog" type="submit">
						{@render dialogPart(options?.cancelButton ?? true, "Cancel")}
					</Button>
				{/if}
			</form>
		</div>
	{/if}
</dialog>

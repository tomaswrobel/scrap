<script lang="ts" module>
	import type {HTMLAttributes, MouseEventHandler} from "svelte/elements";
	import {on} from "svelte/events";

	/**
	 * Map of input types to their options.
	 */
	export interface Inputs {
		none: [boolean, Record<never, never>];
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

	export type InputOptions<I extends keyof Inputs = keyof Inputs> = Inputs[I][1] & {
		type: I;
		value?: Inputs[I][0];
		title?: string;
		body?: string;
	};

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
		options: Record<string, string>;
	}

	export interface Props extends HTMLAttributes<HTMLDialogElement> {
		element?: HTMLDialogElement;
		onclick?: undefined;
		children?: undefined;
	}

	function isInputType<I extends keyof Inputs>(
		options: Record<"type", keyof Inputs>,
		...inputs: I[]
	): options is InputOptions<I> {
		return inputs.includes(options.type as I);
	}

	export const onclick: MouseEventHandler<HTMLDialogElement> = event => {
		if (event.target === event.currentTarget) {
			event.currentTarget.close();
		}
	};
</script>

<script lang="ts">
	let {element = $bindable(), class: customClass, ...attributes}: Props = $props();
	let init = $state<InputOptions>();
	let form = $state<HTMLFormElement>();

	export function close() {
		if (element && form) {
			const data = new FormData(form);
			if (data.has("number")) {
				const number = data.get("number") ?? "0";

				if (typeof number === "string") {
					element.close(number);
				}
			} else if (data.has("string")) {
				element.close(JSON.stringify(data.get("string")));
			} else if (data.has("array")) {
				element.close(JSON.stringify(data.getAll("array")));
			} else if (form.querySelector("input")) {
				element.close("[]");
			} else {
				element.close("true");
			}
		}
	}

	export function cancel() {
		element?.close();
	}

	export function isOpen() {
		return element ? element.open : false;
	}

	export function fire<I extends keyof Inputs>(options: InputOptions<I>) {
		if (!element) {
			throw new Error("Dialog element is not initialized.");
		}

		init = options;
		element.showModal();

		return new Promise<Inputs[I][0]>((resolve, reject) => {
			if (typeof element !== "object") {
				reject(new Error("Dialog element is not initialized."));
				return;
			}

			element.addEventListener(
				"close",
				function (this) {
					resolve(JSON.parse(this.returnValue || "false") as Inputs[I][0]);
					this.returnValue = "";
				},
				{once: true},
			);
		});
	}

	const uuid = $props.id();
	$effect(() => on(window, "message", e => e.data === uuid && close()));
</script>

<dialog bind:this={element} {onclick} class={[customClass, "modal"]} {...attributes}>
	<div class="modal-box">
		<h3 class="text-lg font-bold empty:hidden">
			{init?.title}
		</h3>
		<p class="py-4 empty:hidden">
			{init?.body}
		</p>
		{#if init}
			{#if isInputType(init, "select")}
				<select class="select w-full" name="string">
					{#each Object.entries(init.options) as [value, label] (value + label)}
						<option {value}>{label}</option>
					{/each}
				</select>
			{:else if isInputType(init, "textarea")}
				{@const {title: _0, body: _1, ...rest} = init}
				<textarea class="textarea w-full" name="string" {...rest}></textarea>
			{:else if isInputType(init, "checkbox", "radio", "toggle")}
				<div class="flex flex-col gap-2">
					{#each Object.entries(init.options) as [value, label] (value + label)}
						<label class="flex gap-2">
							<input
								{value}
								class={init.type}
								type={init.type === "toggle" ? "checkbox" : init.type}
								name={init.type === "radio" ? "string" : "array"}
								checked={init.type === "radio"
									? init.value === value
									: init.value?.includes(value)}
							/>
							<span>{label}</span>
						</label>
					{/each}
				</div>
			{:else if isInputType(init, "number", "range")}
				{@const {title: _0, body: _1, ...rest} = init}
				<input
					name="number "
					class={[init.type === "number" ? "input" : "range", "w-full"]}
					{...rest}
				/>
			{:else if isInputType(init, "tel", "email", "search", "text", "password")}
				{@const {pattern, ...props} = init}
				<input
					class="input w-full"
					pattern={pattern?.source}
					{...props}
					name="string"
				/>
			{/if}
		{/if}
		<form class="modal-action" action="javascript:postMessage('{uuid}')" bind:this={form}>
			<button class="btn btn-primary" formmethod="post">OK</button>
			<button class="btn" formmethod="dialog">Cancel</button>
		</form>
	</div>
</dialog>

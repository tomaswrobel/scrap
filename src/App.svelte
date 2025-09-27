<script lang="ts" module>
	import * as Context from "$context";
	import SvelteLogo from "./assets/svelte.svg?icon";
	import ContextMenu from "./components/controls/ContextMenu.svelte";
	import ContextMenuOption from "./components/controls/ContextMenuOption.svelte";
	import Dialog from "./components/controls/Dialog.svelte";
	import CodeGithubDark from "./utils/assert?theme=github-dark&shiki";
	import CodeGithubDarkDefault from "./utils/assert?theme=github-dark-default&shiki";

	declare module "$context" {
		interface Map {
			app: {
				readonly dialog: Dialog;
			};
		}
	}
</script>

<script lang="ts">
	import "./app.css";
	import Button from "./components/controls/Button.svelte";

	let dialog = $state<Dialog>({
		cancel() {
			// Dialog is not initialized.
		},
		close() {
			// Dialog is not initialized.
		},
		fire: () => Promise.resolve(false),
		isOpen: () => false,
	});

	Context.set("app", {
		get dialog() {
			return dialog;
		},
	});
</script>

<main class="p-10">
	<h2 class="text-xl font-bold">Context menu</h2>
	<ContextMenu
		as="p"
		class="text-center bg-base-200 size-75 flex items-center justify-center rounded text-base-content p-4"
	>
		{#snippet content()}
			<span>Click on me using the right mouse button</span>
		{/snippet}
		{#snippet menu()}
			<ContextMenuOption onuse={() => alert("Hi!")}>
				<span>Hi!</span>
			</ContextMenuOption>
			<ContextMenuOption onuse={() => alert("Menu item!")}>
				<span>Menu item!</span>
			</ContextMenuOption>
			<ContextMenuOption onuse={() => alert("I have a divider!")}>
				<span>I have a divider!</span>
			</ContextMenuOption>
			<div class="divider"></div>
			<ContextMenuOption onuse={() => alert("Hello!")}>
				<span>Hello!</span>
			</ContextMenuOption>
			<ContextMenuOption>
				{#snippet content()}
					<span>Submenu</span>
				{/snippet}
				{#snippet submenu()}
					<ContextMenuOption onuse={() => alert("Item 1")}>
						<span>Item 1</span>
					</ContextMenuOption>
					<ContextMenuOption onuse={() => alert("Ahoj!")}>
						<span>Ahoj!</span>
					</ContextMenuOption>
					<ContextMenuOption>
						{#snippet content()}
							<span>Submenu inside a submenu</span>
						{/snippet}
						{#snippet submenu()}
							<ContextMenuOption onuse={() => alert("Item 1!")}>
								<span>Item 1</span>
							</ContextMenuOption>
							<ContextMenuOption onuse={() => alert("Item 2!")}>
								<span>Item 2</span>
							</ContextMenuOption>
						{/snippet}
					</ContextMenuOption>
				{/snippet}
			</ContextMenuOption>
		{/snippet}
	</ContextMenu>
	<h1>Components</h1>
	<h2>Code</h2>
	<CodeGithubDarkDefault />
	<br />
	<CodeGithubDark />
	<h2>SVG</h2>
	<SvelteLogo width="100" />
	<h2>Dialogs</h2>
	<Button
		variant="primary"
		onclick={async () => {
			const password = await dialog.fire({
				type: "toggle",
				body: "Choose a password",
				title: "I'll hack you",
				options: {
					yes: "Yes",
					no: "No",
				},
			});

			if (password) {
				await dialog.fire({
					type: "none",
					body: `Your password is ${password}`,
					title: "Done.",
				});
			}
		}}
	>
		Open a dialog
	</Button>
	<Dialog bind:this={dialog}></Dialog>
</main>

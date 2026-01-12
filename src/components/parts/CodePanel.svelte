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
	 * @fileoverview Code panel component. Shows Blocks and Code tabs, but allows to accept environment-specific tabs as well. Full IDE includes Painterro and Sound editor, while Demo does not.
	 * @copyright Tomáš Wróbel 2025
	 */
	import {app} from "@scrap/types/App.svelte.ts";
	import CodeToBlocks from "@scrap/code-transformers/codeToBlocks";
	import BlocklyWorkspace from "@scrap/components/BlocklyWorkspace.svelte";
	import MonacoEditor from "@scrap/components/MonacoEditor.svelte";
	import type {HTMLAttributes} from "svelte/elements";
	import Dialog from "@juvofy/lib/components/actions/Dialog";
	import Tab from "@juvofy/lib/components/navigation/Tab";
	import Tabs from "@juvofy/lib/components/navigation/Tabs";

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		isDemo?: boolean;
	}
</script>

<script lang="ts">
	const {children, class: customClass, isDemo = false, ...props}: Props = $props();
	let invalid = $state(false);

	async function switchToBlocksTab() {
		if (app.current.mode === "blocks") {
			return;
		}
		if (invalid) {
			app.dialog.fire({
				title: "Cannot switch to Code tab",
				body: "Please fix the errors in your code before switching to the Code tab.",
			});
		} else {
			await CodeToBlocks.switch(app.current);
			app.current.typescript = undefined;
			app.current.mode = "blocks";
		}
	}

	function switchToCodeTab() {
		if (app.current.mode === "code") {
			return;
		}
		app.current.typescript = app.current.generatePreviewCode(true);
		app.current.mode = "code";
	}
</script>

<div {...props} class={["flex-col flex grow *:last:grow shrink", customClass]}>
	<Tabs variant="lift" bind:tab={app.current.mode}>
		<Tab label="Blocks" id="blocks" onclick={switchToBlocksTab}>
			<BlocklyWorkspace {isDemo} entity={app.current} />
		</Tab>
		<Tab label="Code" id="code" onclick={switchToCodeTab}>
			<MonacoEditor class="h-full" entity={app.current} bind:invalid />
		</Tab>
		{@render children?.()}
	</Tabs>
</div>
<Dialog bind:this={app.dialog} />

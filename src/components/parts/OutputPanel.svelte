<script lang="ts" module>
	import Button from "@scrap/components/controls/Button.svelte";
	import {documentToString} from "@scrap/utils/documentToString.ts";
	import {app} from "@scrap/types/App.svelte.ts";
	import MediaList from "@scrap/components/MediaList.svelte";
	import PlayIcon from "@material-symbols/svg-400/rounded/play_arrow-fill.svg?icon";
	import Stop from "@material-symbols/svg-400/sharp/stop-fill.svg?icon";
	import type {HTMLAttributes} from "svelte/elements";
	import {tw} from "@scrap/utils/tw.ts";
	import {event} from "@scrap/utils/event.ts";
	import type JSZip from "jszip";

	const STATIC_ENGINE_JS = "/engine/index.js";
	const STATIC_ENGINE_CSS = "/engine/index.css";

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		children?: undefined;
	}

	function getHTML(enginePath: string, cssPath: string, zip?: JSZip) {
		const document = window.document.implementation.createHTMLDocument("Scrap Output");

		const engineStyle = document.createElement("link");
		engineStyle.rel = "stylesheet";
		engineStyle.href = cssPath;

		const engineScript = document.createElement("script");
		engineScript.setAttribute("src", enginePath);

		document.head.append(engineStyle, engineScript);

		const executionScript = document.createElement("script");
		executionScript.textContent = `const{Scrap, Color}=ScrapEngine,$={};`;
		executionScript.append(
			...app.entities.map(entity => entity.generateProductionCode(zip)),
		);

		document.body.append(executionScript);
		return documentToString(document);
	}

	export async function saveIntoZip(zip: JSZip) {
		const engineJs = await fetch(STATIC_ENGINE_JS).then(f => f.text());
		const engineCss = await fetch(STATIC_ENGINE_CSS).then(f => f.text());

		zip.file("frame.html", getHTML("./engine.js", "engine.css", zip));
		zip.file("engine.js", engineJs);
		zip.file("engine.css", engineCss);

		const document = window.document.implementation.createHTMLDocument(
			app.name.trim() || "Scrap Project",
		);

		const iframe = document.createElement("iframe");
		iframe.setAttribute("src", "frame.html");
		iframe.dataset.turbo = `${app.turboExecution}`;
		iframe.style.aspectRatio = "4 / 3";
		iframe.style.width = `${app.size}px`;

		document.body.appendChild(iframe);
		zip.file("index.html", documentToString(document));
	}

	const resizingBodyClass = tw(
		"cursor-ew-resize",
		"**:!cursor-ew-resize",
		"**:!pointer-events-none",
	);
</script>

<script lang="ts">
	const props: Props = $props();
	let iframe = $state<HTMLIFrameElement>();
	let lastX = $state<number>();
</script>

<div
	{...props}
	class={[
		props.class,
		"border-base-100 border-l-8 flex flex-col",
		lastX && "pointer-events-none",
		app.current.mode !== "code" && "cursor-ew-resize",
	]}
	{@attach event("mousedown", event => {
		// Currently, Monaco Editor doesn't behave nicely to the layout
		if (event.currentTarget === event.target && app.current.mode !== "code") {
			const mousemove = (e: MouseEvent) => {
				const diff = e.screenX - (lastX ??= event.screenX);
				lastX = e.screenX;
				app.size = Math.max(240, Math.min(app.size - diff, 360));
			};

			document.body.classList.add(...resizingBodyClass);

			const mouseup = () => {
				lastX = undefined;
				document.body.classList.remove(...resizingBodyClass);
				document.removeEventListener("mousemove", mousemove);
				document.removeEventListener("mouseup", mouseup);
			};

			document.addEventListener("mouseup", mouseup);
			document.addEventListener("mousemove", mousemove);
		}
	})}
>
	<div class="h-10 gap-2 flex items-center cursor-auto">
		<Button
			class="btn-square btn-sm cursor-pointer"
			variant="ghost"
			onclick={() =>
				iframe && (iframe.srcdoc = getHTML(STATIC_ENGINE_JS, STATIC_ENGINE_CSS))}
		>
			<PlayIcon class="size-4 fill-current" />
		</Button>
		<Button
			class="btn-square btn-sm cursor-pointer"
			variant="ghost"
			onclick={() => iframe?.contentWindow?.postMessage("STOP", "*")}
		>
			<Stop class="size-4 fill-current" />
		</Button>
		<label class="flex grow gap-2 justify-end items-center pr-2">
			<span class="text-sm/3.5">Turbo mode</span>
			<input type="checkbox" class="toggle toggle-xs" bind:checked={app.turboExecution} />
		</label>
	</div>

	<iframe
		bind:this={iframe}
		width={app.size}
		data-turbo={app.turboExecution}
		class="border-0 aspect-4/3 cursor-auto"
		srcdoc={globalThis.window && getHTML(STATIC_ENGINE_JS, STATIC_ENGINE_CSS)}
		onload={e => {
			const {contentWindow} = e.currentTarget as HTMLIFrameElement;

			if (!contentWindow) {
				return;
			}

			Object.assign(contentWindow, {
				alert(body: string) {
					return app.dialog.fire({
						cancelButton: false,
						title: "Project alerts",
						body,
					});
				},
				confirm(body?: string) {
					return app.dialog.fire({
						title: "Project needs to confirm",
						body,
					});
				},
				prompt(body?: string, value?: string) {
					return app.dialog.fire({
						type: "text",
						title: "Project needs to confirm",
						body,
						value,
					});
				},
			});
		}}
		title="Output"
	></iframe>

	<div class="cursor-auto grow overflow-y-auto" style:--width="{app.size}px">
		<MediaList
			class="gap-4 flex-wrap w-(--width)"
			items={app.entities}
			bind:selected={app.current}
			isDeletable={item => !item.isStage}
		>
			{#snippet image(entity)}
				<img
					src={entity.currentCostume.blobUrl}
					alt={entity.name}
					class="h-8 mx-auto border-base-300"
				/>
			{/snippet}
		</MediaList>
	</div>
</div>

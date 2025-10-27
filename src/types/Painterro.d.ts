/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Painterro type definitions
 * @copyright Tomáš Wróbel 2025
 */
declare module "painterro" {
	export interface ExportableImage {
		imageType: string;
		imageBase64: string;
		imageBlob: Blob;
		image: HTMLImageElement;

		asBlob(type?: string, quality?: number): Blob;
		asDataURL(type?: string, quality?: number): string;
	}

	export type SaveHandler = (
		image: ExportableImage,
		doneCallback: (close: boolean) => void,
	) => void;

	export type OnBeforeCloseHandler = (
		hasUnsavedChanges: boolean,
		doCloseCallback: () => void,
	) => void;

	export interface ColorScheme {
		main?: string;
		control?: string;
		controlShadow?: string;
		controlContent?: string;
		activeControl?: string;
		activeControlContent?: string;
		inputBorderColor?: string;
		inputBackground?: string;
		inputShadow?: string;
		inputText?: string;
		backgroundColor?: string;
		dragOverBarColor?: string;
		hoverControl?: string;
		hoverControlContent?: string;
		toolControlNameColor?: string;
	}
	export type PainterroTool =
		| "select"
		| "crop"
		| "line"
		| "arrow"
		| "rect"
		| "ellipse"
		| "brush"
		| "text"
		| "rotate"
		| "resize"
		| "save"
		| "open"
		| "close"
		| "undo"
		| "redo"
		| "zoomin"
		| "zoomout"
		| "bucket"
		| "settings";

	export interface PainterroOptions {
		id?: string;
		activeColor?: string;
		activeColorAlpha?: number;
		activeFillColor?: string;
		activeFillColorAlpha?: number;
		defaultLineWidth?: number;
		defaultPrimitiveShadowOn?: boolean;
		defaultEraserWidth?: number;
		backgroundFillColor?: string;
		backgroundFillColorAlpha?: number;
		textStrokeColor?: string;
		textStrokeColorAlpha?: number;
		shadowScale?: number;
		defaultFontSize?: number;
		backplateImgUrl?: string;
		defaultTextStrokeAndShadow?: boolean;
		defaultSize?: string;
		defaultTool?: PainterroTool;
		hiddenTools?: PainterroTool[];
		colorScheme?: ColorScheme;
		initText?: string | null;
		initTextColor?: string;
		initTextStyle?: string;
		pixelizePixelSize?: string; // '20%' nebo '20px'
		pixelizeHideUserInput?: boolean;
		availableLineWidths?: number[];
		availableArrowLengths?: number[];
		defaultArrowLength?: number;
		availableEraserWidths?: number[];
		availableFontSizes?: number[];
		toolbarPosition?: "top" | "bottom";
		fixMobilePageReloader?: boolean;
		language?: string;
		how_to_paste_actions?: (
			| "replace_all"
			| "paste_over"
			| "extend_right"
			| "extend_down"
		)[];
		replaceAllOnEmptyBackground?: boolean;
		hideByEsc?: boolean;
		saveByEnter?: boolean;
		extraFonts?: string[];
		toolbarHeightPx?: number;
		buttonSizePx?: number;
		bucketSensivity?: number;
		customTools?: CustomTool[];
		disableWheelZoom?: boolean;
		onBeforeClose?: OnBeforeCloseHandler;
		onClose?: () => void;
		onHide?: () => void;
		onChange?: (image: ExportableImage) => void;
		onUndo?: (historyState: any) => void;
		onRedo?: (historyState: any) => void;
		onImageFailedOpen?: () => void;
		onImageLoaded?: () => void;
		saveHandler?: SaveHandler;
	}

	export interface CustomTool {
		name: string;
		callBack: (instance: PainterroInstance) => void;
		iconUrl: string; // dataURL string or URL
	}

	export interface PainterroInstance {
		setZoom: (zoomPercentage: number) => void;
		show: (openImage?: string | false) => void;
		hide: () => void;
		save: (showNotification?: boolean) => void;
		undo: () => void;
		redo: () => void;
	}

	/**
	 * Hlavní funkce Painterro, která inicializuje a vrací instanci.
	 */
	export default function Painterro(options?: PainterroOptions): PainterroInstance;
}

/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT [from-monaco-editor]
 * @copyright Microsoft Corporation 2025
 *
 * Changed:
 * - Transforming TypeScriptWorker.clearFiles to decorator.
 * - Remapping imports, importing tsMode more efficiently.
 */
import {languages} from "monaco-editor";
import {version as typescriptVersion} from "typescript/package.json";
import {LanguageServiceDefaultsImplementation} from "./LanguageServiceDefaultsImplementation.ts";
import type {MonacoEditorLanguage} from "./MonacoEditorLanguage.ts";
import {setupTokenizer} from "./setupTokenizer.ts";
import "./scrapTheme.ts";

const modeConfigurationDefault: Required<languages.typescript.ModeConfiguration> = {
	completionItems: true,
	hovers: true,
	documentSymbols: true,
	definitions: true,
	references: true,
	documentHighlights: true,
	rename: true,
	diagnostics: true,
	documentRangeFormattingEdits: true,
	signatureHelp: true,
	onTypeFormattingEdits: true,
	codeActions: true,
	inlayHints: true,
};

const defaults: Record<MonacoEditorLanguage, languages.typescript.LanguageServiceDefaults> = {
	typescript: new LanguageServiceDefaultsImplementation(
		{
			allowNonTsExtensions: true,
			strict: true,
			allowJs: true,
			target: 2,
		},
		{noSemanticValidation: false, noSyntaxValidation: false, onlyVisible: false},
		{},
		{},
		modeConfigurationDefault,
	),
	javascript: new LanguageServiceDefaultsImplementation(
		{
			allowNonTsExtensions: true,
			checkJs: true,
			allowJs: true,
			target: 2,
		},
		{noSemanticValidation: false, noSyntaxValidation: false, onlyVisible: false},
		{},
		{},
		modeConfigurationDefault,
	),
};

function getWorker(language: MonacoEditorLanguage) {
	return async function () {
		const mode = await import("./tsMode.ts");
		return mode.getWorker(language);
	};
}

// export to the global based API
languages.typescript = {
	ModuleKind: {
		None: 0,
		CommonJS: 1,
		AMD: 2,
		UMD: 3,
		System: 4,
		ES2015: 5,
		ESNext: 99,
	},
	JsxEmit: {
		None: 0,
		Preserve: 1,
		React: 2,
		ReactNative: 3,
		ReactJSX: 4,
		ReactJSXDev: 5,
	},
	NewLineKind: {
		CarriageReturnLineFeed: 0,
		LineFeed: 1,
	},
	ScriptTarget: {
		ES3: 0,
		ES5: 1,
		ES2015: 2,
		ES2016: 3,
		ES2017: 4,
		ES2018: 5,
		ES2019: 6,
		ES2020: 7,
		ESNext: 99,
		JSON: 100,
		Latest: 99,
	},
	ModuleResolutionKind: {
		Classic: 1,
		NodeJs: 2,
	},
	typescriptVersion,
	typescriptDefaults: defaults.typescript,
	javascriptDefaults: defaults.javascript,
	getTypeScriptWorker: getWorker("typescript"),
	getJavaScriptWorker: getWorker("javascript"),
};

export function setupLanguage(language: MonacoEditorLanguage) {
	languages.register({id: language});
	setupTokenizer(language);

	languages.onLanguage(language, async function () {
		const mode = await import("./tsMode.ts");
		mode.setupLanguage(language, defaults[language]);
	});
}

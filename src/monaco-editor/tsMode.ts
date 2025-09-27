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
 * @fileoverview Just remapped imports.
 */
import type { languages, Uri } from "monaco-editor";
import { CodeActionAdaptor } from "./features/CodeActionAdapter.ts";
import { DefinitionAdapter } from "./features/DefinitionAdapter.ts";
import { DiagnosticsAdapter } from "./features/DiagnosticsAdapter.ts";
import { DocumentHighlightAdapter } from "./features/DocumentHighlightAdapter.ts";
import { FormatAdapter } from "./features/FormatAdapter.ts";
import { FormatOnTypeAdapter } from "./features/FormatOnTypeAdapter.ts";
import { InlayHintsAdapter } from "./features/InlayHintsAdapter.ts";
import { LibFiles } from "./features/LibFiles.ts";
import { OutlineAdapter } from "./features/OutlineAdapter.ts";
import { QuickInfoAdapter } from "./features/QuickInfoAdapter.ts";
import { ReferenceAdapter } from "./features/ReferenceAdapter.ts";
import { RenameAdapter } from "./features/RenameAdapter.ts";
import { SignatureHelpAdapter } from "./features/SignatureHelpAdapter.ts";
import { SuggestAdapter } from "./features/SuggestAdapter.ts";
import type { MonacoEditorLanguage } from "./MonacoEditorLanguage.ts";
import type { TypeScriptWorker } from "./TypeScriptWorker.ts";
import { WorkerManager } from "./WorkerManager.ts";

export type TypeScriptMode = (...uris: Uri[]) => Promise<TypeScriptWorker>;

const workers: Partial<Record<MonacoEditorLanguage, TypeScriptMode>> = {};

export function getWorker(language: MonacoEditorLanguage) {
	return new Promise<TypeScriptMode>((resolve, reject) => {
		if (workers[language]) {
			resolve(workers[language]);
		}
		reject(new Error(`Worker for "${language}" not registered!`));
	});
}

export function setupLanguage(
	language: MonacoEditorLanguage,
	defaults: languages.typescript.LanguageServiceDefaults
) {
	const client = new WorkerManager(language, defaults);
	const libFiles = new LibFiles(client.worker);

	if (defaults.modeConfiguration.completionItems) {
		client.addAdapter(SuggestAdapter);
	}
	if (defaults.modeConfiguration.signatureHelp) {
		client.addAdapter(SignatureHelpAdapter);
	}
	if (defaults.modeConfiguration.hovers) {
		client.addAdapter(QuickInfoAdapter);
	}
	if (defaults.modeConfiguration.documentHighlights) {
		client.addAdapter(DocumentHighlightAdapter);
	}
	if (defaults.modeConfiguration.definitions) {
		client.addAdapter(DefinitionAdapter, libFiles);
	}
	if (defaults.modeConfiguration.references) {
		client.addAdapter(ReferenceAdapter, libFiles);
	}
	if (defaults.modeConfiguration.documentSymbols) {
		client.addAdapter(OutlineAdapter);
	}
	if (defaults.modeConfiguration.rename) {
		client.addAdapter(RenameAdapter, libFiles);
	}
	if (defaults.modeConfiguration.documentRangeFormattingEdits) {
		client.addAdapter(FormatAdapter);
	}
	if (defaults.modeConfiguration.onTypeFormattingEdits) {
		client.addAdapter(FormatOnTypeAdapter);
	}
	if (defaults.modeConfiguration.codeActions) {
		client.addAdapter(CodeActionAdaptor);
	}
	if (defaults.modeConfiguration.inlayHints) {
		client.addAdapter(InlayHintsAdapter);
	}
	if (defaults.modeConfiguration.diagnostics) {
		client.addAdapter(DiagnosticsAdapter, libFiles, defaults);
	}

	workers[language] = client.worker;
}

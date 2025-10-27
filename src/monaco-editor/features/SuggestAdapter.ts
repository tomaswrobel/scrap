import {languages, Range, type editor, type Position, type Uri} from "monaco-editor";
import ts from "typescript";
import {Adapter} from "./Adapter.ts";
import {Kind} from "./Kind.ts";
import {tagToString} from "./tagToString.ts";

@Adapter.providedBy(languages.registerCompletionItemProvider)
export class SuggestAdapter extends Adapter implements languages.CompletionItemProvider {
	public get triggerCharacters(): string[] {
		return ["."];
	}

	public async provideCompletionItems(
		model: editor.ITextModel,
		position: Position,
		_context: languages.CompletionContext,
	): Promise<languages.CompletionList | undefined> {
		const wordInfo = model.getWordUntilPosition(position);
		const wordRange = new Range(
			position.lineNumber,
			wordInfo.startColumn,
			position.lineNumber,
			wordInfo.endColumn,
		);
		const resource = model.uri;
		const offset = model.getOffsetAt(position);

		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const info = await worker.getCompletionsAtPosition(resource.toString(), offset);

		if (!info || model.isDisposed()) {
			return;
		}

		const suggestions: SuggestAdapter.CompletionItem[] = info.entries.map(entry => {
			let range = wordRange;
			if (entry.replacementSpan) {
				const p1 = model.getPositionAt(entry.replacementSpan.start);
				const p2 = model.getPositionAt(
					entry.replacementSpan.start + entry.replacementSpan.length,
				);
				range = new Range(p1.lineNumber, p1.column, p2.lineNumber, p2.column);
			}

			const tags: languages.CompletionItemTag[] = [];
			if (entry.kindModifiers?.includes("deprecated")) {
				tags.push(languages.CompletionItemTag.Deprecated);
			}

			return {
				uri: resource,
				position,
				offset,
				range,
				label: entry.name,
				insertText: entry.name,
				sortText: entry.sortText,
				kind: SuggestAdapter.convertKind(entry.kind),
				tags,
			};
		});

		return {
			suggestions,
		};
	}

	public async resolveCompletionItem(item: SuggestAdapter.CompletionItem) {
		const worker = await this.worker(item.uri);
		const details = await worker.getCompletionEntryDetails(
			item.uri.toString(),
			item.offset,
			item.label,
		);

		if (!details) {
			return item;
		}

		return {
			...item,
			label: details.name,
			kind: SuggestAdapter.convertKind(details.kind),
			detail: ts.displayPartsToString(details.displayParts),
			documentation: {
				value: SuggestAdapter.createDocumentationString(details),
			},
		};
	}

	private static convertKind(kind: string): languages.CompletionItemKind {
		switch (kind) {
			case Kind.primitiveType:
			case Kind.keyword:
				return languages.CompletionItemKind.Keyword;
			case Kind.variable:
			case Kind.localVariable:
				return languages.CompletionItemKind.Variable;
			case Kind.memberVariable:
			case Kind.memberGetAccessor:
			case Kind.memberSetAccessor:
				return languages.CompletionItemKind.Field;
			case Kind.function:
			case Kind.memberFunction:
			case Kind.constructSignature:
			case Kind.callSignature:
			case Kind.indexSignature:
				return languages.CompletionItemKind.Function;
			case Kind.enum:
				return languages.CompletionItemKind.Enum;
			case Kind.module:
				return languages.CompletionItemKind.Module;
			case Kind.class:
				return languages.CompletionItemKind.Class;
			case Kind.interface:
				return languages.CompletionItemKind.Interface;
			case Kind.warning:
				return languages.CompletionItemKind.File;
		}

		return languages.CompletionItemKind.Property;
	}

	private static createDocumentationString(details: ts.CompletionEntryDetails): string {
		let documentationString = ts.displayPartsToString(details.documentation);
		if (details.tags) {
			for (const tag of details.tags) {
				documentationString += `\n\n${tagToString(tag)}`;
			}
		}
		return documentationString;
	}
}

export declare namespace SuggestAdapter {
	interface CompletionItem extends languages.CompletionItem {
		label: string;
		uri: Uri;
		position: Position;
		offset: number;
	}
}

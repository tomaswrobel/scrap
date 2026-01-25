import {languages, type editor} from "monaco-editor";
import type ts from "typescript";
import {Adapter} from "./Adapter";
import {Kind} from "./Kind";

@Adapter.providedBy(languages.registerDocumentSymbolProvider)
export class OutlineAdapter extends Adapter implements languages.DocumentSymbolProvider {
	public async provideDocumentSymbols(
		model: editor.ITextModel,
	): Promise<languages.DocumentSymbol[] | undefined> {
		const resource = model.uri;
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const root = await worker.getNavigationTree(resource.toString());

		if (!root || model.isDisposed()) {
			return;
		}

		const convert = (
			item: ts.NavigationTree,
			containerLabel?: string,
		): languages.DocumentSymbol => {
			const result: languages.DocumentSymbol = {
				name: item.text,
				detail: "",
				kind: OutlineAdapter.convertKind(item.kind),
				range: this.textSpanToRange(model, item.spans[0]),
				selectionRange: this.textSpanToRange(model, item.spans[0]),
				tags: [],
				children: item.childItems?.map(child => convert(child, item.text)),
				containerName: containerLabel,
			};
			return result;
		};

		// Exclude the root node, as it alwas spans the entire document.
		const result = root.childItems ? root.childItems.map(item => convert(item)) : [];
		return result;
	}

	public static convertKind(kind: string) {
		switch (kind) {
			case Kind.module:
				return languages.SymbolKind.Module;
			case Kind.class:
				return languages.SymbolKind.Class;
			case Kind.enum:
				return languages.SymbolKind.Enum;
			case Kind.interface:
				return languages.SymbolKind.Interface;
			case Kind.memberFunction:
				return languages.SymbolKind.Method;
			case Kind.memberVariable:
				return languages.SymbolKind.Property;
			case Kind.memberGetAccessor:
				return languages.SymbolKind.Property;
			case Kind.memberSetAccessor:
				return languages.SymbolKind.Property;
			case Kind.const:
				return languages.SymbolKind.Variable;
			case Kind.localVariable:
				return languages.SymbolKind.Variable;
			case Kind.variable:
				return languages.SymbolKind.Variable;
			case Kind.function:
				return languages.SymbolKind.Function;
			case Kind.localFunction:
				return languages.SymbolKind.Function;
			default:
				return languages.SymbolKind.Variable;
		}
	}
}

import { languages, type CancellationToken, type editor, type Position } from "monaco-editor";
import ts from "typescript";
import { Adapter } from "./Adapter";

@Adapter.providedBy(languages.registerSignatureHelpProvider)
export class SignatureHelpAdapter extends Adapter implements languages.SignatureHelpProvider {
	public signatureHelpTriggerCharacters = ["(", ","];

	private toSignatureHelpTriggerReason(
		context: languages.SignatureHelpContext
	): ts.SignatureHelpTriggerReason {
		switch (context.triggerKind) {
			case languages.SignatureHelpTriggerKind.TriggerCharacter:
				if (context.triggerCharacter) {
					if (context.isRetrigger) {
						return {
							kind: "retrigger",
							triggerCharacter:
								context.triggerCharacter as ts.SignatureHelpRetriggerCharacter,
						};
					} else {
						return {
							kind: "characterTyped",
							triggerCharacter:
								context.triggerCharacter as ts.SignatureHelpTriggerCharacter,
						};
					}
				} else {
					return { kind: "invoked" };
				}

			case languages.SignatureHelpTriggerKind.ContentChange:
				return context.isRetrigger ? { kind: "retrigger" } : { kind: "invoked" };

			case languages.SignatureHelpTriggerKind.Invoke:
			default:
				return { kind: "invoked" };
		}
	}

	public async provideSignatureHelp(
		model: editor.ITextModel,
		position: Position,
		_token: CancellationToken,
		context: languages.SignatureHelpContext
	): Promise<languages.SignatureHelpResult | undefined> {
		const resource = model.uri;
		const offset = model.getOffsetAt(position);
		const worker = await this.worker(resource);

		if (model.isDisposed()) {
			return;
		}

		const info = await worker.getSignatureHelpItems(resource.toString(), offset, {
			triggerReason: this.toSignatureHelpTriggerReason(context),
		});

		if (!info || model.isDisposed()) {
			return;
		}

		const ret: languages.SignatureHelp = {
			activeSignature: info.selectedItemIndex,
			activeParameter: info.argumentIndex,
			signatures: [],
		};

		info.items.forEach(item => {
			const signature: languages.SignatureInformation = {
				label: "",
				parameters: [],
			};

			signature.documentation = {
				value: ts.displayPartsToString(item.documentation),
			};
			signature.label += ts.displayPartsToString(item.prefixDisplayParts);
			item.parameters.forEach((p, i, a) => {
				const label = ts.displayPartsToString(p.displayParts);
				const parameter: languages.ParameterInformation = {
					label,
					documentation: {
						value: ts.displayPartsToString(p.documentation),
					},
				};
				signature.label += label;
				signature.parameters.push(parameter);
				if (i < a.length - 1) {
					signature.label += ts.displayPartsToString(item.separatorDisplayParts);
				}
			});
			signature.label += ts.displayPartsToString(item.suffixDisplayParts);
			ret.signatures.push(signature);
		});

		return {
			value: ret,
			dispose() {
				/* NO-OP */
			},
		};
	}
}

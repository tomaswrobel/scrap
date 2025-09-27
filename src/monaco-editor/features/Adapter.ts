import type { editor, IDisposable, IRange } from "monaco-editor";
import type { TextSpan } from "typescript";
import type { TypeScriptMode } from "../tsMode.ts";

export abstract class Adapter {
	protected worker: TypeScriptMode;
	constructor(worker: TypeScriptMode) {
		this.worker = worker;
	}

	protected textSpanToRange(model: editor.ITextModel, span: TextSpan): IRange {
		const p1 = model.getPositionAt(span.start);
		const p2 = model.getPositionAt(span.start + span.length);
		const { lineNumber: startLineNumber, column: startColumn } = p1;
		const { lineNumber: endLineNumber, column: endColumn } = p2;
		return { startLineNumber, startColumn, endLineNumber, endColumn };
	}

	public static providedBy<T>(
		registrationFunction: (modeId: string, provider: T) => IDisposable
	) {
		return function (constructor: Adapter.Constructor<never, Adapter & T>) {
			constructor.prototype.register = function (modeId) {
				return registrationFunction(modeId, this);
			};
		}
	}

	public register(_modeId: string): IDisposable {
		throw new Error("Method not implemented");
	}
}

export declare namespace Adapter {
	export interface Constructor<A extends unknown[] = unknown[], T extends Adapter = Adapter> {
		new (...args: [...A, TypeScriptMode]): T;
		readonly prototype: T;
	}
}

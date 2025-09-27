import type { editor, languages } from "monaco-editor";
import type ts from "typescript";
import { Adapter } from "./Adapter.ts";

export abstract class FormatBaseAdapter extends Adapter {
	protected convertOptions(options: languages.FormattingOptions): ts.FormatCodeSettings {
		return {
			convertTabsToSpaces: options.insertSpaces,
			tabSize: options.tabSize,
			indentSize: options.tabSize,
			indentStyle: 2,
			newLineCharacter: "\n",
			insertSpaceAfterCommaDelimiter: true,
			insertSpaceAfterSemicolonInForStatements: true,
			insertSpaceBeforeAndAfterBinaryOperators: true,
			insertSpaceAfterKeywordsInControlFlowStatements: true,
			insertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
			insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
			insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
			insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
			placeOpenBraceOnNewLineForControlBlocks: false,
			placeOpenBraceOnNewLineForFunctions: false,
		};
	}

	protected convertTextChanges(
		model: editor.ITextModel,
		change: ts.TextChange
	): languages.TextEdit {
		return {
			text: change.newText,
			range: this.textSpanToRange(model, change.span),
		};
	}
}

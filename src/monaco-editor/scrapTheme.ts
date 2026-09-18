import {categories} from "@scrap/blockly";
import {editor} from "monaco-editor";

/**
 * Category colours, without the leading `#`, as required by Monaco.
 */
const getColor = (category: string) => categories[category].blockStyles.colourPrimary.slice(1);

editor.defineTheme("scrap", {
	base: "vs-dark",
	inherit: true,
	rules: [
		...Object.keys(categories).map(category => ({
			token: category,
			foreground: getColor(category),
		})),
		{token: "sprites", foreground: getColor("sensing"), fontStyle: "bold"},
		{token: "math", foreground: getColor("operators"), fontStyle: "bold"},
		{token: "array", foreground: getColor("iterables"), fontStyle: "bold"},
		{token: "interface", foreground: getColor("variables"), fontStyle: "bold"},
		{token: "constructor", foreground: getColor("functions"), fontStyle: "bold"},
		{token: "Color", foreground: getColor("operators"), fontStyle: "bold"},
		{token: "costume", foreground: getColor("looks"), fontStyle: "bold"},
		{token: "error", fontStyle: "strikethrough", foreground: "AA0000"},
		{token: "comment", foreground: "008000"},
		{token: "string", foreground: "A31515"},
		{token: "number", foreground: "098658"},
	],
	colors: {},
});

editor.setTheme("scrap");

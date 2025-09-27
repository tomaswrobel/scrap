import { editor } from "monaco-editor";

editor.defineTheme("scrap", {
	base: "vs",
	inherit: true,
	rules: [
		{ token: "motion", foreground: "4C97FF" },
		{ token: "looks", foreground: "9966FF" },
		{ token: "pen", foreground: "0FBD8C" },
		{ token: "events", foreground: "FFBF00" },
		{ token: "controls", foreground: "FFAB19" },
		{ token: "sensing", foreground: "5CB1D6" },
		{ token: "sprites", foreground: "5CB1D6", fontStyle: "bold" },
		{ token: "sounds", foreground: "CF63CF" },
		{ token: "iterables", foreground: "FF661A" },
		{ token: "variables", foreground: "FF8C1A" },
		{ token: "functions", foreground: "FF6680" },
		{ token: "operators", foreground: "59C059" },
		{ token: "math", foreground: "59C059", fontStyle: "bold" },
		{ token: "comment", foreground: "008000" },
		{ token: "string", foreground: "A31515" },
		{ token: "number", foreground: "098658" },
		{ token: "array", foreground: "FF661A", fontStyle: "bold" },
		{ token: "interface", foreground: "FF8C1A", fontStyle: "bold" },
		{ token: "constructor", foreground: "FF6680", fontStyle: "bold" },
		{ token: "Color", foreground: "59C059", fontStyle: "bold" },
		{ token: "costume", foreground: "9966FF", fontStyle: "bold" },
		{ token: "error", fontStyle: "strikethrough", foreground: "AA0000" },
	],
	colors: {},
});

editor.setTheme("scrap");

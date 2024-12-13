import tauri from "../src-tauri/tauri.conf.json" with {type: "json"};
import {parser} from "keep-a-changelog";
import fs from "node:fs";

if (!process.env.GITHUB_OUTPUT) {
	throw new Error("This script doesn't seem to be running in a GitHub Action environment.");
}

const changelog = fs.readFileSync("CHANGELOG.md", "utf-8");
const parsed = parser(changelog);

const release = parsed.findRelease(tauri.version);

if (!release) {
	throw new Error(`Could not find current version in changelog!`);
}

fs.appendFileSync(process.env.GITHUB_OUTPUT, release.toString());
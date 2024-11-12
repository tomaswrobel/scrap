import tauri from "../src-tauri/tauri.conf.json" with {type: "json"};
import {parser} from "keep-a-changelog";
import fs from "node:fs";

const changelog = fs.readFileSync("CHANGELOG.md", "utf-8");
const parsed = parser(changelog);

const release = parsed.findRelease(tauri.version);

if (!release) {
	throw new Error(`Could not find current version in changelog!`);
}

fs.appendFileSync(process.env.GITHUB_OUTPUT, release.toString());
import {defineConfig, globalIgnores} from "eslint/config";
import {createBaseConfig} from "./config/eslint/createBaseConfig.ts";

export default defineConfig([globalIgnores(["./src/typings"]), ...createBaseConfig(".")]);

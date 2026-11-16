/**
 * Monaco's own editor worker (editorWorkerService). It must not get Scrap's
 * TypeScript worker, which would treat its first request as createData.
 */
import "@monaco-editor/worker";

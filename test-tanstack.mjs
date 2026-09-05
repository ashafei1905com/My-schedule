import { tanstackStart } from "@tanstack/react-start/plugin/vite";
const plugins = tanstackStart();
console.dir(plugins.flat().filter(Boolean).map(p => ({ name: p.name, enforce: p.enforce, hasConfigServer: !!p.configureServer })), { depth: null });

import { nitro } from "nitro/vite";
const plugins = nitro({ preset: 'vercel' });
console.dir(plugins.flat().filter(Boolean).map(p => ({ name: p.name, enforce: p.enforce, hasConfigServer: !!p.configureServer })), { depth: null });

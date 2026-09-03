import { n as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CN-evIEF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cloud-store-BVEQ4DbI.js
var loadCloudState_createServerFn_handler = createServerRpc({
	id: "8ef62e073bda174789125045dbc00f498671ae5cc97608941293ca9cf574ba40",
	name: "loadCloudState",
	filename: "src/features/persistence/services/cloud-store.ts"
}, (opts) => loadCloudState.__executeServer(opts));
var loadCloudState = createServerFn({ method: "GET" }).handler(loadCloudState_createServerFn_handler, async () => {
	return null;
});
var saveCloudState_createServerFn_handler = createServerRpc({
	id: "23bcb4f15984493305fd850cc2968a4622816dd10d9f37268f46fedac3fb776d",
	name: "saveCloudState",
	filename: "src/features/persistence/services/cloud-store.ts"
}, (opts) => saveCloudState.__executeServer(opts));
var saveCloudState = createServerFn({ method: "POST" }).validator((input) => input).handler(saveCloudState_createServerFn_handler, async () => {
	return { ok: false };
});
//#endregion
export { loadCloudState_createServerFn_handler, saveCloudState_createServerFn_handler };

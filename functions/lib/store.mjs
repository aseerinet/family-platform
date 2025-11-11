import { getStore } from "@netlify/blobs";
const namespace = process.env.BLOB_NAMESPACE || "family-data";
const store = getStore({ name: namespace });
export async function readCollection(key){ const raw = await store.get(key); return raw ? JSON.parse(raw) : []; }
export async function writeCollection(key, arr){ await store.set(key, JSON.stringify(arr, null, 2), { contentType: "application/json" }); }
export function uid(prefix=""){ return prefix + Math.random().toString(36).slice(2,10) + Date.now().toString(36); }

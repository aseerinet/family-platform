import { requireAuth } from "./lib/auth.mjs";
import { readCollection, writeCollection } from "./lib/store.mjs";
const KEY = "users.json";

export default async (event) => {
  const auth = requireAuth(event);
  if(auth.error) return { statusCode: auth.error.statusCode, body: auth.error.message };
  const { user } = auth;

  const users = await readCollection(KEY);
  let me = users.find(u => u.id === user.id);

  if(event.httpMethod === "GET"){
    return { statusCode: 200, body: JSON.stringify(me || null) };
  }

  if(event.httpMethod === "POST"){
    const data = JSON.parse(event.body || "{}");
    if(!me){
      me = { id: user.id, name: user.name||"", created_at: new Date().toISOString() };
      users.push(me);
    }
    me.user_metadata = { ...me.user_metadata, ...data.user_metadata };
    await writeCollection(KEY, users);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};

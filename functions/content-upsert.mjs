import { requireAuth } from "./lib/auth.mjs";
import { readCollection, writeCollection, uid } from "./lib/store.mjs";

export default async (event) => {
  const auth = requireAuth(event);
  if(auth.error) return { statusCode: auth.error.statusCode, body: auth.error.message };
  const { user } = auth;
  if(event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { type = "posts", payload } = JSON.parse(event.body || "{}");
  if(!payload) return { statusCode: 400, body: "payload مطلوب" };

  if(user.role !== "admin"){
    if(type !== "posts" || payload?.audience?.visibility === "public"){
      return { statusCode: 403, body: "صلاحية غير كافية" };
    }
  }

  const key = `${type}.json`;
  const list = await readCollection(key, []);

  if(!payload.id){
    payload.id = uid(type + "_");
    payload.author_id = user.id;
    payload.created_at = new Date().toISOString();
    list.push(payload);
  } else {
    const i = list.findIndex(x => x.id === payload.id);
    if(i < 0) return { statusCode: 404, body: "غير موجود" };
    if(!(user.role === "admin" || list[i].author_id === user.id)){
      return { statusCode: 403, body: "لا تملك الإذن للتعديل" };
    }
    payload.updated_at = new Date().toISOString();
    list[i] = { ...list[i], ...payload };
  }

  await writeCollection(key, list);
  return { statusCode: 200, body: JSON.stringify({ ok: true, id: payload.id }) };
};

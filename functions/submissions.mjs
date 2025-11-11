import { requireAuth } from "./lib/auth.mjs";
import { readCollection, writeCollection, uid } from "./lib/store.mjs";

export default async (event) => {
  const auth = requireAuth(event);
  if(auth.error) return { statusCode: auth.error.statusCode, body: auth.error.message };
  const { user } = auth;
  const key = "submissions.json";

  if(event.httpMethod === "GET"){
    const url = new URL(event.rawUrl);
    const exerciseId = url.searchParams.get("exercise_id");
    const list = await readCollection(key);
    const mine = list.filter(s => s.user_id === user.id && (!exerciseId || s.exercise_id === exerciseId));
    return { statusCode: 200, body: JSON.stringify(mine) };
  }

  if(event.httpMethod === "POST"){
    const { exercise_id, response, score = null } = JSON.parse(event.body || "{}");
    if(!exercise_id) return { statusCode: 400, body: "exercise_id مطلوب" };
    const submissions = await readCollection(key);
    submissions.push({ id: uid("sub_"), exercise_id, user_id: user.id, response, score, submitted_at: new Date().toISOString() });
    await writeCollection(key, submissions);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};

import { requireAuth } from "./lib/auth.mjs";
import { readCollection } from "./lib/store.mjs";

function canSee(item, user){
  const aud = item?.audience || { visibility: "public" };
  if(user.role==="admin") return true;
  switch(aud.visibility){
    case "public": return true;
    case "private_pair": return aud.with_user_id === user.id || item.author_id === user.id;
    case "custom": return (aud.allowed_user_ids||[]).includes(user.id) || item.author_id === user.id;
    default: return false;
  }
}

export default async (event) => {
  const auth = requireAuth(event);
  if(auth.error) return { statusCode: auth.error.statusCode, body: auth.error.message };
  const { user } = auth;
  const url = new URL(event.rawUrl);
  const type = url.searchParams.get("type") || "posts";
  const key = `${type}.json`;
  const list = await readCollection(key);
  const filtered = list.filter(item => canSee(item, user));
  return { statusCode: 200, body: JSON.stringify(filtered) };
};

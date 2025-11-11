import { readCollection } from "./lib/store.mjs";
import { signJWT } from "./lib/jwt.mjs";
import { json, text, notAllowed, badRequest } from "./lib/http.mjs";
import crypto from "crypto";

function hashPin(pin, salt){ return crypto.scryptSync(pin, salt, 32).toString("hex"); }

export default async (request) => {
  if (request.method !== "POST") return notAllowed();
  const { user_id, pin } = await request.json().catch(()=>({}));
  if (!user_id || !pin) return badRequest("user_id & pin required");

  const users = await readCollection("users.json");
  const u = users.find(x => x.id === user_id);
  if (!u) return text("User not found", 401);

  const check = hashPin(String(pin), u.pin_salt);
  if (check !== u.pin_hash) return text("Wrong PIN", 401);

  const token = signJWT({ user_id: u.id, name: u.name||"" }, 86400*7);
  return json({ token, user: {id: u.id, name: u.name||""} });
};

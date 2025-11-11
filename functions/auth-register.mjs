import { readCollection, writeCollection } from "./lib/store.mjs";
import { json, text, notAllowed, badRequest } from "./lib/http.mjs";
import crypto from "crypto";

function hashPin(pin, salt){ return crypto.scryptSync(pin, salt, 32).toString("hex"); }

export default async (request) => {
  if (request.method !== "POST") return notAllowed();
  const users = await readCollection("users.json");
  const { id, name, pin } = await request.json().catch(()=>({}));
  if(!id || !pin) return badRequest("id & pin required");

  if(users.length === 0){
    const salt = crypto.randomBytes(16).toString("hex");
    const pin_hash = hashPin(String(pin), salt);
    users.push({ id, name:name||"", pin_salt:salt, pin_hash });
    await writeCollection("users.json", users);
    return json({ ok:true, message:"first user created" });
  }
  return text("Users exist", 403);
};

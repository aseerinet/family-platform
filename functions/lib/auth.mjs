import { verifyJWT } from "./jwt.mjs";

export function requireAuth(event){
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if(!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: { statusCode: 401, message: "الرجاء تسجيل الدخول" } };
  }
  const payload = verifyJWT(authHeader.slice(7));
  if(!payload) return { error: { statusCode: 401, message: "جلسة غير صالحة" } };
  const adminIds = (process.env.ADMIN_IDS || "").split(/\s*,\s*/).filter(Boolean);
  const role = adminIds.includes(payload.user_id) ? "admin" : "member";
  return { user: { id: payload.user_id, name: payload.name || "", role } };
}

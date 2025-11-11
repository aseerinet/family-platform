import crypto from "crypto";

function b64url(buf){ return Buffer.from(buf).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_"); }
function b64urlJson(obj){ return b64url(JSON.stringify(obj)); }

export function signJWT(payload, expiresInSec=86400){
  const header = { alg:"HS256", typ:"JWT" };
  const exp = Math.floor(Date.now()/1000) + expiresInSec;
  const body = { ...payload, exp };
  const data = `${b64urlJson(header)}.${b64urlJson(body)}`;
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  return `${data}.${sig}`;
}

export function verifyJWT(token){
  try{
    const [h, p, s] = token.split(".");
    if(!h || !p || !s) return null;
    const secret = process.env.JWT_SECRET || "dev-secret-change-me";
    const expected = crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
    if (expected !== s) return null;
    const payload = JSON.parse(Buffer.from(p.replace(/-/g,"+").replace(/_/g,"/"),"base64").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now()/1000)) return null;
    return payload;
  }catch{ return null; }
}

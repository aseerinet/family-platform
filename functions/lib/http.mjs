export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}
export function text(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", ...headers },
  });
}
export const badRequest = (msg="Bad Request") => text(msg, 400);
export const unauthorized = (msg="Unauthorized") => text(msg, 401);
export const forbidden = (msg="Forbidden") => text(msg, 403);
export const notAllowed = (msg="Method Not Allowed") => text(msg, 405);

const routes = {
  "#/home": "./pages/home.html",
  "#/feed": "./pages/feed.html",
  "#/exercises": "./pages/my-exercises.html",
  "#/space": "./pages/my-space.html",
  "#/messages": "./pages/messages.html",
  "#/library": "./pages/library.html",
  "#/admin": "./pages/admin.html",
};

async function loadRoute(){
  const path = location.hash in routes ? location.hash : "#/home";
  highlightNav(path);
  const html = await fetch(routes[path]).then(r=>r.text());
  document.getElementById("view").innerHTML = html;
  if(path==="#/feed") initFeed();
  if(path==="#/admin") initAdmin();
}
function highlightNav(path){
  document.querySelectorAll("[data-route]").forEach(a=>a.classList.toggle("active", a.getAttribute("href")===path));
}
window.addEventListener("hashchange", loadRoute);
window.addEventListener("DOMContentLoaded", async () => {
  await identityReady();
  syncAuthUI();
  loadRoute();
});

async function apiGet(url){
  const token = getToken();
  const res = await fetch(`/api/${url}`, { headers: { Authorization: `Bearer ${token}` } });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPost(url, body){
  const token = getToken();
  const res = await fetch(`/api/${url}`, { method:"POST", headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

async function initFeed(){
  const wrap = document.getElementById("feedList");
  try{
    const list = await apiGet("content-get?type=posts");
    wrap.innerHTML = list.map(p => `
      <article class="card feed">
        <h3>${escapeHtml(p.title||"")}</h3>
        ${p.body?`<p>${escapeHtml(p.body)}</p>`:""}
        ${renderAudienceBadge(p.audience)}
      </article>
    `).join("");
  }catch(e){
    wrap.innerHTML = `<div class="card">الرجاء تسجيل الدخول أولاً</div>`;
  }
}
function renderAudienceBadge(aud){
  const v = aud?.visibility || "public";
  const label = v==="public"?"عام":(v==="private_pair"?"خاص ثنائي":"موجّه");
  return `<div style="margin-top:8px;opacity:.7">تصنيف: ${label}</div>`;
}

async function initAdmin(){
  if (!window.currentUser || window.currentUser.role !== "admin"){
    document.getElementById("view").innerHTML = `<div class="card">غير مصرح</div>`; return;
  }
  // create user
  const uf = document.getElementById("userForm");
  uf.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const payload = { id: uf.id.value.trim(), name: uf.name.value.trim(), pin: uf.pin.value.trim() };
    await apiPost("auth-register", payload);
    uf.reset();
    alert("تم حفظ المستخدم");
  });

  // create post
  const form = document.getElementById("newPostForm");
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const payload = {
      title: form.title.value.trim(),
      body: form.body.value.trim(),
      audience: audienceFromForm(form)
    };
    await apiPost("content-upsert", { type:"posts", payload });
    form.reset();
    location.hash = "#/feed";
    await loadRoute();
  });
}
function audienceFromForm(form){
  const vis = form.visibility.value;
  const aud = { visibility: vis };
  if(vis==="private_pair") aud.with_user_id = form.with_user_id.value.trim();
  if(vis==="custom") aud.allowed_user_ids = form.allowed_user_ids.value.split(",").map(s=>s.trim()).filter(Boolean);
  return aud;
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[c]));
}

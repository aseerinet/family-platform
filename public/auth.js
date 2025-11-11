// دخول بسيط بمعرّف + PIN (بدون بريد)
window.currentUser = null;
window.ADMIN_IDS = ""; // عيّن IDs المشرفين من متغير البيئة ADMIN_IDS (اختياري حقنه بالـ HTML)

function isLogged(){ return !!localStorage.getItem("token"); }
function getToken(){ const t = localStorage.getItem("token"); if(!t) throw new Error("غير مسجل"); return t; }
function setSession(session){
  const { token, user } = session;
  localStorage.setItem("token", token);
  localStorage.setItem("me", JSON.stringify(user));
  window.currentUser = { id:user.id, name:user.name||"", role: inferRole(user.id) };
  syncAuthUI();
}
function logout(){
  localStorage.removeItem("token");
  localStorage.removeItem("me");
  window.currentUser = null;
  syncAuthUI();
}
function inferRole(userId){
  const admins = (window.ADMIN_IDS||"").split(/\s*,\s*/).filter(Boolean);
  return admins.includes(userId) ? "admin" : "member";
}

async function identityReady(){
  const me = localStorage.getItem("me");
  if(me){
    const user = JSON.parse(me);
    window.currentUser = { id:user.id, name:user.name||"", role: inferRole(user.id) };
  }
  syncAuthUI();
}

function syncAuthUI(){
  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");
  const logged = !!window.currentUser;
  if(btnLogin){ btnLogin.hidden = logged; btnLogin.onclick = openLoginModal; }
  if(btnLogout){ btnLogout.hidden = !logged; btnLogout.onclick = logout; }
  document.querySelectorAll(".admin-only").forEach(el => el.hidden = !(window.currentUser && window.currentUser.role==="admin"));
}

// نافذة دخول بسيطة
function openLoginModal(){
  const html = `
  <dialog id="dlgLogin" style="border:none;border-radius:12px;padding:0;">
    <form method="dialog" style="padding:16px 16px 0 16px; min-width:300px;">
      <h3 style="margin:0 0 12px 0">تسجيل الدخول</h3>
      <label>معرّف المستخدم</label>
      <input id="lg_user" class="input" placeholder="مثال: ahmed" required />
      <label>PIN</label>
      <input id="lg_pin" class="input" type="password" placeholder="****" required />
      <div style="display:flex; gap:8px; justify-content:flex-end; margin:14px 0;">
        <button id="doLogin" type="button">دخول</button>
        <button type="submit">إلغاء</button>
      </div>
    </form>
  </dialog>`;
  document.body.insertAdjacentHTML("beforeend", html);
  const dlg = document.getElementById("dlgLogin");
  dlg.showModal();
  document.getElementById("doLogin").onclick = async ()=>{
    try{
      const user_id = document.getElementById("lg_user").value.trim();
      const pin = document.getElementById("lg_pin").value.trim();
      const res = await fetch("/api/auth-login", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ user_id, pin }) });
      if(!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSession(data);
      dlg.close(); dlg.remove();
      location.hash = "#/home";
    }catch(e){ alert(e.message||e); }
  };
}

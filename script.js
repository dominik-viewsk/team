// --- View Dashboard - FINAL FIX ---
// Týždenný report sa po prihlásení nezobrazí automaticky

// Demo prihlasovacie údaje
const CREDENTIALS = {
  "admin@view.sk": { password: "viewadmin2025", role: "manager", name: "Manažér" },
  "obchodnik@view.sk": { password: "view2025", role: "sales", name: "Obchodník" }
};

// KPI ciele
const KPI = { contacts:30, outreaches:30, meetings:10, offers:15, orders:2, bonus:5000, commissionPct:0.2 };

// Demo dáta
let DATA = {
  week:44,
  users: {
    "Adam": { contacts:30, outreaches:30, meetings:10, offers:15, orders:2, revenue:5500 },
    "Eva":  { contacts:30, outreaches:30, meetings:8,  offers:10, orders:1, revenue:2800 },
    "Martin":{ contacts:30, outreaches:30, meetings:10, offers:15, orders:3, revenue:6200 }
  }
};

// Pomocné funkcie
function $(s){ return document.querySelector(s); }
function $all(s){ return Array.from(document.querySelectorAll(s)); }

// Autentifikácia
function login(email, pass){
  const u = CREDENTIALS[email];
  if(!u) return {ok:false, msg:"Neexistujúci používateľ"};
  if(u.password !== pass) return {ok:false, msg:"Nesprávne heslo"};
  sessionStorage.setItem("vd_user", JSON.stringify({email, role:u.role, name:u.name}));
  return {ok:true, user:u};
}
function currentUser(){ const r = sessionStorage.getItem("vd_user"); return r ? JSON.parse(r) : null; }
function logout(){ sessionStorage.removeItem("vd_user"); location.reload(); }

// Modal funkcie
function openReport(){
  const user = currentUser();
  if(!user){ alert("Prihlásenie vyžadované"); return; }
  const modal = $('#reportModal');
  if(modal){
    modal.classList.remove('hidden');
    modal.dataset.opened = "true";
    $('#rContacts').value = $('#rOutreaches').value = $('#rMeetings').value = $('#rOffers').value = $('#rOrders').value = $('#rRevenue').value = "";
  }
}
function closeModal(){
  const modal = $('#reportModal');
  if(modal){
    modal.classList.add('hidden');
    modal.dataset.opened = "false";
  }
}

// Vykreslenia
function renderHome(){
  const rev = Object.values(DATA.users).reduce((a,b)=>a+(b.revenue||0),0);
  $('#revVal').textContent = rev + " €";
}
function renderKPI(){
  const t = $('#kpiTable');
  if(!t) return;
  t.innerHTML = "";
  Object.entries(DATA.users).forEach(([n,s])=>{
    const tr = document.createElement('tr');
    const commission = (s.revenue * KPI.commissionPct).toFixed(2);
    const ok = s.contacts>=KPI.contacts && s.outreaches>=KPI.outreaches && s.meetings>=KPI.meetings && s.offers>=KPI.offers && s.orders>=KPI.orders;
    tr.innerHTML = `<td>${n}</td><td>${s.contacts}</td><td>${s.outreaches}</td><td>${s.meetings}</td><td>${s.offers}</td><td>${s.orders}</td><td>${s.revenue}</td><td>${commission} €</td><td style="color:${ok?"green":"red"}">${ok?"OK":"Nesplnené"}</td>`;
    t.appendChild(tr);
  });
}

// Spustenie aplikácie
function startApp(){
  $('#loginView').classList.add('hidden');
  $('#dashboardView').classList.remove('hidden');
  const u = currentUser();
  $('#userLabel').textContent = u.name + " ("+u.email+")";

  // Skry modal bez ohľadu na HTML stav
  const modal = $('#reportModal');
  if(modal){
    modal.classList.add('hidden');
    modal.dataset.opened = "false";
  }

  renderHome();
  renderKPI();
  routeTo('home');
  console.log("startApp completed for", u.email);
}

// Navigácia
function routeTo(p){
  $all('.page').forEach(e=>e.classList.add('hidden'));
  const el = document.getElementById(p);
  if(el) el.classList.remove('hidden');
}

// Uloženie reportu (demo)
function saveReport(){
  alert("Report uložený (demo).");
  closeModal();
}

// Inicializácia
document.addEventListener("DOMContentLoaded", ()=>{
  $('#loginBtn').addEventListener('click', ()=>{
    const e = $('#loginInput').value.trim();
    const p = $('#passInput').value.trim();
    const r = login(e,p);
    if(!r.ok){ alert(r.msg); return; }
    startApp();
  });
  $('#logoutBtn').addEventListener('click', logout);
  $('#linkReport').addEventListener('click', openReport);
  $('#saveReport').addEventListener('click', saveReport);
  $('#closeReport').addEventListener('click', closeModal);
  document.addEventListener('keydown', e=>{ if(e.key==="Escape") closeModal(); });

  // Ak je už používateľ prihlásený
  if(currentUser()) startApp();
});


// Static single-file dashboard logic
const CREDENTIALS = {
  "admin@view.sk": { password: "viewadmin2025", role: "manager", name: "Manažér" },
  "obchodnik@view.sk": { password: "view2025", role: "sales", name: "Obchodník" }
};

const KPI = { contacts:30, outreaches:30, meetings:10, offers:15, orders:2, bonus:5000, commissionPct:0.2 };

// Sample team data (initial)
let DATA = {
  week:44,
  users: {
    "Adam": { contacts:30, outreaches:30, meetings:10, offers:15, orders:2, revenue:5500 },
    "Eva":  { contacts:30, outreaches:30, meetings:8,  offers:10, orders:1, revenue:2800 },
    "Martin":{ contacts:30, outreaches:30, meetings:10, offers:15, orders:3, revenue:6200 },
    "Tina": { contacts:30, outreaches:30, meetings:9,  offers:15, orders:1, revenue:4000 },
    "Lukas":{ contacts:32, outreaches:32, meetings:11, offers:16, orders:2, revenue:5300 },
    "Petra":{ contacts:29, outreaches:29, meetings:8,  offers:12, orders:1, revenue:3100 },
    "Roman":{ contacts:30, outreaches:30, meetings:10, offers:15, orders:2, revenue:5000 }
  }
};

// Persistence - simple localStorage
function saveData(){ localStorage.setItem('view_dashboard_data', JSON.stringify(DATA)); }
function loadData(){ const raw = localStorage.getItem('view_dashboard_data'); if(raw) DATA = JSON.parse(raw); }
loadData();

// Simple auth
function login(email, pass){
  const user = CREDENTIALS[email];
  if(!user) return {ok:false, msg:'Neexistujúci používateľ'};
  if(user.password !== pass) return {ok:false, msg:'Nesprávne heslo'};
  sessionStorage.setItem('vd_user', JSON.stringify({email, role:user.role, name:user.name}));
  return {ok:true, user:{email, role:user.role, name:user.name}};
}
function logout(){ sessionStorage.removeItem('vd_user'); location.reload(); }
function currentUser(){ const raw = sessionStorage.getItem('vd_user'); return raw ? JSON.parse(raw) : null; }

// UI helpers
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

// Init handlers
document.addEventListener('DOMContentLoaded', ()=>{
  // Login
  $('#loginBtn').addEventListener('click', ()=>{
    const email = $('#loginInput').value.trim();
    const pass = $('#passInput').value;
    const r = login(email, pass);
    if(!r.ok){ alert(r.msg); return; }
    startApp();
  });
  $('#logoutBtn').addEventListener('click', logout);
  $all('[data-route]').forEach(a=> a.addEventListener('click', (e)=>{ e.preventDefault(); routeTo(a.dataset.route); }));

  $('#linkKPI').addEventListener('click', ()=>routeTo('kpi'));
  $('#linkReport').addEventListener('click', ()=>openReport());
  $('#linkLeads').addEventListener('click', ()=>alert('Požiadať manažéra o leady - funkcia demo'));

  $('#saveReport').addEventListener('click', saveReport);
  $('#closeReport').addEventListener('click', ()=>closeModal());

  // Show login or dashboard
  if(currentUser()) startApp(); else showLogin();
});

function showLogin(){ $('#loginView').classList.remove('hidden'); $('#dashboardView').classList.add('hidden'); }
function startApp(){
  $('#loginView').classList.add('hidden'); $('#dashboardView').classList.remove('hidden');
  const u = currentUser(); $('#userLabel').textContent = u.name + ' ('+ u.email +')';
  renderHome(); renderKPI(); renderTeam();
  routeTo('home');
}

function routeTo(page){
  $all('.page').forEach(p=> p.classList.add('hidden'));
  const el = document.getElementById(page);
  if(el) el.classList.remove('hidden');
  history.replaceState({}, '', '#'+page);
}

function renderHome(){
  document.getElementById('weekVal').textContent = '#'+DATA.week;
  const totalRev = Object.values(DATA.users).reduce((s,v)=>s+v.revenue,0);
  const totalOrders = Object.values(DATA.users).reduce((s,v)=>s+v.orders,0);
  document.getElementById('revVal').textContent = totalRev + ' €';
  document.getElementById('ordersVal').textContent = totalOrders;
}

function renderKPI(){
  const tbody = document.getElementById('kpiTable');
  tbody.innerHTML = '';
  Object.entries(DATA.users).forEach(([name, s])=>{
    const commission = (s.revenue * KPI.commissionPct).toFixed(2);
    const bonus = s.revenue >= KPI.bonus ? 200 : 0;
    const kpiOk = s.contacts>=KPI.contacts && s.outreaches>=KPI.outreaches && s.meetings>=KPI.meetings && s.offers>=KPI.offers && s.orders>=KPI.orders;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td><td>${s.contacts}</td><td>${s.outreaches}</td><td>${s.meetings}</td><td>${s.offers}</td><td>${s.orders}</td><td>${s.revenue}</td><td>${commission} €</td><td>${bonus} €</td><td style="color:${kpiOk? 'green':'red'}">${kpiOk? 'Splnené':'Nesplnené'}</td>`;
    tbody.appendChild(tr);
  });
}

function renderTeam(){
  const box = document.getElementById('teamList');
  box.innerHTML = '';
  Object.entries(DATA.users).forEach(([name,s])=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${name}</strong><div style="font-size:13px;color:#666">Obrat: ${s.revenue} €</div></div><div><button class="smallbtn" onclick="openProfile('${name}')">Profil</button></div></div>`;
    box.appendChild(el);
  });
}

function openProfile(name){
  alert('Profil demo: ' + name + '\n(obrat: '+DATA.users[name].revenue+' €)');
}

function openReport(){
  const user = currentUser();
  if(!user){ alert('Prihlásenie vyžadované'); return; }
  $('#rContacts').value = ''; $('#rOutreaches').value=''; $('#rMeetings').value=''; $('#rOffers').value=''; $('#rOrders').value=''; $('#rRevenue').value='';
  document.getElementById('reportModal').classList.remove('hidden');
}

function closeModal(){ document.getElementById('reportModal').classList.add('hidden'); }

function saveReport(){
  const user = currentUser();
  if(!user) return;
  const name = user.role === 'manager' ? 'Manažér' : 'Obchodník';
  const c = +$('#rContacts').value || 0;
  const o = +$('#rOutreaches').value || 0;
  const m = +$('#rMeetings').value || 0;
  const p = +$('#rOffers').value || 0;
  const ord = +$('#rOrders').value || 0;
  const rev = +$('#rRevenue').value || 0;
  // For demo, map obchodník to a sample name; if obchodnik, update first sales user
  if(user.role === 'sales'){
    const firstSales = Object.keys(DATA.users)[0];
    DATA.users[firstSales] = { contacts:c, outreaches:o, meetings:m, offers:p, orders:ord, revenue:rev };
  } else {
    // manager - show toast and don't modify demo data
    alert('Manažér ukladá reporty centrálne (demo)');
  }
  saveData();
  renderKPI(); renderHome(); renderTeam();
  closeModal();
  alert('Report uložený lokálne (demo)');
}

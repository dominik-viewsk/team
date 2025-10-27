// --- START full replacement script.js ---
// View Dashboard - improved modal handling + debug logs

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
function saveData(){ try{ localStorage.setItem('view_dashboard_data', JSON.stringify(DATA)); }catch(e){ console.warn('saveData error', e); } }
function loadData(){ try{ const raw = localStorage.getItem('view_dashboard_data'); if(raw) DATA = JSON.parse(raw); }catch(e){ console.warn('loadData error', e); } }
loadData();

// Auth
function login(email, pass){
  console.log('login attempt', email);
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

// Modal helpers
function closeModal(){
  const modal = document.getElementById('reportModal');
  if(modal && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
    console.log('report modal closed');
  }
}
function openReport(){
  const user = currentUser();
  if(!user){ alert('Prihlásenie vyžadované'); return; }
  $('#rContacts').value = '';
  $('#rOutreaches').value = '';
  $('#rMeetings').value = '';
  $('#rOffers').value = '';
  $('#rOrders').value = '';
  $('#rRevenue').value = '';
  const modal = document.getElementById('reportModal');
  if(modal) {
    modal.classList.remove('hidden');
    // focus first input
    setTimeout(()=> { const el = document.getElementById('rContacts'); if(el) el.focus(); }, 50);
    console.log('report modal opened by user', user.email);
  }
}

// Init handlers
document.addEventListener('DOMContentLoaded', ()=>{
  try{
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
    $('#closeReport').addEventListener('click', ()=>{ closeModal(); });

    // Overlay click closes modal
    const modal = document.getElementById('reportModal');
    if(modal) modal.addEventListener('click', (ev)=>{
      if(ev.target === modal) closeModal();
    });

    // Esc closes modal
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') closeModal();
    });

    // Show login or dashboard
    if(currentUser()) startApp(); else showLogin();
  }catch(e){
    console.error('init error', e);
  }
});

function showLogin(){ $('#loginView').classList.remove('hidden'); $('#dashboardView').classList.add('hidden'); }
function startApp(){
  try{
    // Skry login, zobraz dashboard
    $('#loginView').classList.add('hidden');
    $('#dashboardView').classList.remove('hidden');

    // Zobraz prihláseného používateľa v hlavičke
    const u = currentUser();
    $('#userLabel').textContent = (u && u.name ? u.name : 'Používateľ') + (u && u.email ? ' ('+ u.email +')' : '');

    // Ensure modal is closed
    closeModal();

    // Načítaj dáta a vykresli obsah
    renderHome();
    renderKPI();
    renderTeam();

    // Otvor hlavnú stránku (Domov)
    routeTo('home');

    console.log('startApp completed for', u ? u.email : 'no-user');
  }catch(e){
    console.error('startApp error', e);
  }
}

function routeTo(page){
  $all('.page').forEach(p=> p.classList.add('hidden'));
  const el = document.getElementById(page);
  if(el) el.classList.remove('hidden');
  try{ history.replaceState({}, '', '#'+page); }catch(e){}
}

function renderHome(){
  const weekEl = document.getElementById('weekVal');
  if(weekEl) weekEl.textContent = '#'+DATA.week;
  const totalRev = Object.values(DATA.users).reduce((s,v)=>s+ (v.revenue || 0),0);
  const totalOrders = Object.values(DATA.users).reduce((s,v)=>s+ (v.orders || 0),0);
  const revEl = document.getElementById('revVal');
  const ordEl = document.getElementById('ordersVal');
  if(revEl) revEl.textContent = totalRev + ' €';
  if(ordEl) ordEl.textContent = totalOrders;
}

function renderKPI(){
  const tbody = document.getElementById('kpiTable');
  if(!tbody) return;
  tbody.innerHTML = '';
  Object.entries(DATA.users).forEach(([name, s])=>{
    const commission = ((s.revenue||0) * KPI.commissionPct).toFixed(2);
    const bonus = (s.revenue||0) >= KPI.bonus ? 200 : 0;
    const kpiOk = (s.contacts||0)>=KPI.contacts && (s.outreaches||0)>=KPI.outreaches && (s.meetings||0)>=KPI.meetings && (s.offers||0)>=KPI.offers && (s.orders||0)>=KPI.orders;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td><td>${s.contacts||0}</td><td>${s.outreaches||0}</td><td>${s.meetings||0}</td><td>${s.offers||0}</td><td>${s.orders||0}</td><td>${s.revenue||0}</td><td>${commission} €</td><td>${bonus} €</td><td style="color:${kpiOk? 'green':'red'}">${kpiOk? 'Splnené':'Nesplnené'}</td>`;
    tbody.appendChild(tr);
  });
}

function renderTeam(){
  const box = document.getElementById('teamList');
  if(!box) return;
  box.innerHTML = '';
  Object.entries(DATA.users).forEach(([name,s])=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${name}</strong><div style="font-size:13px;color:#666">Obrat: ${s.revenue || 0} €</div></div><div><button class="smallbtn" onclick="openProfile('${name}')">Profil</button></div></div>`;
    box.appendChild(el);
  });
}

function openProfile(name){
  alert('Profil demo: ' + name + '\\n(obrat: '+(DATA.users[name] ? DATA.users[name].revenue : 0)+' €)');
}

function saveReport(){
  const user = currentUser();
  if(!user) return;
  const c = +$('#rContacts').value || 0;
  const o = +$('#rOutreaches').value || 0;
  const m = +$('#rMeetings').value || 0;
  const p = +$('#rOffers').value || 0;
  const ord = +$('#rOrders').value || 0;
  const rev = +$('#rRevenue').value || 0;

  // For demo, if sales update first sales user; if manager - just show message
  if(user.role === 'sales'){
    const firstSales = Object.keys(DATA.users)[0];
    DATA.users[firstSales] = { contacts:c, outreaches:o, meetings:m, offers:p, orders:ord, revenue:rev };
    saveData();
    renderKPI(); renderHome(); renderTeam();
    closeModal();
    alert('Report uložený lokálne (demo)');
  } else {
    // manager
    alert('Manažér ukladá reporty centrálne (demo)');
    closeModal();
  }
}

// --- END full replacement script.js ---

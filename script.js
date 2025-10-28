// View Team Dashboard PRO (v6)
// Multi-user login, manager can add sales (auto password view2025), sales see only own data
const DEFAULT_PASS = 'view2025';
const ADMIN_EMAIL = 'dominik@viewsk.com';
const ADMIN_PASS = 'viewadmin2025';

// initial users (will be stored in localStorage 'vd_users')
const INITIAL_USERS = {
  "dominik@viewsk.com": { name: "Martin Dominik", role: "manager", pass: ADMIN_PASS },
  "lukac@viewsk.com": { name: "Róbert Lukáč", role: "sales", pass: DEFAULT_PASS },
  "illesova@viewsk.com": { name: "Martina Illesová", role: "sales", pass: DEFAULT_PASS }
};

// initial DATA structure stored in 'vd_data'
const INITIAL_DATA = {
  week: 44,
  users: {
    "lukac@viewsk.com": { contacts:30, outreaches:30, meetings:10, offers:15, orders:2, revenue:5500 },
    "illesova@viewsk.com": { contacts:30, outreaches:30, meetings:8, offers:10, orders:1, revenue:2800 }
  }
};

function $(s){ return document.querySelector(s); }
function $all(s){ return Array.from(document.querySelectorAll(s)); }

// persistence helpers
function loadUsers(){
  try{
    const raw = localStorage.getItem('vd_users');
    if(raw) return JSON.parse(raw);
    localStorage.setItem('vd_users', JSON.stringify(INITIAL_USERS));
    return JSON.parse(JSON.stringify(INITIAL_USERS));
  }catch(e){ console.warn(e); return JSON.parse(JSON.stringify(INITIAL_USERS)); }
}
function saveUsers(u){ localStorage.setItem('vd_users', JSON.stringify(u)); }

function loadData(){
  try{
    const raw = localStorage.getItem('vd_data');
    if(raw) return JSON.parse(raw);
    localStorage.setItem('vd_data', JSON.stringify(INITIAL_DATA));
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }catch(e){ console.warn(e); return JSON.parse(JSON.stringify(INITIAL_DATA)); }
}
function saveData(d){ localStorage.setItem('vd_data', JSON.stringify(d)); }

let USERS = loadUsers();
let DATA = loadData();

function login(email, pass){
  if(!USERS[email]) return {ok:false, msg:'Neexistujúci používateľ'};
  if(USERS[email].pass !== pass) return {ok:false, msg:'Nesprávne heslo'};
  sessionStorage.setItem('vd_user', JSON.stringify({email:email, role:USERS[email].role, name:USERS[email].name}));
  return {ok:true, user:{email:email, role:USERS[email].role, name:USERS[email].name}};
}
function currentUser(){ const r = sessionStorage.getItem('vd_user'); return r?JSON.parse(r):null; }
function logout(){ sessionStorage.removeItem('vd_user'); location.reload(); }

function ensureModalHidden(){
  const modal = document.getElementById('reportModal');
  if(modal){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }
}

// render functions
function renderHomeFor(user){
  // manager sees team summary, sales sees own numbers
  if(user.role === 'manager'){
    renderHomeTeam();
    $('#managerControls').classList.remove('hidden');
  } else {
    $('#managerControls').classList.add('hidden');
    renderHomeSales(user.email);
  }
}

function renderHomeTeam(){
  const rev = Object.values(DATA.users).reduce((a,b)=>a+(b.revenue||0),0);
  const orders = Object.values(DATA.users).reduce((a,b)=>a+(b.orders||0),0);
  $('#weekVal').textContent = '#'+DATA.week;
  $('#revVal').textContent = rev + ' €';
  $('#ordersVal').textContent = orders;
  renderTeam();
}

function renderHomeSales(email){
  const s = DATA.users[email] || {contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
  $('#weekVal').textContent = '#'+DATA.week;
  $('#revVal').textContent = (s.revenue||0) + ' €';
  $('#ordersVal').textContent = (s.orders||0);
  // show only this user in team list
  $('#teamList').innerHTML = `<div class="card"><strong>${USERS[email].name}</strong><div style="font-size:13px;color:#666">Obrat: ${s.revenue||0} €</div></div>`;
}

function renderKPI(){
  const tbody = $('#kpiTable'); if(!tbody) return;
  tbody.innerHTML='';
  Object.keys(USERS).forEach(email=>{
    if(USERS[email].role !== 'sales') return;
    const s = DATA.users[email] || {contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
    const commission = ((s.revenue||0)*0.2).toFixed(2);
    const bonus = (s.revenue||0) >= 5000 ? 200 : 0;
    const ok = (s.contacts||0)>=30 && (s.outreaches||0)>=30 && (s.meetings||0)>=10 && (s.offers||0)>=15 && (s.orders||0)>=2;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${USERS[email].name}</td><td>${s.contacts||0}</td><td>${s.outreaches||0}</td><td>${s.meetings||0}</td><td>${s.offers||0}</td><td>${s.orders||0}</td><td>${s.revenue||0}</td><td>${commission} €</td><td>${bonus} €</td><td style="color:${ok?'green':'red'}">${ok?'Splnené':'Nesplnené'}</td>`;
    tbody.appendChild(tr);
  });
}

function renderTeam(){
  const box = $('#teamList'); if(!box) return;
  box.innerHTML='';
  Object.keys(USERS).forEach(email=>{
    if(USERS[email].role !== 'sales') return;
    const name = USERS[email].name;
    const s = DATA.users[email] || {revenue:0};
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${name}</strong><div style="font-size:13px;color:#666">Obrat: ${s.revenue||0} €</div></div><div><button class="smallbtn" onclick="openProfile('${email}')">Profil</button></div></div>`;
    box.appendChild(el);
  });
}

function openProfile(email){
  const s = DATA.users[email] || {revenue:0,contacts:0,meetings:0,offers:0,outreaches:0,orders:0};
  alert(USERS[email].name + '\nObrat: ' + (s.revenue||0) + ' €' + '\nStav KPI: ' + ((s.contacts>=30 && s.outreaches>=30 && s.meetings>=10 && s.offers>=15 && s.orders>=2)? 'Splnené':'Nesplnené'));
}

// user management (manager)
function addUser(name, email){
  if(USERS[email]) return {ok:false, msg:'Používateľ s týmto e-mailom už existuje'};
  USERS[email] = { name: name, role: 'sales', pass: DEFAULT_PASS };
  saveUsers(USERS);
  // create empty data slot
  if(!DATA.users[email]) DATA.users[email] = {contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
  saveData(DATA);
  return {ok:true};
}

// report modal
function populateSalesSelect(curUser){
  const sel = $('#rSales');
  if(!sel) return;
  sel.innerHTML='';
  Object.keys(USERS).forEach(email=>{
    if(USERS[email].role !== 'sales') return;
    const opt = document.createElement('option');
    opt.value = email;
    opt.textContent = USERS[email].name + ' ('+email+')';
    sel.appendChild(opt);
  });
  // if current user is sales, select them and disable selection
  if(curUser.role === 'sales'){
    sel.value = curUser.email;
    sel.disabled = true;
  } else {
    sel.disabled = false;
  }
}

function openReport(){
  const cur = currentUser();
  if(!cur){ alert('Prihlásenie vyžadované'); return; }
  populateSalesSelect(cur);
  $('#rContacts').value=''; $('#rOutreaches').value=''; $('#rMeetings').value=''; $('#rOffers').value=''; $('#rOrders').value=''; $('#rRevenue').value='';
  const modal = $('#reportModal');
  if(modal){ modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); }
}

function closeModal(){ const modal = document.getElementById('reportModal'); if(modal){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); } }

function saveReport(){
  const cur = currentUser();
  if(!cur) return;
  const who = $('#rSales').value;
  const c = +$('#rContacts').value || 0;
  const o = +$('#rOutreaches').value || 0;
  const m = +$('#rMeetings').value || 0;
  const p = +$('#rOffers').value || 0;
  const ord = +$('#rOrders').value || 0;
  const rev = +$('#rRevenue').value || 0;
  DATA.users[who] = { contacts:c, outreaches:o, meetings:m, offers:p, orders:ord, revenue:rev };
  saveData(DATA);
  renderKPI(); renderHomeFor(currentUser());
  closeModal();
  alert('Report uložený.');
}

// init
document.addEventListener('DOMContentLoaded', ()=>{
  // ensure initial storage exists
  USERS = loadUsers(); DATA = loadData();
  // ensure modal hidden
  closeModal();

  $('#loginBtn').addEventListener('click', ()=>{
    const email = $('#loginInput').value.trim(); const pass = $('#passInput').value.trim();
    const r = login(email, pass);
    if(!r.ok){ alert(r.msg); return; }
    const cur = currentUser();
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    $('#userLabel').textContent = cur.name + ' ('+cur.email+')';
    $('#logoutBtn').classList.remove('hidden');
    renderKPI(); renderHomeFor(cur);
    routeTo('home');
  });

  $('#logoutBtn').addEventListener('click', ()=>{ logout(); });

  $all('[data-route]').forEach(a=> a.addEventListener('click', (e)=>{ e.preventDefault(); routeTo(a.dataset.route); }));
  $('#linkReport').addEventListener('click', (e)=>{ e.preventDefault(); openReport(); });
  $('#saveReport').addEventListener('click', saveReport);
  $('#closeReport').addEventListener('click', closeModal);

  $('#addUserBtn').addEventListener('click', ()=>{
    const name = ($('#newName').value||'').trim() + ' ' + ($('#newSurname').value||'').trim();
    const email = ($('#newEmail').value||'').trim();
    if(!name.trim() || !email) { alert('Vyplň meno a e-mail'); return; }
    const r = addUser(name, email);
    if(!r.ok){ alert(r.msg); return; }
    alert('Obchodník pridaný s heslom view2025');
    renderTeam(); renderKPI();
    // clear form
    $('#newName').value=''; $('#newSurname').value=''; $('#newEmail').value='';
  });

  // close modal overlay click and ESC
  const modalWrap = document.getElementById('reportModal');
  if(modalWrap){ modalWrap.addEventListener('click', (ev)=>{ if(ev.target === modalWrap) closeModal(); }); }
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeModal(); });

  // auto-login if session exists
  const cur = currentUser();
  if(cur){
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    $('#userLabel').textContent = cur.name + ' ('+cur.email+')';
    $('#logoutBtn').classList.remove('hidden');
    renderKPI(); renderHomeFor(cur);
    routeTo('home');
  }
});

// View Team Dashboard PRO v2.1 (patched router)
// - Robust router with event delegation
// - Access guard (sales cannot open KPI)
// - Active nav highlighting
// - Minor safety checks

const DEFAULT_PASS = 'view2025';
const ADMIN_EMAIL = 'dominik@viewsk.com';
const ADMIN_PASS = 'viewadmin2025';

const INITIAL_USERS = {
  "dominik@viewsk.com": { name: "Martin Dominik", role: "manager", pass: ADMIN_PASS },
  "lukac@viewsk.com": { name: "Róbert Lukáč", role: "sales", pass: DEFAULT_PASS },
  "illesova@viewsk.com": { name: "Martina Illesová", role: "sales", pass: DEFAULT_PASS }
};

const INITIAL_DATA = {
  week: 44,
  users: {
    "lukac@viewsk.com":   { contacts:30, outreaches:30, meetings:10, offers:15, orders:2, revenue:5500 },
    "illesova@viewsk.com":{ contacts:30, outreaches:30, meetings:8,  offers:10, orders:1, revenue:2800 }
  }
};

function $(s){ return document.querySelector(s); }
function $all(s){ return Array.from(document.querySelectorAll(s)); }

// storage helpers
function loadUsers(){ try{ const r = localStorage.getItem('vd_users'); if(r) return JSON.parse(r); localStorage.setItem('vd_users', JSON.stringify(INITIAL_USERS)); return JSON.parse(JSON.stringify(INITIAL_USERS)); }catch(e){ console.warn(e); return JSON.parse(JSON.stringify(INITIAL_USERS)); } }
function saveUsers(u){ localStorage.setItem('vd_users', JSON.stringify(u)); }
function loadData(){ try{ const r = localStorage.getItem('vd_data'); if(r) return JSON.parse(r); localStorage.setItem('vd_data', JSON.stringify(INITIAL_DATA)); return JSON.parse(JSON.stringify(INITIAL_DATA)); }catch(e){ console.warn(e); return JSON.parse(JSON.stringify(INITIAL_DATA)); } }
function saveData(d){ localStorage.setItem('vd_data', JSON.stringify(d)); }

let USERS = loadUsers();
let DATA  = loadData();

function login(email, pass){
  if(!USERS[email]) return {ok:false, msg:'Neexistujúci používateľ'};
  if(USERS[email].pass !== pass) return {ok:false, msg:'Nesprávne heslo'};
  sessionStorage.setItem('vd_user', JSON.stringify({email:email, role:USERS[email].role, name:USERS[email].name}));
  return {ok:true};
}
function currentUser(){ const r = sessionStorage.getItem('vd_user'); return r?JSON.parse(r):null; }
function logout(){ sessionStorage.removeItem('vd_user'); location.reload(); }

function ensureModalHidden(id){ const el = document.getElementById(id); if(el){ el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); } }
function showModal(id){ const el = document.getElementById(id); if(el){ el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); } }
function hideModal(id){ ensureModalHidden(id); }

function canAccess(page, user){
  if(page === 'kpi' && user?.role !== 'manager') return false;
  return true;
}

function highlightNav(route){
  $all('[data-route]').forEach(a=> a.classList.remove('active'));
  const el = document.querySelector(`[data-route="${route}"]`);
  if(el) el.classList.add('active');
}

function routeTo(page){
  const user = currentUser();
  if(!canAccess(page, user)){
    alert('Nemáš prístup k tejto sekcii.');
    return;
  }
  $all('.page').forEach(p=>p.classList.add('hidden'));
  const el = document.getElementById(page);
  if(el){ el.classList.remove('hidden'); highlightNav(page); }
}

function renderHomeFor(user){
  if(user.role === 'manager'){
    $('#managerControls')?.classList.remove('hidden');
    $('#kpiTab')?.classList.remove('hidden');
    renderHomeTeam();
  }else{
    $('#managerControls')?.classList.add('hidden');
    $('#kpiTab')?.classList.add('hidden');
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
  $('#teamList').innerHTML = `<div class="card"><strong>${USERS[email].name}</strong><div style="font-size:13px;color:#666">Obrat: ${s.revenue||0} €</div></div>`;
}
function renderKPI(){
  const tbody = $('#kpiTable'); if(!tbody) return;
  tbody.innerHTML='';
  Object.keys(USERS).forEach(email=>{
    if(USERS[email].role !== 'sales') return;
    const s = DATA.users[email] || {contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
    const parts = (USERS[email].name||'').split(' ');
    const fname = parts[0]||'';
    const sname = parts.slice(1).join(' ')||'';
    const commission = ((s.revenue||0)*0.2).toFixed(2);
    const bonus = (s.revenue||0) >= 5000 ? 200 : 0;
    const ok = (s.contacts||0)>=30 && (s.outreaches||0)>=30 && (s.meetings||0)>=10 && (s.offers||0)>=15 && (s.orders||0)>=2;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${fname}</td><td>${sname}</td><td>${email}</td><td>${s.contacts||0}</td><td>${s.outreaches||0}</td><td>${s.meetings||0}</td><td>${s.offers||0}</td><td>${s.orders||0}</td><td>${s.revenue||0}</td><td>${commission} €</td><td>${bonus} €</td><td style="color:${ok?'green':'red'}">${ok?'Splnené':'Nesplnené'}</td>`;
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
  alert(USERS[email].name + '\\nObrat: ' + (s.revenue||0) + ' €' + '\\nStav KPI: ' + ((s.contacts>=30 && s.outreaches>=30 && s.meetings>=10 && s.offers>=15 && s.orders>=2)? 'Splnené':'Nesplnené'));
}

// manager add/import
function addUser(name, email){
  if(USERS[email]) return {ok:false, msg:'Používateľ s týmto e-mailom už existuje'};
  USERS[email] = { name: name, role: 'sales', pass: DEFAULT_PASS };
  saveUsers(USERS);
  if(!DATA.users[email]) DATA.users[email] = {contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
  saveData(DATA);
  return {ok:true};
}
function importUsersFromCSV(text){
  const lines = text.split(/\\r?\\n/).map(l=>l.trim()).filter(Boolean);
  let added=0, skipped=0;
  for(let i=0;i<lines.length;i++){
    const line = lines[i];
    if(i===0 && /meno/i.test(line) && /e-?mail/i.test(line)) continue;
    const parts = line.split(';').map(x=>x.trim());
    if(parts.length<3){ skipped++; continue; }
    const name = parts[0] + ' ' + parts[1];
    const email = parts[2].toLowerCase();
    const r = addUser(name, email);
    if(r.ok) added++; else skipped++;
  }
  return {added, skipped};
}

// report
function populateSalesSelect(cur){
  const wrap = $('#reportSalesWrap');
  const sel  = $('#rSales');
  if(cur.role === 'manager'){
    wrap.classList.remove('hidden');
    sel.innerHTML='';
    Object.keys(USERS).forEach(email=>{
      if(USERS[email].role!=='sales') return;
      const opt = document.createElement('option');
      opt.value=email; opt.textContent = USERS[email].name + ' ('+email+')';
      sel.appendChild(opt);
    });
    sel.disabled=false;
  }else{
    wrap.classList.add('hidden');
    if(sel) { sel.value = cur.email; sel.disabled=true; }
  }
}
function openReport(){
  const cur = currentUser(); if(!cur){ alert('Prihlásenie vyžadované'); return; }
  ['rContacts','rOutreaches','rMeetings','rOffers','rOrders','rRevenue'].forEach(id=>{ const el = document.getElementById(id); if(el) el.value=''; });
  populateSalesSelect(cur);
  showModal('reportModal');
}
function closeReport(){ hideModal('reportModal'); }
function saveReport(){
  const cur = currentUser(); if(!cur) return;
  const sel = $('#rSales');
  const who = (cur.role==='manager' && sel && !sel.disabled) ? sel.value : cur.email;
  const c = +$('#rContacts').value || 0;
  const o = +$('#rOutreaches').value || 0;
  const m = +$('#rMeetings').value || 0;
  const p = +$('#rOffers').value || 0;
  const ord = +$('#rOrders').value || 0;
  const rev = +$('#rRevenue').value || 0;
  DATA.users[who] = { contacts:c, outreaches:o, meetings:m, offers:p, orders:ord, revenue:rev };
  saveData(DATA);
  renderKPI(); renderHomeFor(currentUser());
  closeReport();
  alert('Report uložený.');
}

// CSV export
function exportCSV(){
  const header = ['Meno','Priezvisko','E-mail','Kontakty','Oslovenia','Stretnutia','Ponuky','Objednávky','Obrat (€)','Provízia','Bonus','KPI'];
  const rows = [header];
  Object.keys(USERS).forEach(email=>{
    if(USERS[email].role!=='sales') return;
    const parts = (USERS[email].name||'').split(' ');
    const fname = parts[0]||'';
    const sname = parts.slice(1).join(' ')||'';
    const s = DATA.users[email] || {contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
    const prov = ((s.revenue||0)*0.2).toFixed(2);
    const bonus = (s.revenue||0) >= 5000 ? 200 : 0;
    const kpi = (s.contacts>=30 && s.outreaches>=30 && s.meetings>=10 && s.offers>=15 && s.orders>=2) ? 'Splnené' : 'Nesplnené';
    rows.push([fname,sname,email,s.contacts||0,s.outreaches||0,s.meetings||0,s.offers||0,s.orders||0,s.revenue||0,prov,bonus,kpi]);
  });
  const csv = rows.map(r=>r.join(';')).join('\n');
  const fname = `view_reports_Tyden${DATA.week}.csv`;
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = fname; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// reset data
function resetData(){
  if(!confirm('Naozaj chceš vynulovať všetky dáta (ponechá používateľov)?')) return;
  Object.keys(USERS).forEach(email=>{
    if(USERS[email].role!=='sales') return;
    DATA.users[email] = {contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
  });
  saveData(DATA);
  renderKPI(); renderHomeFor(currentUser());
  alert('Dáta boli vynulované.');
}

// password change
function openPassModal(){ showModal('passModal'); }
function closePassModal(){ hideModal('passModal'); }
function saveNewPassword(){
  const cur = currentUser(); if(!cur) return;
  const oldP = $('#oldPass').value;
  const newP = $('#newPass').value;
  const newP2= $('#newPass2').value;
  if(!oldP || !newP || !newP2){ alert('Vyplň všetky polia'); return; }
  if(newP !== newP2){ alert('Nové heslo a potvrdenie sa nezhodujú'); return; }
  if(USERS[cur.email].pass !== oldP){ alert('Aktuálne heslo nie je správne'); return; }
  USERS[cur.email].pass = newP; saveUsers(USERS);
  closePassModal(); alert('Heslo zmenené.');
  $('#oldPass').value=''; $('#newPass').value=''; $('#newPass2').value='';
}

// INIT
document.addEventListener('DOMContentLoaded', ()=>{
  ensureModalHidden('reportModal');
  ensureModalHidden('passModal');

  // login
  $('#loginBtn').addEventListener('click', ()=>{
    const email = $('#loginInput').value.trim();
    const pass  = $('#passInput').value.trim();
    const res = login(email, pass);
    if(!res.ok){ alert(res.msg); return; }
    const cur = currentUser();
    $('#loginView').classList.add('hidden');
    $('#dashboardView').classList.remove('hidden');
    $('#userLabel').textContent = cur.name + ' ('+cur.email+')';
    $('#logoutBtn').classList.remove('hidden');
    $('#changePassBtn').classList.remove('hidden');
    renderKPI(); renderHomeFor(cur); routeTo('home');
  });

  // router (event delegation on nav)
  document.querySelector('nav.nav')?.addEventListener('click', (e)=>{
    const link = e.target.closest('[data-route]');
    if(!link) return;
    e.preventDefault();
    const route = link.dataset.route;
    routeTo(route);
  });

  $('#logoutBtn').addEventListener('click', ()=>logout());
  $('#changePassBtn').addEventListener('click', ()=>openPassModal());

  // report
  $('#linkReport').addEventListener('click', (e)=>{ e.preventDefault(); openReport(); });
  $('#saveReport').addEventListener('click', ()=>saveReport());
  $('#closeReport').addEventListener('click', ()=>closeReport());

  // pass modal
  $('#savePassBtn').addEventListener('click', ()=>saveNewPassword());
  $('#closePassBtn').addEventListener('click', ()=>closePassModal());

  // manager controls
  $('#addUserBtn')?.addEventListener('click', ()=>{
    const name = ($('#newName').value||'').trim() + ' ' + ($('#newSurname').value||'').trim();
    const email= ($('#newEmail').value||'').trim().toLowerCase();
    if(!name.trim() || !email){ alert('Vyplň meno a e-mail'); return; }
    const r = addUser(name, email);
    if(!r.ok){ alert(r.msg); return; }
    alert('Obchodník pridaný s heslom view2025');
    renderTeam(); renderKPI();
    $('#newName').value=''; $('#newSurname').value=''; $('#newEmail').value='';
  });

  $('#importCsvBtn')?.addEventListener('click', ()=>{
    const input = $('#importCsvInput');
    if(!input.files || !input.files[0]){ alert('Vyber CSV súbor'); return; }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e)=>{
      const res = importUsersFromCSV(e.target.result);
      alert('Import hotový. Pridaných: '+res.added+', Preskočených: '+res.skipped);
      renderTeam(); renderKPI();
      input.value='';
    };
    reader.readAsText(file, 'utf-8');
  });

  // KPI actions
  $('#exportCsvBtn')?.addEventListener('click', ()=>exportCSV());
  $('#resetDataBtn')?.addEventListener('click', ()=>resetData());

  // close modals on overlay click + ESC
  ['reportModal','passModal'].forEach(id=>{
    const el = document.getElementById(id);
    if(el){ el.addEventListener('click', (ev)=>{ if(ev.target===el) hideModal(id); }); }
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){ hideModal('reportModal'); hideModal('passModal'); }
  });

  // auto-login
  const cur = currentUser();
  if(cur){
    $('#loginView').classList.add('hidden');
    $('#dashboardView').classList.remove('hidden');
    $('#userLabel').textContent = cur.name + ' ('+cur.email+')';
    $('#logoutBtn').classList.remove('hidden');
    $('#changePassBtn').classList.remove('hidden');
    renderKPI(); renderHomeFor(cur); routeTo('home');
  }
});

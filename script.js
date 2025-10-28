
// View Team Dashboard - final static script (v5)
// Login, dashboard, KPI, report modal - report opens only on click

const CREDENTIALS = {
  "admin@view.sk": { password: "viewadmin2025", role: "manager", name: "Manažér" },
  "obchodnik@view.sk": { password: "view2025", role: "sales", name: "Obchodník" }
};

const KPI = { contacts:30, outreaches:30, meetings:10, offers:15, orders:2, bonus:5000, commissionPct:0.2 };

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

function $(s){ return document.querySelector(s); }
function $all(s){ return Array.from(document.querySelectorAll(s)); }

function saveData(){ try{ localStorage.setItem('view_dashboard_data', JSON.stringify(DATA)); }catch(e){ console.warn(e); } }
function loadData(){ try{ const raw = localStorage.getItem('view_dashboard_data'); if(raw) DATA = JSON.parse(raw); }catch(e){ console.warn(e); } }
loadData();

function login(email, pass){
  const u = CREDENTIALS[email];
  if(!u) return {ok:false, msg:'Neexistujúci používateľ'};
  if(u.password !== pass) return {ok:false, msg:'Nesprávne heslo'};
  sessionStorage.setItem('vd_user', JSON.stringify({email:email, role:u.role, name:u.name}));
  return {ok:true, user:{email:email, role:u.role, name:u.name}};
}
function currentUser(){ const r = sessionStorage.getItem('vd_user'); return r?JSON.parse(r):null; }
function logout(){ sessionStorage.removeItem('vd_user'); location.reload(); }

function openReport(){
  const user = currentUser();
  if(!user){ alert('Prihlásenie vyžadované'); return; }
  $('#rContacts').value=''; $('#rOutreaches').value=''; $('#rMeetings').value=''; $('#rOffers').value=''; $('#rOrders').value=''; $('#rRevenue').value='';
  const modal = $('#reportModal');
  if(modal){
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
  }
}

function closeModal(){
  const modal = $('#reportModal');
  if(modal){
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
  }
}

function renderHome(){
  const rev = Object.values(DATA.users).reduce((a,b)=>a+(b.revenue||0),0);
  const orders = Object.values(DATA.users).reduce((a,b)=>a+(b.orders||0),0);
  $('#weekVal').textContent = '#'+DATA.week;
  $('#revVal').textContent = rev + ' €';
  $('#ordersVal').textContent = orders;
}

function renderKPI(){
  const tbody = $('#kpiTable');
  if(!tbody) return;
  tbody.innerHTML='';
  Object.entries(DATA.users).forEach(([name,s])=>{
    const commission = ((s.revenue||0)*KPI.commissionPct).toFixed(2);
    const bonus = (s.revenue||0) >= KPI.bonus ? 200 : 0;
    const ok = (s.contacts||0) >= KPI.contacts && (s.outreaches||0) >= KPI.outreaches && (s.meetings||0) >= KPI.meetings && (s.offers||0) >= KPI.offers && (s.orders||0) >= KPI.orders;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td><td>${s.contacts||0}</td><td>${s.outreaches||0}</td><td>${s.meetings||0}</td><td>${s.offers||0}</td><td>${s.orders||0}</td><td>${s.revenue||0}</td><td>${commission} €</td><td>${bonus} €</td><td style="color:${ok?'green':'red'}">${ok?'Splnené':'Nesplnené'}</td>`;
    tbody.appendChild(tr);
  });
}

function renderTeam(){
  const box = $('#teamList'); if(!box) return;
  box.innerHTML='';
  Object.entries(DATA.users).forEach(([name,s])=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${name}</strong><div style="font-size:13px;color:#666">Obrat: ${s.revenue||0} €</div></div><div><button class="smallbtn" onclick="openProfile('${name}')">Profil</button></div></div>`;
    box.appendChild(el);
  });
}

function openProfile(name){ alert('Profil demo: '+name+'\nObrat: '+(DATA.users[name]?.revenue||0)+' €'); }

function saveReport(){
  const user = currentUser();
  if(!user) return;
  const c = +$('#rContacts').value || 0;
  const o = +$('#rOutreaches').value || 0;
  const m = +$('#rMeetings').value || 0;
  const p = +$('#rOffers').value || 0;
  const ord = +$('#rOrders').value || 0;
  const rev = +$('#rRevenue').value || 0;
  // demo: update first sales person
  const first = Object.keys(DATA.users)[0];
  DATA.users[first] = { contacts:c, outreaches:o, meetings:m, offers:p, orders:ord, revenue:rev };
  saveData();
  renderKPI(); renderHome(); renderTeam();
  closeModal();
  alert('Report uložený (demo)');
}

document.addEventListener('DOMContentLoaded', ()=>{
  // ensure modal hidden regardless of HTML
  const modal = document.getElementById('reportModal');
  if(modal){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

  $('#loginBtn').addEventListener('click', ()=>{
    const email = $('#loginInput').value.trim(); const pass = $('#passInput').value.trim();
    const r = login(email, pass);
    if(!r.ok){ alert(r.msg); return; }
    // show dashboard
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    $('#userLabel').textContent = r.user.name + ' ('+email+')';
    $('#logoutBtn').classList.remove('hidden');
    renderHome(); renderKPI(); renderTeam(); routeTo('home');
  });

  $('#logoutBtn').addEventListener('click', ()=>{ logout(); });

  // navigation
  $all('[data-route]').forEach(a=> a.addEventListener('click', (e)=>{ e.preventDefault(); routeTo(a.dataset.route); }));
  $('#linkReport').addEventListener('click', (e)=>{ e.preventDefault(); openReport(); });

  $('#saveReport').addEventListener('click', saveReport);
  $('#closeReport').addEventListener('click', closeModal);

  // close modal on overlay click or Esc
  const modalWrap = document.getElementById('reportModal');
  if(modalWrap){
    modalWrap.addEventListener('click', (ev)=>{ if(ev.target === modalWrap) closeModal(); });
  }
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeModal(); });

  // auto-login if session exists
  const cur = currentUser();
  if(cur){
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    $('#userLabel').textContent = cur.name + ' ('+cur.email+')';
    $('#logoutBtn').classList.remove('hidden');
    renderHome(); renderKPI(); renderTeam(); routeTo('home');
  }
});

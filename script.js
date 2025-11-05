// View Dashboard PRO v3.9.1 – Hotfix: spoľahlivá navigácia, role, týždenné súhrny

/************ Konštanty a demo používateľi ************/
const DEFAULT_USERS = {
  'dominik@viewsk.com': { name: 'Martin Dominik', role: 'manager', pass: 'viewadmin2025' },
  'lukac@viewsk.com':   { name: 'Róbert Lukáč',   role: 'sales',   pass: 'view2025' },
  'illesova@viewsk.com':{ name: 'Martina Illesová',role: 'sales',   pass: 'view2025' }
};

const USERS_KEY   = 'v39_users';
const REPORTS_KEY = 'v39_reports';

/************ Helpery ************/
const $    = (s) => document.querySelector(s);
const $all = (s) => Array.from(document.querySelectorAll(s));

const log = (...args) => { try { console.log('[VD]', ...args); } catch(_){} };

function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return { ...DEFAULT_USERS };
}
function saveUsers(o){ localStorage.setItem(USERS_KEY, JSON.stringify(o)); }

function getReports(){
  try {
    const r = localStorage.getItem(REPORTS_KEY);
    return r ? JSON.parse(r) : {};
  } catch (_) { return {}; }
}
function saveReports(o){ localStorage.setItem(REPORTS_KEY, JSON.stringify(o)); }

/************ Session ************/
function currentUser(){
  const r = sessionStorage.getItem('vd_user');
  return r ? JSON.parse(r) : null;
}
function login(email, pass){
  const users = getUsers();
  const u = users[email];
  if(!u) return { ok:false, msg:'Neexistujúci používateľ' };
  if(u.pass !== pass) return { ok:false, msg:'Nesprávne heslo' };
  sessionStorage.setItem('vd_user', JSON.stringify({ email, role:u.role, name:u.name }));
  return { ok:true };
}
function logout(){
  sessionStorage.removeItem('vd_user');
  location.reload();
}

/************ ISO týždne ************/
function getISOWeek(d = new Date()){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart)/86400000) + 1)/7);
}
function getISOWeekYear(d = new Date()){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  return date.getUTCFullYear();
}
function getLastISOWeekInfo(d = new Date()){
  const thisWeek = getISOWeek(d);
  const thisYear = getISOWeekYear(d);
  let lastWeek = thisWeek - 1, lastYear = thisYear;
  if (thisWeek === 1){
    const dec28 = new Date(Date.UTC(thisYear - 1, 11, 28));
    lastWeek = getISOWeek(dec28);
    lastYear = getISOWeekYear(dec28);
  }
  return { week:lastWeek, year:lastYear };
}

/************ UI util ************/
function toast(msg='✅ Uložené'){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 1600);
}
function setActiveMenu(route){
  $all('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.route === route));
}
function showAppChrome(yes){
  $('#appHeader').classList.toggle('hidden', !yes);
  $('#appFooter').classList.toggle('hidden', !yes);
  $('#appView')  .classList.toggle('hidden', !yes);
  $('#loginView').classList.toggle('hidden', yes);
}

/************ Routing ************/
function showRoute(route){
  log('showRoute', route);
  $all('.route').forEach(r => r.classList.add('hidden'));
  const el = $('#route-' + route);
  if(el) el.classList.remove('hidden');
  setActiveMenu(route);
  if(route === 'dashboard') renderDashboard();
  if(route === 'reporty')   renderManagerReports(); // nič neurobí pre obchodníka (len manažér má tabuľku tímu)
}

/************ Reporty ************/
function saveReport(){
  const cur = currentUser();
  if(!cur) return alert('Najprv sa prihlás');
  const week = ($('#rWeek').value || '').trim();

  const rep = {
    week,
    outreaches:       +($('#rOutreaches').value || 0),
    meetingsAgreed:   +($('#rMeetingsAgreed').value || 0),
    meetingsDone:     +($('#rMeetingsDone').value || 0),
    offers:           +($('#rOffers').value || 0),
    orders:           +($('#rOrders').value || 0),
    savedAt: new Date().toISOString()
  };

  const data = getReports();
  const weekNum = parseInt(week, 10) || getISOWeek();
  if(!data[cur.email]) data[cur.email] = {};
  data[cur.email][String(weekNum)] = rep;
  saveReports(data);
  toast('✅ Report uložený');
  renderDashboard();
}

function renderManagerReports(){
  const cur = currentUser();
  if(!cur || cur.role !== 'manager') return; // obchodník tu nič nerenderuje
  const data = getReports();
  const tbody = $('#allReportsTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  Object.keys(data).forEach(email => {
    Object.values(data[email]).forEach(rep => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${email}</td>
        <td>${rep.week}</td>
        <td>${rep.outreaches}</td>
        <td>${rep.meetingsAgreed}</td>
        <td>${rep.meetingsDone}</td>
        <td>${rep.offers}</td>
        <td>${rep.orders}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

/************ Súhrny minulého týždňa ************/
function renderWeeklySummary(){
  const cur = currentUser();
  if(!cur) return;
  const reports = getReports();
  const last = getLastISOWeekInfo();

  const sum = { outreaches:0, meetingsAgreed:0, meetingsDone:0, offers:0, orders:0 };

  if(cur.role === 'manager'){
    Object.values(reports).forEach(userReports => {
      Object.values(userReports).forEach(rep => {
        if(!rep.savedAt) return;
        const d = new Date(rep.savedAt);
        if(getISOWeek(d) === last.week && getISOWeekYear(d) === last.year){
          sum.outreaches     += +rep.outreaches || 0;
          sum.meetingsAgreed += +rep.meetingsAgreed || 0;
          sum.meetingsDone   += +rep.meetingsDone || 0;
          sum.offers         += +rep.offers || 0;
          sum.orders         += +rep.orders || 0;
        }
      });
    });
    const tb = $('#weeklySummaryTable tbody');
    if(tb){
      tb.innerHTML = `
        <tr><td>Oslovenia</td><td>${sum.outreaches}</td></tr>
        <tr><td>Dohodnuté stretnutia</td><td>${sum.meetingsAgreed}</td></tr>
        <tr><td>Realizované stretnutia</td><td>${sum.meetingsDone}</td></tr>
        <tr><td>Ponuky</td><td>${sum.offers}</td></tr>
        <tr><td>Objednávky</td><td>${sum.orders}</td></tr>
      `;
      $('#weeklySummaryCard')?.classList.remove('hidden');
    }
  } else {
    const mine = reports[cur.email] || {};
    Object.values(mine).forEach(rep => {
      if(!rep.savedAt) return;
      const d = new Date(rep.savedAt);
      if(getISOWeek(d) === last.week && getISOWeekYear(d) === last.year){
        sum.outreaches     += +rep.outreaches || 0;
        sum.meetingsAgreed += +rep.meetingsAgreed || 0;
        sum.meetingsDone   += +rep.meetingsDone || 0;
        sum.offers         += +rep.offers || 0;
        sum.orders         += +rep.orders || 0;
      }
    });
    const tb = $('#personalSummaryTable tbody');
    if(tb){
      tb.innerHTML = `
        <tr><td>Oslovenia</td><td>${sum.outreaches}</td></tr>
        <tr><td>Dohodnuté stretnutia</td><td>${sum.meetingsAgreed}</td></tr>
        <tr><td>Realizované stretnutia</td><td>${sum.meetingsDone}</td></tr>
        <tr><td>Ponuky</td><td>${sum.offers}</td></tr>
        <tr><td>Objednávky</td><td>${sum.orders}</td></tr>
      `;
      $('#personalSummaryCard')?.classList.remove('hidden');
    }
  }
}

/************ Dashboard podľa role ************/
function renderDashboard(){
  const cur = currentUser();
  if(!cur) return;

  // Zobrazenie blokov podľa role
  if(cur.role === 'manager'){
    $('#managerTopGrid')?.classList.remove('hidden');
    $('#personalSummaryCard')?.classList.add('hidden');
  } else {
    $('#managerTopGrid')?.classList.add('hidden');
    $('#personalSummaryCard')?.classList.remove('hidden');
  }

  // Pre istotu nastav viditeľnosť položiek menu
  $all('.only-manager').forEach(e => e.classList.toggle('hidden', cur.role !== 'manager'));

  // Súhrn minulého týždňa
  renderWeeklySummary();
}

/************ Boot aplikácie ************/
function bootUI(){
  const cur = currentUser();
  if(!cur) return;

  showAppChrome(true);
  $('#userLabel').textContent = `${cur.name} (${cur.email})`;
  $('#logoutBtn').classList.remove('hidden');

  // Viditeľnosť manager-only prvkov
  $all('.only-manager').forEach(e => e.classList.toggle('hidden', cur.role !== 'manager'));

  showRoute('dashboard');
}

document.addEventListener('DOMContentLoaded', () => {
  // Predvyplnené prihlasovanie pre manažéra
  try{
    $('#loginEmail').value = 'dominik@viewsk.com';
    $('#loginPass').value = 'viewadmin2025';
  }catch(_){}

  // Pred loginom skryť aplikáciu
  showAppChrome(false);

  // Auto-boot ak je niekto prihlásený (obnova relácie na reload)
  if(currentUser()) bootUI();

  // Login
  $('#loginBtn')?.addEventListener('click', () => {
    const email = ($('#loginEmail').value || '').trim().toLowerCase();
    const pass  = ($('#loginPass').value  || '').trim();
    const res = login(email, pass);
    if(!res.ok) return alert(res.msg);
    bootUI();
  });

  // Logout
  $('#logoutBtn')?.addEventListener('click', logout);

  // Navigácia (po prihlásení je header zobrazený)
  $('#mainNav')?.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route]');
    if(!link) return;
    e.preventDefault();
    showRoute(link.dataset.route);
  });

  // Akcie – uloženie reportu
  $('#saveReportBtn')?.addEventListener('click', saveReport);
});

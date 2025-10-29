
const USERS = {
  'dominik@viewsk.com': { name:'Martin Dominik', role:'manager', pass:'viewadmin2025' },
  'lukac@viewsk.com':   { name:'Róbert Lukáč',   role:'sales',   pass:'view2025' },
  'illesova@viewsk.com':{ name:'Martina Illesová',role:'sales',   pass:'view2025' }
};
const REPORTS_KEY='v28_reports';

function $(s){return document.querySelector(s)}
function $all(s){return Array.from(document.querySelectorAll(s))}

function currentUser(){const r=sessionStorage.getItem('vd_user');return r?JSON.parse(r):null}
function login(email,pass){
  const u=USERS[email];
  if(!u) return {ok:false,msg:'Neexistujúci používateľ'};
  if(u.pass!==pass) return {ok:false,msg:'Nesprávne heslo'};
  sessionStorage.setItem('vd_user', JSON.stringify({email,role:u.role,name:u.name}));
  return {ok:true};
}
function logout(){sessionStorage.removeItem('vd_user'); location.reload();}

function getReports(){const r=localStorage.getItem(REPORTS_KEY); return r? JSON.parse(r) : {}; }
function saveReports(obj){ localStorage.setItem(REPORTS_KEY, JSON.stringify(obj)); }

function setActiveMenu(route){$all('.nav-link').forEach(a=>a.classList.toggle('active', a.dataset.route===route));}
function showRoute(route){$all('.route').forEach(r=>r.classList.add('hidden')); const el=$('#route-'+route); if(el) el.classList.remove('hidden'); setActiveMenu(route);}

function getISOWeek(d=new Date()){
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}
function getWeekRangeString(date=new Date()){
  const d = new Date(date);
  const day = d.getDay() || 7;
  const monday = new Date(d); monday.setDate(d.getDate() - (day-1));
  const sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
  const months = ['januára','februára','marca','apríla','mája','júna','júla','augusta','septembra','októbra','novembra','decembra'];
  const fmt = (x)=> `${x.getDate()}. ${months[x.getMonth()]}`;
  return `${fmt(monday)} – ${fmt(sunday)}`;
}
function showToast(msg='✅ Uložené'){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),2000); }

function bootSignedInUI(){
  const cur=currentUser(); if(!cur) return;
  $('#appHeader').classList.remove('hidden');
  $('#appFooter').classList.remove('hidden');
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  $('#userLabel').textContent = cur.name + ' ('+cur.email+')';
  $('#logoutBtn').classList.remove('hidden');
  $all('.only-manager').forEach(e=> e.classList.toggle('hidden', cur.role!=='manager'));
  const weekNow = getISOWeek();
  $('#welcomeCard').textContent = 'Vitaj späť, ' + cur.name + '!';
  checkMissingReport(cur.email, weekNow);
  const rng = getWeekRangeString();
  $('#rWeek').placeholder = `${weekNow} (${rng})`;
  showRoute('dashboard');
}
function checkMissingReport(email, weekNum){
  const data = getReports();
  const has = data[email] && data[email][String(weekNum)];
  $('#missingReportNotice').classList.toggle('hidden', !!has);
}
function renderMyReports(){
  const cur=currentUser(); if(!cur) return;
  const data=getReports();
  const mine = (data[cur.email]||{});
  const tbody = $('#myReportsTable tbody');
  tbody.innerHTML='';
  Object.keys(mine).sort((a,b)=>+b-+a).forEach(week=>{
    const r = mine[week];
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${r.week}</td><td>${r.outreaches}</td><td>${r.meetingsAgreed}</td><td>${r.meetingsDone}</td><td>${r.offers}</td><td>${r.orders}</td>`;
    tbody.appendChild(tr);
  });
}
function renderAllReports(){
  const cur=currentUser(); if(!cur || cur.role!=='manager') return;
  const data=getReports();
  const tbody=$('#allReportsTable tbody'); tbody.innerHTML='';
  Object.keys(data).forEach(email=>{
    const user = USERS[email]; const name = user? user.name : email;
    Object.keys(data[email]).sort((a,b)=>+b-+a).forEach(week=>{
      const r = data[email][week];
      const tr=document.createElement('tr');
      if((r.orders||0) >= 2) tr.classList.add('highlight');
      tr.innerHTML = `<td>${name}</td><td>${email}</td><td>${r.week}</td><td>${r.outreaches}</td><td>${r.meetingsAgreed}</td><td>${r.meetingsDone}</td><td>${r.offers}</td><td>${r.orders}</td>`;
      tbody.appendChild(tr);
    });
  });
  $('#managerReportsWrap').classList.toggle('hidden', currentUser().role!=='manager');
}
function saveReport(){
  const cur=currentUser(); if(!cur){ alert('Najprv sa prihlás'); return; }
  const week = ($('#rWeek').value||'').trim();
  const outreaches = +($('#rOutreaches').value||0);
  const meetingsAgreed = +($('#rMeetingsAgreed').value||0);
  const meetingsDone = +($('#rMeetingsDone').value||0);
  const offers = +($('#rOffers').value||0);
  const orders = +($('#rOrders').value||0);
  if(!week){ alert('Zadaj týždeň (číslo a rozsah v zátvorke).'); return; }
  const weekNum = parseInt(week,10) || getISOWeek();
  const data = getReports();
  data[cur.email] = data[cur.email] || {};
  data[cur.email][String(weekNum)] = { week, outreaches, meetingsAgreed, meetingsDone, offers, orders };
  saveReports(data);
  renderMyReports(); renderAllReports(); checkMissingReport(cur.email, getISOWeek()); showToast('✅ Report uložený');
}

document.addEventListener('DOMContentLoaded',()=>{
  $('#appHeader').classList.add('hidden'); $('#appFooter').classList.add('hidden');
  $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden');
  if(currentUser()){ bootSignedInUI(); }
  $('#loginBtn').addEventListener('click',()=>{
    const email=$('#loginEmail').value.trim().toLowerCase();
    const pass=$('#loginPass').value.trim();
    const r=login(email,pass);
    if(!r.ok){ alert(r.msg); return; }
    bootSignedInUI();
  });
  $('#logoutBtn').addEventListener('click',()=>logout());
  $('#mainNav').addEventListener('click',(e)=>{
    const link=e.target.closest('[data-route]'); if(!link) return;
    e.preventDefault();
    const cur=currentUser(); if(!cur){ alert('Najprv sa prihlás'); return; }
    const route=link.dataset.route;
    if(route==='obchodnici' && cur.role!=='manager'){ alert('Len pre manažéra'); return; }
    showRoute(route);
    if(route==='reporty'){ renderMyReports(); renderAllReports(); }
  });
  const hamburger=$('#hamburger'); const nav=$('#mainNav');
  hamburger.addEventListener('click',()=>{
    const expanded=hamburger.getAttribute('aria-expanded')==='true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('show', !expanded);
  });
  nav.addEventListener('click',(e)=>{
    if(e.target.closest('a')){ hamburger.setAttribute('aria-expanded','false'); nav.classList.remove('show'); }
  });
  $('#saveReportBtn').addEventListener('click', saveReport);
});

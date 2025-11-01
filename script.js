// v3.6 – Mesačný súhrn + 'Pridať report' odkaz + správa obchodníkov
const DEFAULT_USERS={
  'dominik@viewsk.com':{name:'Martin Dominik',role:'manager',pass:'viewadmin2025'},
  'lukac@viewsk.com':{name:'Róbert Lukáč',role:'sales',pass:'view2025'},
  'illesova@viewsk.com':{name:'Martina Illesová',role:'sales',pass:'view2025'}
};
const USERS_KEY='v33_users';
const REPORTS_KEY='v28_reports';
const GOALS_KEY='v30_goals';

function $(s){return document.querySelector(s)};function $all(s){return Array.from(document.querySelectorAll(s))}

// ===== Users storage =====
function getUsers(){
  const raw=localStorage.getItem(USERS_KEY);
  if(raw){ return JSON.parse(raw); }
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return JSON.parse(localStorage.getItem(USERS_KEY));
}
function saveUsers(obj){ localStorage.setItem(USERS_KEY, JSON.stringify(obj)); }

// ===== Session =====
function currentUser(){const r=sessionStorage.getItem('vd_user');return r?JSON.parse(r):null}
function login(email,pass){
  const users=getUsers(); const u=users[email];
  if(!u) return {ok:false,msg:'Neexistujúci používateľ'};
  if(u.pass!==pass) return {ok:false,msg:'Nesprávne heslo'};
  sessionStorage.setItem('vd_user', JSON.stringify({email,role:u.role,name:u.name}));
  return {ok:true};
}
function logout(){sessionStorage.removeItem('vd_user'); location.reload();}

// ===== Reports storage =====
function getReports(){const r=localStorage.getItem(REPORTS_KEY); return r? JSON.parse(r) : {}; }
function saveReports(obj){ localStorage.setItem(REPORTS_KEY, JSON.stringify(obj)); }

// ===== Goals storage =====
function getGoals(){const g=localStorage.getItem(GOALS_KEY); return g? JSON.parse(g):{};}
function saveGoals(data){localStorage.setItem(GOALS_KEY, JSON.stringify(data));}

// ===== Utils =====
function percent(actual,target){ if(!target||target<=0) return 0; return (actual/target)*100; }
function pctText(p){ return (Math.round(p*10)/10).toFixed(1).replace('.',',') + ' %'; }
function pctColor(p){ if(p>=100) return '#28a745'; if(p>=50) return '#ff9800'; return '#e11d48'; }
function renderCircle(el, p){
  const size=140, r=62, cX=70, cY=70; const circ=2*Math.PI*r; const dash=Math.max(0, Math.min(circ, circ*(p/100)));
  el.innerHTML=`<svg width="${size}" height="${size}" viewBox="0 0 140 140">
    <circle cx="${cX}" cy="${cY}" r="${r}" fill="none" stroke="#eee" stroke-width="12"/>
    <circle cx="${cX}" cy="${cY}" r="${r}" fill="none" stroke="${pctColor(p)}" stroke-width="12" stroke-linecap="round" transform="rotate(-90 ${cX} ${cY})"
            stroke-dasharray="${dash} ${circ-dash}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="#333">${pctText(p)}</text>
  </svg>`;
}
function renderMiniCircle(el, p){
  const size=80, r=30, cX=40, cY=40; const circ=2*Math.PI*r; const dash=Math.max(0, Math.min(circ, circ*(p/100)));
  el.innerHTML=`<svg width="${size}" height="${size}" viewBox="0 0 80 80">
    <circle cx="${cX}" cy="${cY}" r="${r}" fill="none" stroke="#eee" stroke-width="10"/>
    <circle cx="${cX}" cy="${cY}" r="${r}" fill="none" stroke="${pctColor(p)}" stroke-width="10" stroke-linecap="round" transform="rotate(-90 ${cX} ${cY})"
            stroke-dasharray="${dash} ${circ-dash}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="#333">${pctText(p)}</text>
  </svg>`;
}
function showToast(msg='✅ Uložené'){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1800); }

// ===== Navigation & layout =====
function setActiveMenu(route){ $all('.nav-link').forEach(a=>a.classList.toggle('active', a.dataset.route===route)); }
function showRoute(route){
  $all('.route').forEach(r=>r.classList.add('hidden'));
  const el=$('#route-'+route); if(el) el.classList.remove('hidden');
  setActiveMenu(route);
  if(route==='dashboard') renderDashboard();
  if(route==='reporty'){ renderMyReports(); renderAllReports(); }
  if(route==='ciele') renderGoalsPage();
  if(route==='obchodnici') renderUsersPage();
}

// ===== Reports helpers =====
function getISOWeek(d=new Date()){ d=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const n=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-n); const y=new Date(Date.UTC(d.getUTCFullYear(),0,1)); return Math.ceil((((d-y)/86400000)+1)/7) }
function getWeekRangeString(t=new Date()){ const d=new Date(t),n=d.getDay()||7,m=new Date(d); m.setDate(d.getDate()-(n-1)); const s=new Date(m); s.setDate(m.getDate()+6); const M=['januára','februára','marca','apríla','mája','júna','júla','augusta','septembra','októbra','novembra','decembra']; const f=x=>`${x.getDate()}. ${M[x.getMonth()]}`; return `${f(m)} – ${f(s)}` }
function checkMissingReport(email,weekNum){
  const data=getReports(); const has=data[email] && data[email][String(weekNum)];
  const notice=$('#missingReportNotice');
  if(!has){
    notice.classList.remove('hidden');
  }else{
    notice.classList.add('hidden');
  }
}

// ===== Reports rendering =====
function renderMyReports(){
  const cur=currentUser(); if(!cur) return;
  const data=getReports(); const mine=(data[cur.email]||{}); const tbody=$('#myReportsTable tbody'); tbody.innerHTML='';
  Object.keys(mine).sort((a,b)=>+b-+a).forEach(week=>{ const r=mine[week]; const tr=document.createElement('tr');
    tr.innerHTML=`<td>${r.week}</td><td>${r.outreaches}</td><td>${r.meetingsAgreed}</td><td>${r.meetingsDone}</td><td>${r.offers}</td><td>${r.orders}</td>`; tbody.appendChild(tr);
  });
}
function renderAllReports(){
  const cur=currentUser(); if(!cur || cur.role!=='manager') return;
  const users=getUsers(); const data=getReports(); const tbody=$('#allReportsTable tbody'); tbody.innerHTML='';
  Object.keys(data).forEach(email=>{
    const user=users[email]; const name=user?user.name:email;
    Object.keys(data[email]).sort((a,b)=>+b-+a).forEach(week=>{
      const r=data[email][week]; const tr=document.createElement('tr');
      if((r.orders||0)>=2) tr.classList.add('highlight');
      tr.innerHTML=`<td>${name}</td><td>${email}</td><td>${r.week}</td><td>${r.outreaches}</td><td>${r.meetingsAgreed}</td><td>${r.meetingsDone}</td><td>${r.offers}</td><td>${r.orders}</td>`;
      tbody.appendChild(tr);
    });
  });
  $('#managerReportsWrap').classList.toggle('hidden', currentUser().role!=='manager');
}
function saveReport(){
  const cur=currentUser(); if(!cur){ alert('Najprv sa prihlás'); return; }
  const week=($('#rWeek').value||'').trim(), outreaches=+($('#rOutreaches').value||0), meetingsAgreed=+($('#rMeetingsAgreed').value||0), meetingsDone=+($('#rMeetingsDone').value||0), offers=+($('#rOffers').value||0), orders=+($('#rOrders').value||0);
  if(!week){ alert('Zadaj týždeň (číslo a rozsah v zátvorke).'); return; }
  const weekNum=parseInt(week,10) || getISOWeek();
  const data=getReports(); data[cur.email]=data[cur.email]||{};
  const now=new Date(); const savedAt=now.toISOString();
  data[cur.email][String(weekNum)]={week,outreaches,meetingsAgreed,meetingsDone,offers,orders,savedAt};
  saveReports(data); renderMyReports(); renderAllReports(); checkMissingReport(cur.email, getISOWeek()); showToast('✅ Report uložený');
}

// ===== Goals =====
function renderDashboard(){
  const cur=currentUser(); if(!cur) return;
  const goals=getGoals(); const users=getUsers();
  if(cur.role==='manager'){
    let usersWith=0, sumT=0, sumA=0;
    Object.keys(users).forEach(email=>{
      if(users[email].role!=='sales') return;
      const g=goals[email]; if(!g||(!g.target&&!g.actual)) return;
      usersWith++; sumT+=(+g.target||0); sumA+=(+g.actual||0);
    });
    const avg= usersWith && sumT>0 ? (sumA/sumT*100) : 0;
    $('#statUsers').textContent=usersWith;
    $('#statTargets').textContent=(Math.round(sumT*10)/10).toLocaleString('sk-SK');
    $('#statActuals').textContent=(Math.round(sumA*10)/10).toLocaleString('sk-SK');
    $('#statAvg').textContent=pctText(avg);
    renderCircle($('#teamCircle'), isFinite(avg)? Math.max(0,Math.min(200,avg)) : 0);
    $('#managerSummary').classList.remove('hidden'); $('#myGoalCard').classList.add('hidden');

    // Mesačný súhrn
    renderMonthlySummary();
  }else{
    const g=goals[cur.email]||{target:0,actual:0}; const p=percent(+g.actual||0,+g.target||0);
    $('#myTarget').textContent=(+g.target||0).toLocaleString('sk-SK');
    $('#myActual').textContent=(+g.actual||0).toLocaleString('sk-SK');
    $('#myPct').textContent=pctText(p);
    renderCircle($('#myCircle'),isFinite(p)?Math.max(0,Math.min(200,p)):0);
    $('#myGoalCard').classList.remove('hidden'); $('#managerSummary').classList.add('hidden'); $('#monthlySummaryCard').classList.add('hidden');
  }
}
function renderGoalsPage(){
  const cur=currentUser(); if(!cur) return;
  const goals=getGoals(); const users=getUsers();
  if(cur.role==='manager'){
    const sel=$('#goalUser'); sel.innerHTML='';
    Object.keys(users).forEach(email=>{ if(users[email].role!=='sales') return; const opt=document.createElement('option'); opt.value=email; opt.textContent=`${users[email].name} (${email})`; sel.appendChild(opt); });
    const tb=$('#goalsTable tbody'); tb.innerHTML='';
    Object.keys(users).forEach(email=>{
      if(users[email].role!=='sales') return;
      const g=goals[email]||{target:0,actual:0}; const p=percent(+g.actual||0, +g.target||0);
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${users[email].name}<br><small>${email}</small></td>
        <td>${(+g.target||0).toLocaleString('sk-SK')}</td>
        <td>${(+g.actual||0).toLocaleString('sk-SK')}</td>
        <td>${pctText(p)}</td>
        <td><div class="circle mini" id="mini_${email}"></div></td>`;
      tb.appendChild(tr); renderMiniCircle(document.getElementById('mini_'+email), p);
    });
    $('#addGoalCard').classList.remove('hidden'); $('#managerGoals').classList.remove('hidden'); $('#salesGoal').classList.add('hidden');
  }else{
    const g=goals[cur.email]||{target:0,actual:0}; const p=percent(+g.actual||0, +g.target||0);
    $('#sgTarget').textContent=(+g.target||0).toLocaleString('sk-SK'); $('#sgActual').textContent=(+g.actual||0).toLocaleString('sk-SK'); $('#sgPct').textContent=pctText(p);
    renderCircle($('#salesCircle'), isFinite(p)? Math.max(0,Math.min(200,p)) : 0);
    $('#managerGoals').classList.add('hidden'); $('#salesGoal').classList.remove('hidden'); $('#addGoalCard').classList.add('hidden');
  }
}
function bindGoalForm(){
  const btn=$('#saveGoalBtn'); if(!btn) return;
  btn.addEventListener('click', ()=>{
    const email=$('#goalUser').value; const target=+($('#goalTarget').value||0); const actual=+($('#goalActual').value||0);
    const data=getGoals(); data[email]={target,actual}; saveGoals(data);
    showToast('✅ Cieľ uložený'); renderGoalsPage(); renderDashboard();
  });
}

// ===== Users page (manager) =====
function renderUsersPage(){
  const cur=currentUser(); if(!cur || cur.role!=='manager') return;
  const users=getUsers(); const goals=getGoals(); const reports=getReports();
  $all('.only-manager').forEach(e=> e.classList.toggle('hidden', cur.role!=='manager'));
  const tb=$('#usersTable tbody'); tb.innerHTML='';
  Object.keys(users).forEach(email=>{
    const u=users[email];
    const repCount = reports[email] ? Object.keys(reports[email]).length : 0;
    const hasGoal = goals[email] ? '✔️' : '—';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${u.name}</td>
      <td>${email}</td>
      <td>${u.role==='manager'?'manažér':'obchodník'}</td>
      <td>${repCount}</td>
      <td>${hasGoal}</td>
      <td>
        <button class="btn small" data-edit="${email}">Upraviť</button>
        <button class="btn small" data-del="${email}" style="margin-left:6px;background:#e11d48">Zmazať</button>
      </td>`;
    tb.appendChild(tr);
  });
  tb.onclick=(e)=>{
    const edit=e.target.closest('[data-edit]'); const dele=e.target.closest('[data-del]');
    if(edit){ const email=edit.getAttribute('data-edit'); fillUserForm(email); }
    if(dele){ const email=dele.getAttribute('data-del'); deleteUser(email); }
  }
}
function fillUserForm(email){
  const users=getUsers(); const u=users[email]; if(!u) return;
  $('#uName').value=u.name; $('#uEmail').value=email; $('#uPass').value=u.pass; $('#uRole').value=u.role;
}
function clearUserForm(){ $('#uName').value=''; $('#uEmail').value=''; $('#uPass').value=''; $('#uRole').value='sales'; }
function deleteUser(email){
  const cur=currentUser(); if(cur && cur.email===email){ alert('Nemôžeš zmazať sám seba.'); return; }
  if(!confirm('Naozaj zmazať tohto používateľa vrátane jeho dát?')) return;
  const users=getUsers(); if(!users[email]) return;
  delete users[email]; saveUsers(users);
  const g=getGoals(); if(g[email]){ delete g[email]; saveGoals(g); }
  const r=getReports(); if(r[email]){ delete r[email]; saveReports(r); }
  showToast('✅ Používateľ zmazaný'); renderUsersPage(); renderGoalsPage(); renderDashboard();
}
function addOrUpdateUser(){
  const name=($('#uName').value||'').trim(); const email=($('#uEmail').value||'').trim().toLowerCase();
  const pass=($('#uPass').value||'').trim(); const role=$('#uRole').value;
  if(!name||!email||!pass){ alert('Vyplň meno, e-mail a heslo.'); return; }
  const users=getUsers(); users[email]={name,role,pass}; saveUsers(users);
  showToast('✅ Používateľ uložený'); clearUserForm(); renderUsersPage();
}

// ===== Monthly summary =====
function isSameMonth(d, y, m){
  const dt = new Date(d);
  return dt.getFullYear()===y && dt.getMonth()===m;
}
function renderMonthlySummary(){
  const now=new Date(); const month=now.getMonth(); const year=now.getFullYear();
  const reports=getReports();
  const sum={outreaches:0, meetingsAgreed:0, meetingsDone:0, offers:0, orders:0};

  Object.values(reports).forEach(userReports=>{
    Object.values(userReports).forEach(rep=>{
      if(rep.savedAt){
        if(!isSameMonth(rep.savedAt, year, month)) return;
      }
      sum.outreaches += +rep.outreaches || 0;
      sum.meetingsAgreed += +rep.meetingsAgreed || 0;
      sum.meetingsDone += +rep.meetingsDone || 0;
      sum.offers += +rep.offers || 0;
      sum.orders += +rep.orders || 0;
    });
  });

  const tb=$('#monthlySummaryTable tbody');
  tb.innerHTML=`
    <tr><td>Oslovenia</td><td>${sum.outreaches}</td></tr>
    <tr><td>Dohodnuté stretnutia</td><td>${sum.meetingsAgreed}</td></tr>
    <tr><td>Realizované stretnutia</td><td>${sum.meetingsDone}</td></tr>
    <tr><td>Ponuky</td><td>${sum.offers}</td></tr>
    <tr><td>Objednávky</td><td>${sum.orders}</td></tr>
  `;
  $('#monthlySummaryCard').classList.remove('hidden');
}

// ===== Boot =====
function bootSignedInUI(){
  const cur=currentUser(); if(!cur) return;
  $('#appHeader').classList.remove('hidden'); $('#appFooter').classList.remove('hidden'); $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden');
  $('#userLabel').textContent = cur.name + ' ('+cur.email+')'; $('#logoutBtn').classList.remove('hidden');
  $all('.only-manager').forEach(e=> e.classList.toggle('hidden', cur.role!=='manager'));
  const wk=getISOWeek(); const rng=getWeekRangeString(); const w=$('#rWeek'); if(w) w.placeholder=`${wk} (${rng})`; checkMissingReport(cur.email, wk);
  showRoute('dashboard');
}

document.addEventListener('DOMContentLoaded', ()=>{
  $('#appHeader').classList.add('hidden'); $('#appFooter').classList.add('hidden'); $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden');

  if(currentUser()) bootSignedInUI();

  $('#loginBtn').addEventListener('click', ()=>{
    const email=$('#loginEmail').value.trim().toLowerCase();
    const pass=$('#loginPass').value.trim();
    const r=login(email,pass);
    if(!r.ok){ alert(r.msg); return; }
    bootSignedInUI();
  });
  $('#logoutBtn').addEventListener('click', ()=>logout());

  $('#mainNav').addEventListener('click', (e)=>{
    const link=e.target.closest('[data-route]'); if(!link) return; e.preventDefault();
    const cur=currentUser(); if(!cur){ alert('Najprv sa prihlás'); return; }
    const route=link.dataset.route;
    if(route==='obchodnici' && cur.role!=='manager'){ alert('Len pre manažéra'); return; }
    showRoute(route);
  });

  const hamburger=$('#hamburger'); const nav=$('#mainNav');
  hamburger.addEventListener('click',()=>{ const exp=hamburger.getAttribute('aria-expanded')==='true'; hamburger.setAttribute('aria-expanded', String(!exp)); nav.classList.toggle('show', !exp); });
  nav.addEventListener('click',(e)=>{ if(e.target.closest('a')){ hamburger.setAttribute('aria-expanded','false'); nav.classList.remove('show'); } });

  $('#saveReportBtn').addEventListener('click', saveReport);
  $('#addUserBtn').addEventListener('click', addOrUpdateUser);
  $('#clearFormBtn').addEventListener('click', clearUserForm);
  (function bindGoalForm(){ const btn=document.querySelector('#saveGoalBtn'); if(!btn) return; btn.addEventListener('click', ()=>{ const email=document.querySelector('#goalUser').value; const target=+(document.querySelector('#goalTarget').value||0); const actual=+(document.querySelector('#goalActual').value||0); const data=getGoals(); data[email]={target,actual}; saveGoals(data); showToast('✅ Cieľ uložený'); renderGoalsPage(); renderDashboard(); }); })();

  // Add-report link
  const addLink=document.querySelector('#addReportLink');
  if(addLink){
    addLink.addEventListener('click',(e)=>{
      e.preventDefault();
      showRoute('reporty');
      const w=document.querySelector('#rWeek'); if(w) w.focus();
    });
  }
});
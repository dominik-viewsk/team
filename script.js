
// View Team Dashboard PRO v2.5 (final)
const DEFAULT_PASS='view2025';
const ADMIN_EMAIL='dominik@viewsk.com';
const ADMIN_PASS='viewadmin2025';

const INITIAL_USERS={
  [ADMIN_EMAIL]:{name:'Martin Dominik',role:'manager',pass:ADMIN_PASS},
  'lukac@viewsk.com':{name:'Róbert Lukáč',role:'sales',pass:DEFAULT_PASS,goal:10000},
  'illesova@viewsk.com':{name:'Martina Illesová',role:'sales',pass:DEFAULT_PASS,goal:8000}
};
const INITIAL_DATA={
  week:44,
  users:{
    'lukac@viewsk.com':{contacts:30,outreaches:30,meetings:10,offers:15,orders:2,revenue:9500},
    'illesova@viewsk.com':{contacts:25,outreaches:25,meetings:8,offers:12,orders:1,revenue:6200}
  }
};

function $(s){return document.querySelector(s)}
function $all(s){return Array.from(document.querySelectorAll(s))}

function loadUsers(){const r=localStorage.getItem('vd_users'); if(r) return JSON.parse(r); localStorage.setItem('vd_users',JSON.stringify(INITIAL_USERS)); return JSON.parse(JSON.stringify(INITIAL_USERS));}
function saveUsers(u){localStorage.setItem('vd_users',JSON.stringify(u))}
function loadData(){const r=localStorage.getItem('vd_data'); if(r) return JSON.parse(r); localStorage.setItem('vd_data',JSON.stringify(INITIAL_DATA)); return JSON.parse(JSON.stringify(INITIAL_DATA));}
function saveData(d){localStorage.setItem('vd_data',JSON.stringify(d))}

let USERS=loadUsers();
let DATA=loadData();

function login(email,pass){
  if(!USERS[email]) return {ok:false,msg:'Neexistujúci používateľ'};
  if(USERS[email].pass!==pass) return {ok:false,msg:'Nesprávne heslo'};
  sessionStorage.setItem('vd_user',JSON.stringify({email,role:USERS[email].role,name:USERS[email].name}));
  return {ok:true};
}
function currentUser(){const r=sessionStorage.getItem('vd_user');return r?JSON.parse(r):null}
function logout(){sessionStorage.removeItem('vd_user');location.reload()}

function ensureModalHidden(id){const el=document.getElementById(id); if(el){el.classList.add('hidden'); el.setAttribute('aria-hidden','true');}}
function showModal(id){const el=document.getElementById(id); if(el){el.classList.remove('hidden'); el.setAttribute('aria-hidden','false');}}
function hideModal(id){ensureModalHidden(id)}

function routeTo(page){
  const cur=currentUser();
  if(page==='manager' && cur?.role!=='manager'){alert('Nemáš prístup.');return;}
  $all('.page').forEach(p=>p.classList.add('hidden'));
  const el=document.getElementById(page); if(el) el.classList.remove('hidden');
}

function fmt(n){return (n||0).toLocaleString('sk-SK')}

function colorByPct(p){return p>=100?'#28a745':(p>=80?'#ff9800':'#e53935')}
function emojiByPct(p){return p>=100?'🟩':(p>=80?'🟧':'🟥')}

// ===== SALES =====
function renderSales(email){
  const d = DATA.users[email] || {contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
  const u = USERS[email] || {};
  const w = document.getElementById('weeklyOverview'); w.innerHTML='';
  const metrics=[
    ['📞 Kontakty',d.contacts],
    ['💬 Oslovenia',d.outreaches],
    ['🤝 Stretnutia',d.meetings],
    ['🧾 Ponuky',d.offers],
    ['🛒 Objednávky',d.orders],
    ['💰 Obrat (€)',fmt(d.revenue)]
  ];
  metrics.forEach(([label,val])=>{
    const c=document.createElement('div'); c.className='card small';
    c.innerHTML=`<div>${label}</div><div class="num">${val||0}</div>`;
    w.appendChild(c);
  });
  const goal = u.goal||0;
  const rev = d.revenue||0;
  const pct = goal? Math.round((rev/goal)*100) : 0;
  document.getElementById('revenueVal').textContent = fmt(rev);
  document.getElementById('goalVal').textContent = goal? fmt(goal) : '-';
  document.getElementById('pctVal').textContent = goal? (pct+'%') : '—';
  const pb=document.getElementById('progressBar');
  pb.style.width = Math.min(pct,100)+'%';
  pb.style.background = colorByPct(pct);
  document.getElementById('goalStatus').textContent = goal? (pct>=100?'✅ Splnené!':(pct>=80?'⚠️ Blízko cieľa':'❌ Potrebné zlepšiť')) : 'Cieľ nie je nastavený.';
}

// ===== MANAGER =====
function totalsForTeam(){
  const keys=['contacts','outreaches','meetings','offers','orders','revenue'];
  const t={}; keys.forEach(k=>t[k]=0);
  Object.keys(USERS).forEach(email=>{
    if(USERS[email].role!=='sales') return;
    const d=DATA.users[email]||{};
    keys.forEach(k=>{t[k]+=d[k]||0});
  });
  return t;
}
function teamGoalStats(){
  let sumRev=0,sumGoal=0,count=0;
  Object.keys(USERS).forEach(email=>{
    if(USERS[email].role!=='sales') return;
    const d=DATA.users[email]||{};
    const g=USERS[email].goal||0;
    if(g>0){ sumRev += (d.revenue||0); sumGoal += g; count++; }
  });
  const pct = sumGoal? Math.round((sumRev/sumGoal)*100) : 0;
  return {sumRev,sumGoal,pct,count};
}

function renderManager(){
  // Summary
  const {sumRev,sumGoal,pct} = teamGoalStats();
  const icon = pct>=90?'🟩':(pct>=80?'🟧':'🟥');
  document.getElementById('teamSummary').innerHTML = `${icon} Tím plní cieľ na <b>${pct}%</b><br>💰 Celkový obrat <b>${fmt(sumRev)} €</b> z cieľa <b>${fmt(sumGoal)} €</b>`;

  // Team KPI cards
  const t = totalsForTeam();
  const labels=['📞 Kontakty','💬 Oslovenia','🤝 Stretnutia','🧾 Ponuky','🛒 Objednávky','💰 Obrat (€)'];
  const keys=['contacts','outreaches','meetings','offers','orders','revenue'];
  const box=document.getElementById('teamKPI'); box.innerHTML='';
  for(let i=0;i<keys.length;i++){
    const c=document.createElement('div'); c.className='card small';
    c.innerHTML=`<div>${labels[i]}</div><div class="num">${fmt(t[keys[i]])}</div>`;
    box.appendChild(c);
  }

  // Team progress
  const teamCard=document.getElementById('teamGoalCard');
  teamCard.innerHTML = `<h3>Plnenie cieľov tímu</h3>
    <div class="progress"><div style="width:${Math.min(pct,100)}%;background:${colorByPct(pct)}"></div></div>`;

  // Sales list with mini progress
  const list=document.getElementById('salesList'); list.innerHTML='';
  Object.keys(USERS).forEach(email=>{
    const u=USERS[email]; if(u.role!=='sales') return;
    const d=DATA.users[email]||{revenue:0};
    const g=u.goal||0;
    const p = g? Math.round((d.revenue/g)*100) : 0;
    const color = colorByPct(p);
    const icon = emojiByPct(p);
    const card=document.createElement('div'); card.className='card';
    card.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div><strong>${icon} ${u.name}</strong><div class="hint">${email}</div></div>
        <div style="text-align:right">
          <div><b>${fmt(d.revenue)} €</b> / ${g?fmt(g):'-'} €</div>
          <div class="progress"><div style="width:${Math.min(p,100)}%;background:${color}"></div></div>
          <div class="hint" style="text-align:right">${p}% plnenie</div>
        </div>
      </div>`;
    list.appendChild(card);
  });

  // Goals table (manager tools)
  renderGoalsTable();
  renderKPI(); // fill KPI table if exists (kept for CSV/export structure)
}

function renderGoalsTable(){
  const tb=document.getElementById('goalsTable'); if(!tb) return;
  tb.innerHTML='';
  Object.keys(USERS).forEach(email=>{
    const u=USERS[email]; if(u.role!=='sales') return;
    const tr=document.createElement('tr');
    const val = u.goal ?? '';
    tr.innerHTML = `<td>${u.name}</td><td>${email}</td><td><input type="number" min="0" id="goal_${btoa(email)}" value="${val}"></td><td><button class="btn small ghost" data-savegoal="${email}">Uložiť</button></td>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll('[data-savegoal]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const email=btn.getAttribute('data-savegoal');
      const input=document.getElementById('goal_'+btoa(email));
      const v=input.value.trim();
      USERS[email].goal = v===''? null : Math.max(0,Math.round(+v));
      saveUsers(USERS);
      const cur=currentUser();
      if(cur?.role==='manager') renderManager();
      if(cur?.email===email) renderSales(email);
      alert('Cieľ uložený.');
    });
  });
}

// Minimal KPI table model for CSV export (not shown in UI)
function renderKPI(){ /* kept for CSV structure */ }

// ===== REPORT =====
function populateSalesSelect(cur){
  const wrap=document.getElementById('reportSalesWrap');
  const sel=document.getElementById('rSales');
  if(cur.role==='manager'){
    wrap.classList.remove('hidden');
    sel.innerHTML='';
    Object.keys(USERS).forEach(email=>{
      if(USERS[email].role!=='sales') return;
      const opt=document.createElement('option'); opt.value=email; opt.textContent=USERS[email].name+' ('+email+')';
      sel.appendChild(opt);
    });
    sel.disabled=false;
  }else{
    wrap.classList.add('hidden');
    sel.value=cur.email;
    sel.disabled=true;
  }
}
function openReport(){
  const cur=currentUser(); if(!cur){alert('Prihlásenie je potrebné');return;}
  ['rContacts','rOutreaches','rMeetings','rOffers','rOrders','rRevenue'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  populateSalesSelect(cur);
  showModal('reportModal');
}
function saveReport(){
  const cur=currentUser(); if(!cur) return;
  const who=(cur.role==='manager')? document.getElementById('rSales').value : cur.email;
  const c=+document.getElementById('rContacts').value||0;
  const o=+document.getElementById('rOutreaches').value||0;
  const m=+document.getElementById('rMeetings').value||0;
  const p=+document.getElementById('rOffers').value||0;
  const ord=+document.getElementById('rOrders').value||0;
  const rev=+document.getElementById('rRevenue').value||0;
  DATA.users[who]={contacts:c,outreaches:o,meetings:m,offers:p,orders:ord,revenue:rev};
  saveData(DATA);
  const u=currentUser();
  if(u.role==='manager') renderManager(); else renderSales(u.email);
  hideModal('reportModal');
  alert('Report uložený.');
}

// ===== EXPORT / IMPORT / RESET =====
function exportCSV(){
  const header=['Meno','Priezvisko','E-mail','Kontakty','Oslovenia','Stretnutia','Ponuky','Objednávky','Obrat (€)','Cieľ (€)','% plnenia','Provízia','Bonus','KPI'];
  const rows=[header];
  Object.keys(USERS).forEach(email=>{
    const u=USERS[email]; if(u.role!=='sales') return;
    const name=u.name||''; const parts=name.split(' '); const fname=parts[0]||''; const sname=parts.slice(1).join(' ');
    const d=DATA.users[email]||{contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
    const goal=u.goal||'';
    const pct=goal? Math.round((d.revenue/goal)*100)+'%' : '';
    const prov=((d.revenue||0)*0.2).toFixed(2);
    const bonus=(d.revenue||0)>=5000? 200 : 0;
    const ok=(d.contacts>=30 && d.outreaches>=30 && d.meetings>=10 && d.offers>=15 && d.orders>=2)? 'Splnené':'Nesplnené';
    rows.push([fname,sname,email,d.contacts||0,d.outreaches||0,d.meetings||0,d.offers||0,d.orders||0,d.revenue||0,goal,pct,prov,bonus,ok]);
  });
  const csv = rows.map(r=>r.join(';')).join('\n');
  const fname = `view_kpi_tyden${DATA.week||'xx'}.csv`;
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=fname; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
function addUser(name,email){
  if(USERS[email]) return {ok:false,msg:'Používateľ existuje'};
  USERS[email]={name,role:'sales',pass:DEFAULT_PASS,goal:null};
  saveUsers(USERS);
  if(!DATA.users[email]) DATA.users[email]={contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
  saveData(DATA);
  return {ok:true};
}
function importUsersFromCSV(text){
  const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  let added=0,skipped=0;
  for(let i=0;i<lines.length;i++){
    const line=lines[i]; if(i===0 && /meno/i.test(line) && /e-?mail/i.test(line)) continue;
    const parts=line.split(';').map(x=>x.trim()); if(parts.length<3){skipped++; continue;}
    const name=parts[0]+' '+parts[1]; const email=parts[2].toLowerCase();
    const r=addUser(name,email); if(r.ok) added++; else skipped++;
  }
  return {added,skipped};
}
function resetData(){
  if(!confirm('Naozaj chceš vynulovať dáta (ponechá používateľov)?')) return;
  Object.keys(USERS).forEach(email=>{
    if(USERS[email].role!=='sales') return;
    DATA.users[email]={contacts:0,outreaches:0,meetings:0,offers:0,orders:0,revenue:0};
  });
  saveData(DATA);
  const cur=currentUser();
  if(cur.role==='manager') renderManager(); else renderSales(cur.email);
  alert('Dáta vynulované.');
}

// ===== PASSWORD =====
function openPassModal(){ showModal('passModal'); }
function closePassModal(){ hideModal('passModal'); }
function saveNewPassword(){
  const cur=currentUser(); if(!cur) return;
  const oldP=document.getElementById('oldPass').value;
  const newP=document.getElementById('newPass').value;
  const newP2=document.getElementById('newPass2').value;
  if(!oldP||!newP||!newP2){ alert('Vyplň všetky polia'); return; }
  if(newP!==newP2){ alert('Nové heslá sa nezhodujú'); return; }
  if(USERS[cur.email].pass!==oldP){ alert('Aktuálne heslo nie je správne'); return; }
  USERS[cur.email].pass=newP; saveUsers(USERS);
  closePassModal(); alert('Heslo zmenené.');
  document.getElementById('oldPass').value=''; document.getElementById('newPass').value=''; document.getElementById('newPass2').value='';
}

// ===== BOOT =====
document.addEventListener('DOMContentLoaded',()=>{
  ensureModalHidden('reportModal'); ensureModalHidden('passModal');

  document.getElementById('loginBtn').addEventListener('click',()=>{
    const email=document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass=document.getElementById('loginPass').value.trim();
    const r=login(email,pass);
    if(!r.ok){ alert(r.msg); return; }
    const cur=currentUser();
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('userLabel').textContent = cur.name+' ('+cur.email+')';
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('changePassBtn').classList.remove('hidden');
    if(cur.role==='manager'){ document.getElementById('tabManager').classList.remove('hidden'); routeTo('manager'); renderManager(); }
    else { document.getElementById('tabManager').classList.add('hidden'); routeTo('sales'); renderSales(cur.email); }
  });

  document.getElementById('logoutBtn').addEventListener('click',()=>logout());
  document.getElementById('changePassBtn').addEventListener('click',openPassModal);
  document.getElementById('savePassBtn').addEventListener('click',saveNewPassword);
  document.getElementById('closePassBtn').addEventListener('click',()=>closePassModal());

  document.querySelector('nav.nav')?.addEventListener('click',(e)=>{
    const link=e.target.closest('[data-route]'); if(!link) return;
    e.preventDefault(); routeTo(link.dataset.route);
  });

  document.getElementById('linkReport').addEventListener('click',(e)=>{ e.preventDefault(); openReport(); });
  document.getElementById('saveReport').addEventListener('click',saveReport);
  document.getElementById('closeReport').addEventListener('click',()=>hideModal('reportModal'));

  document.getElementById('addUserBtn').addEventListener('click',()=>{
    const n=(document.getElementById('newName').value||'').trim();
    const s=(document.getElementById('newSurname').value||'').trim();
    const email=(document.getElementById('newEmail').value||'').trim().toLowerCase();
    if(!n||!s||!email){ alert('Vyplň meno, priezvisko, e-mail'); return; }
    const r=addUser(n+' '+s,email);
    if(!r.ok){ alert(r.msg); return; }
    alert('Obchodník pridaný (heslo: view2025)');
    document.getElementById('newName').value=''; document.getElementById('newSurname').value=''; document.getElementById('newEmail').value='';
    renderManager();
  });

  document.getElementById('importCsvBtn').addEventListener('click',()=>{
    const input=document.getElementById('importCsvInput');
    if(!input.files||!input.files[0]){ alert('Vyber CSV súbor'); return; }
    const file=input.files[0]; const reader=new FileReader();
    reader.onload=(e)=>{
      const res=importUsersFromCSV(e.target.result);
      alert('Import hotový. Pridaných: '+res.added+', Preskočených: '+res.skipped);
      renderManager();
      input.value='';
    };
    reader.readAsText(file,'utf-8');
  });

  document.getElementById('exportCsvBtn')?.addEventListener('click',exportCSV);
  document.getElementById('resetDataBtn')?.addEventListener('click',resetData);

  // modal outside click & ESC
  ['reportModal','passModal'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){ el.addEventListener('click',(ev)=>{ if(ev.target===el) hideModal(id); }); }
  });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'){ hideModal('reportModal'); hideModal('passModal'); } });
});

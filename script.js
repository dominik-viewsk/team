
// v2.7 BASE – čistý základ na postupné rozširovanie
const USERS = {
  'dominik@viewsk.com': { name:'Martin Dominik', role:'manager', pass:'viewadmin2025' },
  'lukac@viewsk.com':   { name:'Róbert Lukáč',   role:'sales',   pass:'view2025' },
  'illesova@viewsk.com':{ name:'Martina Illesová',role:'sales',   pass:'view2025' }
};

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

function setActiveMenu(route){$all('.nav-link').forEach(a=>a.classList.toggle('active', a.dataset.route===route));}
function showRoute(route){$all('.route').forEach(r=>r.classList.add('hidden')); const el=$('#route-'+route); if(el) el.classList.remove('hidden'); setActiveMenu(route);}

function bootSignedInUI(){
  const cur=currentUser(); if(!cur) return;
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  $('#userLabel').textContent = cur.name + ' ('+cur.email+')';
  $('#logoutBtn').classList.remove('hidden');
  $all('.only-manager').forEach(e=> e.classList.toggle('hidden', cur.role!=='manager'));
  // uvítanie
  $('#welcomeCard').textContent = 'Vitaj späť, ' + cur.name + '!';
  showRoute('dashboard');
}

document.addEventListener('DOMContentLoaded',()=>{
  // 1) začni vždy loginom
  $('#appView').classList.add('hidden');
  $('#loginView').classList.remove('hidden');

  // 2) ak je už prihlásený (session), ukáž app
  if(currentUser()){ bootSignedInUI(); }

  // 3) login action
  $('#loginBtn').addEventListener('click',()=>{
    const email=$('#loginEmail').value.trim().toLowerCase();
    const pass=$('#loginPass').value.trim();
    const r=login(email,pass);
    if(!r.ok){ alert(r.msg); return; }
    bootSignedInUI();
  });

  // 4) logout
  $('#logoutBtn').addEventListener('click',()=>logout());

  // 5) menu routing
  $('#mainNav').addEventListener('click',(e)=>{
    const link=e.target.closest('[data-route]'); if(!link) return;
    e.preventDefault();
    const cur=currentUser(); if(!cur){ alert('Najprv sa prihlás'); return; }
    const route=link.dataset.route;
    if(route==='obchodnici' && cur.role!=='manager'){ alert('Len pre manažéra'); return; }
    showRoute(route);
  });

  // 6) hamburger
  const hamburger=$('#hamburger'); const nav=$('#mainNav');
  hamburger.addEventListener('click',()=>{
    const expanded=hamburger.getAttribute('aria-expanded')==='true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('show', !expanded);
  });
  nav.addEventListener('click',(e)=>{
    if(e.target.closest('a')){ hamburger.setAttribute('aria-expanded','false'); nav.classList.remove('show'); }
  });
});

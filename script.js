document.addEventListener('DOMContentLoaded',()=>{
  const loginView=document.getElementById('loginView');
  const appView=document.getElementById('appView');
  const loginBtn=document.getElementById('loginBtn');
  const logoutBtn=document.getElementById('logoutBtn');
  const changePassBtn=document.getElementById('changePassBtn');
  const userLabel=document.getElementById('userLabel');
  appView.classList.add('hidden'); loginView.classList.remove('hidden');

  function navigate(route){
    document.querySelectorAll('.route').forEach(r=>r.classList.add('hidden'));
    const el=document.getElementById('route-'+route);
    if(el) el.classList.remove('hidden');
  }

  document.getElementById('mainNav').addEventListener('click',e=>{
    const a=e.target.closest('[data-route]');
    if(!a)return; e.preventDefault();
    navigate(a.dataset.route);
  });

  loginBtn.addEventListener('click',()=>{
    const email=document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass=document.getElementById('loginPass').value.trim();
    const valid=(email==='dominik@viewsk.com'&&pass==='viewadmin2025')||(email==='lukac@viewsk.com'&&pass==='view2025')||(email==='illesova@viewsk.com'&&pass==='view2025');
    if(!valid){alert('Nesprávne prihlasovacie údaje');return;}
    loginView.classList.add('hidden'); appView.classList.remove('hidden');
    userLabel.textContent=email; logoutBtn.classList.remove('hidden'); changePassBtn.classList.remove('hidden');
    navigate('dashboard');
  });

  logoutBtn.addEventListener('click',()=>{
    appView.classList.add('hidden'); loginView.classList.remove('hidden');
    logoutBtn.classList.add('hidden'); changePassBtn.classList.add('hidden');
    userLabel.textContent='';
    navigate('dashboard');
  });
});

const USERS={
  'dominik@viewsk.com':{name:'Martin Dominik',role:'manager',pass:'viewadmin2025'},
  'lukac@viewsk.com':{name:'Róbert Lukáč',role:'sales',pass:'view2025',goal:10000},
  'illesova@viewsk.com':{name:'Martina Illesová',role:'sales',pass:'view2025',goal:8000}
};

const DATA={
  'lukac@viewsk.com':{contacts:30,outreaches:30,meetings:10,offers:15,orders:2,revenue:5500},
  'illesova@viewsk.com':{contacts:25,outreaches:25,meetings:8,offers:12,orders:1,revenue:3500}
};

function $(id){return document.querySelector(id);}

$('#loginBtn').addEventListener('click',()=>{
  const email=$('#loginEmail').value.trim();
  const pass=$('#loginPass').value.trim();
  if(!USERS[email]||USERS[email].pass!==pass){alert('Zlé údaje');return;}
  $('#loginView').classList.add('hidden');
  $('#dashboard').classList.remove('hidden');
  renderDashboard(email);
});

function renderDashboard(email){
  const user=USERS[email];
  const d=DATA[email]||{};
  const w=$('#weeklyOverview');
  w.innerHTML='';
  const metrics=[
    ['📞 Kontakty',d.contacts||0],
    ['💬 Oslovenia',d.outreaches||0],
    ['🤝 Stretnutia',d.meetings||0],
    ['🧾 Ponuky',d.offers||0],
    ['🛒 Objednávky',d.orders||0],
    ['💰 Obrat (€)',d.revenue||0]
  ];
  metrics.forEach(([label,val])=>{
    const c=document.createElement('div');
    c.className='card small';
    c.innerHTML=`<div>${label}</div><div class='num'>${val}</div>`;
    w.appendChild(c);
  });

  const goal=user.goal||0;
  const rev=d.revenue||0;
  const pct=goal?Math.round((rev/goal)*100):0;
  $('#revenueVal').textContent=rev;
  $('#goalVal').textContent=goal||'-';
  const pb=$('#progressBar');
  pb.style.width=Math.min(pct,100)+'%';
  pb.style.background=pct>=100?'#28a745':(pct>=80?'#ff9800':'#e53935');
  $('#goalStatus').textContent=pct>=100?'✅ Splnené!':(pct>=80?'⚠️ Blízko cieľa':'❌ Potrebné zlepšiť');
}

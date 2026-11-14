// Logique de l'application Pop Quiz.
const D = window.QUIZ_DATA;


const root=document.getElementById("root");
const sel=new Set();Object.entries(D).forEach(([t,s])=>Object.keys(s).forEach(k=>sel.add(t+"|"+k)));
let N=10,T=15,G=null,timer=null;
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/œ/g,"oe").replace(/[^a-z0-9 ]/g," ").replace(/\b(le|la|les|l|un|une|the)\b/g," ").replace(/\s+/g," ").trim();
function lev(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
const good=(g,ans)=>{g=norm(g);if(!g)return false;return ans.some(a=>{a=norm(a);if(a===g)return true;const t=a.length>=9?2:a.length>=5?1:0;return t&&lev(a,g)<=t})};
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pool=()=>{const p=[];sel.forEach(k=>{const[t,s]=k.split("|");D[t][s].forEach((q,x)=>p.push({k:t+"|"+s+"|"+x,t,s,q:q[0],a:q[1].split("|")}))});return p};

function setup(){document.documentElement.classList.remove("play");
 clearInterval(timer);
 root.innerHTML=`<h1>Thèmes &amp; réglages</h1><p class="sub">Coche des thèmes entiers ou seulement certains sous-thèmes.</p>
 <div class="row"><button id="menu">← Menu</button><button data-all="1">Tout cocher</button><button data-all="0">Tout décocher</button></div>
 ${Object.entries(D).map(([t,s])=>`<div class="card"><label class="th"><input type="checkbox" data-t="${t}"> ${t}</label>
 <div class="subs">${Object.keys(s).map(k=>`<label class="chip"><input type="checkbox" data-t="${t}" data-s="${k}" ${sel.has(t+"|"+k)?"checked":""}> ${k} <small>(${s[k].length})</small></label>`).join("")}</div></div>`).join("")}
 <div class="card"><div class="sl"><span>Nombre de questions</span><b id="nv">${N}</b></div><input type="range" id="n" min="5" max="40" step="1" value="${N}"><div class="seg">${[5,10,20,30,40].map(v=>`<button data-np="${v}">${v}</button>`).join("")}</div>
 <div class="sl" style="margin-top:18px"><span>Temps par question</span><b id="tv">${T} s</b></div><div class="seg">${[10,15,20,30].map(v=>`<button data-tp="${v}">${v} s</button>`).join("")}</div></div>
 <div class="row"><button class="main" id="ok">Confirmer</button><span id="cnt" style="color:var(--mut)"></span></div>`;
 sync();
}
function sync(){paintSet();
 Object.keys(D).forEach(t=>{const subs=Object.keys(D[t]),c=subs.filter(s=>sel.has(t+"|"+s)).length,box=root.querySelector(`input[data-t="${t}"]:not([data-s])`);box.checked=c===subs.length;box.indeterminate=c>0&&c<subs.length});
 const p=pool().length;document.getElementById("cnt").textContent=p+" question"+(p>1?"s":"")+" disponibles";document.getElementById("ok").disabled=!p;
}
root.addEventListener("change",e=>{const i=e.target;if(i.dataset.t===undefined){if(i.id==="n")N=+i.value;if(i.id==="tt")T=+i.value;return}
 const t=i.dataset.t;(i.dataset.s?[i.dataset.s]:Object.keys(D[t])).forEach(s=>{i.checked?sel.add(t+"|"+s):sel.delete(t+"|"+s)});
 root.querySelectorAll(`input[data-t="${t}"][data-s]`).forEach(b=>b.checked=sel.has(t+"|"+b.dataset.s));sync()});
root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.all){Object.entries(D).forEach(([t,s])=>Object.keys(s).forEach(k=>b.dataset.all==="1"?sel.add(t+"|"+k):sel.delete(t+"|"+k)));setup()}
 if(b.id==="go")start();if(b.id==="skip")end();if(b.id==="again")start();if(b.id==="menu")menu();if(b.id==="themes")setup();if(b.id==="how")rules();if(b.dataset.v!==undefined){G.log[+b.parentNode.dataset.i].ok=b.dataset.v==="1";tally()}});

function start(){const p=shuf(pool());G={qs:p.slice(0,Math.min(+N,p.length)),i:0,log:[]};next()}
const intro=(n,t)=>`<div class="intro"><div class="intro-t">Question <b>${n}</b></div><div class="intro-s">sur ${t}</div></div>`;
function next(){if(G.i>=G.qs.length)return result();document.documentElement.classList.add("play");root.innerHTML=intro(G.i+1,G.qs.length);setTimeout(nextQ,2200)}
function nextQ(){
 if(G.i>=G.qs.length)return result();
 const q=G.qs[G.i];q.left=T;q.done=false;
 
 root.innerHTML=`<div class="top"><span class="tag">${q.t} · ${q.s}</span></div>
 <div class="timer" id="tm"><b>${T}</b></div><div class="frame"><div class="qbox">${q.q}</div></div>
 <div class="ql">Question ${G.i+1} / ${G.qs.length} :</div>
 <input type="text" id="in" aria-label="Ta réponse" autocomplete="off" autocapitalize="off" spellcheck="false">
 <div class="fb" id="fb"></div><div class="row" style="justify-content:center"><button class="main" id="val">Valider</button><button id="skip">Passer</button></div>`;
 document.documentElement.classList.add("play");const inp=document.getElementById("in");inp.focus();
 inp.addEventListener("keydown",e=>{if(e.key!=="Enter"||q.done)return;
  if(inp.value.trim())end()});
 const t0=Date.now();draw(q);
 clearInterval(timer);timer=setInterval(()=>{q.left=T-(Date.now()-t0)/1000;if(q.left<=0){q.left=0;end()}else draw(q)},100);
}
function draw(q){
 const tm=document.getElementById("tm");tm.style.setProperty("--p",(q.left/T*100)+"%");tm.firstChild.textContent=Math.ceil(q.left);
 
 
}
function end(){
 const q=G.qs[G.i];if(q.done)return;q.done=true;clearInterval(timer);
 const given=document.getElementById("in").value.trim();
 
 
 G.log.push({q:q.q,a:q.a[0],g:given,left:q.left,ok:!!given&&good(given,q.a)});
 G.i++;next();
}
function result(){document.documentElement.classList.remove("play");
 root.innerHTML=`<h1>Correction</h1><p class="sub">Le chef de partie valide chaque réponse : bonne ou fausse.</p><div class="big" id="sc"></div>
 <p class="sub" style="text-align:center" id="hits"></p>
 ${G.log.map((l,i)=>`<div class="card"><div style="font-weight:700;margin-bottom:6px">${i+1}. ${l.q}</div><div>Réponse donnée : <b>${l.g||"—"}</b></div><div>Bonne réponse : <b>${l.a}</b></div><div class="vd" data-i="${i}"><button class="y" data-v="1">✓ Bonne</button><button class="n" data-v="0">✗ Fausse</button></div></div>`).join("")}
 <div class="row" style="justify-content:center"><button class="main" id="again">Rejouer</button><button id="menu">Menu</button></div>`;tally();
}
function menu(){mpLeave();clearInterval(timer);document.documentElement.classList.remove("play");const p=pool().length;
 root.innerHTML=`<div style="text-align:center;min-height:80vh;display:flex;flex-direction:column;justify-content:center;align-items:center"><h1 style="font-size:3rem">Pop Quiz</h1><p class="sub">Culture générale chronométrée</p>
 <div class="menu"><button class="main" id="solo">Jouer en solo</button><button id="multi">Multijoueur</button></div>
 </div>`}
function rules(){root.innerHTML=`<h1>Comment jouer ?</h1><div class="card"><ul><li>Une question s’affiche, le minuteur tourne.</li><li>Tape ta réponse et valide avec Entrée : on passe directement à la question suivante.</li><li>À la fin, le chef de partie corrige chaque réponse (bonne ou fausse).</li><li>Plus tu réponds vite, plus une bonne réponse rapporte de points.</li><li>Tu peux passer une question avec « Passer ».</li></ul></div><div class="row"><button id="menu">← Menu</button></div>`}
function tally(){let s=0,h=0;G.log.forEach((l,i)=>{if(l.ok){h++;s+=100+Math.round(l.left*10)}document.querySelectorAll(`.vd[data-i="${i}"] button`).forEach(b=>b.classList.toggle("on",(b.dataset.v==="1")===!!l.ok))});
 document.getElementById("sc").textContent=s+" pts";document.getElementById("hits").textContent=h+" bonne"+(h>1?"s":"")+" réponse"+(h>1?"s":"")+" sur "+G.log.length}
root.addEventListener("input",e=>{if(e.target.id==="n"){N=+e.target.value;document.getElementById("nv").textContent=N}});
let DB = null;
let US = null;
let M = null;
let NAME = "";
const $=id=>document.getElementById(id);
const byKey=k=>{const[t,s,x]=k.split("|"),q=D[t][s][+x];return{k,t,s,q:q[0],a:q[1].split("|")}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ansN=i=>M.pl.filter(p=>M.an[p.id+"_"+i]).length;
const mpOk=(u,i,q,a)=>{const v=M.vd[u+"_"+i];return v!==undefined?v:!!(a&&a.g&&good(a.g,q.a))};
function mpLeave(){if(M){M.us.forEach(u=>u());clearInterval(timer);M=null}}
function mpMenu(msg){mpLeave();clearInterval(timer);document.documentElement.classList.remove("play");
 root.innerHTML=`<h1>Multijoueur</h1><p class="sub">Un chef de partie crée un salon, les autres le rejoignent avec le code.</p>
 <div class="card"><input type="text" id="nm" maxlength="16" placeholder="Ton pseudo" value="${esc(NAME)}"></div>
 <div class="card"><b>Créer une partie</b><p class="sub">Tu choisis les thèmes et les questions dans le salon (réglages de départ : les tiens).</p><button class="main" id="mkgame">Créer</button></div>
 <div class="card"><b>Rejoindre</b><div class="row"><input type="text" id="cd" maxlength="4" placeholder="CODE" style="width:130px;text-transform:uppercase"><button id="join">Rejoindre</button></div></div>
 <p class="fb ko">${msg||""}</p><div class="row"><button id="menu">← Menu</button></div>`}
const noMp="Multijoueur indisponible : ouvre la page connecté avec un accès Contributeur.";
async function mkGame(){
 if(!DB||!US)return mpMenu(noMp);
 NAME=$("nm").value.trim().slice(0,16);if(!NAME)return mpMenu("Choisis un pseudo.");
 
 const uid=await US.id(),code=Array.from({length:4},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random()*24)]).join("");
 try{await DB.doc("games/"+code).set({host:uid,phase:"lobby",i:0,T,n:+N,subs:[...sel],keys:[]});await DB.doc(`games/${code}/players/${uid}`).set({name:NAME})}
 catch(e){return mpMenu("Création impossible ("+(e.code||e.message)+") : il faut un accès Contributeur.")}
 mpOpen(code,uid,true)}
async function joinGame(){
 if(!DB||!US)return mpMenu(noMp);
 NAME=$("nm").value.trim().slice(0,16);const code=$("cd").value.trim().toUpperCase();
 if(!NAME||code.length!==4)return mpMenu("Il faut un pseudo et un code à 4 lettres.");
 try{const s=await DB.doc("games/"+code).get();if(!s.exists)return mpMenu("Aucune partie avec ce code.");if(s.data().phase!=="lobby")return mpMenu("Cette partie a déjà commencé.");
  const uid=await US.id();await DB.doc(`games/${code}/players/${uid}`).set({name:NAME});mpOpen(code,uid,s.data().host===uid)}
 catch(e){mpMenu("Connexion impossible ("+(e.code||e.message)+").")}}
function mpOpen(code,uid,host){
 M={code,uid,host,g:null,pl:[],an:{},vd:{},shown:-1,sent:-1,adv:-1,us:[]};
 const P="games/"+code,er=e=>{if(M){mpMenu("Connexion perdue ("+(e.code||e.message)+").")}};
 const col=(n,f)=>M.us.push(DB.collection(P+"/"+n).onSnapshot(s=>{if(M){f(s);mpView()}},er));
 M.us.push(DB.doc(P).onSnapshot(s=>{if(M){M.g=s.data()||null;mpView()}},er));
 col("players",s=>M.pl=s.docs.map(d=>({id:d.id,name:d.data().name})));
 col("answers",s=>{M.an={};s.docs.forEach(d=>M.an[d.id]=d.data())});
 col("verdicts",s=>{M.vd={};s.docs.forEach(d=>M.vd[d.id]=d.data().ok)});
 clearInterval(timer);timer=setInterval(mpTick,200);root.innerHTML="<p class='sub'>Connexion au salon…</p>"}
function mpView(){
 if(!M||!M.g)return;const g=M.g;
 if(g.phase==="play")M.lob=false;
 if(g.phase==="lobby"||(M.lob&&g.phase==="review")){M.shown=-1;M.sent=-1;M.adv=-1;document.documentElement.classList.remove("play");
  root.innerHTML=`<h1>Salon</h1><div class="card codebox"><div class="sub" style="margin:0 0 12px">Partage ce code pour inviter tes amis</div><div class="codes">${[...M.code].map(c=>`<span>${c}</span>`).join("")}</div><button id="cpy">Copier le code</button></div>
  <div class="card"><b>Joueurs (${M.pl.length})</b><div class="subs" style="margin-left:0">${M.pl.map(p=>`<span class="chip">${esc(p.name)}${p.id===g.host?" 👑":""}</span>`).join("")}</div></div>
  ${mpSettings(g)}
  <div class="row">${M.host?`<button class="main" id="mpgo" ${mpAv(g)?"":"disabled"}>Lancer la partie</button>`:`<span class="sub">En attente du chef de partie…</span>`}<button id="leave">Quitter</button></div>`}
 else if(g.phase==="play"){if(M.shown!==g.i)mpQ();else mpCount();if(M.host)mpCheck()}
 else mpReview()}
function mpQ(){
 const g=M.g,q=byKey(g.keys[g.i]);M.shown=g.i;M.rd=false;document.documentElement.classList.add("play");root.innerHTML=intro(g.i+1,g.keys.length);
 setTimeout(()=>{if(!M||!M.g||M.g.phase!=="play"||M.shown!==g.i)return;M.rd=true;M.t0=Date.now();mpDraw(g,q)},2200)}
function mpDraw(g,q){
 root.innerHTML=`<div class="top"><span class="tag">${q.t} · ${q.s}</span><span id="mpc"></span></div>
 <div class="timer" id="tm"><b>${g.T}</b></div><div class="frame"><div class="qbox">${q.q}</div></div>
 <div class="ql">Question ${g.i+1} / ${g.keys.length} :</div><input type="text" id="in" aria-label="Ta réponse" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="fb" id="fb"></div><div class="row" style="justify-content:center"><button class="main" id="val">Valider</button></div>`;
 $("in").focus();$("in").addEventListener("keydown",e=>{if(e.key==="Enter"&&$("in").value.trim())mpSend()});mpCount()}
function mpCount(){const c=$("mpc");if(c)c.textContent=ansN(M.g.i)+" / "+M.pl.length+" ont répondu"}
async function mpSend(){
 const g=M.g;if(!g||M.sent===g.i)return;M.sent=g.i;const inp=$("in"),val=inp?inp.value.trim():"",left=Math.max(0,g.T-(Date.now()-M.t0)/1000),code=M.code,uid=M.uid;
 if(inp){inp.disabled=true;if($("val"))$("val").disabled=true;$("fb").textContent="Réponse envoyée ✓ — en attente des autres…"}
 try{await DB.doc(`games/${code}/answers/${uid}_${g.i}`).set({u:uid,i:g.i,g:val,left})}catch(e){}}
function mpTick(){
 if(!M||!M.g||M.g.phase!=="play"||M.shown!==M.g.i||!M.rd)return;
 const T2=M.g.T,left=T2-(Date.now()-M.t0)/1000,tm=$("tm");
 if(tm){tm.style.setProperty("--p",Math.max(0,left/T2*100)+"%");tm.firstChild.textContent=Math.max(0,Math.ceil(left))}
 if(left<=0)mpSend();if(M.host)mpCheck()}
function mpCheck(){
 if(!M.rd)return;const g=M.g,left=g.T-(Date.now()-M.t0)/1000;
 if(M.adv===g.i||(ansN(g.i)<M.pl.length&&left>-1.5))return;
 M.adv=g.i;DB.doc("games/"+M.code).update(g.i+1>=g.keys.length?{phase:"review"}:{i:g.i+1}).catch(()=>{M.adv=-1})}
function mpScore(){const s={};M.pl.forEach(p=>s[p.id]=0);M.g.keys.forEach((k,i)=>{const q=byKey(k);M.pl.forEach(p=>{const a=M.an[p.id+"_"+i];if(mpOk(p.id,i,q,a))s[p.id]+=100+Math.round((a?a.left:0)*10)})});return s}
function mpReview(){
 document.documentElement.classList.remove("play");const g=M.g,s=mpScore(),rank=[...M.pl].sort((a,b)=>s[b.id]-s[a.id]);
 root.innerHTML=`<h1>${M.host?"Correction":"Résultats"}</h1><p class="sub">${M.host?"Tu es le chef de partie : valide chaque réponse (bonne ou fausse).":"Le chef de partie corrige les réponses, le classement se met à jour en direct."}</p>
 <div class="card">${rank.map((p,n)=>`<div class="row" style="justify-content:space-between;margin:4px 0"><span>${n+1}. ${esc(p.name)}</span><b>${s[p.id]} pts</b></div>`).join("")}</div>
 ${g.keys.map((k,i)=>{const q=byKey(k);return `<div class="card"><div style="font-weight:700">${i+1}. ${q.q}</div><div class="sub" style="margin:2px 0 8px">Bonne réponse : <b>${q.a[0]}</b></div>${M.pl.map(p=>{const a=M.an[p.id+"_"+i],ok=mpOk(p.id,i,q,a);return `<div style="margin:8px 0"><div>${esc(p.name)} : <b>${a&&a.g?esc(a.g):"—"}</b></div>${M.host?`<div class="vd"><button class="y${ok?" on":""}" data-pv="1" data-u="${p.id}" data-i="${i}">✓ Bonne</button><button class="n${ok?"":" on"}" data-pv="0" data-u="${p.id}" data-i="${i}">✗ Fausse</button></div>`:`<span class="${ok?"ok":"ko"}">${ok?"✓ Bonne":"✗ Fausse"}</span>`}</div>`}).join("")}</div>`}).join("")}
 <div class="row" style="justify-content:center"><button class="main" id="back">Revenir au salon</button></div>`}
root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.id==="multi")mpMenu();if(b.id==="mkgame")mkGame();if(b.id==="join")joinGame();
 if(b.id==="mpgo")mpGo();
 if(b.id==="leave")menu();
 if(b.dataset.pv!==undefined)DB.doc(`games/${M.code}/verdicts/${b.dataset.u}_${b.dataset.i}`).set({ok:b.dataset.pv==="1"}).catch(()=>{})});
function paintSet(){const nv=$("nv");if(!nv)return;nv.textContent=N;$("n").value=N;$("tv").textContent=T+" s";
 document.querySelectorAll("[data-np]").forEach(b=>b.classList.toggle("on",+b.dataset.np===+N));
 document.querySelectorAll("[data-tp]").forEach(b=>b.classList.toggle("on",+b.dataset.tp===T))}
root.addEventListener("input",e=>{if(e.target.id==="n")paintSet()});
root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.np){N=+b.dataset.np;paintSet()}
 if(b.dataset.tp){T=+b.dataset.tp;paintSet()}
 if(b.id==="ok")menu()});
root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.id==="val"){const i=$("in");if(i&&i.value.trim()){if(M)mpSend();else end()}}
 if(b.id==="cpy"&&M){try{navigator.clipboard.writeText(M.code).then(()=>{b.textContent="Copié ✓"}).catch(()=>{})}catch(x){}}});
const mpAv=g=>[...(g.subs||[])].reduce((a,k)=>{const[t,s]=k.split("|");return a+(D[t]&&D[t][s]?D[t][s].length:0)},0);
function mpSettings(g){
 const sb=new Set(g.subs||[]),av=mpAv(g),h=M.host;
 const th=Object.entries(D).map(([t,ss])=>h?`<div style="margin-top:12px"><b>${t}</b> <button class="pill" data-mt="${t}">tout</button><div class="seg">${Object.keys(ss).map(k=>`<button class="pill${sb.has(t+"|"+k)?" on":""}" data-ms="${t}|${k}">${k}</button>`).join("")}</div></div>`:(()=>{const on=Object.keys(ss).filter(k=>sb.has(t+"|"+k));return on.length?`<div style="margin-top:8px"><b>${t}</b> · ${on.join(", ")}</div>`:""})()).join("");
 return `<div class="card"><b>Thèmes choisis</b>${th||'<p class="sub">Aucun thème choisi.</p>'}</div>
 <div class="card"><div class="sl"><span>Questions par partie</span><b>${Math.min(g.n||10,av)}</b></div>${h?`<div class="seg">${[5,10,20,30,40].map(v=>`<button class="${v===g.n?"on":""}" data-mn="${v}">${v}</button>`).join("")}</div>`:""}
 <div class="sl" style="margin-top:16px"><span>Temps par question</span><b>${g.T} s</b></div>${h?`<div class="seg">${[10,15,20,30].map(v=>`<button class="${v===g.T?"on":""}" data-mtp="${v}">${v} s</button>`).join("")}</div>`:""}
 <p class="sub" style="margin:10px 0 0">${av} questions disponibles</p></div>`}
async function mpGo(){
 const g=M.g,P="games/"+M.code,p=[];(g.subs||[]).forEach(k=>{const[t,s]=k.split("|");(D[t]&&D[t][s]||[]).forEach((q,x)=>p.push(t+"|"+s+"|"+x))});
 if(!p.length)return;
 try{await Promise.all([...Object.keys(M.an).map(k=>DB.doc(P+"/answers/"+k).delete()),...Object.keys(M.vd).map(k=>DB.doc(P+"/verdicts/"+k).delete())]);
  await DB.doc(P).update({phase:"play",i:0,keys:shuf(p).slice(0,Math.min(g.n||10,p.length))})}catch(e){}}
root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||!M||!M.g)return;
 if(b.id==="back"){if(M.host)DB.doc("games/"+M.code).update({phase:"lobby",i:0}).catch(()=>{});else{M.lob=true;mpView()}}
 if(M.host&&M.g.phase==="lobby"){const set=o=>DB.doc("games/"+M.code).update(o).catch(()=>{}),d=b.dataset;
  if(d.ms){const s=new Set(M.g.subs||[]);s.has(d.ms)?s.delete(d.ms):s.add(d.ms);set({subs:[...s]})}
  if(d.mt){const ks=Object.keys(D[d.mt]).map(k=>d.mt+"|"+k),s=new Set(M.g.subs||[]),all=ks.every(k=>s.has(k));ks.forEach(k=>all?s.delete(k):s.add(k));set({subs:[...s]})}
  if(d.mn)set({n:+d.mn});if(d.mtp)set({T:+d.mtp})}});
function soloMenu(){
 document.documentElement.classList.remove("play");clearInterval(timer);const av=pool().length;
 root.innerHTML=`<h1>Solo</h1><p class="sub">Choisis tes thèmes, le nombre de questions et le temps.</p>
 <div class="card"><b>Thèmes choisis</b>${Object.entries(D).map(([t,ss])=>`<div style="margin-top:12px"><b>${t}</b> <button class="pill" data-st="${t}">tout</button><div class="seg">${Object.keys(ss).map(k=>`<button class="pill${sel.has(t+"|"+k)?" on":""}" data-ss="${t}|${k}">${k}</button>`).join("")}</div></div>`).join("")}</div>
 <div class="card"><div class="sl"><span>Questions par partie</span><b>${Math.min(N,av)}</b></div><div class="seg">${[5,10,20,30,40].map(v=>`<button class="${v===+N?"on":""}" data-sn="${v}">${v}</button>`).join("")}</div>
 <div class="sl" style="margin-top:16px"><span>Temps par question</span><b>${T} s</b></div><div class="seg">${[10,15,20,30].map(v=>`<button class="${v===T?"on":""}" data-stp="${v}">${v} s</button>`).join("")}</div>
 <p class="sub" style="margin:10px 0 0">${av} questions disponibles</p></div>
 <div class="row"><button class="main" id="go" ${av?"":"disabled"}>Lancer la partie</button><button id="menu">← Menu</button></div>`}
root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset;
 if(b.id==="solo")soloMenu();
 if(d.ss){sel.has(d.ss)?sel.delete(d.ss):sel.add(d.ss);soloMenu()}
 if(d.st){const ks=Object.keys(D[d.st]).map(k=>d.st+"|"+k),all=ks.every(k=>sel.has(k));ks.forEach(k=>all?sel.delete(k):sel.add(k));soloMenu()}
 if(d.sn){N=+d.sn;soloMenu()}if(d.stp){T=+d.stp;soloMenu()}});
menu();

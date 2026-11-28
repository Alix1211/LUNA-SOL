'use strict';
/* ===== LUNA SOL · EP001~EP006 안내 구간 ===== */
let S=null;
const UI={cur:'title',prev:'story',block:0,menu:false,parked:null,running:false};
let LB,LW,LR,LC;
const SCR=['title','story','work','result','room','care','life','market'];

function newState(){return{v:1,pos:{e:0,s:0,ph:'pre',li:0},done:{},board:Array(36).fill(null),toolboxSlot:0,store:Array(8).fill(null),size:4,pool:POOL1,
 deliv:{},fdeliv:{},ustack:[],hub:false,care:false,ui:{small:false},tips:{},gave:{},scr:0,room:{place:{bed:'s1',lamp:'s2'}},crafted:{},hearts:0,snd:true,hatched:false,life:null}}
function persist(){if(S)writeSave(S)}
addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist()});

/* ---------- 화면 맞춤 ---------- */
function fit(){const vw=innerWidth,vh=innerHeight;W=Math.max(1152,Math.min(1680,Math.round(720*vw/vh)));SC=Math.min(vw/W,vh/720);
 stage.style.setProperty('--W',W+'px');stage.style.width=W+'px';stage.style.transform=`translate(-50%,-50%) scale(${SC})`;fx.resize();Loc.all.forEach(l=>l.render())}
const fullscreenBtn=$('#fullscreenBtn');
function syncFullscreen(){
 const active=!!document.fullscreenElement;
 const supported=document.fullscreenEnabled&&typeof document.documentElement.requestFullscreen==='function';
 fullscreenBtn.disabled=!active&&!supported;
 const label=active?'전체화면 종료':supported?'전체화면':'전체화면을 지원하지 않는 브라우저입니다';
 fullscreenBtn.title=label;
 fullscreenBtn.setAttribute('aria-label',label);
 fullscreenBtn.setAttribute('aria-pressed',String(active));
 fullscreenBtn.textContent=active?'⊡':'⛶';
}
fullscreenBtn.onclick=async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
 }catch{
  toast('이 화면에서는 전체화면을 열 수 없어요.');
 }
};
document.addEventListener('fullscreenchange',()=>{syncFullscreen();fit()});
syncFullscreen();
function go(n){UI.cur=n;SCR.forEach(s=>$('#'+s).classList.toggle('on',s===n));$('#bgwrap').style.display=(n==='title'||n==='story'||n==='result'||n==='life')?'block':'none';refreshMenuBtn()}
function refreshMenuBtn(){const b=$('#menuBtn');b.style.display=(S&&S.hub&&(['story','work','life'].includes(UI.cur))&&!UI.menu)?'flex':'none'}
async function fade(on){const f=$('#fade'),had=f.classList.contains('on');f.classList.toggle('on',on);if(had!==on)await sleep(470)}
function toast(t,ms=1900){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),ms)}
function flashFx(){const f=$('#flash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go')}
function shake(){const b=$('#bgwrap');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake')}
function tapOnce(sel){return new Promise(r=>{const n=$(sel),f=()=>{n.removeEventListener('pointerdown',f);r()};n.addEventListener('pointerdown',f)})}

/* ---------- 안내 카드(스포트라이트) ---------- */
let blk=null;
function tipOne(o){return new Promise(r=>{
 if(!blk){blk=el('div');blk.style.cssText='position:absolute;inset:0;z-index:57';stage.appendChild(blk)}
 blk.style.display='block';
 const hl=$('#hl'),card=$('#tipcard');$('#tipt').textContent=o.title;$('#tipx').textContent=o.text;
 card.style.display='block';card.style.left='-999px';
 const tg=typeof o.sel==='string'?$(o.sel):o.sel;const ch=card.offsetHeight,cw=480;let cx,cy;
 if(tg){const rc=rectIn(tg),p=10;hl.style.display='block';hl.style.left=rc.x-p+'px';hl.style.top=rc.y-p+'px';hl.style.width=rc.w+p*2+'px';hl.style.height=rc.h+p*2+'px';
  if(rc.y+rc.h>650&&rc.w>300){cx=rc.x-cw-30;cy=rc.y-ch-20}
  else if(rc.x+rc.w/2>W/2){cx=rc.x-cw-30;cy=rc.y}else{cx=rc.x+rc.w+30;cy=rc.y}
  if(rc.y+rc.h>650&&rc.w<=300){cx=rc.x+rc.w+30;cy=rc.y-ch}
  cx=Math.max(20,Math.min(W-cw-20,cx));cy=Math.max(20,Math.min(700-ch,cy))}
 else{hl.style.display='none';cx=(W-cw)/2;cy=(720-ch)/2}
 card.style.left=cx+'px';card.style.top=cy+'px';
 $('#tipok').onclick=()=>{hl.style.display='none';card.style.display='none';blk.style.display='none';Snd.sfx('tap');r()}})}
async function tipSeq(a){UI.block++;for(const s of a)await tipOne(s);UI.block--}

/* ---------- 챕터 카드 ---------- */
async function chapter(ep){const c=$('#chapter');c.querySelector('.ep').textContent='EP '+String(ep.ep).padStart(2,'0');c.querySelector('.tt').textContent=ep.title;
 await fade(true);c.style.display='block';void c.offsetWidth;c.classList.add('on');await fade(false);
 await Promise.race([sleep(2600),tapOnce('#chapter')]);
 c.classList.remove('on');await sleep(750);c.style.display=''}

/* ================= 이야기 ================= */
const onStage={};let typing=null,waitRes=null,skipLines=false;
function setScene(sc,anim){const v=vis(sc.id,S.done,S.hatched,'story');LB.set(v.bg,v.props,anim)}
function clearPorts(){$('#portraits').innerHTML='';for(const k in onStage)delete onStage[k]}
function showPort(sp,mood){Object.values(onStage).forEach(o=>o.el.classList.remove('talk'));const src=portraitFor(sp,mood);if(!src)return;
 let o=onStage[sp];
 if(!o){const side=sp==='아일라'?'left':'right';const second=side==='right'&&Object.values(onStage).some(x=>x.side==='right');
  const e=el('img','pt '+side+(second?' r2':''));e.draggable=false;$('#portraits').appendChild(e);o=onStage[sp]={el:e,side};void e.offsetWidth}
 if(offscreen(mood)){o.el.classList.remove('on');return}
 if(o.el.getAttribute('src')!==src)o.el.src=src;o.el.classList.add('on','talk')}
function typer(node,text){node.textContent='';const ch=[...text];let i=0,fin=false,r;const p=new Promise(a=>r=a);
 const step=()=>{if(fin)return;if(i>=ch.length){fin=true;r();return}const c=ch[i++];node.textContent+=c;setTimeout(step,c==='\n'?160:'…'.includes(c)?95:'.,?!'.includes(c)?120:25)};step();
 return{p,finish(){if(!fin){fin=true;node.textContent=text;r()}}}}
function storyTap(){if(UI.block)return;if(typing){typing.finish();return}if(waitRes){const r=waitRes;waitRes=null;Snd.sfx('page');r()}}
const waitTap=()=>skipLines?Promise.resolve():new Promise(r=>waitRes=r);
async function showLine(L){const d=$('#dlg'),tx=d.querySelector('.tx'),nx=d.querySelector('.nx'),doc=$('#doc');
 if(L.k==='doc'){d.style.display='none';doc.querySelector('.lb').textContent=L.who;doc.querySelector('.dx').textContent=L.text;doc.classList.remove('on');void doc.offsetWidth;doc.classList.add('on');
  showPort('',''); await waitTap();doc.classList.remove('on');d.style.display='';return}
 d.style.display='';const nm=d.querySelector('.nm');
 d.classList.toggle('nar',L.k==='nar');d.classList.toggle('sfx',L.k==='say'&&L.mood==='효과음');
 if(L.k==='say'){nm.innerHTML=L.sp+(L.mood&&L.mood!=='기본'?`<small>${L.mood}</small>`:'');showPort(L.sp,L.mood);if(L.sp==='니베')Snd.sfx('chirp')}
 else{Object.values(onStage).forEach(o=>o.el.classList.remove('talk'))}
 nx.style.visibility='hidden';typing=typer(tx,L.text);await typing.p;typing=null;nx.style.visibility='visible';await waitTap()}
const HOOKS={EP006_SC02:{8:'crack',13:'hatch'}};
async function hook(sc,i){const h=(HOOKS[sc.id]||{})[i];if(h==='crack'){Snd.sfx('crack');vib(60);shake()}
 if(h==='hatch'){S.hatched=true;flashFx();Snd.sfx('hatch');vib([120,60,200]);setScene(sc,true);fx.burst(W*.52,520,26)}}
async function playLines(lines,start,sc){
 skipLines=false;
 $('#skipDialogue').hidden=!(S.life&&lines.length>start);
 for(let i=start;i<lines.length&&!skipLines;i++){S.pos.li=i;persist();await hook(sc,i);await showLine(lines[i])}
 $('#skipDialogue').hidden=true;
 $('#dlg').style.display='none';$('#doc').classList.remove('on');
}
$('#skipDialogue').onclick=()=>{
 if(UI.block)return;
 skipLines=true;
 if(typing)typing.finish();
 if(waitRes){const resume=waitRes;waitRes=null;resume()}
};
$('#story').addEventListener('pointerdown',e=>{if(e.target.closest('#skipDialogue'))return;storyTap()});

/* ================= 작업(머지) ================= */
const WK={mid:null,order:null,free:false,cards:[],sel:null,drag:null,busy:false,resolve:null,fu:[],sc:null,dropArm:0};
function initWork(){
 $('#lp').innerHTML=`<div class="hd"><b id="wT"></b><i id="wI"></i></div><div id="win"><div class="vig"></div></div><div id="goals"></div>
 <div id="hintbox"><div class="av">✦</div><div class="hc"><div class="ht" id="wH"></div><div class="chains" id="wC"></div></div></div>
 <div id="workMaterials" aria-label="공구함 재료 선택" hidden></div>
 <div id="workEnergy" hidden><span id="energyValue"></span><button id="recoverEnergy" class="btn sm ghost" hidden>공구함 정리</button></div>
 <div id="acts"><button class="btn full" id="aGo">납품하기</button><button class="btn sm" id="aStore">보관</button><button class="btn sm" id="aUndo">되돌리기</button><button class="btn sm" id="aDrop">버리기</button></div>
 <button class="btn sm ghost" id="wBack">돌아가기</button>`;
 LW=new Loc($('#win'));
 const b=$('#board');for(let i=0;i<36;i++){const c=el('div','cell');c.dataset.i=i;b.appendChild(c)}
 const s=$('#store');s.innerHTML='<span class="lbl">보관함</span>';for(let j=0;j<8;j++){const c=el('div','sl');c.dataset.j=j;s.appendChild(c)}
 $('#aGo').onclick=()=>btnGo();$('#aStore').onclick=()=>btnStore();$('#aUndo').onclick=()=>btnUndo();$('#aDrop').onclick=()=>btnDrop();$('#wBack').onclick=()=>WK.order!=null?closeOrder():closeFree();
 $('#recoverEnergy').onclick=recoverEnergy;
 /* 포인터: 탭 + 끌기 */
 document.addEventListener('pointerdown',e=>{
  if(UI.cur!=='work'||UI.block||WK.busy||WK.drag||e.button!==0)return;
  const t=e.target.closest('.cell:not(.lock),.sl,.goal');
  if(!t||!$('#work').contains(t))return;
  Snd.init();
  WK.drag={t,x:e.clientX,y:e.clientY,pointer:e.pointerId,on:false,toolbox:t.classList.contains('gen')};
 });
 document.addEventListener('pointermove',e=>{
  const d=WK.drag;
  if(!d||d.pointer!==e.pointerId)return;
  const g=$('#ghost');
  if(!d.on){
   if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<14*SC)return;
   const loc=locOf(d.t);
   const item=loc&&getAt(loc.w,loc.i);
   if(!d.toolbox&&!item)return;
   d.on=true;
   if(loc)select(loc.w,loc.i);
   g.src=d.toolbox?asset('item/box.webp'):img(item);
   g.style.display='block';
   d.t.classList.add('dragging');
  }
  const p=toStage(e.clientX,e.clientY);
  g.style.left=p.x+'px';
  g.style.top=p.y+'px';
  $$('.drop').forEach(x=>x.classList.remove('drop'));
  const target=dropTarget(e,d);
  if(target)target.classList.add('drop');
 });
 const up=e=>{
  const d=WK.drag;
  if(!d||d.pointer!==e.pointerId)return;
  WK.drag=null;
  $('#ghost').style.display='none';
  $$('.drop,.dragging').forEach(x=>x.classList.remove('drop','dragging'));
  if(e.type==='pointercancel'||UI.cur!=='work'||UI.block||WK.busy)return;
  if(d.on){
   const target=dropTarget(e,d);
   if(!target)return;
   if(d.toolbox)moveToolbox(+target.dataset.i);
   else actOn(target);
  }else if(!d.toolbox||Math.hypot(e.clientX-d.x,e.clientY-d.y)<14*SC){
   actOn(d.t);
  }
 };
 document.addEventListener('pointerup',up);
 document.addEventListener('pointercancel',up);
}
function dropTarget(e,d){
 const hit=document.elementFromPoint(e.clientX,e.clientY);
 const target=hit?.closest(d.toolbox?'.cell:not(.lock)':'.cell:not(.lock):not(.gen),.sl,.goal');
 return target&&target!==d.t&&$('#work').contains(target)?target:null;
}
function locOf(t){
 if(t.classList.contains('cell')){
  const i=+t.dataset.i;
  return i===S.toolboxSlot?null:{w:'b',i};
 }
 if(t.classList.contains('sl'))return{w:'s',i:+t.dataset.j};
 return null;
}
function actOn(t){if(t.classList.contains('cell'))tapBoard(+t.dataset.i);else if(t.classList.contains('sl'))tapStore(+t.dataset.j);else if(t.classList.contains('goal'))tapGoal(t.dataset.k)}
const getAt=(w,i)=>w==='b'?S.board[i]:S.store[i];
const setAt=(w,i,v)=>{if(w==='b')S.board[i]=v;else S.store[i]=v};
const unlocked=i=>{const r=Math.floor(i/6),c=i%6;return r<S.size&&c<S.size};
const storeCap=()=>S.ui.small?8:0;
function emptyBoard(){
 const free=[];
 const {toolboxSlot:slot}=S;
 const distance=i=>Math.abs(Math.floor(i/6)-Math.floor(slot/6))+Math.abs(i%6-slot%6);
 for(let i=0;i<S.board.length;i++)if(i!==slot&&unlocked(i)&&!S.board[i])free.push(i);
 return free.sort((a,b)=>distance(a)-distance(b)||a-b);
}
function moveToolbox(to){
 const from=S.toolboxSlot;
 if(to===from||!unlocked(to))return;
 S.board[from]=S.board[to];
 S.board[to]=null;
 S.toolboxSlot=to;
 WK.sel=null;
 btnDrop.arm=0;
 Snd.sfx('tap');
 after(to,'home');
}
function emptyStore(){const a=[];for(let j=0;j<storeCap();j++)if(!S.store[j])a.push(j);return a}
function select(w,i){btnDrop.arm=0;WK.sel={w,i};Snd.sfx('sel');vib(0);after()}
function deselect(){WK.sel=null;after()}
const canMerge=(a,b)=>a&&b&&a===b&&ITEMS[a].next;
const cellEl=i=>$(`#board .cell[data-i="${i}"]`);
function cellFx(i,c){const e=cellEl(i);if(!e)return;e.classList.remove(c);void e.offsetWidth;e.classList.add(c);setTimeout(()=>e.classList.remove(c),600)}
function spark(e,n=12,k){if(!e)return;const c=centerOf(e);fx.burst(c.x,c.y,n,k)}

function pickRaw(){const M=S.pool;
 if(S.life&&M.includes(S.life.material))return S.life.material;
 if(WK.mid==='M001'&&S.scr<6){return ['iron','iron','iron','iron','wood','wood'][S.scr++]}
 const need={};
 const cards=WK.cards;for(const c of cards){if(c.done)continue;const left=c.need-c.have;if(left>0&&!ITEMS[c.item].solo){const r=ITEMS[c.item].raw;need[r]=(need[r]||0)+left*rawCost(c.item)}}
 const held={};[...S.board,...S.store].forEach(id=>{if(id&&!ITEMS[id].solo){const r=ITEMS[id].raw;held[r]=(held[r]||0)+rawCost(id)}});
 const w=M.map(r=>{const d=Math.max(0,(need[r]||0)-(held[r]||0));return[r,1+(d>0?Math.min(d,8)*2:0)]});
 const tot=w.reduce((a,x)=>a+x[1],0);let t=Math.random()*tot;for(const [r,v] of w){if((t-=v)<=0)return r}return M[0]}
function spawn(){const e=emptyBoard();if(!e.length){toast('빈 자리가 없어요. 합치거나 보관해 보세요');Snd.sfx('err');vib(60);return}
 if(S.life&&S.life.energy===0){toast('공구함을 정리하거나 니베를 돌봐 주세요');Snd.sfx('err');return}
 const i=e[0];S.board[i]=pickRaw();
 if(S.life){S.life.energy--;S.life.careSpent++}Snd.sfx('spawn');vib(60);cellFx(S.toolboxSlot,'home');after(i,'spawn');spark(cellEl(S.toolboxSlot),6)}
function tapBoard(i){if(!unlocked(i))return;if(i===S.toolboxSlot){spawn();return}const it=S.board[i],s=WK.sel;
 if(!s){if(it)select('b',i);return}
 if(s.w==='b'&&s.i===i){deselect();return}
 const sit=getAt(s.w,s.i);
 if(!it){setAt(s.w,s.i,null);S.board[i]=sit;WK.sel=null;Snd.sfx('tap');after(i,'home');return}
 if(canMerge(sit,it)){doMerge(s,{w:'b',i});return}
 if(sit===it){select('b',i);return}
 setAt(s.w,s.i,it);S.board[i]=sit;WK.sel=null;Snd.sfx('tap');after(i,'home')}
function tapStore(j){if(j>=storeCap())return;const it=S.store[j],s=WK.sel;
 if(!s){if(it)select('s',j);return}
 if(s.w==='s'&&s.i===j){deselect();return}
 const sit=getAt(s.w,s.i);
 if(!it){setAt(s.w,s.i,null);S.store[j]=sit;WK.sel=null;Snd.sfx('store');after();return}
 if(canMerge(sit,it)){doMerge(s,{w:'s',i:j});return}
 if(sit===it){select('s',j);return}
 setAt(s.w,s.i,it);S.store[j]=sit;WK.sel=null;Snd.sfx('store');after()}
function doMerge(src,dst){const id=getAt(dst.w,dst.i),nx=ITEMS[id].next;setAt(src.w,src.i,null);setAt(dst.w,dst.i,nx);WK.sel=null;
 Snd.sfx('merge',ITEMS[nx].tier-2);vib(120);after(dst.w==='b'?dst.i:-1,'pop');
 const e=dst.w==='b'?cellEl(dst.i):$(`#store .sl[data-j="${dst.i}"]`);spark(e,16)}
function tapGoal(k){const s=WK.sel;if(!s)return;const it=getAt(s.w,s.i),c=WK.cards.find(x=>x.key===k);
 if(!c||c.done||c.have>=c.need||c.item!==it){toast('이 목록에는 필요하지 않아요');Snd.sfx('err');vib(60);return}deliverTo(c,s)}
function deliverTo(c,loc){const id=getAt(loc.w,loc.i);setAt(loc.w,loc.i,null);WK.sel=null;
 if(WK.order!=null)submitOrderItem(id,c.key);
 else if(WK.free){S.fdeliv[c.key]=(S.fdeliv[c.key]||0)+1;WK.fu.push({key:c.key,item:id})}else{S.deliv[c.key]=(S.deliv[c.key]||0)+1;S.ustack.push({key:c.key,item:id})}
 Snd.sfx('deliver');vib(120);const ge=$(`.goal[data-k="${c.key}"]`);if(ge)spark(ge,14);buildCards();
 if(WK.free&&WK.order==null){const cc=WK.cards.find(x=>x.key===c.key);if(cc.have>=cc.need&&!S.crafted[c.key]){S.crafted[c.key]=1;S.fdeliv[c.key]=0;WK.fu=WK.fu.filter(x=>x.key!==c.key);buildCards();Snd.sfx('done');vib([160,60,160]);fx.rain(26);toast(FREE.find(f=>f.key===c.key).name+'을(를) 만들었어요! 방 꾸미기에서 놓을 수 있어요',3200)}}
 const gg=$(`.goal[data-k="${c.key}"]`);if(gg){gg.classList.add('bump');setTimeout(()=>gg.classList.remove('bump'),500)}
 after()}
function btnGo(){if(WK.busy)return;if(WK.order!=null&&WK.cards.every(c=>c.have>=c.need)){settleOrder();return}
 if(!WK.free&&WK.cards.every(c=>c.have>=c.need)){completeMission();return}
 const s=WK.sel;if(!s)return;const it=getAt(s.w,s.i),c=WK.cards.find(x=>!x.done&&x.item===it&&x.have<x.need);if(c)deliverTo(c,s)}
function btnStore(){const s=WK.sel;if(!s)return;
 if(s.w==='b'){const e=emptyStore();if(!e.length)return;S.store[e[0]]=S.board[s.i];S.board[s.i]=null;WK.sel=null;Snd.sfx('store');after()}
 else{const e=emptyBoard();if(!e.length)return;S.board[e[0]]=S.store[s.i];S.store[s.i]=null;WK.sel=null;Snd.sfx('store');after(e[0],'home')}}
function btnUndo(){const st=undoStack();if(!st.length)return;const u=st[st.length-1];let e=emptyBoard();let place;
 if(e.length)place={w:'b',i:e[0]};else{const es=emptyStore();if(!es.length)return;place={w:'s',i:es[0]}}
 st.pop();setAt(place.w,place.i,u.item);if(WK.order!=null)S.life.submitted[WK.order][u.key]--;else if(WK.free)S.fdeliv[u.key]=Math.max(0,(S.fdeliv[u.key]||0)-1);else S.deliv[u.key]=Math.max(0,(S.deliv[u.key]||0)-1);
 Snd.sfx('undo');buildCards();after(place.w==='b'?place.i:-1,'spawn')}
function btnDrop(){const s=WK.sel;if(!s)return;const it=getAt(s.w,s.i);if(isNeeded(it))return;
 const b=$('#aDrop');if(!btnDrop.arm){btnDrop.arm=1;b.textContent='정말 버릴까요?';setTimeout(()=>{btnDrop.arm=0;updBtns()},2200);return}
 btnDrop.arm=0;setAt(s.w,s.i,null);WK.sel=null;Snd.sfx('err');after()}
const isNeeded=id=>WK.cards.some(c=>!c.done&&c.item===id&&c.have<c.need);

/* ---- 렌더 ---- */
function buildCards(){
 if(WK.order!=null)WK.cards=orderCards();
 else if(WK.free)WK.cards=FREE.map(f=>({key:f.key,item:f.item,img:f.img,name:f.name,sub:'널빤지 ×'+f.need,need:f.need,have:S.crafted[f.key]?f.need:(S.fdeliv[f.key]||0),done:!!S.crafted[f.key]}));
 else WK.cards=Object.entries(MISS[WK.mid].g).map(([id,n])=>({key:id,item:id,img:img(id),name:ITEMS[id].n,need:n,have:S.deliv[id]||0}));
 $('#goals').innerHTML=WK.cards.map(c=>`<div class="goal ${c.have>=c.need?'full':''}" data-k="${c.key}"><img src="${c.img}" draggable="false"><div class="gn">${c.name}${c.sub?`<small>${c.sub}</small>`:''}</div><div class="gc">${c.done?'완성':c.have+'/'+c.need}</div></div>`).join('');
 const seen=new Set(),rows=[];for(const c of WK.cards){if(ITEMS[c.item].solo)continue;const ch=CHAINS.find(x=>x.includes(c.item));if(!ch||seen.has(ch))continue;seen.add(ch);
  const mx=Math.max(...WK.cards.filter(k=>ch.includes(k.item)).map(k=>ch.indexOf(k.item)));rows.push(ch.slice(0,mx+1))}
 $('#wC').innerHTML=rows.map(r=>`<span class="ch">${r.map(id=>`<img src="${img(id)}">`).join('<i>›</i>')}</span>`).join('')+(rows.length?'<span class="cap">같은 것 2개 → 다음 단계</span>':'')}
function renderBoard(){$$('#board .cell').forEach((c,i)=>{const lock=!unlocked(i),was=c.classList.contains('lock');
  if(was&&!lock&&c.dataset.k!==undefined&&c.dataset.init){c.classList.add('opened');setTimeout(()=>c.classList.remove('opened'),900)}
  const generator=!lock&&i===S.toolboxSlot;
  c.dataset.init=1;c.classList.toggle('lock',lock);c.classList.toggle('gen',generator);
  c.classList.toggle('depleted',generator&&S.life?.energy===0);
  if(generator)c.title='공구함 · 눌러서 재료 꺼내기 · 끌어서 옮기기';
  else c.removeAttribute('title');
  const it=lock?'':generator?'__gen':(S.board[i]||'');
  if(c.dataset.k!==it){c.dataset.k=it;c.innerHTML=it===''?'':it==='__gen'?`<img class="it" src="${asset('item/box.webp')}" draggable="false">`:`<img class="it" src="${img(it)}" draggable="false">${pips(it)}`}
  const s=WK.sel,isSel=s&&s.w==='b'&&s.i===i;c.classList.toggle('sel',!!isSel);
  const sit=s&&getAt(s.w,s.i);c.classList.toggle('mate',!!(s&&!isSel&&it&&it!=='__gen'&&canMerge(sit,it)))})}
const pips=id=>ITEMS[id].solo?'':`<div class="pips">${'<s></s>'.repeat(ITEMS[id].tier)}</div>`;
function renderStore(){$('#store').style.display=S.ui.small?'flex':'none';$$('#store .sl').forEach((c,j)=>{const it=S.store[j]||'';if(c.dataset.k!==it){c.dataset.k=it;c.innerHTML=it?`<img src="${img(it)}" draggable="false">`:''}
  const s=WK.sel,isSel=s&&s.w==='s'&&s.i===j;c.classList.toggle('sel',!!isSel)})}
function updBtns(){const s=WK.sel,it=s&&getAt(s.w,s.i),go=$('#aGo'),all=(!WK.free||WK.order!=null)&&WK.cards.length&&WK.cards.every(c=>c.have>=c.need);
 if(all){go.textContent=WK.order!=null?'정산하기':'완료하기';go.disabled=false;go.classList.add('pulse')}
 else{go.textContent='납품하기';go.classList.remove('pulse');go.disabled=!(it&&WK.cards.some(c=>!c.done&&c.item===it&&c.have<c.need))}
 const sm=S.ui.small;['aStore','aUndo','aDrop'].forEach(id=>$('#'+id).style.display=sm?'':'none');
 const st=$('#aStore');if(s&&s.w==='s'){st.textContent='꺼내기';st.disabled=!emptyBoard().length}else{st.textContent='보관';st.disabled=!(s&&emptyStore().length)}
 const us=undoStack();$('#aUndo').disabled=!(us.length&&(emptyBoard().length||emptyStore().length));
 const dr=$('#aDrop');if(!btnDrop.arm){dr.textContent='버리기'}dr.disabled=!(it&&!isNeeded(it));
 $('#wBack').style.display=WK.free?'block':'none'}
function after(fxIdx,cls){renderBoard();renderStore();$$('.goal').forEach(g=>{const c=WK.cards.find(x=>x.key===g.dataset.k);g.classList.toggle('sel',!!(WK.sel&&c&&getAt(WK.sel.w,WK.sel.i)===c.item&&c.have<c.need&&!c.done))});updBtns();coachEval();updateWorkEnergy();persist();
 if(fxIdx>=0&&cls)cellFx(fxIdx,cls)}

/* ---- 코치 ---- */
function hideCoach(){$('#coach').classList.remove('on');$$('.cell.coach,.cell.ring').forEach(c=>c.classList.remove('coach','ring'))}
function showCoach(target,text){const c=$('#coach');c.textContent=text;c.classList.add('on');const h=c.offsetHeight,w=Math.min(330,c.offsetWidth||300);
 if(target.classList.contains('cell')){const b=rectIn($('#board'));const x=b.x+b.w/2-w/2,y=b.y+b.h+22;c.style.setProperty('--ax',(w/2-7)+'px');c.style.left=x+'px';c.style.top=y+'px';c.classList.add('under');return}
 c.classList.remove('under');const r=rectIn(target);let x=r.x+r.w/2-w/2;x=Math.max(10,Math.min(W-w-10,x));let y=r.y-h-16;
 if(y<8){y=r.y+r.h+16;c.style.setProperty('--ax','-40px')}else c.style.setProperty('--ax',(r.x+r.w/2-x-7)+'px');c.style.left=x+'px';c.style.top=y+'px'}
function coachEval(){hideCoach();if(WK.free||WK.mid!=='M001'||S.done.M001||UI.block||UI.cur!=='work')return;
 const tot=Object.values(S.deliv).reduce((a,b)=>a+b,0);if(tot>0)return;
 const its=[];S.board.forEach((id,i)=>{if(i!==S.toolboxSlot&&id)its.push([i,id])});const g=cellEl(S.toolboxSlot);
 const goalIt=its.find(([i,id])=>isNeeded(id));
 if(WK.sel&&isNeeded(getAt(WK.sel.w,WK.sel.i))){showCoach($('#aGo'),'[납품하기]를 눌러 보세요');return}
 if(goalIt){const e=cellEl(goalIt[0]);e.classList.add('coach');showCoach(e,'필요한 물건이에요! 눌러서 고른 뒤 [납품하기]');return}
 let pair=null;for(let a=0;a<its.length&&!pair;a++)for(let b=a+1;b<its.length;b++)if(its[a][1]===its[b][1]&&ITEMS[its[a][1]].next){pair=[its[a][0],its[b][0]];break}
 if(pair){if(WK.sel&&pair.includes(WK.sel.i)){const o=pair.find(x=>x!==WK.sel.i);cellEl(o).classList.add('coach');showCoach(cellEl(o),'같은 재료를 한 번 더 누르면 합쳐져요');return}
  pair.forEach(i=>cellEl(i).classList.add('coach'));showCoach(cellEl(pair[0]),'같은 재료 두 개를 차례로 눌러 보세요 (끌어서 겹쳐도 돼요)');return}
 g.classList.add('ring');showCoach(g,its.length?'상자를 눌러 재료를 더 꺼내요':'상자를 눌러 재료를 꺼내 보세요')}

/* ---- 미션 진행 ---- */
function giveItem(id){const e=emptyBoard();if(!e.length)return -1;S.board[e[0]]=id;return e[0]}
function expand(n){if(S.size>=n)return;S.size=n;renderBoard();Snd.sfx('unlock');vib(200)}
async function firstTips(mid){if(S.tips[mid])return;
 if(mid==='M001')await tipSeq([{sel:'#board',title:'작업대',text:'공구함을 누르면 재료가 나오고, 끌면 옮길 수 있어요. 같은 재료 두 개를 합치면 한 단계 위의 재료가 되고, 왼쪽 목록의 물건을 만들어 납품하면 돼요.'}]);
 if(mid==='M002'){expand(5);S.pool=MISS.M002.pool;await sleep(700);
  await tipSeq([{sel:'#board',title:'작업대가 넓어졌어요',text:'5×5 칸으로 넓어졌고, 잔가지와 금 간 돌이 새 재료로 나와요.'}]);
  S.ui.small=true;after();await sleep(150);
  await tipSeq([{sel:'#store',title:'보관함',text:'당장 쓰지 않는 재료는 보관함에 맡겨 둘 수 있어요. 재료를 고른 뒤 [보관]을 누르거나, 보관함 칸으로 끌어 놓으세요.'},
   {sel:'#acts',title:'되돌리기 · 버리기',text:'납품은 임무를 완료하기 전까지 [되돌리기]로 돌려받을 수 있어요. 필요 없는 재료는 [버리기]로 치울 수 있고, 지금 필요한 물건은 버려지지 않아요.'}])}
 if(mid==='M003'){expand(6);S.pool=MISS.M003.pool;await sleep(700);
  await tipSeq([{sel:'#board',title:'가득 찬 작업대',text:'6×6 칸이 모두 열렸어요. 헝겊이 새 재료로 나오고, 두 개를 합치면 침구가 돼요.'}]);
  const i=giveItem('lamp');S.gave.M003=1;after(i,'spawn');await sleep(500);
  if(i>0)await tipSeq([{sel:cellEl(i),title:'찾아낸 램프',text:'창고에서 찾은 램프가 작업대에 올라왔어요. 램프는 합치지 않고 그대로 납품해요.'}])}
 S.tips[mid]=1;persist()}
async function doMission(sc){return new Promise(async res=>{
 WK.resolve=res;WK.sc=sc;WK.order=null;WK.mid=sc.mission.id;WK.free=false;WK.sel=null;WK.busy=false;btnDrop.arm=0;
 S.pool=S.tips[WK.mid]?MISS[WK.mid].pool:(WK.mid==='M002'?POOL1:WK.mid==='M003'?POOL2:MISS[WK.mid].pool);
 await fade(true);go('work');
 setWorkMission(sc);buildCards();after();await fade(false);
 await firstTips(WK.mid);after()})}
function setWorkMission(sc){
 $('#wT').textContent=sc.mission.name;$('#wI').textContent=sc.mission.id;
 $('#wH').textContent=HINTS[WK.mid]||'필요한 물건을 만들어 납품해 주세요. 자리가 모자라면 보관함을 써 보세요.';
 const v=vis(sc.id,S.done,S.hatched);LW.set(v.bg,v.props);
}
async function completeMission(){if(WK.busy)return;WK.busy=true;const mid=WK.mid,sc=WK.sc;hideCoach();WK.sel=null;after();
 Snd.sfx('done');vib([200,80,200]);fx.rain(40);await sleep(1100);
 S.done[mid]=true;S.ustack=[];S.deliv={};S.pos.ph='post';S.pos.li=0;persist();
 await playResult(sc,mid);WK.busy=false;WK.resolve()}
async function playResult(sc,mid){await fade(true);go('result');
 const before={...S.done};delete before[mid];const vb=vis(sc.id,before,S.hatched);LB.set(vb.bg,vb.props);
 $('#rbox').classList.remove('on');$('#rcont').classList.remove('on');$('#rbox .t1').textContent='임무 완료';$('#rbox .t2').textContent=sc.mission.name;
 await fade(false);await sleep(900);
 flashFx();Snd.sfx('unlock');vib([60,40,120]);const va=vis(sc.id,S.done,S.hatched);LB.set(va.bg,va.props,true);fx.burst(W/2,420,30);
 await sleep(500);$('#rbox').classList.add('on');await sleep(1500);$('#rcont').classList.add('on');await tapOnce('#result');
 $('#rbox').classList.remove('on');$('#rcont').classList.remove('on');
 await fade(true);go('story');clearPorts();setScene(sc);await fade(false)}

/* ================= 자유 제작(작업대) ================= */
function openFree(){UI.prev=UI.cur;WK.order=null;WK.free=true;WK.sel=null;WK.fu=[];WK.busy=false;closeMenu();go('work');
 $('#wT').textContent='작업대';$('#wI').textContent='자유 제작';$('#wH').textContent='만들고 싶은 가구 칸에 널빤지를 납품하면 만들어져요. 완성한 가구는 방 꾸미기에서 놓을 수 있어요.';
 if(S.life)workPreview();else LW.set('room_restored',[]);buildCards();after()}
function closeFree(){WK.free=false;WK.sel=null;go(UI.prev==='work'?'story':UI.prev);if(UI.cur==='life')showLife()}

/* ================= 방 꾸미기 ================= */
const RM={sel:null};
function furnList(){return['bed','lamp',...(S.crafted.chair?['chair']:[]),...(S.crafted.table?['table']:[])]}
function renderRoom(){const P=S.room.place;
 const props=Object.entries(P).filter(([k])=>furnList().includes(k)).map(([k,sid])=>{const s=ROOM.slots.find(x=>x.id===sid),f=ROOM.furn[k];return{k,img:f.img,fx:s.fx,fy:s.fy,w:f.w,z:Math.round(s.fy*100)}});
 LR.set(ROOM.bg,props);
 LR.root.querySelectorAll('.prop').forEach(e=>e.classList.toggle('sel',e.dataset.k===RM.sel));
 const ui=$('#roomui');ui.innerHTML='';const g=LR.geo(ROOM.bg);
 for(const s of ROOM.slots){const p=LR.pt(s.fx,s.fy),occ=Object.entries(P).find(([k,v])=>v===s.id&&furnList().includes(k));
  const d=el('div','slot'+(occ?' occ':RM.sel?'':' idle'));d.dataset.id=s.id;
  if(occ){const f=ROOM.furn[occ[0]];d.style.cssText=`left:${p.x}px;top:${p.y}px;width:${f.w*g.iw*g.s}px;height:${f.w*g.iw*g.s*.8}px;transform:translate(-50%,-100%);border:0;background:none;box-shadow:none;animation:none`}
  else d.style.cssText=`left:${p.x}px;top:${p.y}px;${RM.sel?'':'opacity:0;pointer-events:none'}`;
  d.onclick=()=>roomSlot(s.id);ui.appendChild(d)}
 $('#roombar').innerHTML=furnList().map(k=>`<div class="chip ${RM.sel===k?'sel':''}" data-k="${k}"><img src="${asset(ROOM.furn[k].img)}"><span>${ROOM.furn[k].n}${P[k]?'':' · 아직 안 놓음'}</span></div>`).join('');$('#roomnote').textContent=RM.sel?'놓을 자리를 눌러 주세요':'가구를 눌러 고른 뒤, 놓을 자리를 눌러요';
 $$('#roombar .chip').forEach(c=>c.onclick=()=>{RM.sel=RM.sel===c.dataset.k?null:c.dataset.k;Snd.sfx('sel');renderRoom()})}
function roomSlot(sid){const P=S.room.place,occ=Object.entries(P).find(([k,v])=>v===sid&&furnList().includes(k));
 if(!RM.sel){if(occ){RM.sel=occ[0];Snd.sfx('sel');renderRoom()}return}
 if(occ&&occ[0]===RM.sel){RM.sel=null;renderRoom();return}
 const old=P[RM.sel];if(occ){if(old)P[occ[0]]=old;else delete P[occ[0]]}P[RM.sel]=sid;RM.sel=null;Snd.sfx('tap');vib(60);persist();renderRoom();
 const c=LR.pt(ROOM.slots.find(s=>s.id===sid).fx,ROOM.slots.find(s=>s.id===sid).fy);fx.burst(c.x,c.y-40,10)}
function openRoom(){UI.prev=UI.cur==='room'?'story':UI.cur;closeMenu();RM.sel=null;go('room');renderRoom()}
$('#roomBack').onclick=()=>{go(UI.prev);if(UI.cur==='life')showLife()};

/* ================= 니베 돌보기 ================= */
const REACT={curious:['dr/nive_01_curious.webp','니베가 고개를 갸웃한다.'],inquisitive:['dr/nive_02_inquisitive.webp','니베가 손끝을 가만히 살핀다.'],recoiling:['dr/nive_03_recoiling.webp','니베가 살짝 몸을 뒤로 뺀다.'],affectionate:['dr/nive_04_affectionate.webp','니베가 손에 얼굴을 비빈다.']};
let careT=0;
function careHearts(){$('#hv').textContent=S.hearts;$('#hbar').style.width=Math.min(100,S.hearts/15*100)+'%'}
function careShow(k,msg){const r=REACT[k];const n=$('#nivebig');n.src=asset(r[0]);$('#carenote').textContent=msg||r[1];clearTimeout(careT);careT=setTimeout(()=>{n.src=asset('dr/nive_02_hatchling.webp');$('#carenote').textContent=''},2600)}
function careGain(){
 if(S.life&&canCareCharge()){
  const gain=Math.min(careBonus(),energyCap()-S.life.energy);
  S.life.energy+=gain;S.life.careSpent=0;
  toast('에너지 +'+gain);
 }
 S.hearts++;const h=S.hearts;careHearts();const n=centerOf($('#nivebig'));fx.burst(n.x,n.y-60,6,'heart');Snd.sfx('heart');vib(90);
 if([3,6,10,15].includes(h))toast('니베가 조금 더 편안해 보여요',2600);persist()}
function carePet(){const h=S.hearts;const w=h<3?['curious','inquisitive','recoiling','curious']:h<8?['curious','inquisitive','affectionate','inquisitive']:['affectionate','affectionate','curious'];const k=S.life&&canCareCharge()?'affectionate':rnd(w);careShow(k);if(k!=='recoiling')careGain();else{Snd.sfx('chirp');vib(60)}}
function careWater(){careShow(S.hearts<3?'curious':'affectionate','니베가 작은 혀로 물을 핥는다.');careGain()}
function openCare(){UI.prev=UI.cur;closeMenu();go('care');LC.set('tower_base',S.life?.goods.blanket?[PR.nest,{k:'blanket',img:'item/bedroll.webp',fx:.6,fy:.87,w:.105}]:[PR.nest]);const p=LC.pt(.52,.9),n=$('#nivebig');n.src=asset('dr/nive_02_hatchling.webp');n.style.left=p.x+'px';n.style.bottom=(720-p.y+78)+'px';careHearts();$('#carenote').textContent=S.life?(canCareCharge()?'지금 돌보면 에너지 +'+careBonus():'공방에서 재료를 만들고 돌아오면 에너지를 받을 수 있어요.') : '';$('#nivebig').classList.toggle('care-target',!!S.life)}
$('#careBack').onclick=()=>{go(UI.prev);if(UI.cur==='life')showLife()};$('#bPet').onclick=()=>{Snd.init();carePet()};$('#bWater').onclick=()=>{Snd.init();careWater()};
function careDrag(e,action){
 if(!S?.life||!e.isPrimary||e.button!==0)return;
 const node=e.currentTarget,start={x:e.clientX,y:e.clientY};
 let ghost=null;
 node.setPointerCapture(e.pointerId);
 const move=m=>{
  if(m.pointerId!==e.pointerId)return;
  if(!ghost&&Math.hypot(m.clientX-start.x,m.clientY-start.y)>12*SC){
   ghost=el('span','care-ghost',node=== $('#bWater')?'물 주기':'쓰다듬기');
   stage.appendChild(ghost);
  }
  if(ghost){const p=toStage(m.clientX,m.clientY);ghost.style.left=p.x+'px';ghost.style.top=p.y+'px';$('#nivebig').classList.add('care-receive')}
 };
 const finish=m=>{
  if(m.pointerId!==e.pointerId)return;
  node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',finish);node.removeEventListener('pointercancel',finish);
  if(!ghost)return;
  ghost.remove();$('#nivebig').classList.remove('care-receive');
  node.addEventListener('click',stopClick,{capture:true,once:true});
  setTimeout(()=>node.removeEventListener('click',stopClick,true),300);
  const target=$('#nivebig').getBoundingClientRect();
  if(m.type==='pointerup'&&m.clientX>=target.left&&m.clientX<=target.right&&m.clientY>=target.top&&m.clientY<=target.bottom)action();
 };
 function stopClick(event){event.stopImmediatePropagation()}
 node.addEventListener('pointermove',move);node.addEventListener('pointerup',finish);node.addEventListener('pointercancel',finish);
}
$('#bPet').addEventListener('pointerdown',e=>careDrag(e,carePet));
$('#bWater').addEventListener('pointerdown',e=>careDrag(e,careWater));

/* ================= 메뉴 / 끝 ================= */
function openMenu(){if(UI.menu)return;UI.menu=true;UI.block++;refreshMenuBtn();const b=$('#menubtns');b.innerHTML='';
 const add=(t,f,dis,cls='')=>{const x=el('button','btn '+cls,t);x.disabled=!!dis;x.onclick=f;b.appendChild(x)};
 add('이어서 하기',closeMenu,false,'');
 if(S.life&&UI.cur==='story')add('성으로 돌아가기',pauseStory,false,'ghost');
 if(S.life&&UI.cur==='work'&&!WK.free)add('성으로 돌아가기',pauseStory,WK.busy,'ghost');
 add('작업대',()=>openFree(),UI.cur==='work'||S.pos.ph==='work'&&!S.life,'ghost');
 add('방 꾸미기',openRoom,false,'ghost');
 if(S.care)add('니베 돌보기',openCare,false,'ghost');
 if(S.life&&UI.cur==='life')add('상점',()=>{closeMenu();openMarket('shop')},false,'ghost');
 add('소리 '+(S.snd?'켜짐':'꺼짐'),()=>{S.snd=!S.snd;Snd.setOn(S.snd);persist();openMenu.re()},false,'ghost');
 add('처음 화면으로',()=>{persist();location.reload()},false,'ghost');
 $('#menu').classList.add('on')}
openMenu.re=()=>{UI.menu=false;UI.block--;openMenu()};
function closeMenu(){if(!UI.menu)return;UI.menu=false;UI.block=Math.max(0,UI.block-1);$('#menu').classList.remove('on');refreshMenuBtn()}
$('#menuBtn').onclick=()=>{Snd.init();openMenu()};
/* ================= 진행 ================= */
async function afterScene(sc){
 if(sc.id==='EP001_SC07'&&!S.hub){S.hub=true;persist();refreshMenuBtn();Snd.sfx('unlock');await tipSeq([{sel:'#menuBtn',title:'☰ 메뉴가 열렸어요',text:'작업대에서 가구를 만들고, 방 꾸미기에서 방을 꾸밀 수 있어요. 이야기와 상관없이 언제든 쓸 수 있습니다.'}])}
 if(sc.id==='EP006_SC04'&&S.done.M013&&!S.care){S.care=true;persist();Snd.sfx('unlock');await tipSeq([{sel:'#menuBtn',title:'니베 돌보기',text:'☰ 메뉴에서 니베와 시간을 보낼 수 있어요. 쓰다듬거나 물을 줘 보세요. 잃거나 실패하는 일은 없습니다.'}])}}
async function runGame(){
 if(UI.running)return;
 UI.running=true;
 const limit=S.life?GUIDE_COUNT+1:GUIDE_COUNT;
 while(S.pos.e<limit){
  const ep=STORY[S.pos.e],sc=ep.scenes[S.pos.s];
  if(!sc){S.pos={e:S.pos.e+1,s:0,ph:'pre',li:0};persist();continue}
  if(S.pos.s===0&&S.pos.ph==='pre'&&S.pos.li===0)await chapter(ep);
  go('story');clearPorts();$('#dlg').style.display='none';setScene(sc);
  const lc=$('#loc');lc.textContent='EP'+ep.ep+' · '+sc.title;lc.classList.remove('show');void lc.offsetWidth;lc.classList.add('show');
  await fade(false);
  if(S.pos.ph==='pre'){await playLines(sc.pre,S.pos.li,sc);S.pos.ph=sc.mission?'work':'post';S.pos.li=0;persist()}
  if(S.pos.ph==='work'){if(sc.mission)await doMission(sc);S.pos.ph='post';S.pos.li=0;persist()}
  if(S.pos.ph==='post'){await playLines(sc.post,S.pos.li,sc)}
  await afterScene(sc);
  S.pos={e:S.pos.e,s:S.pos.s+1,ph:'pre',li:0};persist()}
 if(limit>GUIDE_COUNT)S.life.chapterDone=true;
 UI.running=false;
 persist();
 showLife();
 await fade(false);
}

/* ================= 시작 ================= */
async function startGame(fresh){Snd.init();
 S=fresh?newState():Object.assign(newState(),loadSave()||{});Snd.setOn(S.snd);writeSave(S);UI.parked=null;UI.running=false;
 await fade(true);
 if(S.pos.e>=GUIDE_COUNT){showLife();await fade(false)}else runGame()}
async function boot(){fit();addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,200));
 LB=new Loc($('#bgwrap'),true);LR=new Loc($('#roombg'));LC=new Loc($('#carebg'));initWork();
 $('#ghost').style.position='absolute';
 const bc=$('#bContinue'),bn=$('#bNew');bc.disabled=!hasSave();bc.classList.toggle('pulse',hasSave());
 await preload();
 LB.set('gate_restored',[]);go('title');await fade(false);
 document.addEventListener('pointerdown',()=>Snd.init(),{once:true});
 bc.onclick=()=>{if(!bc.disabled)startGame(false)};
 let arm=0;bn.onclick=()=>{if(hasSave()&&!arm){arm=1;bn.textContent='정말 처음부터 시작할까요?';setTimeout(()=>{arm=0;bn.textContent='새로 시작'},2600);return}startGame(true)};
 if(!hasSave())bn.classList.remove('ghost');
 window.__g={get S(){return S},go,openFree,openRoom,openCare,startGame,tipSeq,toast,WK,UI,LB,LW,LR,LC,fx,Snd,spawn,after,vis,runGame}}
boot();

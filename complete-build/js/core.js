
'use strict';
/* ===== LUNA SOL · core: 유틸 / 소리 / 파티클 / 저장 / 데이터 / 배경(Loc) ===== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const A='a/';
const asset=path=>globalThis.LUNA_ASSETS?.[path]??globalThis.LUNA_PRODUCTION_PATHS?.[path]??A+path;
const stage=$('#stage');
let SC=1,W=1280,onFit=null;
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

/* Original Luna Sol sound cues, encoded for offline play. */
const LUNA_SOUND={"ambient":"assets/audio/ambient.mp3","merge":"assets/audio/merge.mp3","fine":"assets/audio/fine.mp3","mana":"assets/audio/mana.mp3","care":"assets/audio/care.mp3","restored":"assets/audio/restored.mp3"};
/* ---------- 소리(WebAudio 합성) ---------- */
const Snd={ctx:null,on:true,master:null,buffers:{},ambientSource:null,
 init(){ if(this.ctx){ if(this.ctx.state==='suspended')this.ctx.resume(); return }
  try{const C=window.AudioContext||window.webkitAudioContext;this.ctx=new C();
   this.master=this.ctx.createGain();this.master.gain.value=this.on?.8:0;this.master.connect(this.ctx.destination);
   const d=this.ctx.createDelay(1.2);d.delayTime.value=.42;const fb=this.ctx.createGain();fb.gain.value=.38;d.connect(fb);fb.connect(d);
   const wet=this.ctx.createGain();wet.gain.value=.5;d.connect(wet);wet.connect(this.master);this.delay=d;
   this.loadScore()}catch(e){}},
 setOn(v){this.on=v;if(this.master)this.master.gain.value=v?.8:0},
 tone(f,t=0,d=.25,type='sine',v=.18,slide,wet=false){ if(!this.ctx)return;
  const c=this.ctx,o=c.createOscillator(),g=c.createGain(),t0=c.currentTime+t;
  o.type=type;o.frequency.setValueAtTime(f,t0);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t0+d);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(v,t0+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
  o.connect(g);g.connect(this.master);if(wet&&this.delay)g.connect(this.delay);o.start(t0);o.stop(t0+d+.05)},
 loadScore(){
  const ctx=this.ctx;
  for(const [name,path] of Object.entries(LUNA_SOUND)){
   fetch(path).then(response=>{if(!response.ok)throw Error(response.status);return response.arrayBuffer()}).then(bytes=>ctx.decodeAudioData(bytes,buffer=>{
    this.buffers[name]=buffer;
    if(name==='ambient'&&!this.ambientSource){
     const source=ctx.createBufferSource(),volume=ctx.createGain();
     source.buffer=buffer;source.loop=true;volume.gain.value=.72;
     source.connect(volume);volume.connect(this.master);
     source.start();this.ambientSource=source;
    }
   },()=>{})).catch(()=>{});
  }
 },
 cue(name,volume=1){
  if(!this.on||!this.ctx||!this.buffers[name])return false;
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
  source.buffer=this.buffers[name];gain.gain.value=volume;
  source.connect(gain);gain.connect(this.master);
  source.onended=()=>{source.disconnect();gain.disconnect()};
  source.start();return true;
 },
 sfx(n,a){ if(!this.ctx||!this.on)return; const T=this.tone.bind(this);
  const cue=n==='merge'?(a>=2?'fine':'merge'):n==='mana'?'mana':n==='done'?'restored':n==='careMagic'?'care':null;
  if(cue&&this.cue(cue,n==='merge'?.74:1))return;
  switch(n){
   case'mana':T(784,0,.42,'sine',.11,null,true);T(1318,.13,.5,'sine',.09,null,true);break;
   case'careMagic':T(659,0,.28,'sine',.08,null,true);T(880,.11,.32,'sine',.07,null,true);break;
   case'tap':T(760,0,.06,'sine',.07);break;
   case'sel':T(620,0,.07,'triangle',.1);T(930,.04,.06,'sine',.06);break;
   case'spawn':T(420,0,.14,'triangle',.16,780);T(1100,.08,.1,'sine',.06);break;
   case'merge':{const b=[523.25,659.25,783.99,1046.5][Math.min(a||0,3)];T(b,0,.22,'triangle',.2,null,true);T(b*1.5,.07,.28,'sine',.12,null,true);T(b*2,.14,.3,'sine',.07,null,true);break}
   case'deliver':T(784,0,.12,'sine',.16);T(1175,.09,.28,'triangle',.16,null,true);break;
   case'undo':T(520,0,.12,'sine',.1,340);break;
   case'store':T(480,0,.1,'triangle',.12,700);break;
   case'err':T(170,0,.16,'square',.07,120);break;
   case'done':[523.25,659.25,783.99,1046.5,1318.5].forEach((f,i)=>T(f,i*.1,.5,'triangle',.18,null,true));break;
   case'unlock':[659.25,880,1174.66].forEach((f,i)=>T(f,i*.12,.7,'sine',.14,null,true));break;
   case'page':T(1400,0,.03,'sine',.025);break;
   case'chirp':T(900,0,.09,'sine',.14,1700);T(1500,.11,.1,'sine',.1,2100);break;
   case'crack':T(220,0,.05,'square',.1,120);T(300,.07,.04,'square',.08,150);break;
   case'hatch':[587.33,783.99,987.77,1318.5].forEach((f,i)=>T(f,i*.09,.9,'sine',.16,null,true));break;
   case'heart':T(880,0,.14,'sine',.1,1320,true);T(1320,.1,.2,'sine',.08,null,true);break;
  }}
};

/* ---------- 파티클 ---------- */
const fx={c:$('#fx'),x:null,ps:[],run:false,d:1,
 resize(){const d=Math.min(2,(window.devicePixelRatio||1)*SC);this.d=d;this.c.width=W*d;this.c.height=720*d;this.c.style.width=W+'px';this.c.style.height='720px';this.x=this.c.getContext('2d')},
 magic(x,y,kind='silver'){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.burst(x,y,reduced?3:kind==='amber'?18:10,kind);
 },
 burst(x,y,n=14,kind='spark'){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=kind==='conf'?2+Math.random()*7:1+Math.random()*4.2;
   this.ps.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(kind==='heart'?2.4:kind==='conf'?4:1.2),g:kind==='heart'?-.02:kind==='conf'?.22:.09,life:0,max:kind==='conf'?90:48+Math.random()*26,
     r:kind==='conf'?3+Math.random()*4:kind==='heart'?9+Math.random()*7:2+Math.random()*3,k:kind,h:kind==='conf'?Math.floor(Math.random()*360):44,rot:Math.random()*6})}
  if(!this.run){this.run=true;requestAnimationFrame(()=>this.tick())}},
 rain(n=40){for(let i=0;i<n;i++)setTimeout(()=>this.burst(Math.random()*W,-10,1,'conf'),i*18)},
 tick(){const x=this.x,d=this.d;x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,W,720);
  this.ps=this.ps.filter(p=>p.life<p.max);
  for(const p of this.ps){p.life++;p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=.985;const a=Math.max(0,1-p.life/p.max);x.globalAlpha=a;
   if(p.k==='heart'){x.fillStyle='#ff9db4';x.save();x.translate(p.x,p.y);x.scale(p.r/10,p.r/10);x.beginPath();x.moveTo(0,4);x.bezierCurveTo(-12,-6,-5,-13,0,-6);x.bezierCurveTo(5,-13,12,-6,0,4);x.fill();x.restore()}
   else if(p.k==='conf'){x.fillStyle=`hsl(${p.h},85%,70%)`;x.save();x.translate(p.x,p.y);x.rotate(p.rot+p.life*.15);x.fillRect(-p.r,-p.r/2,p.r*2,p.r);x.restore()}
   else if(p.k==='silver'||p.k==='amber'||p.k==='violet'){
    const colors={silver:['#e9fbff','#96c5ff'],amber:['#fff1c1','#f2b452'],violet:['#f4e2ff','#b890ff']};
    const [light,glow]=colors[p.k];
    const size=p.r*(.65+1.15*Math.sin(Math.PI*p.life/p.max));
    x.save();x.translate(p.x,p.y);x.rotate(p.rot*.42+p.life*.011);
    x.fillStyle=light;x.shadowColor=glow;x.shadowBlur=10;
    x.beginPath();x.moveTo(0,-size*1.55);x.quadraticCurveTo(size*.19,-size*.19,size,0);
    x.quadraticCurveTo(size*.19,size*.19,0,size*1.55);x.quadraticCurveTo(-size*.19,size*.19,-size,0);
    x.quadraticCurveTo(-size*.19,-size*.19,0,-size*1.55);x.fill();x.restore();
   }
   else{x.fillStyle='#ffe7a8';x.shadowColor='#ffd27a';x.shadowBlur=10;x.beginPath();x.arc(p.x,p.y,p.r*a+.4,0,7);x.fill();x.shadowBlur=0}}
  x.globalAlpha=1;
  if(this.ps.length)requestAnimationFrame(()=>this.tick());else{this.run=false;x.clearRect(0,0,W,720)}}
};
function toStage(cx,cy){const r=stage.getBoundingClientRect();return{x:(cx-r.left)/SC,y:(cy-r.top)/SC}}
function rectIn(e){const r=e.getBoundingClientRect(),s=stage.getBoundingClientRect();return{x:(r.left-s.left)/SC,y:(r.top-s.top)/SC,w:r.width/SC,h:r.height/SC}}
function centerOf(e){const r=rectIn(e);return{x:r.x+r.w/2,y:r.y+r.h/2}}

/* ---------- 저장 ---------- */
const KEY='lunasol.guide.v1',KEY2='lunasol.guide.v1.bak';let memSave=null;
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
function validSave(raw){
 try{
  const data=JSON.parse(raw);
  if(data?.v===1&&Number.isInteger(data.pos?.e)&&data.pos.e>=0&&data.pos.e<=90&&
     Number.isInteger(data.pos.s)&&data.pos.s>=0&&Array.isArray(data.board)&&data.board.length===36&&
     Array.isArray(data.store)&&data.store.length===8)return data;
 }catch(error){}
 return null;
}
function loadSave(){
 let native='';
 try{native=window.LunaBridge?.load()||''}catch(error){}
 return validSave(native)||validSave(lsGet(KEY))||validSave(lsGet(KEY2))||validSave(memSave);
}
function writeSave(o){
 const s=JSON.stringify(o);
 memSave=s;
 const old=lsGet(KEY);
 if(old&&old!==s&&validSave(old))lsSet(KEY2,old);
 lsSet(KEY,s);
 try{window.LunaBridge?.save(s)}catch(error){}
}
function hasSave(){return !!loadSave()}

/* ---------- 데이터 ---------- */
const ITEMS={
 iron:{n:'철 조각',next:'ingot',tier:1,raw:'iron'},ingot:{n:'철괴',next:'latch',tier:2,raw:'iron',cost:2},latch:{n:'걸쇠',tier:3,raw:'iron',cost:4},
 wood:{n:'나무 조각',next:'plank',tier:1,raw:'wood'},plank:{n:'널빤지',tier:2,raw:'wood',cost:2},
 twigs:{n:'잔가지',next:'broom',tier:1,raw:'twigs'},broom:{n:'빗자루',tier:2,raw:'twigs',cost:2},
 cracked:{n:'금 간 돌',next:'stone',tier:1,raw:'cracked'},stone:{n:'다듬은 돌',tier:2,raw:'cracked',cost:2},
 rag:{n:'헝겊',next:'bedroll',tier:1,raw:'rag'},bedroll:{n:'침구',tier:2,raw:'rag',cost:2},
 lamp:{n:'램프',tier:1,solo:1},
 crystalChip:{n:'희미한 수정 파편',next:'crystalShard',tier:1,raw:'crystalChip'},
 crystalShard:{n:'다듬은 수정 조각',next:'lightCrystal',tier:2,raw:'crystalChip',cost:2},
 lightCrystal:{n:'작은 등불 수정',tier:3,raw:'crystalChip',cost:4},
 forestHerb:{n:'은빛 약초',next:'herbBundle',tier:1,raw:'forestHerb'},
 herbBundle:{n:'약초 묶음',tier:2,raw:'forestHerb',cost:2}
};
const rawCost=id=>ITEMS[id].solo?0:(ITEMS[id].cost||1);
const CHAINS=[['iron','ingot','latch'],['wood','plank'],['twigs','broom'],['cracked','stone'],['rag','bedroll'],['crystalChip','crystalShard','lightCrystal'],['forestHerb','herbBundle']];
const img=id=>asset(id.startsWith('MI-')?'icons/'+id+'.webp':'item/'+id+'.webp');
const POOL1=['iron','wood'],POOL2=['iron','wood','twigs','cracked'],POOL3=['iron','wood','twigs','cracked','rag'];
const MISS={
 M001:{g:{latch:1,plank:1},size:4,pool:POOL1},
 M002:{g:{broom:1,stone:2},size:5,pool:POOL2},
 M003:{g:{bedroll:1,broom:1,lamp:1,plank:1},size:6,pool:POOL3,give:['lamp']},
 M004:{g:{plank:2,latch:1},size:6,pool:POOL3},
 M005:{g:{broom:2,stone:1},size:6,pool:POOL3},
 M006:{g:{bedroll:1,plank:2},size:6,pool:POOL3},
 M007:{g:{plank:2,ingot:2},size:6,pool:POOL3},
 M008:{g:{plank:1,latch:1,bedroll:1},size:6,pool:POOL3},
 M009:{g:{latch:1,ingot:1,plank:1},size:6,pool:POOL3},
 M010:{g:{plank:2,bedroll:2},size:6,pool:POOL3},
 M011:{g:{plank:1,ingot:1,broom:1},size:6,pool:POOL3},
 M012:{g:{stone:3,bedroll:1,plank:1},size:6,pool:POOL3},
 M013:{g:{stone:1,plank:1},size:6,pool:POOL3},
 M014:{g:{plank:3,bedroll:2},size:6,pool:POOL3},
 M015:{g:{plank:2,ingot:1},size:6,pool:POOL3},
 M016:{g:{latch:1,ingot:1},size:6,pool:POOL3},
 M017:{g:{plank:2,ingot:1,bedroll:1},size:6,pool:POOL3},
 M018:{g:{plank:1,latch:1},size:6,pool:POOL3},
 M019:{g:{ingot:2,broom:1},size:6,pool:POOL3},
 M020:{g:{lightCrystal:1},size:6,pool:['crystalChip']},
 M022:{g:{stone:3,plank:1},size:6,pool:POOL3},
 M023:{g:{stone:2,latch:1},size:6,pool:POOL3},
 M024:{g:{plank:1,bedroll:1},size:6,pool:POOL3},
 M025:{g:{stone:2,plank:2},size:6,pool:POOL3},
 M026:{g:{plank:2,bedroll:1},size:6,pool:POOL3}
};
const HINTS={
 M001:'같은 재료 두 개를 합치면 한 단계 위의 재료가 돼요.',
 M002:'잔가지 둘 → 빗자루, 금 간 돌 둘 → 다듬은 돌. 상자는 몇 번이든 누를 수 있어요.',
 M003:'이번에는 네 가지가 필요해요. 램프는 창고에서 찾아 작업대에 올려 두었어요.',
 M018:'널빤지로 받치고 걸쇠로 느슨한 장식판을 고정해요.',
 M019:'철괴로 빠진 부분을 메우고 빗자루로 묵은 먼지를 털어요.',
 M020:'수정 파편 두 개씩 합쳐 작은 등불 수정을 만드세요. 처음 네 조각은 상인의 시제품입니다.',
 M022:'다듬은 돌로 물길을 잇고, 널빤지로 빠진 덮개를 맞춰요.',
 M023:'받침돌을 맞추고 걸쇠로 원형 석판을 고정해요.',
 M024:'받침과 헝겊을 대면 뿌리 사이 돌함을 안전하게 열 수 있어요.'
};
const FREE=[
 {key:'chair',name:'참나무 의자',img:asset('fur/oak-chair.webp'),item:'plank',need:2},
 {key:'table',name:'참나무 탁자',img:asset('fur/oak-table.webp'),item:'plank',need:3}
];

/* ---------- 초상화 ---------- */
const BASE_PORTS={'아이의 어머니':'search_mother','브린':'bryn','에리안':'erian','이벨린':'eveline','로우히':'louhi','마르켄':'marken','오스윈':'oswin','로엔':'roen','선장':'roen','세라':'sera'};
const PORT={'아일라':'aila','카엘':'kael','미라':'mira',...BASE_PORTS};
const PN={aila:['01_neutral','02_warm_smile','03_surprise','04_concern','05_tearful','06_resolve'],
 kael:['01_neutral','02_faint_smile','03_serious','04_surprise','05_guilt','06_resolve'],
 mira:['01_neutral','02_bright_smile','03_surprise','04_concern','05_holding_tears','06_relief']};
function portraitFor(sp,mood,position){const newer=newPortrait(sp,mood,position);if(newer)return newer;const k=PORT[sp];if(!k)return null;let i=0;const m=mood||'';
 if(BASE_PORTS[sp]){
  const variant=SUPPORT_PORTRAITS[k]?.find(([,test])=>test.test(m));
  return asset('port/'+k+'_bas_'+(variant?.[0]||'01_neutral')+'.webp');
 }
 const has=(...a)=>a.some(x=>m.includes(x));
 if(k==='aila'){ if(has('놀람','당황','멈칫','의아'))i=2;else if(has('걱정','찡그림','경계','조심','한숨'))i=3;else if(has('웃','미소','안도','만족','부드럽'))i=1;else if(has('단호','진지'))i=5 }
 if(k==='kael'){ if(has('놀람','의아'))i=3;else if(has('진지'))i=2;else if(has('미소','웃'))i=1;else if(has('겨우'))i=4 }
 if(k==='mira'){ if(has('놀람','의아'))i=2;else if(has('걱정'))i=3;else if(has('미소','웃','장난'))i=1;else if(has('만족'))i=5 }
 return asset('port/'+k+'_bas_'+PN[k][i]+'.webp')}
const offscreen=m=>/화면 밖|멀리서/.test(m||'');

/* ---------- 이미지 선로딩 ---------- */
const IMGSZ={};
const ASSETS=['bg/garden_before','bg/garden_restored','bg/garden_water','bg/garden_awakened','bg/gate_merchant','bg/silver_forest','bg/north_inn','bg/forest_roots','bg/gate_before','bg/gate_restored','bg/room_before','bg/room_empty','bg/room_restored','bg/stairs_base','bg/tower_base','bg/yard_before','bg/yard_restored','bg/library_hall_before','bg/library_hall_after','bg/library_before','bg/library_after',
 'fur/bed-restored','fur/bed-worn','fur/oak-chair','fur/oak-table','fur/oil-lamp-lit','fur/oil-lamp-unlit','fur/tower-debris','fur/tower-nest','fur/tower-rail','fur/royal-crest','fur/forest-marker',
 'dr/nive_01_curious','dr/nive_01_egg','dr/nive_02_hatchling','dr/nive_02_inquisitive','dr/nive_03_recoiling','dr/nive_04_affectionate',
 ...Object.keys(ITEMS).map(k=>'item/'+k),'item/box',
 ...Object.keys(PN).flatMap(k=>PN[k].map(n=>'port/'+k+'_bas_'+n))];
function preload(cb){let n=0;return Promise.all(ASSETS.map(a=>new Promise(r=>{const i=new Image();const f=()=>{IMGSZ[A+a+'.webp']=[i.naturalWidth||512,i.naturalHeight||512];cb&&cb(++n,ASSETS.length);r()};i.onload=f;i.onerror=f;i.src=asset(a+'.webp')})))}

/* ---------- 장면 배경 + 소품(Loc) ---------- */
class Loc{
 constructor(host,cam){this.host=host;this.st={bg:null,props:[]};this.root=el('div',cam?'cam':'');this.root.style.cssText='position:absolute;inset:0;overflow:hidden';host.prepend(this.root);Loc.all.push(this)}
 geo(bg){const [iw,ih]=IMGSZ[A+'bg/'+bg+'.webp']||(bg?.startsWith('BG-')?[2000,1200]:[1254,625]);const cw=this.host.clientWidth||W,ch=this.host.clientHeight||720;const s=Math.max(cw/iw,ch/ih);return{iw,ih,s,x:(cw-iw*s)/2,y:(ch-ih*s)/2}}
 pt(fx,fy){const g=this.geo(this.st.bg);return{x:g.x+fx*g.iw*g.s,y:g.y+fy*g.ih*g.s}}
 set(bg,props,anim){this.st={bg,props:props||[]};this._anim=!!anim;this.render()}
 render(){const {bg,props}=this.st;
  this.host.classList.toggle('location-unillustrated',!bg);
  this.root.hidden=!bg;
  if(!bg)return;
  const R=this.root;let cur=[...R.querySelectorAll('.bgimg')].find(i=>i.dataset.n===bg);
  if(!cur){cur=el('img','bgimg');cur.dataset.n=bg;cur.src=asset('bg/'+bg+'.webp');R.insertBefore(cur,R.firstChild)}
  if(this.activeBg!==cur){
   this.activeBg=cur;
   requestAnimationFrame(()=>requestAnimationFrame(()=>{if(this.activeBg===cur)cur.classList.add('on')}));
   R.querySelectorAll('.bgimg').forEach(o=>{
    if(o===cur)return;
    o.classList.remove('on');
    setTimeout(()=>{if(this.activeBg!==o)o.remove()},1000);
   });
  }
  R.querySelectorAll('.bgimg').forEach(i=>{const g=this.geo(i.dataset.n);i.style.width=g.iw*g.s+'px';i.style.height=g.ih*g.s+'px';i.style.left=g.x+'px';i.style.top=g.y+'px'});
  const g=this.geo(bg),keys=new Set(props.map(p=>p.k));
  R.querySelectorAll('.prop').forEach(e=>{if(!keys.has(e.dataset.k)&&!e.dataset.gone){e.dataset.gone=1;e.style.opacity=0;setTimeout(()=>e.remove(),800)}});
  for(const p of props){let e=[...R.querySelectorAll('.prop')].find(x=>x.dataset.k===p.k&&!x.dataset.gone);const nw=!e;
   if(!e){e=el('img','prop');e.dataset.k=p.k;R.appendChild(e)}
   if(e.dataset.art!==p.img){e.dataset.art=p.img;e.src=asset(p.img)}
   e.style.left=g.x+p.fx*g.iw*g.s+'px';e.style.top=g.y+p.fy*g.ih*g.s+'px';e.style.width=p.w*g.iw*g.s+'px';e.style.zIndex=p.z||1;
   e.classList.toggle('wob',!!p.wob);e.classList.toggle('crest-muted',!!p.muted);e.classList.toggle('field-light',!!p.light);if(nw&&this._anim)e.classList.add('pop')}
  this._anim=false}
}
Loc.all=[];

/* 소품 위치 (배경 이미지 비율 좌표) */
const PR={
 debris:{k:'debris',img:'fur/tower-debris.webp',fx:.50,fy:.93,w:.40},
 nest:{k:'nest',img:'fur/tower-nest.webp',fx:.52,fy:.90,w:.24},
 egg:{k:'egg',img:'dr/nive_01_egg.webp',fx:.52,fy:.84,w:.11,z:2},
 hatch:{k:'hatch',img:'dr/nive_02_hatchling.webp',fx:.52,fy:.88,w:.17,z:2},
 rail:{k:'rail',img:'fur/tower-rail.webp',fx:.70,fy:.90,w:.22}
};
const PRS={debris:{fy:.80,w:.30},nest:{fx:.55,fy:.76,w:.12},egg:{fx:.55,fy:.69,w:.075},hatch:{fx:.55,fy:.73,w:.125},rail:{fx:.74,fy:.82,w:.16}};
function vis(id,D,H,mode){D=D||{};const m=id.match(/EP0*(\d+)_SC0*(\d+)/),ep=+m[1],sc=+m[2];let bg='room_restored';const P=[];
 const tower=(o)=>{bg='tower_base';if(o.debris&&!D.M005)P.push(PR.debris);if(o.nest)P.push(PR.nest);if(o.egg)P.push(o.wob?{...PR.egg,wob:1}:PR.egg);if(o.hatch)P.push(PR.hatch)};
 if(ep===1){bg=sc<=2?'gate_before':sc===3?(D.M001?'gate_restored':'gate_before'):sc===4?'gate_restored':sc===5?(D.M002?'yard_restored':'yard_before'):sc===6?(D.M003?'room_restored':'room_before'):'room_restored'}
 else if(ep===2){ if(sc===1)bg='room_restored'; else if(sc===2){bg='stairs_base';if(D.M004)P.push(PR.rail)} else tower({debris:sc===3,egg:sc>=4,nest:!!D.M006}) }
 else if(ep===3){ if(sc===1)bg='gate_restored'; else if(sc===2)bg='yard_restored'; else if(sc===3){bg='stairs_base';P.push(PR.rail)} else if(sc===4)tower({egg:1,nest:1}); else if(sc===5)bg='yard_restored'; else bg='room_restored' }
 else if(ep===4){ if(sc<=2)bg='room_restored'; else tower({egg:1,nest:1}) }
 else if(ep===5){ bg=sc===1?'room_restored':sc===2?'gate_restored':sc===3?'garden_before':sc===4?(D.M012?'garden_restored':'garden_before'):sc===5?'garden_restored':sc===6?'room_restored':'tower_base';
   if(sc===7)tower({nest:1,egg:1}) }
 else if(ep===6){ if(sc<=4)tower({nest:1,egg:!H,hatch:!!H,wob:(sc<=2)}); else if(sc<=7)bg='yard_restored'; else tower({nest:1,hatch:1}) }
 else if(ep===7){
   if(sc===1)tower({nest:1,hatch:1});
   else if(sc===4&&D.M016)bg='library_before';
   else if(sc<=4||sc===9)bg=D.M015?'library_hall_after':'library_hall_before';
   else bg=D.M017?'library_after':'library_before';
   if(sc>1){P.push({...PR.hatch,fx:.56,fy:.84,w:.119});}
 }
 else if(ep===8){
   bg=sc===6?'gate_restored':'library_after';
   if(sc!==6){
     P.push({k:'crest',img:'fur/royal-crest.webp',fx:.54,fy:.27,w:.108,muted:!D.M019});
     if(!D.M019)P.push({k:'crest-cover',img:'item/rag.webp',fx:D.M018?.562:.54,fy:.273,w:D.M018?.067:.106,z:2});
     if(sc!==7)P.push({...PR.hatch,fx:.34,fy:.82,w:.11});
   }
 }
 else if(ep===9){
   bg=sc===1||sc===7?'room_restored':sc===4?'room_empty':sc===8?'yard_restored':'gate_merchant';
   if(sc===4&&D.M020)P.push({k:'crystal',img:'item/lightCrystal.webp',fx:.62,fy:.70,w:.065});
   if(sc===7){
     P.push({k:'lantern',img:'item/lightCrystal.webp',fx:.60,fy:.69,w:.066});
     if(H)P.push({...PR.hatch,fx:.40,fy:.88,w:.11});
   }
 }
 else if(ep===10||ep===11){
   if(ep===10&&sc===1)tower({nest:1,hatch:1});
   else if(ep===10&&sc>=5&&sc<=6){
    bg='BG-01';
    if(D.M023)P.push({k:'slate',img:'item/stone.webp',fx:.63,fy:.78,w:.07});
   }
   else if(ep===11&&sc===2)bg='gate_restored';
   else if(ep===11&&sc>=3&&sc<=7){
     bg='silver_forest';
     if(D.M025)P.push({k:'footbridge',img:'fur/tower-rail.webp',fx:.19,fy:.84,w:.14});
     if(D.M026)P.push({k:'waymark',img:'fur/forest-marker.webp',fx:.38,fy:.70,w:.085});
   }else{
     bg=D.gardenAwakened||D.M024?'garden_awakened':D.M022?'garden_water':'garden_restored';
   }
   if(H&&!(ep===10&&sc===1)&&!(ep===11&&sc===2))P.push({...PR.hatch,fx:.53,fy:.85,w:.105});
 }
 else if(ep>=12){
   bg=PRODUCTION_SCENES.get(id)?.bg||null;
   if(bg==='silver_forest'&&D.M026)P.push({k:'waymark',img:'fur/forest-marker.webp',fx:.38,fy:.70,w:.085});
   P.push(...fieldArt(bg,ep,sc,D));
 }
 if(mode==='story'&&ep<7)for(let i=0;i<P.length;i++)P[i]={...P[i],...(PRS[P[i].k]||{})};
 return{bg,props:P}}

/* 방 꾸미기 */
const ROOM={bg:'room_empty',
 slots:[{id:'s1',fx:.25,fy:.76},{id:'s2',fx:.57,fy:.68},{id:'s3',fx:.79,fy:.75},{id:'s4',fx:.46,fy:.60},{id:'s5',fx:.90,fy:.62}],
 furn:{bed:{n:'침대',img:'fur/bed-restored.webp',w:.34},lamp:{n:'기름 램프',img:'fur/oil-lamp-lit.webp',w:.12},chair:{n:'참나무 의자',img:'fur/oak-chair.webp',w:.16},table:{n:'참나무 탁자',img:'fur/oak-table.webp',w:.2}}};


'use strict';

/* 6화 이후의 주문과 구매. 모든 변화는 플레이어 행동으로 발생한다. */
const GUIDE_COUNT = 6;
const ORDERS = [
 {name:'수레 수리',who:'수레꾼',needs:{plank:1,ingot:1}},
 {name:'작은 방 정리',who:'마을 주민',needs:{broom:1,bedroll:1}},
 {name:'샘터 디딤돌',who:'마을 주민',needs:{stone:2}},
 {name:'창고 걸쇠',who:'수레꾼',needs:{latch:1,plank:1}},
 {name:'책을 덮을 천',who:'마을 주민',needs:{bedroll:2,plank:1}},
 {name:'마당 보수',who:'수레꾼',needs:{stone:1,ingot:2}}
];
const GOODS = [
 {id:'blanket',name:'니베의 담요',art:'item/bedroll.webp',cost:140,note:'돌봄 에너지 보너스 +2'},
 {id:'workLamp',name:'공방 작업등',art:'fur/oil-lamp-lit.webp',cost:210,note:'작업대에 설치 · 에너지 최대치 +8'}
];
const earnedFor = order => Object.entries(order.needs).reduce((total,[item,n])=>total+rawCost(item)*n*35,0);
const energyCap = () => 60+(S.life.goods.workLamp?8:0);
const careBonus = () => 10+(S.life.goods.blanket?2:0);
const canCareCharge = () => S.life.careSpent>=12&&S.life.energy<energyCap();

function beginLife(){
 if(S.life)return;
 S.life={energy:36,coins:0,careSpent:12,goods:{},nextOrder:3,orders:[0,1,2],submitted:{},undo:{},chapterDone:false};
 persist();
}
function goldText(){return S.life.coins.toLocaleString('ko-KR')+' G'}

function lifeButton(label,action,sub=''){
 const b=el('button','activity panel');
 b.type='button';
 const title=el('strong','serif');title.textContent=label;b.appendChild(title);
 if(sub){const hint=el('span');hint.textContent=sub;b.appendChild(hint)}
 b.onclick=action;return b;
}
function showLife(){
 beginLife();
 closeMenu();
 go('life');
 const library=!!S.done.M016;
 LB.set(library?(S.done.M017?'library_after':'library_before'):'room_restored',[]);
 $('#lifeBalance').textContent=goldText()+'　·　에너지 '+S.life.energy+'/'+energyCap();
 const nav=$('#lifeNav');
 const storyLabel=S.life.chapterDone?'서재 둘러보기':S.pos.s||S.pos.li||UI.parked?'서재 이어서':'잠긴 서재';
 nav.replaceChildren(
  lifeButton('마을 주문',()=>openMarket('orders'),'재료를 납품하고 골드 받기'),
  lifeButton('상점',()=>openMarket('shop'),'니베 도구와 공방 소품'),
  lifeButton('작업대',openFree),
  lifeButton('니베 돌보기',openCare,canCareCharge()?'에너지 +'+careBonus():''),
  lifeButton('방 꾸미기',openRoom),
  lifeButton(storyLabel,openLibrary,S.life.chapterDone?'지난 줄거리':'')
 );
}
function buyGood(id){
 const item=GOODS.find(g=>g.id===id);
 if(!item||S.life.goods[id]||S.life.coins<item.cost)return;
 S.life.coins-=item.cost;
 S.life.goods[id]=true;
 persist();
 Snd.sfx('unlock');vib(120);
 renderMarket('shop');
 toast(item.name+' 구매 완료');
}
function openMarket(mode){
 go('market');
 renderMarket(mode);
}
function renderMarket(mode){
 const titles={orders:'마을 주문',shop:'상점',journal:'지난 줄거리'};
 $('#marketTitle').textContent=titles[mode];
 $('#marketGold').textContent=goldText();
 const root=$('#marketContent');
 root.replaceChildren();
 root.classList.toggle('journal',mode==='journal');
 if(mode==='journal'){
  const ep=STORY[GUIDE_COUNT];
  for(const scene of ep.scenes){
   const page=el('article','panel journal-page');
   const title=el('h4','serif');title.textContent=scene.title;page.appendChild(title);
   for(const line of [...scene.pre,...scene.post]){
    if(line.k==='say'&&line.sp==='니베')continue;
    const text=el('p');text.textContent=line.k==='say'?line.sp+'　'+line.text:line.text;page.appendChild(text);
   }
   root.appendChild(page);
  }
  return;
 }
 if(mode==='orders'){
  for(const id of S.life.orders){
   const order=ORDERS[id],sent=S.life.submitted[id]||{};
   const card=lifeButton(order.name,()=>openOrder(id),order.who+'　·　'+earnedFor(order)+' G');
   for(const [item,count] of Object.entries(order.needs)){
    const row=el('span','market-item');
    const art=el('img');art.src=img(item);art.alt='';
    const label=el('span');label.textContent=ITEMS[item].n+' '+(sent[item]||0)+'/'+count;
    row.append(art,label);card.appendChild(row);
   }
   root.appendChild(card);
  }
 }else{
  for(const item of GOODS){
   const card=el('article','activity panel');
   const art=el('img','shop-art');art.src=asset(item.art);art.alt='';
   const title=el('strong','serif');title.textContent=item.name;
   const note=el('span');note.textContent=item.note;
   const btn=el('button','btn');btn.type='button';
   btn.textContent=S.life.goods[item.id]?'구매 완료':item.cost+' G · 구매';
   btn.disabled=!!S.life.goods[item.id]||S.life.coins<item.cost;
   btn.onclick=()=>buyGood(item.id);
   card.append(art,title,note,btn);root.appendChild(card);
  }
 }
}
$('#marketBack').onclick=showLife;
const marketContent=$('#marketContent');
let scrollDrag;
marketContent.addEventListener('pointerdown',e=>{
 if(!marketContent.classList.contains('journal')||!e.isPrimary||e.button!==0)return;
 scrollDrag={pointer:e.pointerId,y:e.clientY,top:marketContent.scrollTop};
 marketContent.setPointerCapture(e.pointerId);
});
marketContent.addEventListener('pointermove',e=>{
 if(scrollDrag?.pointer===e.pointerId)marketContent.scrollTop=scrollDrag.top+(scrollDrag.y-e.clientY)/SC;
});
for(const event of ['pointerup','pointercancel','lostpointercapture']){
 marketContent.addEventListener(event,e=>{if(scrollDrag?.pointer===e.pointerId)scrollDrag=null});
}


function workPreview(){
 const props=S.life?.goods.workLamp?[{k:'workLamp',img:'fur/oil-lamp-lit.webp',fx:.62,fy:.65,w:.14}]:[];
 LW.set('room_empty',props);
}
function openOrder(id){
 if(!S.life.orders.includes(id))return;
 const order=ORDERS[id];
 UI.prev='market';
 WK.order=id;WK.free=true;WK.sel=null;WK.busy=false;WK.mid=null;btnDrop.arm=0;
 go('work');
 $('#wT').textContent=order.name;$('#wI').textContent=order.who;
 $('#wH').textContent='납품 보상 '+earnedFor(order)+' G';
 workPreview();
 buildCards();after();
}
function closeOrder(){
 WK.order=null;WK.free=false;WK.sel=null;
 openMarket('orders');
}
function orderCards(){
 const order=ORDERS[WK.order];
 const submitted=S.life.submitted[WK.order]||{};
 return Object.entries(order.needs).map(([id,need])=>({key:id,item:id,img:img(id),name:ITEMS[id].n,need,have:submitted[id]||0}));
}
function undoStack(){
 return WK.order!=null?(S.life.undo[WK.order]??=[]):WK.free?WK.fu:S.ustack;
}
function submitOrderItem(id,key){
 const sent=S.life.submitted[WK.order]??={};
 sent[key]=(sent[key]||0)+1;
 undoStack().push({key,item:id});
}
function settleOrder(){
 const id=WK.order;
 if(!S.life.orders.includes(id)||!WK.cards.every(c=>c.have>=c.need))return;
 const reward=earnedFor(ORDERS[id]);
 S.life.coins+=reward;
 delete S.life.submitted[id];
 delete S.life.undo[id];
 const active=S.life.orders.filter(order=>order!==id);
 let next;
 do{next=S.life.nextOrder++%ORDERS.length}while(next===id||active.includes(next));
 S.life.orders=[...active,next];
 persist();
 Snd.sfx('done');vib([160,60,160]);fx.rain(26);
 closeOrder();
 toast('납품 완료 · +'+reward+' G');
}

function updateMaterials(){
 const row=$('#workMaterials');
 row.hidden=!S.life;
 if(!S.life)return;
 const keys=['auto',...S.pool];
 if(row.dataset.keys!==keys.join(',')){
  row.dataset.keys=keys.join(',');
  row.replaceChildren(...keys.map(key=>{
   const b=el('button','material-choice');b.type='button';b.dataset.material=key;
   const title=key==='auto'?'자동 재료 선택':ITEMS[key].n;
   b.title=title;b.setAttribute('aria-label',title);
   const art=el('img');art.src=key==='auto'?asset('item/box.webp'):img(key);art.alt='';
   b.appendChild(art);
   b.onclick=()=>{
    S.life.material=key;persist();updateMaterials();
    toast(key==='auto'?'공구함 · 필요한 재료 우선':'공구함 · '+ITEMS[key].n);
   };
   return b;
  }));
 }
 for(const b of row.children)b.setAttribute('aria-pressed',String(b.dataset.material===(S.life.material||'auto')));
}
function updateWorkEnergy(){
 updateMaterials();
 const meter=$('#workEnergy');
 meter.hidden=!S.life;
 if(!S.life)return;
 $('#energyValue').textContent='에너지 '+S.life.energy+'/'+energyCap();
 $('#recoverEnergy').hidden=S.life.energy!==0;
}
function recoverEnergy(){
 if(!S.life||S.life.energy!==0)return;
 S.life.energy=6;
 persist();
 updateWorkEnergy();
 toast('공구함 정리 · 에너지 +6');
}

function pauseStory(){
 if(UI.parked||WK.busy||$('#fade').classList.contains('on'))return;
 if(UI.cur==='story'&&!typing&&!waitRes)return;
 closeMenu();
 UI.parked={screen:UI.cur,work:UI.cur==='work'?{...WK,drag:null,sel:null}:null,location:LW.st};
 showLife();
}
function openLibrary(){
 if(S.life.chapterDone){openMarket('journal');return}
 if(UI.parked){
  const parked=UI.parked;
  UI.parked=null;
  go(parked.screen);
  if(parked.work){
   Object.assign(WK,parked.work);
   setWorkMission(WK.sc);
   LW.set(parked.location.bg,parked.location.props);
   buildCards();after();
  }
  return;
 }
 runGame();
}

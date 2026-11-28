
'use strict';

/* 6화 이후의 주문과 구매. 모든 변화는 플레이어 행동으로 발생한다. */
const GUIDE_COUNT = 6;
const ORDERS = [
 {name:'수레 수리',who:'수레꾼',needs:{plank:1,ingot:1}},
 {name:'작은 방 정리',who:'마을 주민',needs:{broom:1,bedroll:1}},
 {name:'샘터 디딤돌',who:'마을 주민',needs:{stone:2}},
 {name:'창고 걸쇠',who:'수레꾼',needs:{latch:1,plank:1}},
 {name:'책을 덮을 천',who:'마을 주민',needs:{bedroll:2,plank:1}},
 {name:'마당 보수',who:'수레꾼',needs:{stone:1,ingot:2}},
 {name:'역참의 등불',who:'역참',needs:{lightCrystal:1},unlock:'M020'},
 {name:'은빛 약초 표본',who:'미라',needs:{herbBundle:1},unlock:'M026'}
];
// The first queue uses ordinary castle supplies. New regions add their own recipes.
const REGIONAL_ORDERS=[
 [11,'숲길 표지 묶기','숲길 관리인',{'MI-02_02':1,plank:1}],
 [11,'짐수레 묶을 밧줄','마을 목수',{'MI-02_02':2}],
 [11,'채집 바구니 손잡이','마을 주민',{'MI-02_01':2,ingot:1}],
 [18,'정원에 옮겨 심을 모종','정원사',{'MI-07_02':2}],
 [18,'새 묘목 들여놓기','숲길 관리인',{'MI-07_03':1,plank:1}],
 [18,'약초 밭 둘레 보수','정원사',{'MI-07_02':1,stone:2}],
 [22,'공방의 정제 광석','공방지기',{'MI-11_03':2}],
 [22,'화로 받침 보수','공방지기',{'MI-11_04':1,stone:1}],
 [22,'제련 재료 보충','대장장이',{'MI-11_03':1,ingot:2}],
 [33,'등대 렌즈 받침','등대지기',{'MI-14_03':1,ingot:1}],
 [33,'부두 난간 보수','항구 관리인',{'MI-14_04':1,plank:2}],
 [33,'선착장 계류 밧줄','항구 관리인',{'MI-02_03':2}],
 [45,'신전 통로의 방풍막','신전 관리인',{'MI-02_06':1,'MI-14_04':1}],
 [45,'기록실 바닥 완충재','신전 관리인',{'MI-02_05':1,'MI-14_03':1}],
 [45,'외곽 수로 보수','수로지기',{'MI-14_05':1,stone:2}],
 [57,'북쪽 길의 여행 식량','마을 보급관',{'MI-08_04':2}],
 [57,'공동 부엌의 식사','마을 보급관',{'MI-08_03':2,'MI-08_05':1}],
 [57,'눈길 채비','마을 보급관',{'MI-08_06':1,'MI-02_05':1}],
 [67,'성역 정원 돌보기','성역 정원사',{'MI-07_06':1,'MI-07_03':1}],
 [67,'공동 창고 설비','공방지기',{'MI-11_06':1,'MI-02_04':1}],
 [67,'회랑의 수로 덮개','성역 관리인',{'MI-14_05':2}],
 [80,'피난소에 보낼 짐','왕도 보급관',{'MI-08_06':1,'MI-02_06':1}],
 [80,'공동 공방의 재가동','왕도 공방지기',{'MI-11_06':1,'MI-11_04':1}],
 [80,'새 정원과 관수 시설','왕도 정원사',{'MI-07_06':1,'MI-14_06':1}]
];
for(const [from,name,who,needs] of REGIONAL_ORDERS)ORDERS.push({from,name,who,needs});
function orderPool(){
 const unlocked=ORDERS.flatMap((order,id)=>
  (order.from||0)<=S.pos.e&&(!order.unlock||S.done[order.unlock])?[id]:[]);
 const newest=Math.max(...unlocked.map(id=>ORDERS[id].from||0));
 const preferred=unlocked.filter(id=>(ORDERS[id].from||0)===newest);
 const offset=Math.max(0,S.pos.e-newest)%preferred.length;
 return preferred.slice(offset).concat(preferred.slice(0,offset),unlocked.filter(id=>!preferred.includes(id)));
}
const FOOD_PRICE = 70;
const ORDER_LIMIT = 3;
const MANA_LIMIT = 6;
const MANA_COLORS = ['은빛','금빛'];
const DRAGON_PERKS = {
 nive:'돌봄 에너지 회복량 증가',
 bria:'자동 생산 시 필요한 목재가 더 자주 나옴',
 ignis:'자동 생산 시 필요한 철물이 더 자주 나옴',
 neria:'자동 생산 시 필요한 석재가 더 자주 나옴',
 veil:'충전 후 주문 작업대에서 필요한 2단계 재료 지원',
 nox:'탐색에서 더 좋은 재료를 발견'
};
function growthState(){
 if(!S.growth){
  S.growth={food:0, dragons:{}, mana:[[0,0,0],[0,0,0]], companion:'nive', merges:0, manaChapter:-1, manaDrops:0, dry:0, gifts:0};
  S.growth.dragons.nive={hearts:S.hearts||0,xp:0,trip:null};
 }
 return S.growth;
}
function dragonRecord(key){
 return growthState().dragons[key]??={hearts:0,xp:0,trip:null};
}
const growthRank = key => dragonRecord(key).xp>=8?3:dragonRecord(key).xp>=4?2:dragonRecord(key).xp>=1?1:0;
function dragonAvailable(key){
 const position=(S.pos.e+1)*100+S.pos.s+1;
 if(key==='nive')return (S.hatched||S.care)&&!(position>=7506&&position<7608);
 return position>DRAGON_CARE[key].arrival;
}
function activeDragon(){
 const key=growthState().companion;
 return dragonAvailable(key)&&!dragonRecord(key).trip?key:null;
}
function addMergeProgress(){
 if(!S.life||!S.care)return;
 const g=growthState();
 g.merges++;
 if(g.manaChapter!==S.pos.e){g.manaChapter=S.pos.e;g.manaDrops=0;g.dry=0}
 if(g.manaDrops>=MANA_LIMIT)return;
 g.dry++;
 if(g.dry<8&&Math.random()>=.17)return;
 const color=Math.random()<.5?0:1;
 g.mana[color][0]++;
 g.manaDrops++;g.dry=0;
 toast(MANA_COLORS[color]+' 마나 발견 · 돌보기에서 합칠 수 있어요');
 return color;
}
function syncOrders(){
 const life=S.life;
 if(life.orderRevision===3&&life.orderChapter===S.pos.e)return;
 // An unfinished order with deposited items stays available so the deposit can be claimed or undone.
 life.orders=life.orders.filter(id=>Object.values(life.submitted[id]||{}).some(Boolean));
 life.orderRevision=3;
 life.orderChapter=S.pos.e;
 for(const id of orderPool()){
  if(life.orders.length>=ORDER_LIMIT)break;
  if(!life.orders.includes(id))life.orders.push(id);
 }
 persist();
}
const GOODS = [
 {id:'blanket',name:'니베의 담요',art:'item/bedroll.webp',cost:140,note:'돌봄 에너지 보너스 +2'},
 {id:'workLamp',name:'공방 작업등',art:'fur/oil-lamp-lit.webp',cost:210,note:'작업대에 설치 · 에너지 최대치 +8'}
];
const earnedFor = order => Object.entries(order.needs).reduce((total,[item,n])=>total+rawCost(item)*n*35,0);
const energyCap = () => 60+(S.life.goods.workLamp?8:0);
const careBonus = (key='nive') => 10+(key==='nive'?(S.life.goods.blanket?2:0)+growthRank(key)*2:0);
const canCareCharge = () => S.life.careSpent>=12&&S.life.energy<energyCap();

function beginLife(){
 if(S.life)return;
 S.life={orderChapter:null,energy:36,coins:0,careSpent:12,goods:{},orders:[],submitted:{},undo:{},chapterDone:false};
 persist();
}
function goldText(){return S.life.coins.toLocaleString('ko-KR')+' G'}

const UI_ART={
 orders:'orders',shop:'shop',work:'work',care:'care',room:'room',journal:'journal',forest:'forest',gate:'gate',lantern:'lantern'
};
function uiIcon(key){
 const icon=el('img','luna-ui-icon');icon.src=asset('ui/'+UI_ART[key]+'.webp');icon.alt='';icon.draggable=false;
 return icon;
}
function decorateAction(button,key){
 button.classList.add('illustrated-action');
 button.prepend(uiIcon(key));
 return button;
}
function installInterfaceArt(){
 $('#work').style.setProperty('--bench-art','url("'+asset('ui/workbench.webp')+'")');
 for(const [id,key] of [['bContinue','gate'],['bNew','lantern'],['previewStart','journal'],['menuBtn','journal'],['marketBack','gate'],['lifeForest','forest'],['lifeJournal','journal']]){
  const button=$('#'+id);
  button.classList.add('emblem-button');
  button.style.setProperty('--ui-emblem','url("'+asset('ui/'+key+'.webp')+'")');
 }
}
function marketSetting(chapter){
 if(chapter>=81)return ['왕도','bg/BG-46.webp'];
 if(chapter>=68)return ['성역','bg/BG-45.webp'];
 if(chapter>=58)return ['북방','bg/BG-27.webp'];
 if(chapter>=46)return ['태양 신전','bg/BG-24.webp'];
 if(chapter>=34)return ['북풍의 항구','bg/BG-15.webp'];
 if(chapter>=23)return ['황금 공방','bg/BG-11.webp'];
 if(chapter>=12)return ['은빛 숲','bg/BG-02.webp'];
 return ['황혼의 성','ui/hall.webp'];
}
function lifeButton(label,action,sub=''){
 const b=el('button','activity panel');
 b.type='button';
 const title=el('strong','serif');title.textContent=label;b.appendChild(title);
 if(sub){const hint=el('span');hint.textContent=sub;b.appendChild(hint)}
 b.onclick=action;return b;
}
function showLife(){
 beginLife();
 syncOrders();
 closeMenu();
 go('life');
 const {e,s,li}=S.pos;
 const remark=$('#lifeAside');
 const lines={6:'아까는 내 손보다도 작아 보였는데… 잘 때 보니까 날개가 제법 크네.',7:'서재 먼지는 옷에 한참 남겠어. 잠깐 바람 좀 쐬고 올까.',10:'오늘 정원은 조금 다르게 보이네. 내일도 저 자리부터 가 봐야지.',20:'브리아가 자리 잡을 동안 나도 잠깐 쉬어야겠다.',32:'공방에 아직 온기가 남아 있네. 잠깐만 더 있다 갈까.',41:'파도 소리가 꽤 잦아들었네. 이제야 내 생각이 들려.',76:'지금은 아무 말도 안 해도 괜찮아. 조금 더 여기 있자.'};
 const quiet=['아직 불 끄기엔 이른데.','잠깐 숨 좀 돌릴까.','지금은 서두를 일 없으니 천천히 둘러보자.'];
 remark.hidden=!S.life.justFinished||S.life.justFinished!==e;
 remark.textContent=remark.hidden?'':'아일라　“'+(lines[e]||quiet[e%quiet.length])+'”';
 if(e>=STORY.length){const scene=vis('EP090_SC04',S.done,S.hatched);LB.set('BG-46',scene.props.filter(p=>p.k.startsWith('sp-')));}
 else if(S.done.gardenAwakened||S.done.M024)LB.set('garden_awakened',[]);
 else if(S.done.M022)LB.set('garden_water',[]);
 else if(e>=7){
  const library=vis('EP008_SC08',S.done,S.hatched);
  LB.set(library.bg,library.props);
 }else LB.set(S.done.M016?(S.done.M017?'library_after':'library_before'):'room_restored',[]);
 $('#lifeBalance').textContent=goldText()+'　·　에너지 '+S.life.energy+'/'+energyCap();
 $('#lifeForest').hidden=!S.done.M026||e>=STORY.length;
 const nav=$('#lifeNav');
 const project=nextStoryActivity(e,s,!!(s||li||UI.parked));
 const remaining=S.life.orders.length;
 const orders=lifeButton('마을 주문',()=>openMarket('orders'),remaining?'남은 의뢰 '+remaining+'건':'남은 의뢰 0건 ✓');
 const ready=S.life.orders.some(id=>Object.entries(ORDERS[id].needs).every(([item,n])=>
  (S.life.submitted[id]?.[item]||0)+[...S.board,...S.store].filter(held=>held===item).length>=n));
 orders.classList.toggle('life-ready',ready);
 const returns=Object.keys(DRAGON_CARE).filter(key=>dragonAvailable(key)&&tripReady(dragonRecord(key))).length;
 const care=lifeButton(e>=20?'드래곤 돌보기':'니베 돌보기',openCare,returns?'탐색 보상 '+returns+'건':'음식 · 마나 · 교감');
 if(remaining)orders.firstChild.append(el('span','life-alert','•'));
 if(returns)care.firstChild.append(el('span','life-alert','•'));
 project.classList.add('story-route');
 nav.replaceChildren(
  decorateAction(orders,'orders'),
  decorateAction(lifeButton('상점',()=>openMarket('shop')),'shop'),
  decorateAction(lifeButton('작업대',openFree),'work'),
  decorateAction(care,'care'),
  decorateAction(lifeButton('방 꾸미기',openRoom),'room'),
  decorateAction(project,'gate')
 );
}
function nextStoryActivity(episode,scene,resumed){
 let title,hint;
 switch(episode){
  case 6: title=resumed?'서재 이어서':'잠긴 서재';break;
  case 7:
   title=scene>=6?'서재로 돌아가기':scene>=3?'서재에서 카엘 만나기':'서재의 벽 장식';
   if(scene<3)hint='흔들리는 장식판 살펴보기';
   break;
  case 8:
   title=scene>=4?'상인과 거래하기':scene>=3?'수정 다듬기':'성문 앞의 상인';
   break;
  case 9:
   title=scene>=5?'고목 살펴보기':scene>=3?'정원의 물길 고치기':'미라와 정원 둘러보기';
   break;
  case 10:
   title=scene>=4?'숲의 갈림길로':'은빛 숲으로 가기';
   break;
  default:{
   const chapter=STORY[episode];
   if(!chapter)return lifeButton('은빛 숲 채집',()=>openFree('forest'),'약초를 모으고 묶기');
   return lifeButton(resumed?'이야기 이어서':'다음 이야기',resumeStory,chapter.ep+'화 · '+chapter.title);
  }
 }
 return lifeButton(title,resumeStory,hint);
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
 const titles={orders:'마을 주문',shop:'상점',journal:'지난 줄거리',materials:'재료 도감'};
 const market=$('#market');
 const [region,background]=marketSetting(S.pos.e+1);
 market.dataset.mode=mode;
 market.style.setProperty('--hall','url("'+asset('ui/hall.webp')+'")');
 market.style.setProperty('--region','url("'+asset(background)+'")');
 $('#marketRegion').textContent=mode==='orders'?region:'';
 $('#marketTitle').textContent=titles[mode];
 $('#marketGold').textContent=goldText();
 const root=$('#marketContent');
 root.replaceChildren();
 root.classList.toggle('journal',mode==='journal');
 root.classList.toggle('material-catalog',mode==='materials');
 if(mode==='materials'){showMaterialCatalog(root);return}
 if(mode==='journal'){
  const cuts=el('div','journal-cuts');
  for(const [key,cut] of Object.entries(CUTSCENES)){
   if(cut.unlock&&!S.done[cut.unlock])continue;
   const button=el('button','btn sm',cut.title);button.type='button';
   button.onclick=()=>playCutscene(key);
   cuts.appendChild(button);
  }
  root.appendChild(cuts);
  const completed=STORY.slice(GUIDE_COUNT,S.pos.e);
  const pages=el('div','journal-episodes');
  if(completed.length>10){
   const select=el('select');select.id='journalEpisode';select.setAttribute('aria-label','지난 이야기 회차');
   completed.forEach((episode,index)=>select.add(new Option(episode.ep+'화 · '+episode.title,index)));
   select.value=completed.length-1;
   select.onchange=()=>renderJournalEpisodes(pages,[completed[Number(select.value)]]);
   root.appendChild(select);
   renderJournalEpisodes(pages,completed.slice(-1));
  }else renderJournalEpisodes(pages,completed);
  root.appendChild(pages);
  return;
 }
 if(mode==='orders'){
  syncOrders();
  if(!S.life.orders.length){
   const empty=el('div','order-empty');
   empty.append(uiIcon('orders'),el('p','serif',S.pos.e>=STORY.length?'의뢰를 모두 마쳤어요.':'이번 회차의 의뢰를 모두 마쳤어요.'));
   root.append(empty);
  }
  for(const id of S.life.orders){
   const order=ORDERS[id],sent=S.life.submitted[id]||{};
   const card=el('button','order-letter');
   card.type='button';card.onclick=()=>openOrder(id);
   const header=el('header','order-heading');
   header.append(el('span','order-who',order.who),el('strong','serif',order.name));
   const items=el('span','order-goods');
   card.append(header,items);
   for(const [item,count] of Object.entries(order.needs)){
    const row=el('span','market-item');
    const art=el('img');art.src=img(item);art.alt='';
    const label=el('span');label.textContent=ITEMS[item].n+' '+(sent[item]||0)+'/'+count;
    row.append(art,label);items.append(row);
   }
   const footer=el('footer','order-reward');
   footer.append(el('strong','',earnedFor(order).toLocaleString('ko-KR')+' G'),el('span','','의뢰 보기 ›'));
   card.append(footer);
   root.appendChild(card);
  }
 }else{
  const food=lifeButton('드래곤 음식 구매 · '+FOOD_PRICE+' G',()=>{
   if(S.life.coins<FOOD_PRICE)return;
   S.life.coins-=FOOD_PRICE;
   growthState().food++;
   persist();
   renderMarket('shop');
  },'보유 '+growthState().food+'개 · 급여하면 성장 경험 +1');
  food.disabled=S.life.coins<FOOD_PRICE;
  const foodArt=el('img','shop-art');foodArt.src=asset('care/food.webp');foodArt.alt='';
  food.prepend(foodArt);root.append(food);
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
function renderJournalEpisodes(root,episodes){
 root.replaceChildren();
 for(const ep of episodes){
  const heading=el('h3','serif');heading.textContent=ep.title;root.appendChild(heading);
  for(const scene of ep.scenes){
   const page=el('article','panel journal-page');
   const title=el('h4','serif');title.textContent=scene.title;page.appendChild(title);
   for(const line of [...scene.pre,...scene.post]){
    if(line.k==='say'&&line.sp==='니베')continue;
    const text=el('p');text.textContent=line.k==='say'?line.sp+'　'+line.text:line.text;page.appendChild(text);
   }
   root.appendChild(page);
  }
 }
}
$('#marketBack').onclick=showLife;
$('#lifeJournal').onclick=()=>openMarket('journal');
$('#lifeForest').onclick=()=>openFree('forest');
const marketContent=$('#marketContent');
let scrollDrag;
marketContent.addEventListener('pointerdown',e=>{
 if(!marketContent.classList.contains('journal')||e.target.closest('button,select')||!e.isPrimary||e.button!==0)return;
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
 if(WK.order!=null){
  const [region,art]=marketSetting(S.pos.e+1);
  const bg=art.startsWith('bg/')?art.slice(3,-5):'room_empty';
  const order=ORDERS[WK.order];
  LW.set(order.name.includes('등대')?'BG-17':bg,[]);
  $('#win').setAttribute('aria-label',region+' 의뢰 배경');
  return;
 }
 $('#win').removeAttribute('aria-label');
 const props=S.life?.goods.workLamp?[{k:'workLamp',img:'fur/oil-lamp-lit.webp',fx:.62,fy:.65,w:.14}]:[];
 LW.set('room_empty',props);
}
function openOrder(id){
 if(!S.life.orders.includes(id))return;
 const order=ORDERS[id];
 UI.prev='market';
 WK.source=null;WK.order=id;WK.free=true;WK.sel=null;WK.busy=false;WK.mid=null;btnDrop.arm=0;
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
 // A supported order can take fewer draws, but still contributes to care recovery.
 S.life.careSpent=Math.max(S.life.careSpent,Math.min(12,reward/35));
 delete S.life.submitted[id];
 delete S.life.undo[id];
 S.life.orders=S.life.orders.filter(order=>order!==id);
 if(S.pos.e>=STORY.length){
  const next=orderPool().find(index=>index!==id&&!S.life.orders.includes(index));
  if(next!==undefined)S.life.orders.push(next);
 }
 persist();
 Snd.sfx('done');vib([160,60,160]);fx.rain(26);
 closeOrder();
 toast('납품 완료 · +'+reward+' G');
}

function updateMaterials(){
 const row=$('#workMaterials');
 row.hidden=!S.life;
 if(!S.life)return;
 const keys=['auto',...availableMaterials()];
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
 const samples=tradeSamplesLeft();
 $('#energyValue').textContent=samples?'시험용 수정 파편 '+samples+'개':'에너지 '+S.life.energy+'/'+energyCap();
 $('#recoverEnergy').hidden=S.life.energy!==0||samples>0;
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
function resumeStory(){
 if(S.pos.e>=STORY.length){openMarket('journal');return}
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


const TRADE_PRICE=35;
function firstTrade(){
 const card=$('#trade');
 const accept=$('#tradeAccept'),back=$('#tradeBack');
 const payGold=S.life.coins>=TRADE_PRICE;
 card.querySelector('.trade-art').src=img('latch');
 $('#tradeCost').textContent=payGold
  ? TRADE_PRICE+' G · 보유 '+goldText()
  : '상인이 남은 시험용 수정값을 쳐 주기로 했습니다.';
 accept.textContent=payGold?'35 G에 사기':'남은 시험품과 교환';
 go('trade');
 return new Promise(resolve=>{
  function finish(accepted){
   accept.onclick=back.onclick=null;
   if(accepted){
    if(payGold)S.life.coins-=TRADE_PRICE;
    S.done.M021=true;
    S.pos.ph='post';
    S.pos.li=0;
    persist();
    Snd.sfx('unlock');
    go('story');
   }
   resolve(accepted);
  }
  accept.onclick=()=>finish(true);
  back.onclick=()=>finish(false);
 });
}


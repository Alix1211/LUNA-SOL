
'use strict';

/* An entry for each scene, in screenplay order. Numbers index the production backdrops. */
const PRODUCTION_LOCATIONS = {
 12:'inn inn inn inn 02 02 forest inn inn',
 13:'inn 02 roots roots 03 03 03 roots roots',
 14:'roots forest forest roots 03 04 05 04 forest',
 15:'05 04 04 05 04 04 05 05 04',
 16:'04 06 06 06 07 07 07 06 inn inn',
 17:'inn 07 07 07 07 04 07 04 04',
 18:'09 05 05 09 09 09 09 05 09 inn',
 19:'09 08 08 08 08 08 08 08 08',
 20:'08 03 03 03 03 03 03 05 03 03',
 21:'03 library library library library library library library library',
 22:'09 09 09 09 09 09 09 roots 09 04 04 09',
 23:'10 10 10 10 10 11 11 11 11',
 24:'11 11 11 11 11 11 11 11 11',
 25:'11 12 12 12 12 12 12 12 12 12',
 26:'11 11 11 11 11 11 11 11 11 11',
 27:'11 11 11 11 11 11 11 11 11 11',
 28:'11 11 11 11 11 11 11 11 11 11',
 29:'11 12 13 13 13 13 13 11 11 11',
 30:'11 11 11 11 11 11 11 11 11',
 31:'10 11 11 11 10 10 13 13 11 10',
 32:'11 11 11 11 11 11 11 11 11 11',
 33:'11 11 13 13 13 13 10 10 11 11 10',
 34:'14 14 14 14 15 15 16 16 16 14',
 35:'15 15 15 15 15 15 15 15 15 14',
 36:'16 16 16 17 17 17 17 17 15 17',
 37:'15 15 15 15 15 18 18 18 15 14',
 38:'14 15 16 15 14 18 15 14 14 16',
 39:'14 15 15 15 18 15 18 15 15 14',
 40:'15 14 19 19 19 19 19 15 14 15',
 41:'14 19 19 19 20 20 20 20 20 14',
 42:'16 16 16 17 17 18 16 16 16 16',
 43:'14 14 15 15 15 15 16 16 15 14',
 44:'16 20 20 20 20 20 20 20 16 14',
 45:'15 21 21 21 21 21 21 21 22 21',
 46:'21 22 22 22 25 22 24 24 24 24',
 47:'22 23 22 22 22 22 23 23 22 23',
 48:'23 23 23 23 23 23 23 22 22 23',
 49:'22 22 22 22 22 22 22 22 24 22',
 50:'22 25 25 23 23 25 25 25 23 25',
 51:'22 24 24 24 24 22 25 22 22 24',
 52:'23 23 23 23 23 23 21 22 23 23',
 53:'23 21 21 21 23 23 22 23 22 22',
 54:'22 25 25 25 25 25 25 23 23 25',
 55:'23 23 23 23 23 23 23 23 23 23',
 56:'23 22 21 22 22 25 25 25 21 21',
 57:'26 26 26 26 26 26 26 26 28 26',
 58:'26 28 28 28 28 28 28 28 27 28',
 59:'28 30 30 30 30 30 30 30 30 30',
 60:'29 29 29 29 29 29 29 29 29 30',
 61:'27 27 27 27 27 27 27 27 27 27',
 62:'27 28 29 29 29 29 29 29 29 29',
 63:'31 31 31 31 31 31 31 31 31 31',
 64:'29 29 31 31 31 31 31 31 31 29',
 65:'30 30 30 30 30 30 30 30 30 30',
 66:'31 31 31 31 31 31 31 31 31 29',
 67:'29 29 29 29 29 29 29 27 29 29',
 68:'27 31 32 32 32 32 32 32 32 32',
 69:'33 33 34 33 34 34 34 34 34 34',
 70:'34 36 36 36 36 36 36 36 36 36',
 71:'36 35 35 35 35 35 35 35 35 36',
 72:'35 library 35 35 35 35 35 35 35 35',
 73:'34 33 33 35 35 35 35 34 35 34',
 74:'35 33 35 35 35 35 35 35 35 34',
 75:'35 33 33 37 37 37 37 37 37 37',
 76:'37 37 37 37 37 37 37 37 35 36',
 77:'36 36 36 36 36 36 38 38 38 36',
 78:'29 29 29 29 29 29 29 29 29 29',
 79:'11 11 01 11 11 11 11 11 11 11',
 80:'34 33 34 33 38 38 38 38 38 33',
 81:'39 39 40 40 40 40 40 39 40 40',
 82:'40 40 40 41 40 40 42 39 42 40',
 83:'40 40 42 40 42 42 42 42 42 40',
 84:'11 11 11 11 11 42 11 42 42 42',
 85:'41 42 43 43 43 43 43 43 41 43',
 86:'42 42 40 41 11 42 40 42 42 42',
 87:'42 42 42 42 42 42 42 42 42 42',
 88:'41 43 43 41 44 42 42 44 43 43',
 89:'44 42 43 43 43 43 43 43 44 44',
 90:'46 room 46 46 45 45 46 gate 45 46'
};
const EXISTING_LOCATIONS={inn:'north_inn',forest:'silver_forest',roots:'forest_roots',library:'library_after',room:'room_restored',gate:'gate_restored'};
for(const episode of STORY.slice(11)){
 const backdrops=PRODUCTION_LOCATIONS[episode.ep].split(' ');
 if(backdrops.length!==episode.scenes.length)throw Error('배경 연결 수가 일치하지 않습니다. EP'+episode.ep);
 episode.scenes.forEach((scene,index)=>{
  const key=backdrops[index];
  scene.bg=EXISTING_LOCATIONS[key]||'BG-'+key;
 });
}
const PRODUCTION_SCENES=new Map(STORY.flatMap(ep=>ep.scenes.map(sc=>[sc.id,sc])));
const sceneArt=(ep,sc)=>PRODUCTION_SCENES.get('EP'+String(ep).padStart(3,'0')+'_SC'+String(sc).padStart(2,'0'))?.bg;

const FIELD_ART=[
 ['01_01','silver_forest',1207,.38,.83,.19],
 ['01_02','north_inn',1202,.53,.81,.14,null,1202],
 ['01_03','north_inn',1204,.33,.82,.14,'M027',1204],
 ['01_04','north_inn',1209,.55,.85,.27,null,1301],
 ['02_01','BG-02',1205,.34,.85,.25],
 ['02_02','forest_roots',1304,.31,.85,.23,'M029'],
 ['02_03','BG-06',1604,.69,.81,.15],
 ['02_04','forest_roots',1303,.75,.86,.26,null,1303],
 ['03_01','BG-03',1306,.48,.86,.24],
 ['03_02','BG-03',2003,.45,.88,.26],
 ['03_03','BG-03',1307,.58,.74,.24,null,1405],
 ['03_04','BG-04',1406,.55,.86,.32],
 ['04_01','BG-05',1407,.36,.84,.27],
 ['04_02','BG-09',1807,.28,.56,.27],
 ['04_03','BG-07',1703,.53,.83,.30,null,1706],
 ['04_04','BG-09',2204,.60,.93,.54,'M047'],
 ['05_01','BG-11',2408,.24,.69,.17],
 ['05_02','BG-11',2404,.20,.82,.22,'M052'],
 ['05_03','BG-12',2504,.43,.80,.33],
 ['05_04','BG-12',2508,.56,.88,.26],
 ['06_01','BG-15',3406,.29,.83,.29,'M076'],
 ['06_02','BG-19',4003,.65,.74,.19],
 ['06_03','BG-17',3604,.50,.75,.27],
 ['06_04','BG-17',4205,.67,.54,.54,null,4205],
 ['07_01','BG-22',4701,.19,.59,.24,null,4705],
 ['07_02','BG-22',4706,.19,.59,.23],
 ['07_03','BG-22',4604,.30,.75,.22],
 ['07_04','BG-23',5202,.53,.79,.22],
 ['08_01','BG-26',5704,.57,.83,.23,'M136'],
 ['08_02','BG-30',5904,.36,.85,.32],
 ['08_03','BG-28',5808,.40,.83,.30],
 ['08_04','BG-26',5708,.47,.93,.30],
 ['09_01','BG-36',7002,.28,.94,.42],
 ['09_02','BG-36',7009,.72,.84,.26],
 ['09_03','BG-37',7504,.37,.81,.15],
 ['09_04','BG-38',8006,.49,.70,.42],
 ['10_01','BG-40',8104,.33,.86,.19,'M208'],
 ['10_02','BG-40',8104,.66,.83,.29,'M208'],
 ['10_03','BG-46',9004,.31,.88,.34,'M235'],
 ['10_04','BG-45',9009,.48,.76,.20],
 ['05_03','BG-10',2305,.59,.79,.26,'M050',2305],
 ['02_01','BG-16',3408,.38,.83,.25,'M077'],
 ['02_01','BG-21',4506,.48,.89,.23,'M104'],
 ['02_01','BG-33',6904,.47,.87,.24,'M172']
];
const FIELD_BY_BG=new Map();
for(const row of FIELD_ART){
 const bg=row[1];
 if(!FIELD_BY_BG.has(bg))FIELD_BY_BG.set(bg,[]);
 FIELD_BY_BG.get(bg).push(row);
}
function fieldArt(bg,episode,scene,done){
 const position=episode*100+scene;
 const overlays=(FIELD_BY_BG.get(bg)||[]).flatMap(([id,,start,x,y,w,repair,end])=>{
  if(position<start||(end&&position>end)||(repair&&!done[repair]))return [];
  return [{k:'sp-'+id,img:'props/SP-'+id+'.webp',fx:x,fy:y,w,z:1,light:id==='06_04'||id==='09_04'}];
 });
 return overlays.concat(dragonSceneArt(bg,position));
}

const DRAGON_CARE={
 nive:{name:'니베',bg:'tower_base'},
 bria:{name:'브리아',bg:'BG-03',arrival:2005,order:[4,1,2,3]},
 ignis:{name:'이그니스',bg:'BG-11',arrival:3205,order:[1,4,2,3]},
 neria:{name:'네리아',bg:'BG-20',arrival:4107,order:[3,1,2,4]},
 veil:{name:'베일',bg:'BG-24',arrival:5104,order:[2,1,4,3]},
 nox:{name:'녹스',bg:'BG-31',arrival:6604,order:[2,1,4,3]}
};
const dragonStage=(key,stage)=>'dr/stages/'+key+'_'+stage+'.webp';
const dragonPose=(key,index)=>'dr/reactions/'+key+'_'+DRAGON_CARE[key].order[index]+'.webp';
const dragonDefault=key=>key==='nive'?'dr/nive_02_hatchling.webp':dragonPose(key,0);
function dragonSceneArt(bg,pos){
 const inRange=(start,end)=>pos>=start&&pos<=end;
 const creature=(key,stage,x,y,w)=>[{k:key,img:dragonStage(key,stage),fx:x,fy:y,w,z:2}];
 if(bg==='BG-03'&&inRange(1305,2209))return creature('bria',pos<2005?'egg':'hatchling',.55,.82,pos<2005?.085:.16);
 if(bg==='BG-11'&&inRange(2908,3311)&&!inRange(3001,3201))return creature('ignis',pos<3205?'egg':'hatchling',.30,.77,pos<3205?.086:.15);
 if((bg==='BG-20'||bg==='BG-19')&&inRange(4104,4110))return creature('neria',pos<4107?'egg':'hatchling',.50,.86,.13);
 if(bg==='BG-24'&&inRange(4607,5200))return creature('veil',pos<5104?'egg':'hatchling',.42,.83,.13);
 if(bg==='BG-31'&&inRange(6305,6610))return creature('nox',pos<6604?'egg':'hatchling',.50,.85,.13);
 if(bg==='BG-36'&&inRange(7005,7710))return creature('serena',pos<7705?'sleeping':'awakening',.55,.73,.33);
 if(bg==='BG-25'&&inRange(5405,5407))return creature('aurel','wings_spread',.50,.69,.34);
 if(bg==='BG-43'&&(inRange(8503,8510)||inRange(8903,8908)))return creature('aurel',pos<8506?'sealed_sleep':'awakening',.53,.77,.30);
 if(bg==='BG-46'&&inRange(9003,9010))return [{...PR.hatch,fx:.51,fy:.82,w:.13},...creature('nox','hatchling',.72,.87,.12)];
 return [];
}

const STORY_PORTRAITS=[
 [/^아이의 어머니$/,1,[/떨|걱정|울먹|불안/,/간절|부탁|매달|애원/,/안도|미소|웃|끄덕/],2,[1,3,4]],
 [/^(?:실종 아동|구조된 아이|아이)$/,2,[/안도|고개.*끄덕|크게/,/미소|웃|호기심/]],
 [/^미라의 어머니$/,3,[/조심|머뭇|망설|대답을 찾/,/집중|연구|살피|기록|장부|종이를 보/,/미소|안도|웃|눈물/]],
 [/^유안$/,4,[/의심|경계하며|서늘/,/단호|거칠게$|힘주어/,/안도|웃|미소|경계를 조금 푼/]],
 [/^(?:숲 대표 )?리엔$/,5,[/조심|생각|진지|솔직/,/밝|미소|웃|장난/]],
 [/^주민 A$/,6,[/격앙|날카|불만|소리|언짢/,/당황|머뭇|부끄|작게/]],
 [/^주민 B$/,7,[/걱정|염려|불안/,/안도|웃|부드럽/]],
 [/^(?:광산 )?장인$/,8,[/집중|살피|생각|수레를 밀|팔을 걷/,/웃|미소/]],
 [/^(?:창고지기|항만 노동자|항만 잠수 작업자)$/,9,[/경계|걱정|씁쓸/,/설명|가리키|고개 끄덕/]],
 [/^(?:관리인|옛길 관리인)$/,10,[/경계|의심|겁먹|놀람/,/기록|설명|조용히|낮게/]],
 [/^(?:초소장|국경 초소장|경비관|야간 마을 경비)$/,11,[/경계|의심/,/단호|안내|꼼꼼히|마르켄을 향해/]],
 [/^(?:북방 )?치료사$/,12,[/관찰|환자|살피|집중|가방을 열|작게 그러나 단호/,/안도|웃|미소|고개 끄덕/]],
 [/^(?:왕궁 )?서기관$/,13,[/확인|기록|읽으며/,/난처|곤란|당황/]],
 [/^(?:왕도 )?상인$/,14,[/불만|불쾌|격앙|기분 상한|억울|입술을 씹/,/수긍|끄덕|동의|조금 풀어진|고개를 숙/]],
 [/^(?:시설 )?점검관$/,15,[/집중|살피|확인|조심스럽게|두 손을 내려다보/,/단호|설명|정직하게|고개를 든다/]]
];
function newPortrait(sp,mood,position){
 const ep=position?.e+1;
 if(sp==='어머니'){
  if(ep===65||ep===90)sp='미라의 어머니';
  else if(ep>=12&&ep<=18)sp='아이의 어머니';
 }
 if(sp==='아이'&&ep!==16&&ep!==18)return null;
 if(sp==='관리인'&&ep&&(ep<45||ep>56))return null;
 if(sp==='상인'&&ep<81)return null;
 const rule=STORY_PORTRAITS.find(([test])=>test.test(sp));
 if(!rule)return null;
 const [,id,tests,neutral=1,poses]=rule;
 const index=id===13&&ep===62&&position.s===8?1:tests.findIndex(test=>test.test(mood||''));
 const pose=index<0?neutral:poses?.[index]??index+2;
 return asset('portraits/PT-'+String(id).padStart(2,'0')+'_'+String(pose).padStart(2,'0')+'.webp');
}
const SUPPORT_PORTRAITS={
 bryn:[['03_focused',/집중|살피|일하/],['04_awkward',/어색|당황|망설/],['06_resolve',/결심|단호|진지/]],
 erian:[['03_thinking',/생각|고민/],['04_discovery',/발견|놀라/],['05_conflicted',/갈등|망설/]],
 eveline:[['03_observing',/관찰|살피/],['04_wary',/경계|의심/],['06_resolve',/결심|단호/]],
 louhi:[['03_weary',/피로|지쳐/],['04_sorrow',/슬픔|슬프|후회/],['06_resigned_smile',/웃|미소/]],
 marken:[['02_charming_smile',/웃|미소/],['05_calculating',/계산|생각/],['04_rage',/분노|화내/]],
 oswin:[['03_thinking',/생각|고민/],['04_reprimand',/꾸짖|경고|단호/],['05_regret',/후회|망설/]],
 roen:[['02_hearty_laugh',/웃|미소/],['03_stern',/단호|진지/],['05_regret',/후회|미안/]],
 sera:[['02_cold',/냉정|차갑/],['04_distrust',/의심|불신|경계/],['06_gentle_smile',/미소|웃|부드럽/]]
};

const WORKSHOP_CHAINS=[
 {from:12,items:['MI-02_01','MI-02_02','MI-02_03']},
 {from:19,items:['MI-07_01','MI-07_02','MI-07_03']},
 {from:23,items:['MI-11_01','MI-11_02','MI-11_03']},
 {from:34,items:['MI-14_01','MI-14_02']},
 {from:58,items:['MI-08_01','MI-08_02','MI-08_03','MI-08_04']}
];
for(const chain of WORKSHOP_CHAINS){
 const prefix=chain.items[0].slice(0,-2);
 chain.items=Array.from({length:6},(_,i)=>prefix+String(i+1).padStart(2,'0'));
}
const materialArt=id=>'icons/'+id+'.webp';
for(const {items} of WORKSHOP_CHAINS){
 CHAINS.push(items);
 items.forEach((id,index)=>{
  ITEMS[id]={n:PRODUCTION_ITEMS[id],next:items[index+1],raw:items[0],tier:index+1,cost:2**index};
 });
}
const workshopGroupName=['목재·석재','직물·밧줄','가구','생산기','숲길 설치','약초 제작','정원','식재·여행','드래곤 살림','드래곤 식사','광석 제련','광산·공방','항구·선박','등대·수로','신전 기록','북방 보급','치료·회복','성역 설비','왕도 복원'];
function showMaterialCatalog(root){
 const label=el('label','catalog-group','재료 분류');
 const select=el('select');
 workshopGroupName.forEach((name,index)=>select.add(new Option(name,String(index+1))));
 label.appendChild(select);
 const items=el('div','catalog-grid');
 const render=()=>{
  const prefix='MI-'+select.value.padStart(2,'0')+'_';
  items.replaceChildren(...Object.entries(PRODUCTION_ITEMS).filter(([id])=>id.startsWith(prefix)).map(([id,name])=>{
   const card=el('div','panel catalog-item');
   const picture=el('img');picture.src=asset(materialArt(id));picture.alt='';
   card.append(picture,el('span','',name));
   return card;
  }));
 };
 select.onchange=render;
 root.append(label,items);render();
}


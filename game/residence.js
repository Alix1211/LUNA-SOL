"use strict";

const residenceFurniture = {
  bed: {name:"침대", art:"bed-restored", width:30, reason:"아일라가 쉬는 자리", spots:[
    {name:"아치 옆", x:40, y:75}, {name:"창 아래", x:31, y:70}
  ]},
  chair: {name:"참나무 의자", art:"oak-chair", width:16, reason:"앉아서 쉴 자리", spots:[
    {name:"창가", x:19, y:77}, {name:"방 안쪽", x:60, y:67}
  ]},
  table: {name:"작은 탁자", art:"oak-table", width:18, reason:"등불과 작은 물건을 올리는 자리", spots:[
    {name:"침대 옆", x:56, y:76}, {name:"창 옆", x:29, y:83}
  ]}
};

const furniturePlans = {
  chair: {name:"참나무 의자 제작", inputs:["wood"], goals:["plank","plank"]},
  table: {name:"작은 탁자 제작", inputs:["wood","iron"], goals:["plank","plank","ingot"]}
};
const orderPlans = [
  {name:"공방 · 다듬은 판재", inputs:["wood"], goals:["plank"], reward:8},
  {name:"성문지기 · 쇠 걸쇠", inputs:["iron"], goals:["latch"], reward:12},
  {name:"세탁실 · 정돈한 침구", inputs:["rag"], goals:["bedroll"], reward:8}
];
const residenceStorageUpgrade = {price:24, capacity:12};
const baseStorageCapacity = 8;
const residencePlaceables = Object.keys(residenceFurniture);

function createResidence(source = {}) {
  const owned = key => source.owned?.[key] === true || key === "bed";
  const placed = {};
  for (const key of residencePlaceables) {
    const count = residenceFurniture[key].spots.length;
    const position = source.placed?.[key];
    if (owned(key) && Number.isInteger(position) && position >= 0 && position < count) placed[key] = position;
  }
  if (!Object.hasOwn(placed, "bed")) placed.bed = 0;
  return {
    owned:Object.fromEntries(residencePlaceables.map(key => [key, owned(key)])),
    placed,
    gold:Number.isSafeInteger(source.gold) && source.gold >= 0 ? source.gold : 0,
    orders:Number.isSafeInteger(source.orders) && source.orders >= 0 ? source.orders : 0,
    expanded:source.expanded === true
  };
}

function residenceJobs(home) {
  const unfinished = Object.entries(furniturePlans).filter(([id]) => !home.owned[id]);
  const order = orderPlans[home.orders % orderPlans.length];
  return Object.fromEntries([...unfinished, ["order-" + home.orders, order]].map(([id, job]) =>
    [id, {...job, id, place:"room", size:8, residence:true}]
  ));
}

function remainingGoods(goals, submitted) {
  const remaining = [...goals];
  for (const item of submitted) {
    const i = remaining.indexOf(item);
    if (i >= 0) remaining.splice(i, 1);
  }
  return remaining;
}

function chooseResidenceJob(id) {
  const job = residenceJobs(state.home)[id];
  if (!job) return;
  activeResidenceJob = id;
  atWork = true;
  selection = -1;
  status = "";
  prepareMission(job);
  persist();
  render();
}

function drawRoom() {
  const layer = $("room-objects");
  const place = scenery();
  layer.hidden = !["room","stairs","tower"].includes(place);
  layer.replaceChildren();
  if (layer.hidden) return;
  if (place === "stairs") {
    if (state.repaired.includes("M004")) putRoomSprite(layer, {x:51,y:66,width:43,path:"furniture/castle/tower-rail.webp",label:"보수한 난간"});
    return;
  }
  if (place === "tower") {
    const cleared = state.repaired.includes("M005");
    const nested = state.repaired.includes("M006");
    const discovered = nested || (state.chapter === 2 && state.scene >= 4 &&
      (activeScene().sceneId !== "EP002_SC04" || state.line >= 4));
    if (!cleared) putRoomSprite(layer, {x:43,y:77,width:29,path:"furniture/castle/tower-debris.webp",label:"부서진 선반"});
    if (nested) putRoomSprite(layer, {x:33,y:54,width:13,path:"furniture/castle/tower-nest.webp",label:"보호 둥지"});
    if (discovered) putRoomSprite(layer, {x:33,y:nested ? 51 : 52,width:7,path:"dragons/nive/stages/01_egg.webp",label:"은빛 알"});
    return;
  }
  const ready = state.repaired.includes("M003");
  const objects = ready ? state.home.placed : {bed:0};
  const sprites = Object.entries(objects).map(([key, index]) => {
    const spec = residenceFurniture[key];
    const spot = spec.spots[index];
    return {...spot, art:key === "bed" && !ready ? "bed-worn" : spec.art, label:spec.name, width:spec.width};
  });
  const table = Number.isInteger(objects.table) ? residenceFurniture.table.spots[objects.table] : null;
  sprites.push(table ? {x:table.x + .5, y:table.y - 8.1, art:"oil-lamp-lit", label:"등불", width:5.5, depth:table.y+.2} :
    {x:68, y:58, art:ready ? "oil-lamp-lit" : "oil-lamp-unlit", label:"등불", width:5.5});
  sprites.sort((a,b) => (a.depth ?? a.y) - (b.depth ?? b.y));
  for (const sprite of sprites) putRoomSprite(layer, {...sprite, path:"furniture/castle/" + sprite.art + ".webp"});
}
function putRoomSprite(layer, sprite) {
  const el = image(sprite.path, sprite.label);
  el.style.left = sprite.x + "%";
  el.style.top = sprite.y + "%";
  el.style.width = sprite.width + "%";
  layer.append(el);
}

function drawResidence() {
  const panel = $("residence");
  panel.hidden = !atResidence;
  $("scene-card").hidden = atResidence;
  if (!atResidence) return;
  $("continue-story").hidden = state.chapter === 2 && state.ended;
  $("continue-story").textContent = state.chapter === 1 ? "이야기 계속 · 2화" : "이야기 계속";
  $("residence-gold").textContent = state.home.gold.toLocaleString("ko-KR") + " 골드";
  $("residence-feedback").textContent = residenceMessage;
  $("space-controls").replaceChildren();
  for (const key of residencePlaceables) {
    if (!state.home.owned[key]) continue;
    const spec = residenceFurniture[key];
    const group = document.createElement("div");
    group.className = "furniture-choice";
    const label = document.createElement("strong");
    label.textContent = spec.name;
    group.append(label);
    spec.spots.forEach((spot, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "utility";
      button.textContent = spot.name;
      button.setAttribute("aria-label", spec.name + " · " + spot.name);
      button.setAttribute("aria-pressed", String(state.home.placed[key] === index));
      button.onclick = () => {
        state.home.placed[key] = index;
        residenceMessage = spec.name + " 배치 완료 · " + spec.reason;
        persist();
        drawRoom();
        drawResidence();
      };
      group.append(button);
    });
    $("space-controls").append(group);
  }
  $("residence-jobs").replaceChildren();
  for (const [id, job] of Object.entries(residenceJobs(state.home))) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "utility";
    const n = state.submitted[id]?.length || 0;
    button.textContent = job.name + (job.reward ? " · " + job.reward + "골드" : "") +
      (n ? " (" + n + "/" + job.goals.length + ")" : "");
    button.onclick = () => chooseResidenceJob(id);
    $("residence-jobs").append(button);
  }
  $("expand-storage").disabled = state.home.expanded || state.home.gold < residenceStorageUpgrade.price;
  $("expand-storage").textContent = state.home.expanded ? "창고 12칸 사용 중" : "창고 12칸으로 확장 · 24골드";
}

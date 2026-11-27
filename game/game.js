"use strict";

const ASSETS = "../assets/";
const directWorkshop = new URLSearchParams(location.search).has("workshop") || location.pathname.endsWith("LUNA_SOL_WORKSHOP.html");
const SAVE_KEY = directWorkshop ? "lunasol.workshop.r1" : "lunasol.castle.r1";
const BACKUP_KEY = SAVE_KEY + ".previous";
const $ = (id) => document.getElementById(id);
const items = {
  iron: ["녹슨 쇠조각", "ingot"], ingot: ["정리된 쇠조각", "latch"], latch: ["임시 걸쇠"],
  wood: ["목재 조각", "plank"], plank: ["다듬은 목재"],
  twigs: ["잔가지 묶음", "broom"], broom: ["손빗자루"],
  cracked: ["깨진 석판", "stone"], stone: ["보수용 석판"],
  rag: ["천 조각", "bedroll"], bedroll: ["정돈된 침구"], lamp: ["작은 등불"]
};
const producerNames = {
  iron:"철물함", wood:"목재 더미", twigs:"잔가지 바구니", cracked:"석재 더미", rag:"천 보관함"
};
const places = {
  gate: ["성문", "M001"], yard: ["앞마당", "M002"],
  room: ["작은 방", "M003"], garden: ["뒤뜰 정원", null],
  stairs: ["북쪽 계단", "M004"], tower: ["북쪽 탑", "M005"]
};
const missions = {
  2: {id:"M001",name:"성문 수리",place:"gate",size:4,inputs:["iron","wood"],goals:["latch","plank"]},
  4: {id:"M002",name:"현관 통로 정리",place:"yard",size:6,inputs:["twigs","cracked"],goals:["broom","stone"]},
  5: {id:"M003",name:"첫 생활 공간",place:"room",size:8,inputs:["wood","rag","twigs"],goals:["plank","bedroll","broom","lamp"]}
};
const episodes = {1:episode, 2:northTowerScenes};
const stagePlaces = ["gate","gate","gate","gate","yard","room","room"];
const portraits = {
  기본:"01_neutral", 미소:"02_warm_smile", 웃음:"02_warm_smile",
  놀람:"03_surprise", 의아:"03_surprise", 찡그림:"04_concern", 생각:"04_concern",
  조용히:"01_neutral", 안도:"02_warm_smile", "작은 웃음":"02_warm_smile"
};

function newSave() {
  const board = Array(64).fill(null);

  board[19] = "iron";
  board[20] = "iron";
  return {version:1, chapter:1, scene:0, line:0, board, storage:[], repaired:[], ended:false, submitted:{}, home:createResidence()};
}
function readSave(key) {
  try {
    const save = JSON.parse(localStorage.getItem(key));
    const chapter = save?.chapter === 2 ? 2 : 1;
    const scenes = episodes[chapter];
    if (save?.version === 1 && Array.isArray(save.board) && save.board.length === 64 &&
        Number.isInteger(save.scene) && scenes[save.scene] &&
        Number.isInteger(save.line) && save.line >= 0 && save.line <= scenes[save.scene].lines.length &&
        Array.isArray(save.repaired)) {
      save.board = save.board.map(item => items[item] ? item : null);
      save.storage = Array.isArray(save.storage) ? save.storage.filter(item => items[item]) : [];
      save.chapter = chapter;
      save.home = createResidence(save.home || {});
      const savedJobs = new Map([...Object.values(missions), ...Object.values(northTowerWorks), ...Object.values(residenceJobs(save.home))].map(job => [job.id, job]));
      const submitted = {};
      for (const [id, entry] of Object.entries(save.submitted || {})) {
        const job = savedJobs.get(id);
        if (!job || save.repaired.includes(id) || !Array.isArray(entry)) continue;
        const goods = [];
        for (const item of entry) {
          if (remainingGoods(job.goals, goods).includes(item)) goods.push(item);
        }
        if (goods.length) submitted[id] = goods;
      }
      save.submitted = submitted;
      save.recovery = items[save.recovery] ? save.recovery : null;
      return save;
    }
  } catch {}
  return null;
}
function load() {
  return readSave(SAVE_KEY) || readSave(BACKUP_KEY) || newSave();
}
// The castle household builds up its own supplies before villagers arrive.
orderPlans.splice(0, orderPlans.length,
  {name:"겨울 장작 선반 채우기", goals:["plank","plank"], reward:2},
  {name:"손님방 침구 비축", goals:["bedroll","bedroll"], reward:2},
  {name:"수리용 철물 비축", goals:["ingot","latch"], reward:3});
for (const plan of [...Object.values(furniturePlans), ...orderPlans]) plan.inputs = ["wood","iron","rag"];
let state = load();
if (directWorkshop && !state.ended && state.chapter === 1 && !state.repaired.length) {
  Object.assign(state,{scene:episode.length-1,ended:true,repaired:["M001","M002","M003"]});
}
let persistenceAvailable = true;
let atWork = false;
let selection = -1;
let status = "";
let mapOpen = false;
let visiting = null;
let atResidence = state.ended;
let activeResidenceJob = null;
let residenceMessage = "";

function persist() {
  try {
    const previous = readSave(SAVE_KEY);
    if (previous) localStorage.setItem(BACKUP_KEY, JSON.stringify(previous));
  } catch {}
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); persistenceAvailable = true; }
  catch { persistenceAvailable = false; }
}
function currentMission() {
  if (activeResidenceJob) return residenceJobs(state.home)[activeResidenceJob] ?? null;
  if (atResidence || visiting || state.ended) return null;
  const mission = scriptedMission();
  if (mission && state.line >= activeScene().lines.length && !state.repaired.includes(mission.id)) return mission;
  return null;
}
function activeScene() {
  return episodes[state.chapter][state.scene];
}
function scriptedMission() {
  return state.chapter === 1 ? missions[state.scene] : northTowerWorks[activeScene().mission];
}
function hasHome() {
  return state.chapter > 1 || state.ended;
}
function scenery() {
  if (visiting) return visiting;
  if (atResidence) return "room";
  if (state.after) return state.after;
  if (state.chapter === 2) return activeScene().place;
  if (state.scene === 3 && state.line >= 3) return "yard";
  return stagePlaces[state.scene];
}
function canVisit(place) {
  return place === "gate" || (place === "yard" && state.repaired.includes("M001")) ||
    (place === "room" && state.repaired.includes("M002")) || (place === "garden" && hasHome()) || (place === "stairs" && state.repaired.includes("M004")) ||
    (place === "tower" && state.repaired.includes("M005"));
}
function image(path, alt = "") {
  const element = document.createElement("img");
  element.src = ASSETS + path;
  element.alt = alt;
  element.draggable = false;
  return element;
}
function icon(item) {
  return image("merge/items/castle/" + item + ".webp");
}
function drawMap() {
  const nav = $("map");
  nav.hidden = !mapOpen;
  nav.replaceChildren();
  for (const [place, [name]] of Object.entries(places)) {
    if (!canVisit(place)) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "utility";
    button.textContent = name;
    button.onclick = () => {
      atResidence = place === "room" && hasHome();
      visiting = atResidence ? null : place;
      mapOpen = false;
      render();
    };
    nav.append(button);
  }
}
function drawWorld(mission) {
  const place = scenery();
  const [placeName, repairId] = places[place];
  const restored = state.repaired.includes(repairId);
  $("location").textContent = placeName;
  const layered = ["room","stairs","tower"].includes(place);
  const background = place === "room" ? "room-buildable-base" : layered ? "base" : restored ? "restored" : "before";
  const landscape = ASSETS + "backgrounds/castle/" + place + "/" + background + ".webp";
  $("world").classList.toggle("room-view", layered);
  if ($("landscape").getAttribute("src") !== landscape) $("landscape").src = landscape;
  $("places").hidden = !state.repaired.length;
  $("places").setAttribute("aria-expanded", String(mapOpen));
  drawMap();

  const scene = activeScene();
  const line = state.after ? null : scene.lines[state.line];
  const portrait = $("portrait");
  portrait.hidden = atResidence || visiting || state.ended || (!mission && line?.speaker !== "아일라");
  if (!portrait.hidden) portrait.src = ASSETS + "portraits/aila/base/" + (portraits[line?.mood] || "01_neutral") + ".png";
  $("speaker").textContent = !visiting && !state.ended && line ? line.speaker : "";
  $("scene-title").textContent = visiting ? placeName : state.after ? placeName + " 복원 완료" : state.ended ? "오늘은 여기까지" : mission ? mission.name : scene.title;
  $("copy").textContent = visiting ? (restored ? "손본 자리가 그대로 남아 있습니다." : "성의 모습을 둘러봅니다.") :
    state.after ? "복원한 모습이 저장되었습니다." :
    state.ended ? "작은 방에서 다음 일을 선택할 수 있습니다." :
    mission ? "작업대에서 필요한 물건을 만들어 이곳에 사용합니다." : line?.text || "";
  $("hotspot").hidden = !mission;
  $("hotspot-label").textContent = mission?.name || "";
  const btn = $("scene-action");
  const dialogue = !visiting && !state.ended && !state.after && !mission;
  btn.classList.toggle("dialogue-next", dialogue);
  btn.classList.toggle("primary", !dialogue);
  if (dialogue) btn.setAttribute("aria-label", "다음 대사");
  else btn.removeAttribute("aria-label");
  const afterLabel = {gate:"앞마당으로", yard:"작은 방으로", room:"대화로 돌아가기"};
  btn.textContent = dialogue ? "›" : visiting ? "이야기로 돌아가기" :
    state.ended ? "작은 방 둘러보기" : mission ? "작업대 열기" : afterLabel[state.after] || "";
}
function unlocked(i, size) {
  const border = (8 - size) / 2;
  return i % 8 >= border && i % 8 < 8 - border && Math.floor(i / 8) >= border && Math.floor(i / 8) < 8 - border;
}
function producerSlots(mission) {
  const right = (8 + mission.size) / 2 - 1;
  return new Map(mission.inputs.map((item, i) => [(2 + i) * 8 + right, item]));
}
function emptySlot(mission, origin = 29) {
  const sources = producerSlots(mission);
  const distance = i => Math.abs(i % 8 - origin % 8) + Math.abs(Math.floor(i / 8) - Math.floor(origin / 8));
  let slot = -1;
  state.board.forEach((item, i) => {
    if (!item && unlocked(i, mission.size) && !sources.has(i) &&
        (slot < 0 || distance(i) < distance(slot) || (distance(i) === distance(slot) && i % 8 > slot % 8))) slot = i;
  });
  return slot;
}
function drawBoard(mission) {
  const board = $("board");
  const focused = document.activeElement?.dataset?.cell;
  board.replaceChildren();
  const sources = producerSlots(mission);
  state.board.forEach((item, index) => {
    const button = document.createElement("button");
    const active = unlocked(index, mission.size);
    const producer = sources.get(index);
    button.type = "button";
    button.className = "cell";
    button.dataset.cell = String(index);
    button.disabled = !active;
    button.setAttribute("aria-label", !active ? "잠긴 칸" : producer ? producerNames[producer] + " · " + items[producer][0] + " 생산" : items[item]?.[0] || "빈 칸");
    if (active) button.setAttribute("aria-pressed", String(selection === index));
    if (!active) button.textContent = "·";
    else if (producer) {
      button.classList.add("source-cell");
      button.append(producer === "iron" ? image("merge/generators/box.webp") : icon(producer));
      const label = document.createElement("span");
      label.textContent = producerNames[producer];
      button.append(label);
    } else if (items[item]) {
      button.classList.add("movable");
      button.append(icon(item));
    }
    if (item && items[item]?.[1] && item === state.board[selection] && index !== selection) button.classList.add("match");
    button.onclick = () => tap(index, mission);
    board.append(button);
    if (focused === button.dataset.cell) button.focus({preventScroll:true});
  });
}
function drawWork(mission) {
  drawBoard(mission);
  $("mission-title").textContent = mission.name;
  $("mission-tip").textContent = mission.id === "M001" ?
    "같은 재료 위에 끌어 놓거나 차례로 누르면 합쳐집니다. 완성품은 납품 영역으로 끌어다 놓으세요." :
    mission.residence && mission.reward ? "필요한 물건을 납품하면 골드를 받습니다." : "완성품을 우측 납품 영역에 놓으세요.";
  $("status").textContent = status;
  const submitted = state.submitted[mission.id] || [];
  const needs = remainingGoods(mission.goals, submitted);
  $("goals").replaceChildren(...[...new Set(mission.goals)].map(item => {
    const row = document.createElement("div");
    row.className = "goal";
    const label = document.createElement("span");
    label.textContent = items[item][0];
    const count = document.createElement("strong");
    const total = mission.goals.filter(good => good === item).length;
    const delivered = total - needs.filter(good => good === item).length;
    count.textContent = delivered === total ? "✓ " + total + "/" + total : delivered + "/" + total;
    count.className = delivered === total ? "satisfied" : "";
    row.append(icon(item), label, count);
    return row;
  }));
  $("deliver-selection").setAttribute("aria-disabled", String(!needs.includes(state.board[selection])));
  $("undo-delivery").hidden = submitted.length === 0;
  $("store-item").disabled = selection < 0 || !state.board[selection] || state.storage.length >= storageCapacity();
  $("storage-count").textContent = state.storage.length + "/" + storageCapacity();
  const boardFull = emptySlot(mission) < 0;
  $("free-cell").hidden = !boardFull || state.storage.length < storageCapacity() || !state.board[selection];
  $("recover-cell").hidden = !state.recovery;
  $("recover-cell").disabled = boardFull;
  if (state.recovery) $("recover-cell").textContent = items[state.recovery][0] + " 되찾기";
  const counts = new Map();
  for (const item of state.storage) counts.set(item, (counts.get(item) || 0) + 1);
  $("stored-items").replaceChildren(...[...counts].map(([item, count]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "material";
    button.append(icon(item), items[item][0] + " ×" + count);
    button.onclick = () => {
      const slot = emptySlot(mission);
      if (slot < 0) { $("status").textContent = "꺼내려면 보드에 빈 칸이 필요합니다."; return; }
      state.storage.splice(state.storage.indexOf(item), 1);
      state.board[slot] = item;
      updateBoard(mission, slot, "produced", items[item][0] + "을(를) 꺼냈습니다.");
      $("storage").querySelector("summary").focus({preventScroll:true});
    };
    return button;
  }));
}
function updateBoard(mission, index, effect, message) {
  selection = -1;
  status = message;
  persist();
  drawWork(mission);
  if (index >= 0) $("board").children[index]?.classList.add(effect);
}
function canDrop(from, to, mission) {
  if (from === to || to < 0 || !unlocked(to, mission.size) || producerSlots(mission).has(to)) return false;
  const item = state.board[from];
  const target = state.board[to];
  return Boolean(item && (!target || (target === item && items[item][1])));
}
function drop(from, to, mission) {
  if (!canDrop(from, to, mission)) return false;
  const merged = Boolean(state.board[to]);
  const item = state.board[from];
  state.board[to] = merged ? items[item][1] : item;
  state.board[from] = null;
  updateBoard(mission, to, merged ? "merged" : "produced", items[state.board[to]][0] + (merged ? " 제작 완료" : " 이동 완료"));
  return true;
}
function tap(index, mission) {
  const producer = producerSlots(mission).get(index);
  const item = state.board[index];
  if (producer) {
    const slot = emptySlot(mission, index);
    if (slot < 0) { $("status").textContent = "보드가 가득 찼습니다. 재료를 합치거나 보관하세요."; return; }
    state.board[slot] = producer;
    updateBoard(mission, slot, "produced", items[producer][0] + " 1개 생산");
    return;
  }
  if (selection >= 0 && drop(selection, index, mission)) return;
  selection = item && selection !== index ? index : -1;
  status = selection < 0 ? "" : items[item][0] + " 선택";
  drawWork(mission);
}
function prepareMission(mission) {
  for (const index of producerSlots(mission).keys()) {
    if (!state.board[index]) continue;
    const slot = emptySlot(mission, index);
    const item = state.board[index];
    state.board[index] = null;
    if (slot >= 0) state.board[slot] = item;
    else state.storage.push(item);
  }
  if (mission.id === "M003" && !state.board.includes("lamp") && !state.storage.includes("lamp")) {
    const slot = emptySlot(mission);
    if (slot >= 0) state.board[slot] = "lamp";
    else state.storage.push("lamp");
  }
}

const board = $("board");
const dragThreshold = 6;
const mergeFlightTime = 150;
let drag = null;
let suppressClick = false;
document.addEventListener("pointerdown", () => { suppressClick = false; }, true);
document.addEventListener("click", event => {
  if (!suppressClick || !event.isTrusted || (!event.pointerType && event.detail === 0)) return;
  suppressClick = false;
  event.stopImmediatePropagation();
}, true);

function cellAt(x, y) {
  const cell = document.elementFromPoint(x, y)?.closest(".cell");
  return cell && board.contains(cell) ? Number(cell.dataset.cell) : -1;
}
function clearHover() {
  board.querySelector(".drop-ready")?.classList.remove("drop-ready");
  $("deliver-selection").classList.remove("delivery-highlight");
}
function cancelDrag() {
  if (!drag) return;
  const active = drag;
  drag = null;
  clearHover();
  active.ghost?.remove();
  active.cell.classList.remove("drag-origin");
  if (active.cell.hasPointerCapture?.(active.id)) active.cell.releasePointerCapture(active.id);
}
function startDrag(event) {
  if (event.isPrimary === false || event.button !== 0 || !atWork || drag) return;
  suppressClick = false;
  const cell = event.target.closest(".cell");
  if (!cell || cell.disabled) return;
  drag = {
    id:event.pointerId, from:Number(cell.dataset.cell), cell,
    x:event.clientX, y:event.clientY, ghost:null, movable:cell.classList.contains("movable")
  };
  // Capture on the original cell from contact, including quick swipes across a cell edge.
  // A stationary touch still generates the cell's normal click.
  try { cell.setPointerCapture(event.pointerId); }
  catch { /* Window listeners still track this pointer if capture is unavailable. */ }
}
function moveDrag(event) {
  if (drag?.id !== event.pointerId || !drag.movable) return;
  if (!drag.ghost) {
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < dragThreshold) return;
    drag.ghost = icon(state.board[drag.from]);
    drag.ghost.className = "drag-ghost";
    drag.ghost.style.width = drag.cell.offsetWidth + "px";
    drag.ghost.style.height = drag.cell.offsetHeight + "px";
    document.body.append(drag.ghost);
    drag.cell.classList.add("drag-origin");
  }
  if (event.cancelable) event.preventDefault();
  drag.ghost.style.left = event.clientX + "px";
  drag.ghost.style.top = event.clientY + "px";
  clearHover();
  const to = cellAt(event.clientX, event.clientY);
  const mission = currentMission();
  const destination = document.elementFromPoint(event.clientX, event.clientY);
  const onDelivery = destination?.closest("#deliver-selection, #goals");
  const goods = mission && remainingGoods(mission.goals, state.submitted[mission.id] || []);
  $("deliver-selection").classList.toggle("delivery-highlight", Boolean(onDelivery && goods?.includes(state.board[drag.from])));
  if (mission && canDrop(drag.from, to, mission)) board.children[to].classList.add("drop-ready");
}
function animateMerge(item, dragged, target) {
  if (!Element.prototype.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const x = target.left + target.width / 2;
  const y = target.top + target.height / 2;
  for (const [start, scale] of [[dragged,.35],[target,.45]]) {
    const sprite = icon(item);
    sprite.className = "merge-flight";
    Object.assign(sprite.style,{left:start.left+"px",top:start.top+"px",width:start.width+"px",height:start.height+"px"});
    document.body.append(sprite);
    const dx = x - start.left - start.width / 2;
    const dy = y - start.top - start.height / 2;
    const motion = sprite.animate([
      {transform:"scale(1)",opacity:1},
      {transform:`translate(${dx}px,${dy}px) scale(${scale})`,opacity:.15}
    ], {duration:mergeFlightTime,easing:"cubic-bezier(.3,.14,.75,1)"});
    motion.onfinish = motion.oncancel = () => sprite.remove();
  }
}
function endDrag(event) {
  if (drag?.id !== event.pointerId) return;
  const {from, ghost, movable} = drag;
  const moved = ghost || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= dragThreshold;
  const to = cellAt(event.clientX, event.clientY);
  const mission = currentMission();
  if (!moved || !movable) {
    cancelDrag();
    // Some touch browsers discard the first synthesized click after a drag.
    if (event.pointerType === "touch" || event.pointerType === "pen" || moved) {
      suppressClick = true;
      if (!moved && mission && from === to) tap(from, mission);
    }
    return;
  }
  suppressClick = true;
  const allowed = mission && canDrop(from, to, mission);
  const merged = allowed && Boolean(state.board[to]);
  const oldItem = state.board[from];
  const dragged = merged ? (ghost ?? drag.cell).getBoundingClientRect() : null;
  const target = merged ? board.children[to].getBoundingClientRect() : null;
  const onDelivery = document.elementFromPoint(event.clientX, event.clientY)?.closest("#deliver-selection, #goals");
  cancelDrag();
  if (onDelivery && mission) {
    deliver(from, mission);
    return;
  }
  if (allowed) {
    drop(from, to, mission);
    if (merged) {
      board.children[to].classList.add("drag-merged");
      animateMerge(oldItem, dragged, target);
    }
  } else {
    board.children[from]?.classList.remove("returned");
    requestAnimationFrame(() => board.children[from]?.classList.add("returned"));
    $("status").textContent = "재료를 원래 칸에 두었습니다.";
  }
}
board.addEventListener("pointerdown", startDrag);
window.addEventListener("pointermove", moveDrag, {passive:false});
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", event => { if (drag?.id === event.pointerId) cancelDrag(); });
window.addEventListener("blur", cancelDrag);
board.addEventListener("lostpointercapture", event => { if (drag?.id === event.pointerId) cancelDrag(); });
function drawWorkshopChoices(mission) {
  let box = $("work-choices");
  if (!box) {
    box = document.createElement("div"); box.id = "work-choices";
    $("mission-title").before(box);
  }
  box.replaceChildren();
  if (!mission.residence) return;
  $("mission-tip").textContent = status || (mission.id === "chair" ? "아일라　“침대 끝에 걸터앉아 먹는 것도 어제까지야. 창가에 의자 하나 놓자.”" : mission.id === "table" ? "아일라　“찻잔을 바닥에 두니까 자꾸 발에 걸리네. 작은 탁자면 되겠어.”" : "아일라　“다음에 또 찾으러 다니지 않게, 쓰고 남은 건 여기다 모아 두자.”");
  for (const job of Object.values(residenceJobs(state.home))) {
    const b = document.createElement("button");
    b.className = "utility"; b.textContent = job.name; b.disabled = job.id === mission.id;
    b.onclick = () => chooseResidenceJob(job.id); box.append(b);
  }
  if (mission.reward) $("mission-tip").textContent += "  비축 +" + mission.reward + " · 비축 4마다 창고 한 칸 확장 (최대 8칸)";
}
function enterWorkshop() {
  atResidence = true;
  chooseResidenceJob(Object.keys(residenceJobs(state.home))[0]);
}
function render() {
  const mission = currentMission();
  atWork = Boolean(atWork && mission);
  if (!atWork) activeResidenceJob = null;
  $("world").hidden = atWork;
  $("work").hidden = !atWork;
  if (atWork) {
    $("work-bg").src = $("landscape").src;
    drawWork(mission);
    drawWorkshopChoices(mission);
  }
  else {
    drawWorld(mission);
    drawRoom();
    drawResidence();
    syncWorkshopLabels();
  }
  if (!persistenceAvailable) $("location").title = "이 브라우저에서는 진행을 저장할 수 없습니다.";
}
function advance() {
  if (visiting) { visiting = null; atResidence = hasHome(); }
  else if (state.ended) atResidence = true;
  else if (state.after) state.after = null;
  else if (currentMission()) {
    atWork = true;
    prepareMission(currentMission());
  } else if (!state.ended) {
    if (state.line + 1 < activeScene().lines.length) state.line++;
    else if (scriptedMission()) state.line = activeScene().lines.length;
    else if (state.scene + 1 < episodes[state.chapter].length) { state.scene++; state.line = 0; }
    else { state.ended = true; enterWorkshop(); return; }
  }
  persist();
  render();
}
$("scene-action").onclick = advance;
$("hotspot").onclick = advance;
$("back").onclick = () => { cancelDrag(); atWork = false; selection = -1; activeResidenceJob = null; render(); };
$("places").onclick = () => { cancelDrag(); if (atWork) atWork = false; mapOpen = !mapOpen; render(); };
function storageCapacity() {
  return (state.home.expanded ? residenceStorageUpgrade.capacity : baseStorageCapacity) + Math.min(8, Math.floor(state.home.gold / 4));
}
function deliver(index, mission) {
  const item = state.board[index];
  const submitted = state.submitted[mission.id] ?? [];
  const needs = remainingGoods(mission.goals, submitted);
  if (!needs.includes(item)) {
    $("status").textContent = "이 작업에 필요한 물건을 선택해 납품하세요.";
    return;
  }
  submitted.push(item);
  state.board[index] = null;
  state.submitted[mission.id] = submitted;
  if (submitted.length < mission.goals.length) {
    updateBoard(mission, -1, "", items[item][0] + " 납품 완료");
    return;
  }
  delete state.submitted[mission.id];
  if (mission.residence) {
    if (mission.reward) {
      state.home.gold += mission.reward;
      state.home.orders += 1;
      residenceMessage = "비축 완료 · 창고 " + storageCapacity() + "칸";
    } else {
      state.home.owned[mission.id] = true;
      state.home.placed[mission.id] = 0;
      residenceMessage = residenceFurniture[mission.id].name + " 완성 · 작은 방에 놓았습니다.";
    }
    enterWorkshop();
    status = residenceMessage;
    render(); return;
  } else {
    state.repaired.push(mission.id);
    if (state.chapter === 1) state.after = mission.place;
    state.scene++;
    state.line = 0;
  }
  atWork = false;
  activeResidenceJob = null;
  selection = -1;
  status = "";
  persist();
  render();
}
$("deliver-selection").onclick = () => {
  const mission = currentMission();
  if (mission) deliver(selection, mission);
};
$("undo-delivery").onclick = () => {
  const mission = currentMission();
  const goods = mission && state.submitted[mission.id];
  if (!goods?.length) return;
  const free = emptySlot(mission);
  if (free < 0) {
    $("status").textContent = "물건을 되찾으려면 보드에 빈칸을 확보하세요.";
    return;
  }
  state.board[free] = goods.pop();
  updateBoard(mission, free, "produced", "최근 납품을 되찾았습니다.");
};
$("continue-story").onclick = () => {
  if (!atResidence || (state.chapter === 2 && state.ended)) return;
  if (state.chapter === 1 && state.ended) {
    state.chapter = 2;
    state.scene = 0;
    state.line = 0;
    state.ended = false;
  }
  atResidence = false;
  visiting = null;
  persist();
  render();
};
$("expand-storage").onclick = () => {
  if (state.home.expanded || state.home.gold < residenceStorageUpgrade.price) return;
  state.home.gold -= residenceStorageUpgrade.price;
  state.home.expanded = true;
  residenceMessage = "창고를 12칸으로 확장했습니다.";
  persist();
  drawResidence();
};
$("store-item").onclick = () => {
  const mission = currentMission();
  const item = state.board[selection];
  if (!mission || !item || state.storage.length >= storageCapacity()) return;
  state.storage.push(item);
  state.board[selection] = null;
  updateBoard(mission, -1, "", items[item][0] + " 보관 완료");
  $("storage").querySelector("summary").focus({preventScroll:true});
};
$("free-cell").onclick = () => {
  const mission = currentMission();
  const item = state.board[selection];
  if (!mission || !item || emptySlot(mission) >= 0 || state.storage.length < storageCapacity()) return;
  if (state.recovery && !window.confirm("보관한 회수품이 새 물건으로 바뀝니다. 계속할까요?")) return;
  state.recovery = item;
  state.board[selection] = null;
  updateBoard(mission, -1, "", items[item][0] + "을(를) 임시 회수했습니다.");
};
$("recover-cell").onclick = () => {
  const mission = currentMission();
  const free = mission ? emptySlot(mission) : -1;
  if (free < 0 || !state.recovery) return;
  state.board[free] = state.recovery;
  state.recovery = null;
  updateBoard(mission, free, "produced", "회수한 물건을 되찾았습니다.");
};
// Complete work-panel touches at pointer-up, including the first tap after a board drag.
for (const key of ["deliver-selection", "undo-delivery", "store-item", "free-cell", "recover-cell"]) {
  const button = $(key);
  let touchId = null;
  button.addEventListener("pointerdown", event => {
    if (event.pointerType === "touch" || event.pointerType === "pen") touchId = event.pointerId;
  });
  button.addEventListener("pointercancel", () => { touchId = null; });
  button.addEventListener("pointerup", event => {
    if (event.pointerId !== touchId) return;
    touchId = null;
    if (!button.contains(document.elementFromPoint(event.clientX, event.clientY))) return;
    suppressClick = true;
    button.click();
  });
}
const fullscreen = $("fullscreen");
async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else if (document.fullscreenEnabled) {
    try { await document.documentElement.requestFullscreen(); }
    catch { fullscreen.title = "브라우저에서 전체화면을 허용하지 않습니다."; }
  }
}
function updateFullscreen() {
  const active = Boolean(document.fullscreenElement);
  fullscreen.disabled = !document.fullscreenEnabled && !active;
  if (fullscreen.disabled) fullscreen.title = "이 브라우저에서는 전체화면을 지원하지 않습니다.";
  fullscreen.setAttribute("aria-pressed", String(active));
  fullscreen.textContent = active ? "↙ 전체화면 종료" : "⛶ 전체화면";
}
fullscreen.onclick = toggleFullscreen;
document.addEventListener("fullscreenchange", updateFullscreen);
updateFullscreen();
$("residence-jobs").previousElementSibling.textContent = "내 작업대";
function syncWorkshopLabels() {
  $("residence-gold").textContent = "생활 비축 " + state.home.gold;
  $("expand-storage").hidden = true;
  for (const button of $("residence-jobs").children) button.textContent = button.textContent.replace(/골드/g," 비축");
}
if (state.ended) { render(); enterWorkshop(); } else render();

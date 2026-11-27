"use strict";

const ASSETS = "../assets/";
const SAVE_KEY = "lunasol.castle.r1";
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
  room: ["작은 방", "M003"], garden: ["뒤뜰 정원", null]
};
const missions = {
  2: {id:"M001",name:"성문 수리",place:"gate",size:4,inputs:["iron","wood"],goals:["latch","plank"]},
  4: {id:"M002",name:"현관 통로 정리",place:"yard",size:6,inputs:["twigs","cracked"],goals:["broom","stone"]},
  5: {id:"M003",name:"첫 생활 공간",place:"room",size:8,inputs:["wood","rag","twigs"],goals:["plank","bedroll","broom","lamp"]}
};
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
  return {version:1, scene:0, line:0, board, storage:[], repaired:[], ended:false};
}
function load() {
  try {
    const save = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (save?.version === 1 && Array.isArray(save.board) && save.board.length === 64 &&
        Number.isInteger(save.scene) && episode[save.scene] &&
        Number.isInteger(save.line) && save.line >= 0 && save.line <= episode[save.scene].lines.length &&
        Array.isArray(save.repaired)) {
      save.board = save.board.map(item => items[item] ? item : null);
      save.storage = Array.isArray(save.storage) ? save.storage.filter(item => items[item]) : [];
      return save;
    }
  } catch {}
  return newSave();
}
let state = load();
let persistenceAvailable = true;
let atWork = false;
let selection = -1;
let status = "";
let mapOpen = false;
let visiting = null;

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch { persistenceAvailable = false; }
}
function currentMission() {
  if (visiting || state.ended) return null;
  const mission = missions[state.scene];
  if (mission && state.line >= episode[state.scene].lines.length && !state.repaired.includes(mission.id)) return mission;
  return null;
}
function scenery() {
  if (visiting || state.after) return visiting || state.after;
  if (state.scene === 3 && state.line >= 3) return "yard";
  return stagePlaces[state.scene];
}
function canVisit(place) {
  return place === "gate" || (place === "yard" && state.repaired.includes("M001")) ||
    (place === "room" && state.repaired.includes("M002")) || (place === "garden" && state.ended);
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
    button.onclick = () => {visiting = place; mapOpen = false; render();};
    nav.append(button);
  }
}
function drawWorld(mission) {
  const place = scenery();
  const [placeName, repairId] = places[place];
  const restored = state.repaired.includes(repairId);
  $("location").textContent = placeName;
  const landscape = ASSETS + "backgrounds/castle/" + place + "/" + (restored ? "restored" : "before") + ".webp";
  if ($("landscape").getAttribute("src") !== landscape) $("landscape").src = landscape;
  $("places").hidden = !state.repaired.length;
  $("places").setAttribute("aria-expanded", String(mapOpen));
  drawMap();

  const scene = episode[state.scene];
  const line = state.after ? null : scene.lines[state.line];
  const portrait = $("portrait");
  portrait.hidden = visiting || state.ended || (!mission && line?.speaker !== "아일라");
  if (!portrait.hidden) portrait.src = ASSETS + "portraits/aila/base/" + (portraits[line?.mood] || "01_neutral") + ".png";
  $("speaker").textContent = !visiting && !state.ended && line ? line.speaker : "";
  $("scene-title").textContent = visiting ? placeName : state.after ? placeName + " 복원 완료" : state.ended ? "오늘은 여기까지" : mission ? mission.name : scene.title;
  $("copy").textContent = visiting ? (restored ? "손본 자리가 그대로 남아 있습니다." : "성의 모습을 둘러봅니다.") :
    state.after ? "복원한 모습이 저장되었습니다." :
    state.ended ? "1화 「오래된 상속장」을 완료했습니다." :
    mission ? "작업대에서 필요한 물건을 만들어 이곳에 사용합니다." : line?.text || "";
  $("hotspot").hidden = !mission;
  $("hotspot-label").textContent = mission?.name || "";
  const btn = $("scene-action");
  const dialogue = !visiting && !state.ended && !state.after && !mission;
  btn.hidden = state.ended && !visiting;
  btn.classList.toggle("dialogue-next", dialogue);
  btn.classList.toggle("primary", !dialogue);
  if (dialogue) btn.setAttribute("aria-label", "다음 대사");
  else btn.removeAttribute("aria-label");
  const afterLabel = {gate:"앞마당으로", yard:"작은 방으로", room:"대화로 돌아가기"};
  btn.textContent = dialogue ? "›" : visiting ? "이야기로 돌아가기" :
    mission ? "작업대 열기" : afterLabel[state.after] || "";
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
  $("mission-tip").textContent = "오른쪽 금빛 생산기를 누르세요. 같은 재료 위로 끌어 놓거나 두 칸을 차례로 탭하면 합쳐집니다.";
  $("status").textContent = status || "필요한 물건을 모두 만들면 복원할 수 있습니다.";
  $("goals").replaceChildren(...mission.goals.map(item => {
    const row = document.createElement("div");
    row.className = "goal";
    const label = document.createElement("span");
    label.textContent = items[item][0];
    const count = document.createElement("strong");
    const has = state.board.includes(item);
    count.textContent = has ? "✓ 1/1" : "0/1";
    count.className = has ? "satisfied" : "";
    row.append(icon(item), label, count);
    return row;
  }));
  $("apply").disabled = !mission.goals.every(item => state.board.includes(item));
  $("store-item").disabled = selection < 0 || !state.board[selection];
  $("storage-count").textContent = String(state.storage.length);
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

function cellAt(x, y) {
  const cell = document.elementFromPoint(x, y)?.closest(".cell");
  return cell && board.contains(cell) ? Number(cell.dataset.cell) : -1;
}
function clearHover() {
  board.querySelector(".drop-ready")?.classList.remove("drop-ready");
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
  cancelDrag();
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
board.addEventListener("click", event => {
  if (!suppressClick || event.detail === 0) return;
  suppressClick = false;
  event.stopImmediatePropagation();
}, true);

function render() {
  const mission = currentMission();
  atWork = Boolean(atWork && mission);
  $("world").hidden = atWork;
  $("work").hidden = !atWork;
  if (atWork) {
    $("work-bg").src = $("landscape").src;
    drawWork(mission);
  }
  else drawWorld(mission);
  if (!persistenceAvailable) $("location").title = "이 브라우저에서는 진행을 저장할 수 없습니다.";
}
function advance() {
  if (visiting) visiting = null;
  else if (state.after) state.after = null;
  else if (currentMission()) {
    atWork = true;
    prepareMission(currentMission());
  } else if (!state.ended) {
    if (state.line + 1 < episode[state.scene].lines.length) state.line++;
    else if (missions[state.scene]) state.line = episode[state.scene].lines.length;
    else if (state.scene + 1 < episode.length) { state.scene++; state.line = 0; }
    else state.ended = true;
  }
  persist();
  render();
}
$("scene-action").onclick = advance;
$("hotspot").onclick = advance;
$("back").onclick = () => { cancelDrag(); atWork = false; selection = -1; render(); };
$("places").onclick = () => { cancelDrag(); if (atWork) atWork = false; mapOpen = !mapOpen; render(); };
$("apply").onclick = () => {
  const mission = currentMission();
  if (!mission || !mission.goals.every(item => state.board.includes(item))) return;
  cancelDrag();
  for (const item of mission.goals) state.board[state.board.indexOf(item)] = null;
  state.repaired.push(mission.id);
  state.after = mission.place;
  state.scene++;
  state.line = 0;
  atWork = false;
  selection = -1;

  status = "";
  persist();
  render();
};
$("store-item").onclick = () => {
  const mission = currentMission();
  const item = state.board[selection];
  if (!mission || !item) return;
  state.storage.push(item);
  state.board[selection] = null;
  updateBoard(mission, -1, "", items[item][0] + " 보관 완료");
  $("storage").querySelector("summary").focus({preventScroll:true});
};
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
render();

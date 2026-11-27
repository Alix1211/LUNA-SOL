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
  board[18] = "box";
  board[19] = "iron";
  board[20] = "iron";
  return {version:1, scene:0, line:0, board, repaired:[], ended:false};
}
function load() {
  try {
    const save = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (save?.version === 1 && Array.isArray(save.board) && save.board.length === 64 &&
        Number.isInteger(save.scene) && episode[save.scene] &&
        Number.isInteger(save.line) && save.line >= 0 && save.line <= episode[save.scene].lines.length &&
        Array.isArray(save.repaired)) return save;
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
  btn.hidden = state.ended && !visiting;
  btn.textContent = visiting ? "이야기로 돌아가기" : mission ? "작업대 열기" : "계속";
}
function unlocked(i, size) {
  const border = (8 - size) / 2;
  return i % 8 >= border && i % 8 < 8 - border && Math.floor(i / 8) >= border && Math.floor(i / 8) < 8 - border;
}
function drawBoard(mission) {
  const board = $("board");
  const focused = document.activeElement?.dataset?.cell;
  board.replaceChildren();
  state.board.forEach((item, index) => {
    const button = document.createElement("button");
    const active = unlocked(index, mission.size);
    button.type = "button";
    button.className = "cell";
    button.dataset.cell = String(index);
    button.disabled = !active;
    button.setAttribute("aria-label", !active ? "잠긴 칸" : item === "box" ? "공구 상자" : items[item]?.[0] || "빈 칸");
    if (active) button.setAttribute("aria-pressed", String(selection === index));
    if (!active) button.textContent = "·";
    else if (item === "box") {
      button.classList.add("source-cell");
      button.append(image("merge/generators/box.webp"));
      button.setAttribute("aria-controls", "sources");
    } else if (items[item]) button.append(icon(item));
    if (item && items[item]?.[1] && item === state.board[selection] && index !== selection) button.classList.add("match");
    button.onclick = () => tap(index, mission);
    board.append(button);
    if (focused === button.dataset.cell) button.focus({preventScroll:true});
  });
}
function drawWork(mission) {
  drawBoard(mission);
  $("mission-title").textContent = mission.name;
  $("mission-tip").textContent = "공구 상자에서 재료를 꺼내고, 같은 물건 두 개를 차례로 탭하세요.";
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
  const empty = state.board.findIndex((item, i) => !item && unlocked(i, mission.size));
  $("supply-status").textContent = empty < 0 ? "빈 칸이 필요합니다. 재료를 합치거나 반환하세요." : "";
  const options = mission.inputs.map(item => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "material";
    b.disabled = empty < 0;
    b.append(icon(item), items[item][0]);
    b.onclick = () => {state.board[empty] = item; status = items[item][0] + "을(를) 꺼냈습니다."; persist(); drawWork(mission);
      $("supply-status").textContent = [status, $("supply-status").textContent].filter(Boolean).join(" ");
      const next = $("source-items").children[mission.inputs.indexOf(item)];
      if (next && !next.disabled) next.focus({preventScroll:true});
      else $("supply-title").focus({preventScroll:true});
    };
    return b;
  });
  if (selection >= 0 && state.board[selection] && !mission.goals.includes(state.board[selection])) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "material";
    b.textContent = "선택 재료 반환";
    b.onclick = () => {state.board[selection] = null; selection = -1; status = "재료를 공구 상자에 반환했습니다."; persist(); drawWork(mission);};
    options.push(b);
  }
  $("source-items").replaceChildren(...options);
}
function tap(index, mission) {
  const item = state.board[index];
  if (item === "box") {
    $("supply-title").focus();
    $("sources").scrollIntoView({block:"nearest"});
    $("supply-status").textContent = "필요한 재료를 선택하세요.";
    return;
  } else if (selection === index) {
    selection = -1;
  } else if (selection >= 0 && item && item === state.board[selection] && items[item]?.[1]) {
    state.board[index] = items[item][1];
    state.board[selection] = null;
    status = items[state.board[index]][0] + " 제작 완료";
    selection = -1;
    persist();
  } else if (!item && selection >= 0) {
    state.board[index] = state.board[selection];
    state.board[selection] = null;
    selection = -1;
    persist();
  } else if (item) {
    selection = index;
    status = items[item][0] + " 선택";
  }
  drawWork(mission);
}
function prepareMission() {
  if (currentMission()?.id === "M003" && !state.board.includes("lamp")) {
    const free = state.board.indexOf(null);
    if (free >= 0) state.board[free] = "lamp";
  }
}
function render() {
  const mission = currentMission();
  atWork = Boolean(atWork && mission);
  $("world").hidden = atWork;
  $("work").hidden = !atWork;
  if (atWork) drawWork(mission);
  else drawWorld(mission);
  if (!persistenceAvailable) $("location").title = "이 브라우저에서는 진행을 저장할 수 없습니다.";
}
function advance() {
  if (visiting) visiting = null;
  else if (state.after) state.after = null;
  else if (currentMission()) {
    atWork = true;
    prepareMission();
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
$("back").onclick = () => { atWork = false; selection = -1; render(); };
$("places").onclick = () => { if (atWork) atWork = false; mapOpen = !mapOpen; render(); };
$("apply").onclick = () => {
  const mission = currentMission();
  if (!mission || !mission.goals.every(item => state.board.includes(item))) return;
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
render();

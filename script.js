const elevators = [
  { id: "ELV1", name: "ELV1_北塔客梯A", area: "北塔", status: "running", label: "上行", floor: 18, temp: 24.5, humidity: 48, current: 3.8, power: 0.86, target: 24, fan: "中速", mode: "制冷", acOn: true, trips: 328, alarm: false, updatedAt: "2026-07-30 10:58:22" },
  { id: "ELV2", name: "ELV2_北塔客梯B", area: "北塔", status: "idle", label: "待机", floor: 26, temp: 25.1, humidity: 51, current: 3.4, power: 0.78, target: 25, fan: "低速", mode: "制冷", acOn: true, trips: 286, alarm: false, updatedAt: "2026-07-30 10:57:05" },
  { id: "ELV3", name: "ELV3_南塔客梯A", area: "南塔", status: "running", label: "下行", floor: 9, temp: 23.8, humidity: 46, current: 4.1, power: 0.92, target: 24, fan: "高速", mode: "制冷", acOn: true, trips: 341, alarm: false, updatedAt: "2026-07-30 10:58:49" },
  { id: "ELV4", name: "ELV4_南塔客梯B", area: "南塔", status: "alarm", label: "告警", floor: 32, temp: 28.2, humidity: 61, current: 5.2, power: 1.18, target: 25, fan: "高速", mode: "制冷", acOn: true, trips: 301, alarm: true, updatedAt: "2026-07-30 10:55:31" },
  { id: "ELV5", name: "ELV5_宴会厅直梯", area: "宴会厅", status: "idle", label: "待机", floor: 2, temp: 24.0, humidity: 49, current: 2.9, power: 0.66, target: 24, fan: "中速", mode: "除湿", acOn: true, trips: 126, alarm: false, updatedAt: "2026-07-30 10:56:18" },
  { id: "ELV6", name: "ELV6_行政楼层梯", area: "行政楼层", status: "running", label: "上行", floor: 38, temp: 23.4, humidity: 45, current: 3.1, power: 0.72, target: 23.5, fan: "中速", mode: "制热", acOn: true, trips: 214, alarm: false, updatedAt: "2026-07-30 10:59:03" },
  { id: "ELV7", name: "ELV7_服务直梯", area: "服务区", status: "idle", label: "待机", floor: 6, temp: 25.8, humidity: 54, current: 3.0, power: 0.69, target: 26, fan: "低速", mode: "送风", acOn: true, trips: 198, alarm: false, updatedAt: "2026-07-30 10:57:42" },
  { id: "ELV8", name: "ELV8_消防兼服务梯", area: "服务区", status: "offline", label: "离线", floor: 1, temp: 0, humidity: 0, current: 0, power: 0, target: 0, fan: "低速", mode: "制冷", acOn: false, trips: 48, alarm: false, updatedAt: "---" }
];

let selectedId = elevators[0].id;
let selectedArea = null; /* null = 全部区域 */
const expandedAreas = new Set(["北塔", "南塔", "宴会厅", "行政楼层", "服务区"]);
let statusFilter = "all";

const batchList = document.querySelector("#batchList");
const elevatorCards = document.querySelector("#elevatorCards");
const emptyStatePanel = document.querySelector("#emptyStatePanel");
const listEl = document.querySelector("#elevatorList");
const searchInput = document.querySelector("#searchInput");
const checkedCount = document.querySelector("#checkedCount");
const logBox = document.querySelector("#logText");
const batchControls = [
  document.querySelector("#selectAllBatch"),
  document.querySelector("#applyBatch"),
  document.querySelector("#applyBatchPowerOn"),
  document.querySelector("#applyBatchPowerOff"),
];

function statusText(item) {
  if (item.alarm) return "告警";
  const map = {
    running: "运行",
    idle: "待机",
    offline: "离线"
  };
  return map[item.status] || item.label || "待机";
}

function clampTemp(value) {
  return Math.min(28, Math.max(18, Number(value)));
}

function selectedElevator() {
  return elevators.find((item) => item.id === selectedId) || elevators[0];
}

function formatTemp(value) {
  return value ? `${Number(value).toFixed(1)}℃` : "-";
}

function formatMetric(value, unit, digits = 0) {
  return value ? `${Number(value).toFixed(digits)}${unit}` : "-";
}

function areaElevators() {
  if (selectedArea === null) return elevators;
  return elevators.filter((item) => item.area === selectedArea);
}

function filteredElevators() {
  return areaElevators().filter((item) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "on") return item.acOn && !item.alarm && item.status !== "offline";
    if (statusFilter === "off") return !item.acOn && !item.alarm && item.status !== "offline";
    if (statusFilter === "fault") return item.alarm || item.status === "offline";
    return true;
  });
}

function renderList() {
  if (!listEl || !searchInput) return;
  const keyword = searchInput.value.trim().toLowerCase();
  listEl.innerHTML = "";

  /* ---- 全部区域按钮 ---- */
  const allBtn = document.createElement("button");
  allBtn.className = `area-all-btn ${selectedArea === null ? "selected" : ""}`;
  allBtn.type = "button";
  allBtn.innerHTML = `
    <svg class="area-all-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="14" rx="1"/>
      <rect width="7" height="7" x="3" y="14" rx="1"/>
    </svg>
    <span>全部区域</span>
    <span class="region-count">${elevators.length}</span>
  `;
  allBtn.addEventListener("click", () => {
    selectedArea = null;
    render();
  });
  listEl.appendChild(allBtn);

  /* ---- 按区域分组 ---- */
  const areaMap = new Map();
  elevators.forEach((item) => {
    if (!areaMap.has(item.area)) areaMap.set(item.area, []);
    areaMap.get(item.area).push(item);
  });

  areaMap.forEach((devices, area) => {
    const filtered = keyword
      ? devices.filter(
          (item) => item.name.toLowerCase().includes(keyword) || item.id.toLowerCase().includes(keyword)
        )
      : devices;

    if (keyword && filtered.length === 0) return;

    const group = document.createElement("div");
    group.className = "region-group";

    const isExpanded = keyword || expandedAreas.has(area);
    const isSelected = selectedArea === area;

    /* 区域头 */
    const header = document.createElement("button");
    header.className = `region-header ${isSelected ? "selected" : ""}`;
    header.type = "button";
    header.innerHTML = `
      <svg class="region-arrow ${isExpanded ? "expanded" : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 18 6-6-6-6"/>
      </svg>
      <span class="region-name">${area}</span>
      <span class="region-count">${devices.length}</span>
    `;
    header.addEventListener("click", () => {
      if (selectedArea === area) {
        /* 点已选区域：仅切换展开/折叠 */
        if (expandedAreas.has(area)) {
          expandedAreas.delete(area);
        } else {
          expandedAreas.add(area);
        }
      } else {
        /* 点未选区域：选中并展开 */
        selectedArea = area;
        expandedAreas.add(area);
        const firstInArea = devices.find((d) => d.status !== "offline") || devices[0];
        if (firstInArea) selectedId = firstInArea.id;
      }
      render();
    });
    group.appendChild(header);

    /* 子设备列表 */
    const children = document.createElement("div");
    children.className = `region-children ${isExpanded ? "" : "collapsed"}`;
    filtered.forEach((item) => {
      const button = document.createElement("button");
      button.className = `elevator-item ${item.id === selectedId ? "selected" : ""}`;
      button.type = "button";
      button.innerHTML = `<span>${item.name}</span>`;
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedId = item.id;
        selectedArea = item.area;
        if (!expandedAreas.has(item.area)) expandedAreas.add(item.area);
        render();
      });
      children.appendChild(button);
    });
    group.appendChild(children);

    listEl.appendChild(group);
  });
}

function renderElevatorCards() {
  elevatorCards.innerHTML = "";
  const filtered = filteredElevators();

  if (emptyStatePanel) {
    const isEmpty = filtered.length === 0;
    elevatorCards.hidden = isEmpty;
    emptyStatePanel.hidden = !isEmpty;
  }

  if (filtered.length === 0) return;

  filtered.forEach((item) => {
    const card = document.createElement("article");
    const cardState = item.alarm ? "alarm" : item.status === "offline" ? "offline" : item.acOn ? "running" : "idle";
    const badgeText = item.alarm ? "空调告警" : item.status === "offline" ? "空调离线" : item.acOn ? "空调开" : "空调关";
    card.className = `elevator-card ${item.id === selectedId ? "selected" : ""} ${item.alarm ? "alarm-card" : ""}`;
    card.innerHTML = `
      <div class="card-top">
        <div class="card-name">
          <strong>${item.name}</strong>
        </div>
        <span class="state-badge ${cardState}">${badgeText}</span>
      </div>
      <div class="card-temperature">
        <strong>${formatTemp(item.temp)}</strong>
        <span>轿厢温度</span>
      </div>
      <div class="card-metrics">
        <div class="card-metric">
          <span>设定温度</span>
          <strong>${formatTemp(item.target)}</strong>
        </div>
        <div class="card-metric">
          <span>电流</span>
          <strong>${formatMetric(item.current, "A", 1)}</strong>
        </div>
        <div class="card-metric">
          <span>功率</span>
          <strong>${formatMetric(item.power, "kW", 2)}</strong>
        </div>
        <div class="card-metric">
          <span>风速/模式</span>
          <strong>${item.fan} · ${item.mode}</strong>
        </div>
      </div>
      <div class="card-time">
        <svg class="card-time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <span>${item.updatedAt}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      selectedId = item.id;
      render();
    });
    elevatorCards.appendChild(card);
  });
}

function renderBatchList() {
  const filtered = filteredElevators();
  const filteredIds = filtered.map((item) => item.id);
  const currentChecked = new Set(
    [...batchList.querySelectorAll("input:checked")]
      .map((input) => input.value)
      .filter((id) => filteredIds.includes(id))
  );
  batchList.innerHTML = "";

  if (filtered.length === 0) {
    batchList.innerHTML = `<div class="batch-empty-state">请先选择设备</div>`;
    updateCheckedCount();
    updateSelectAllButtonText();
    updateBatchControlsDisabled();
    return;
  }

  filtered.forEach((item) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" value="${item.id}" ${currentChecked.has(item.id) ? "checked" : ""} />
      <span>${item.id}</span>
    `;
    batchList.appendChild(label);
  });
  updateCheckedCount();
  updateSelectAllButtonText();
  updateBatchControlsDisabled();
}

function updateSummary() {
  const list = areaElevators();
  const running = list.filter((item) => item.acOn).length;
  const activeTemps = list.filter((item) => item.temp > 0).map((item) => item.temp);
  const activeHumidity = list.filter((item) => item.humidity > 0).map((item) => item.humidity);
  const avg = activeTemps.length > 0 ? activeTemps.reduce((sum, value) => sum + value, 0) / activeTemps.length : 0;
  const avgHumidity = activeHumidity.length > 0 ? activeHumidity.reduce((sum, value) => sum + value, 0) / activeHumidity.length : 0;
  const totalCurrent = list.reduce((sum, item) => sum + item.current, 0);
  const totalPower = list.reduce((sum, item) => sum + item.power, 0);

  document.querySelector("#runningCount").textContent = `${running} 台`;
  document.querySelector("#avgTemp").textContent = activeTemps.length > 0 ? `${avg.toFixed(1)} ℃` : "—";
  document.querySelector("#avgHumidity").textContent = activeHumidity.length > 0 ? `${avgHumidity.toFixed(0)} %` : "—";
  document.querySelector("#totalCurrent").textContent = `${totalCurrent.toFixed(1)} A`;
  document.querySelector("#totalPower").textContent = `${totalPower.toFixed(2)} kW`;
}

function updateDetail() {
  const item = selectedElevator();
  document.querySelector("#singleControlName").textContent = item.name;
  document.querySelector("#singleTemp").value = item.target || 24;
  document.querySelector("#singleMode").value = item.mode;
  document.querySelector("#singleFan").value = item.fan;
  document.querySelector("#currentMode").textContent = item.mode;
  document.querySelector("#currentFan").textContent = item.fan;
  document.querySelector("#currentPower").textContent = item.acOn ? "开机" : "关机";
}

function updateCheckedCount() {
  if (!checkedCount) return;
  const filtered = filteredElevators();
  if (filtered.length === 0) {
    checkedCount.textContent = "请先选择设备";
    return;
  }
  const count = batchList.querySelectorAll("input:checked").length;
  checkedCount.textContent = `已选 ${count} 台`;
}

function updateFilterCount() {
  const count = filteredElevators().length;
  const el = document.querySelector("#filterCount");
  if (el) el.textContent = `${selectedArea || "全部区域"} · 共 ${count} 台`;
}

function updateBatchControlsDisabled() {
  const filtered = filteredElevators();
  const hasDevices = filtered.length > 0;
  const hasChecked = batchList.querySelectorAll("input:checked").length > 0;

  batchControls.forEach((btn) => {
    if (!btn) return;
    if (btn.id === "selectAllBatch") {
      btn.disabled = !hasDevices;
    } else {
      btn.disabled = !hasChecked;
    }
  });
}

function updateSelectAllButtonText() {
  const selectAllBtn = document.querySelector("#selectAllBatch");
  if (!selectAllBtn) return;
  const filtered = filteredElevators();
  const checkedCount = batchList.querySelectorAll("input:checked").length;
  const allChecked = filtered.length > 0 && checkedCount === filtered.length;
  const span = selectAllBtn.querySelector("span");
  const svg = selectAllBtn.querySelector("svg");

  if (span) span.textContent = allChecked ? "取消全选" : "全选";
  if (svg) {
    svg.innerHTML = allChecked
      ? '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
      : '<path d="M20 6 9 17l-5-5"/>';
  }
}

function updateFilterUI() {
  document.querySelectorAll("#filterBar .filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === statusFilter);
  });
  updateFilterCount();
}

function writeLog(text) {
  const now = new Date();
  const time = now.toLocaleTimeString("zh-CN", { hour12: false });
  logBox.textContent = `${time}  ${text}`;
}

function render() {
  renderList();
  renderElevatorCards();
  renderBatchList();
  updateBatchControlsDisabled();
  updateSummary();
  updateDetail();
  updateFilterCount();
}

function applyAcSettings(items, settings) {
  items.forEach((item) => {
    if (typeof settings.acOn === "boolean") item.acOn = settings.acOn;
    if (settings.temp !== undefined) item.target = settings.temp;
    if (settings.fan) item.fan = settings.fan;
    if (settings.mode) item.mode = settings.mode;

    if (!item.acOn) {
      item.current = 0;
      item.power = 0;
      return;
    }

    if (item.temp > 0 && settings.temp !== undefined) {
      item.temp = Number((item.temp + (settings.temp - item.temp) * 0.35).toFixed(1));
    }
    if (item.status !== "alarm" && item.status !== "offline") {
      item.status = item.acOn ? "running" : "idle";
    }
    const fanFactor = item.fan === "高速" ? 1.16 : item.fan === "低速" ? 0.82 : 1;
    item.current = Number((3.4 * fanFactor + Math.random() * 0.4).toFixed(1));
    item.power = Number((item.current * 0.22).toFixed(2));
  });
}

function selectedBatchTargets() {
  const ids = [...batchList.querySelectorAll("input:checked")].map((input) => input.value);
  return elevators.filter((item) => ids.includes(item.id));
}

document.querySelector("#applySingle").addEventListener("click", () => {
  const item = selectedElevator();
  const temp = clampTemp(document.querySelector("#singleTemp").value);
  const mode = document.querySelector("#singleMode").value;
  const fan = document.querySelector("#singleFan").value;
  applyAcSettings([item], { temp, mode, fan });
  writeLog(`${item.name} 已下发 ${temp}℃、${fan}、${mode}模式。`);
  render();
});

document.querySelector("#singlePowerOn").addEventListener("click", () => {
  const item = selectedElevator();
  applyAcSettings([item], { acOn: true });
  writeLog(`${item.name} 空调已开机。`);
  render();
});

document.querySelector("#singlePowerOff").addEventListener("click", () => {
  const item = selectedElevator();
  applyAcSettings([item], { acOn: false });
  writeLog(`${item.name} 空调已关机。`);
  render();
});

document.querySelector("#applyBatch").addEventListener("click", () => {
  const temp = clampTemp(document.querySelector("#batchTemp").value);
  const fan = document.querySelector("#batchFan").value;
  const mode = document.querySelector("#batchMode").value;
  const targets = selectedBatchTargets();
  if (!targets.length) {
    writeLog("请选择需要批量设置的电梯空调。");
    return;
  }
  applyAcSettings(targets, { temp, fan, mode });
  writeLog(`已向 ${targets.length} 台电梯空调批量下发 ${temp}℃、${fan}、${mode}。`);
  render();
});

document.querySelector("#selectAllBatch").addEventListener("click", () => {
  const filtered = filteredElevators();
  const filteredIds = filtered.map((item) => item.id);
  const visibleInputs = [...batchList.querySelectorAll("input")].filter((input) =>
    filteredIds.includes(input.value)
  );
  const allChecked = visibleInputs.length > 0 && visibleInputs.every((input) => input.checked);

  visibleInputs.forEach((input) => {
    input.checked = !allChecked;
  });

  updateCheckedCount();
  updateSelectAllButtonText();
  updateBatchControlsDisabled();

  if (filtered.length === 0) {
    writeLog("当前筛选条件下没有可选择的电梯空调。");
  } else if (allChecked) {
    writeLog("已取消全选。");
  } else {
    writeLog(`已全选当前筛选条件下的 ${filtered.length} 台电梯空调。`);
  }
});

document.querySelector("#applyBatchPowerOn").addEventListener("click", () => {
  const targets = selectedBatchTargets();
  if (!targets.length) {
    writeLog("请选择需要一键开机的电梯空调。");
    return;
  }
  applyAcSettings(targets, { acOn: true });
  writeLog(`已向 ${targets.length} 台电梯空调一键开机。`);
  render();
});

document.querySelector("#applyBatchPowerOff").addEventListener("click", () => {
  const targets = selectedBatchTargets();
  if (!targets.length) {
    writeLog("请选择需要一键关机的电梯空调。");
    return;
  }
  applyAcSettings(targets, { acOn: false });
  writeLog(`已向 ${targets.length} 台电梯空调一键关机。`);
  render();
});

batchList.addEventListener("change", () => {
  updateCheckedCount();
  updateSelectAllButtonText();
  updateBatchControlsDisabled();
});
if (searchInput) searchInput.addEventListener("input", renderList);

/* ---- 状态筛选栏 ---- */
document.querySelector("#filterBar").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  statusFilter = btn.dataset.filter;
  updateFilterUI();
  render();
});

setInterval(() => {
  elevators.forEach((item) => {
    if (!item.acOn || item.temp === 0) return;
    const drift = (Math.random() - 0.5) * 0.18;
    item.temp = Number((item.temp + (item.target - item.temp) * 0.08 + drift).toFixed(1));
    item.humidity = Math.max(38, Math.min(68, Math.round(item.humidity + (Math.random() - 0.5) * 2)));
    item.current = Number(Math.max(2.2, item.current + (Math.random() - 0.5) * 0.2).toFixed(1));
    item.power = Number((item.current * 0.22).toFixed(2));
    if (item.status === "running") {
      const step = item.label === "下行" ? -1 : 1;
      item.floor += step;
      if (item.floor >= 42) {
        item.floor = 42;
        item.label = "下行";
      }
      if (item.floor <= 1) {
        item.floor = 1;
        item.label = "上行";
      }
    }
  });
  updateSummary();
  updateDetail();
  renderElevatorCards();
}, 2800);

render();

/* ---- 功能说明弹窗 ---- */
const helpOverlay = document.querySelector("#helpOverlay");
const btnHelp = document.querySelector("#btnHelp");
const btnHelpClose = document.querySelector("#btnHelpClose");

function openHelp() {
  helpOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeHelp() {
  helpOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

btnHelp.addEventListener("click", openHelp);
btnHelpClose.addEventListener("click", closeHelp);
helpOverlay.addEventListener("click", (e) => {
  if (e.target === helpOverlay) closeHelp();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && helpOverlay.classList.contains("open")) closeHelp();
});

/* TEMP: auto-open for screenshot verification */
if (location.search.includes("help=1")) setTimeout(openHelp, 200);

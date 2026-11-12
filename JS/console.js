let data = {};

function renderConsoleTable(jsonData) {
  if (!jsonData || !jsonData.consoles) return;
  data = jsonData;
  const tableEl = document.getElementById('consoleTable');
  if (!tableEl) return;
  const tableBody = tableEl.getElementsByTagName('tbody')[0];
  if (!tableBody) return;
  tableBody.innerHTML = '';
  let rowNumber = 1;

  for (const key in data.consoles) {
    if (Object.prototype.hasOwnProperty.call(data.consoles, key)) {
      const consoleData = data.consoles[key];
      const newRow = tableBody.insertRow();
      const cell1 = newRow.insertCell(0);
      const cell2 = newRow.insertCell(1);
      const cell3 = newRow.insertCell(2);
      const cell4 = newRow.insertCell(3);
      const cell5 = newRow.insertCell(4);
      const cell6 = newRow.insertCell(5);
      const cell7 = newRow.insertCell(6);

      cell1.innerHTML = rowNumber.toLocaleString('fa-IR');
      cell2.innerHTML = `<i class="demo-icon icon-${consoleData.name.toLowerCase()}" style="font-size: 30px;"></i>`;
      cell3.innerHTML =
        consoleData.one_player_price !== null
          ? parseFloat(consoleData.one_player_price).toLocaleString('fa-IR') + ' تومان'
          : '';
      cell4.innerHTML =
        consoleData.two_player_price !== null
          ? parseFloat(consoleData.two_player_price).toLocaleString('fa-IR') + ' تومان'
          : '';
      cell5.innerHTML =
        consoleData.three_player_price !== null
          ? parseFloat(consoleData.three_player_price).toLocaleString('fa-IR') + ' تومان'
          : '';
      cell6.innerHTML =
        consoleData.four_player_price !== null
          ? parseFloat(consoleData.four_player_price).toLocaleString('fa-IR') + ' تومان'
          : '';
      cell7.innerHTML = `
        <button class="btn btn-danger btn-xs delete-button" data-console-id="${consoleData.name}">
          <i class="fa fa-trash-o"></i> حذف
        </button>
      `;
      rowNumber++;
    }
  }
}

const consoleDevicePillSpring = {
  gridEl: null,
  pillEl: null,
  currentX: null,
  currentY: null,
  currentW: null,
  currentH: null,
  targetX: null,
  targetY: null,
  targetW: null,
  targetH: null,
  velocityX: 0,
  velocityY: 0,
  rafId: null,
  lastTs: 0,
  resizeObserver: null,
};

function prefersReducedMotionConsole() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function stepConsoleDevicePillSpring(ts) {
  const state = consoleDevicePillSpring;
  const pill = state.pillEl;
  if (!pill || ! pill.isConnected || state.targetX === null || state.targetY === null) {
    state.rafId = null;
    return;
  }

  const dt = state.lastTs
    ? Math.min(0.032, Math.max(0.004, (ts - state.lastTs) / 1000))
    : 1 / 60;
  state.lastTs = ts;

  // Critically-damped 2D spring (fast, silky-smooth glide across columns & rows with zero jitter)
  const stiffness = 430;
  const damping = 38;

  const dispX = state.currentX - state.targetX;
  const dispY = state.currentY - state.targetY;

  const accelX = -stiffness * dispX - damping * state.velocityX;
  const accelY = -stiffness * dispY - damping * state.velocityY;

  state.velocityX += accelX * dt;
  state.velocityY += accelY * dt;

  state.currentX += state.velocityX * dt;
  state.currentY += state.velocityY * dt;

  const sizeLerp = Math.min(1, dt * 24);
  state.currentW += (state.targetW - state.currentW) * sizeLerp;
  state.currentH += (state.targetH - state.currentH) * sizeLerp;

  // Subtle organic 2D squash & stretch proportional to instantaneous velocity
  const speedX = Math.abs(state.velocityX);
  const speedY = Math.abs(state.velocityY);
  const stretchX = Math.min(0.065, speedX / 3200) - Math.min(0.03, speedY / 4200);
  const stretchY = Math.min(0.065, speedY / 3200) - Math.min(0.03, speedX / 4200);
  const scaleX = 1 + stretchX;
  const scaleY = 1 + stretchY;

  pill.style.width = `${state.currentW.toFixed(1)}px`;
  pill.style.height = `${state.currentH.toFixed(1)}px`;
  pill.style.transform = `translate3d(${state.currentX.toFixed(2)}px, ${state.currentY.toFixed(2)}px, 0) scale3d(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}, 1)`;

  const doneX = Math.abs(state.targetX - state.currentX) < 0.3 && Math.abs(state.velocityX) < 4;
  const doneY = Math.abs(state.targetY - state.currentY) < 0.3 && Math.abs(state.velocityY) < 4;
  const doneSize =
    Math.abs(state.targetW - state.currentW) < 0.3 &&
    Math.abs(state.targetH - state.currentH) < 0.3;

  if (doneX && doneY && doneSize) {
    state.currentX = state.targetX;
    state.currentY = state.targetY;
    state.currentW = state.targetW;
    state.currentH = state.targetH;
    state.velocityX = 0;
    state.velocityY = 0;
    state.rafId = null;
    state.lastTs = 0;
    pill.style.width = `${state.targetW}px`;
    pill.style.height = `${state.targetH}px`;
    pill.style.transform = `translate3d(${state.targetX}px, ${state.targetY}px, 0) scale3d(1, 1, 1)`;
    return;
  }

  state.rafId = requestAnimationFrame(stepConsoleDevicePillSpring);
}

function getConsoleDeviceRadioGrid() {
  const byId = document.getElementById('mgConsoleDeviceGrid');
  if (byId) return byId;
  const radioInput = document.querySelector('input[type="radio"][name="optionsRadios"]');
  if (radioInput) {
    const card = radioInput.closest('.mg-radio-card');
    if (card && card.parentElement) return card.parentElement;
  }
  return null;
}

window.syncConsoleDeviceSlidingPill = function syncConsoleDeviceSlidingPill(options = {}) {
  const grid = getConsoleDeviceRadioGrid();
  if (!grid) return;

  grid.classList.add('mg-device-radio-grid');
  const form = grid.closest('form');
  if (form) form.classList.add('mg-console-tariff-form');

  let pill = grid.querySelector('.mg-radio-sliding-pill');
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'mgConsoleDevicePill';
    pill.className = 'mg-radio-sliding-pill';
    pill.setAttribute('aria-hidden', 'true');
    grid.insertBefore(pill, grid.firstChild);
  }

  const cards = Array.from(grid.querySelectorAll('.mg-radio-card'));
  if (!cards.length) return;

  let activeCard =
    cards.find((c) => {
      const input = c.querySelector('input[type="radio"]');
      return Boolean(input && input.checked);
    }) || cards[0];

  cards.forEach((card) => {
    const isSelected = card === activeCard;
    card.classList.toggle('is-selected', isSelected);
    card.classList.toggle('is-pill-target', isSelected);
  });

  const nextX = activeCard.offsetLeft;
  const nextY = activeCard.offsetTop;
  const nextW = activeCard.offsetWidth;
  const nextH = activeCard.offsetHeight;

  if (nextW <= 0 || nextH <= 0) return;

  const state = consoleDevicePillSpring;
  const gridChanged = state.gridEl !== grid || state.pillEl !== pill;
  state.gridEl = grid;
  state.pillEl = pill;
  pill.style.opacity = '1';

  if (gridChanged || state.currentX === null || state.currentY === null) {
    state.currentX = nextX;
    state.currentY = nextY;
    state.currentW = nextW;
    state.currentH = nextH;
  }

  state.targetX = nextX;
  state.targetY = nextY;
  state.targetW = nextW;
  state.targetH = nextH;

  const isAlreadyAtTarget =
    Math.abs(nextX - state.currentX) < 0.5 &&
    Math.abs(nextY - state.currentY) < 0.5 &&
    Math.abs(nextW - state.currentW) < 0.5 &&
    Math.abs(nextH - state.currentH) < 0.5 &&
    Math.abs(state.velocityX) < 2 &&
    Math.abs(state.velocityY) < 2;

  if (options.instant === true || gridChanged || prefersReducedMotionConsole() || isAlreadyAtTarget) {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.currentX = nextX;
    state.currentY = nextY;
    state.currentW = nextW;
    state.currentH = nextH;
    state.velocityX = 0;
    state.velocityY = 0;
    state.lastTs = 0;
    pill.style.width = `${nextW}px`;
    pill.style.height = `${nextH}px`;
    pill.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale3d(1, 1, 1)`;
    return;
  }

  if (!state.rafId) {
    state.lastTs = 0;
    state.rafId = requestAnimationFrame(stepConsoleDevicePillSpring);
  }
};

window.initConsoleDeviceRadioPill = function initConsoleDeviceRadioPill() {
  const grid = getConsoleDeviceRadioGrid();
  if (!grid) return;

  if (!grid.dataset.mgPillBound) {
    grid.dataset.mgPillBound = '1';

    grid.addEventListener('change', (e) => {
      const radio = e.target.closest('input[type="radio"]');
      if (!radio) return;
      window.setTitle(radio);
      window.syncConsoleDeviceSlidingPill({ instant: false });
    });

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.mg-radio-card');
      if (!card) return;
      const radio = card.querySelector('input[type="radio"]');
      if (radio && !radio.checked) {
        radio.checked = true;
      }
      if (radio) {
        window.setTitle(radio);
      }
      window.syncConsoleDeviceSlidingPill({ instant: false });
    });

    if (typeof ResizeObserver !== 'undefined') {
      if (consoleDevicePillSpring.resizeObserver) {
        consoleDevicePillSpring.resizeObserver.disconnect();
      }
      consoleDevicePillSpring.resizeObserver = new ResizeObserver(() => {
        window.syncConsoleDeviceSlidingPill({ instant: true });
      });
      consoleDevicePillSpring.resizeObserver.observe(grid);
    }
  }

  window.syncConsoleDeviceSlidingPill({ instant: true });
  requestAnimationFrame(() => {
    window.syncConsoleDeviceSlidingPill({ instant: true });
  });
};

window.setTitle = function setTitle(radio) {
  if (!radio) return;
  const selectedTitle = radio.getAttribute('data-title');
  const titleInput = document.getElementById('selectedTitle');
  if (titleInput && selectedTitle) titleInput.value = selectedTitle;
  if (typeof window.syncConsoleDeviceSlidingPill === 'function') {
    window.syncConsoleDeviceSlidingPill({ instant: false });
  }
};

window.renderConsolePage = function renderConsolePage() {
  window.initConsoleDeviceRadioPill();

  try {
    const cachedBundle = sessionStorage.getItem('mg_bundle_v1');
    if (cachedBundle) {
      const parsed = JSON.parse(cachedBundle);
      if (parsed && parsed['data.json']) {
        renderConsoleTable(parsed['data.json']);
      }
    }
  } catch {
    // ignore cache error
  }

  fetch('data.json')
    .then((response) => response.json())
    .then((jsonData) => {
      renderConsoleTable(jsonData);
    })
    .catch((error) => console.error('خطا در دریافت و پردازش داده: ', error));
};

window.renderConsolePage();

if (!window.__mgConsoleDeleteBound) {
  window.__mgConsoleDeleteBound = true;
  document.addEventListener('click', function (event) {
    const btn = event.target.closest('.delete-button');
    if (btn && btn.hasAttribute('data-console-id')) {
      const consoleId = btn.getAttribute('data-console-id');
      const rowToRemove = btn.closest('tr');
      if (rowToRemove) {
        rowToRemove.remove();
      }
      fetch('./delete_console.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `consoleId=${consoleId}`,
      }).catch((error) => console.error('خطا در ارسال درخواست: ', error));
    }
  });
}
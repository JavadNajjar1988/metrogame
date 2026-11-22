export function normalizeInvoiceDigits(str) {
  return String(str ?? '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .trim();
}

export function resolveInvoiceTableSelection({
  requestedTable = '',
  gameTempMap = {},
  buffetTempMap = {},
  reservationsList = [],
} = {}) {
  const safeGameMap = gameTempMap && typeof gameTempMap === 'object' ? gameTempMap : {};
  const safeBuffetMap = buffetTempMap && typeof buffetTempMap === 'object' ? buffetTempMap : {};
  const safeReservations = Array.isArray(reservationsList) ? reservationsList : [];

  const nonEmptyGameTables = Object.keys(safeGameMap).filter(
    (key) => Array.isArray(safeGameMap[key]) && safeGameMap[key].length > 0
  );
  const nonEmptyBuffetTables = Object.keys(safeBuffetMap).filter(
    (key) => Array.isArray(safeBuffetMap[key]) && safeBuffetMap[key].length > 0
  );
  const reservationTables = safeReservations
    .map((r) => (r && r.tableNumber !== undefined ? String(r.tableNumber).trim() : ''))
    .filter(Boolean);

  const tableSet = new Set([
    ...nonEmptyGameTables,
    ...nonEmptyBuffetTables,
    ...reservationTables,
  ]);

  const req = String(requestedTable ?? '').trim();
  if (req) {
    tableSet.add(req);
  }

  const availableTables = Array.from(tableSet).filter(Boolean);

  let chosenTable = '';
  if (req && tableSet.has(req)) {
    chosenTable = req;
  } else if (availableTables.length > 0) {
    chosenTable = availableTables[0];
  }

  return {
    availableTables,
    chosenTable,
  };
}

export function resolvePrimaryConsoleType({
  gameItems = [],
  reservationsList = [],
  tableNumber = '',
} = {}) {
  if (Array.isArray(gameItems) && gameItems.length > 0) {
    const firstConsole = String(gameItems[0]?.consoleType || '').trim();
    if (firstConsole) return firstConsole;
  }

  const key = String(tableNumber ?? '').trim();
  if (key && Array.isArray(reservationsList)) {
    const activeRes = reservationsList.find(
      (r) => r && String(r.tableNumber).trim() === key
    );
    if (activeRes && activeRes.consoleType) {
      return String(activeRes.consoleType).trim();
    }
  }

  return 'buffet_only';
}

export function computeInvoiceTotals(gameItems = [], buffetItems = []) {
  const safeGames = Array.isArray(gameItems) ? gameItems : [];
  const safeBuffets = Array.isArray(buffetItems) ? buffetItems : [];

  const gameTotal = safeGames.reduce(
    (sum, item) => sum + (Number(item?.gameCost) || 0),
    0
  );
  const buffetTotal = safeBuffets.reduce(
    (sum, item) => sum + (Number(item?.unitPrice) || 0) * (Number(item?.quantity) || 0),
    0
  );
  const rawTotal = gameTotal + buffetTotal;
  const payable = rawTotal >= 1000 ? Math.round(rawTotal / 1000) * 1000 : rawTotal;
  const roundingDiff = rawTotal - payable;
  const totalBuffetQty = safeBuffets.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0),
    0
  );

  return {
    gameTotal,
    buffetTotal,
    rawTotal,
    payable,
    roundingDiff,
    totalBuffetQty,
  };
}

export function buildBuffetPaymentPayload(buffetItems = []) {
  const safeBuffets = Array.isArray(buffetItems) ? buffetItems : [];
  return safeBuffets.map((item) => [
    item?.productType || 'other',
    (Number(item?.unitPrice) || 0) * (Number(item?.quantity) || 0),
  ]);
}

export function validateInvoiceSettlementInput({
  tableNumber = '',
  totals = { rawTotal: 0, payable: 0 },
  payWay = 'cash',
  customerId = '',
  debtorName = '',
} = {}) {
  const cleanTable = String(tableNumber ?? '').trim();
  if (!cleanTable) {
    return { ok: false, error: 'در حال حاضر صورت‌حساب فعالی برای تسویه وجود ندارد.' };
  }
  if ((Number(totals?.rawTotal) || 0) <= 0 || (Number(totals?.payable) || 0) <= 0) {
    return { ok: false, error: 'مبلغ قابل پرداخت صفر است. ابتدا ردیف بازی یا بوفه ثبت کنید.' };
  }
  if (payWay === 'acount') {
    const cleanId = normalizeInvoiceDigits(customerId);
    if (!cleanId) {
      return { ok: false, error: 'لطفاً کد اشتراک مشتری را وارد نمایید.' };
    }
    return { ok: true, customerId: cleanId };
  }
  if (payWay === 'debt') {
    const cleanDebtor = String(debtorName ?? '').trim();
    if (!cleanDebtor) {
      return { ok: false, error: 'لطفاً نام و نام خانوادگی بدهکار را وارد نمایید.' };
    }
    return { ok: true, debtorName: cleanDebtor };
  }
  return { ok: true };
}

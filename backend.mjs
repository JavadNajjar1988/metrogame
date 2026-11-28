import { randomInt, randomUUID } from 'node:crypto';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_LOYALTY_CONFIG,
  sanitizeLoyaltyConfig,
  computeCustomerLoyalty,
} from './JS/loyalty-engine.mjs';
import {
  createSeedTournaments,
  createSeedTeams,
  createSeedChallenges,
  normalizeTournamentRecord,
  sanitizeTournamentInput,
  sanitizeTeamInput,
  sanitizeChallengeInput,
  validateParticipantInput,
  acceptChallengeForCenter,
  updateChallengePrizeAgreement,
  buildTournamentFromChallenge,
  generateSingleEliminationBracket,
  recordBracketMatchWinner,
  computePrizeAgreementStatus,
  cleanText,
  LOCAL_GAMENET_ID,
  LOCAL_GAMENET_NAME,
  LOCAL_GAMENET_CITY,
} from './JS/tournaments-engine.mjs';
import {
  createSeedDirectChallenges,
  sanitizeDirectChallengeInput,
  acceptDirectChallenge,
  rejectDirectChallenge,
  proposeDirectChallengeChanges,
  confirmDirectChallengeTerms,
  buildHeadToHeadMatchFromDirectChallenge,
} from './JS/tournaments-competition.mjs';

const directory = process.env.METROGAME_DATA_DIR || fileURLToPath(new URL('.', import.meta.url));
const defaults = {
  'data.json': { consoles: [] },
  'Calender.json': [{ start: new Date().toISOString(), end: new Date().toISOString() }],
  'customer_data.json': {},
  'game_temporary.json': {},
  'buffet_temporary.json': {},
  'products.json': [],
  'reservations.json': [],
  'clickTime.json': [],
  'finishTime.json': [],
  'cashPay.json': [],
  'creditpay.json': [],
  'customerPay.json': [],
  'debtpay.json': [],
  'gamenet_layout.json': null,
  'loyalty_config.json': { ...DEFAULT_LOYALTY_CONFIG },
  'tournaments.json': createSeedTournaments(),
  'tournament_teams.json': createSeedTeams(),
  'tournament_challenges.json': createSeedChallenges(),
  'tournament_direct_challenges.json': createSeedDirectChallenges(),
};

export const isDataFile = name => Object.hasOwn(defaults, name);

export async function readData(name) {
  try {
    return JSON.parse((await readFile(join(directory, name), 'utf8')).replace(/^\uFEFF/, ''));
  } catch (error) {
    if (error.code === 'ENOENT') return structuredClone(defaults[name]);
    throw error;
  }
}

async function save(name, value) {
  const target = join(directory, name);
  const temporary = target + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temporary, JSON.stringify(value), 'utf8');
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

async function update(name, change) {
  const data = await readData(name);
  const result = change(data);
  await save(name, result);
}

const redirect = location => ({ location });
const ok = { status: 'ok' };
const same = (left, right) => String(left) === String(right);

function invalid(message) {
  throw Object.assign(new Error(message), { status: 400 });
}

function normalizeDigits(str) {
  return String(str ?? '')
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632));
}

function field(form, key) {
  const raw = form.get(key);
  const value = typeof raw === 'string' ? normalizeDigits(raw).trim() : '';
  if (!value) invalid('مقدار الزامی وارد نشده است.');
  return value;
}

function number(form, key, minimum = 0) {
  const cleaned = field(form, key).replace(/[,٬\s]/g, '');
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < minimum) invalid('مقدار عددی معتبر نیست.');
  return value;
}

function idFor(used) {
  if (used.size >= 100000) invalid('شناسهٔ آزاد وجود ندارد.');
  let id;
  do {
    id = String(randomInt(100000)).padStart(5, '0');
  } while (used.has(id));
  return id;
}

function buffet(form) {
  const rows = new Map();
  for (const [key, value] of form) {
    const match = /^BuffetPrice\[(\d+)\]\[(\d+)\]$/.exec(key);
    if (!match) continue;
    const [, row, column] = match;
    if (!rows.has(row)) rows.set(row, []);
    if (column === '0' || column === '1') rows.get(row)[Number(column)] = value;
  }
  return [...rows.values()].filter(([type, amount]) =>
    Object.hasOwn(productTypes, type) && amount != null && Number.isFinite(Number(amount)) && Number(amount) >= 0);
}

function payment(form) {
  return {
    gameTotal: number(form, 'gameTotal'),
    Buffet: buffet(form),
    consoleType: field(form, 'consoleType'),
    paydate: field(form, 'paydate'),
  };
}

const productTypes = {
  cold_drink: ['100', 'fa-whiskey-glass-ice'],
  hot_drink: ['200', 'fa-mug-hot'],
  snack: ['300', 'fa-cookie-bite'],
  fastfood: ['400', 'fa-burger'],
  other: ['500', 'fa-burrito'],
};

const prices = {
  one_player_price: 'priceForOne',
  two_player_price: 'priceForTwo',
  three_player_price: 'priceForThree',
  four_player_price: 'priceForFour',
};

async function addPayment(name, form) {
  const entry = payment(form);
  await update(name, list => [...list, entry]);
  return ok;
}

async function changeCredit(form, subtract) {
  const id = field(form, 'customerId');
  const amount = number(form, subtract ? 'totalcost' : 'accountCharge');
  const customers = await readData('customer_data.json');
  if (!Object.hasOwn(customers, id)) return { error: 'مشتری وجود ندارد.' };
  const customer = customers[id];
  const balance = Number(customer.accountCharge) + (subtract ? -amount : amount);
  if (!Number.isFinite(balance)) invalid('موجودی حساب معتبر نیست.');
  if (balance < 0) return { error: 'حساب را شارژ کنید.' };
  customer.accountCharge = balance;
  await save('customer_data.json', customers);
  return { message: 'عملیات موفقیت‌آمیز', customerName: customer.customerName };
}

async function startTimer(form, prepaid) {
  const tableNumber = field(form, 'tableNumber');
  const name = prepaid ? 'finishTime.json' : 'clickTime.json';
  const timers = await readData(name);
  let timer = timers.find(item => same(item.tableNumber, tableNumber));
  if (!timer) {
    timer = prepaid
      ? { tableNumber, startTime: number(form, 'startTime'), finishTime: number(form, 'finishTime') }
      : { tableNumber, clickTime: number(form, 'clickTime') };
    await save(name, [...timers, timer]);
  }
  return prepaid ? { finishTime: timer.finishTime } : redirect('index.html');
}

async function appendForTable(name, form, entry) {
  const table = field(form, 'tableNumber');
  await update(name, data => {
    const entries = Object.hasOwn(data, table) ? data[table] : [];
    return { ...data, [table]: [...entries, entry] };
  });
  return ok;
}

async function removeFromFile(name, keep, location) {
  await update(name, list => list.filter(keep));
  return redirect(location);
}

async function removeTemporary(name, form) {
  const table = field(form, 'factor_name');
  const rawIndex = form.get('itemIndex');
  const hasIndex = rawIndex !== null && String(rawIndex).trim() !== '';
  await update(name, data => {
    const tables = { ...data };
    if (hasIndex) {
      const idx = Number(normalizeDigits(String(rawIndex)).trim());
      const currentList = Object.hasOwn(tables, table) && Array.isArray(tables[table]) ? tables[table] : null;
      if (!currentList || !Number.isInteger(idx) || idx < 0 || idx >= currentList.length) {
        invalid('ردیف مورد نظر برای حذف در سرور یافت نشد.');
      }
      const nextList = currentList.filter((_, i) => i !== idx);
      if (nextList.length > 0) {
        tables[table] = nextList;
      } else {
        delete tables[table];
      }
      return tables;
    }
    delete tables[table];
    return tables;
  });
  return hasIndex ? ok : redirect('index.html');
}

const knownConsoles = new Set([
  'ps50',
  'ps4',
  'xbox',
  'computer',
  'pool-table',
  'foosball',
  'jewelry',
]);

const routes = {
  'process.php': async form => {
    const rawTable = form.get('tableNumber') ?? form.get('table-number');
    const tableNumber = typeof rawTable === 'string' ? normalizeDigits(rawTable).trim() : '';
    if (!tableNumber) invalid('شماره میز وارد نشده است.');
    const reservations = await readData('reservations.json');
    if (reservations.some(item => same(item.tableNumber, tableNumber))) {
      return { error: 'شماره میز تکراری است.' };
    }
    const priceType = field(form, 'priceType');
    const consoleType = field(form, 'consoleType');
    const { consoles } = await readData('data.json');
    const isValidConsole =
      knownConsoles.has(consoleType) || consoles.some(item => item.name === consoleType);
    if (!Object.hasOwn(prices, priceType) || !isValidConsole) {
      invalid('تعرفه یا کنسول معتبر نیست.');
    }
    const rawPreCost = form.get('pre-payment-cost');
    const prePaymentCost =
      typeof rawPreCost === 'string' ? normalizeDigits(rawPreCost).replace(/[,٬\s]/g, '').trim() : null;
    const isPre = form.get('pre-payment') === 'pre-payment' || form.get('paymentType') === 'pre-payment';
    const rawCustomerId = form.get('customerId');
    let linkedCustomerId = null;
    if (typeof rawCustomerId === 'string' && rawCustomerId.trim()) {
      const cleanCustomerId = normalizeDigits(rawCustomerId).trim();
      const customers = await readData('customer_data.json');
      if (Object.hasOwn(customers, cleanCustomerId)) {
        linkedCustomerId = cleanCustomerId;
      }
    }
    await save('reservations.json', [...reservations, {
      tableNumber,
      consoleType,
      priceType,
      paymentType: form.get('paymentType'),
      prePaymentCost: isPre ? (prePaymentCost || '0') : null,
      postPayment: isPre ? null : (form.get('post-payment') || 'post-payment'),
      prePayment: isPre ? 'pre-payment' : null,
      customerId: linkedCustomerId,
    }]);
    return ok;
  },
  'timing.php': form => startTimer(form, false),
  'timer.php': form => startTimer(form, true),
  'charging.php': async form => {
    const table = field(form, 'tableNumber');
    const seconds = number(form, 'charge_Time', 1);
    const nowSec = Math.floor(Date.now() / 1000);
    const timers = await readData('finishTime.json');
    const timer = timers.find(item => same(item.tableNumber, table));
    if (timer) {
      const baseFinish = Math.max(Number(timer.finishTime) || nowSec, nowSec);
      timer.finishTime = baseFinish + seconds;
      await save('finishTime.json', timers);
      return { finishTime: timer.finishTime };
    }

    // Fallback: allow extending an unstarted pre-payment table or adding a timed block to a post-payment table
    const reservations = await readData('reservations.json');
    const reservation = reservations.find(item => same(item.tableNumber, table));
    if (!reservation) invalid('زمان‌سنج میز پیدا نشد.');

    const { consoles } = await readData('data.json');
    const foundConsole = Array.isArray(consoles)
      ? consoles.find(c => c.name === reservation.consoleType)
      : null;
    const hourlyPrice =
      foundConsole && Number(foundConsole[reservation.priceType]) > 0
        ? Number(foundConsole[reservation.priceType])
        : 60000;

    const clickTimes = await readData('clickTime.json');
    const existingClick = clickTimes.find(item => same(item.tableNumber, table));
    const isPre = reservation.prePayment === 'pre-payment' || reservation.paymentType === 'pre-payment';

    let startTime = nowSec;
    let finishTime = nowSec + seconds;

    if (isPre) {
      const plannedCost = Math.max(0, Number(reservation.prePaymentCost) || 0);
      const plannedSec = plannedCost > 0 ? Math.round((plannedCost / hourlyPrice) * 3600) : 0;
      finishTime = nowSec + plannedSec + seconds;
    } else if (existingClick && Number(existingClick.clickTime) > 0) {
      const clickSec = Number(existingClick.clickTime);
      // Preserve active session start if within the last 24h; otherwise start fresh timed block
      startTime = clickSec <= nowSec && nowSec - clickSec < 86400 ? clickSec : nowSec;
      finishTime = nowSec + seconds;
      await save(
        'clickTime.json',
        clickTimes.filter(item => !same(item.tableNumber, table))
      );
    }

    const totalSec = Math.max(60, finishTime - startTime);
    const updatedCost = Math.round(((totalSec / 3600) * hourlyPrice) / 1000) * 1000;
    reservation.prePayment = 'pre-payment';
    reservation.postPayment = null;
    reservation.paymentType = 'pre-payment';
    reservation.prePaymentCost = String(Math.max(0, updatedCost));

    await save('reservations.json', reservations);
    timers.push({ startTime: String(startTime), finishTime, tableNumber: String(table) });
    await save('finishTime.json', timers);
    return { finishTime, convertedToPrePayment: !isPre };
  },
  'delete_reservation.php': async form => {
    const table = field(form, 'tableNumber');
    for (const name of ['clickTime.json', 'finishTime.json', 'reservations.json']) {
      await update(name, list => list.filter(item => !same(item.tableNumber, table)));
    }
    return redirect('index.html');
  },
  'console_costs.php': async form => {
    const name = field(form, 'optionsRadios');
    const title = field(form, 'optionsRadios_title');
    const data = await readData('data.json');
    if (!data.consoles.some(console => console.name === name)) {
      const entry = { name, title };
      for (const [key, input] of Object.entries(prices)) entry[key] = form.get(input) ?? '';
      data.consoles.push(entry);
      await save('data.json', data);
    }
    return redirect('console.html');
  },
  'delete_console.php': async form => {
    const name = field(form, 'consoleId');
    const reservations = await readData('reservations.json');
    if (reservations.some(item => item.consoleType === name)) invalid('این کنسول رزرو فعال دارد.');
    await update('data.json', data => ({ ...data, consoles: data.consoles.filter(item => item.name !== name) }));
    return redirect('console.html');
  },
  'buffet.php': async form => {
    const productType = field(form, 'optionsRadios');
    if (!Object.hasOwn(productTypes, productType)) invalid('نوع محصول معتبر نیست.');
    const [prefix, iconName] = productTypes[productType];
    const title = field(form, 'title-tag');
    const unitPrice = number(form, 'unitPrice');
    await update('products.json', products => {
      const codes = new Set(products.map(product => String(product.productCode)));
      const available = Array.from({ length: 100 }, (_, index) => prefix + index).filter(code => !codes.has(code));
      if (!available.length) invalid('شناسهٔ آزاد برای این گروه وجود ندارد.');
      return [...products, { productCode: available[randomInt(available.length)], productType, title, unitPrice, iconName }];
    });
    return redirect('buffet.html');
  },
  'delete_product.php': form => {
    const id = field(form, 'id');
    return removeFromFile('products.json', item => !same(item.productCode, id), 'buffet.html');
  },
  'buffet_temporary.php': async form => {
    const productCode = field(form, 'productCode');
    const products = await readData('products.json');
    const product = products.find(item => same(item.productCode, productCode));
    if (!product) invalid('محصول پیدا نشد.');
    const { title, unitPrice, productType } = product;
    const quantity = number(form, 'quantity', 1);
    if (!Number.isInteger(quantity)) invalid('تعداد محصول باید عدد صحیح باشد.');
    return appendForTable('buffet_temporary.json', form, { productCode, title, unitPrice, productType, quantity });
  },
  'game_temporary.php': async form => {
    const consoleType = field(form, 'consoleType');
    const priceType = field(form, 'priceType');
    const { consoles } = await readData('data.json');
    const selected = consoles.find(item => item.name === consoleType);
    const isValidConsole = Boolean(selected) || knownConsoles.has(consoleType);
    if (!isValidConsole || !Object.hasOwn(prices, priceType)) invalid('تعرفه یا کنسول معتبر نیست.');
    const gameCost = number(form, 'gameCost');
    const consoleRate = selected && selected[priceType] ? selected[priceType] : '60000';
    const rawPlayed = form.get('playedSeconds');
    const parsedPlayed =
      typeof rawPlayed === 'string' && rawPlayed.trim()
        ? Math.max(0, Math.min(864000, Math.floor(Number(normalizeDigits(rawPlayed).trim()) || 0)))
        : 0;
    const rawCustomerId = form.get('customerId');
    const cleanCustomerId =
      typeof rawCustomerId === 'string' && rawCustomerId.trim()
        ? normalizeDigits(rawCustomerId).trim()
        : '';
    return appendForTable('game_temporary.json', form, {
      cosoleprice: consoleRate,
      gameCost,
      consoleType,
      priceType,
      playedSeconds: parsedPlayed,
      customerId: cleanCustomerId || null,
    });
  },
  'delete_game_temperory.php': form => removeTemporary('game_temporary.json', form),
  'delete_buffet_temperory.php': form => removeTemporary('buffet_temporary.json', form),
  'costomers.php': async form => {
    const customerName = field(form, 'costomerName');
    const accountCharge = form.get('acountCharge') ? number(form, 'acountCharge') : 0;
    await update('customer_data.json', customers => {
      const customerId = idFor(new Set(Object.keys(customers)));
      return {
        ...customers,
        [customerId]: {
          customerId,
          customerName,
          accountCharge,
          totalPlaySeconds: 0,
          usedRewards: 0,
        },
      };
    });
    return redirect('acounts.html');
  },
  'delete_customer.php': async form => {
    const id = field(form, 'customerId');
    await update('customer_data.json', data => {
      const customers = { ...data };
      const key = Object.keys(customers).find(key => same(customers[key].customerId, id));
      if (key !== undefined) delete customers[key];
      return customers;
    });
    return redirect('acounts.html');
  },
  'costumercharge.php': form => changeCredit(form, true),
  'editCustomerCharge.php': form => changeCredit(form, false),
  'cashPay.php': form => addPayment('cashPay.json', form),
  'creditpay.php': form => addPayment('creditpay.json', form),
  'customerpay.php': form => addPayment('customerPay.json', form),
  'debtpay.php': async form => {
    const { Buffet, ...entry } = payment(form);
    const totalBuffetPrice = number(form, 'totalBuffetPrice');
    const debtorname = field(form, 'debtorname');
    await update('debtpay.json', list => {
      const debtorId = idFor(new Set(list.flatMap(Object.keys)));
      return [...list, { [debtorId]: { ...entry, totalBuffetPrice, BuffetPrice: Buffet, debtorname, debtorId } }];
    });
    return ok;
  },
  'delete_debtors.php': form => {
    const id = field(form, 'debtorId');
    return removeFromFile('debtpay.json', item => !Object.hasOwn(item, id), 'Debtors.html');
  },
  'Calender.php': async form => {
    const start = field(form, 'start');
    const end = field(form, 'end');
    if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(start) > Date.parse(end)) {
      invalid('بازهٔ تاریخ معتبر نیست.');
    }
    await save('Calender.json', [{ start, end }]);
    return ok;
  },
  'save_layout.php': async form => {
    const raw = form.get('layout');
    if (typeof raw !== 'string' || !raw.trim() || raw.length > 180000) {
      invalid('دادهٔ چیدمان سه‌بعدی معتبر نیست.');
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      invalid('قالب JSON چیدمان معتبر نیست.');
    }
    const hasFloors = Array.isArray(parsed?.floors) && parsed.floors.length > 0 && parsed.floors.length <= 4;
    const hasLegacy = parsed && typeof parsed === 'object' && parsed.room && Array.isArray(parsed.items);
    if (!parsed || typeof parsed !== 'object' || (!hasFloors && !hasLegacy)) {
      invalid('ساختار چیدمان سه‌بعدی معتبر نیست.');
    }

    if (hasFloors) {
      const sanitizedFloors = parsed.floors.map((fl, idx) => ({
        id: String(fl?.id || `floor-${idx}`).slice(0, 48),
        name: String(fl?.name || `طبقه ${idx + 1}`).slice(0, 32),
        level: idx,
        room: fl?.room || parsed.room || {},
        walls: Array.isArray(fl?.walls) ? fl.walls.slice(0, 80) : [],
        items: Array.isArray(fl?.items) ? fl.items.slice(0, 160) : [],
      }));
      const activeIdx = Math.max(0, Math.min(sanitizedFloors.length - 1, Math.floor(Number(parsed.activeFloorIndex) || 0)));
      const active = sanitizedFloors[activeIdx];
      await save('gamenet_layout.json', {
        version: 2,
        updatedAt: new Date().toISOString(),
        activeFloorIndex: activeIdx,
        floors: sanitizedFloors,
        room: active.room,
        walls: active.walls,
        items: active.items,
      });
      return ok;
    }

    if (parsed.items.length > 160) {
      invalid('تعداد آیتم‌های چیدمان بیش از حد مجاز است.');
    }
    await save('gamenet_layout.json', {
      version: 2,
      updatedAt: new Date().toISOString(),
      activeFloorIndex: 0,
      floors: [
        {
          id: 'floor-0',
          name: 'طبقه همکف',
          level: 0,
          room: parsed.room,
          walls: Array.isArray(parsed.walls) ? parsed.walls.slice(0, 80) : [],
          items: parsed.items,
        },
      ],
      room: parsed.room,
      walls: Array.isArray(parsed.walls) ? parsed.walls.slice(0, 80) : [],
      items: parsed.items,
    });
    return ok;
  },
  'loyalty_config.php': async form => {
    const milestoneHours = number(form, 'milestoneHours', 1);
    const discountPercent = number(form, 'discountPercent', 1);
    const config = sanitizeLoyaltyConfig({ milestoneHours, discountPercent });
    await save('loyalty_config.json', config);
    return { status: 'ok', config };
  },
  'customer_loyalty.php': async form => {
    const customerId = field(form, 'customerId');
    const rawAddSeconds = form.get('addSeconds');
    const rawAddHours = form.get('addHours');
    const redeemReward = form.get('redeemReward') === '1' || form.get('redeemReward') === 'true';

    let addSeconds = 0;
    if (typeof rawAddSeconds === 'string' && rawAddSeconds.trim() !== '') {
      const parsed = Number(normalizeDigits(rawAddSeconds).replace(/[,٬\s]/g, '').trim());
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 864000) {
        invalid('مدت زمان بازی معتبر نیست.');
      }
      addSeconds = Math.floor(parsed);
    } else if (typeof rawAddHours === 'string' && rawAddHours.trim() !== '') {
      const parsedHours = Number(normalizeDigits(rawAddHours).replace(/[,٬\s]/g, '').trim());
      if (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 240) {
        invalid('تعداد ساعت بازی معتبر نیست.');
      }
      addSeconds = Math.round(parsedHours * 3600);
    }

    const [customers, rawConfig] = await Promise.all([
      readData('customer_data.json'),
      readData('loyalty_config.json'),
    ]);
    if (!Object.hasOwn(customers, customerId)) {
      return { error: 'مشتری با این کد اشتراک پیدا نشد.' };
    }

    const config = sanitizeLoyaltyConfig(rawConfig);
    const customer = customers[customerId];
    const currentSeconds = Math.max(0, Math.floor(Number(customer.totalPlaySeconds) || 0));
    const currentUsed = Math.max(0, Math.floor(Number(customer.usedRewards) || 0));

    // Verify available reward BEFORE adding current session's seconds if redeeming now
    if (redeemReward) {
      const beforeStatus = computeCustomerLoyalty(
        { totalPlaySeconds: currentSeconds, usedRewards: currentUsed },
        config
      );
      if (beforeStatus.availableRewards <= 0) {
        return { error: 'این مشتری در حال حاضر جایزه تخفیف آماده استفاده ندارد.' };
      }
      customer.usedRewards = currentUsed + 1;
    } else {
      customer.usedRewards = currentUsed;
    }

    customer.totalPlaySeconds = currentSeconds + addSeconds;
    await save('customer_data.json', customers);

    const loyalty = computeCustomerLoyalty(customer, config);
    return {
      status: 'ok',
      customerId,
      customerName: customer.customerName,
      loyalty,
    };
  },
  'tournaments_api.php': async form => {
    const action = field(form, 'action');
    const [rawTrn, rawTeams, rawChallenges, rawDirect] = await Promise.all([
      readData('tournaments.json'),
      readData('tournament_teams.json'),
      readData('tournament_challenges.json'),
      readData('tournament_direct_challenges.json'),
    ]);
    const tournaments = (Array.isArray(rawTrn) ? rawTrn : createSeedTournaments()).map(normalizeTournamentRecord);
    const teams = Array.isArray(rawTeams) ? rawTeams : createSeedTeams();
    const challenges = Array.isArray(rawChallenges) ? rawChallenges : createSeedChallenges();
    const directChallenges = Array.isArray(rawDirect) ? rawDirect : createSeedDirectChallenges();

    const bundleResp = (extra = {}) => ({
      status: 'ok',
      tournaments,
      teams,
      challenges,
      directChallenges,
      ...extra,
    });

    /* --- TOURNAMENTS (Internal & Inter-Center, Online & Physical) --- */
    if (action === 'create') {
      const sanitized = sanitizeTournamentInput({
        title: form.get('title'),
        category: form.get('category'),
        gameId: form.get('gameId'),
        customGameName: form.get('customGameName'),
        platform: form.get('platform'),
        venue: form.get('venue'),
        format: form.get('format'),
        scope: form.get('scope'),
        maxSlots: form.get('maxSlots'),
        entryFee: form.get('entryFee'),
        prizeType: form.get('prizeType'),
        prizePoolValue: form.get('prizePoolValue'),
        prizeFirst: form.get('prizeFirst'),
        prizeSecond: form.get('prizeSecond'),
        prizeThird: form.get('prizeThird'),
        startDate: form.get('startDate'),
        registrationDeadline: form.get('registrationDeadline'),
        lobbyCode: form.get('lobbyCode'),
        rules: form.get('rules'),
      });
      if (sanitized.error) invalid(sanitized.error);

      // Optional initial participants (e.g. from internal customer selection or team selection)
      const initialParticipants = [];
      const rawInit = form.get('initialParticipants');
      if (typeof rawInit === 'string' && rawInit.trim().startsWith('[')) {
        try {
          const parsedList = JSON.parse(rawInit);
          if (Array.isArray(parsedList)) {
            const tempTrn = { ...sanitized.value, participants: initialParticipants };
            for (const item of parsedList.slice(0, sanitized.value.maxSlots)) {
              const v = validateParticipantInput(item, tempTrn);
              if (!v.error) {
                initialParticipants.push({
                  id: 'p-' + randomUUID().slice(0, 8),
                  ...v.value,
                  registeredAt: new Date().toISOString(),
                });
              }
            }
          }
        } catch {
          // Ignore malformed optional seed participants
        }
      }

      const autoGenerate = form.get('autoGenerateBracket') === '1' && initialParticipants.length >= 2;
      const created = normalizeTournamentRecord({
        id: 'trn-' + randomUUID().slice(0, 8),
        ...sanitized.value,
        status: autoGenerate ? 'live' : 'registration',
        createdAt: new Date().toISOString(),
        participants: initialParticipants,
        bracket: autoGenerate
          ? generateSingleEliminationBracket(initialParticipants, sanitized.value.maxSlots)
          : null,
      });
      const updated = [created, ...tournaments].slice(0, 80);
      await save('tournaments.json', updated);
      return { status: 'ok', tournament: created, tournaments: updated, teams, challenges };
    }

    if (action === 'register_player') {
      const tournamentId = field(form, 'tournamentId');
      const idx = tournaments.findIndex((t) => same(t.id, tournamentId));
      if (idx === -1) invalid('تورنومنت مورد نظر پیدا نشد.');

      const target = tournaments[idx];
      const validated = validateParticipantInput(
        {
          playerName: form.get('playerName'),
          onlineId: form.get('onlineId'),
          gamenetId: form.get('gamenetId') || LOCAL_GAMENET_ID,
          gamenetName: form.get('gamenetName') || LOCAL_GAMENET_NAME,
          city: form.get('city') || LOCAL_GAMENET_CITY,
          customerId: form.get('customerId') || '',
          members: form.get('members') || '',
        },
        target
      );
      if (validated.error) invalid(validated.error);

      const participant = {
        id: 'p-' + randomUUID().slice(0, 8),
        ...validated.value,
        registeredAt: new Date().toISOString(),
      };
      target.participants = [...(Array.isArray(target.participants) ? target.participants : []), participant];
      await save('tournaments.json', tournaments);
      return bundleResp({ tournament: target, participant });
    }

    if (action === 'remove_player') {
      const tournamentId = field(form, 'tournamentId');
      const participantId = field(form, 'participantId');
      const target = tournaments.find((t) => same(t.id, tournamentId));
      if (!target) invalid('تورنومنت مورد نظر پیدا نشد.');
      if (target.status === 'completed') invalid('تورنومنت پایان‌یافته قابل ویرایش نیست.');
      target.participants = (target.participants || []).filter((p) => !same(p.id, participantId));
      await save('tournaments.json', tournaments);
      return bundleResp({ tournament: target });
    }

    if (action === 'generate_bracket') {
      const tournamentId = field(form, 'tournamentId');
      const target = tournaments.find((t) => same(t.id, tournamentId));
      if (!target) invalid('تورنومنت مورد نظر پیدا نشد.');
      if (!Array.isArray(target.participants) || target.participants.length < 2) {
        invalid('برای قرعه‌کشی و ساخت جدول حداقل ۲ بازیکن یا تیم لازم است.');
      }
      target.bracket = generateSingleEliminationBracket(target.participants, target.maxSlots);
      target.status = 'live';
      await save('tournaments.json', tournaments);
      return bundleResp({ tournament: target });
    }

    if (action === 'record_result') {
      const tournamentId = field(form, 'tournamentId');
      const matchId = field(form, 'matchId');
      const winnerSide = field(form, 'winnerSide');
      const scoreA = form.get('scoreA');
      const scoreB = form.get('scoreB');
      const target = tournaments.find((t) => same(t.id, tournamentId));
      if (!target) invalid('تورنومنت مورد نظر پیدا نشد.');

      const result = recordBracketMatchWinner(target.bracket, matchId, winnerSide, scoreA, scoreB);
      if (result.error) invalid(result.error);

      target.bracket = result.bracket;
      if (result.completed) {
        target.status = 'completed';
        target.completedDateLabel = new Intl.DateTimeFormat('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date());

        if (target.sourceDirectChallengeId) {
          const dcIdx = directChallenges.findIndex((dc) => same(dc.id, target.sourceDirectChallengeId));
          if (dcIdx !== -1) {
            directChallenges[dcIdx].status = 'completed';
            directChallenges[dcIdx].result = {
              winnerGamenetId: result.champion?.gamenetId || '',
              winnerGamenetName: result.champion?.gamenetName || '',
              winnerName: result.champion?.playerName || '',
              scoreA: target.bracket.finalScore?.scoreA ?? 0,
              scoreB: target.bracket.finalScore?.scoreB ?? 0,
              verified: true,
              completedAt: target.bracket.completedAt || new Date().toISOString(),
            };
            directChallenges[dcIdx].updatedAt = new Date().toISOString();
            await save('tournament_direct_challenges.json', directChallenges);
          }
        }
      }
      await save('tournaments.json', tournaments);
      return bundleResp({ tournament: target });
    }

    if (action === 'update_tournament_prize') {
      const tournamentId = field(form, 'tournamentId');
      const modeAction = cleanText(form.get('modeAction'), 30) || 'confirm';
      const target = tournaments.find((t) => same(t.id, tournamentId));
      if (!target) invalid('تورنومنت مورد نظر پیدا نشد.');

      if (modeAction === 'propose') {
        const summary = cleanText(form.get('summary'), 160);
        if (summary.length < 3) invalid('شرح جایزه پیشنهادی را وارد کنید.');
        target.prizeAgreement = {
          ...(target.prizeAgreement || {}),
          status: 'proposed',
          summary,
          prizeType: cleanText(form.get('prizeType'), 30) || target.prizeType || 'playtime',
          proposedByGamenetId: LOCAL_GAMENET_ID,
          proposedByGamenetName: LOCAL_GAMENET_NAME,
          confirmedGamenetIds: [LOCAL_GAMENET_ID],
        };
        target.prizes = { ...(target.prizes || {}), first: summary };
      } else {
        const allIds = new Set(target.prizeAgreement?.confirmedGamenetIds || []);
        allIds.add(LOCAL_GAMENET_ID);
        if (modeAction === 'finalize_all') {
          (target.participants || []).forEach((p) => {
            if (p.gamenetId) allIds.add(String(p.gamenetId));
          });
        }
        target.prizeAgreement = {
          ...(target.prizeAgreement || {}),
          confirmedGamenetIds: Array.from(allIds),
        };
        target.prizeAgreement.status =
          modeAction === 'finalize_all' ? 'agreed' : computePrizeAgreementStatus(target);
      }

      await save('tournaments.json', tournaments);
      return bundleResp({ tournament: target });
    }

    if (action === 'delete') {
      const tournamentId = field(form, 'tournamentId');
      const next = tournaments.filter((t) => !same(t.id, tournamentId));
      await save('tournaments.json', next);
      return { status: 'ok', tournaments: next, teams, challenges };
    }

    /* --- MY GAMING CENTER'S REPRESENTATIVE TEAMS --- */
    if (action === 'create_team') {
      const sanitized = sanitizeTeamInput({
        name: form.get('name'),
        category: form.get('category'),
        gameId: form.get('gameId'),
        customGameName: form.get('customGameName'),
        entryType: form.get('entryType'),
        members: form.get('members'),
        onlineTag: form.get('onlineTag'),
        notes: form.get('notes'),
      });
      if (sanitized.error) invalid(sanitized.error);

      const createdTeam = {
        id: 'team-' + randomUUID().slice(0, 8),
        ...sanitized.value,
        createdAt: new Date().toISOString(),
      };
      const nextTeams = [createdTeam, ...teams].slice(0, 60);
      await save('tournament_teams.json', nextTeams);
      return { status: 'ok', team: createdTeam, tournaments, teams: nextTeams, challenges };
    }

    if (action === 'promote_winner_to_team') {
      const tournamentId = field(form, 'tournamentId');
      const target = tournaments.find((t) => same(t.id, tournamentId));
      if (!target || !target.bracket?.champion) {
        invalid('این مسابقه هنوز برنده نهایی ندارد.');
      }
      const champ = target.bracket.champion;
      const members =
        Array.isArray(champ.members) && champ.members.length > 0
          ? champ.members
          : [{ name: champ.playerName, customerId: null, role: 'قهرمان داخلی' }];
      const createdTeam = {
        id: 'team-' + randomUUID().slice(0, 8),
        name: champ.playerName,
        category: target.category,
        mode: target.mode,
        gameId: target.gameId,
        gameName: target.gameName,
        entryType: members.length > 1 ? 'team' : 'individual',
        onlineTag: target.mode === 'online' ? champ.onlineId || '' : '',
        members,
        notes: `برگزیده شده از «${target.title}»`,
        gamenetId: LOCAL_GAMENET_ID,
        gamenetName: LOCAL_GAMENET_NAME,
        city: LOCAL_GAMENET_CITY,
        createdAt: new Date().toISOString(),
      };
      const nextTeams = [createdTeam, ...teams].slice(0, 60);
      await save('tournament_teams.json', nextTeams);
      return { status: 'ok', team: createdTeam, tournaments, teams: nextTeams, challenges };
    }

    if (action === 'delete_team') {
      const teamId = field(form, 'teamId');
      const nextTeams = teams.filter((tm) => !same(tm.id, teamId));
      await save('tournament_teams.json', nextTeams);
      return { status: 'ok', tournaments, teams: nextTeams, challenges };
    }

    /* --- PUBLIC CHALLENGES, ACCEPTANCE, PRIZE AGREEMENTS & AUTO-FORMATION --- */
    if (action === 'create_challenge') {
      const sanitized = sanitizeChallengeInput({
        title: form.get('title'),
        statement: form.get('statement'),
        category: form.get('category'),
        gameId: form.get('gameId'),
        customGameName: form.get('customGameName'),
        platform: form.get('platform'),
        venue: form.get('venue'),
        competitionScope: form.get('competitionScope'),
        entryType: form.get('entryType'),
        format: form.get('format'),
        maxCenters: form.get('maxCenters'),
        preferredDate: form.get('preferredDate'),
        registrationDeadline: form.get('registrationDeadline'),
        teamId: form.get('teamId'),
        teamName: form.get('teamName'),
        onlineTag: form.get('onlineTag'),
        members: form.get('members'),
        prizeType: form.get('prizeType'),
        suggestedPrize: form.get('suggestedPrize'),
        prizePoolValue: form.get('prizePoolValue'),
      });
      if (sanitized.error) invalid(sanitized.error);

      const createdChallenge = {
        id: 'chl-' + randomUUID().slice(0, 8),
        ...sanitized.value,
        createdAt: new Date().toISOString(),
      };
      const nextChallenges = [createdChallenge, ...challenges].slice(0, 60);
      await save('tournament_challenges.json', nextChallenges);
      return { status: 'ok', challenge: createdChallenge, tournaments, teams, challenges: nextChallenges };
    }

    if (action === 'accept_challenge') {
      const challengeId = field(form, 'challengeId');
      const idx = challenges.findIndex((c) => same(c.id, challengeId));
      if (idx === -1) invalid('چالش مورد نظر پیدا نشد.');

      const result = acceptChallengeForCenter(challenges[idx], {
        gamenetId: form.get('gamenetId') || LOCAL_GAMENET_ID,
        gamenetName: form.get('gamenetName') || LOCAL_GAMENET_NAME,
        city: form.get('city') || LOCAL_GAMENET_CITY,
        teamId: form.get('teamId') || '',
        teamName: form.get('teamName'),
        onlineId: form.get('onlineId') || '',
        members: form.get('members'),
        confirmPrize: form.get('confirmPrize'),
        counterPrize: form.get('counterPrize') || '',
        counterPrizeType: form.get('counterPrizeType') || '',
      });
      if (result.error) invalid(result.error);

      challenges[idx] = result.challenge;
      await save('tournament_challenges.json', challenges);
      return bundleResp({ challenge: result.challenge });
    }

    if (action === 'propose_prize' || action === 'confirm_prize') {
      const challengeId = field(form, 'challengeId');
      const idx = challenges.findIndex((c) => same(c.id, challengeId));
      if (idx === -1) invalid('چالش مورد نظر پیدا نشد.');

      const result = updateChallengePrizeAgreement(challenges[idx], {
        actionType:
          action === 'propose_prize'
            ? 'propose'
            : form.get('finalizeAll') === '1'
              ? 'finalize_all'
              : 'confirm',
        gamenetId: form.get('gamenetId') || LOCAL_GAMENET_ID,
        gamenetName: form.get('gamenetName') || LOCAL_GAMENET_NAME,
        summary: form.get('summary') || '',
        prizeType: form.get('prizeType') || '',
        prizePoolValue: form.get('prizePoolValue'),
      });
      if (result.error) invalid(result.error);

      challenges[idx] = result.challenge;
      await save('tournament_challenges.json', challenges);
      return bundleResp({ challenge: result.challenge });
    }

    if (action === 'form_tournament') {
      const challengeId = field(form, 'challengeId');
      const idx = challenges.findIndex((c) => same(c.id, challengeId));
      if (idx === -1) invalid('چالش مورد نظر پیدا نشد.');

      const generatedId = 'trn-' + randomUUID().slice(0, 8);
      const built = buildTournamentFromChallenge(
        challenges[idx],
        {
          title: form.get('title') || '',
          startDate: form.get('startDate') || '',
          registrationDeadline: form.get('registrationDeadline') || '',
          venue: form.get('venue') || '',
          platform: form.get('platform') || '',
          maxSlots: form.get('maxSlots') || '',
          format: form.get('format') || '',
          prizeSummary: form.get('prizeSummary') || '',
          prizeSecond: form.get('prizeSecond') || '',
          prizeThird: form.get('prizeThird') || '',
          confirmPrizeNow: form.get('confirmPrizeNow') || '',
          rules: form.get('rules') || '',
        },
        generatedId
      );
      if (built.error) invalid(built.error);

      challenges[idx].status = 'formed';
      challenges[idx].formedTournamentId = built.tournament.id;
      if (built.tournament.prizeAgreement?.status === 'agreed') {
        challenges[idx].prizeAgreement.status = 'agreed';
      }

      const nextTournaments = [built.tournament, ...tournaments].slice(0, 80);
      await Promise.all([
        save('tournaments.json', nextTournaments),
        save('tournament_challenges.json', challenges),
      ]);
      return {
        status: 'ok',
        tournament: built.tournament,
        challenge: challenges[idx],
        tournaments: nextTournaments,
        teams,
        challenges,
      };
    }

    if (action === 'delete_challenge') {
      const challengeId = field(form, 'challengeId');
      const nextChallenges = challenges.filter((c) => !same(c.id, challengeId));
      await save('tournament_challenges.json', nextChallenges);
      return { status: 'ok', tournaments, teams, challenges: nextChallenges, directChallenges };
    }

    /* --- DIRECT GAMING CENTER CHALLENGES ("چالش مستقیم") --- */
    if (action === 'create_direct_challenge') {
      const sanitized = sanitizeDirectChallengeInput({
        targetGamenetId: form.get('targetGamenetId'),
        targetGamenetName: form.get('targetGamenetName'),
        category: form.get('category'),
        gameId: form.get('gameId'),
        customGameName: form.get('customGameName'),
        mode: form.get('mode'),
        entryType: form.get('entryType'),
        format: form.get('format'),
        platform: form.get('platform'),
        venue: form.get('venue'),
        proposedDate: form.get('proposedDate'),
        proposedTime: form.get('proposedTime'),
        prizeType: form.get('prizeType'),
        prizeSummary: form.get('prizeSummary'),
        notes: form.get('notes'),
        teamId: form.get('teamId'),
        teamName: form.get('teamName'),
        onlineId: form.get('onlineId'),
        members: form.get('members'),
      });
      if (sanitized.error) invalid(sanitized.error);

      const created = {
        id: 'dch-' + randomUUID().slice(0, 8),
        ...sanitized.value,
        createdAt: new Date().toISOString(),
      };
      const nextDirect = [created, ...directChallenges].slice(0, 80);
      await save('tournament_direct_challenges.json', nextDirect);
      return {
        status: 'ok',
        directChallenge: created,
        tournaments,
        teams,
        challenges,
        directChallenges: nextDirect,
      };
    }

    if (action === 'accept_direct_challenge') {
      const directId = field(form, 'directId');
      const idx = directChallenges.findIndex((dc) => same(dc.id, directId));
      if (idx === -1) invalid('چالش مستقیم مورد نظر پیدا نشد.');

      const accepted = acceptDirectChallenge(directChallenges[idx], {
        teamId: form.get('teamId') || '',
        teamName: form.get('teamName') || '',
        onlineId: form.get('onlineId') || '',
        members: form.get('members') || '',
      });
      if (accepted.error) invalid(accepted.error);

      let createdMatch = null;
      let nextTournaments = tournaments;
      if (!accepted.challenge.linkedTournamentId) {
        const built = buildHeadToHeadMatchFromDirectChallenge(
          accepted.challenge,
          'trn-h2h-' + randomUUID().slice(0, 6)
        );
        if (!built.error) {
          accepted.challenge.linkedTournamentId = built.tournament.id;
          createdMatch = built.tournament;
          nextTournaments = [built.tournament, ...tournaments].slice(0, 80);
        }
      }

      directChallenges[idx] = accepted.challenge;
      await Promise.all([
        save('tournament_direct_challenges.json', directChallenges),
        ...(createdMatch ? [save('tournaments.json', nextTournaments)] : []),
      ]);
      return {
        status: 'ok',
        directChallenge: accepted.challenge,
        tournament: createdMatch,
        tournaments: nextTournaments,
        teams,
        challenges,
        directChallenges,
      };
    }

    if (action === 'reject_direct_challenge') {
      const directId = field(form, 'directId');
      const idx = directChallenges.findIndex((dc) => same(dc.id, directId));
      if (idx === -1) invalid('چالش مستقیم مورد نظر پیدا نشد.');

      const rejected = rejectDirectChallenge(directChallenges[idx], {
        reason: form.get('reason') || '',
      });
      if (rejected.error) invalid(rejected.error);

      directChallenges[idx] = rejected.challenge;
      await save('tournament_direct_challenges.json', directChallenges);
      return bundleResp({ directChallenge: rejected.challenge });
    }

    if (action === 'propose_direct_changes') {
      const directId = field(form, 'directId');
      const idx = directChallenges.findIndex((dc) => same(dc.id, directId));
      if (idx === -1) invalid('چالش مستقیم مورد نظر پیدا نشد.');

      const proposed = proposeDirectChallengeChanges(directChallenges[idx], {
        proposerGamenetId: form.get('proposerGamenetId') || LOCAL_GAMENET_ID,
        proposedDate: form.get('proposedDate'),
        proposedTime: form.get('proposedTime'),
        mode: form.get('mode'),
        venue: form.get('venue'),
        format: form.get('format'),
        prizeType: form.get('prizeType'),
        prizeSummary: form.get('prizeSummary'),
        notes: form.get('notes'),
        teamId: form.get('teamId') || '',
        teamName: form.get('teamName') || '',
        onlineId: form.get('onlineId') || '',
        members: form.get('members') || '',
      });
      if (proposed.error) invalid(proposed.error);

      directChallenges[idx] = proposed.challenge;
      await save('tournament_direct_challenges.json', directChallenges);
      return bundleResp({ directChallenge: proposed.challenge });
    }

    if (action === 'confirm_direct_terms') {
      const directId = field(form, 'directId');
      const idx = directChallenges.findIndex((dc) => same(dc.id, directId));
      if (idx === -1) invalid('چالش مستقیم مورد نظر پیدا نشد.');

      const confirmed = confirmDirectChallengeTerms(directChallenges[idx], {
        gamenetId: form.get('gamenetId') || LOCAL_GAMENET_ID,
        confirmBoth: form.get('confirmBoth') || '',
        teamId: form.get('teamId') || '',
        teamName: form.get('teamName') || '',
        onlineId: form.get('onlineId') || '',
        members: form.get('members') || '',
      });
      if (confirmed.error) invalid(confirmed.error);

      let createdMatch = null;
      let nextTournaments = tournaments;
      if (confirmed.bothAgreed && !confirmed.challenge.linkedTournamentId) {
        const built = buildHeadToHeadMatchFromDirectChallenge(
          confirmed.challenge,
          'trn-h2h-' + randomUUID().slice(0, 6)
        );
        if (!built.error) {
          confirmed.challenge.linkedTournamentId = built.tournament.id;
          createdMatch = built.tournament;
          nextTournaments = [built.tournament, ...tournaments].slice(0, 80);
        }
      }

      directChallenges[idx] = confirmed.challenge;
      await Promise.all([
        save('tournament_direct_challenges.json', directChallenges),
        ...(createdMatch ? [save('tournaments.json', nextTournaments)] : []),
      ]);
      return {
        status: 'ok',
        directChallenge: confirmed.challenge,
        bothAgreed: confirmed.bothAgreed,
        tournament: createdMatch,
        tournaments: nextTournaments,
        teams,
        challenges,
        directChallenges,
      };
    }

    if (action === 'delete_direct_challenge') {
      const directId = field(form, 'directId');
      const nextDirect = directChallenges.filter((dc) => !same(dc.id, directId));
      await save('tournament_direct_challenges.json', nextDirect);
      return { status: 'ok', tournaments, teams, challenges, directChallenges: nextDirect };
    }

    invalid('عملیات تورنومنت نامعتبر است.');
  },
};

export const isAction = name => Object.hasOwn(routes, name);

let pending = Promise.resolve();

export function runAction(name, form) {
  // Serialize read-modify-write operations within this server process.
  const result = pending.then(() => routes[name](form));
  pending = result.catch(() => {});
  return result;
}

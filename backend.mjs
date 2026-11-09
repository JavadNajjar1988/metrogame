import { randomInt, randomUUID } from 'node:crypto';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

function field(form, key) {
  const value = form.get(key);
  if (typeof value !== 'string' || !value.trim()) invalid('مقدار الزامی وارد نشده است.');
  return value;
}

function number(form, key, minimum = 0) {
  const value = Number(field(form, key));
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
  await update(name, data => {
    const tables = { ...data };
    delete tables[table];
    return tables;
  });
  return redirect('index.html');
}

const routes = {
  'process.php': async form => {
    const tableNumber = field(form, 'tableNumber');
    const reservations = await readData('reservations.json');
    if (reservations.some(item => same(item.tableNumber, tableNumber))) {
      return { error: 'شماره میز تکراری است.' };
    }
    const priceType = field(form, 'priceType');
    const consoleType = field(form, 'consoleType');
    const { consoles } = await readData('data.json');
    if (!Object.hasOwn(prices, priceType) || !consoles.some(item => item.name === consoleType)) {
      invalid('تعرفه یا کنسول معتبر نیست.');
    }
    await save('reservations.json', [...reservations, {
      tableNumber, consoleType, priceType,
      paymentType: form.get('paymentType'),
      prePaymentCost: form.get('pre-payment-cost'),
      postPayment: form.get('post-payment'),
      prePayment: form.get('pre-payment'),
    }]);
    return ok;
  },
  'timing.php': form => startTimer(form, false),
  'timer.php': form => startTimer(form, true),
  'charging.php': async form => {
    const table = field(form, 'tableNumber');
    const seconds = number(form, 'charge_Time');
    const timers = await readData('finishTime.json');
    const timer = timers.find(item => same(item.tableNumber, table));
    if (!timer) invalid('زمان‌سنج میز پیدا نشد.');
    timer.finishTime = Number(timer.finishTime) + seconds;
    await save('finishTime.json', timers);
    return { finishTime: timer.finishTime };
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
    if (!selected || !Object.hasOwn(prices, priceType)) invalid('تعرفه یا کنسول معتبر نیست.');
    const gameCost = number(form, 'gameCost');
    return appendForTable('game_temporary.json', form, { cosoleprice: selected[priceType], gameCost, consoleType, priceType });
  },
  'delete_game_temperory.php': form => removeTemporary('game_temporary.json', form),
  'delete_buffet_temperory.php': form => removeTemporary('buffet_temporary.json', form),
  'costomers.php': async form => {
    const customerName = field(form, 'costomerName');
    const accountCharge = form.get('acountCharge') ? number(form, 'acountCharge') : 0;
    await update('customer_data.json', customers => {
      const customerId = idFor(new Set(Object.keys(customers)));
      return { ...customers, [customerId]: { customerId, customerName, accountCharge } };
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
};

export const isAction = name => Object.hasOwn(routes, name);

let pending = Promise.resolve();

export function runAction(name, form) {
  // Serialize read-modify-write operations within this server process.
  const result = pending.then(() => routes[name](form));
  pending = result.catch(() => {});
  return result;
}

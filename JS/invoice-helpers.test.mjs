import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeInvoiceDigits,
  resolveInvoiceTableSelection,
  resolvePrimaryConsoleType,
  computeInvoiceTotals,
  buildBuffetPaymentPayload,
  validateInvoiceSettlementInput,
} from './invoice-helpers.mjs';

test('resolveInvoiceTableSelection returns empty selection when no active tables or orders exist', () => {
  const result = resolveInvoiceTableSelection({
    requestedTable: '',
    gameTempMap: {},
    buffetTempMap: {},
    reservationsList: [],
  });
  assert.deepEqual(result.availableTables, []);
  assert.equal(result.chosenTable, '');
});

test('resolveInvoiceTableSelection ignores empty arrays in temp maps and prefers requested table', () => {
  const result = resolveInvoiceTableSelection({
    requestedTable: '4',
    gameTempMap: { 1: [] },
    buffetTempMap: { 4: [{ title: 'چای', quantity: 1, unitPrice: 2000 }] },
    reservationsList: [{ tableNumber: '2', consoleType: 'ps4' }],
  });
  assert.deepEqual(result.availableTables, ['4', '2']);
  assert.equal(result.chosenTable, '4');
});

test('resolvePrimaryConsoleType avoids defaulting buffet-only orders to ps50', () => {
  assert.equal(
    resolvePrimaryConsoleType({
      gameItems: [],
      reservationsList: [],
      tableNumber: '5',
    }),
    'buffet_only'
  );

  assert.equal(
    resolvePrimaryConsoleType({
      gameItems: [],
      reservationsList: [{ tableNumber: '2', consoleType: 'ps4' }],
      tableNumber: '2',
    }),
    'ps4'
  );

  assert.equal(
    resolvePrimaryConsoleType({
      gameItems: [{ consoleType: 'xbox', gameCost: 30000 }],
      reservationsList: [],
      tableNumber: '2',
    }),
    'xbox'
  );
});

test('computeInvoiceTotals and buildBuffetPaymentPayload compute accurate totals and payloads', () => {
  const totals = computeInvoiceTotals(
    [{ gameCost: 25400 }],
    [{ productType: 'cold_drink', quantity: 2, unitPrice: 25000 }]
  );
  assert.equal(totals.gameTotal, 25400);
  assert.equal(totals.buffetTotal, 50000);
  assert.equal(totals.rawTotal, 75400);
  assert.equal(totals.payable, 75000);
  assert.equal(totals.roundingDiff, 400);
  assert.equal(totals.totalBuffetQty, 2);

  assert.deepEqual(
    buildBuffetPaymentPayload([{ productType: 'cold_drink', quantity: 2, unitPrice: 25000 }]),
    [['cold_drink', 50000]]
  );
});

test('validateInvoiceSettlementInput rejects empty table, zero total, missing customer/debtor and normalizes digits', () => {
  assert.equal(
    validateInvoiceSettlementInput({
      tableNumber: '',
      totals: { rawTotal: 10000, payable: 10000 },
    }).ok,
    false
  );

  assert.equal(
    validateInvoiceSettlementInput({
      tableNumber: '2',
      totals: { rawTotal: 0, payable: 0 },
    }).ok,
    false
  );

  const custCheck = validateInvoiceSettlementInput({
    tableNumber: '2',
    totals: { rawTotal: 25000, payable: 25000 },
    payWay: 'acount',
    customerId: '۰۵۰۵۲',
  });
  assert.equal(custCheck.ok, true);
  assert.equal(custCheck.customerId, '05052');

  assert.equal(
    validateInvoiceSettlementInput({
      tableNumber: '2',
      totals: { rawTotal: 25000, payable: 25000 },
      payWay: 'debt',
      debtorName: '   ',
    }).ok,
    false
  );

  assert.equal(normalizeInvoiceDigits('۱۲۳۴'), '1234');
});

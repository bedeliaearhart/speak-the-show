import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hangCheck, trimCheck, ceilingCheck, throwRange, luxOnImage, wattsToAmps, capacity, trueHeight, buildShow, cableLengthFt } from './checks.js';

test('hang vs stack: 8 / 10 / 12 KARA II on one ST-25', () => {
  assert.equal(hangCheck(8, 26, 25, 295).status, 'green');
  assert.equal(hangCheck(8, 26, 25, 295).value, 233);
  const ten = hangCheck(10, 26, 25, 295);
  assert.equal(ten.status, 'amber');
  assert.equal(ten.value, 285);
  const twelve = hangCheck(12, 26, 25, 295);
  assert.equal(twelve.status, 'red');
  assert.equal(twelve.value, 337);
  assert.match(twelve.reason, /Ground stack/);
});

test('trim and ceiling', () => {
  assert.equal(trimCheck(8.2, 7.94).status, 'red');
  assert.equal(trimCheck(6, 7.94).status, 'green');
  assert.equal(ceilingCheck(4.6, 4.5).status, 'red');
  assert.equal(ceilingCheck(4.3, 4.5).status, 'amber');
  assert.equal(ceilingCheck(3.5, 4.5).status, 'green');
});

test('throw, washout, power, capacity, height', () => {
  assert.deepEqual(throwRange(6, 1.57, 2.56), [9.4, 15.4]);
  assert.ok(Math.abs(luxOnImage(12000, 6, 3.75) - 533) <= 1);
  assert.equal(wattsToAmps(955), 8);
  assert.equal(capacity(100), 215);
  assert.equal(trueHeight(4.5, 3.2), 7.7);
  assert.equal(cableLengthFt(3), 15);
});

test('default scrim stage builds with a budget and checks', () => {
  const show = buildShow({}, { widthM: 12, frontDepthM: 12, ceilingM: 4.5, floorElevationM: 4.5 });
  assert.ok(show.items.some((i) => i.id === 'scrim'));
  assert.ok(show.budget.low > 0);
  assert.ok(show.budget.quoteOnly > 0);
  assert.ok(show.cables.length > 4);
  assert.equal(show.checks.find((c) => c.name === 'Projector throw').status, 'green');
  const tight = buildShow({}, { widthM: 8, frontDepthM: 5, ceilingM: 3, floorElevationM: 4.5, crowd: 'seated' });
  assert.equal(tight.checks.find((c) => c.name === 'Projector throw').status, 'red');
});

test('space picks the projection strategy', () => {
  const standing = buildShow({}, { crowd: 'standing', backDepthM: 4 });
  assert.equal(standing.strategy.mode, 'rear');
  assert.ok(standing.items.find((i) => i.id === 'projector').y > 0);
  const seated = buildShow({}, { crowd: 'seated', backDepthM: 4 });
  assert.equal(seated.strategy.mode, 'front');
  assert.ok(seated.items.find((i) => i.id === 'projector').y < 0);
  const shallow = buildShow({}, { crowd: 'standing', backDepthM: 1 });
  assert.equal(shallow.strategy.mode, 'front-flown');
});

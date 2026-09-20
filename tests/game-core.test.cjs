const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../h5/game-core.js');

function draftedRun(seed = 42) {
  const run = C.createRun('outside', seed);
  for (let i = 0; i < 6; i++) {
    const offer = C.makeOffer(run);
    assert.equal(new Set(offer).size, 4);
    const result = C.recruit(run, offer[0]);
    assert.equal(result.ok, true);
  }
  assert.equal(C.starterCount(run), 6);
  return run;
}

test('six opening drafts produce six distinct starters and a playable lineup', () => {
  const run = draftedRun();
  assert.equal(Object.keys(run.owned).length, 6);
  assert.equal(run.free, 1);
  assert.ok(C.fused(run).rating > 0);
});

test('bench swap changes the fused attributes and keeps both cards', () => {
  const run = draftedRun();
  const before = C.fused(run).stats;
  const next = C.makeOffer(run).find(id => !run.owned[id]);
  assert.ok(next);
  assert.equal(C.recruit(run, next).kind, 'bench');
  const old = run.slots.three;
  assert.equal(C.swapBench(run, 0, 'three'), true);
  assert.equal(run.slots.three, next);
  assert.equal(run.bench[0], old);
  assert.notDeepEqual(C.fused(run).stats, before);
});

test('full bench requires explicit sale or replacement', () => {
  const run = draftedRun();
  const spare = C.STARS.filter(s => !run.owned[s.id]).slice(0, 5);
  spare.forEach(s => { run.owned[s.id] = { stars: 1, train: 0, trainedAt: 0 }; run.bench.push(s.id) });
  const candidate = C.STARS.find(s => !run.owned[s.id]);
  run.offer = [candidate.id];
  run.free = 1;
  const answer = C.recruit(run, candidate.id);
  assert.equal(answer.kind, 'pending');
  assert.equal(run.pending, candidate.id);
  assert.equal(run.owned[candidate.id], undefined);
  assert.equal(C.resolvePending(run, 'replace', 0), true);
  assert.equal(run.bench.length, 5);
  assert.ok(run.owned[candidate.id]);
  assert.equal(run.pending, null);
});

test('training is limited to once per stage and battle rewards cannot be claimed twice', () => {
  const game = C.createGame();
  game.run = draftedRun();
  const run = game.run;
  const id = run.slots.three;
  assert.equal(C.train(run, id), true);
  assert.equal(C.train(run, id), false);
  const report = C.battle(game, 'outside');
  assert.ok(report);
  const cash = run.cash;
  assert.equal(C.battle(game, 'outside'), null);
  assert.equal(run.cash, cash);
  if (run.ended) {
    assert.equal(C.finishRun(game), 0);
  } else {
    assert.equal(C.continueRun(game, report.won ? 'next' : 'retry'), true);
    assert.equal(run.lastBattle, null);
  }
  assert.ok(Buffer.byteLength(JSON.stringify(game)) < 200000);
});

test('strategy counter is awarded to the correct side', () => {
  const counterGame = C.createGame();
  counterGame.run = draftedRun(99);
  assert.equal(C.opponent(counterGame.run).strategy, 'drive');
  assert.equal(C.battle(counterGame, 'collapse').beats, 1);
  const weakGame = C.createGame();
  weakGame.run = draftedRun(99);
  assert.equal(C.battle(weakGame, 'outside').beats, -1);
});

test('a seeded run can finish ten stages and enter endless play', () => {
  const game = C.createGame();
  const run = game.run = C.createRun('outside', 1);
  for (let i = 0; i < 6; i++) {
    const offer = C.makeOffer(run);
    const choice = offer.slice().sort((a, b) => C.BY_ID[b].attrs[C.BY_ID[b].best] - C.BY_ID[a].attrs[C.BY_ID[a].best])[0];
    C.recruit(run, choice);
  }
  let attempts = 0;
  while (run.stage <= 10 && !run.ended && attempts++ < 30) {
    for (const id of Object.keys(run.owned)) C.train(run, id);
    for (const item of C.GEAR) C.buyGear(run, item.id);
    const foe = C.opponent(run);
    const counter = Object.keys(C.STRATEGIES).find(id => C.STRATEGIES[id].beats === foe.strategy);
    const report = C.battle(game, counter);
    assert.ok(report);
    if (!run.ended) C.continueRun(game, report.won ? 'next' : 'retry');
  }
  assert.equal(run.wins, 10);
  assert.equal(run.stage, 11);
  assert.equal(run.endless, true);
});

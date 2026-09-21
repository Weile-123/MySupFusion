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

test('second edition player and synergy data forms a complete network', () => {
  const basePlayers = C.STARS.filter(star => !star.variantOf);
  const variants = C.STARS.filter(star => star.variantOf);
  assert.equal(basePlayers.length, 60);
  assert.equal(variants.length, 10);
  assert.equal(C.SYNERGIES.length, 40);
  assert.deepEqual(
    Object.fromEntries([2, 3, 4, 5].map(size => [size, C.SYNERGIES.filter(bond => bond.ids.length === size).length])),
    { 2: 24, 3: 9, 4: 4, 5: 3 }
  );
  const covered = new Set(C.SYNERGIES.flatMap(bond => bond.ids));
  assert.deepEqual(basePlayers.filter(star => !covered.has(star.id)).map(star => star.id), []);
  assert.deepEqual(C.STARS.filter(star => C.starSynergies(star.id).length === 0).map(star => star.id), []);
  for (const bond of C.SYNERGIES) {
    assert.equal(new Set(bond.ids).size, bond.ids.length);
    assert.ok(bond.ids.every(id => C.BY_ID[id] && !C.BY_ID[id].variantOf));
    assert.ok(bond.description.length > 0);
    assert.ok(Object.keys(bond.effect.stats).every(attr => C.ATTRS.includes(attr)));
  }
});

test('all cards use six attributes and obey their tier ceilings', () => {
  assert.deepEqual(C.ATTRS, ['three', 'mid', 'drive', 'handle', 'inside', 'def']);
  assert.equal(C.LABELS.inside, '篮下');
  assert.equal(C.LABELS.post, undefined);
  assert.equal(C.LABELS.rebound, undefined);
  const ceilings = { C: 82, B: 88, A: 94, S: 99, L: 112 };
  const mainFloors = { C: 78, B: 83, A: 89, S: 95, L: 108 };
  for (const star of C.STARS) {
    assert.deepEqual(Object.keys(star.attrs), C.ATTRS);
    assert.ok(Object.values(star.attrs).every(value => value <= ceilings[star.tier]));
    assert.ok(star.attrs[star.best] >= mainFloors[star.tier]);
    assert.ok(C.ATTRS.includes(star.talentEffect.attr));
    assert.match(star.talentEffect.description, /安排在.+槽时，.+额外 \+\d/);
  }
  assert.equal(C.BY_ID.benwallace.tier, 'B');
  assert.equal(C.BY_ID.benwallace.best, 'def');
  assert.equal(C.BY_ID.benwallace.attrs.def, 88);
  for (const [tier, expected] of [['S', [95, 99]], ['L', [108, 112]]]) {
    const scores = C.STARS.filter(star => star.tier === tier).map(star => star.attrs[star.best]);
    assert.deepEqual([Math.min(...scores), Math.max(...scores)], expected);
  }
});

test('the six mandatory opening drafts exclude recruited players', () => {
  const run = C.createRun('outside', 20260921);
  const recruited = new Set();
  for (let pick = 0; pick < 6; pick++) {
    assert.equal(run.offer.length, 4);
    assert.equal(new Set(run.offer).size, 4);
    assert.ok(run.offer.every(id => !recruited.has(id)));
    const selected = run.offer[0];
    assert.equal(C.recruit(run, selected).ok, true);
    recruited.add(selected);
    if (pick < 5) C.makeOffer(run);
  }
  assert.equal(recruited.size, 6);
  assert.equal(C.starterCount(run), 6);
});

test('draft rarity rises with stage and supports a future scouting upgrade', () => {
  const run = C.createRun('outside', 11);
  const early = C.tierOdds(run);
  assert.deepEqual(early, { C: 45, B: 40, A: 14.5, S: 0.5, L: 0 });
  run.stage = 9;
  const late = C.tierOdds(run);
  assert.equal(late.L, 5);
  assert.equal(late.S, 21);
  assert.ok(late.L > early.L && late.S > early.S);
  run.rarityBonus = 4;
  const upgraded = C.tierOdds(run);
  assert.ok(upgraded.L > late.L && upgraded.S > late.S);
  assert.equal(Object.values(upgraded).reduce((sum, value) => sum + value, 0), 100);
});

test('one free recruit is reset each stage and cannot be banked', () => {
  const game = C.createGame();
  const run = game.run = C.createRun('outside', 21);
  run.free = 5;
  run.lastBattle = { won: true };
  assert.equal(C.continueRun(game, 'next'), true);
  assert.equal(run.stage, 2);
  assert.equal(run.free, 1);
  assert.equal(C.recruitCost(run), 8);
  const agentRun = C.createRun('agent', 21);
  assert.equal(C.recruitCost(agentRun), 6);
});

test('exclusive talents add stats only in the recommended slot', () => {
  const run = C.createRun('outside', 3);
  run.offer = [];
  run.owned.curry = { stars: 1, train: 0, trainedAt: 0 };
  run.slots.three = 'curry';
  const gain = C.BY_ID.curry.talentEffect.gain;
  const original = C.BY_ID.curry.talentEffect.gain;
  C.BY_ID.curry.talentEffect.gain = 0;
  const withoutTalent = C.fused(run).stats.three;
  C.BY_ID.curry.talentEffect.gain = original;
  assert.equal(C.fused(run).stats.three, withoutTalent + gain);
  C.swapPositions(run, { kind: 'slot', key: 'three' }, { kind: 'slot', key: 'mid' });
  assert.ok(!C.fused(run).talents.some(star => star.id === 'curry'));
});

test('legend variants inherit identity and bonds while keeping higher growth caps', () => {
  const legend = C.BY_ID.king_lebron;
  assert.equal(legend.variantOf, 'lebron');
  assert.equal(legend.maxStars, 5);
  assert.equal(legend.maxTrain, 5);
  assert.deepEqual(C.starSynergies('king_lebron').map(b => b.id), C.starSynergies('lebron').map(b => b.id));
  const run = C.createRun('outside', 7);
  run.offer = ['king_lebron'];
  run.free = 1;
  assert.equal(C.recruit(run, 'king_lebron').ok, true);
  const owned = run.owned.king_lebron;
  owned.stars = 4;
  run.offer = ['king_lebron'];
  run.free = 1;
  assert.equal(C.recruit(run, 'king_lebron').kind, 'duplicate');
  assert.equal(owned.stars, 5);
});

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

test('players can exchange any occupied lineup and bench positions', () => {
  const run = draftedRun();
  const first = run.slots.three;
  const second = run.slots.mid;
  assert.equal(C.swapPositions(run, { kind: 'slot', key: 'three' }, { kind: 'slot', key: 'mid' }), true);
  assert.equal(run.slots.three, second);
  assert.equal(run.slots.mid, first);
  const spare = C.STARS.filter(s => !run.owned[s.id]).slice(0, 2);
  for (const star of spare) { run.owned[star.id] = { stars: 1, train: 0, trainedAt: 0 }; run.bench.push(star.id) }
  assert.equal(C.swapPositions(run, { kind: 'bench', key: 0 }, { kind: 'bench', key: 1 }), true);
  assert.deepEqual(run.bench, [spare[1].id, spare[0].id]);
  assert.equal(C.swapPositions(run, { kind: 'slot', key: 'three' }, { kind: 'bench', key: 0 }), true);
  assert.equal(run.slots.three, spare[1].id);
  assert.equal(run.bench[0], second);
});

test('selling a bench player removes the card and pays its tier value', () => {
  const run = draftedRun();
  const spare = C.STARS.find(s => !run.owned[s.id]);
  run.owned[spare.id] = { stars: 1, train: 0, trainedAt: 0 };
  run.bench.push(spare.id);
  const cash = run.cash;
  const value = C.saleValue(spare.id);
  assert.ok(value >= 3);
  assert.equal(C.sellBench(run, 0), value);
  assert.equal(run.cash, cash + value);
  assert.equal(run.bench.length, 0);
  assert.equal(run.owned[spare.id], undefined);
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

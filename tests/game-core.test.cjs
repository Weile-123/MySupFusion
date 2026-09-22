const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

test('fourth edition player and synergy data forms a complete network', () => {
  const basePlayers = C.STARS.filter(star => !star.variantOf);
  const variants = C.STARS.filter(star => star.variantOf);
  assert.equal(basePlayers.length, 110);
  assert.equal(variants.length, 7);
  assert.deepEqual(
    Object.fromEntries(['C', 'B', 'A', 'S', 'SSR'].map(tier => [tier, C.STARS.filter(star => star.tier === tier).length])),
    { C: 11, B: 53, A: 32, S: 14, SSR: 7 }
  );
  assert.equal(C.BY_ID.harden.tier, 'S');
  assert.equal(C.BY_ID.jokic.tier, 'A');
  assert.equal(C.BY_ID.fisher.tier, 'C');
  assert.equal(C.SYNERGIES.length, 80);
  assert.deepEqual(
    Object.fromEntries([2, 3, 4, 5].map(size => [size, C.SYNERGIES.filter(bond => bond.ids.length === size).length])),
    { 2: 44, 3: 17, 4: 14, 5: 5 }
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
  const ceilings = { C: 81, B: 88, A: 89, S: 99, SSR: 128 };
  const mainFloors = { C: 78, B: 83, A: 89, S: 95, SSR: 120 };
  for (const star of C.STARS) {
    assert.deepEqual(Object.keys(star.attrs), C.ATTRS);
    assert.ok(Object.values(star.attrs).every(value => value <= ceilings[star.tier]));
    assert.ok(star.attrs[star.best] >= mainFloors[star.tier]);
    assert.ok(C.ATTRS.includes(star.talentEffect.attr));
    assert.match(star.talentEffect.description, /安排在.+槽/);
    assert.match(star.talentEffect.description, /%|奖金/);
  }
  const talentTemplates = {
    three: { stats: { three: 6 } },
    mid: { stats: { mid: 6 } },
    drive: { stats: { drive: 6 } },
    handle: { stats: {}, postBattleCash: 1 },
    inside: { stats: { inside: 10 } },
    def: { stats: { def: 5, handle: 5 } }
  };
  for (const tier of ['C', 'B', 'A']) {
    const stars = C.STARS.filter(star => star.tier === tier);
    assert.ok(stars.length > 0);
    assert.ok(stars.every(star => star.talentEffect.attr === star.best));
    assert.ok(stars.every(star => star.talentEffect.slots.length === 1 && star.talentEffect.slots[0] === star.best));
    assert.ok(stars.every(star => {
      const expected = talentTemplates[star.best];
      return JSON.stringify(star.talentEffect.stats) === JSON.stringify(expected.stats)
        && (star.talentEffect.postBattleCash || 0) === (expected.postBattleCash || 0);
    }));
  }
  assert.equal(C.BY_ID.benwallace.tier, 'B');
  assert.equal(C.BY_ID.benwallace.best, 'def');
  assert.equal(C.BY_ID.benwallace.attrs.def, 88);
  for (const [tier, expected] of [['C', [78, 81]], ['B', [83, 88]], ['A', [89, 89]], ['S', [95, 99]], ['SSR', [120, 128]]]) {
    const scores = C.STARS.filter(star => star.tier === tier).map(star => star.attrs[star.best]);
    assert.deepEqual([Math.min(...scores), Math.max(...scores)], expected);
  }
});

test('SSR cards exactly match the approved seven-player design', () => {
  const expected = [
    ['king_lebron', '天选·詹姆斯', [99, 108, 125, 110, 121, 112], '霸王踏步'],
    ['air_jordan', 'GOAT·乔丹', [94, 125, 121, 106, 113, 120], '神之领域'],
    ['mamba_kobe', '黑曼巴·科比', [108, 120, 117, 108, 108, 117], '曼巴时刻'],
    ['chef_curry', '三分王·库里', [125, 118, 111, 118, 99, 91], '三分引力'],
    ['diesel_shaq', '大鲨鱼·奥尼尔', [85, 94, 97, 90, 128, 125], '禁区粉碎'],
    ['showtime_magic', '魔术师·约翰逊', [91, 104, 110, 125, 111, 103], '表演时刻'],
    ['reaper_durant', '死神·杜兰特', [116, 122, 115, 109, 112, 105], '死神终结']
  ];
  assert.deepEqual(
    C.STARS.filter(star => star.tier === 'SSR').map(star => [star.id, star.name, C.ATTRS.map(attr => star.attrs[attr]), star.talent]),
    expected
  );
  const ssr = C.STARS.filter(star => star.tier === 'SSR');
  assert.ok(ssr.every(star => star.maxStars === 5 && star.maxTrain === 5));
  assert.deepEqual(C.BY_ID.king_lebron.talentEffect.slots, ['drive', 'handle']);
  assert.equal(C.BY_ID.air_jordan.talentEffect.slotEffects.mid.stats.mid, 30);
  assert.equal(C.BY_ID.mamba_kobe.talentEffect.slotEffects.drive.strategyStats.drive.mid, 10);
  assert.equal(C.BY_ID.chef_curry.talentEffect.slotEffects.three.stats.three, 35);
  assert.deepEqual(C.BY_ID.diesel_shaq.talentEffect.slotEffects.def.stats, { inside: 18, def: 18 });
  assert.equal(C.BY_ID.showtime_magic.talentEffect.slotEffects.handle.postBattleCash, 3);
  assert.equal(C.BY_ID.showtime_magic.talentEffect.slotEffects.handle.recruitDiscount, 1);
  assert.equal(C.BY_ID.reaper_durant.talentEffect.slotEffects.mid.all, 12);
});

test('SSR talents activate their slot, strategy, and economy branches', () => {
  const curry = C.createRun('outside', 20260922);
  curry.offer = [];
  curry.owned.chef_curry = { stars: 1, train: 0, trainedAt: 0 };
  curry.slots.three = 'chef_curry';
  const outside = C.fused(curry, 'outside');
  const collapse = C.fused(curry, 'collapse');
  assert.ok(outside.stats.handle > collapse.stats.handle);
  assert.equal(outside.talentEffects[0].stats.three, 35);

  const magic = C.createRun('outside', 20260922);
  magic.offer = [];
  magic.owned.showtime_magic = { stars: 1, train: 0, trainedAt: 0 };
  magic.slots.handle = 'showtime_magic';
  assert.equal(C.recruitCost(magic), 7);
  assert.equal(C.fused(magic).talentEffects[0].postBattleCash, 3);
  magic.slots.handle = null;
  magic.slots.three = 'showtime_magic';
  assert.equal(C.recruitCost(magic), 8);
  assert.equal(C.fused(magic).talents.length, 0);
});

test('approved player specialties use their revised recommended slots', () => {
  const revised = {
    barkley: 'drive', butler: 'drive', payton: 'handle', dumars: 'mid', harper: 'handle',
    marion: 'drive', laimbeer: 'three', bosh: 'mid', griffin: 'drive', aaron_gordon: 'drive',
    lopez: 'three', fox: 'mid', caruso: 'handle', anunoby: 'drive'
  };
  for (const [id, best] of Object.entries(revised)) assert.equal(C.BY_ID[id].best, best);
  const unchanged = { kawhi: 'def', embiid: 'inside', green: 'def', iguodala: 'def', jokic: 'inside' };
  for (const [id, best] of Object.entries(unchanged)) assert.equal(C.BY_ID[id].best, best);
});

test('requested three four and five player bonds use the approved members', () => {
  const expected = {
    four_shooting_guards: ['kobe', 'tmac', 'carter', 'iverson'],
    banana_boat: ['lebron', 'wade', 'paul', 'melo'],
    draft_96: ['kobe', 'iverson', 'nash', 'rayallen'],
    european_kings: ['dirk', 'pau', 'jokic', 'doncic'],
    bad_boys: ['isiah', 'dumars', 'laimbeer', 'rodman'],
    four_centers: ['hakeem', 'shaq', 'robinson', 'ewing'],
    death_lineup: ['curry', 'klay', 'iguodala', 'durant', 'green'],
    bulls_dynasty: ['harper', 'jordan', 'pippen', 'rodman', 'longley'],
    ok_dynasty: ['fisher', 'kobe', 'fox', 'horry', 'shaq'],
    showtime_five: ['magic', 'byron_scott', 'worthy', 'ac_green', 'kareem'],
    final_answer: ['magic', 'jordan', 'lebron', 'duncan', 'shaq'],
    thunder_three: ['durant', 'westbrook', 'harden'],
    heat_big_three: ['lebron', 'wade', 'bosh'],
    celtic_big_three: ['pierce', 'garnett', 'rayallen'],
    bull_triangle: ['jordan', 'pippen', 'rodman'],
    nets_big_three: ['durant', 'harden', 'irving'],
    lob_city: ['paul', 'griffin', 'deandre'],
    celtic_dynasty: ['bird', 'mchale', 'parish'],
    ok3: ['westbrook', 'george', 'melo'],
    gdp: ['duncan', 'parker', 'ginobili'],
    mamba_students: ['kobe', 'irving', 'tatum'],
    cavs_big_three: ['lebron', 'irving', 'love'],
    era_shooters: ['reggie', 'rayallen', 'curry'],
    seven_seconds: ['nash', 'amare', 'marion'],
    nuggets_core: ['jokic', 'murray', 'aaron_gordon'],
    scoring_kaleidoscope: ['kobe', 'melo', 'durant'],
    floor_generals: ['paul', 'kidd', 'nash'],
    violent_dunkers: ['wilkins', 'carter', 'griffin']
  };
  for (const [id, ids] of Object.entries(expected)) {
    assert.deepEqual(C.SYNERGIES.find(bond => bond.id === id)?.ids, ids, id);
  }
  assert.equal(C.SYNERGIES.some(bond => bond.name === '03黄金一代'), false);
  assert.deepEqual(C.SYNERGIES.find(bond => bond.id === 'banana_boat').ids, ['lebron', 'wade', 'paul', 'melo']);
});

test('adjacent bond sizes do not repeat the same complete core', () => {
  const overlaps = [2, 3, 4].flatMap(size => {
    const smaller = C.SYNERGIES.filter(bond => bond.ids.length === size);
    const larger = C.SYNERGIES.filter(bond => bond.ids.length === size + 1);
    return smaller.flatMap(core => larger.filter(group => core.ids.every(id => group.ids.includes(id))).map(group => [core.name, group.name]));
  });
  assert.deepEqual(overlaps, []);
});

test('every base S player belongs to at least one four-player bond', () => {
  const fourPlayerIds = new Set(C.SYNERGIES.filter(bond => bond.ids.length === 4).flatMap(bond => bond.ids));
  const missing = C.STARS.filter(player => player.tier === 'S' && !player.variantOf && !fourPlayerIds.has(player.id)).map(player => player.name);
  assert.deepEqual(missing, []);
});

test('bond budgets rise by group size and recurring cash consumes power budget', () => {
  const budget = bond => Object.values(bond.effect.stats).reduce((sum, value) => sum + value, 0)
    + (bond.effect.winCash + bond.effect.stageCash) * 4
    + bond.effect.freeRecruit * 6;
  const ranges = { 2: [7, 9], 3: [12, 17], 4: [19, 22], 5: [27, 43] };
  for (const bond of C.SYNERGIES) {
    const [min, max] = ranges[bond.ids.length];
    assert.ok(budget(bond) >= min && budget(bond) <= max, bond.name + ': ' + budget(bond));
  }
});

test('multi-player bonds provide varied combat, economy, and recruit effects without morale bonuses', () => {
  const multi = C.SYNERGIES.filter(bond => bond.ids.length >= 3);
  assert.ok(multi.filter(bond => bond.effect.stageCash > 0).length >= 10);
  assert.ok(multi.filter(bond => bond.effect.winCash > 0).length >= 10);
  assert.ok(multi.filter(bond => bond.effect.freeRecruit > 0).length >= 3);
  assert.deepEqual(multi.filter(bond => 'morale' in bond.effect || /士气/.test(bond.description)), []);
});

test('hard four and five player bonds trade attribute points for reference-scale economy rewards', () => {
  const byId = id => C.SYNERGIES.find(bond => bond.id === id).effect;
  assert.equal(byId('banana_boat').stageCash, 3);
  assert.equal(byId('four_shooting_guards').winCash, 2);
  assert.equal(byId('bulls_dynasty').stageCash, 4);
  assert.equal(byId('ok_dynasty').winCash, 3);
  assert.equal(byId('death_lineup').freeRecruit, 2);
  assert.deepEqual([byId('final_answer').stageCash, byId('final_answer').winCash], [4, 3]);
  assert.deepEqual(byId('final_answer').stats, { handle: 3, mid: 3, drive: 3, inside: 3, def: 3 });
  assert.equal(C.SYNERGIES.filter(bond => bond.ids.length === 2 && (bond.effect.stageCash || bond.effect.winCash)).length, 10);
});

test('a completed bond chain applies only its highest level package', () => {
  const run = C.createRun('outside', 9);
  for (const id of ['curry', 'klay', 'green']) run.owned[id] = { stars: 1, train: 0, trainedAt: 0 };
  assert.deepEqual(C.activeSynergies(run).map(bond => bond.id).sort(), ['splash', 'warrior_brain']);
  for (const id of ['iguodala', 'durant']) run.owned[id] = { stars: 1, train: 0, trainedAt: 0 };
  assert.deepEqual(C.activeSynergies(run).filter(bond => bond.chainId === 'warriors_death').map(bond => bond.id), ['death_lineup']);

  const bulls = C.createRun('outside', 10);
  for (const id of ['jordan', 'pippen', 'rodman']) bulls.owned[id] = { stars: 1, train: 0, trainedAt: 0 };
  assert.deepEqual(C.activeSynergies(bulls).filter(bond => bond.chainId === 'bulls_dynasty').map(bond => bond.id), ['bull_triangle']);
  for (const id of ['harper', 'longley']) bulls.owned[id] = { stars: 1, train: 0, trainedAt: 0 };
  assert.deepEqual(C.activeSynergies(bulls).filter(bond => bond.chainId === 'bulls_dynasty').map(bond => bond.id), ['bulls_dynasty']);
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

test('draft rarity matches the reference stage tables and keeps SSR group-based', () => {
  const run = C.createRun('outside', 11);
  const early = C.tierOdds(run);
  assert.deepEqual(early, { C: 44, B: 28, A: 26, S: 2, SSR: 0.8 });
  run.offer = [];
  run.recruitGroups = 6;
  assert.deepEqual(C.tierOdds(run), { C: 43, B: 29, A: 24, S: 4, SSR: 0.8 });
  run.stage = 5;
  assert.deepEqual(C.tierOdds(run), { C: 27, B: 27, A: 40, S: 6, SSR: 0.8 });
  run.stage = 8;
  assert.deepEqual(C.tierOdds(run), { C: 15, B: 21, A: 54, S: 10, SSR: 0.8 });
  run.rarityBonus = 5;
  const upgraded = C.tierOdds(run);
  assert.ok(upgraded.S > 10);
  assert.ok(upgraded.SSR > 0.8);
  assert.ok(Math.abs(['C', 'B', 'A', 'S'].reduce((sum, tier) => sum + upgraded[tier], 0) - 100) < 1e-9);
});

test('SSR is rolled once per four-player group and never appears twice', () => {
  const run = C.createRun('outside', 20260922);
  run.offer = [];
  run.recruitGroups = 6;
  let ssrGroups = 0;
  for (let group = 0; group < 20000; group++) {
    run.offer = [];
    const offer = C.makeOffer(run);
    const ssrCount = offer.filter(id => C.BY_ID[id].tier === 'SSR').length;
    assert.ok(ssrCount <= 1);
    if (ssrCount) ssrGroups++;
  }
  const observed = ssrGroups / 20000;
  assert.ok(observed > 0.006 && observed < 0.01, observed);
});

test('draft pity guarantees A and S tiers at the documented thresholds', () => {
  const aRun = C.createRun('outside', 99);
  aRun.offer = [];
  aRun.recruitGroups = 6;
  aRun.noAPlusGroups = 3;
  assert.ok(C.makeOffer(aRun).some(id => ['A', 'S', 'SSR'].includes(C.BY_ID[id].tier)));

  const sRun = C.createRun('outside', 101);
  sRun.offer = [];
  sRun.recruitGroups = 6;
  sRun.noSPlusGroups = 11;
  assert.ok(C.makeOffer(sRun).some(id => ['S', 'SSR'].includes(C.BY_ID[id].tier)));
});

test('mobile shell locks outer scrolling and resets the active inner screen', () => {
  const html = fs.readFileSync(path.join(__dirname, '../h5/index.html'), 'utf8');
  const ui = fs.readFileSync(path.join(__dirname, '../h5/game-ui.js'), 'utf8');
  assert.match(html, /html,body\{[^}]*overflow:hidden;[^}]*overscroll-behavior:none/);
  assert.match(html, /\.screen\{[^}]*overflow-y:auto;[^}]*overscroll-behavior-y:contain/);
  assert.match(ui, /els\[id\]\?\.scrollTo\(\{top:0,behavior:'auto'\}\)/);
  assert.doesNotMatch(ui, /window\.scrollTo/);
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

test('high-investment bonds grant expiring recruit tickets and capped stage cash', () => {
  const game = C.createGame();
  const run = game.run = C.createRun('outside', 20260922);
  for (const id of ['kobe', 'iverson', 'nash', 'rayallen']) run.owned[id] = { stars: 1, train: 0, trainedAt: 0 };
  run.free = 9;
  run.cash = 10;
  run.lastBattle = { won: true };
  assert.equal(C.continueRun(game, 'next'), true);
  assert.equal(run.free, 2);
  assert.equal(run.cash, 10);

  for (const id of ['lebron', 'wade', 'paul', 'melo']) run.owned[id] = { stars: 1, train: 0, trainedAt: 0 };
  run.lastBattle = { won: true };
  assert.equal(C.continueRun(game, 'next'), true);
  assert.equal(run.free, 2);
  assert.equal(run.cash, 13);
});

test('percentage talents scale after star and training growth and only activate in eligible slots', () => {
  const run = C.createRun('agent', 3);
  run.offer = [];
  run.owned.curry = { stars: 4, train: 3, trainedAt: 0 };
  run.slots.three = 'curry';
  const effect = C.BY_ID.curry.talentEffect;
  const original = effect.stats.three;
  effect.stats.three = 0;
  const withoutTalent = C.fused(run).stats.three;
  effect.stats.three = original;
  assert.equal(C.fused(run).stats.three, Math.min(150, Math.round(withoutTalent * 1.14)));
  C.swapPositions(run, { kind: 'slot', key: 'three' }, { kind: 'slot', key: 'mid' });
  assert.ok(!C.fused(run).talents.some(star => star.id === 'curry'));
});

test('S talents match the approved reference-style roles and mechanics', () => {
  assert.deepEqual(C.STARS.filter(star => star.tier === 'S').map(star => star.id), [
    'curry', 'lebron', 'kobe', 'duncan', 'durant', 'shaq', 'jordan',
    'harden', 'magic', 'bird', 'kareem', 'hakeem', 'wilt', 'russell'
  ]);
  assert.deepEqual(C.BY_ID.curry.talentEffect.stats, { three: 14, def: -4 });
  assert.deepEqual(C.BY_ID.lebron.talentEffect.slots, ['drive', 'handle']);
  assert.equal(C.BY_ID.durant.talentEffect.slotEffects.three.all, 4);
  assert.equal(C.BY_ID.jordan.talentEffect.slotEffects.mid.all, 5);
  assert.equal(C.BY_ID.harden.talentEffect.slotEffects.handle.strategyStats.outside.three, 5);
  assert.equal(C.BY_ID.magic.talentEffect.slotEffects.handle.postBattleCash, 2);
  assert.equal(C.BY_ID.magic.talentEffect.slotEffects.handle.recruitDiscount, 1);
  assert.equal(C.BY_ID.bird.talentEffect.slotEffects.mid.all, 6);
  assert.deepEqual(C.BY_ID.kareem.talentEffect.slotEffects.def.stats, { def: 8, three: -4 });
  assert.equal(C.BY_ID.hakeem.talentEffect.slotEffects.inside.postBattleCash, 2);
  assert.equal(C.BY_ID.russell.talentEffect.stats.def, 12);
});

test('Magic Johnson reduces paid recruitment while assigned to the control slot', () => {
  const run = C.createRun('outside', 4);
  run.owned.magic = { stars: 1, train: 0, trainedAt: 0 };
  run.slots.handle = 'magic';
  assert.equal(C.recruitCost(run), 7);
  run.slots.handle = null;
  run.slots.drive = 'magic';
  assert.equal(C.recruitCost(run), 8);
});

test('ABC control-slot talents pay one bonus after either battle result', () => {
  const game = C.createGame();
  const run = game.run = C.createRun('outside', 20260922);
  const lineup = { three: 'klay', mid: 'tmac', drive: 'wade', handle: 'parker', inside: 'embiid', def: 'green' };
  for (const [slot, id] of Object.entries(lineup)) {
    run.owned[id] = { stars: 1, train: 0, trainedAt: 0 };
    run.slots[slot] = id;
  }
  const before = run.cash;
  const report = C.battle(game, 'outside');
  assert.ok(report);
  assert.ok(report.detail.includes('战后技能 1'));
  assert.equal(run.cash, before + report.reward);
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

test('selling a bench player pays reference tier base value times current stars', () => {
  const run = draftedRun();
  const spare = C.STARS.find(s => !run.owned[s.id]);
  run.owned[spare.id] = { stars: 3, train: 0, trainedAt: 0 };
  run.bench.push(spare.id);
  const cash = run.cash;
  const bases = { C: 2, B: 3, A: 5, S: 8, SSR: 16 };
  const value = C.saleValue(spare.id, 3);
  assert.equal(value, bases[spare.tier] * 3);
  assert.equal(C.sellBench(run, 0), value);
  assert.equal(run.cash, cash + value);
  assert.equal(run.bench.length, 0);
  assert.equal(run.owned[spare.id], undefined);
});

test('star and training growth use reference percentages and distinguish SSR', () => {
  const normal = C.STARS.find(star => star.tier === 'A');
  const legend = C.STARS.find(star => star.tier === 'SSR');
  assert.equal(C.playerScore(normal, { stars: 3, train: 2 }, normal.best), normal.attrs[normal.best] * 1.26);
  assert.equal(C.playerScore(legend, { stars: 3, train: 2 }, legend.best), legend.attrs[legend.best] * 1.48);
});

test('training keeps mainline caps but uses the full reference cost ladder in endless', () => {
  const run = C.createRun('outside', 23);
  const normal = C.STARS.find(star => star.tier === 'A');
  const legend = C.STARS.find(star => star.tier === 'SSR');
  run.owned = {
    [normal.id]: { stars: 1, train: 2, trainedAt: 0 },
    [legend.id]: { stars: 1, train: 3, trainedAt: 0 }
  };
  run.cash = 999;
  assert.equal(C.trainingLimit(run, normal.id), 3);
  assert.equal(C.trainingLimit(run, legend.id), 5);
  assert.equal(C.trainingCost(run, normal.id), 11);
  assert.equal(C.trainingCost(run, legend.id), 16);
  run.endless = true;
  run.stage = 11;
  assert.equal(C.trainingLimit(run, normal.id), 10);
  assert.equal(C.trainingLimit(run, legend.id), 10);
  const expected = [4, 7, 11, 16, 22, 29, 37, 46, 56, 67];
  expected.forEach((cost, level) => {
    run.owned[normal.id].train = level;
    assert.equal(C.trainingCost(run, normal.id), cost);
  });
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

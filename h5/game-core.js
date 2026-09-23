/* 《我的球星融合系统》第四版规则与状态。数值为游戏设计值，并非真实 NBA 统计。 */
(function (root) {
  'use strict';

  const DATA=root.SupFusionGameData||(typeof require==='function'?require('./game-data.js'):null);
  if(!DATA)throw new Error('SupFusionGameData is required before game-core.js');

  const ATTRS = DATA.ATTRS;
  const LABELS = DATA.LABELS;
  const SLOTS = [
    { id: 'three', label: '三分', secondary: 'handle' },
    { id: 'mid', label: '中投', secondary: 'drive' },
    { id: 'drive', label: '突破', secondary: 'inside' },
    { id: 'handle', label: '控球', secondary: 'mid' },
    { id: 'inside', label: '篮下', secondary: 'drive' },
    { id: 'def', label: '防守', secondary: 'inside' }
  ];
  const STRATEGIES = {
    outside: { name: '外线拉开', beats: 'collapse', shot: 'three', description: '三分出手更多，克制护框收缩' },
    drive: { name: '突破冲筐', beats: 'outside', shot: 'drive', description: '冲击篮筐，克制外线拉开' },
    collapse: { name: '护框收缩', beats: 'drive', shot: 'inside', description: '内线防守更强，克制突破冲筐' }
  };
  const TALENTS = [
    { id: 'outside', name: '外线速成', gain: '三分、控球 +5；开局免费招募 +1', cost: '篮下 -3' },
    { id: 'inside', name: '禁区霸主', gain: '篮下 +7、防守 +3', cost: '三分 -3' },
    { id: 'defense', name: '铁血防线', gain: '防守 +7；失败补偿 +2', cost: '胜利基础奖金 -1' },
    { id: 'agent', name: '球星经纪人', gain: '付费招募价格减少 2 奖金', cost: '训练额外花费 2 奖金' },
    { id: 'economy', name: '精算大师', gain: '胜利奖金 +2；利息上限 +1', cost: '开局免费招募 -1' }
  ];
  const STAR_ROWS = DATA.STAR_ROWS;
  const STARS = STAR_ROWS.map(r => ({
    id:r[0],name:r[1],tier:r[2],role:r[3],team:r[4],best:r[5],
    attrs:Object.fromEntries(ATTRS.map((a,i)=>[a,r[6][i]])),talent:r[7],talentEffect:DATA.TALENT_DETAILS[r[0]],variantOf:r[8]||null,
    maxStars:r[2]==='SSR'?5:3,maxTrain:r[2]==='SSR'?5:3
  }));
  const BY_ID = Object.fromEntries(STARS.map(s=>[s.id,s]));
  const FOES = ['giannis','irving','tatum','harden','durant','davis','jokic','kawhi','jordan','lebron'];
  const SYNERGIES = DATA.SYNERGIES;
  const BOOSTS = [
    { id:'hot', name:'手感火热', rarity:'C', type:'投射', price:5, stats:{three:8}, description:'下一场三分 +8%' },
    { id:'paint', name:'禁区强攻', rarity:'C', type:'终结', price:5, stats:{inside:8}, description:'下一场篮下 +8%' },
    { id:'stopper', name:'防守专家', rarity:'C', type:'防守', price:5, stats:{def:8}, description:'下一场防守 +8%' },
    { id:'rhythm', name:'节奏加速', rarity:'B', type:'组织', price:6, stats:{handle:9}, description:'下一场控球 +9%' },
    { id:'touch', name:'中距离热区', rarity:'B', type:'投射', price:6, stats:{mid:9}, description:'下一场中投 +9%' },
    { id:'focus', name:'全神贯注', rarity:'A', type:'全能', minStage:3, price:9, stats:{all:4}, description:'下一场全属性 +4%' },
    { id:'clutch', name:'关键球模式', rarity:'A', type:'关键球', minStage:4, price:10, stats:{all:2}, clutchBonus:.06, description:'全属性 +2%；关键分命中率提升' },
    { id:'composure', name:'稳健持球', rarity:'A', type:'控场', minStage:3, price:9, stats:{handle:5}, turnoverReduction:.025, description:'控球 +5%；降低下一场失误率' }
  ];
  const GEAR = [
    // 通用装备：对应参考游戏 10 件 global 宝物。
    { id:'wrist', name:'进攻节奏手环', rarity:'C', kind:'global', slot:'护腕', price:9, sellPrice:4, percentStats:{drive:5}, description:'融合体突破 +5%' },
    { id:'deep_wrist', name:'连珠射手护腕', rarity:'A', kind:'global', slot:'护腕', price:16, sellPrice:7, percentStats:{three:8,inside:4}, description:'三分 +8%、篮下 +4%' },
    { id:'armor_jersey', name:'禁区防护球衣', rarity:'A', kind:'global', slot:'球衣', price:16, sellPrice:7, percentStats:{def:10,inside:4}, description:'防守 +10%、篮下 +4%' },
    { id:'analytics_band', name:'数据分析头带', rarity:'A', kind:'global', slot:'头带', price:17, sellPrice:7, percentStats:{three:8}, counterCash:3, description:'三分 +8%；战术克制成功额外 +3 奖金' },
    { id:'taiping_playbook', name:'全域进攻手册', rarity:'S', kind:'global', slot:'球衣', price:27, sellPrice:12, percentStats:{three:10,all:2}, counterCash:3, description:'三分 +10%、全属性 +2%；战术克制成功额外 +3 奖金' },
    { id:'master_playbook', name:'冠军教练战术板', rarity:'S', kind:'global', slot:'球衣', price:32, sellPrice:14, percentStats:{three:12,def:8,all:4}, bondBoost:.1, description:'三分 +12%、防守 +8%、全属性 +4%；羁绊效果 +10%' },
    { id:'balance_band', name:'攻防平衡头带', rarity:'S', kind:'global', slot:'头带', price:30, sellPrice:13, percentStats:{three:12,def:8,all:4}, description:'三分 +12%、防守 +8%、全属性 +4%' },
    { id:'dynasty_ring', name:'联盟王朝戒指', rarity:'SR', kind:'global', slot:'戒指', price:50, sellPrice:20, percentStats:{handle:10,drive:10,three:10,def:10,inside:10,all:8}, description:'控球、突破、三分、防守、篮下各 +10%；全属性再 +8%' },
    { id:'vision_ring', name:'全视野冠军戒指', rarity:'SR', kind:'global', slot:'戒指', price:50, sellPrice:20, percentStats:{three:15,def:10,inside:10,all:8}, counterCash:5, description:'三分 +15%、防守和篮下 +10%、全属性 +8%；战术克制成功额外 +5 奖金' },
    { id:'ring', name:'联盟至尊戒指', rarity:'SR', kind:'global', slot:'戒指', price:50, sellPrice:20, percentStats:{handle:5,drive:5,three:5,def:5,inside:5,all:6}, description:'控球、突破、三分、防守、篮下各 +5%；全属性再 +6%' },

    // 位置装备：对应参考游戏 7 件 position 宝物。
    { id:'tactics_board', name:'外线八区战术板', rarity:'A', kind:'position', slot:'球衣', targetSlot:'three', price:16, sellPrice:6, percentStats:{three:10}, description:'三分位有人时，三分 +10%' },
    { id:'team_jersey', name:'球队核心战袍', rarity:'S', kind:'position', slot:'球衣', targetSlot:'handle', price:28, sellPrice:12, stats:{handle:10}, percentStats:{all:5}, bondBoost:.15, description:'控球位得分 +10、全属性 +5%；羁绊效果 +15%' },
    { id:'paint_shoes', name:'内线训练战靴', rarity:'C', kind:'position', slot:'球鞋', targetSlot:'inside', price:8, sellPrice:4, stats:{inside:6}, description:'篮下位得分 +6' },
    { id:'lockdown_band', name:'防守队长头带', rarity:'C', kind:'position', slot:'头带', targetSlot:'def', price:8, sellPrice:4, stats:{def:6}, description:'防守位得分 +6' },
    { id:'core_robe', name:'超级核心战袍', rarity:'S', kind:'position', slot:'球衣', targetSlot:'handle', price:32, sellPrice:14, stats:{handle:12}, percentStats:{all:6}, description:'控球位得分 +12、全属性 +6%' },
    { id:'sleeve', name:'中投大师护臂', rarity:'A', kind:'position', slot:'护腕', targetSlot:'mid', price:16, sellPrice:7, stats:{mid:6}, description:'中投位得分 +6' },
    { id:'qimin_jersey', name:'禁区续航球衣', rarity:'A', kind:'position', slot:'球衣', targetSlot:'inside', price:17, sellPrice:7, stats:{inside:6}, percentStats:{inside:6}, description:'篮下位得分 +6、篮下再 +6%' },

    // 球星绑定装备：对应参考游戏 25 件 role 宝物。
    { id:'curry_wrist', name:'30号神射护腕', rarity:'C', kind:'signature', slot:'护腕', exclusivePlayer:'curry', exclusiveBonus:.5, price:8, sellPrice:4, stats:{three:7}, description:'绑定球员三分 +7；库里专属时效果 +50%' },
    { id:'king_double_wrist', name:'国王双能护腕', rarity:'C', kind:'signature', slot:'护腕', exclusivePlayer:'lebron', exclusiveBonus:.5, price:9, sellPrice:4, stats:{drive:5,mid:5}, description:'绑定球员突破、中投各 +5；詹姆斯专属时效果 +50%' },
    { id:'king_shoes', name:'天选之子战靴', rarity:'C', kind:'signature', slot:'球鞋', exclusivePlayer:'lebron', exclusiveBonus:.5, price:9, sellPrice:4, stats:{inside:6,mid:4}, description:'绑定球员篮下 +6、中投 +4；詹姆斯专属时效果 +50%' },
    { id:'jordan_sleeve', name:'飞人七星护臂', rarity:'A', kind:'signature', slot:'护腕', exclusivePlayer:'jordan', exclusiveBonus:.5, price:16, sellPrice:7, stats:{drive:10,three:6}, description:'绑定球员突破 +10、三分 +6；乔丹专属时效果 +50%' },
    { id:'kobe_sleeve', name:'曼巴青锋护臂', rarity:'A', kind:'signature', slot:'护腕', exclusivePlayer:'kobe', exclusiveBonus:.5, price:15, sellPrice:7, stats:{drive:13}, description:'绑定球员突破 +13；科比专属时效果 +50%' },
    { id:'giannis_shoes', name:'希腊怪兽战靴', rarity:'A', kind:'signature', slot:'球鞋', exclusivePlayer:'giannis', exclusiveBonus:.5, price:17, sellPrice:8, stats:{inside:8,drive:8}, description:'绑定球员篮下、突破各 +8；字母哥专属时效果 +50%' },
    { id:'jordan_playbook', name:'飞人必胜手册', rarity:'A', kind:'signature', slot:'头带', exclusivePlayer:'jordan', exclusiveBonus:.5, price:16, sellPrice:7, stats:{three:10,handle:8}, description:'绑定球员三分 +10、控球 +8；乔丹专属时效果 +50%' },
    { id:'kobe_shoes', name:'曼巴亮银战靴', rarity:'A', kind:'signature', slot:'球鞋', exclusivePlayer:'kobe', exclusiveBonus:.5, price:18, sellPrice:8, stats:{drive:13,mid:7}, description:'绑定球员突破 +13、中投 +7；科比专属时效果 +50%' },
    { id:'shaq_jersey', name:'大鲨鱼统治战袍', rarity:'S', kind:'signature', slot:'球衣', exclusivePlayer:'shaq', exclusiveBonus:.5, price:30, sellPrice:13, stats:{drive:20,inside:10}, description:'绑定球员突破 +20、篮下 +10；奥尼尔专属时效果 +50%' },
    { id:'durant_sleeve', name:'死神长刃护臂', rarity:'S', kind:'signature', slot:'护腕', exclusivePlayer:'durant', exclusiveBonus:.5, price:30, sellPrice:13, stats:{drive:18,inside:8}, description:'绑定球员突破 +18、篮下 +8；杜兰特专属时效果 +50%' },
    { id:'iverson_sleeve', name:'答案蛇纹护臂', rarity:'S', kind:'signature', slot:'护腕', exclusivePlayer:'iverson', exclusiveBonus:.5, price:28, sellPrice:12, stats:{drive:17,def:5}, description:'绑定球员突破 +17、防守 +5；艾弗森专属时效果 +50%' },
    { id:'kobe_wrist', name:'曼巴龙胆护腕', rarity:'S', kind:'signature', slot:'护腕', exclusivePlayer:'kobe', exclusiveBonus:.5, price:28, sellPrice:12, stats:{drive:15,inside:8}, description:'绑定球员突破 +15、篮下 +8；科比专属时效果 +50%' },
    { id:'carter_band', name:'半人半神头带', rarity:'A', kind:'signature', slot:'头带', exclusivePlayer:'carter', exclusiveBonus:.5, price:17, sellPrice:8, stats:{drive:12,mid:8}, description:'绑定球员突破 +12、中投 +8；卡特专属时效果 +50%' },
    { id:'jordan_shoes', name:'飞人闪电战靴', rarity:'A', kind:'signature', slot:'球鞋', exclusivePlayer:'jordan', exclusiveBonus:.5, price:18, sellPrice:8, stats:{inside:10,mid:8}, description:'绑定球员篮下 +10、中投 +8；乔丹专属时效果 +50%' },
    { id:'durant_band', name:'死神羽翼头带', rarity:'A', kind:'signature', slot:'头带', exclusivePlayer:'durant', exclusiveBonus:.5, price:18, sellPrice:8, stats:{three:12,inside:6}, description:'绑定球员三分 +12、篮下 +6；杜兰特专属时效果 +50%' },
    { id:'goat_ring', name:'篮球始祖戒指', rarity:'SR', kind:'signature', slot:'戒指', price:50, sellPrice:20, stats:{drive:45,inside:28,three:20,mid:15}, percentStats:{all:6}, description:'绑定球员突破 +45、篮下 +28、三分 +20、中投 +15；全属性 +6%' },
    { id:'power_sleeve', name:'威道强攻护臂', rarity:'S', kind:'signature', slot:'护腕', price:28, sellPrice:12, stats:{drive:18,inside:10}, description:'绑定球员突破 +18、篮下 +10' },
    { id:'westbrook_shoes', name:'雷霆鱼肠战靴', rarity:'S', kind:'signature', slot:'球鞋', exclusivePlayer:'westbrook', exclusiveBonus:.5, price:28, sellPrice:12, stats:{drive:20,inside:6}, description:'绑定球员突破 +20、篮下 +6；威斯布鲁克专属时效果 +50%' },
    { id:'duncan_jersey', name:'石佛仁道战袍', rarity:'S', kind:'signature', slot:'球衣', exclusivePlayer:'duncan', exclusiveBonus:.5, price:27, sellPrice:12, stats:{drive:12,three:12}, description:'绑定球员突破、三分各 +12；邓肯专属时效果 +50%' },
    { id:'nash_band', name:'风之子天问头带', rarity:'S', kind:'signature', slot:'头带', exclusivePlayer:'nash', exclusiveBonus:.5, price:27, sellPrice:12, stats:{three:16,mid:10}, description:'绑定球员三分 +16、中投 +10；纳什专属时效果 +50%' },
    { id:'magic_ring', name:'Showtime虎符戒指', rarity:'A', kind:'signature', slot:'戒指', exclusivePlayer:'magic', exclusiveBonus:.5, price:17, sellPrice:7, stats:{inside:10,three:8}, description:'绑定球员篮下 +10、三分 +8；魔术师专属时效果 +50%' },
    { id:'vince_shoes', name:'飞人金弓战靴', rarity:'A', kind:'signature', slot:'球鞋', exclusivePlayer:'carter', exclusiveBonus:.5, price:16, sellPrice:7, stats:{drive:12,inside:6}, description:'绑定球员突破 +12、篮下 +6；卡特专属时效果 +50%' },
    { id:'paul_band', name:'控卫兵法头带', rarity:'A', kind:'signature', slot:'头带', exclusivePlayer:'paul', exclusiveBonus:.5, price:16, sellPrice:7, stats:{three:14}, description:'绑定球员三分 +14；保罗专属时效果 +50%' },
    { id:'kidd_band', name:'基德统帅头带', rarity:'A', kind:'signature', slot:'头带', exclusivePlayer:'kidd', exclusiveBonus:.5, price:16, sellPrice:7, stats:{inside:10,three:6}, description:'绑定球员篮下 +10、三分 +6；基德专属时效果 +50%' },
    { id:'duncan_band', name:'石佛训练头带', rarity:'A', kind:'signature', slot:'头带', exclusivePlayer:'duncan', exclusiveBonus:.5, price:16, sellPrice:7, stats:{inside:8,mid:8}, description:'绑定球员篮下、中投各 +8；邓肯专属时效果 +50%' }
  ];
  const tierValue = { C:0, B:1, A:2, S:3, SSR:4 };
  const SALE_BASE = { C:2, B:3, A:5, S:8, SSR:16 };
  const TRAINING_COSTS = [4,7,11,16,22,29,37,46,56,67];
  function saleValue(id,stars=1){const star=BY_ID[id];return star?SALE_BASE[star.tier]*clamp(Math.floor(stars)||1,1,star.maxStars):0}
  function resolveTalentEffect(run,slotId){
    const star=BY_ID[run.slots[slotId]],base=star?.talentEffect;
    if(!star||!base?.slots?.includes(slotId))return null;
    const specific=base.slotEffects?.[slotId];
    return specific?{...base,...specific,stats:{...(base.stats||{}),...(specific.stats||{})}}:base;
  }
  function activeTalentEffects(run){return SLOTS.map(slot=>resolveTalentEffect(run,slot.id)).filter(Boolean)}
  function recruitCost(run){
    const base=run.talent==='agent'?6:8;
    const discount=activeTalentEffects(run).reduce((sum,effect)=>sum+(effect.recruitDiscount||0),0);
    return Math.max(1,base-discount);
  }
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function nextRandom(run){run.rng=(Math.imul(run.rng,1664525)+1013904223)>>>0;return run.rng/4294967296}
  function randomChoice(run,arr){return arr[Math.floor(nextRandom(run)*arr.length)]}
  function createGame(){return { version:1, run:null, profile:{runs:0,wins:0,bestStage:0,bestEndless:0,legend:0,discovered:[],upgrades:{scouting:0}} }}
  function createRun(talent,seed,progress={}){
    const run={seed:seed>>>0,rng:seed>>>0,talent,stage:1,endless:false,rarityBonus:clamp(progress.rarityBonus||0,0,5),morale:3,cash:16,free:6,refreshFree:1,owned:{},slots:Object.fromEntries(SLOTS.map(s=>[s.id,null])),bench:[],benchLimit:5,offer:[],offerOdds:null,pending:null,boosts:[],gear:[],gearBindings:{},shopOffers:{boost:[],gear:[]},shopRefreshes:0,gearRefreshes:0,wins:0,losses:0,lastBattle:null,ended:false,awarded:false,recruitGroups:0,noAPlusGroups:0,noSPlusGroups:0,openingAPlusGroups:0};
    if(talent==='outside')run.free+=1;
    if(talent==='economy')run.free-=1;
    makeOffer(run);
    makeShopOffers(run);
    return run;
  }
  function ownedCount(run){return Object.keys(run.owned).length}
  function starterCount(run){return SLOTS.filter(s=>run.slots[s.id]).length}
  function identityOf(id){const star=BY_ID[id];return star?(star.variantOf||star.id):id}
  function ownedIdentities(run){return new Set(Object.keys(run.owned).map(identityOf))}
  function completedSynergies(run){const ids=ownedIdentities(run);return SYNERGIES.filter(s=>s.ids.every(id=>ids.has(id)))}
  function activeSynergies(run){
    const completed=completedSynergies(run),highest=new Map();
    for(const bond of completed)if(bond.chainId)highest.set(bond.chainId,Math.max(highest.get(bond.chainId)||0,bond.chainLevel||0));
    return completed.filter(bond=>!bond.chainId||(bond.chainLevel||0)===highest.get(bond.chainId));
  }
  function starSynergies(id){const identity=identityOf(id);return SYNERGIES.filter(s=>s.ids.includes(identity))}
  function isOpeningRecruit(run){const groups=run.recruitGroups||0;return run.offer.length?groups<=6:groups<6}
  function tierOdds(run){
    const stage=Math.max(1,run.stage||1),opening=isOpeningRecruit(run);
    const base=opening?{C:45,B:29,A:25,S:1,SSR:.8}
      :stage<=4?{C:45,B:30,A:23,S:2,SSR:.8}
      :stage<=7?{C:27,B:27,A:40,S:6,SSR:.8}
      :{C:15,B:21,A:54,S:10,SSR:.8};
    const odds={...base},scouting=clamp(run.rarityBonus||0,0,5);
    odds.S*=Math.pow(1.08,scouting);
    odds.SSR*=Math.pow(1.04,scouting);
    if(stage>10){
      const depth=stage-10;
      odds.A+=Math.min(14,depth);
      odds.S+=Math.min(7,depth*.4);
      odds.SSR=Math.min(2,odds.SSR+depth*.05);
    }
    const softPity=Math.min(6,Math.max(0,(run.noSPlusGroups||0)-5));
    odds.S+=softPity;
    odds.C=Math.max(2,odds.C-softPity);
    const baseTotal=odds.C+odds.B+odds.A+odds.S;
    for(const tier of ['C','B','A','S'])odds[tier]=odds[tier]*100/baseTotal;
    return odds;
  }
  function recruitProbabilitySummary(run){
    const odds=tierOdds(run),sSingle=odds.S/100;
    return {...odds,sGroup:100*(1-Math.pow(1-sSingle,4)),ssrGroup:odds.SSR,aPityIn:Math.max(0,4-(run.noAPlusGroups||0)),sPityIn:Math.max(0,12-(run.noSPlusGroups||0))};
  }
  function tierRoll(run,minimum='C'){
    const odds=tierOdds(run),eligible=['C','B','A','S'].filter(tier=>tierValue[tier]>=tierValue[minimum]);
    const total=eligible.reduce((sum,tier)=>sum+odds[tier],0),n=nextRandom(run)*total;
    let cursor=0;
    for(const tier of eligible){cursor+=odds[tier];if(n<cursor)return tier}
    return eligible[eligible.length-1];
  }
  function recruitPool(run,tier,chosen,opening){
    const chosenIdentities=new Set(chosen.map(identityOf)),ownedIds=new Set(Object.keys(run.owned));
    const usable=star=>!chosen.includes(star.id)&&!chosenIdentities.has(identityOf(star.id))
      &&(!opening||!ownedIds.has(star.id))
      &&(!run.owned[star.id]||run.owned[star.id].stars<star.maxStars);
    let pool=STARS.filter(star=>star.tier===tier&&usable(star));
    if(!pool.length)pool=STARS.filter(usable);
    return pool;
  }
  function makeOffer(run){
    if(run.offer.length)return run.offer;
    run.offerOdds=recruitProbabilitySummary(run);
    const chosen=[],opening=isOpeningRecruit(run),group=(run.recruitGroups||0)+1;
    const requireS=(run.noSPlusGroups||0)>=11;
    let requireA=(run.noAPlusGroups||0)>=3?1:0;
    if(opening&&group===3&&(run.openingAPlusGroups||0)===0)requireA=Math.max(requireA,1);
    if(opening&&group===6&&(run.openingAPlusGroups||0)<2)requireA=Math.max(requireA,2);
    for(let i=0;i<4;i++){
      const remaining=4-i,currentA=chosen.filter(id=>tierValue[BY_ID[id].tier]>=tierValue.A).length;
      const currentS=chosen.some(id=>tierValue[BY_ID[id].tier]>=tierValue.S);
      let minimum=requireS&&!currentS&&remaining===1?'S':requireA-currentA>=remaining?'A':'C';
      if(i===3&&minimum==='C'&&!chosen.some(id=>tierValue[BY_ID[id].tier]>=tierValue.B))minimum='B';
      const tier=tierRoll(run,minimum),pool=recruitPool(run,tier,chosen,opening);
      chosen.push(randomChoice(run,pool).id);
    }
    const odds=run.offerOdds;
    if(nextRandom(run)<odds.SSR/100){
      const ssrPool=recruitPool(run,'SSR',chosen,opening).filter(star=>star.tier==='SSR');
      if(ssrPool.length)chosen[Math.floor(nextRandom(run)*chosen.length)]=randomChoice(run,ssrPool).id;
    }
    const hasA=chosen.some(id=>tierValue[BY_ID[id].tier]>=tierValue.A);
    const hasS=chosen.some(id=>tierValue[BY_ID[id].tier]>=tierValue.S);
    run.recruitGroups=group;
    run.noAPlusGroups=hasA?0:(run.noAPlusGroups||0)+1;
    run.noSPlusGroups=hasS?0:(run.noSPlusGroups||0)+1;
    if(opening&&hasA)run.openingAPlusGroups=(run.openingAPlusGroups||0)+1;
    run.offer=chosen;
    return chosen;
  }
  function recruit(run,id){
    if(run.ended||run.pending||!run.offer.includes(id))return {ok:false,reason:'本轮无法选择该球星'};
    const cost=recruitCost(run);
    if(run.free<=0 && run.cash<cost)return {ok:false,reason:'奖金不足，无法追加招募'};
    if(run.free>0)run.free--;else run.cash-=cost;
    run.offer=[];
    run.offerOdds=null;
    const star=BY_ID[id];
    if(run.owned[id]){
      const own=run.owned[id];
      if(own.stars<star.maxStars)own.stars++;else run.cash+=4;
      return {ok:true,kind:'duplicate',star};
    }
    const vacant=SLOTS.filter(s=>!run.slots[s.id]);
    if(vacant.length){
      const chosen=vacant.find(s=>s.id===star.best)||vacant[0];
      run.owned[id]={stars:1,train:0,trainedAt:0};run.slots[chosen.id]=id;
      return {ok:true,kind:'starter',slot:chosen.id,star};
    }
    if(run.bench.length<run.benchLimit){run.owned[id]={stars:1,train:0,trainedAt:0};run.bench.push(id);return {ok:true,kind:'bench',star}}
    run.pending=id;
    return {ok:true,kind:'pending',star};
  }
  function resolvePending(run,mode,index){
    const id=run.pending;if(!id)return false;
    if(mode==='sell'){run.cash+=saleValue(id,1)}
    else if(mode==='replace' && Number.isInteger(index) && index>=0 && index<run.bench.length){
      const old=run.bench[index];run.cash+=saleValue(old,run.owned[old]?.stars);delete run.owned[old];
      run.owned[id]={stars:1,train:0,trainedAt:0};run.bench[index]=id;
    } else return false;
    run.pending=null;return true;
  }
  function swapBench(run,benchIndex,slot){
    if(run.ended||run.lastBattle||!SLOTS.some(s=>s.id===slot)||benchIndex<0||benchIndex>=run.bench.length)return false;
    const incoming=run.bench[benchIndex],outgoing=run.slots[slot];run.slots[slot]=incoming;
    if(outgoing)run.bench[benchIndex]=outgoing;else run.bench.splice(benchIndex,1);
    return true;
  }
  function swapPositions(run,from,to){
    if(run.ended||run.lastBattle||!from||!to)return false;
    const valid=place=>place.kind==='slot'
      ?SLOTS.some(s=>s.id===place.key)
      :place.kind==='bench'&&Number.isInteger(place.key)&&place.key>=0&&place.key<run.bench.length;
    if(!valid(from)||!valid(to))return false;
    if(from.kind===to.kind&&from.key===to.key)return false;
    const read=place=>place.kind==='slot'?run.slots[place.key]:run.bench[place.key];
    const write=(place,id)=>{if(place.kind==='slot')run.slots[place.key]=id;else run.bench[place.key]=id};
    const first=read(from),second=read(to);
    if(!first&&!second)return false;
    if((from.kind==='bench'||to.kind==='bench')&&(!first||!second)){
      const bench=from.kind==='bench'?from:to;
      const slot=from.kind==='slot'?from:to;
      if(!read(bench))return false;
      return swapBench(run,bench.key,slot.key);
    }
    write(from,second);write(to,first);
    return true;
  }
  function sellBench(run,index){
    if(run.ended||run.lastBattle||!Number.isInteger(index)||index<0||index>=run.bench.length)return 0;
    const id=run.bench[index],value=saleValue(id,run.owned[id]?.stars);
    run.bench.splice(index,1);delete run.owned[id];run.cash+=value;
    return value;
  }
  function playerScore(star,own,key){
    const starGrowth=star.tier==='SSR'?.2:.1,trainingGrowth=star.tier==='SSR'?.04:.03;
    return star.attrs[key]*(1+(own.stars-1)*starGrowth+own.train*trainingGrowth);
  }
  function playerEffectiveStats(run,id,slotId='',strategy=''){
    const star=BY_ID[id],own=run?.owned?.[id];
    if(!star||!own)return null;
    const stats=Object.fromEntries(ATTRS.map(attr=>[attr,Math.round(playerScore(star,own,attr))]));
    const actualSlot=slotId||SLOTS.find(slot=>run.slots[slot.id]===id)?.id||'';
    const effect=actualSlot?resolveTalentEffect(run,actualSlot):null;
    if(effect&&run.slots[actualSlot]===id){
      const percents=Object.fromEntries(ATTRS.map(attr=>[attr,effect.all||0]));
      for(const [attr,percent] of Object.entries(effect.stats||{}))percents[attr]+=percent;
      if(effect.slotStat)percents[actualSlot]+=effect.slotStat;
      for(const [attr,percent] of Object.entries(effect.strategyStats?.[strategy]||{}))percents[attr]+=percent;
      for(const attr of ATTRS)stats[attr]=Math.max(0,Math.round(stats[attr]*(1+percents[attr]/100)));
    }
    return {stats,slot:actualSlot,effect,stars:own.stars,train:own.train};
  }
  function fused(run,strategy=''){
    const stats={},talents=[],talentEffects=[],bonds=activeSynergies(run),talentPercents=Object.fromEntries(ATTRS.map(attr=>[attr,0]));
    for(const attr of ATTRS){
      let sum=0,weight=0;
      for(const slot of SLOTS){
        const id=run.slots[slot.id];if(!id)continue;
        const w=attr===slot.id?2.5:attr===slot.secondary?1.25:.28;
        sum+=playerScore(BY_ID[id],run.owned[id],attr)*w;weight+=w;
      }
      stats[attr]=weight?Math.round(sum/weight):0;
    }
    for(const slot of SLOTS){
      const id=run.slots[slot.id],star=BY_ID[id],effect=resolveTalentEffect(run,slot.id);
      if(!star||!effect)continue;
      if(effect.all)for(const attr of ATTRS)talentPercents[attr]+=effect.all;
      for(const [attr,percent] of Object.entries(effect.stats||{}))talentPercents[attr]+=percent;
      if(effect.slotStat)talentPercents[slot.id]+=effect.slotStat;
      for(const [attr,percent] of Object.entries(effect.strategyStats?.[strategy]||{}))talentPercents[attr]+=percent;
      if(effect.bondScale)talentPercents[effect.bondScale.attr]+=Math.min(effect.bondScale.max,bonds.length*effect.bondScale.per);
      talents.push(star);
      talentEffects.push(effect);
    }
    for(const attr of ATTRS)stats[attr]=Math.round(stats[attr]*(1+talentPercents[attr]/100));
    const bondBoost=run.gear.reduce((sum,id)=>sum+(GEAR.find(item=>item.id===id)?.bondBoost||0),0);
    for(const bond of bonds)for(const [attr,gain] of Object.entries(bond.effect?.stats||{[bond.attr]:bond.gain}))stats[attr]+=gain*(1+bondBoost);
    if(run.talent==='outside'){stats.three+=5;stats.handle+=5;stats.inside-=3}
    if(run.talent==='inside'){stats.inside+=7;stats.def+=3;stats.three-=3}
    if(run.talent==='defense')stats.def+=7;
    const gearPercents=Object.fromEntries(ATTRS.map(attr=>[attr,0]));
    for(const itemId of run.gear){
      const item=GEAR.find(g=>g.id===itemId),multiplier=gearMultiplier(run,item);
      if(!item||!multiplier)continue;
      applyItemStats(stats,item,multiplier);
      applyItemPercents(gearPercents,item,multiplier);
    }
    for(const attr of ATTRS)stats[attr]*=1+gearPercents[attr]/100;
    const boostPercents=Object.fromEntries(ATTRS.map(attr=>[attr,0]));
    for(const boostId of run.boosts){
      const item=BOOSTS.find(b=>b.id===boostId);
      if(!item)continue;
      for(const [attr,percent] of Object.entries(item.stats||{})){
        if(attr==='all')for(const key of ATTRS)boostPercents[key]+=percent;
        else if(ATTRS.includes(attr))boostPercents[attr]+=percent;
      }
    }
    for(const attr of ATTRS)stats[attr]*=1+boostPercents[attr]/100;
    for(const key of ATTRS)stats[key]=Math.max(0,Math.round(stats[key]));
    const rating=Math.round(ATTRS.reduce((n,a)=>n+stats[a],0)/ATTRS.length);
    return {stats,rating,bonds,talents,talentEffects};
  }
  function opponent(run){
    const id=FOES[(run.stage-1)%FOES.length],star=BY_ID[id];
    const diff=run.stage<=10?(-11+run.stage*2):(9+(run.stage-10)*2.1);
    const stats=Object.fromEntries(ATTRS.map(a=>[a,Math.max(35,Math.round(star.attrs[a]+diff))]));
    const strategy=star.best==='three'?'outside':star.best==='drive'?'drive':'collapse';
    return {id,name:star.name,strategy,stats,rating:Math.round(ATTRS.reduce((n,a)=>n+stats[a],0)/ATTRS.length)};
  }
  function starterHas(run,id){return SLOTS.some(slot=>run.slots[slot.id]===id)}
  function gearMultiplier(run,item){
    if(!item)return 0;
    if(item.kind==='position')return run.slots[item.targetSlot]?1:0;
    if(item.kind!=='signature')return 1;
    const bound=run.gearBindings?.[item.id];
    if(!bound||!starterHas(run,bound))return 0;
    return identityOf(bound)===item.exclusivePlayer?1+(item.exclusiveBonus||0):1;
  }
  function applyItemStats(stats,item,multiplier=1){
    for(const [attr,gain] of Object.entries(item.stats||{})){
      if(attr==='all')for(const key of ATTRS)stats[key]+=gain*multiplier;
      else if(ATTRS.includes(attr))stats[attr]+=gain*multiplier;
    }
  }
  function applyItemPercents(target,item,multiplier=1){
    for(const [attr,gain] of Object.entries(item.percentStats||{})){
      if(attr==='all')for(const key of ATTRS)target[key]+=gain*multiplier;
      else if(ATTRS.includes(attr))target[attr]+=gain*multiplier;
    }
  }
  function defaultGearBinding(run,item){
    if(item?.kind!=='signature')return null;
    return SLOTS.map(slot=>run.slots[slot.id]).find(id=>id&&identityOf(id)===item.exclusivePlayer)
      ||SLOTS.map(slot=>run.slots[slot.id]).find(Boolean)
      ||Object.keys(run.owned)[0]||null;
  }
  function bindGear(run,gearId,playerId){
    const item=GEAR.find(gear=>gear.id===gearId);
    if(!item||item.kind!=='signature'||!run.gear.includes(gearId)||!run.owned[playerId])return false;
    run.gearBindings=run.gearBindings||{};run.gearBindings[gearId]=playerId;return true;
  }
  function itemEffects(run){
    const gearItems=run.gear.map(id=>GEAR.find(item=>item.id===id)).filter(Boolean);
    const boostItems=run.boosts.map(id=>BOOSTS.find(item=>item.id===id)).filter(Boolean);
    return [...gearItems.map(item=>[item,gearMultiplier(run,item)]),...boostItems.map(item=>[item,1])].reduce((total,[item,multiplier])=>{
      total.clutchBonus+=(item.clutchBonus||0)*multiplier;total.turnoverReduction+=(item.turnoverReduction||0)*multiplier;
      total.opponentPenalty+=(item.opponentPenalty||0)*multiplier;total.winCash+=(item.winCash||0)*multiplier;
      total.counterCash+=(item.counterCash||0)*multiplier;return total;
    },{clutchBonus:0,turnoverReduction:0,opponentPenalty:0,winCash:0,counterCash:0});
  }
  function drawShopItems(run,items,count,owned){
    const pool=items.filter(item=>!owned.includes(item.id)&&(!item.minStage||run.stage>=item.minStage));
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(nextRandom(run)*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
    return pool.slice(0,count).map(item=>item.id);
  }
  function gearRarityWeights(){return {C:70,A:24,S:6,SR:1}}
  function drawGearItems(run,count){
    const pool=GEAR.filter(item=>!run.gear.includes(item.id)&&(!item.minStage||run.stage>=item.minStage)),chosen=[],weights=gearRarityWeights(run);
    while(pool.length&&chosen.length<count){
      const total=pool.reduce((sum,item)=>sum+(weights[item.rarity]||0),0);
      let roll=nextRandom(run)*(total||pool.length),index=0;
      if(total){for(;index<pool.length-1;index++){roll-=weights[pool[index].rarity]||0;if(roll<0)break}}
      else index=Math.floor(nextRandom(run)*pool.length);
      chosen.push(pool.splice(index,1)[0].id);
    }
    return chosen;
  }
  function makeShopOffers(run){
    run.shopOffers={boost:drawShopItems(run,BOOSTS,4,[]),gear:drawGearItems(run,3)};
    return run.shopOffers;
  }
  function ensureShop(run){
    if(!run.shopOffers||!Array.isArray(run.shopOffers.boost)||!Array.isArray(run.shopOffers.gear))run.shopOffers={boost:[],gear:[]};
    if(!run.shopOffers.boost.length&&!run.shopOffers.gear.length)makeShopOffers(run);
    return run.shopOffers;
  }
  function shopRefreshCost(run,type='boost'){return type==='gear'?3:Math.min(10,4+(run.shopRefreshes||0))}
  function refreshShop(run,type='boost'){
    const cost=shopRefreshCost(run,type);if(run.cash<cost)return false;run.cash-=cost;
    if(type==='gear'){run.gearRefreshes=(run.gearRefreshes||0)+1;run.shopOffers.gear=drawGearItems(run,3)}
    else{run.shopRefreshes=(run.shopRefreshes||0)+1;run.shopOffers.boost=drawShopItems(run,BOOSTS,4,[])}
    return true;
  }
  function trainingLimit(run,id){const star=BY_ID[id];return star?(run.endless||run.stage>10?10:star.maxTrain):0}
  function trainingCost(run,id){const level=run.owned[id]?.train??0,base=TRAINING_COSTS[level];return base===undefined?Infinity:base+(run.talent==='agent'?2:0)}
  function train(run,id){const own=run.owned[id],star=BY_ID[id];if(!own||!star||own.train>=trainingLimit(run,id)||own.trainedAt===run.stage)return false;const cost=trainingCost(run,id);if(run.cash<cost)return false;run.cash-=cost;own.train++;own.trainedAt=run.stage;return true}
  function buyBoost(run,id){ensureShop(run);const item=BOOSTS.find(b=>b.id===id);if(!item||!run.shopOffers.boost.includes(id)||run.cash<item.price)return false;run.cash-=item.price;run.boosts.push(id);return true}
  function buyGear(run,id){ensureShop(run);const item=GEAR.find(g=>g.id===id),slotUsed=item&&run.gear.some(gearId=>GEAR.find(g=>g.id===gearId)?.slot===item.slot);if(!item||!run.shopOffers.gear.includes(id)||run.cash<item.price||run.gear.length>=5||run.gear.includes(id)||slotUsed)return false;run.cash-=item.price;run.gear.push(id);if(item.kind==='signature'){run.gearBindings=run.gearBindings||{};run.gearBindings[id]=defaultGearBinding(run,item)}return true}
  function sellGear(run,id){const index=run.gear.indexOf(id),item=GEAR.find(g=>g.id===id);if(index<0||!item)return 0;run.gear.splice(index,1);if(run.gearBindings)delete run.gearBindings[id];const value=item.sellPrice;run.cash+=value;return value}
  function expandBench(run){if(run.cash<10||run.benchLimit>=10)return false;run.cash-=10;run.benchLimit++;return true}
  function refreshOffer(run){if(run.refreshFree>0)run.refreshFree--;else if(run.cash>=5)run.cash-=5;else return false;run.offer=[];run.offerOdds=null;makeOffer(run);return true}
  function shotType(run,strategy,attacker){
    const n=nextRandom(run);
    if(strategy==='outside')return n<.57?'three':n<.79?'mid':'inside';
    if(strategy==='drive')return n<.59?'inside':n<.76?'mid':'three';
    if(attacker==='foe' && strategy==='collapse')return n<.4?'inside':n<.7?'mid':'three';
    return n<.35?'inside':n<.65?'mid':'three';
  }
  function finishRun(game){
    const run=game.run;if(!run||run.awarded)return 0;
    const points=run.wins*12+Math.max(0,run.stage-1)*4+(run.endless?20:0);
    game.profile.runs++;game.profile.wins+=run.wins;game.profile.bestStage=Math.max(game.profile.bestStage,Math.min(10,run.stage));
    game.profile.bestEndless=Math.max(game.profile.bestEndless,run.endless?run.stage:0);game.profile.legend+=points;
    game.profile.discovered=[...new Set([...game.profile.discovered,...Object.keys(run.owned)])];
    run.awarded=true;run.ended=true;return points;
  }
  function incomeBreakdown(run){
    const referenceBase=run.stage===10?0:run.stage===5?6:run.stage<=9?4:7+Math.floor((run.stage-11)/2)*3;
    const handleId=run.slots.handle,defId=run.slots.def;
    const handleScore=handleId?playerScore(BY_ID[handleId],run.owned[handleId],'handle'):0;
    const defScore=defId?playerScore(BY_ID[defId],run.owned[defId],'def'):0;
    const lineupIncome=clamp(Math.floor(((handleScore*.65+defScore*.35)-50)/18),0,4);
    const interestCap=3+(run.talent==='economy'?1:0)+(defScore>=90?1:0)+Math.min(10,Math.max(0,run.stage-10));
    return {
      victoryBase:Math.max(0,referenceBase-(run.talent==='defense'?1:0)+(run.talent==='economy'?2:0)),
      lossBase:7+(run.talent==='defense'?2:0),
      lineupIncome,
      interest:Math.min(interestCap,Math.floor(run.cash/15)),
      interestCap
    };
  }
  function battle(game,strategy){
    const run=game.run;if(!run||run.ended||run.lastBattle||starterCount(run)<6||!STRATEGIES[strategy])return null;
    const own=fused(run,strategy),foe=opponent(run),equipment=itemEffects(run);let us=0,them=0,turn='us',round=0;
    const beats=STRATEGIES[strategy].beats===foe.strategy?1:STRATEGIES[foe.strategy].beats===strategy?-1:0;
    const log=[];
    while(round<90){
      round++;
      const atk=turn==='us'?own.stats:foe.stats,def=turn==='us'?foe.stats:own.stats;
      const style=turn==='us'?strategy:foe.strategy;
      const type=shotType(run,style,turn),shot=type==='three'?atk.three:type==='mid'?atk.mid:(atk.drive*.35+atk.inside*.65);
      const control=atk.handle-def.def*.65;
      const turnover=clamp(.1-control*.0015-(turn==='us'?equipment.turnoverReduction:0),.015,.18);
      let made=false;
      if(nextRandom(run)>turnover){
        let chance=.45+(shot-def.def)*.0042+(atk.handle-def.handle)*.0013;
        chance+=(turn==='us'?beats:-beats)*.085;
        if(turn==='us'){chance+=Math.max(us,them)>=8?equipment.clutchBonus:0}else chance-=equipment.opponentPenalty;
        if(type==='three')chance-=.035;
        if(style==='collapse'&&type==='inside')chance+=.025;
        made=nextRandom(run)<clamp(chance,.16,.79);
      }
      if(made){const pts=type==='three'?2:1;if(turn==='us')us+=pts;else them+=pts;if(log.length<18)log.push(`${round}回合 · ${turn==='us'?'融合球员':foe.name}${type==='three'?'命中三分':'攻入篮下'} +${pts}`)}
      else if(log.length<18&&round%3===0)log.push(`${round}回合 · ${turn==='us'?'我方':'对手'}投篮受干扰`);
      turn=turn==='us'?'foe':'us';
      if((us>=11||them>=11)&&Math.abs(us-them)>=2)break;
      if(us>=15||them>=15)break;
    }
    if(us===them){if(own.rating+beats*4>=foe.rating)us++;else them++}
    const won=us>them;
    const counterCash=beats===1?equipment.counterCash:0;
    const postBattleCash=own.talentEffects.reduce((sum,effect)=>sum+(effect.postBattleCash||0),0)+counterCash;
    let reward=0,detail=[];
    if(won){
      const income=incomeBreakdown(run),base=income.victoryBase,lineupIncome=income.lineupIncome,interest=income.interest;
      const bond=own.bonds.length?1:0,bondCash=Math.min(5,own.bonds.reduce((sum,item)=>sum+(item.effect?.winCash||0),0));
      const talentCash=own.talentEffects.reduce((sum,effect)=>sum+(effect.winCash||0),0);
      reward=base+lineupIncome+interest+bond+bondCash+talentCash+postBattleCash+equipment.winCash;run.cash+=reward;run.wins++;detail=[`胜利 ${base}`,`阵容收入 ${lineupIncome}`,`利息 ${interest}`,`羁绊 ${bond+bondCash}`];
      if(talentCash)detail.push(`球星技能 ${talentCash}`);
      if(postBattleCash)detail.push(`${counterCash?'战术克制与':'战后'}技能 ${postBattleCash}`);
    }else{
      run.morale--;run.losses++;reward=incomeBreakdown(run).lossBase+postBattleCash;run.cash+=reward;detail=[`失败补偿 ${reward-postBattleCash}`];
      if(postBattleCash)detail.push(`${counterCash?'战术克制与':'战后'}技能 ${postBattleCash}`);
    }
    run.boosts=[];
    const report={stage:run.stage,won,us,them,reward,detail,log:log.slice(-7),strategy,foe:foe.id,foeName:foe.name,foeStrategy:foe.strategy,beats,rating:own.rating,foeRating:foe.rating};
    run.lastBattle=report;
    if(!won&&run.morale<=0)report.legendEarned=finishRun(game);
    return report;
  }
  function continueRun(game,choice){
    const run=game.run;if(!run||!run.lastBattle)return false;
    if(run.ended)return false;
    if(!run.lastBattle.won){run.lastBattle=null;return true}
    if(run.stage===10&&choice==='finish'){run.lastBattle.legendEarned=finishRun(game);return true}
    if(run.stage===10)run.endless=true;
    const bonds=activeSynergies(run);
    const bondFree=Math.min(2,bonds.reduce((sum,item)=>sum+(item.effect?.freeRecruit||0),0));
    const bondCash=Math.min(5,bonds.reduce((sum,item)=>sum+(item.effect?.stageCash||0),0));
    run.stage++;run.free=1+bondFree;
    run.cash+=bondCash;
    run.refreshFree=1;run.offer=[];run.offerOdds=null;run.shopRefreshes=0;run.gearRefreshes=0;makeShopOffers(run);run.lastBattle=null;
    return true;
  }
  const api={ATTRS,LABELS,SLOTS,STRATEGIES,TALENTS,STARS,BY_ID,FOES,SYNERGIES,BOOSTS,GEAR,createGame,createRun,tierOdds,recruitProbabilitySummary,makeOffer,recruit,recruitCost,resolvePending,swapBench,swapPositions,saleValue,sellBench,starterCount,ownedCount,identityOf,starSynergies,activeSynergies,playerScore,playerEffectiveStats,incomeBreakdown,fused,opponent,trainingLimit,trainingCost,train,gearRarityWeights,makeShopOffers,ensureShop,shopRefreshCost,refreshShop,buyBoost,buyGear,bindGear,gearMultiplier,sellGear,expandBench,refreshOffer,battle,continueRun,finishRun,clamp};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SupFusionGameCore=api;
})(typeof window!=='undefined'?window:globalThis);
/* 《我的球星融合系统》第二版规则与状态。数值为游戏设计值，并非真实 NBA 统计。 */
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
    maxStars:r[2]==='L'?5:3,maxTrain:r[2]==='L'?5:3
  }));
  const BY_ID = Object.fromEntries(STARS.map(s=>[s.id,s]));
  const FOES = ['giannis','irving','tatum','harden','durant','davis','jokic','kawhi','jordan','lebron'];
  const SYNERGIES = DATA.SYNERGIES;
  const BOOSTS = [
    { id:'hot', name:'手感火热', price:5, attr:'three', gain:8, description:'下一场三分 +8' },
    { id:'paint', name:'禁区强攻', price:5, attr:'inside', gain:8, description:'下一场篮下 +8' },
    { id:'stopper', name:'防守专家', price:5, attr:'def', gain:8, description:'下一场防守 +8' },
    { id:'focus', name:'全神贯注', price:8, attr:'all', gain:4, description:'下一场全属性 +4' }
  ];
  const GEAR = [
    { id:'wrist', name:'神射护腕', price:9, attr:'three', gain:4, description:'永久三分 +4' },
    { id:'shoes', name:'突破战靴', price:9, attr:'drive', gain:4, description:'永久突破 +4' },
    { id:'ring', name:'冠军戒指', price:18, attr:'all', gain:2, description:'永久全属性 +2' },
    { id:'band', name:'防守护臂', price:9, attr:'def', gain:4, description:'永久防守 +4' }
  ];
  const tierValue = { C:0, B:1, A:2, S:3, L:4 };
  function saleValue(id){const star=BY_ID[id];return star?Math.max(3,tierValue[star.tier]+2):0}
  function recruitCost(run){return run.talent==='agent'?6:8}
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function nextRandom(run){run.rng=(Math.imul(run.rng,1664525)+1013904223)>>>0;return run.rng/4294967296}
  function randomChoice(run,arr){return arr[Math.floor(nextRandom(run)*arr.length)]}
  function createGame(){return { version:1, run:null, profile:{runs:0,wins:0,bestStage:0,bestEndless:0,legend:0,discovered:[],upgrades:{scouting:0}} }}
  function createRun(talent,seed,progress={}){
    const run={seed:seed>>>0,rng:seed>>>0,talent,stage:1,endless:false,rarityBonus:clamp(progress.rarityBonus||0,0,10),morale:3,cash:16,free:6,refreshFree:1,owned:{},slots:Object.fromEntries(SLOTS.map(s=>[s.id,null])),bench:[],benchLimit:5,offer:[],pending:null,boosts:[],gear:[],wins:0,losses:0,lastBattle:null,ended:false,awarded:false};
    if(talent==='outside')run.free+=1;
    if(talent==='economy')run.free-=1;
    makeOffer(run);
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
  function tierOdds(run){
    const stage=Math.max(1,run.stage||1),step=Math.min(4,Math.floor((stage-1)/2));
    const tables=[
      {C:45,B:40,A:14.5,S:.5,L:0},
      {C:34,B:40,A:22,S:3.5,L:.5},
      {C:25,B:38,A:28,S:8,L:1},
      {C:17,B:34,A:33,S:13.5,L:2.5},
      {C:10,B:28,A:36,S:21,L:5}
    ];
    const odds={...tables[step]};
    if(stage>10){const extra=Math.min(7,(stage-10)*.35);odds.L+=extra;odds.S+=extra*.5;odds.C=Math.max(2,odds.C-extra);odds.B-=extra*.5}
    const bonus=clamp(run.rarityBonus||0,0,10);
    odds.L+=bonus*.25;odds.S+=bonus*.5;odds.A+=bonus*.25;odds.C=Math.max(0,odds.C-bonus);
    const total=Object.values(odds).reduce((sum,value)=>sum+value,0);
    odds.B+=100-total;
    return odds;
  }
  function tierRoll(run){
    const odds=tierOdds(run),n=nextRandom(run)*100;
    let cursor=odds.L;if(n<cursor)return 'L';
    cursor+=odds.S;if(n<cursor)return 'S';
    cursor+=odds.A;if(n<cursor)return 'A';
    cursor+=odds.B;return n<cursor?'B':'C';
  }
  function makeOffer(run){
    if(run.offer.length)return run.offer;
    const chosen=[];
    for(let i=0;i<4;i++){
      let tier=tierRoll(run);
      if(i===3 && run.stage<=2 && !chosen.some(id=>tierValue[BY_ID[id].tier]>=1))tier='B';
      let pool=STARS.filter(s=>s.tier===tier && !chosen.includes(s.id) && !run.owned[s.id]);
      if(!pool.length)pool=STARS.filter(s=>!chosen.includes(s.id) && !run.owned[s.id]);
      if(!pool.length)pool=STARS.filter(s=>!chosen.includes(s.id));
      chosen.push(randomChoice(run,pool).id);
    }
    run.offer=chosen;
    return chosen;
  }
  function recruit(run,id){
    if(run.ended||run.pending||!run.offer.includes(id))return {ok:false,reason:'本轮无法选择该球星'};
    const cost=recruitCost(run);
    if(run.free<=0 && run.cash<cost)return {ok:false,reason:'奖金不足，无法追加招募'};
    if(run.free>0)run.free--;else run.cash-=cost;
    run.offer=[];
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
    if(mode==='sell'){run.cash+=saleValue(id)}
    else if(mode==='replace' && Number.isInteger(index) && index>=0 && index<run.bench.length){
      const old=run.bench[index];delete run.owned[old];run.cash+=Math.max(2,tierValue[BY_ID[old].tier]+1);
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
    const id=run.bench[index],value=saleValue(id);
    run.bench.splice(index,1);delete run.owned[id];run.cash+=value;
    return value;
  }
  function playerScore(star,own,key){return star.attrs[key]+(own.stars-1)*3+own.train*3}
  function fused(run){
    const stats={},talents=[];
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
      const id=run.slots[slot.id],star=BY_ID[id];
      if(star&&star.best===slot.id){stats[star.talentEffect.attr]+=star.talentEffect.gain;talents.push(star)}
    }
    for(const bond of activeSynergies(run))for(const [attr,gain] of Object.entries(bond.effect?.stats||{[bond.attr]:bond.gain}))stats[attr]+=gain;
    if(run.talent==='outside'){stats.three+=5;stats.handle+=5;stats.inside-=3}
    if(run.talent==='inside'){stats.inside+=7;stats.def+=3;stats.three-=3}
    if(run.talent==='defense')stats.def+=7;
    for(const itemId of run.gear){const item=GEAR.find(g=>g.id===itemId);if(!item)continue;if(item.attr==='all')for(const a of ATTRS)stats[a]+=item.gain;else stats[item.attr]+=item.gain}
    for(const boostId of run.boosts){const item=BOOSTS.find(b=>b.id===boostId);if(!item)continue;if(item.attr==='all')for(const a of ATTRS)stats[a]+=item.gain;else stats[item.attr]+=item.gain}
    for(const key of ATTRS)stats[key]=clamp(Math.round(stats[key]),0,110);
    const rating=Math.round(ATTRS.reduce((n,a)=>n+stats[a],0)/ATTRS.length);
    return {stats,rating,bonds:activeSynergies(run),talents};
  }
  function opponent(run){
    const id=FOES[(run.stage-1)%FOES.length],star=BY_ID[id];
    const diff=run.stage<=10?(-11+run.stage*2):(9+(run.stage-10)*2.1);
    const stats=Object.fromEntries(ATTRS.map(a=>[a,clamp(Math.round(star.attrs[a]+diff),35,110)]));
    const strategy=star.best==='three'?'outside':star.best==='drive'?'drive':'collapse';
    return {id,name:star.name,strategy,stats,rating:Math.round(ATTRS.reduce((n,a)=>n+stats[a],0)/ATTRS.length)};
  }
  function trainingCost(run,id){const level=run.owned[id]?.train??0;return [4,7,11,15,20][level]+(run.talent==='agent'?2:0)}
  function train(run,id){const own=run.owned[id],star=BY_ID[id];if(!own||!star||own.train>=star.maxTrain||own.trainedAt===run.stage)return false;const cost=trainingCost(run,id);if(run.cash<cost)return false;run.cash-=cost;own.train++;own.trainedAt=run.stage;return true}
  function buyBoost(run,id){const item=BOOSTS.find(b=>b.id===id);if(!item||run.cash<item.price||run.boosts.length>=3||run.boosts.includes(id))return false;run.cash-=item.price;run.boosts.push(id);return true}
  function buyGear(run,id){const item=GEAR.find(g=>g.id===id);if(!item||run.cash<item.price||run.gear.length>=5||run.gear.includes(id))return false;run.cash-=item.price;run.gear.push(id);return true}
  function expandBench(run){if(run.cash<10||run.benchLimit>=10)return false;run.cash-=10;run.benchLimit++;return true}
  function refreshOffer(run){if(run.refreshFree>0)run.refreshFree--;else if(run.cash>=5)run.cash-=5;else return false;run.offer=[];makeOffer(run);return true}
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
  function battle(game,strategy){
    const run=game.run;if(!run||run.ended||run.lastBattle||starterCount(run)<6||!STRATEGIES[strategy])return null;
    const own=fused(run),foe=opponent(run);let us=0,them=0,turn='us',round=0;
    const beats=STRATEGIES[strategy].beats===foe.strategy?1:STRATEGIES[foe.strategy].beats===strategy?-1:0;
    const log=[];
    while(round<90){
      round++;
      const atk=turn==='us'?own.stats:foe.stats,def=turn==='us'?foe.stats:own.stats;
      const style=turn==='us'?strategy:foe.strategy;
      const type=shotType(run,style,turn),shot=type==='three'?atk.three:type==='mid'?atk.mid:(atk.drive*.35+atk.inside*.65);
      const control=atk.handle-def.def*.65;
      const turnover=clamp(.1-control*.0015,.025,.18);
      let made=false;
      if(nextRandom(run)>turnover){
        let chance=.45+(shot-def.def)*.0042+(atk.handle-def.handle)*.0013;
        chance+=(turn==='us'?beats:-beats)*.085;
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
    let reward=0,detail=[];
    if(won){
      const base=6+Math.floor(run.stage/2)-(run.talent==='defense'?1:0)+(run.talent==='economy'?2:0);
      const interest=Math.min(run.talent==='economy'?4:3,Math.floor(run.cash/10));
      const bond=own.bonds.length?1:0,bondCash=own.bonds.reduce((sum,item)=>sum+(item.effect?.winCash||0),0);
      reward=base+interest+bond+bondCash;run.cash+=reward;run.wins++;detail=[`胜利 ${base}`,`利息 ${interest}`,`羁绊 ${bond+bondCash}`];
    }else{
      run.morale--;run.losses++;reward=3+(run.talent==='defense'?2:0);run.cash+=reward;detail=[`失败补偿 ${reward}`];
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
    run.stage++;run.free=1;
    run.cash+=bonds.reduce((sum,item)=>sum+(item.effect?.stageCash||0),0);
    run.refreshFree=1;run.offer=[];run.lastBattle=null;
    return true;
  }
  const api={ATTRS,LABELS,SLOTS,STRATEGIES,TALENTS,STARS,BY_ID,FOES,SYNERGIES,BOOSTS,GEAR,createGame,createRun,tierOdds,makeOffer,recruit,recruitCost,resolvePending,swapBench,swapPositions,saleValue,sellBench,starterCount,ownedCount,identityOf,starSynergies,activeSynergies,fused,opponent,trainingCost,train,buyBoost,buyGear,expandBench,refreshOffer,battle,continueRun,finishRun,clamp};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SupFusionGameCore=api;
})(typeof window!=='undefined'?window:globalThis);

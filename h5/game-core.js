/* 《我的球星融合系统》初版规则与状态。数值为游戏设计值，并非真实 NBA 统计。 */
(function (root) {
  'use strict';

  const ATTRS = ['three', 'mid', 'drive', 'handle', 'post', 'inside', 'def', 'rebound'];
  const LABELS = { three: '三分', mid: '中投', drive: '突破', handle: '控球', post: '背身', inside: '篮下', def: '防守', rebound: '篮板' };
  const SLOTS = [
    { id: 'three', label: '三分', secondary: 'handle' },
    { id: 'mid', label: '中投', secondary: 'drive' },
    { id: 'drive', label: '突破', secondary: 'inside' },
    { id: 'handle', label: '控球', secondary: 'mid' },
    { id: 'post', label: '背身', secondary: 'inside' },
    { id: 'def', label: '防守', secondary: 'rebound' }
  ];
  const STRATEGIES = {
    outside: { name: '外线拉开', beats: 'collapse', shot: 'three', description: '三分出手更多，克制护框收缩' },
    drive: { name: '突破冲筐', beats: 'outside', shot: 'drive', description: '冲击篮筐，克制外线拉开' },
    collapse: { name: '护框收缩', beats: 'drive', shot: 'inside', description: '内线防守更强，克制突破冲筐' }
  };
  const TALENTS = [
    { id: 'outside', name: '外线速成', gain: '三分、控球 +5；开局免费招募 +1', cost: '背身 -3' },
    { id: 'inside', name: '禁区霸主', gain: '背身、篮下、篮板 +5', cost: '三分 -3' },
    { id: 'defense', name: '铁血防线', gain: '防守、篮板 +5；失败补偿 +2', cost: '胜利基础奖金 -1' },
    { id: 'agent', name: '球星经纪人', gain: '每关免费招募 +1', cost: '训练额外花费 2 奖金' },
    { id: 'economy', name: '精算大师', gain: '胜利奖金 +2；利息上限 +1', cost: '开局免费招募 -1' }
  ];
  // 属性顺序：三分、中投、突破、控球、背身、篮下、防守、篮板。
  const STAR_ROWS = [
    ['curry','斯蒂芬·库里','S','PG','金州', 'three',[96,91,82,94,50,72,71,60],'超远射程'],
    ['lebron','勒布朗·詹姆斯','L','SF','洛杉矶','drive',[84,88,96,94,86,96,88,90],'全能统治'],
    ['kobe','科比·布莱恩特','S','SG','洛杉矶','mid',[86,95,89,87,82,88,84,72],'关键杀手'],
    ['duncan','蒂姆·邓肯','S','PF','圣安东尼奥','post',[52,88,71,69,94,93,96,96],'稳固根基'],
    ['kawhi','科怀·伦纳德','S','SF','洛杉矶','def',[86,89,85,80,77,89,97,87],'死亡缠绕'],
    ['irving','凯里·欧文','A','PG','达拉斯','handle',[90,89,91,96,61,82,73,57],'脚踝终结'],
    ['durant','凯文·杜兰特','S','SF','菲尼克斯','mid',[92,97,86,84,85,94,84,79],'无解投射'],
    ['jokic','尼古拉·约基奇','S','C','丹佛','post',[81,90,76,95,95,96,83,96],'中轴策应'],
    ['giannis','扬尼斯·阿德托昆博','S','PF','密尔沃基','drive',[66,79,97,86,88,98,94,95],'禁区冲击'],
    ['shaq','沙奎尔·奥尼尔','L','C','洛杉矶','inside',[30,70,83,71,97,99,91,99],'篮下巨兽'],
    ['jordan','迈克尔·乔丹','L','SG','芝加哥','mid',[82,97,97,92,88,97,96,85],'最后一投'],
    ['wade','德维恩·韦德','A','SG','迈阿密','drive',[72,87,95,89,74,91,90,77],'闪电突破'],
    ['harden','詹姆斯·哈登','A','SG','洛杉矶','handle',[93,87,91,94,78,88,72,69],'节奏大师'],
    ['klay','克莱·汤普森','A','SG','达拉斯','three',[95,86,77,75,62,81,86,71],'接球即投'],
    ['green','德雷蒙德·格林','B','PF','金州','def',[75,74,71,84,82,80,93,89],'防线指挥'],
    ['holiday','朱·霍勒迪','B','PG','波士顿','def',[82,83,78,86,67,78,92,75],'后场铁闸'],
    ['white','德里克·怀特','B','G','波士顿','def',[82,81,77,83,63,78,88,70],'追身封盖'],
    ['lillard','达米安·利拉德','A','PG','密尔沃基','three',[94,87,88,92,62,81,72,62],'超远决胜'],
    ['tatum','杰森·塔图姆','A','SF','波士顿','mid',[87,89,88,85,83,88,86,83],'锋线得分'],
    ['booker','德文·布克','A','SG','菲尼克斯','mid',[88,94,86,87,72,86,78,67],'中投连击'],
    ['embiid','乔尔·恩比德','A','C','费城','post',[79,86,79,74,93,96,89,95],'低位威慑'],
    ['davis','安东尼·戴维斯','A','PF','达拉斯','def',[74,82,83,72,88,94,96,95],'禁区屏障'],
    ['westbrook','拉塞尔·威斯布鲁克','B','PG','丹佛','drive',[70,78,94,88,70,86,77,83],'全速冲锋'],
    ['paul','克里斯·保罗','A','PG','圣安东尼奥','handle',[86,92,76,97,60,75,88,63],'精准掌控'],
    ['nash','史蒂夫·纳什','A','PG','菲尼克斯','handle',[91,92,78,98,55,79,68,62],'大师传球'],
    ['rodman','丹尼斯·罗德曼','B','PF','芝加哥','rebound',[45,63,75,62,77,78,92,99],'篮板狂人'],
    ['gobert','鲁迪·戈贝尔','B','C','明尼苏达','def',[35,59,61,58,78,89,96,97],'护框专家'],
    ['anunoby','OG·阿奴诺比','C','SF','纽约','def',[79,76,78,72,65,76,87,77],'侧翼防线'],
    ['caruso','亚历克斯·卡鲁索','C','G','俄克拉荷马城','def',[76,73,76,80,58,73,88,70],'拼抢先锋'],
    ['lopez','布鲁克·洛佩兹','C','C','密尔沃基','inside',[78,73,55,57,82,86,86,82],'高塔投射']
  ];
  const STARS = STAR_ROWS.map(r => ({ id:r[0], name:r[1], tier:r[2], role:r[3], team:r[4], best:r[5], attrs:Object.fromEntries(ATTRS.map((a,i)=>[a,r[6][i]])), talent:r[7] }));
  const BY_ID = Object.fromEntries(STARS.map(s=>[s.id,s]));
  const FOES = ['giannis','irving','tatum','harden','durant','davis','jokic','kawhi','jordan','lebron'];
  const SYNERGIES = [
    { name:'水花兄弟', ids:['curry','klay'], attr:'three', gain:6 },
    { name:'冠军内外线', ids:['kobe','shaq'], attr:'inside', gain:6 },
    { name:'热火双核', ids:['lebron','wade'], attr:'drive', gain:5 },
    { name:'勇士防线', ids:['curry','green'], attr:'def', gain:5 },
    { name:'绿军攻防', ids:['tatum','holiday','white'], attr:'def', gain:7 },
    { name:'雷霆三少', ids:['durant','harden','westbrook'], attr:'three', gain:7 },
    { name:'关键杀手', ids:['jordan','kobe'], attr:'mid', gain:6 },
    { name:'禁区双塔', ids:['duncan','davis'], attr:'rebound', gain:6 },
    { name:'传球大师', ids:['jokic','nash'], attr:'handle', gain:6 }
  ];
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
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function nextRandom(run){run.rng=(Math.imul(run.rng,1664525)+1013904223)>>>0;return run.rng/4294967296}
  function randomChoice(run,arr){return arr[Math.floor(nextRandom(run)*arr.length)]}
  function createGame(){return { version:1, run:null, profile:{runs:0,wins:0,bestStage:0,bestEndless:0,legend:0,discovered:[]} }}
  function createRun(talent,seed){
    const run={seed:seed>>>0,rng:seed>>>0,talent,stage:1,endless:false,morale:3,cash:16,free:6,refreshFree:1,owned:{},slots:Object.fromEntries(SLOTS.map(s=>[s.id,null])),bench:[],benchLimit:5,offer:[],pending:null,boosts:[],gear:[],wins:0,losses:0,lastBattle:null,ended:false,awarded:false};
    if(talent==='outside')run.free+=1;
    if(talent==='economy')run.free-=1;
    makeOffer(run);
    return run;
  }
  function ownedCount(run){return Object.keys(run.owned).length}
  function starterCount(run){return SLOTS.filter(s=>run.slots[s.id]).length}
  function activeSynergies(run){const ids=new Set(Object.keys(run.owned));return SYNERGIES.filter(s=>s.ids.every(id=>ids.has(id)))}
  function tierRoll(run){const n=nextRandom(run)*100;return n<3?'L':n<17?'S':n<48?'A':n<82?'B':'C'}
  function makeOffer(run){
    if(run.offer.length)return run.offer;
    const chosen=[];
    for(let i=0;i<4;i++){
      let tier=tierRoll(run);
      if(i===3 && run.stage<=2 && !chosen.some(id=>tierValue[BY_ID[id].tier]>=2))tier='A';
      let pool=STARS.filter(s=>s.tier===tier && !chosen.includes(s.id) && (starterCount(run)>=6 || !run.owned[s.id]));
      if(!pool.length)pool=STARS.filter(s=>!chosen.includes(s.id) && (starterCount(run)>=6 || !run.owned[s.id]));
      if(!pool.length)pool=STARS.filter(s=>!chosen.includes(s.id));
      chosen.push(randomChoice(run,pool).id);
    }
    run.offer=chosen;
    return chosen;
  }
  function recruit(run,id){
    if(run.ended||run.pending||!run.offer.includes(id))return {ok:false,reason:'本轮无法选择该球星'};
    if(run.free<=0 && run.cash<8)return {ok:false,reason:'奖金不足，无法追加招募'};
    if(run.free>0)run.free--;else run.cash-=8;
    run.offer=[];
    const star=BY_ID[id];
    if(run.owned[id]){
      const own=run.owned[id];
      if(own.stars<3)own.stars++;else run.cash+=4;
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
    if(mode==='sell'){run.cash+=Math.max(3,tierValue[BY_ID[id].tier]+2)}
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
  function playerScore(star,own,key){return star.attrs[key]+(own.stars-1)*3+own.train*3}
  function fused(run){
    const stats={};
    for(const attr of ATTRS){
      let sum=0,weight=0;
      for(const slot of SLOTS){
        const id=run.slots[slot.id];if(!id)continue;
        const w=attr===slot.id?2.5:attr===slot.secondary?1.25:.28;
        sum+=playerScore(BY_ID[id],run.owned[id],attr)*w;weight+=w;
      }
      stats[attr]=weight?Math.round(sum/weight):0;
    }
    for(const bond of activeSynergies(run))stats[bond.attr]+=bond.gain;
    if(run.talent==='outside'){stats.three+=5;stats.handle+=5;stats.post-=3}
    if(run.talent==='inside'){stats.post+=5;stats.inside+=5;stats.rebound+=5;stats.three-=3}
    if(run.talent==='defense'){stats.def+=5;stats.rebound+=5}
    for(const itemId of run.gear){const item=GEAR.find(g=>g.id===itemId);if(!item)continue;if(item.attr==='all')for(const a of ATTRS)stats[a]+=item.gain;else stats[item.attr]+=item.gain}
    for(const boostId of run.boosts){const item=BOOSTS.find(b=>b.id===boostId);if(!item)continue;if(item.attr==='all')for(const a of ATTRS)stats[a]+=item.gain;else stats[item.attr]+=item.gain}
    for(const key of ATTRS)stats[key]=clamp(Math.round(stats[key]),0,110);
    const rating=Math.round(ATTRS.reduce((n,a)=>n+stats[a],0)/ATTRS.length);
    return {stats,rating,bonds:activeSynergies(run)};
  }
  function opponent(run){
    const id=FOES[(run.stage-1)%FOES.length],star=BY_ID[id];
    const diff=run.stage<=10?(-11+run.stage*2):(9+(run.stage-10)*2.1);
    const stats=Object.fromEntries(ATTRS.map(a=>[a,clamp(Math.round(star.attrs[a]+diff),35,110)]));
    const strategy=star.best==='three'?'outside':star.best==='drive'?'drive':'collapse';
    return {id,name:star.name,strategy,stats,rating:Math.round(ATTRS.reduce((n,a)=>n+stats[a],0)/8)};
  }
  function trainingCost(run,id){const level=run.owned[id]?.train??0;return [4,7,11][level]+(run.talent==='agent'?2:0)}
  function train(run,id){const own=run.owned[id];if(!own||own.train>=3||own.trainedAt===run.stage)return false;const cost=trainingCost(run,id);if(run.cash<cost)return false;run.cash-=cost;own.train++;own.trainedAt=run.stage;return true}
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
      const control=atk.handle-(def.def*.55+def.rebound*.15);
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
      const bond=own.bonds.length?1:0;reward=base+interest+bond;run.cash+=reward;run.wins++;detail=[`胜利 ${base}`,`利息 ${interest}`,`羁绊 ${bond}`];
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
    run.stage++;run.free+=2+(run.talent==='agent'?1:0);run.refreshFree=1;run.offer=[];run.lastBattle=null;
    return true;
  }
  const api={ATTRS,LABELS,SLOTS,STRATEGIES,TALENTS,STARS,BY_ID,FOES,SYNERGIES,BOOSTS,GEAR,createGame,createRun,makeOffer,recruit,resolvePending,swapBench,starterCount,ownedCount,activeSynergies,fused,opponent,trainingCost,train,buyBoost,buyGear,expandBench,refreshOffer,battle,continueRun,finishRun,clamp};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SupFusionGameCore=api;
})(typeof window!=='undefined'?window:globalThis);

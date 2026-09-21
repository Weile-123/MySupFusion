/* 《我的球星融合系统》第二版界面：保留已确认的深色卡片风格。 */
(function () {
  'use strict';
  const C=window.SupFusionGameCore;
  const STORAGE=window.FusionStorage;
  const els=Object.fromEntries(['home','talent','recruit','roster','shop','duel','result','profile'].map(id=>[id,document.getElementById(id)]));
  let game=C.createGame(),screen='home',talentOffer=[],selectedTalent='',selectedOffer='',selectedPlace=null,showBonds=false,detailStar='',strategy='collapse',shopTab='training',profileTab='stars',saveQueue=Promise.resolve();
  const tierName={L:'传奇',S:'名人堂',A:'黄金',B:'白银',C:'青铜'};
  const tierClass={L:'tier-legend',S:'tier-s',A:'tier-a',B:'tier-b',C:'tier-c'};
  const attrOrder=['three','mid','drive','handle','inside','def'];
  const barColor={three:'bar-orange',mid:'bar-gold',drive:'bar-red',handle:'bar-blue',inside:'bar-orange',def:'bar-gold'};
  const $=id=>document.getElementById(id);
  function notify(){/* 所有状态变化直接反映在对应页面，不显示浮动提示框。 */}
  function save(){
    if(!STORAGE.available())return;
    const snapshot=JSON.parse(JSON.stringify(game));
    saveQueue=saveQueue.then(()=>STORAGE.save(snapshot)).catch(()=>notify('存档写入失败，请稍后重试'));
  }
  function safeNumber(value,min,max,fallback){
    return typeof value==='number'&&Number.isFinite(value)?C.clamp(Math.round(value),min,max):fallback;
  }
  function knownPlayer(id){return typeof id==='string'&&Object.hasOwn(C.BY_ID,id)}
  function escapeText(value){
    return String(value).replace(/[&<>"']/g,ch=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  }
  function restoreGame(raw){
    const restored=C.createGame();
    if(!raw||raw.version!==1||typeof raw.profile!=='object'||!raw.profile)return restored;
    const profile=raw.profile;
    restored.profile={
      runs:safeNumber(profile.runs,0,100000,0),
      wins:safeNumber(profile.wins,0,1000000,0),
      bestStage:safeNumber(profile.bestStage,0,10,0),
      bestEndless:safeNumber(profile.bestEndless,0,100000,0),
      legend:safeNumber(profile.legend,0,10000000,0),
      discovered:Array.isArray(profile.discovered)?[...new Set(profile.discovered.filter(knownPlayer))]:[],
      upgrades:{scouting:safeNumber(profile.upgrades?.scouting,0,10,0)}
    };
    const source=raw.run;
    if(!source||typeof source!=='object'||!C.TALENTS.some(t=>t.id===source.talent))return restored;
    const seed=safeNumber(source.seed,0,4294967295,1);
    const run=C.createRun(source.talent,seed,{rarityBonus:restored.profile.upgrades.scouting});
    run.rng=safeNumber(source.rng,0,4294967295,run.rng);
    run.stage=safeNumber(source.stage,1,100000,1);
    run.endless=source.endless===true;
    run.rarityBonus=safeNumber(source.rarityBonus,0,10,run.rarityBonus);
    run.morale=safeNumber(source.morale,0,3,3);
    run.cash=safeNumber(source.cash,0,1000000,16);
    run.free=safeNumber(source.free,0,1000,0);
    run.refreshFree=safeNumber(source.refreshFree,0,1,0);
    run.benchLimit=safeNumber(source.benchLimit,5,10,5);
    run.wins=safeNumber(source.wins,0,100000,0);
    run.losses=safeNumber(source.losses,0,100000,0);
    run.owned=Object.create(null);
    if(source.owned&&typeof source.owned==='object'){
      for(const [id,own] of Object.entries(source.owned)){
        if(!knownPlayer(id)||!own||typeof own!=='object')continue;
        const star=C.BY_ID[id];
        run.owned[id]={
          stars:safeNumber(own.stars,1,star.maxStars,1),
          train:safeNumber(own.train,0,star.maxTrain,0),
          trainedAt:safeNumber(own.trainedAt,0,run.stage,0)
        };
      }
    }
    const used=new Set();
    for(const slot of C.SLOTS){
      const id=source.slots?.[slot.id]??(slot.id==='inside'?source.slots?.post:null);
      run.slots[slot.id]=knownPlayer(id)&&run.owned[id]&&!used.has(id)?id:null;
      if(run.slots[slot.id])used.add(id);
    }
    run.bench=[];
    if(Array.isArray(source.bench)){
      for(const id of source.bench){
        if(run.bench.length>=run.benchLimit)break;
        if(knownPlayer(id)&&run.owned[id]&&!used.has(id)){run.bench.push(id);used.add(id)}
      }
    }
    for(const id of Object.keys(run.owned))if(!used.has(id))delete run.owned[id];
    run.offer=Array.isArray(source.offer)?[...new Set(source.offer.filter(knownPlayer))].slice(0,4):[];
    run.pending=knownPlayer(source.pending)&&!run.owned[source.pending]?source.pending:null;
    run.boosts=Array.isArray(source.boosts)?[...new Set(source.boosts.filter(id=>C.BOOSTS.some(b=>b.id===id)))].slice(0,3):[];
    run.gear=Array.isArray(source.gear)?[...new Set(source.gear.filter(id=>C.GEAR.some(g=>g.id===id)))].slice(0,5):[];
    run.ended=source.ended===true||run.morale===0;
    run.awarded=source.awarded===true;
    const report=source.lastBattle;
    if(report&&typeof report==='object'){
      const foeId=knownPlayer(report.foe)?report.foe:C.opponent(run).id;
      const foe=C.BY_ID[foeId];
      const style=Object.hasOwn(C.STRATEGIES,report.strategy)?report.strategy:'collapse';
      run.lastBattle={
        stage:safeNumber(report.stage,1,100000,run.stage),
        won:report.won===true,
        us:safeNumber(report.us,0,100,0),
        them:safeNumber(report.them,0,100,0),
        reward:safeNumber(report.reward,0,1000,0),
        detail:['已恢复赛后奖金记录'],
        log:Array.isArray(report.log)?report.log.slice(-7).map(line=>String(line).slice(0,120)):[],
        strategy:style,
        foe:foeId,
        foeName:foe.name,
        foeStrategy:C.opponent(run).strategy,
        beats:safeNumber(report.beats,-1,1,0),
        rating:safeNumber(report.rating,0,110,0),
        foeRating:safeNumber(report.foeRating,0,110,0),
        legendEarned:safeNumber(report.legendEarned,0,100000,0)
      };
    }
    restored.run=run;
    return restored;
  }
  function top(){
    const r=game.run;
    const header=document.querySelector('.top');
    const back=screen==='roster'||screen==='talent'?['home','返回首页']:
      ['recruit','shop','duel'].includes(screen)?['roster','返回阵容']:
      screen==='result'?['roster','返回阵容']:['home','返回首页'];
    const forcedOpening=screen==='talent'||screen==='recruit'&&r&&C.starterCount(r)<6;
    header.innerHTML=r&&!r.ended
      ?`${forcedOpening?'':`<button class="top-back" data-act="${back[0]}">← ${back[1]}</button>`}<div class="top-status"><span><small>关卡</small><b>${r.stage}/10</b></span><span><img src="assets/cash-stack.png" alt="奖金"><b>${r.cash}</b></span><span class="top-life"><i>♥</i><b>${r.morale}/3</b></span></div>`
      :forcedOpening?'':`<button class="top-back" data-act="home">← 返回首页</button>`;
  }
  function go(id){
    if(id!=='roster'){showBonds=false;selectedPlace=null}
    if(id!=='recruit')detailStar='';
    screen=id;
    Object.keys(els).forEach(key=>els[key].classList.toggle('active',key===id));
    document.querySelector('.app').classList.toggle('home-mode',id==='home');
    document.querySelector('.app').classList.toggle('profile-mode',id==='profile');
    render();
    top();
    window.scrollTo({top:0,behavior:'auto'});
  }
  function render(){({home:renderHome,talent:renderTalent,recruit:renderRecruit,roster:renderRoster,shop:renderShop,duel:renderDuel,result:renderResult,profile:renderProfile}[screen]||renderHome)();renderPending()}
  function runOrHome(){if(!game.run||game.run.ended){go('home');return null}return game.run}
  function renderHome(){
    const r=game.run,active=r&&!r.ended;
    els.home.innerHTML=`
      <section class="home-hero"><div class="home-orbit" aria-hidden="true"><span>11</span></div><div class="home-eyebrow">BUILD YOUR OWN LEGEND</div>
        <h1>我的球星<br><em>融合系统</em></h1>
        <p>六位球星，一位终极单挑者。招募、融合、闯关，打出独一无二的传奇之路。</p>
        <div class="home-scores"><div><b>06</b><small>能力槽位</small></div><div><b>10</b><small>主线关卡</small></div><div><b>∞</b><small>无尽挑战</small></div></div>
      </section>
      ${active?`<button class="btn wide home-primary home-continue" data-act="continue">继续第 ${r.stage} 关 <span>→</span></button>`:''}
      <button class="btn wide home-primary home-new" data-act="new">${active?'开启另一段旅程':'开启新旅程'} <span>→</span></button>
      <div class="home-entry-row"><button class="home-secondary" data-act="profile">传奇档案与图鉴 ›</button><button class="home-secondary" data-act="rules">玩法说明 ›</button></div>
      <div class="home-divider"><span>HOW TO PLAY</span></div>
      <div class="home-steps"><div><i>01</i><b>四选一招募</b><small>挑选适合能力槽的球星</small></div><div><i>02</i><b>融合阵容</b><small>激活羁绊与专属天赋</small></div><div><i>03</i><b>单挑闯关</b><small>对阵球星，赚取奖金</small></div></div>
       <p class="footer-note">${STORAGE.available()?'本地存档已启用，刷新页面可继续旅程。':'当前浏览器不支持本地存储；建议在支持 IndexedDB 的浏览器或活动环境打开。'}</p>`;
  }
  function renderTalent(){
    els.talent.innerHTML=`
      <button class="inline-back" data-act="home">← 返回首页</button><div class="eyebrow">NEW RUN · 开局抉择</div>
      <h1 class="title">选择你的融合路线</h1><p class="lead">三选一的开局天赋贯穿整局，每项优势都伴随取舍。</p>
      <div class="list">${talentOffer.map(t=>`<button class="talent ${selectedTalent===t.id?'selected':''}" data-act="talent" data-id="${t.id}"><b>✦ ${t.name}</b><span>${t.gain}</span><i>代价：${t.cost}</i></button>`).join('')}</div>
      <div class="floatingaction"><button class="btn wide" data-act="begin">确定天赋，开始四选一招募 →</button></div>`;
  }
  function draftBondHints(id){
    const identity=C.identityOf(id),owned=new Set(Object.keys(game.run.owned).map(C.identityOf));
    return C.starSynergies(id).map(bond=>{
      const ownedOthers=bond.ids.filter(player=>player!==identity&&owned.has(player)).length;
      if(!ownedOthers)return null;
      const afterCount=bond.ids.filter(player=>owned.has(player)||player===identity).length;
      return {name:bond.name,count:afterCount,total:bond.ids.length,active:afterCount===bond.ids.length};
    }).filter(Boolean).sort((a,b)=>Number(b.active)-Number(a.active)||b.count-a.count).slice(0,2);
  }
  function draftCard(id){
    const s=C.BY_ID[id],own=game.run.owned[id],duplicate=!!own,value=s.attrs[s.best],bondHints=draftBondHints(id);
    return `<div class="card ${tierClass[s.tier]} ${selectedOffer===id?'selected':''}">
      <button class="card-select" data-act="select-offer" data-id="${id}"><span class="card-top"><span class="rarity">${tierName[s.tier]} · ${s.role}</span>${duplicate?`<span class="draft-upgrade">★ ${Math.min(s.maxStars,own.stars+1)}级</span>`:''}</span>
      <span class="card-visual"><span class="visual-number">${value}</span><span class="visual-role">${duplicate?'升星':'球星招募'}</span>${bondHints.length?`<span class="draft-bond-hints">${bondHints.map(b=>`<i class="${b.active?'active':''}">[${b.name}${b.active?'':` ${b.count}/${b.total}`}]</i>`).join('')}</span>`:''}<strong>${s.name}</strong><small>${s.talent}</small></span></button>
      <div class="card-meta"><span>推荐 · ${C.LABELS[s.best]}位</span><button class="card-detail" data-act="star-detail" data-id="${id}">查看详情</button></div>
      <div class="card-effect">◎ ${s.talent}：${s.talentEffect.description}</div>
    </div>`;
  }
  function renderRecruit(){
    const r=runOrHome();if(!r)return;
    if(!r.offer.length&&!r.pending){C.makeOffer(r);save()}
    if(!r.offer.includes(selectedOffer))selectedOffer=r.offer[0]||'';
    const selected=C.BY_ID[selectedOffer],odds=C.tierOdds(r),pct=value=>Number.isInteger(value)?value:String(value.toFixed(1)).replace(/\.0$/,'');
    els.recruit.innerHTML=`
      <button class="inline-back" data-act="roster">← 返回融合球场</button>
      <div class="draft-heading"><div><span class="league-label">HOOP LEGEND</span><h1>DRAFT <small>招募</small></h1></div></div>
      <div class="draft-odds"><span class="tier-dot legend-dot"></span>传奇 ${pct(odds.L)}% <span class="tier-dot s-dot"></span>名人堂 ${pct(odds.S)}% <span class="tier-dot a-dot"></span>黄金 ${pct(odds.A)}% <span>白银 ${pct(odds.B)}% · 青铜 ${pct(odds.C)}%</span><b>当前 ${r.cash} 奖金</b></div>
      <div class="choicegrid">${r.offer.map(draftCard).join('')}</div>
      <div class="floatingaction"><button class="btn wide" data-act="pick" ${r.free<=0&&r.cash<C.recruitCost(r)?'disabled':''}>${r.free<=0&&r.cash<C.recruitCost(r)?'奖金不足，无法招募':'确定选入 '+(selected?selected.name:'')+' →'}</button></div>`;
  }
  function rosterSlot(slot,r){
    const id=r.slots[slot.id],s=C.BY_ID[id];
    const selected=selectedPlace?.kind==='slot'&&selectedPlace.key===slot.id?'selected':'';
    if(!s)return `<button class="slot empty ${selected}" data-act="place" data-kind="slot" data-key="${slot.id}"><span class="slot-top">${slot.label}位 · ${slot.id.toUpperCase()}</span><span class="slot-body"><i>＋</i><strong>待招募<small>选择球员换入</small></strong></span></button>`;
    return `<button class="slot ${tierClass[s.tier]} ${selected}" data-act="place" data-kind="slot" data-key="${slot.id}"><span class="slot-top">${slot.label}位 · ${slot.id.toUpperCase()} <b>${tierName[s.tier]} · ${r.owned[id].stars}★</b></span>
      <span class="slot-body"><i class="${s.attrs[slot.id]>=100?'triple':''}">${s.attrs[slot.id]}</i><strong>${s.name}<small>${s.talent} · 训练 ${r.owned[id].train}/${s.maxTrain}</small></strong></span></button>`;
  }
  function acePanel(r,fusion){
    return `<div class="ace-panel panel"><div class="ace-mark"><img src="assets/fusion-ace.png" alt="融合球员概念插画"><span>LV.${r.stage} 融合体</span></div>
      <div class="ace-main"><div class="ace-score"><strong>${fusion.rating}</strong><span><b>OVR 综合评分</b><br><em>${fusion.rating>=90?'巅峰':'王牌'} 战术核心</em></span></div>
        <div class="ace-sub">${C.TALENTS.find(t=>t.id===r.talent)?.name||'自由构筑'} · ${fusion.bonds.length} 组羁绊生效</div>
        <div class="ace-bars">${attrOrder.map(a=>`<div><span>${C.LABELS[a]}</span><i><em class="${barColor[a]}" style="width:${Math.min(100,fusion.stats[a])}%"></em></i><b>${fusion.stats[a]}</b></div>`).join('')}</div></div></div>`;
  }
  function benchCard(id,index,r){
    const s=C.BY_ID[id];
    return `<div class="bench-card ${tierClass[s.tier]} ${selectedPlace?.kind==='bench'&&selectedPlace.key===index?'selected':''}">
      <button class="bench-player" data-act="place" data-kind="bench" data-key="${index}"><strong>${s.name}</strong><small>${r.owned[id].stars} <span class="star-icon">★</span> · ${C.LABELS[s.best]} ${s.attrs[s.best]}</small></button>
      <button class="bench-sell" data-act="sell-bench" data-index="${index}" aria-label="出售 ${s.name}"><span>出售</span><b><img src="assets/cash-stack.png" alt="">${C.saleValue(id)}</b></button>
    </div>`;
  }
  function renderRoster(){
    const r=runOrHome();if(!r)return;
    const fusion=C.fused(r);
    els.roster.innerHTML=`
      <button class="inline-back" data-act="home">← 返回首页</button>
      <div class="sectionhead bond-heading"><h2>✧ 激活战术羁绊</h2><button data-act="bonds">查看全部</button></div>
      <div class="bond-tags">${fusion.bonds.length?fusion.bonds.slice(0,3).map(b=>`<span>● ${b.name}</span>`).join(''):'<span>尚未激活 · 招募组合球星</span>'}</div>
      <div class="sectionhead slots-heading"><h2>融合面板</h2><span>拖动球员更换位置</span></div>
      <div class="fusion-lineup"><div class="lineup-column">${C.SLOTS.slice(0,3).map(s=>rosterSlot(s,r)).join('')}</div><div class="lineup-center"><img src="assets/fusion-player-asian.png" alt="持球的融合球员"></div><div class="lineup-column">${C.SLOTS.slice(3).map(s=>rosterSlot(s,r)).join('')}</div></div>
      <div class="sectionhead bench-title"><h2>备战席 <span class="bench-count">${r.bench.length} / ${r.benchLimit}</span></h2><span>拖动球员更换位置</span></div>
      <div class="bench-grid" id="benchGrid">${r.bench.map((id,i)=>benchCard(id,i,r)).join('')}</div>
      <div class="roster-dock"><div class="action-cash"><img src="assets/cash-stack.png" alt="">当前奖金 <b>${r.cash}</b></div>
        <div class="quick-actions"><button class="btn wide recruit-action ${r.free>0?'has-free':''}" data-act="recruit" ${r.free<=0&&r.cash<C.recruitCost(r)?'disabled':''}><span>招募球员</span><small>${r.free>0?`免费 · 仅本轮（${r.free} 次）`:`${C.recruitCost(r)} 奖金`}</small>${r.free>0?'<i aria-label="有免费招募"></i>':''}</button><button class="btn wide" data-act="shop">训练 / 商店</button></div>
        <button class="btn wide roster-fight" data-act="duel" ${C.starterCount(r)<6?'disabled':''}>前往备战</button></div>`;
  }
  function shopItem(title,desc,price,action,id,disabled){
    return `<div class="panel shopitem"><div class="left"><span class="shopicon">◆</span><div><strong>${title}</strong><small>${desc}</small></div></div><button class="btn small" data-act="${action}" data-id="${id}" ${disabled?'disabled':''}>${price}</button></div>`;
  }
  function cashPrice(value){return `<span class="cash-price"><img src="assets/cash-stack.png" alt="奖金">${value}</span>`}
  function renderShop(){
    const r=runOrHome();if(!r)return;
    const tabs=[['training','训练'],['boost','赛前强化'],['gear','装备'],['capacity','容量']];
    let content='';
    if(shopTab==='training')content=Object.keys(r.owned).map(id=>{
      const s=C.BY_ID[id],own=r.owned[id],disabled=own.train>=s.maxTrain||own.trainedAt===r.stage||r.cash<C.trainingCost(r,id);
      return shopItem(s.name+' · 训练 '+own.train+'/'+s.maxTrain,C.LABELS[s.best]+'位贡献 +3 · 每关限练 1 次',own.train>=s.maxTrain?'已满级':cashPrice(C.trainingCost(r,id)),'train',id,disabled);
    }).join('');
    if(shopTab==='boost')content=C.BOOSTS.map(x=>shopItem(x.name,x.description,r.boosts.includes(x.id)?'已持有':cashPrice(x.price),'buy-boost',x.id,r.cash<x.price||r.boosts.length>=3||r.boosts.includes(x.id))).join('');
    if(shopTab==='gear')content=C.GEAR.map(x=>shopItem(x.name,x.description,r.gear.includes(x.id)?'已装备':cashPrice(x.price),'buy-gear',x.id,r.cash<x.price||r.gear.length>=5||r.gear.includes(x.id))).join('');
    if(shopTab==='capacity')content=shopItem('备战席扩容','上限由 '+r.benchLimit+' 提升至 '+Math.min(10,r.benchLimit+1)+'；最多 10 位',r.benchLimit>=10?'已满':cashPrice(10),'expand','bench',r.benchLimit>=10||r.cash<10);
    els.shop.innerHTML=`<button class="inline-back" data-act="roster">← 返回融合球场</button><div class="row"><div><div class="eyebrow">LOCKER ROOM</div><h1 class="title">训练与商店</h1></div><span class="pill gold shop-balance"><img src="assets/cash-stack.png" alt="奖金">${r.cash}</span></div>
      <p class="lead">训练核心、购买装备和赛前强化。当前强化 ${r.boosts.length}/3，装备 ${r.gear.length}/5。</p>
      <div class="tabrow">${tabs.map(([id,name])=>`<button class="tab ${shopTab===id?'active':''}" data-act="shop-tab" data-id="${id}">${name}</button>`).join('')}</div>
      <div class="shopPanel list">${content||'<div class="emptyline">暂无可训练球星，先去招募吧。</div>'}</div>
      <p class="footer-note">装备持续整局；赛前强化只对下一场生效。训练、购买后会立即保存。</p>
      <button class="btn wide" data-act="roster">整备完成，返回球场 →</button>`;
  }
  function renderDuel(){
    const r=runOrHome();if(!r)return;
    const foe=C.opponent(r),fusion=C.fused(r);
    els.duel.innerHTML=`<button class="inline-back" data-act="roster">← 返回融合球场</button>
      <div class="eyebrow">STAGE ${String(r.stage).padStart(2,'0')} · 赛前情报</div><h1 class="title">选择单挑策略</h1>
      <p class="lead">对手倾向「${C.STRATEGIES[foe.strategy].name}」。策略克制有优势，但球星属性和临场发挥仍决定结果。</p>
      ${acePanel(r,fusion)}
      <div class="sectionhead duel-foe-heading"><h2>本关对手</h2><span>战力对比 ${fusion.rating} : ${foe.rating}</span></div>
      <div class="panel opponent"><div class="eyebrow">本关对手 · OVR ${foe.rating}</div><strong>${foe.name}</strong>
        <p>三分 ${foe.stats.three} · 突破 ${foe.stats.drive} · 防守 ${foe.stats.def}</p>
        <p>倾向：${C.STRATEGIES[foe.strategy].name}</p><span class="versus">VS</span></div>
      <div class="sectionhead"><h2>本场策略</h2><span>三选一</span></div>
      <div class="list">${Object.entries(C.STRATEGIES).map(([id,x])=>`<button class="strategy ${strategy===id?'selected':''}" data-act="strategy" data-id="${id}"><b>${x.name}</b><small>${x.description}</small></button>`).join('')}</div>
      <div class="floatingaction"><button class="btn wide" data-act="battle">开始自动单挑 →</button></div>`;
  }
  function renderResult(){
    const r=game.run,report=r?.lastBattle;if(!report){go('home');return}
    const won=report.won,ended=r.ended,final=r.stage===10&&won&&!r.endless;
    const beatText=report.beats>0?'战术克制成功':report.beats<0?'本场战术被克制':'双方策略未形成克制';
    els.result.innerHTML=`
      <div class="result-card panel"><div class="result-top"><b>11 分制 · 一局定胜负<br>最终比分</b><span>比赛结果${won?'<br><strong>挑战成功</strong>':''}</span></div>
        <div class="result-scoreboard"><div class="result-side"><div class="result-avatar you-avatar"><img src="assets/fusion-ace.png" alt="融合球员概念插画"></div><strong>终极融合体</strong><small>阵容：融合王牌</small></div>
          <div class="result-middle"><div class="score">${report.us}<span>:</span>${report.them}</div><b>${won?'胜利':'失利'}</b></div>
          <div class="result-side"><div class="result-avatar opp-avatar"><img src="assets/rival-forward.png" alt="对手概念插画"></div><strong>${report.foeName}</strong><small>OVR ${report.foeRating}</small></div></div>
        <div class="result-strategy"><span>▣ ${beatText}：${C.STRATEGIES[report.strategy].name}</span><b>${report.beats>0?'优势 +8%':report.beats<0?'劣势 -8%':'势均力敌'}</b></div></div>
      <div class="sectionhead"><h2>${won?'挑战成功':'挑战失利'}</h2><span>第 ${report.stage} 关 · 士气 ${r.morale}/3</span></div>
      <div class="panel shopitem"><div class="left"><span class="shopicon">＄</span><div><strong>本场奖金 +${report.reward}</strong><small>${report.detail.join(' · ')}</small></div></div><span class="pill gold">当前 ${r.cash}</span></div>
      <div class="sectionhead"><h2>关键回合</h2></div><div class="timeline">${report.log.map(line=>`<p>${escapeText(line)}</p>`).join('')}</div>
      ${ended?`<div class="panel result-summary">本局 ${r.wins} 胜 ${r.losses} 负，获得 ${report.legendEarned||0} 传奇点。</div><button class="btn wide" data-act="home">查看档案 / 返回首页 →</button>`
        :final?`<div class="panel result-summary">主线十关完成！可以带当前阵容进入无尽，或结算本局。</div><div class="result-actions"><button class="btn dark" data-act="finish">本局结算</button><button class="btn" data-act="next">进入无尽 →</button></div>`
        :`<button class="btn wide" data-act="${won?'next':'retry'}">${won?'下一关整备':'整备重试'} →</button>`}`;
  }
  function renderProfile(){
    const p=game.profile;
    const discovered=new Set(p.discovered.map(C.identityOf));
    const starCatalog=`<div class="sectionhead"><h2>球星图鉴</h2><span>已收集 ${p.discovered.length} / ${C.STARS.length}</span></div><div class="catalog">${C.STARS.map(s=>`<span class="${tierClass[s.tier]} ${p.discovered.includes(s.id)?'unlocked':'locked'}">${p.discovered.includes(s.id)?s.name:'未发现球星'}</span>`).join('')}</div>`;
    const bondCatalog=`<div class="sectionhead"><h2>羁绊图鉴</h2><span>${C.SYNERGIES.length} 组</span></div><div class="profile-bond-catalog">${C.SYNERGIES.map(b=>{const count=b.ids.filter(id=>discovered.has(id)).length;return `<div class="profile-bond ${count===b.ids.length?'unlocked':''}"><strong>${b.name}<small>${count===b.ids.length?'已收集':`${count}/${b.ids.length}`}</small></strong><span>${b.ids.map(id=>C.BY_ID[id].name).join(' · ')}</span></div>`}).join('')}</div>`;
    els.profile.innerHTML=`<button class="inline-back" data-act="home">← 返回首页</button>
      <div class="profile-title-row"><div><div class="eyebrow">LEGACY · 局外成长</div><h1 class="title">我的传奇档案</h1></div><button class="profile-home" data-act="home">返回主页</button></div><p class="lead">每一局的表现都会计入档案。主线通关后可继续挑战无尽模式。</p>
      <div class="statusbar"><div class="statbox"><strong>${p.runs}</strong><small>已结算局数</small></div><div class="statbox"><strong>${p.bestStage}</strong><small>最佳主线关卡</small></div><div class="statbox"><strong class="goldtext">${p.legend}</strong><small>传奇点</small></div></div>
      <div class="sectionhead"><h2>生涯纪录</h2></div><div class="panel career-line"><span>累计获胜 <b>${p.wins}</b></span><span>最高无尽关卡 <b>${p.bestEndless}</b></span></div>
      <div class="profile-tabs" role="tablist"><button class="${profileTab==='stars'?'active':''}" data-act="profile-tab" data-id="stars">球星图鉴</button><button class="${profileTab==='bonds'?'active':''}" data-act="profile-tab" data-id="bonds">羁绊图鉴</button><i class="${profileTab}"></i></div>
      ${profileTab==='stars'?starCatalog:bondCatalog}
      <div class="sectionhead"><h2>后续开放</h2></div><div class="emptyline">传奇点永久升级与排行榜将在后续版本开放</div>`;
  }
  let modal=document.createElement('div');modal.id='game-modal';document.body.appendChild(modal);
  function renderPending(){
    const r=game.run,id=r?.pending;
    if(!id&&detailStar&&r){
      const s=C.BY_ID[detailStar],owned=new Set(Object.keys(r.owned).map(C.identityOf));
      if(!s){detailStar='';renderPending();return}
      const fits=[...C.ATTRS].sort((a,b)=>s.attrs[b]-s.attrs[a]).slice(0,3);
      const bonds=C.starSynergies(s.id);
      modal.className='game-modal open';
      modal.innerHTML=`<div class="modal-card player-detail ${tierClass[s.tier]}">
        <div class="modal-head detail-head"><div><span>${tierName[s.tier]} · 球员详情</span><h2>${s.name}</h2><small>${s.role} · ${s.talent}</small></div><button data-act="close-star-detail" aria-label="关闭">×</button></div>
        <div class="detail-stats">${C.ATTRS.map(attr=>`<div><span>${C.LABELS[attr]}</span><b>${s.attrs[attr]}</b></div>`).join('')}</div>
        <section class="detail-section"><span>专属天赋</span><h3>${s.talent}</h3><p>${s.talentEffect.description}。</p></section>
        <section class="detail-section"><span>位置适配</span><div class="fit-list">${fits.map(attr=>`<b>${C.LABELS[attr]} ${s.attrs[attr]}</b>`).join('')}</div></section>
        <section class="detail-section"><span>关联羁绊</span><div class="detail-bonds">${bonds.length?bonds.map(bond=>{const count=bond.ids.filter(player=>owned.has(player)).length,active=count===bond.ids.length;return `<div class="${active?'active':''}"><strong>${bond.name}<small>${active?'已激活':`${count}/${bond.ids.length}`}</small></strong><p>${bond.ids.map(player=>`<em class="${owned.has(player)?'owned':''}">${C.BY_ID[player].name}</em>`).join('')}</p><b>${bond.description}</b></div>`}).join(''):'<p>暂无关联羁绊</p>'}</div></section>
      </div>`;
      return;
    }
    if(!id&&showBonds&&r){
      const owned=new Set(Object.keys(r.owned).map(C.identityOf));
      const bonds=C.SYNERGIES.map((bond,index)=>({...bond,index,count:bond.ids.filter(player=>owned.has(player)).length})).sort((a,b)=>
        Number(b.count===b.ids.length)-Number(a.count===a.ids.length)||b.count-a.count||a.index-b.index);
      modal.className='game-modal open';
      const activeCount=bonds.filter(b=>b.count===b.ids.length).length;
      modal.innerHTML=`<div class="modal-card bonds-modal"><div class="modal-head"><h2>战术羁绊</h2><button data-act="close-bonds" aria-label="关闭">×</button></div><p>已激活 ${activeCount}/${bonds.length} · 已激活优先，其余按拥有球员数排序。</p><div class="bond-list">${bonds.map(b=>`<div class="bond-entry ${b.count===b.ids.length?'active':''}"><strong>${b.name}<small>${b.count}/${b.ids.length} · ${b.count===b.ids.length?'已激活':'未激活'}</small></strong><span>${b.ids.map(player=>`<em class="${owned.has(player)?'owned':''}">${C.BY_ID[player].name}</em>`).join('')}</span><b>${b.description}</b></div>`).join('')}</div></div>`;
      return;
    }
    if(!id){modal.className='game-modal';modal.innerHTML='';return}
    const s=C.BY_ID[id];modal.className='game-modal open';
    modal.innerHTML=`<div class="modal-card"><h2>备战席已满</h2><p>你选中了 <b>${s.name}</b>。选择一名备战球员替换并卖出，或出售新球星。</p>
      <div class="modal-list">${r.bench.map((old,i)=>`<button data-act="resolve" data-mode="replace" data-index="${i}">替换 ${C.BY_ID[old].name}</button>`).join('')}</div>
      <button class="btn dark wide" data-act="resolve" data-mode="sell">出售新球星，保留当前阵容</button></div>`;
  }
  function placeFromElement(element){
    if(!element||element.dataset.act!=='place')return null;
    return {kind:element.dataset.kind,key:element.dataset.kind==='bench'?Number(element.dataset.key):element.dataset.key};
  }
  function hasPlayer(run,place){return !!(place.kind==='slot'?run.slots[place.key]:run.bench[place.key])}
  let dragStart=null,dragGhost=null,dragTarget=null,suppressPlaceClick=false;
  function dropButtonAt(x,y){
    const element=document.elementFromPoint(x,y);
    return element?.closest('[data-act="place"]')||element?.closest('.bench-card')?.querySelector('[data-act="place"]')||null;
  }
  function clearDrag(){
    dragGhost?.remove();dragGhost=null;
    dragTarget?.classList.remove('drag-target');dragTarget=null;
    dragStart?.source?.classList.remove('drag-source');dragStart=null;
  }
  document.addEventListener('pointerdown',event=>{
    const button=event.target.closest('[data-act="place"]');
    if(screen!=='roster'||!button||!game.run||game.run.lastBattle)return;
    const place=placeFromElement(button);
    const source=button.closest('.slot,.bench-card');
    dragStart=hasPlayer(game.run,place)?{place,x:event.clientX,y:event.clientY,source,pointerId:event.pointerId,moved:false}:null;
  });
  document.addEventListener('pointermove',event=>{
    if(!dragStart||event.pointerId!==dragStart.pointerId)return;
    const distance=Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y);
    if(!dragStart.moved&&distance<8)return;
    if(!dragStart.moved){
      dragStart.moved=true;dragStart.source.classList.add('drag-source');
      dragGhost=dragStart.source.cloneNode(true);dragGhost.classList.add('drag-ghost');dragGhost.classList.remove('selected');
      dragGhost.style.width=dragStart.source.getBoundingClientRect().width+'px';document.body.appendChild(dragGhost);
    }
    dragGhost.style.left=event.clientX+'px';dragGhost.style.top=event.clientY+'px';
    const target=dropButtonAt(event.clientX,event.clientY),place=placeFromElement(target);
    const same=place&&place.kind===dragStart.place.kind&&place.key===dragStart.place.key;
    const targetCard=!same&&target?target.closest('.slot,.bench-card'):null;
    if(targetCard!==dragTarget){dragTarget?.classList.remove('drag-target');dragTarget=targetCard;dragTarget?.classList.add('drag-target')}
    event.preventDefault();
  });
  document.addEventListener('pointerup',event=>{
    if(!dragStart)return;
    const start=dragStart;
    if(!start.moved){clearDrag();return}
    suppressPlaceClick=true;setTimeout(()=>{suppressPlaceClick=false},500);
    const target=dropButtonAt(event.clientX,event.clientY);
    const place=placeFromElement(target);
    clearDrag();
    if(place&&C.swapPositions(game.run,start.place,place)){
      selectedPlace=null;save();renderRoster();top();notify('换位成功，融合属性已刷新');
    }
  });
  document.addEventListener('pointercancel',clearDrag);
  function handle(action,button){
    const r=game.run,id=button.dataset.id;
    if(action==='home'){go('home');return}
    if(action==='profile'){go('profile');return}
    if(action==='profile-tab'){profileTab=id==='bonds'?'bonds':'stars';renderProfile();return}
    if(action==='rules'){notify('流程：选天赋 → 招募六人 → 布阵 → 训练商店 → 单挑闯关');return}
    if(action==='new'){
      if(r&&!r.ended&&!window.confirm('开启新旅程会覆盖当前未完成的旅程。确定继续吗？'))return;
      talentOffer=[...C.TALENTS].sort(()=>Math.random()-.5).slice(0,3);selectedTalent=talentOffer[0].id;go('talent');return;
    }
    if(action==='continue'){if(!r||r.ended)return;go(r.lastBattle?'result':C.starterCount(r)<6?'recruit':'roster');return}
    if(action==='talent'){selectedTalent=id;renderTalent();return}
    if(action==='begin'){game.run=C.createRun(selectedTalent||talentOffer[0].id,Date.now(),{rarityBonus:game.profile.upgrades?.scouting||0});selectedPlace=null;selectedOffer='';strategy='collapse';save();go('recruit');return}
    if(action==='roster'){go('roster');return}
    if(action==='recruit'){if(!r||r.ended||r.free<=0&&r.cash<C.recruitCost(r))return;go('recruit');return}
    if(action==='shop'){go('shop');return}
    if(action==='duel'){if(C.starterCount(r)<6){notify('先招满六个能力槽');return}go('duel');return}
    if(action==='select-offer'){selectedOffer=id;renderRecruit();return}
    if(action==='star-detail'){detailStar=id;renderPending();return}
    if(action==='close-star-detail'){detailStar='';renderPending();return}
    if(action==='reroll'){if(C.starterCount(r)<6)return;if(!C.refreshOffer(r)){notify('刷新所需奖金不足');return}selectedOffer='';save();renderRecruit();top();return}
    if(action==='pick'){
      const answer=C.recruit(r,selectedOffer);
      if(!answer.ok){notify(answer.reason);return}
      game.profile.discovered=[...new Set([...game.profile.discovered,answer.star.id])];
      save();top();
      if(answer.kind==='pending'){renderPending();return}
      notify(answer.kind==='duplicate'?answer.star.name+' 已升星':answer.star.name+' 已加入'+(answer.kind==='bench'?'备战席':'首发'));
      selectedOffer='';selectedPlace=null;
      if(C.starterCount(r)<6&&r.free>0){C.makeOffer(r);save();renderRecruit()}else go('roster');
      return;
    }
    if(action==='resolve'){
      const mode=button.dataset.mode,index=Number(button.dataset.index);
      if(!C.resolvePending(r,mode,index))return;
      selectedPlace=null;save();notify(mode==='sell'?'新球星已出售':'备战席已替换');go('roster');return;
    }
    if(action==='sell-bench'){
      const index=Number(button.dataset.index),name=C.BY_ID[r.bench[index]]?.name,value=C.sellBench(r,index);
      if(!value)return;
      selectedPlace=null;save();renderRoster();top();notify(`${name} 已出售，获得 ${value} 奖金`);return;
    }
    if(action==='bonds'){showBonds=true;renderPending();return}
    if(action==='close-bonds'){showBonds=false;renderPending();return}
    if(action==='place'){
      const place=placeFromElement(button);
      if(!place||!r)return;
      const playerId=place.kind==='slot'?r.slots[place.key]:r.bench[place.key];
      if(playerId){detailStar=playerId;renderPending()}
      return;
    }
    if(action==='shop-tab'){shopTab=id;renderShop();return}
    if(action==='train'){if(C.train(r,id)){save();renderShop();top();notify('训练完成')}else notify('本关已训练、已满级或奖金不足');return}
    if(action==='buy-boost'){if(C.buyBoost(r,id)){save();renderShop();top();notify('赛前强化已生效')}else notify('奖金不足或强化栏已满');return}
    if(action==='buy-gear'){if(C.buyGear(r,id)){save();renderShop();top();notify('装备已加入阵容')}else notify('奖金不足或装备栏已满');return}
    if(action==='expand'){if(C.expandBench(r)){save();renderShop();top();notify('备战席容量 +1')}else notify('奖金不足或容量已达上限');return}
    if(action==='strategy'){strategy=id;renderDuel();return}
    if(action==='battle'){const report=C.battle(game,strategy);if(!report){notify('当前无法开始对战');return}save();go('result');return}
    if(action==='retry'){if(C.continueRun(game,'retry')){save();go('roster')}return}
    if(action==='next'){if(C.continueRun(game,'next')){selectedPlace=null;save();go('roster')}return}
    if(action==='finish'){if(C.continueRun(game,'finish')){save();renderResult()}return}
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-act]');if(!button||button.disabled)return;if(button.dataset.act==='place'&&suppressPlaceClick)return;handle(button.dataset.act,button)});
  async function init(){
    if(STORAGE.available()){
      try{const loaded=await STORAGE.load();game=restoreGame(loaded)}catch(_){notify('存档读取失败，本次从新旅程开始')}
    }
    go('home');
  }
  init();
})();

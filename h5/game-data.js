/* 第二版球星与羁绊数据。数值为游戏策划值，不代表真实比赛统计。 */
(function (root, factory) {
  'use strict';
  const data=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=data;
  root.SupFusionGameData=data;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  // 原始球探值保留八项输入；对外卡牌数据会统一折算为六项游戏属性。
  const RAW_STAR_ROWS = [
    ['curry','斯蒂芬·库里','S','PG','勇士','three',[96,91,82,94,50,72,71,60],'超远射程'],
    ['lebron','勒布朗·詹姆斯','S','SF','湖人','drive',[84,88,96,94,86,96,88,90],'全能统治'],
    ['kobe','科比·布莱恩特','S','SG','湖人','mid',[86,95,89,87,82,88,84,72],'关键杀手'],
    ['duncan','蒂姆·邓肯','S','PF','马刺','post',[52,88,71,69,94,93,96,96],'稳固根基'],
    ['kawhi','科怀·伦纳德','S','SF','快船','def',[86,89,85,80,77,89,97,87],'死亡缠绕'],
    ['irving','凯里·欧文','A','PG','独行侠','handle',[90,89,91,96,61,82,73,57],'脚踝终结'],
    ['durant','凯文·杜兰特','S','SF','太阳','mid',[92,97,86,84,85,94,84,79],'无解投射'],
    ['jokic','尼古拉·约基奇','S','C','掘金','post',[81,90,76,95,95,96,83,96],'中轴策应'],
    ['giannis','扬尼斯·阿德托昆博','S','PF','雄鹿','drive',[66,79,97,86,88,98,94,95],'禁区冲击'],
    ['shaq','沙奎尔·奥尼尔','S','C','湖人','inside',[30,70,83,71,97,99,91,99],'篮下巨兽'],
    ['jordan','迈克尔·乔丹','S','SG','公牛','mid',[82,97,97,92,88,97,96,85],'最后一投'],
    ['wade','德维恩·韦德','A','SG','热火','drive',[72,87,95,89,74,91,90,77],'闪电突破'],
    ['harden','詹姆斯·哈登','A','SG','快船','handle',[93,87,91,94,78,88,72,69],'节奏大师'],
    ['klay','克莱·汤普森','A','SG','独行侠','three',[95,86,77,75,62,81,86,71],'接球即投'],
    ['green','德雷蒙德·格林','B','PF','勇士','def',[75,74,71,84,82,80,93,89],'防线指挥'],
    ['holiday','朱·霍勒迪','B','PG','凯尔特人','def',[82,83,78,86,67,78,92,75],'后场铁闸'],
    ['white','德里克·怀特','B','G','凯尔特人','def',[82,81,77,83,63,78,88,70],'追身封盖'],
    ['lillard','达米安·利拉德','A','PG','雄鹿','three',[94,87,88,92,62,81,72,62],'超远决胜'],
    ['tatum','杰森·塔图姆','A','SF','凯尔特人','mid',[87,89,88,85,83,88,86,83],'锋线得分'],
    ['booker','德文·布克','A','SG','太阳','mid',[88,94,86,87,72,86,78,67],'中投连击'],
    ['embiid','乔尔·恩比德','A','C','76人','post',[79,86,79,74,93,96,89,95],'低位威慑'],
    ['davis','安东尼·戴维斯','A','PF','湖人','def',[74,82,83,72,88,94,96,95],'禁区屏障'],
    ['westbrook','拉塞尔·威斯布鲁克','B','PG','掘金','drive',[70,78,94,88,70,86,77,83],'全速冲锋'],
    ['paul','克里斯·保罗','A','PG','马刺','handle',[86,92,76,97,60,75,88,63],'精准掌控'],
    ['nash','史蒂夫·纳什','A','PG','太阳','handle',[91,92,78,98,55,79,68,62],'大师传球'],
    ['rodman','丹尼斯·罗德曼','B','PF','公牛','rebound',[45,63,75,62,77,78,92,99],'篮板狂人'],
    ['gobert','鲁迪·戈贝尔','B','C','森林狼','def',[35,59,61,58,78,89,96,97],'护框专家'],
    ['anunoby','OG·阿奴诺比','C','SF','尼克斯','def',[79,76,78,72,65,76,87,77],'侧翼防线'],
    ['caruso','亚历克斯·卡鲁索','C','G','雷霆','def',[76,73,76,80,58,73,88,70],'拼抢先锋'],
    ['lopez','布鲁克·洛佩兹','C','C','雄鹿','inside',[78,73,55,57,82,86,86,82],'高塔投射'],
    ['magic','埃尔文·约翰逊','S','PG','湖人','handle',[82,88,93,99,86,95,84,83],'魔术传球'],
    ['bird','拉里·伯德','S','SF','凯尔特人','mid',[93,96,82,91,91,92,87,92],'预言绝杀'],
    ['kareem','卡里姆·阿卜杜尔-贾巴尔','S','C','湖人','post',[38,92,78,79,99,99,94,97],'天勾'],
    ['hakeem','哈基姆·奥拉朱旺','S','C','火箭','def',[28,88,82,78,98,98,99,98],'梦幻脚步'],
    ['dirk','德克·诺维茨基','S','PF','独行侠','mid',[93,98,79,82,94,94,78,90],'金鸡独立'],
    ['garnett','凯文·加内特','S','PF','凯尔特人','def',[76,91,84,78,96,95,98,98],'全域协防'],
    ['pippen','斯科蒂·皮蓬','A','SF','公牛','def',[77,87,92,91,78,90,98,86],'锋线封锁'],
    ['rayallen','雷·阿伦','A','SG','凯尔特人','three',[96,89,80,83,60,82,77,64],'底角绝命'],
    ['pierce','保罗·皮尔斯','A','SF','凯尔特人','mid',[89,93,84,87,84,88,80,76],'真理单打'],
    ['iverson','阿伦·艾弗森','A','PG','76人','drive',[84,91,98,97,54,89,71,55],'变向风暴'],
    ['kidd','贾森·基德','A','PG','篮网','handle',[86,88,80,98,70,78,93,88],'全场视野'],
    ['malone','卡尔·马龙','A','PF','爵士','post',[32,88,84,73,97,96,88,95],'强硬终结'],
    ['stockton','约翰·斯托克顿','A','PG','爵士','handle',[87,89,75,99,55,72,91,60],'挡拆手术刀'],
    ['bosh','克里斯·波什','A','PF','热火','inside',[83,88,80,76,89,93,84,88],'空间内线'],
    ['parker','托尼·帕克','B','PG','马刺','handle',[72,92,94,95,55,88,73,55],'陀螺突破'],
    ['ginobili','马努·吉诺比利','B','SG','马刺','drive',[86,88,93,91,62,86,82,65],'欧洲步'],
    ['pau','保罗·加索尔','B','PF','湖人','post',[75,91,72,82,94,94,87,94],'高位策应'],
    ['benwallace','本·华莱士','B','C','活塞','rebound',[20,50,66,55,78,85,99,100],'禁区铁门'],
    ['mutombo','迪肯贝·穆托姆博','B','C','掘金','def',[15,45,50,48,75,88,99,98],'摇指封盖'],
    ['howard','德怀特·霍华德','A','C','魔术','inside',[35,62,88,67,90,99,96,99],'魔兽空接'],
    ['carter','文斯·卡特','A','SG','猛龙','drive',[88,91,97,88,72,95,76,70],'世纪扣篮'],
    ['melo','卡梅隆·安东尼','A','SF','掘金','mid',[83,96,88,84,91,91,72,72],'三威胁'],
    ['butler','吉米·巴特勒','A','SF','热火','def',[78,91,92,88,82,90,95,82],'硬仗模式'],
    ['george','保罗·乔治','A','SF','快船','three',[90,89,88,86,75,87,94,82],'攻防侧翼'],
    ['bowen','布鲁斯·鲍文','C','SF','马刺','def',[86,72,65,68,55,70,96,68],'贴身压迫'],
    ['battier','肖恩·巴蒂尔','C','SF','热火','def',[87,77,70,74,68,76,95,74],'遮眼防守'],
    ['horry','罗伯特·霍里','C','PF','湖人','three',[88,82,72,74,76,85,86,82],'大心脏'],
    ['chandler','泰森·钱德勒','B','C','独行侠','rebound',[10,45,65,50,76,91,94,98],'冠军护框'],
    ['korver','凯尔·科沃尔','C','SG','老鹰','three',[97,84,62,73,48,68,70,52],'定点神射'],
    ['artest','罗恩·阿泰斯特','B','SF','湖人','def',[77,82,83,80,85,88,98,84],'强硬锁防'],

    // 传奇异名卡：与基础球员共享羁绊身份，拥有更高面板与 5 星/5 级成长上限。
    ['king_lebron','皇帝·詹姆斯','L','SF','巅峰传奇','drive',[91,95,105,102,94,104,96,98],'君临全场','lebron'],
    ['air_jordan','飞人·乔丹','L','SG','巅峰传奇','mid',[89,106,106,99,95,105,104,92],'制空绝杀','jordan'],
    ['mamba_kobe','黑曼巴·科比','L','SG','巅峰传奇','mid',[93,105,98,96,91,97,94,80],'曼巴时刻','kobe'],
    ['chef_curry','厨神·库里','L','PG','巅峰传奇','three',[108,98,90,103,56,81,79,67],'引力领域','curry'],
    ['diesel_shaq','大鲨鱼·奥尼尔','L','C','巅峰传奇','inside',[35,77,91,78,106,110,99,108],'禁区粉碎','shaq'],
    ['showtime_magic','魔术师·约翰逊','L','PG','巅峰传奇','handle',[89,95,100,109,93,102,92,91],'表演时刻','magic'],
    ['big_ticket_garnett','狼王·加内特','L','PF','巅峰传奇','def',[82,98,91,85,103,102,108,108],'怒吼统治','garnett'],
    ['dream_hakeem','大梦·奥拉朱旺','L','C','巅峰传奇','def',[34,96,90,85,108,107,110,107],'梦幻迷宫','hakeem'],
    ['greek_giannis','希腊怪兽·字母哥','L','PF','巅峰传奇','drive',[73,86,109,94,96,110,104,104],'一人成军','giannis'],
    ['reaper_durant','死神·杜兰特','L','SF','巅峰传奇','mid',[101,108,94,92,93,103,91,86],'无差别终结','durant']
  ];

  const ATTRS=['three','mid','drive','handle','inside','def'];
  const LABELS={three:'三分',mid:'中投',drive:'突破',handle:'控球',inside:'篮下',def:'防守'};
  const TIER_RULES={
    C:{min:45,max:82,main:78,talent:2},
    B:{min:48,max:88,main:83,talent:2},
    A:{min:54,max:94,main:89,talent:3},
    S:{min:60,max:99,main:95,talent:4},
    L:{min:78,max:112,main:108,talent:5}
  };
  const BEST_MAP={post:'inside',inside:'inside',rebound:'def'};
  function scaleAttribute(value,tier){
    const rule=TIER_RULES[tier],inputMax=tier==='L'?110:100;
    const normalized=(Math.max(20,Math.min(inputMax,value))-20)/(inputMax-20);
    return Math.round(rule.min+normalized*(rule.max-rule.min));
  }
  const STAR_ROWS=RAW_STAR_ROWS.map(row=>{
    const raw=row[6],tier=row[2],best=BEST_MAP[row[5]]||row[5];
    const six=[raw[0],raw[1],raw[2],raw[3],Math.round(raw[4]*.45+raw[5]*.55),Math.round(raw[6]*.72+raw[7]*.28)]
      .map(value=>scaleAttribute(value,tier));
    const bestIndex=ATTRS.indexOf(best);
    six[bestIndex]=Math.max(six[bestIndex],TIER_RULES[tier].main);
    return [row[0],row[1],tier,row[3],row[4],best,six,row[7],row[8]||null];
  });
  // 名人堂与传奇的推荐属性按原始强弱排序后铺满目标区间，避免实际卡池只占到区间上半段。
  for(const tier of ['S','L']){
    const rule=TIER_RULES[tier],rows=STAR_ROWS.filter(row=>row[2]===tier).sort((a,b)=>
      a[6][ATTRS.indexOf(a[5])]-b[6][ATTRS.indexOf(b[5])]);
    rows.forEach((row,index)=>{
      row[6][ATTRS.indexOf(row[5])]=Math.round(rule.main+(rule.max-rule.main)*index/Math.max(1,rows.length-1));
    });
  }
  const TALENT_DETAILS=Object.fromEntries(STAR_ROWS.map(row=>{
    const attr=row[5],gain=TIER_RULES[row[2]].talent;
    return [row[0],{attr,gain,description:`安排在${LABELS[attr]}槽时，${LABELS[attr]}额外 +${gain}`}];
  }));
  function makeBond(id,name,ids,stats,extras={}){
    const effect={stats:{...stats},winCash:extras.winCash||0,stageCash:extras.stageCash||0,freeRecruit:extras.freeRecruit||0};
    const parts=Object.entries(stats).map(([key,value])=>`${LABELS[key]} +${value}`);
    if(effect.winCash)parts.push(`胜利奖金 +${effect.winCash}`);
    if(effect.stageCash)parts.push(`每关奖金 +${effect.stageCash}`);
    if(effect.freeRecruit)parts.push(`每关免费招募 +${effect.freeRecruit}`);
    const first=Object.entries(stats)[0]||['three',0];
    return {id,name,ids,attr:first[0],gain:first[1],effect,description:parts.join(' · ')};
  }
  const B=makeBond;
  const SYNERGIES = [
    // 24 组双人羁绊
    B('splash','水花兄弟',['curry','klay'],{three:6}),
    B('warrior_brain','勇士轴心',['curry','green'],{handle:4,def:3}),
    B('ok_combo','紫金OK',['kobe','shaq'],{inside:5,mid:3}),
    B('mamba_pau','冠军内外线',['kobe','pau'],{inside:4,mid:3}),
    B('bull_wings','公牛双翼',['jordan','pippen'],{def:4,drive:3}),
    B('heat_kings','热火双王',['lebron','wade'],{drive:5,inside:2}),
    B('cleveland_oath','克城之约',['lebron','irving'],{handle:4,drive:3}),
    B('laker_twin','湖人双核',['lebron','davis'],{inside:4,def:4}),
    B('thunder_duo','雷霆双少',['durant','westbrook'],{drive:4,mid:3}),
    B('phoenix_blades','太阳双刃',['durant','booker'],{mid:6}),
    B('spurs_engine','马刺基石',['duncan','parker'],{inside:4,handle:3}),
    B('silent_defense','沉默防线',['duncan','kawhi'],{def:6}),
    B('buck_champs','雄鹿冠军组',['giannis','holiday'],{drive:4,def:4}),
    B('buck_towers','密城双塔',['giannis','lopez'],{inside:4,def:3}),
    B('showtime','表演时刻',['magic','kareem'],{handle:4,inside:4}),
    B('green_heritage','绿衫传承',['bird','garnett'],{mid:4,def:4}),
    B('mavs_origin','达拉斯双星',['dirk','nash'],{mid:4,handle:4}),
    B('pick_roll','挡拆教科书',['stockton','malone'],{handle:5,inside:4}),
    B('truth_ticket','真理与狼王',['pierce','garnett'],{mid:4,def:4}),
    B('rocket_backcourt','火箭后场',['harden','paul'],{handle:5,three:3}),
    B('celtic_guards','绿军后场',['tatum','white'],{mid:4,def:3}),
    B('process_battle','费城硬仗',['embiid','butler'],{inside:4,def:4}),
    B('pure_shooters','纯粹射手',['rayallen','korver'],{three:7}),
    B('nets_flight','篮网飞翼',['kidd','carter'],{handle:4,drive:4}),

    // 9 组三人羁绊
    B('warrior_core','勇士王朝',['curry','klay','green'],{three:6,def:4},{winCash:1}),
    B('thunder_three','雷霆三少',['durant','westbrook','harden'],{drive:5,three:4},{winCash:1}),
    B('heat_big_three','南海岸三巨头',['lebron','wade','bosh'],{drive:5,inside:4},{stageCash:1}),
    B('spurs_big_three','圣城三驾马车',['duncan','parker','ginobili'],{inside:4,handle:4,def:3}),
    B('celtic_big_three','绿军三巨头',['pierce','garnett','rayallen'],{mid:4,three:4,def:3}),
    B('bull_triangle','公牛铁三角',['jordan','pippen','rodman'],{def:7,mid:3}),
    B('wing_lock','锋线封锁',['kawhi','george','anunoby'],{def:7,three:3}),
    B('sun_orbit','太阳轨道',['nash','booker','paul'],{handle:6,mid:4}),
    B('laker_clutch','紫金关键组',['shaq','kobe','horry'],{inside:5,mid:4},{winCash:1}),

    // 4 组四人羁绊
    B('no_fly_zone','禁飞区',['holiday','white','bowen','battier'],{def:10,three:4}),
    B('paint_guardians','护框议会',['hakeem','mutombo','gobert','benwallace'],{def:12}),
    B('scoring_generation','得分万花筒',['lillard','iverson','melo','carter'],{drive:7,mid:7,three:4}),
    B('champion_roles','冠军拼图',['horry','caruso','chandler','artest'],{def:9},{stageCash:2}),

    // 3 组五人羁绊
    B('center_hall','中锋圣殿',['shaq','kareem','embiid','jokic','howard'],{inside:12,def:6}),
    B('court_generals','球场指挥官',['magic','bird','kidd','stockton','korver'],{handle:10,three:7,mid:5},{stageCash:2}),
    B('mvp_summit','MVP之巅',['jordan','lebron','curry','durant','jokic'],{mid:6,drive:6,three:6,handle:6},{winCash:2})
  ];

  return {ATTRS,LABELS,TIER_RULES,STAR_ROWS,TALENT_DETAILS,SYNERGIES};
});

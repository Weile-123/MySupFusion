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
    // 第三版扩充球员：优先覆盖真实王朝、经典搭档、宿敌、选秀届与传承关系。
    ['tmac','特雷西·麦克格雷迪','A','SF','魔术','mid',[86,96,94,91,82,91,75,69],'干拔时刻'],
    ['doncic','卢卡·东契奇','S','PG','独行侠','handle',[90,94,91,99,88,94,79,88],'节奏掌控'],
    ['isiah','伊赛亚·托马斯','S','PG','活塞','handle',[84,92,94,98,62,87,86,58],'微笑刺客'],
    ['dumars','乔·杜马斯','A','SG','活塞','def',[87,88,82,88,65,82,96,66],'沉默锁链'],
    ['laimbeer','比尔·兰比尔','B','C','活塞','def',[77,73,55,66,88,89,94,94],'强硬禁区'],
    ['robinson','大卫·罗宾逊','S','C','马刺','def',[48,86,88,79,96,98,98,99],'海军上将'],
    ['ewing','帕特里克·尤因','S','C','尼克斯','inside',[46,90,80,72,96,98,95,97],'纽约支柱'],
    ['iguodala','安德烈·伊戈达拉','B','SF','勇士','def',[79,77,84,86,75,82,94,82],'死亡拼图'],
    ['harper','罗恩·哈珀','B','PG','公牛','def',[73,79,84,83,70,82,91,77],'高大后卫'],
    ['longley','卢克·朗利','C','C','公牛','inside',[28,65,48,60,82,87,82,86],'中路屏障'],
    ['fisher','德里克·费舍尔','B','PG','湖人','three',[88,80,68,82,54,72,82,60],'关键零点四'],
    ['fox','里克·福克斯','C','SF','湖人','def',[80,75,72,75,68,76,88,72],'侧翼粘合'],
    ['byron_scott','拜伦·斯科特','B','SG','湖人','three',[89,84,85,82,61,81,78,60],'快攻终结'],
    ['worthy','詹姆斯·沃西','A','SF','湖人','drive',[66,88,95,83,84,94,82,77],'大赛眼镜蛇'],
    ['ac_green','AC·格林','C','PF','湖人','def',[58,72,68,65,80,84,85,92],'铁人篮板'],
    ['griffin','布雷克·格里芬','A','PF','快船','inside',[72,83,94,80,88,97,76,90],'暴力起飞'],
    ['deandre','德安德烈·乔丹','B','C','快船','inside',[20,48,71,55,80,95,91,98],'空接终点'],
    ['mchale','凯文·麦克海尔','S','PF','凯尔特人','inside',[36,92,78,73,98,98,94,96],'低位万花筒'],
    ['parish','罗伯特·帕里什','A','C','凯尔特人','inside',[30,83,69,62,92,94,91,96],'酋长镇守'],
    ['love','凯文·乐福','A','PF','骑士','three',[88,85,68,80,89,88,76,96],'长传炮台'],
    ['reggie','雷吉·米勒','S','SG','步行者','three',[97,88,82,83,56,79,74,58],'米勒时刻'],
    ['amare','阿马雷·斯塔德迈尔','A','PF','太阳','inside',[58,85,95,72,88,98,73,88],'太阳风暴'],
    ['marion','肖恩·马里昂','A','SF','太阳','def',[76,75,89,77,82,89,95,94],'骇客全能'],
    ['murray','贾马尔·穆雷','A','PG','掘金','mid',[89,94,88,91,60,83,74,60],'季后赛升温'],
    ['aaron_gordon','阿隆·戈登','B','PF','掘金','inside',[74,77,91,74,82,93,88,91],'高空协防'],
    ['wilkins','多米尼克·威尔金斯','S','SF','老鹰','drive',[74,91,99,85,83,98,78,82],'人类电影精华'],
    ['wilt','威尔特·张伯伦','S','C','湖人','inside',[20,78,91,73,99,100,95,100],'百分神迹'],
    ['russell','比尔·拉塞尔','S','C','凯尔特人','def',[20,68,77,72,90,93,100,100],'冠军基石'],
    ['oscar','奥斯卡·罗伯特森','S','PG','雄鹿','handle',[82,93,91,98,84,92,86,92],'三双先驱'],
    ['west','杰里·韦斯特','S','SG','湖人','mid',[91,96,91,94,65,88,91,70],'标志原型'],
    ['baylor','埃尔金·贝勒','S','SF','湖人','drive',[69,91,97,87,86,96,80,87],'空中先驱'],
    ['moses','摩西·马龙','S','C','76人','inside',[22,78,76,67,96,99,91,100],'进攻篮板王'],
    ['barkley','查尔斯·巴克利','S','PF','太阳','inside',[69,88,92,86,92,98,84,98],'空中飞猪'],
    ['drexler','克莱德·德雷克斯勒','A','SG','开拓者','drive',[80,88,96,87,75,93,84,85],'滑翔机'],
    ['mullin','克里斯·穆林','A','SF','勇士','mid',[92,94,78,84,72,85,76,67],'左手神射'],
    ['payton','加里·佩顿','A','PG','超音速','def',[83,88,85,94,68,84,98,72],'手套压迫'],
    ['kemp','肖恩·坎普','A','PF','超音速','inside',[42,78,96,70,87,98,83,96],'雨人暴扣'],
    ['penny','安芬尼·哈达威','A','PG','魔术','handle',[83,90,93,97,76,90,84,74],'便士魔法'],
    ['grant_hill','格兰特·希尔','A','SF','活塞','drive',[78,90,96,92,82,92,87,89],'全能前锋'],
    ['yao','姚明','A','C','火箭','inside',[70,91,66,73,96,97,91,94],'长城天勾'],
    ['billups','昌西·比卢普斯','A','PG','活塞','handle',[89,88,82,96,66,82,93,68],'大心脏控卫'],
    ['rip','理查德·汉密尔顿','B','SG','活塞','mid',[84,91,83,81,59,84,82,60],'无球永动'],
    ['rasheed','拉希德·华莱士','A','PF','活塞','def',[82,86,73,78,91,90,94,92],'怒吼协防'],
    ['webber','克里斯·韦伯','A','PF','国王','handle',[74,91,84,92,94,94,84,94],'高位华章'],
    ['peja','佩贾·斯托贾科维奇','A','SF','国王','three',[96,90,72,78,68,82,73,65],'国王神射'],
    ['rondo','拉简·隆多','B','PG','凯尔特人','handle',[66,80,88,96,61,75,93,77],'季后赛指挥'],
    ['erving','朱利叶斯·欧文','S','SF','76人','drive',[73,91,99,88,88,98,87,91],'J博士飞行'],
    ['brunson','杰伦·布伦森','A','PG','尼克斯','mid',[86,94,91,94,63,85,79,59],'低重心脚步'],
    ['shai','谢伊·吉尔杰斯-亚历山大','S','SG','雷霆','drive',[85,95,98,96,76,94,93,76],'节奏切割'],
    ['edwards','安东尼·爱德华兹','A','SG','森林狼','drive',[86,89,98,90,74,95,88,83],'蚁人升空'],

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
    const parts=Object.entries(stats).map(([key,value])=>LABELS[key]+' +'+value);
    if(effect.winCash)parts.push('胜利奖金 +'+effect.winCash);
    if(effect.stageCash)parts.push('每关奖金 +'+effect.stageCash);
    if(effect.freeRecruit)parts.push('每关免费招募 +'+effect.freeRecruit);
    const first=Object.entries(stats)[0]||['three',0];
    return {id,name,ids,attr:first[0],gain:first[1],effect,chainId:extras.chainId||null,chainLevel:extras.chainLevel||0,description:parts.join(' · ')};
  }
  const B=makeBond;
  const SYNERGIES = [
    // 44 组双人羁绊：优先真实搭档、宿敌、传承与同队关系。
    B('splash','水花兄弟',['curry','klay'],{three:6,handle:1},{chainId:'warriors_death',chainLevel:1}),
    B('warrior_brain','勇士轴心',['curry','green'],{handle:4,def:3},{chainId:'warriors_death',chainLevel:1}),
    B('ok_combo','紫金OK',['kobe','shaq'],{inside:5,mid:3},{chainId:'ok_lakers',chainLevel:1}),
    B('mamba_pau','冠军内外线',['kobe','pau'],{inside:4,mid:3}),
    B('laker_twin','湖人双核',['lebron','davis'],{inside:4,def:3}),
    B('buck_champs','雄鹿冠军组',['giannis','holiday'],{drive:4,def:3}),
    B('celtic_guards','绿军双闸',['holiday','white'],{handle:3,def:4}),
    B('buck_stars','雄鹿双星',['lillard','giannis'],{three:4,drive:4}),
    B('phoenix_blades','太阳双刃',['durant','booker'],{mid:6,three:1}),
    B('process_battle','费城硬仗',['embiid','butler'],{inside:4,def:3}),
    B('wolves_core','狼群内外',['edwards','gobert'],{drive:4,def:3}),
    B('knicks_core','纽约双核',['anunoby','brunson'],{mid:3,def:4}),
    B('lake_show','湖人火花',['lebron','caruso'],{handle:3,def:4}),
    B('buck_towers','密城双塔',['giannis','lopez'],{inside:4,def:3}),
    B('pick_roll','挡拆教科书',['stockton','malone'],{handle:4,inside:4}),
    B('spurs_heritage','圣城锋线传承',['bowen','kawhi'],{three:3,def:5}),
    B('heat_shield','热火侧翼屏障',['lebron','battier'],{drive:3,def:4}),
    B('mavs_wall','达拉斯冠军内线',['dirk','chandler'],{inside:4,def:3}),
    B('cavs_arc','克城火力网',['lebron','korver'],{three:4,handle:3}),
    B('laker_tough','洛城硬仗',['kobe','artest'],{mid:3,def:4}),
    B('wallace_brothers','华莱士双塔',['benwallace','rasheed'],{inside:3,def:5}),
    B('sixers_final','费城总决赛双核',['iverson','mutombo'],{drive:4,def:4}),
    B('magic_heritage','魔术一号传承',['penny','howard'],{handle:4,inside:4}),
    B('buck_origin','雄鹿冠军起点',['oscar','kareem'],{handle:4,inside:4}),
    B('lake_pioneers','湖人远古双翼',['west','baylor'],{mid:4,drive:4}),
    B('philly_mentors','费城内线传承',['barkley','moses'],{inside:5,def:3}),
    B('rocket_reunion','休城老友',['drexler','hakeem'],{drive:4,def:4}),
    B('warrior_old_days','勇士旧梦',['mullin','webber'],{mid:4,handle:3}),
    B('sonics_duo','手套与雨人',['payton','kemp'],{handle:3,inside:4,def:2}),
    B('duke_wings','全能锋线传承',['grant_hill','tmac'],{mid:4,drive:4}),
    B('yao_tmac','姚麦组合',['yao','tmac'],{mid:4,inside:4}),
    B('pistons_backcourt','活塞后场双核',['billups','rip'],{handle:4,mid:4}),
    B('kings_duo','国王双核',['webber','peja'],{handle:4,three:4}),
    B('rondo_truth','波士顿新旧指挥',['rondo','pierce'],{handle:4,mid:3}),
    B('fo_fo_fo','费城冠军双核',['erving','moses'],{drive:4,inside:4}),
    B('thunder_mentor','雷霆师徒',['shai','paul'],{handle:4,drive:4}),
    B('showtime_pair','表演时刻',['magic','kareem'],{handle:4,inside:4},{chainId:'showtime_lakers',chainLevel:1}),
    B('mavs_origin','达拉斯双星',['dirk','nash'],{mid:4,handle:4}),
    B('magic_bird','魔鸟争霸',['magic','bird'],{handle:4,mid:4}),
    B('jordan_kobe','飞人传承',['jordan','kobe'],{mid:4,drive:4}),
    B('bad_boys_backcourt','坏孩子双枪',['isiah','dumars'],{handle:4,def:4},{chainId:'bad_boys',chainLevel:1}),
    B('finals_94','九四中锋决战',['hakeem','ewing'],{inside:4,def:4}),
    B('mavs_new_core','独行侠双核',['doncic','irving'],{handle:4,mid:4}),
    B('nets_flight','篮网飞翼',['kidd','carter'],{handle:4,drive:4}),

    // 17 组三人羁绊。
    B('thunder_three','雷霆三少',['durant','westbrook','harden'],{drive:5,three:4,handle:3},{winCash:1,chainId:'thunder_three',chainLevel:2}),
    B('heat_big_three','南海岸三巨头',['lebron','wade','bosh'],{drive:5,inside:4,def:3},{stageCash:1,chainId:'heat_big_three',chainLevel:2}),
    B('celtic_big_three','绿军三巨头',['pierce','garnett','rayallen'],{mid:4,three:4,def:5},{chainId:'celtic_2008',chainLevel:2}),
    B('bull_triangle','公牛铁三角',['jordan','pippen','rodman'],{def:6,mid:4,drive:3},{chainId:'bulls_dynasty',chainLevel:2}),
    B('gdp','GDP',['duncan','parker','ginobili'],{inside:4,handle:4,def:5}),
    B('nets_big_three','篮网三巨头',['durant','harden','irving'],{mid:4,three:4,handle:4},{winCash:1}),
    B('lob_city','空接之城',['paul','griffin','deandre'],{handle:4,drive:4,inside:5},{chainId:'lob_city',chainLevel:2}),
    B('celtic_dynasty','凯尔特人王朝',['bird','mchale','parish'],{mid:4,inside:5,def:5},{chainId:'celtic_80s',chainLevel:2}),
    B('ok3','OK3',['westbrook','george','melo'],{drive:4,mid:4,three:4}),
    B('mamba_students','曼巴门徒',['kobe','irving','tatum'],{mid:5,handle:4,drive:4}),
    B('cavs_big_three','骑士三巨头',['lebron','irving','love'],{drive:4,three:4,inside:4},{stageCash:1}),
    B('era_shooters','划时代射手',['reggie','rayallen','curry'],{three:8,mid:5}),
    B('seven_seconds','7秒进攻',['nash','amare','marion'],{handle:5,inside:4,def:3},{stageCash:1,chainId:'seven_seconds',chainLevel:2}),
    B('nuggets_core','掘金三核',['jokic','murray','aaron_gordon'],{handle:4,mid:4,inside:5}),
    B('scoring_kaleidoscope','万花筒',['kobe','melo','durant'],{mid:6,three:3,drive:4}),
    B('floor_generals','球场指挥官',['paul','kidd','nash'],{handle:7,mid:3,def:3}),
    B('violent_dunkers','暴力扣将',['wilkins','carter','griffin'],{drive:7,inside:6}),

    // 14 组四人羁绊。“香蕉船兄弟”替代错误的“03黄金一代”命名，保留用户指定成员。
    B('four_shooting_guards','四大分位',['kobe','tmac','carter','iverson'],{mid:6,drive:6,handle:4,three:4}),
    B('banana_boat','香蕉船兄弟',['lebron','wade','paul','melo'],{drive:5,handle:4,mid:3,inside:3},{stageCash:1}),
    B('draft_96','96黄金一代',['kobe','iverson','nash','rayallen'],{three:6,handle:5,drive:4,mid:4}),
    B('european_kings','欧洲天王',['dirk','pau','jokic','doncic'],{mid:6,handle:5,inside:5,three:4}),
    B('bad_boys','坏孩子军团',['isiah','dumars','laimbeer','rodman'],{def:8,handle:4,inside:4,mid:3},{chainId:'bad_boys',chainLevel:2}),
    B('four_centers','四大中锋',['hakeem','shaq','robinson','ewing'],{inside:8,def:8,mid:3}),
    B('four_great_shooters','四大神射',['curry','reggie','klay','peja'],{three:9,mid:6,handle:4}),
    B('spurs_pillars','圣城四柱',['duncan','kawhi','robinson','parker'],{def:8,inside:6,mid:3,handle:3}),
    B('versatile_forwards','全能大前锋',['giannis','garnett','barkley','lebron'],{inside:6,drive:5,def:6,handle:3}),
    B('lakers_generations','湖人四代核心',['magic','kareem','west','baylor'],{handle:5,inside:5,mid:5,drive:5}),
    B('celtics_pillars','绿军四代基石',['bird','russell','mchale','garnett'],{def:7,inside:6,mid:5,three:2}),
    B('scoring_legends','锋卫得分王',['jordan','wilkins','erving','durant'],{mid:5,drive:7,three:4,inside:4}),
    B('rhythm_creators','节奏掌控者',['shai','oscar','harden','doncic'],{handle:7,drive:6,mid:4,three:3}),
    B('paint_dominators','禁区统治者',['wilt','russell','moses','kareem'],{inside:9,def:8,mid:2}),

    // 5 组五人终局羁绊。
    B('death_lineup','死亡五小',['curry','klay','iguodala','durant','green'],{three:7,handle:5,def:6,mid:4},{winCash:1,chainId:'warriors_death',chainLevel:3}),
    B('bulls_dynasty','公牛王朝',['harper','jordan','pippen','rodman','longley'],{def:9,mid:6,drive:5,handle:4},{winCash:1,chainId:'bulls_dynasty',chainLevel:3}),
    B('ok_dynasty','OK王朝',['fisher','kobe','fox','horry','shaq'],{inside:8,mid:6,three:5,def:4},{winCash:1,chainId:'ok_lakers',chainLevel:3}),
    B('showtime_five','Showtime',['magic','byron_scott','worthy','ac_green','kareem'],{handle:8,inside:7,mid:5,drive:4},{stageCash:1,chainId:'showtime_lakers',chainLevel:3}),
    B('final_answer','最终答案',['magic','jordan','lebron','duncan','shaq'],{handle:5,mid:5,drive:5,inside:6,def:5},{winCash:1})
  ];
  return {ATTRS,LABELS,TIER_RULES,STAR_ROWS,TALENT_DETAILS,SYNERGIES};
});

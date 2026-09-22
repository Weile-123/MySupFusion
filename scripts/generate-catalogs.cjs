const fs = require('node:fs');
const path = require('node:path');
const D = require('../h5/game-data.js');

const tierName = { C: 'C', B: 'B', A: 'A', S: 'S', SSR: 'SSR' };
const csv = (rows, eol = '\n') => '\ufeff' + rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join(eol) + eol;
const outDir = path.join(__dirname, '..', 'docs', 'data');
fs.mkdirSync(outDir, { recursive: true });
function writeFileIfChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  fs.writeFileSync(file, content);
}

const players = D.STAR_ROWS.map(row => ({
  id: row[0], name: row[1], tier: tierName[row[2]], role: row[3], team: row[4], best: D.LABELS[row[5]],
  attrs: Object.fromEntries(D.ATTRS.map((attr, index) => [attr, row[6][index]])), talent: row[7], talentEffect: D.TALENT_DETAILS[row[0]].description, variantOf: row[8] || ''
}));
const byId = Object.fromEntries(players.map(player => [player.id, player]));
writeFileIfChanged(path.join(outDir, 'my-game-players.csv'), csv([
  ['ID', '球员', '等级', '位置', '球队/标签', '推荐槽位', '三分', '中投', '突破', '控球', '篮下', '防守', '专属天赋', '技能效果', 'SSR原型'],
  ...players.map(p => [p.id, p.name, p.tier, p.role, p.team, p.best, ...D.ATTRS.map(attr => p.attrs[attr]), p.talent, p.talentEffect, p.variantOf ? byId[p.variantOf].name : ''])
]));
const mdCell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const playerInfo = [
  '# 当前全部球员信息',
  '',
  '> 本表由正式游戏数据自动生成。A/B/C、S 与 SSR 技能均已接入正式游戏。',
  '',
  '| 球员 | 等级 | 位置 | 推荐槽位 | 三分 | 中投 | 突破 | 控球 | 篮下 | 防守 | 技能 | 技能效果 |',
  '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |',
  ...players.map(p => `| ${[p.name,p.tier,p.role,p.best,...D.ATTRS.map(attr=>p.attrs[attr]),p.talent,p.talentEffect].map(mdCell).join(' | ')} |`),
  ''
].join('\n');
writeFileIfChanged(path.join(outDir, 'current-player-information.md'), playerInfo);
writeFileIfChanged(path.join(outDir, 'my-game-bonds.csv'), csv([
  ['羁绊', '人数', '成员', '效果'],
  ...D.SYNERGIES.map(bond => [bond.name, bond.ids.length, bond.ids.map(id => byId[id].name).join('、'), bond.description])
]));

const referenceBond = ([name, effect, ...members]) => ({ name, effect, members });
const two = [
  ['卧龙凤雏','谋略 +9%','诸葛亮','庞统'],
  ['江东二乔','续战 +6%；每轮 +1 金','大乔','小乔'],
  ['虎卫双雄','猛攻 +7%；守备 +4%','典韦','许褚'],
  ['三顾茅庐','谋略 +4%','刘备','诸葛亮'],
  ['我们两个真强','猛攻 +5%；守备 +5%','赵云','刘禅'],
  ['衣钵相传','谋略 +5%','诸葛亮','姜维'],
  ['孔明伉俪','谋略 +3%；续战 +2%；每轮 +1 金','诸葛亮','黄月英'],
  ['小关张','猛攻 +3%','关兴','张苞'],
  ['老将争雄','猛攻 +3%','黄忠','严颜'],
  ['街亭得失','守备 +3%；谋略 +2%','王平','马谡'],
  ['夏侯双雄','猛攻 +4%；每轮 +1 金','夏侯惇','夏侯渊'],
  ['荀氏叔侄','谋略 +5%；每轮 +1 金','荀彧','荀攸'],
  ['合肥威震','统兵 +2%；猛攻 +4%；战胜额外 +1 金','张辽','乐进'],
  ['灭蜀双锋','统兵 +4%；谋略 +3%','邓艾','钟会'],
  ['魏宫托孤','统兵 +3%；谋略 +3%','司马懿','曹叡'],
  ['四友辅嗣','谋略 +5%；每轮 +1 金','司马懿','曹丕'],
  ['渭滨对垒','统兵 +4%；谋略 +5%','司马懿','诸葛亮'],
  ['街亭合围','统兵 +4%；守备 +4%','司马懿','张郃'],
  ['洛神赋影','谋略 +2%；续战 +1%','曹植','甄宓'],
  ['神亭酣战','猛攻 +5%','孙策','太史慈'],
  ['苦肉连环','谋略 +4%','周瑜','黄盖'],
  ['解怨同袍','猛攻 +4%','甘宁','凌统'],
  ['宣城救主','守备 +4%','孙权','周泰'],
  ['陆氏将略','谋略 +4%；守备 +3%；每轮 +1 金','陆逊','陆抗'],
  ['河北双雄','猛攻 +5%；战胜额外 +1 金','颜良','文丑'],
  ['河北谋臣','谋略 +5%；战胜额外 +1 金','田丰','沮授'],
  ['南中伉俪','猛攻 +3%；续战 +2%；每轮 +1 金','孟获','祝融夫人'],
  ['方外奇士','谋略 +2%；续战 +3%；每轮 +1 金','华佗','左慈'],
  ['黄巾鏖兵','统兵 +3%；猛攻 +2%','张角','皇甫嵩'],
  ['徐州相让','续战 +3%；每轮 +1 金','刘备','陶谦'],
  ['北海报恩','猛攻 +3%；续战 +1%','太史慈','孔融'],
  ['白马旧识','猛攻 +3%','赵云','公孙瓒'],
  ['温酒斩将','猛攻 +3%','关羽','华雄'],
  ['邺城死守','守备 +3%；战胜额外 +1 金','袁绍','审配'],
  ['乌巢夜谋','谋略 +4%；战胜额外 +1 金','曹操','许攸'],
  ['文姬归汉','续战 +3%；每轮 +1 金','曹操','蔡文姬'],
  ['相国谋主','谋略 +3%；战胜额外 +1 金','董卓','李儒'],
  ['刮骨疗毒','续战 +3%','关羽','华佗'],
  ['益州暗流','谋略 +3%；每轮 +1 金','法正','刘璋'],
  ['荆州宾主','续战 +2%；每轮 +1 金','刘表','伊籍'],
  ['陇右争锋','统兵 +3%；谋略 +3%；战胜额外 +1 金','姜维','邓艾'],
  ['定军山','猛攻 +4%；战胜额外 +1 金','黄忠','夏侯渊'],
  ['襄城死战','守备 +3%；猛攻 +2%；战胜额外 +1 金','马超','王异'],
  ['荆襄旧部','猛攻 +2%；续战 +1%；每轮 +1 金','廖化','周仓'],
  ['九品定制','谋略 +2%；续战 +2%；每轮 +1 金','陈群','曹丕'],
  ['山越经略','统兵 +2%；续战 +2%','孙权','全琮'],
  ['袁氏兄弟','续战 +2%','袁绍','袁术'],
  ['汉中归附','续战 +2%','曹操','张鲁'],
  ['帝国双璧','猛攻 +9%','卫青','霍去病'],
  ['封狼居胥','猛攻 +6%；每次胜利 +2 金','刘彻','霍去病'],
  ['北击匈奴','统兵 +6%；续战 +4%','刘彻','卫青'],
  ['秦灭六国','全阶段 +5%','白起','王翦']
].map(referenceBond);
const three = [
  ['桃园结义','全阶段 +10%；激活后每 2 场胜利 +1 军心（可突破上限）','刘备','关羽','张飞'],
  ['元从旧部','续战 +5%；每轮 +2 金','刘备','麋竺','简雍'],
  ['荆州故交','谋略 +4%；续战 +3%；每轮 +2 金','刘备','徐庶','伊籍'],
  ['关氏部曲','猛攻 +5%；守备 +4%；每轮 +1 金','关羽','关平','周仓'],
  ['北伐中坚','统兵 +5%；猛攻 +4%；战胜额外 +1 金','魏延','姜维','王平'],
  ['西凉马氏','猛攻 +7%；统兵 +3%','马超','马岱','马腾'],
  ['白帝托孤','谋略 +4%；续战 +5%；每轮 +1 金','刘备','诸葛亮','刘禅'],
  ['魏室三代','统兵 +7%；续战 +4%；每轮 +1 金','曹操','曹丕','曹叡'],
  ['铜雀文华','谋略 +4%；续战 +3%；战胜额外 +1 金','曹丕','曹植','杨修'],
  ['江东三世','全阶段 +7%','孙坚','孙策','孙权'],
  ['江东宿将','守备 +7%；战胜额外 +1 金','程普','黄盖','韩当'],
  ['江表后劲','守备 +5%；猛攻 +3%；每轮 +1 金','丁奉','徐盛','朱然'],
  ['下邳孤城','猛攻 +7%；守备 +5%','吕布','高顺','陈宫'],
  ['辕门射戟','统兵 +4%；续战 +3%','刘备','吕布','纪灵'],
  ['宛城旧恨','谋略 +5%；守备 +4%','曹操','贾诩','典韦'],
  ['水淹七军','猛攻 +5%；谋略 +4%','关羽','于禁','庞德'],
  ['夷陵争锋','谋略 +5%；守备 +4%','刘备','陆逊','朱然']
].map(referenceBond);
const four = [
  ['东吴四英杰','谋略 +18%；续战 +11%；每轮 +3 金','周瑜','陆逊','鲁肃','吕蒙'],
  ['蜀汉四相','谋略 +13%；续战 +9%；每轮 +1 免费招募','诸葛亮','蒋琬','费祎','董允'],
  ['曹魏屏藩','守备 +11%；续战 +5%','曹仁','文聘','满宠','曹洪'],
  ['江东股肱','谋略 +10%；续战 +8%','张昭','诸葛瑾','顾雍','步骘'],
  ['白衣渡江','谋略 +13%；猛攻 +7%','陆逊','吕蒙','潘璋','朱然'],
  ['连环计','谋略 +15%；战胜额外 +2 金','吕布','董卓','貂蝉','王允']
].map(referenceBond);
const five = [
  ['五虎上将','猛攻 +24%；统兵 +12%；战胜额外 +2 金','关羽','张飞','赵云','马超','黄忠'],
  ['五子良将','统兵 +20%；守备 +14%；每轮 +5 金','张辽','徐晃','张郃','于禁','乐进'],
  ['魏武谋臣','谋略 +22%；每轮 +2 免费招募','郭嘉','荀彧','贾诩','荀攸','程昱'],
  ['赤壁风云','谋略 +20%；续战 +8%；每轮 +4 金；战胜额外 +3 金','诸葛亮','曹操','周瑜','鲁肃','黄盖'],
  ['官渡决胜','谋略 +16%；统兵 +8%；每轮 +4 金','曹操','郭嘉','袁绍','田丰','沮授']
].map(referenceBond);
const referenceBonds = [...two, ...three, ...four, ...five];
const roleMap = new Map();
for (const bond of referenceBonds) for (const member of bond.members) {
  if (!roleMap.has(member)) roleMap.set(member, []);
  roleMap.get(member).push(bond.name);
}
writeFileIfChanged(path.join(outDir, 'three-kingdoms-bonds.csv'), csv([
  ['羁绊', '人数', '成员', '效果', '截图覆盖情况'],
  ...referenceBonds.map(bond => [bond.name, bond.members.length, bond.members.join('、'), bond.effect, '12 张总览截图可辨认'])
]));
writeFileIfChanged(path.join(outDir, 'three-kingdoms-characters.csv'), csv([
  ['角色', '截图中关联羁绊数', '截图中关联羁绊'],
  ...[...roleMap.entries()].sort((a,b) => b[1].length-a[1].length || a[0].localeCompare(b[0], 'zh-CN')).map(([name,bonds]) => [name,bonds.length,bonds.join('、')])
]));

const tierSummary = ['C','B','A','S','SSR'].map(tier => {
  const list = players.filter(p => p.tier === tierName[tier]);
  const scores = list.map(p => p.attrs[D.ATTRS.find(attr => D.LABELS[attr] === p.best)]);
  return `| ${tierName[tier]} | ${list.length} | ${Math.min(...scores)}–${Math.max(...scores)} |`;
}).join('\n');
const md = `# 球员与羁绊数据总表\n\n本页由 \`scripts/generate-catalogs.cjs\` 从正式游戏数据生成。CSV 使用 UTF-8 BOM，可直接用 Excel 打开和筛选。\n\n## 当前游戏\n\n| 等级 | 卡牌数 | 推荐属性分布 |\n| --- | ---: | ---: |\n${tierSummary}\n\n- [全部球员信息（Markdown）](data/current-player-information.md)\n- [全部球员信息（CSV）](data/my-game-players.csv)\n- [全部羁绊、成员与效果](data/my-game-bonds.csv)\n\n当前共 ${players.length} 张卡（${players.filter(p=>!p.variantOf).length} 名基础球员、${players.filter(p=>p.variantOf).length} 张 SSR 异名卡）和 ${D.SYNERGIES.length} 组羁绊。\n\n## 《三国群雄十策》截图对照\n\n- [截图角色与其关联羁绊](data/three-kingdoms-characters.csv)\n- [截图羁绊、成员与完整效果](data/three-kingdoms-bonds.csv)\n\n12 张总览截图可以辨认 52 组双人、17 组三人、6 组四人和 5 组五人羁绊，共 ${referenceBonds.length} 组、${roleMap.size} 名去重角色，并记录全部可见效果。截图没有展示普通角色的完整属性，角色表只记录姓名及羁绊关系。\n`;
writeFileIfChanged(path.join(__dirname, '..', 'docs', 'player-and-bond-catalog.md'), md);
console.log(`Generated ${players.length} cards, ${D.SYNERGIES.length} game bonds, ${referenceBonds.length} reference bonds, ${roleMap.size} reference characters.`);

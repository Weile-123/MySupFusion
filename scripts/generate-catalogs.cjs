const fs = require('node:fs');
const path = require('node:path');
const D = require('../h5/game-data.js');

const tierName = { C: 'C', B: 'B', A: 'A', S: 'S', L: 'SR' };
const csv = (rows, eol = '\n') => '\ufeff' + rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join(eol) + eol;
const outDir = path.join(__dirname, '..', 'docs', 'data');
fs.mkdirSync(outDir, { recursive: true });
function writeFileIfChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  fs.writeFileSync(file, content);
}

const players = D.STAR_ROWS.map(row => ({
  id: row[0], name: row[1], tier: tierName[row[2]], role: row[3], team: row[4], best: D.LABELS[row[5]],
  attrs: Object.fromEntries(D.ATTRS.map((attr, index) => [attr, row[6][index]])), talent: row[7], variantOf: row[8] || ''
}));
const byId = Object.fromEntries(players.map(player => [player.id, player]));
writeFileIfChanged(path.join(outDir, 'my-game-players.csv'), csv([
  ['ID', '球员', '等级', '位置', '球队/标签', '推荐槽位', '三分', '中投', '突破', '控球', '篮下', '防守', '专属天赋', 'SR原型'],
  ...players.map(p => [p.id, p.name, p.tier, p.role, p.team, p.best, ...D.ATTRS.map(attr => p.attrs[attr]), p.talent, p.variantOf ? byId[p.variantOf].name : ''])
]));
writeFileIfChanged(path.join(outDir, 'my-game-bonds.csv'), csv([
  ['羁绊', '人数', '成员', '效果'],
  ...D.SYNERGIES.map(bond => [bond.name, bond.ids.length, bond.ids.map(id => byId[id].name).join('、'), bond.description])
]));

const two = [
  ['卧龙凤雏','诸葛亮','庞统'],['江东二乔','大乔','小乔'],['虎卫双雄','典韦','许褚'],['三顾茅庐','刘备','诸葛亮'],['我们两个真强','赵云','刘禅'],['衣钵相传','诸葛亮','姜维'],['孔明伉俪','诸葛亮','黄月英'],['小关张','关兴','张苞'],['老将争雄','黄忠','严颜'],['街亭得失','王平','马谡'],['夏侯双雄','夏侯惇','夏侯渊'],['荀氏叔侄','荀彧','荀攸'],['合肥威震','张辽','乐进'],['灭蜀双锋','邓艾','钟会'],['魏宫托孤','司马懿','曹叡'],['四友辅嗣','司马懿','曹丕'],['渭滨对垒','司马懿','诸葛亮'],['街亭合围','司马懿','张郃'],['洛神赋影','曹植','甄宓'],['神亭酣战','孙策','太史慈'],['苦肉连环','周瑜','黄盖'],['解怨同袍','甘宁','凌统'],['宣城救主','孙权','周泰'],['陆氏将略','陆逊','陆抗'],['河北双雄','颜良','文丑'],['河北谋臣','田丰','沮授'],['南中伉俪','孟获','祝融夫人'],['方外奇士','华佗','左慈'],['黄巾鏖兵','张角','皇甫嵩'],['徐州相让','刘备','陶谦'],['北海报恩','太史慈','孔融'],['白马旧识','赵云','公孙瓒'],['温酒斩将','关羽','华雄'],['邺城死守','袁绍','审配'],['乌巢夜谋','曹操','许攸'],['文姬归汉','曹操','蔡文姬'],['相国谋主','董卓','李儒'],['刮骨疗毒','关羽','华佗'],['益州暗流','法正','刘璋'],['荆州宾主','刘表','伊籍'],['陇右争锋','姜维','邓艾'],['定军山','黄忠','夏侯渊'],['襄城死战','马超','王异'],['荆襄旧部','廖化','周仓'],['九品定制','陈群','曹丕'],['山越经略','孙权','全琮'],['袁氏兄弟','袁绍','袁术'],['汉中归附','曹操','张鲁']
].map(([name,...members]) => ({ name, members }));
const three = [
  ['桃园结义','刘备','关羽','张飞'],['元从旧部','刘备','麋竺','简雍'],['荆州故交','刘备','徐庶','伊籍'],['关氏部曲','关羽','关平','周仓'],['北伐中坚','魏延','姜维','王平'],['西凉马氏','马超','马岱','马腾'],['白帝托孤','刘备','诸葛亮','刘禅'],['魏室三代','曹操','曹丕','曹叡'],['铜雀文华','曹丕','曹植','杨修'],['江东三世','孙坚','孙策','孙权'],['江东宿将','程普','黄盖','韩当'],['江表后劲','丁奉','徐盛','朱然'],['下邳孤城','吕布','高顺','陈宫'],['辕门射戟','刘备','吕布','纪灵'],['宛城旧恨','曹操','贾诩','典韦'],['水淹七军','关羽','于禁','庞德'],['夷陵争锋','刘备','陆逊','朱然']
].map(([name,...members]) => ({ name, members }));
const four = [
  ['东吴四英杰','周瑜','陆逊','鲁肃','吕蒙'],['蜀汉四相','诸葛亮','蒋琬','费祎','董允'],['曹魏屏藩','曹仁','文聘','满宠','曹洪'],['江东股肱','张昭','诸葛瑾','顾雍','步骘'],['白衣渡江','陆逊','吕蒙','潘璋','朱然'],['连环计','吕布','董卓','貂蝉','王允']
].map(([name,...members]) => ({ name, members }));
const five = [
  ['五虎上将','关羽','张飞','赵云','马超','黄忠'],['五子良将','张辽','徐晃','张郃','于禁','乐进'],['魏武谋臣','郭嘉','荀彧','贾诩','荀攸','程昱'],['赤壁风云','诸葛亮','曹操','周瑜','鲁肃','黄盖'],['官渡决胜','曹操','郭嘉','袁绍','田丰','沮授']
].map(([name,...members]) => ({ name, members }));
const referenceBonds = [...two, ...three, ...four, ...five];
const roleMap = new Map();
for (const bond of referenceBonds) for (const member of bond.members) {
  if (!roleMap.has(member)) roleMap.set(member, []);
  roleMap.get(member).push(bond.name);
}
writeFileIfChanged(path.join(outDir, 'three-kingdoms-bonds.csv'), csv([
  ['羁绊', '人数', '成员', '截图覆盖情况'],
  ...referenceBonds.map(bond => [bond.name, bond.members.length, bond.members.join('、'), bond.members.length === 2 ? '截图可辨认；双人羁绊另有3组未出现在截图范围内' : '截图可辨认'])
], '\r\n'));
writeFileIfChanged(path.join(outDir, 'three-kingdoms-characters.csv'), csv([
  ['角色', '截图中关联羁绊数', '截图中关联羁绊'],
  ...[...roleMap.entries()].sort((a,b) => b[1].length-a[1].length || a[0].localeCompare(b[0], 'zh-CN')).map(([name,bonds]) => [name,bonds.length,bonds.join('、')])
], '\r\n'));

const tierSummary = ['C','B','A','S','L'].map(tier => {
  const list = players.filter(p => p.tier === tierName[tier]);
  const scores = list.map(p => p.attrs[D.ATTRS.find(attr => D.LABELS[attr] === p.best)]);
  return `| ${tierName[tier]} | ${list.length} | ${Math.min(...scores)}–${Math.max(...scores)} |`;
}).join('\n');
const md = `# 球员与羁绊数据总表\n\n本页由 \`scripts/generate-catalogs.cjs\` 从正式游戏数据生成。CSV 使用 UTF-8 BOM，可直接用 Excel 打开和筛选。\n\n## 当前游戏\n\n| 等级 | 卡牌数 | 推荐属性分布 |\n| --- | ---: | ---: |\n${tierSummary}\n\n- [全部球员、等级与六项属性](data/my-game-players.csv)\n- [全部羁绊、成员与效果](data/my-game-bonds.csv)\n\n当前共 ${players.length} 张卡（${players.filter(p=>!p.variantOf).length} 名基础球员、${players.filter(p=>p.variantOf).length} 张 SR 异名卡）和 ${D.SYNERGIES.length} 组羁绊。\n\n## 《三国群雄十策》截图对照\n\n- [截图角色与其关联羁绊](data/three-kingdoms-characters.csv)\n- [截图羁绊与成员](data/three-kingdoms-bonds.csv)\n\n五张截图可以完整辨认 17 组三人、6 组四人、5 组五人羁绊，以及 48/51 组双人羁绊，共 ${referenceBonds.length} 组、${roleMap.size} 名去重角色。双人羁绊最后 3 组未出现在截图可见范围内，因此表中不猜测名称和成员。截图没有展示普通角色等级和属性，角色表只记录姓名及羁绊关系。\n`;
writeFileIfChanged(path.join(__dirname, '..', 'docs', 'player-and-bond-catalog.md'), md);
console.log(`Generated ${players.length} cards, ${D.SYNERGIES.length} game bonds, ${referenceBonds.length} reference bonds, ${roleMap.size} reference characters.`);

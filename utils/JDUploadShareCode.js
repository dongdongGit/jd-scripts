const jd_helpers = require('./JDHelpers');
const fs = require('fs');

let shareCodesByType = {
  bean: [],
  cash: [],
  farm: [],
  health: [],
  pet: [],
  factory: [],
  sgmh: [],
  jxfactory: [],
};

!(async () => {
  configPath = '../logs/sharecodeCollection.log';

  if (!(await fs.existsSync(configPath))) {
    console.log(`sharecodeCollection.log 文件不存在\n`);
    return;
  }

  const content = await fs.readFileSync(configPath, 'utf8');
  shareCodes = content
    .split('\n')
    .flatMap((shareCode) => {
      if (shareCode != '') {
        data = shareCode.split(' ');
        return {
          type: data[2],
          code: data[3],
        };
      }
    })
    .filter((item) => typeof item != 'undefined');

  shareCodes.map((item) => {
    type = getType(item)
    if (type != '') {
      shareCodesByType[type].push(item.code)
    }
  });

  sharCodesKeys = Object.keys(shareCodesByType);
  sharCodesKeys.map((key) => {
    shareCodesByType[key] = new Set(shareCodesByType[key]);
    Object.values(shareCodesByType[key]).map((k, v) => {jd_helpers.uploadShareCode(k, v)})
  });
})();


function getType(item) {
  relationships = {
    bean: '京东种豆得豆',
    cash: '签到领现金',
    farm: '东东农场',
    factory: '东东工厂',
    health: '东东健康社区',
    pet: '东东萌宠',
    sgmh: '闪购盲盒',
    jxfactory: '京喜工厂',
  };
  type = '';

  for (let [k, v] of Object.entries(relationships)) {
    if (item.type.includes(v)) {
      type = k;
      break;
    }
  }

  return type;
}
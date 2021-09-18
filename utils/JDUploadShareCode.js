const axios = require('axios');
const fs = require('fs');

!(async () => {
  const relation = {
    bean: '京东种豆得豆',
    cash: '签到领现金',
    farm: '东东农场',
    factory: '东东工厂',
    health: '东东健康社区',
    pet: '东东萌宠',
    sgmh: '闪购盲盒',
    jxfactory: '京喜工厂',
  };
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

  shareCodes.map();
})();

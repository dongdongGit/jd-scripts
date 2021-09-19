const axios = require("axios")
const fs = require('fs');

!(async () => {
  let res = await api('https://prodev.m.jd.com/mall/active/2tZssTgnQsiUqhmg5ooLSHY9XSeN/index.html')
  let file = 'https://storage.360buyimg.com/' + res.match(/htmlSourceUrl":"([^"]*)/)[1]
  res = await api(file)
  file = 'https:' + res.match(/src="([^"]*)/)[1]
  res = await api(file)
  invokeKey = res.match(/h=n\(\d+\),v="([^"]*)/)[1]
  console.log('invokeKey:', invokeKey);
  configPath = './config.js';

  if (!(await fs.existsSync(configPath))) {
    console.log(`config.js 文件不存在，停止更新invokeKey\n`);
    return;
  }

  const content = await fs.readFileSync(configPath, 'utf8');

  console.log(`开始替换变量`);
  let newContent = content.replace(/invokeKey:(\s)*['"][a-zA-Z\d].*['"]/, `invokeKey:$1'${invokeKey}'`);
  try {
    await fs.writeFileSync(configPath, newContent, 'utf8');
    console.log('替换变量完毕');
  } catch (e) {
    console.log('京东宠汪汪invokeKey写入文件异常:' + e);
  }
})()

async function api(url) {
  let {data} = await axios.get(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
    }
  })
  return data
}
/*
京东多合一签到,自用,可N个京东账号
活动入口：各处的签到汇总
Node.JS专用
5 0,17 * * * jd_bean_sign.js
IOS软件用户请使用 https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js
更新时间：2021-6-18
推送通知默认简洁模式(多账号只发送一次)。如需详细通知，设置环境变量 JD_BEAN_SIGN_NOTIFY_SIMPLE 为false即可(N账号推送N次通知)。
Modified From github https://github.com/ruicky/jd_sign_bot
 */

const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东多合一签到');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const exec = require('child_process').execSync;
const fs = require('fs');
const download = require('download');
let resultPath = './result.txt';
let JD_DailyBonusPath = './utils/JD_DailyBonus.js';
let outPutUrl = './utils';
let NodeSet = 'CookieSet.json';
let cookiesArr = [],
  cookie = '',
  allMessage = '',
  jrBodyArr = [],
  jrBody = '';

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_BEAN_SIGN_BODY) {
    if (process.env.JD_BEAN_SIGN_BODY.indexOf('&') > -1) {
      jrBodyArr = process.env.JD_BEAN_SIGN_BODY.split('&');
    } else if (process.env.JD_BEAN_SIGN_BODY.indexOf('\n') > -1) {
      jrBodyArr = process.env.JD_BEAN_SIGN_BODY.split('\n');
    } else {
      jrBodyArr = [process.env.JD_BEAN_SIGN_BODY];
    }
  }
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE = process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE ? process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE : 'true';
  await requireConfig();
  // 下载最新代码
  // await downFile();
  if (!(await fs.existsSync(JD_DailyBonusPath))) {
    console.log(`\nJD_DailyBonus.js 文件不存在，停止执行${$.name}\n`);
    await notify.sendNotify($.name, `本次执行${$.name}失败，JD_DailyBonus.js 文件下载异常，详情请查看日志`);
    return;
  }
  const content = await fs.readFileSync(JD_DailyBonusPath, 'utf8');
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.nickName = '';
      $.isLogin = true;
      await $.totalBean();
      console.log(`*****************开始京东账号${$.index} ${$.nickName || $.UserName}京豆签到*******************\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      jrBody = '';
      if (jrBodyArr && jrBodyArr.length) {
        for (let key in Object.keys(jrBodyArr)) {
          let vo = JSON.parse(jrBodyArr[key]);
          if (decodeURIComponent(vo.pin) == $.UserName) {
            jrBody = vo.body || '';
          }
        }
      } else {
        jrBody = '';
      }
      await changeFile(content);
      await execSign();
    }
  }
  //await deleteFile(JD_DailyBonusPath);//删除下载的JD_DailyBonus.js文件
  if ($.isNode() && allMessage && process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE === 'true') {
    $.msg($.name, '', allMessage);
    //await notify.sendNotify($.name, allMessage)
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());
async function execSign() {
  console.log(`\n开始执行 ${$.name} 签到，请稍等...\n`);
  try {
    // if (notify.SCKEY || notify.BARK_PUSH || notify.DD_BOT_TOKEN || (notify.TG_BOT_TOKEN && notify.TG_USER_ID) || notify.IGOT_PUSH_KEY || notify.QQ_SKEY) {
    //   await exec(`${process.execPath} ${JD_DailyBonusPath} >> ${resultPath}`);
    //   const notifyContent = await fs.readFileSync(resultPath, "utf8");
    //   console.log(`👇👇👇👇👇👇👇👇👇👇👇LOG记录👇👇👇👇👇👇👇👇👇👇👇\n${notifyContent}\n👆👆👆👆👆👆👆👆👆LOG记录👆👆👆👆👆👆👆👆👆👆👆`);
    // } else {
    //   console.log('没有提供通知推送，则打印脚本执行日志')
    //   await exec(`${process.execPath} ${JD_DailyBonusPath}`, { stdio: "inherit" });
    // }
    await exec(`${process.execPath} ${JD_DailyBonusPath} >> ${resultPath}`);
    const notifyContent = await fs.readFileSync(resultPath, 'utf8');
    console.error(`👇👇👇👇👇👇👇👇👇👇👇签到详情👇👇👇👇👇👇👇👇👇👇👇\n${notifyContent}\n👆👆👆👆👆👆👆👆👆签到详情👆👆👆👆👆👆👆👆👆👆👆`);
    // await exec("node JD_DailyBonus.js", { stdio: "inherit" });
    // console.log('执行完毕', new Date(new Date().getTime() + 8 * 3600000).toLocaleDateString())
    //发送通知
    let BarkContent = '';
    if (fs.existsSync(resultPath)) {
      const barkContentStart = notifyContent.indexOf('【签到概览】');
      const barkContentEnd = notifyContent.length;
      if (process.env.JD_BEAN_SIGN_STOP_NOTIFY !== 'true') {
        if (process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE === 'true') {
          if (barkContentStart > -1 && barkContentEnd > -1) {
            BarkContent = notifyContent.substring(barkContentStart, barkContentEnd);
          }
          BarkContent = BarkContent.split('\n\n')[0];
        } else {
          if (barkContentStart > -1 && barkContentEnd > -1) {
            BarkContent = notifyContent.substring(barkContentStart, barkContentEnd);
          }
        }
      }
    }
    //不管哪个时区,这里得到的都是北京时间的时间戳;
    const UTC8 = new Date().getTime() + new Date().getTimezoneOffset() * 60000 + 28800000;
    $.beanSignTime = new Date(UTC8).toLocaleString('zh', { hour12: false });
    //console.log(`脚本执行完毕时间：${$.beanSignTime}`)
    if (BarkContent) {
      allMessage += `【京东号 ${$.index}】: ${$.nickName || $.UserName}\n【签到时间】:  ${$.beanSignTime}\n${BarkContent}${$.index !== cookiesArr.length ? '\n\n' : ''}`;
      if (!process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE || (process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE && process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE !== 'true')) {
        await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}`, `【签到号 ${$.index}】: ${$.nickName || $.UserName}\n【签到时间】:  ${$.beanSignTime}\n${BarkContent}`);
      }
    }
    //运行完成后，删除下载的文件
    await deleteFile(resultPath); //删除result.txt
    await deleteFile('./utils/CookieSet.json');
    console.log(`\n\n*****************${new Date(new Date().getTime()).toLocaleString('zh', { hour12: false })} 京东账号${$.index} ${$.nickName || $.UserName} ${$.name}完成*******************\n\n`);
  } catch (e) {
    console.log('京东签到脚本执行异常:' + e);
  }
}
async function downFile() {
  let url = '';
  await downloadUrl();
  if ($.body) {
    url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js';
  } else {
    url = 'https://cdn.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js';
  }
  try {
    const options = {};
    if (process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
      const tunnel = require('tunnel');
      const agent = {
        https: tunnel.httpsOverHttp({
          proxy: {
            host: process.env.TG_PROXY_HOST,
            port: process.env.TG_PROXY_PORT * 1,
          },
        }),
      };
      Object.assign(options, { agent });
    }
    await download(url, outPutUrl, options);
    console.log(`JD_DailyBonus.js文件下载完毕\n\n`);
  } catch (e) {
    console.log('JD_DailyBonus.js 文件下载异常:' + e);
  }
}

async function changeFile(content) {
  console.log(`开始替换变量`);
  let newContent = content.replace(/var OtherKey = `.*`/, `var OtherKey = \`[{"cookie":"${cookie}","jrBody":"${jrBody}"}]\``);
  newContent = newContent.replace(/const NodeSet = 'CookieSet.json'/, `const NodeSet = '${NodeSet}'`);
  if (process.env.JD_BEAN_STOP && process.env.JD_BEAN_STOP !== '0') {
    newContent = newContent.replace(/var stop = '0'/, `var stop = '${process.env.JD_BEAN_STOP}'`);
  }
  const zone = new Date().getTimezoneOffset();
  if (zone === 0) {
    //此处针对UTC-0时区用户做的
    newContent = newContent.replace(/tm\s=.*/, `tm = new Date(new Date().toLocaleDateString()).getTime() - 28800000;`);
  }
  try {
    await fs.writeFileSync(JD_DailyBonusPath, newContent, 'utf8');
    console.log('替换变量完毕');
  } catch (e) {
    console.log('京东签到写入文件异常:' + e);
  }
}
async function deleteFile(path) {
  // 查看文件result.txt是否存在,如果存在,先删除
  const fileExists = await fs.existsSync(path);
  // console.log('fileExists', fileExists);
  if (fileExists) {
    const unlinkRes = await fs.unlinkSync(path);
    // console.log('unlinkRes', unlinkRes)
  }
}
function downloadUrl(url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js') {
  return new Promise((resolve) => {
    const options = { url, timeout: 10000 };
    if ($.isNode() && process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
      const tunnel = require('tunnel');
      const agent = {
        https: tunnel.httpsOverHttp({
          proxy: {
            host: process.env.TG_PROXY_HOST,
            port: process.env.TG_PROXY_PORT * 1,
          },
        }),
      };
      Object.assign(options, { agent });
    }
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          // console.log(`${JSON.stringify(err)}`)
          console.log(`检测到您当前网络环境不能访问外网,将使用jsdelivr CDN下载JD_DailyBonus.js文件`);
          await $.http.get({ url: `https://purge.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js`, timeout: 10000 }).then((resp) => {
            if (resp.statusCode === 200) {
              let { body } = resp;
              body = JSON.parse(body);
              if (body['success']) {
                console.log(`JD_DailyBonus.js文件  CDN刷新成功`);
              } else {
                console.log(`JD_DailyBonus.js文件 CDN刷新失败`);
              }
            }
          });
        } else {
          $.body = data;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function requireConfig() {
  return new Promise((resolve) => {
    // const file = 'jd_bean_sign.js';
    // fs.access(file, fs.constants.W_OK, (err) => {
    //   resultPath = err ? '/tmp/result.txt' : resultPath;
    //   JD_DailyBonusPath = err ? '/tmp/JD_DailyBonus.js' : JD_DailyBonusPath;
    //   outPutUrl = err ? '/tmp/' : outPutUrl;
    //   NodeSet = err ? '/tmp/CookieSet.json' : NodeSet;
    //   resolve()
    // });
    //判断是否是云函数环境。原函数跟目录目录没有可写入权限，文件只能放到根目录下虚拟的/temp/文件夹（具有可写入权限）
    resultPath = process.env.TENCENTCLOUD_RUNENV === 'SCF' ? '/tmp/result.txt' : resultPath;
    JD_DailyBonusPath = process.env.TENCENTCLOUD_RUNENV === 'SCF' ? '/tmp/JD_DailyBonus.js' : JD_DailyBonusPath;
    outPutUrl = process.env.TENCENTCLOUD_RUNENV === 'SCF' ? '/tmp/' : outPutUrl;
    NodeSet = process.env.TENCENTCLOUD_RUNENV === 'SCF' ? '/tmp/CookieSet.json' : NodeSet;
    resolve();
  });
}
function timeFormat(time) {
  let date;
  if (time) {
    date = new Date(time);
  } else {
    date = new Date();
  }
  return date.getFullYear() + '-' + (date.getMonth() + 1 >= 10 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate());
}

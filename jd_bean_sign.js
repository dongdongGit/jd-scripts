/*
 * @Author: lxk0301 https://gitee.com/lxk0301
 */
/*
京东多合一签到,自用,可N个京东账号
活动入口：各处的签到汇总
Node.JS专用
IOS软件用户请使用 https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js
更新时间：2021-3-16
推送通知默认简洁模式(多账号只发送一次)。如需详细通知，设置环境变量 JD_BEAN_SIGN_NOTIFY_SIMPLE 为false即可(N账号推送N次通知)。
Modified From github https://github.com/ruicky/jd_sign_bot
 */
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("京东多合一签到");
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const exec = require('child_process').execSync
const fs = require('fs')
const download = require('download');
let resultPath = "./result.txt";
let JD_DailyBonusPath = "./JD_DailyBonus.js";
let outPutUrl = './';
let NodeSet = 'CookieSet.json';
let cookiesArr = [], cookie = '', allMessage = '';

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
}
!(async() => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE = process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE ? process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE : 'true';
  await requireConfig();
  // 下载最新代码
  await downFile();
  const content = await fs.readFileSync(JD_DailyBonusPath, 'utf8')
  for (let i =0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.nickName = '';
      await TotalBean();
      console.log(`*****************开始京东账号${$.index} ${$.nickName || $.UserName}京豆签到*******************\n`);
      await changeFile(content);
      await execSign();
    }
  }
  await deleteFile(JD_DailyBonusPath);//删除下载的JD_DailyBonus.js文件
  if ($.isNode() && allMessage && process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE === 'true') {
    await notify.sendNotify(`${$.name}`, `${allMessage}`)
  }
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())
async function execSign() {
  console.log(`\n开始执行脚本签到，请稍等`)
  try {
    // if (notify.SCKEY || notify.BARK_PUSH || notify.DD_BOT_TOKEN || (notify.TG_BOT_TOKEN && notify.TG_USER_ID) || notify.IGOT_PUSH_KEY || notify.QQ_SKEY) {
    //   await exec(`${process.execPath} ${JD_DailyBonusPath} >> ${resultPath}`);
    //   const notifyContent = await fs.readFileSync(resultPath, "utf8");
    //   console.log(`👇👇👇👇👇👇👇👇👇👇👇LOG记录👇👇👇👇👇👇👇👇👇👇👇\n${notifyContent}\n👆👆👆👆👆👆👆👆👆LOG记录👆👆👆👆👆👆👆👆👆👆👆`);
    // } else {
    //   console.log('没有提供通知推送，则打印脚本执行日志')
    //   await exec(`${process.execPath} ${JD_DailyBonusPath}`, { stdio: "inherit" });
    // }
    if (await fs.existsSync(JD_DailyBonusPath)) {
      await exec(`${process.execPath} ${JD_DailyBonusPath} >> ${resultPath}`);
      const notifyContent = await fs.readFileSync(resultPath, "utf8");
      console.log(`👇👇👇👇👇👇👇👇👇👇👇LOG记录👇👇👇👇👇👇👇👇👇👇👇\n${notifyContent}\n👆👆👆👆👆👆👆👆👆LOG记录👆👆👆👆👆👆👆👆👆👆👆`);
      // await exec("node JD_DailyBonus.js", { stdio: "inherit" });
      // console.log('执行完毕', new Date(new Date().getTime() + 8 * 3600000).toLocaleDateString())
      //发送通知
      let BarkContent = '';
      if (fs.existsSync(resultPath)) {
        const barkContentStart = notifyContent.indexOf('【签到概览】')
        const barkContentEnd = notifyContent.length;
        if (process.env.JD_BEAN_SIGN_STOP_NOTIFY === 'true') return
        if (process.env.BARK_PUSH || notify.BARK_PUSH) process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE = 'true';
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
      //不管哪个时区,这里得到的都是北京时间的时间戳;
      const UTC8 = new Date().getTime() + new Date().getTimezoneOffset()*60000 + 28800000;
      $.beanSignTime = timeFormat(UTC8);
      //console.log(`脚本执行完毕时间：${$.beanSignTime}`)
      if (BarkContent) {
        allMessage += `【京东号 ${$.index}】: ${$.nickName || $.UserName}\n【签到时间】:  ${$.beanSignTime}\n${BarkContent}${$.index !== cookiesArr.length ? '\n\n' : ''}`;
        if (!process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE || (process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE && process.env.JD_BEAN_SIGN_NOTIFY_SIMPLE !== 'true')) {
          await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName || $.UserName}`, `【签到号 ${$.index}】: ${$.nickName || $.UserName}\n【签到时间】:  ${$.beanSignTime}\n${BarkContent}`);
        }
      }
      //运行完成后，删除下载的文件
      await deleteFile(resultPath);//删除result.txt
      console.log(`\n\n*****************京东账号${$.index} ${$.nickName || $.UserName}京豆签到完成*******************\n\n`);
    } else {
      console.log(`\nJD_DailyBonus.js文件不存在\n`)
    }
  } catch (e) {
    console.log("京东签到脚本执行异常:" + e);
  }
}
async function downFile () {
  let url = '';
  // if (process.env.CDN_JD_DAILYBONUS) {
  //   url = 'https://cdn.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js';
  // } else if (process.env.JD_COOKIE) {
  //   url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js';
  // } else {
  //   url = 'https://cdn.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js';
  // }
  await downloadUrl();
  if ($.body) {
    url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js';
  } else {
    url = 'https://cdn.jsdelivr.net/gh/NobyDa/Script@master/JD-DailyBonus/JD_DailyBonus.js';
  }
  try {
    const options = { }
    if (process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
      const tunnel = require("tunnel");
      const agent = {
        https: tunnel.httpsOverHttp({
          proxy: {
            host: process.env.TG_PROXY_HOST,
            port: process.env.TG_PROXY_PORT * 1
          }
        })
      }
      Object.assign(options, { agent })
    }
    await download(url, outPutUrl, options);
    console.log(`JD_DailyBonus.js文件下载完毕\n\n`);
  } catch (e) {
    console.log("文件下载异常:" + e);
  }
}

async function changeFile (content) {
  console.log(`开始替换变量`)
  let newContent = content.replace(/var Key = ''/, `var Key = '${cookie}'`);
  newContent = newContent.replace(/const NodeSet = 'CookieSet.json'/, `const NodeSet = '${NodeSet}'`)
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
    console.log("京东签到写入文件异常:" + e);
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
function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
      },
      "timeout": 10000
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            if (data['retcode'] === 0) {
              $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
            } else {
              $.nickName = $.UserName
            }
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function downloadUrl(url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js') {
  return new Promise(resolve => {
    const options = { url, "timeout": 10000 };
    if ($.isNode() && process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
      const tunnel = require("tunnel");
      const agent = {
        https: tunnel.httpsOverHttp({
          proxy: {
            host: process.env.TG_PROXY_HOST,
            port: process.env.TG_PROXY_PORT * 1
          }
        })
      }
      Object.assign(options, { agent })
    }
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          // console.log(`${JSON.stringify(err)}`)
          console.log(`检测到您当前网络环境不能访问外网,将使用CDN下载JD_DailyBonus.js文件`)
        } else {
          $.body = data;
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function requireConfig() {
  return new Promise(resolve => {
    const file = 'jd_bean_sign.js';
    fs.access(file, fs.constants.W_OK, (err) => {
      resultPath = err ? '/tmp/result.txt' : resultPath;
      JD_DailyBonusPath = err ? '/tmp/JD_DailyBonus.js' : JD_DailyBonusPath;
      outPutUrl = err ? '/tmp/' : outPutUrl;
      NodeSet = err ? '/tmp/CookieSet.json' : NodeSet;
      resolve()
    });
  })
}
function timeFormat(time) {
  let date;
  if (time) {
    date = new Date(time)
  } else {
    date = new Date();
  }
  return date.getFullYear() + '-' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate());
}

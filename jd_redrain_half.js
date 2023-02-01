/*
半点京豆雨
更新时间：2022-1-11
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js
by：msechen 感谢小手大佬修改接口
==============Quantumult X==============
[task_local]
#半点京豆雨
30 21,22 * * * https://raw.githubusercontent.com/msechen/jdrain/main/jd_live_redrain.js, tag=半点京豆雨, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
==============Loon==============
[Script]
cron "30 21,22 * * *" script-path=https://raw.githubusercontent.com/msechen/jdrain/main/jd_redrain_half.js,tag=半点京豆雨
================Surge===============
半点京豆雨 = type=cron,cronexp="30 21,22 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/msechen/jdrain/main/jd_redrain_half.js
===============小火箭==========
半点京豆雨 = type=cron,script-path=https://raw.githubusercontent.com/msechen/jdrain/main/jd_redrain_half.js, cronexpr="30 21,22 * * *", timeout=3600, enable=true
*/
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('半点京豆雨');
let allMessage = '',
  id = '';
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
let jd_redrain_half_url = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.jd_redrain_half_url) jd_redrain_half_url = process.env.jd_redrain_half_url;
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
  if (JSON.stringify(process.env).indexOf('GITHUB') > -1) process.exit(0);
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/api';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
    return;
  }
  if (!jd_redrain_half_url) {
    $.log(`尝试使用默认远程url`);
    jd_redrain_half_url = 'https://raw.githubusercontent.com/Ca11back/scf-experiment/master/json/redrain_half.json';
  }
  let hour = (new Date().getUTCHours() + 8) % 24;
  $.log(`\n甘露殿【https://t.me/jdredrain】提醒你:正在远程获取${hour}点30分京豆雨ID\n`);
  await $.wait(1000);
  let redIds = await getRedRainIds(jd_redrain_half_url);
  if (!redIds || !redIds.length) {
    $.log(`尝试使用cdn`);
    jd_redrain_half_url = 'https://raw.fastgit.org/Ca11back/scf-experiment/master/json/redrain_half.json';
    redIds = await getRedRainIds(jd_redrain_half_url);
    if (!redIds || !redIds.length) {
      $.log(`默认远程url获取失败`);
      return;
    }
  }
  for (let id of redIds) {
    if (!/^RRA/.test(id)) {
      console.log(`\nRRA: "${id}"不符合规则\n`);
      continue;
    }
    console.log(`\n甘露殿【https://t.me/jdredrain】提醒你:龙王就位:${id}，正在领取${hour}点30分京豆雨\n`);
    for (let i = 0; i < cookiesArr.length; i++) {
      if (cookiesArr[i]) {
        $.cookie = cookie = cookiesArr[i];
        $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        $.index = i + 1;
        $.isLogin = true;
        $.nickName = '';
        message = '';
        await $.totalBean();
        console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
        if (!$.isLogin) {
          $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { 'open-url': 'https://bean.m.jd.com/' });
          if ($.isNode()) {
            await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
          }
          continue;
        }
        await queryRedRainTemplateNew(id);
      }
    }
  }
  if (allMessage) {
    if ($.isNode()) await notify.sendNotify(`${$.name}`, `${allMessage}`);
    $.msg($.name, '', allMessage);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

// 查询红包
function queryRedRainTemplateNew(actId) {
  const body = { actId: actId };
  return new Promise(async (resolve) => {
    const options = {
      url: `https://api.m.jd.com/client.action?appid=redrain-2021&functionId=queryRedRainTemplateNew&client=wh5&clientVersion=1.0.0&body=${encodeURIComponent(
        JSON.stringify(body)
      )}&_=${new Date().getTime()}`,
      headers: {
        Host: 'api.m.jd.com',
        origin: 'https://h5.m.jd.com/',
        Accept: '*/*',
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
        Cookie: cookie,
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; WLZ-AN00 Build/HUAWEIWLZ-AN00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.72 MQQBrowser/6.2 TBS/045811 Mobile Safari/537.36 MMWEBID/2874 MicroMessenger/8.0.15.2020(0x28000F39) Process/tools WeChat/arm64 Weixin NetType/4G Language/zh_CN ABI/arm64',
        Referer: `https://h5.m.jd.com/`,
      },
    };
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`queryRedRainTemplateNew api请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            await doInteractiveAssignment(data.activityInfo.encryptProjectId, data.activityInfo.encryptAssignmentId);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

// 拆红包
function doInteractiveAssignment(encryptProjectId, encryptAssignmentId) {
  const body = { encryptProjectId: encryptProjectId, encryptAssignmentId: encryptAssignmentId, completionFlag: true, sourceCode: 'acehby20210924' };
  return new Promise(async (resolve) => {
    const options = {
      url: `https://api.m.jd.com/client.action?appid=redrain-2021&functionId=doInteractiveAssignment&client=wh5&clientVersion=1.0.0&body=${encodeURIComponent(
        JSON.stringify(body)
      )}&_=${new Date().getTime()}`,
      headers: {
        Host: 'api.m.jd.com',
        origin: 'https://h5.m.jd.com/',
        Accept: '*/*',
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
        Cookie: cookie,
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; WLZ-AN00 Build/HUAWEIWLZ-AN00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.72 MQQBrowser/6.2 TBS/045811 Mobile Safari/537.36 MMWEBID/2874 MicroMessenger/8.0.15.2020(0x28000F39) Process/tools WeChat/arm64 Weixin NetType/4G Language/zh_CN ABI/arm64',
        Referer: `https://h5.m.jd.com/`,
      },
    };
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`doInteractiveAssignment api请求失败，请检查网路重试`);
        } else {
          if (data) {
            if (data.subCode == '0') {
              console.log(`${data.rewardsInfo.successRewards[3][0].rewardName}个`);
            } else {
              console.log(data);
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&_=${
      new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000
    }`,
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Host: 'api.m.jd.com',
      Referer: `https://h5.m.jd.com/active/redrain/index.html?id=${$.activityId}&lng=0.000000&lat=0.000000&sid=&un_area=`,
      Cookie: cookie,
      'User-Agent': 'JD4iPhone/9.4.5 CFNetwork/1209 Darwin/20.2.0',
    },
  };
}

function getRedRainIds(url) {
  return new Promise(async (resolve) => {
    const options = {
      url: `${url}?${new Date()}`,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88',
      },
    };
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
        } else {
          if (data) data = JSON.parse(data);
        }
      } catch (e) {
        // $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    });
    await $.wait(10000);
    resolve([]);
  });
}

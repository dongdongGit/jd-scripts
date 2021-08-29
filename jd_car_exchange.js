/*
京东汽车兑换，500赛点兑换500京豆
长期活动

活动入口
京东APP：首页👉京东汽车兑换👉屏幕右中部，车主福利
活动网页地址：https://h5.m.jd.com/babelDiy/Zeus/44bjzCpzH9GpspWeBzYSqBA7jEtP/index.html#/journey

更新地址：https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_car_exchange
已支持IOS, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js

============Quantumultx===============
[task_local]
#京东汽车兑换
0 0 * * * https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_car_exchange.js, tag=京东汽车兑换, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_redPacket.png, enabled=true

================Loon==============
[Script]
cron "0 0 * * *" script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_car_exchange.js, tag=京东汽车兑换

===============Surge=================
京东汽车兑换 = type=cron,cronexp="0 0 * * *",wake-system=1,timeout=2000,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_car_exchange.js

============小火箭=========
京东汽车兑换 = type=cron,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_car_exchange.js, cronexpr="0 0 * * *", timeout=2000, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东汽车兑换');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
const randomCount = $.isNode() ? 20 : 5;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || '[]';
  cookiesData = jd_helpers.jsonParse(cookiesData);
  cookiesArr = cookiesData.map((item) => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter((item) => item !== '' && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://car-member.jd.com/api/';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let j = 0; j < 20; ++j)
    for (let i = 0; i < cookiesArr.length; i++) {
      if (cookiesArr[i]) {
        $.cookie = cookie = cookiesArr[i];
        $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
        $.index = i + 1;
        console.log(`京东账号${$.index} ${$.UserName}`);
        $.isLogin = true;
        $.nickName = '';
        message = '';
        await jdCar();
      }
    }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function jdCar() {
  await exchange();
}

function showMsg() {
  return new Promise((resolve) => {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve();
  });
}

function exchange() {
  return new Promise((resolve) => {
    $.post(taskUrl('v1/user/exchange/bean'), (err, resp, data) => {
      try {
        if (err) {
          data = JSON.parse(resp.body);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            console.log(`兑换结果：${JSON.stringify(data)}`);
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
    url: `${JD_API_HOST}${function_id}?timestamp=${new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000}`,
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Host: 'car-member.jd.com',
      activityid: '39443aee3ff74fcb806a6f755240d127',
      origin: 'https://h5.m.jd.com',
      Referer: 'https://h5.m.jd.com/babelDiy/Zeus/44bjzCpzH9GpspWeBzYSqBA7jEtP/index.html',
      Cookie: cookie,
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
    },
  };
}
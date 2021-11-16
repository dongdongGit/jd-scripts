/*
github：https://github.com/Ariszy/Private-Script
[task_local]
#手机竞猜
10 7,10,20 * * * jd_sjjc.js, tag= 手机竞猜
================Loon==============
[Script]
cron "10 7,10,20 * * *" script-path= jd_sjjc.js,tag= 手机竞猜
===============Surge=================
手机竞猜 = type=cron,cronexp="10 7,10,20 * * *",wake-system=1,timeout=3600,script-path= jd_sjjc.js
============小火箭=========
sjjc = type=cron,script-path= jd_sjjc.js, cronexpr="10 7,10,20 * * *", timeout=3600, enable=true
*/
const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
const $ = jd_env.env('手机竞猜');
const notify = $.isNode() ? require('../sendNotify') : '';
cookiesArr = [];
CodeArr = [];
cookie = '';
var quizId = '',
  shareId = '',
  jump = '';
var brandlistArr = [],
  shareidArr = [
    'caca8d51-8305-479f-ad7d-bb5065548f2e'
  ];
const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';
cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
let tz = $.getval('tz') || '1'; //0关闭通知，1默认开启
const invite = 1; //新用户自动邀请，0关闭，1默认开启
const logs = 0; //0为关闭日志，1为开启
var hour = '';
var minute = '';
if ($.isNode()) {
  hour = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).getHours();
  minute = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).getMinutes();
} else {
  hour = new Date().getHours();
  minute = new Date().getMinutes();
}
//CK运行
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    message = '';
    $.isLogin = true;
    $.index = i + 1;
    await $.totalBean();
    console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
      });

      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue;
    }
    await getlist();
    await Zy();
    await control();
    await ZY();
    await lottery(quizId);
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    message = '';
    $.isLogin = true;
    $.index = i + 1;
    console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}助力模块*********\n`);
    await zy();
    await formatcode();
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

function PostRequest(uri, body) {
  const url = `https://api.m.jd.com/api/${uri}`;
  const method = `POST`;
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-cn',
    Connection: 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: cookie,
    Host: 'api.m.jd.com',
    Origin: 'https://electricsuper.jd.com',
    Referer: 'https://electricsuper.jd.com/?lng=121.406936&lat=31.363832&sid=8610c0280494250aa210ed252f7ad28w&un_area=13_1016_47166_57860',
    'User-Agent':
      'jdapp;iPhone;10.2.2;14.4;0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849;M/5.0;network/wifi;ADID/;model/iPhone12,1;addressid/2377723269;appBuild/167863;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;',
  };
  return { url: url, method: method, headers: headers, body: body };
}
function PostRequests(body) {
  const url = `https://api.m.jd.com/api`;
  const method = `POST`;
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-cn',
    Connection: 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: cookie,
    Host: 'api.m.jd.com',
    Origin: 'https://electricsuper.jd.com',
    Referer: 'https://electricsuper.jd.com/?lng=121.406936&lat=31.363832&sid=8610c0280494250aa210ed252f7ad28w&un_area=13_1016_47166_57860',
    'User-Agent':
      'jdapp;iPhone;10.2.2;14.4;0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849;M/5.0;network/wifi;ADID/;model/iPhone12,1;addressid/2377723269;appBuild/167863;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;',
  };
  return { url: url, method: method, headers: headers, body: body };
}
function GetRequest(uri) {
  const url = `https://brandquiz.m.jd.com/api/${uri}`;
  const method = `GET`;
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-cn',
    Connection: 'keep-alive',
    Cookie: cookie,
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  };
  return { url: url, method: method, headers: headers };
}

async function quiz(quizId) {
  const body = `appid=apple-jd-aggregate&functionId=brandquiz_prod&body={"quizId":${quizId},"quizStr":"${distinct(
    brandlistArr
  )}","predictId":null,"apiMapping":"/api/index/quiz"}&t=${new Date().getTime()}&loginType=2`;
  const MyRequest = PostRequests(body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result && result.code && result.code == 200) {
          console.log('\n竞猜成功，获得' + result.data.beanNum + '豆豆\n开奖时间为:' + data.match(/\d+月\d+日/) + ' 10:00 \n下轮竞猜时间为：' + result.data.nextQuizDate);
          await $.wait(8000);
        } else {
          $.log(result.msg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function control() {
  await first();
  await getshareid(quizId);
}
async function first() {
  const body = `appid=apple-jd-aggregate&functionId=brandquiz_prod&body=%7B%22quizId%22:3,%22apiMapping%22:%22/api/support/getSupport%22%7D&t=${new Date().getTime()}&loginType=2`;
  const MyRequest = PostRequests(body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function getshareid() {
  const body = `appid=apple-jd-aggregate&functionId=brandquiz_prod&body={"quizId":${quizId},"apiMapping":"/api/support/getSupport"}&t=${new Date().getTime()}&loginType=2`;
  const MyRequest = PostRequests(body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result && result.code && result.code == 200) {
          shareId = result.data.shareId;
          $.log('互助码：' + result.data.shareId + '\n');
          shareidArr.push(result.data.shareId);
          await $.wait(8000);
          //await zy()
        } else {
          $.log('😫' + result.msg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function ZY() {
  for (let i = 0; i < 10; i++) {
    await getSupportReward(i, shareId);
    if (jump == 1) break;
  }
}
async function getSupportReward(turn, shareid) {
  const body = `appid=apple-jd-aggregate&functionId=brandquiz_prod&body={"supporterIndex":${turn},"shareId":"${shareid}","apiMapping":"/api/support/getSupportReward"}&t=${new Date().getTime()}&loginType=2`;
  const MyRequest = PostRequests(body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result && result.code && result.code == 200) {
          console.log('获得豆豆' + result.data + '个\n');
        } else {
          jump = 1;
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}

async function Zy() {
  brandlistArr.splice(0, brandlistArr.length);
}

async function dosupport(shareid) {
  const body = `appid=apple-jd-aggregate&functionId=brandquiz_prod&body={"shareId":"${shareid}","apiMapping":"/api/support/doSupport"}&t=${new Date().getTime()}&loginType=2`;
  const MyRequest = PostRequests(body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        $.log(data);
        if (result && result.code && result.code == 200 && result.data == 7) {
          console.log('助力成功\n');
        } else if (result.data == 1) {
          $.log('😫助力失败,不能助力自己\n');
        } else if (result.data == 3) {
          $.log('😫助力失败,已经助力过了\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function lottery(quizId) {
  const body = `appid=apple-jd-aggregate&appid=apple-jd-aggregate&functionId=brandquiz_prod&body={"quizId":${quizId},"apiMapping":"/api/index/lottery"}&t=${new Date().getTime()}&loginType=2`;
  const MyRequest = PostRequests(body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.code == 200) {
          console.log('抽奖结果' + result.data.prizeName);
        } else {
          console.log(result.msg);
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function zy() {
  for (let i = 0; i < distinct(shareidArr).length; i++) {
    console.log('开始内部助力' + shareidArr[i] + '\n');
    await dosupport(shareidArr[i]);
    await $.wait(8000);
  }
}
async function getlist() {
  const body = `appid=apple-jd-aggregate&functionId=brandquiz_prod&body={"apiMapping":"/api/index/indexInfo"}&t=${new Date().getTime()}&loginType=2`;
  const MyRequest = PostRequests(body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result && result.code && result.code == 200) {
          //shareId = result.data.shareId
          quizId = result.data.quizId;
          console.log(result.data.listName + '\n');
          for (let i = 0; i < 5; i++) {
            let numberid = result.data.brandWall[i].id.match(/\w+/);
            brandlistArr.push(numberid);
          }
          $.log('榜单获取成功' + distinct(brandlistArr));
          await $.wait(8000);
          await quiz(quizId);
        } else {
          $.log('😫' + result.msg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}

async function readShareCodes() {
  return new Promise((resolve) => {
    let url = {
      url: `https://raw.githubusercontent.com/Ariszy/TGBOT/main/sjjc.js`,
    };
    $.get(url, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        //$.log(data)
        if (true) {
          var sharecodesArr = new Array();
          for (var i in result) {
            sharecodesArr.push(result[i]);
          }
          var sharecodeArr = new Array();
          for (let i = 0; i < sharecodesArr.length; i++) {
            for (var j in sharecodesArr[i]) {
              sharecodeArr.push(sharecodesArr[i][j].Code);
            }
          }
          //$.log(sharecodeArr)
          CodeArr = sharecodeArr;
          return sharecodeArr;
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}

async function formatcode() {
  await readShareCodes();
  var newsharecodes = [];
  var arr = CodeArr;
  var count = arr.length;
  for (var i = 0; i < 5 - cookiesArr.length; i++) {
    var index = ~~(Math.random() * count) + i;
    newsharecodes[i] = arr[index];
    arr[index] = arr[i];
    count--;
  }
  console.log('随机取出' + (5 - cookiesArr.length) + '个助力码,账号' + `${$.UserName}即将助力【` + newsharecodes + '】\n');
  for (let i = 0; i < newsharecodes.length; i++) {
    console.log(`开始第${i + 1}次随机助力` + newsharecodes[i] + '\n');
    await dosupport(newsharecodes[i]);
    await $.wait(1000 * newsharecodes.length);
  }
}
//showmsg
//boxjs设置tz=1，在12点<=20和23点>=40时间段通知，其余时间打印日志

async function showmsg() {
  if (tz == 1) {
    if ($.isNode()) {
      if ((hour == 12 && minute <= 20) || (hour == 23 && minute >= 40)) {
        await notify.sendNotify($.name, message);
      } else {
        $.log(message);
      }
    } else {
      if ((hour == 12 && minute <= 20) || (hour == 23 && minute >= 40)) {
        $.msg(zhiyi, '', message);
      } else {
        $.log(message);
      }
    }
  } else {
    $.log(message);
  }
}
function distinct(array) {
  return Array.from(new Set(array));
}

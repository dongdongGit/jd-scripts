/*
京东生鲜每日抽奖，可抽奖获得京豆，
活动入口：京东生鲜每日抽奖
脚本更新时间：2021-12-6 14:20
脚本兼容: Node.js
============Quantumultx===============
[task_local]
#京东生鲜每日抽奖
10 7 17-18 8 * jd jd_sxLottery.js, tag=京东生鲜每日抽奖, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_sxLottery.png, enabled=true

 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东生鲜每日抽奖');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
let configCode = '3d09bd04439041018973e039b4a5f205';
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
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
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
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await jdmodule();
      await showMsg();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

function showMsg() {
  return new Promise((resolve) => {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve();
  });
}

async function jdmodule() {
  await getCode(); //获取任务
  let runTime = 0;
  do {
    await getinfo(); //获取任务
    $.hasFinish = true;
    await run();
    runTime++;
  } while (!$.hasFinish && runTime < 6);

  await getinfo();
  console.log('开始抽奖');
  for (let x = 0; x < $.chanceLeft; x++) {
    await join();
    await $.wait(1500);
  }
}

//运行
async function run() {
  try {
    for (let vo of $.taskinfo) {
      if (vo.hasFinish === true) {
        console.log(`任务${vo.taskName}，已完成`);
        continue;
      }
      console.log(`开始做${vo.taskName}:${vo.taskItem.itemName}`);
      await doTask(vo.taskType, vo.taskItem.itemId);
      console.log(vo);
      await $.wait(1000 * vo.viewTime);
      await getReward(vo.taskType, vo.taskItem.itemId);
      $.hasFinish = false;
    }
  } catch (e) {
    console.log(e);
  }
}

// 获取任务
function getCode() {
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://prodev.m.jd.com/mall/active/2Rkjx8aT5eKaQnUzn8dwcR6jNanj/index.html`,
        headers: {
          Connection: 'keep-alive',
          'Accept-Encoding': 'gzip, deflate, br',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'JD4iPhone/167874 (iPhone; iOS 14.2; Scale/3.00)',
          Cookie: $.cookie,
          Host: 'prodev.m.jd.com',
          Referer: '',
          'Accept-Language': 'zh-Hans-CN;q=1, en-CN;q=0.9',
          Accept: '*/*',
        },
      },
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} getinfo请求失败，请检查网路重试`);
          } else {
            configCode = resp.body.match(/"activityCode":"(.*?)"/)[1];
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}
// 获取任务
function getinfo() {
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://jdjoy.jd.com/module/task/draw/get?configCode=${configCode}&unionCardCode=`,
        headers: {
          Host: 'jdjoy.jd.com',
          accept: '*/*',
          'content-type': 'application/json',
          Referer: 'https://prodev.m.jd.com/mall/active/ebLz35DwiVumB6pcrGkqmnhCgmC/index.html',
          origin: 'https://prodev.m.jd.com',
          'X-Requested-With': 'com.jingdong.app.mall',
          'User-Agent': $.isNode()
            ? process.env.JD_USER_AGENT
              ? process.env.JD_USER_AGENT
              : require('./USER_AGENTS').USER_AGENT
            : $.getdata('JDUA')
            ? $.getdata('JDUA')
            : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
          'accept-language': 'zh-Hans-CN;q=1',
          cookie: cookie,
        },
      },
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} getinfo请求失败，请检查网路重试`);
          } else {
            data = JSON.parse(data);
            $.chanceLeft = data.data.chanceLeft;
            if (data.success == true) {
              $.taskinfo = data.data.taskConfig;
            } else {
              console.log(data.errorMessage);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}

//抽奖
function join() {
  return new Promise(async (resolve) => {
    $.get(
      {
        url: `https://jdjoy.jd.com/module/task/draw/join?configCode=${configCode}&fp=${randomWord(false, 32, 32)}&eid=`,
        headers: {
          Host: 'jdjoy.jd.com',
          accept: '*/*',
          'content-type': 'application/json',
          Referer: 'https://prodev.m.jd.com/mall/active/ebLz35DwiVumB6pcrGkqmnhCgmC/index.html',
          origin: 'https://prodev.m.jd.com',
          'X-Requested-With': 'com.jingdong.app.mall',
          'User-Agent': $.isNode()
            ? process.env.JD_USER_AGENT
              ? process.env.JD_USER_AGENT
              : require('./USER_AGENTS').USER_AGENT
            : $.getdata('JDUA')
            ? $.getdata('JDUA')
            : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
          'accept-language': 'zh-Hans-CN;q=1',
          cookie: cookie,
        },
      },
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} join请求失败，请检查网路重试`);
          } else {
            data = JSON.parse(data);
            if (data.success == true) {
              console.log(`抽奖结果:${data.data.rewardName}`);
            } else {
              console.log(data.errorMessage);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}
//获取首页活动
function doTask(taskType, itemId) {
  return new Promise((resolve) => {
    let options = taskPostUrl('doTask', `{"configCode":"${configCode}","taskType":${taskType},"itemId":"${itemId}"}`);
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} doTask请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.success == true) {
            console.log('领取任务成功');
          } else {
            console.log(data.errorMessage);
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

//领取任务奖励
function getReward(taskType, itemId) {
  return new Promise((resolve) => {
    let options = taskPostUrl('getReward', `{"configCode":"${configCode}","taskType":${taskType},"itemId":"${itemId}"}`);
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name}  getReward请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.success == true) {
            console.log('任务奖励领取成功');
          } else {
            console.log(data.errorMessage);
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

function taskPostUrl(function_id, body = {}) {
  return {
    url: `https://jdjoy.jd.com/module/task/draw/${function_id}`,
    body: `${body}`,
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      'Content-Type': 'application/json',
      Host: 'jdjoy.jd.com',
      'x-requested-with': 'com.jingdong.app.mall',
      Referer: 'https://prodev.m.jd.com/mall/active/ebLz35DwiVumB6pcrGkqmnhCgmC/index.html',
      origin: 'https://prodev.m.jd.com',
      Cookie: cookie,
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };
}

function randomWord(randomFlag, min, max) {
  var str = '',
    range = min,
    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

  // 随机产生
  if (randomFlag) {
    range = Math.round(Math.random() * (max - min)) + min;
  }
  for (var i = 0; i < range; i++) {
    pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
}

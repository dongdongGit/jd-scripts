/*
空气、6豆、10豆、20豆
cron:1 10 * * *
============Quantumultx===============
[task_local]
#魔方红包雨
1 10 * * * jd_mfredrain.js, tag=魔方红包雨, enabled=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('魔方红包雨');

const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message = '';
let encryptProjectId = '3NhNqgKD5WYkmLLsudX1Z2vVS5pP';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
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
      await dotask();
      await $.wait(1000);
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function dotask() {
  return new Promise(async (resolve) => {
    $.get(taskUrl(), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`doInteractiveAssignment API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.subCode == 0) {
            console.log(data.rewardsInfo?.successRewards[3][0]?.rewardName || '空气');
          } else {
            console.log(data.msg);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function taskUrl() {
  return {
    url: `https://api.m.jd.com/client.action?client=wh5&clientVersion=1.0.0&appid=redrain-2021&functionId=doInteractiveAssignment&body=%7B%22completionFlag%22:true,%22sourceCode%22:%22acehby20210924%22,%22encryptProjectId%22:%22uyuXxVVy8C3AarwZ2VAHecYNat6%22,%22encryptAssignmentId%22:%2246xcZZ1QaAG7ykQzpDNtSwarHxSk%22%7D`,
    headers: {
      Host: 'api.m.jd.com',
      accept: 'application/json, text/plain, */*',
      Origin: 'https://prodev.m.jd.com',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Cookie: cookie,
    },
  };
}

function showMsg() {
  return new Promise((resolve) => {
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve();
  });
}
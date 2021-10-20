/*
先手动进去集魔方界面，再跑兑换脚本
5魔方兑换
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#5魔方兑换
0 0 * * * jd_mofang_exchange.js, tag=5魔方兑换, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jxcfd.png, enabled=true

================Loon==============
[Script]
cron "0 0 * * *" script-path=jd_mofang_exchange.js,tag=5魔方兑换

===============Surge=================
5魔方兑换 = type=cron,cronexp="0 0 * * *",wake-system=1,timeout=3600,script-path=jd_mofang_exchange.js

============小火箭=========
5魔方兑换 = type=cron,script-path=jd_mofang_exchange.js, cronexpr="0 0 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('5魔方兑换');
const printDetail = false;
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let cookiesArr = [],
  cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
} else {
  cookiesArr.push($.getdata('CookieJD'));
  cookiesArr.push($.getdata('CookieJD2'));
}
const JD_API_HOST = `https://api.m.jd.com/client.action?functionId=doInteractiveAssignment`;
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
      await exchange_redpocket();
      await msgShow();
      await $.wait(5000);
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

function exchange_redpocket() {
  return new Promise((resolve) => {
    $.post(jdUrl('doInteractiveAssignment'), (err, resp, data) => {
      try {
        if (err) {
          data = JSON.parse(resp.body);
          console.log(`Error：${JSON.stringify(data)}`);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            console.log(`Result：${JSON.stringify(data)}`);
            if (data.subCode == 0) {
              //$.message = data.data.result.shareRewardTip;
              $.message = '成功！';
            } else {
              $.message = '兑换积分不足';
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
function msgShow() {
  return new Promise((resolve) => {
    $.msg($.name, '', `【京东账号${$.index}】${$.UserName}\n${$.message}`);
    resolve();
  });
}
function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == 'object') {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}

//?timestamp=${new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000}
function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}${function_id}`,
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Host: 'api.m.jd.com',
      origin: 'https://h5.m.jd.com',
      Referer: 'https://h5.m.jd.com/babelDiy/Zeus/2bf3XEEyWG11pQzPGkKpKX2GxJz2/index.html',
      Cookie: cookie,
      'User-Agent':
        'jdapp;iPhone;9.4.2;13.4.1;e9241834b8e0994edf39389a4d18ff6eeba990f5;network/4g;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone10,1;addressid/2413614733;supportBestPay/0;appBuild/167568;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };
}

function jdUrl(function_id, body = {}) {
  return {
    url: `https://api.m.jd.com/client.action?functionId=${function_id}`,
    body: 'functionId=doInteractiveAssignment&body=%7B%22encryptProjectId%22%3A%223pp3mvzmgcFm7mvU3S1wZihNKi1H%22%2C%22encryptAssignmentId%22%3A%223Qia2BF8oxZWEFsNdAEAuZsTXHqA%22%2C%22sourceCode%22%3A%22acexinpin0823%22%2C%22itemId%22%3A%22%22%2C%22actionType%22%3A%22%22%2C%22completionFlag%22%3A%22%22%2C%22ext%22%3A%7B%22exchangeNum%22%3A1%7D%7D&client=wh5&clientVersion=1.0.0&appid=content_ecology',
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: '*/*',
      Host: 'api.m.jd.com',
      'User-Agent': 'JD4iPhone/167568 (iPhone; iOS 13.4.1; Scale/2.00)',
      'Accept-Language': 'en-HK;q=1, zh-Hans-HK;q=0.9, zh-Hant-HK;q=0.8',
      Cookie: cookie,
    },
  };
}
//获取昵称
function QueryJDUserInfo(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `https://me-api.jd.com/user_new/info/GetJDUserInfoUnion`,
        headers: {
          Host: `me-api.jd.com`,
          Cookie: cookie,
        },
      };
      $.get(url, (err, resp, data) => {
        try {
          if (printDetail) console.log(data);
          data = JSON.parse(data);
          if (data.retcode === 13) {
            $.isLogin = false;
            return;
          }
          $.nickname = data.data.userInfo.baseInfo.nickname;
          $.isLogin = true;
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}

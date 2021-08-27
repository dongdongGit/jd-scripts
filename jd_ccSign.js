/*
领券中心签到
@感谢 ddo 提供sign算法
活动入口：领券中心
更新时间：2021-08-23
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#领券中心签到
15 7 * * * https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_ccSign.js, tag=领券中心签到, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon==============
[Script]
cron "15 7 * * *" script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_ccSign.js,tag=领券中心签到
===============Surge=================
领券中心签到 = type=cron,cronexp="15 7 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_ccSign.js
============小火箭=========
领券中心签到 = type=cron,script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_ccSign.js, cronexpr="15 7 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('领券中心签到');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
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
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let allMessage = '';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await TotalBean();
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
      await jdSign();
      await $.wait(2000);
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function jdSign() {
  await getCouponConfig();
}

async function getCouponConfig() {
  let functionId = `getCouponConfig`;
  let body = `%7B%22childActivityUrl%22%3A%22openapp.jdmobile%3A%2F%2Fvirtual%3Fparams%3D%7B%5C%22category%5C%22%3A%5C%22jump%5C%22%2C%5C%22des%5C%22%3A%5C%22couponCenter%5C%22%7D%22%2C%22incentiveShowTimes%22%3A0%2C%22monitorRefer%22%3A%22%22%2C%22monitorSource%22%3A%22ccresource_android_index_config%22%2C%22pageClickKey%22%3A%22Coupons_GetCenter%22%2C%22rewardShowTimes%22%3A0%2C%22sourceFrom%22%3A%221%22%7D`;
  let uuid = randomString(16);
  let sign = await getSign(functionId, decodeURIComponent(body), uuid);
  let url = `${JD_API_HOST}?functionId=${functionId}&build=89743&client=android&clientVersion=10.1.2&uuid=${uuid}&${sign}`;
  return new Promise(async (resolve) => {
    $.post(taskUrl(url, body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getCouponConfig API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.result.couponConfig.signNecklaceDomain) {
              console.log(`活动已升级，暂时无法解决，跳过执行`);
            } else {
              if (data.result.couponConfig.signNewDomain.roundData.ynSign === '1') {
                console.log(`签到失败：今日已签到~`);
              } else {
                let functionId = `ccSignInNew`;
                let body = `%7B%22childActivityUrl%22%3A%22openapp.jdmobile%3A%2F%2Fvirtual%3Fparams%3D%7B%5C%22category%5C%22%3A%5C%22jump%5C%22%2C%5C%22des%5C%22%3A%5C%22couponCenter%5C%22%7D%22%2C%22monitorRefer%22%3A%22appClient%22%2C%22monitorSource%22%3A%22cc_sign_android_index_config%22%2C%22pageClickKey%22%3A%22Coupons_GetCenter%22%7D`;
                await ccSignInNew(functionId, body);
              }
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
async function ccSignInNew(functionId, body) {
  let uuid = randomString(16);
  let sign = await getSign(functionId, decodeURIComponent(body), uuid);
  let url = `${JD_API_HOST}?functionId=${functionId}&build=89568&client=android&clientVersion=9.2.2&uuid=${uuid}&${sign}`;
  return new Promise(async (resolve) => {
    $.post(taskUrl(url, body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} ccSignInNew API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.busiCode === '0') {
              console.log(`签到成功：获得 ${data.result.signResult.signData.amount} 红包`);
            } else {
              console.log(`签到失败：${data.message}`);
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
function getSign(functionid, body, uuid) {
  return new Promise(async (resolve) => {
    let clientVersion;
    if (functionid === 'ccSignInNew') {
      clientVersion = '9.2.2';
    } else {
      clientVersion = '10.1.2';
    }
    let data = {
      functionId: functionid,
      body: body,
      uuid: uuid,
      client: 'android',
      clientVersion: clientVersion,
    };
    let options = {
      url: `https://jdsign.cf/ddo`,
      body: JSON.stringify(data),
      headers: {
        Host: 'jdsign.tk',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88',
      },
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getSign API请求失败，请检查网路重试`);
        } else {
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
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

function taskUrl(url, body) {
  return {
    url,
    body: `body=${body}`,
    headers: {
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'User-Agent': 'okhttp/3.12.1;jdmall;android;version/9.2.2;build/89568;screen/1440x2560;os/7.1.2;network/wifi',
      Accept: '*/*',
      Referer: 'https://h5.m.jd.com/rn/42yjy8na6pFsq1cx9MJQ5aTgu3kX/index.html',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
  };
}
function randomString(e) {
  e = e || 32;
  let t = 'abcdefghijklmnopqrstuvwxyz0123456789',
    a = t.length,
    n = '';
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: 'https://wq.jd.com/user_new/info/GetJDUserInfoUnion?sceneval=2',
      headers: {
        Host: 'wq.jd.com',
        Accept: '*/*',
        Connection: 'keep-alive',
        Cookie: cookie,
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        Referer: 'https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 1001) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === 0 && data.data && data.data.hasOwnProperty('userInfo')) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            console.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e);
      } finally {
        resolve();
      }
    });
  });
}

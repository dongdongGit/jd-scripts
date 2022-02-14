/*
领券中心签到

@感谢 ddo 提供sign算法
@感谢 匿名大佬 提供pin算法

活动入口：领券中心
更新时间：2021-08-23
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#领券中心签到
15 0 * * * https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_ccSign.js, tag=领券中心签到, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

================Loon==============
[Script]
cron "15 0 * * *" script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_ccSign.js,tag=领券中心签到

===============Surge=================
领券中心签到 = type=cron,cronexp="15 0 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_ccSign.js

============小火箭=========
领券中心签到 = type=cron,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_ccSign.js, cronexpr="15 0 * * *", timeout=3600, enable=true
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
  let body = {
    childActivityUrl: 'openapp.jdmobile://virtual?params={"category":"jump","des":"couponCenter"}',
    incentiveShowTimes: 0,
    monitorRefer: '',
    monitorSource: 'ccresource_android_index_config',
    pageClickKey: 'Coupons_GetCenter',
    rewardShowTimes: 0,
    sourceFrom: '1',
  };
  let sign = await getSign(functionId, body);
  return new Promise(async (resolve) => {
    $.post(taskUrl(functionId, sign), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getCouponConfig API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            let functionId, body;
            if (data.result.couponConfig.signNecklaceDomain) {
              if (data.result.couponConfig.signNecklaceDomain.roundData.ynSign === '1') {
                console.log(`签到失败：今日已签到~`);
              } else {
                let pin = await getsecretPin($.UserName);
                functionId = `ccSignInNecklace`;
                body = {
                  childActivityUrl: 'openapp.jdmobile://virtual?params={"category":"jump","des":"couponCenter"}',
                  monitorRefer: 'appClient',
                  monitorSource: 'cc_sign_android_index_config',
                  pageClickKey: 'Coupons_GetCenter',
                  sessionId: '',
                  signature: data.result.couponConfig.signNecklaceDomain.signature,
                  pin: pin,
                  verifyToken: '',
                };
              }
            } else {
              if (data.result.couponConfig.signNewDomain.roundData.ynSign === '1') {
                console.log(`签到失败：今日已签到~`);
              } else {
                let pin = await getsecretPin($.UserName);
                functionId = `ccSignInNew`;
                body = {
                  childActivityUrl: 'openapp.jdmobile://virtual?params={"category":"jump","des":"couponCenter"}',
                  monitorRefer: 'appClient',
                  monitorSource: 'cc_sign_android_index_config',
                  pageClickKey: 'Coupons_GetCenter',
                  pin: pin,
                };
              }
            }
            if (functionId && body) await ccSign(functionId, body);
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
async function ccSign(functionId, body) {
  let sign = await getSign(functionId, body);
  return new Promise(async (resolve) => {
    $.post(taskUrl(functionId, sign), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} ccSign API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.busiCode === '0') {
              console.log(
                functionId === 'ccSignInNew'
                  ? `签到成功：获得 ${data.result.signResult.signData.amount} 红包`
                  : `签到成功：获得 ${data.result.signResult.signData.necklaceScore} 点点券，${data.result.signResult.signData.amount}`
              );
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
function getSign(functionId, body) {
  return new Promise(async (resolve) => {
    let data = {
      functionId,
      body: JSON.stringify(body),
      client: 'android',
      clientVersion: '10.3.2',
    };
    let Host = '';
    let HostArr = ['jdsign.cf', 'signer.nz.lu'];
    if (process.env.SIGN_URL) {
      Host = process.env.SIGN_URL;
    } else {
      Host = HostArr[Math.floor(Math.random() * HostArr.length)];
    }
    let options = {
      url: `https://cdn.nz.lu/ddo`,
      body: JSON.stringify(data),
      headers: {
        Host,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88',
      },
      timeout: 30 * 1000,
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
function getsecretPin(pin) {
  return new Promise(async (resolve) => {
    let data = {
      pt_pin: pin,
    };
    let Host = '';
    let HostArr = ['jdsign.cf', 'signer.nz.lu'];
    if (process.env.SIGN_URL) {
      Host = process.env.SIGN_URL;
    } else {
      Host = HostArr[Math.floor(Math.random() * HostArr.length)];
    }
    let options = {
      url: `https://cdn.nz.lu/pin`,
      body: JSON.stringify(data),
      headers: {
        Host,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88',
      },
      timeout: 30 * 1000,
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getsecretPin API请求失败，请检查网路重试`);
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

function taskUrl(functionId, body) {
  return {
    url: `${JD_API_HOST}?functionId=${functionId}`,
    body,
    headers: {
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'User-Agent': 'okhttp/3.12.1;jdmall;android;version/10.1.2;build/89743;screen/1080x2030;os/9;network/wifi;',
      Accept: '*/*',
      Referer: 'https://h5.m.jd.com/rn/42yjy8na6pFsq1cx9MJQ5aTgu3kX/index.html',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
  };
}
// prettier-ignore

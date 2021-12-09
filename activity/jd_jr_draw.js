/*
京东金融 每周领取权益活动
活动入口：京东金融APP首页-会员中心-生活特权
目前已知领取一次 ，其他的未知。
by:小手冰凉 tg:@chianPLA
交流群：https://t.me/jdPLA2
脚本更新时间：2021-12-6 14:20
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
新手写脚本，难免有bug，能用且用。
============Node===============
[task_local]
#每周领取权益活动
10 17 * 12 * jd jd_draw.js, tag=每周领取权益活动, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_jr_draw.png, enabled=true
*/
const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
const $ = jd_env.env('京东金融每周领取权益活动');
const notify = $.isNode() ? require('../sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';
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
  console.log('目前已知领取一次 ，其他的未知。');
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
      await queryNewRightsDetail();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

function queryNewRightsDetail() {
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://ms.jr.jd.com/gw/generic/hy/h5/m/queryNewRightsDetail?reqData=%7B%22appCode%22:%22jr-vip%22,%22version%22:%222.0%22,%22rid%22:%221007%22,%22drawEnv%22:%22H5%22%7D `,
        headers: {
          Host: 'ms.jr.jd.com',
          Connection: 'keep-alive',
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; HarmonyOS; WLZ-AN00; HMSCore 6.2.0.302) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.105 HuaweiBrowser/12.0.1.300 Mobile Safari/537.36',
          Origin: 'https://m.jr.jd.com',
          Referer: 'https://m.jr.jd.com/member/rights/index.html?utm_term=wxfriends&utm_source=iOS_url_1638418805663&utm_medium=jrappshare',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'zh-CN,zh;q=0.9,th-CN;q=0.8,th;q=0.7,vi-CN;q=0.6,vi;q=0.5,en-US;q=0.4,en;q=0.3',
          cookie: cookie,
        },
      },
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${$.toStr(err)}`);
            console.log(`queryNewRightsDetail API请求失败，请检查网路重试`);
          } else {
            data = JSON.parse(data);
            for (let v of data.resultData.data.subRightsList1) {
              if (v.lifeRightsSubRightsOneMainTitle.indexOf('京豆') !== -1) {
                await drawNewMemberRights1(v.rightsId);
              }
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

function drawNewMemberRights1(rightsId) {
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://ms.jr.jd.com/gw/generic/hy/h5/m/drawNewMemberRights1?reqData=%7B%22appCode%22:%22jr-vip%22,%22version%22:%222.0%22,%22rid%22:${rightsId},%22drawEnv%22:%22H5%22%7D`,
        headers: {
          Host: 'ms.jr.jd.com',
          Connection: 'keep-alive',
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; HarmonyOS; WLZ-AN00; HMSCore 6.2.0.302) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.105 HuaweiBrowser/12.0.1.300 Mobile Safari/537.36',
          Origin: 'https://m.jr.jd.com',
          Referer: 'https://m.jr.jd.com/member/rights/index.html?utm_term=wxfriends&utm_source=iOS_url_1638418805663&utm_medium=jrappshare',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'zh-CN,zh;q=0.9,th-CN;q=0.8,th;q=0.7,vi-CN;q=0.6,vi;q=0.5,en-US;q=0.4,en;q=0.3',
          cookie: cookie,
        },
      },
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${$.toStr(err)}`);
            console.log(`drawNewMemberRights1 API请求失败，请检查网路重试`);
          } else {
            data = JSON.parse(data);
            console.log(data);
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

function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://m.jingxi.com/user/info/GetJDUserBaseInfo?_=${Date.now()}&sceneval=2`,
      headers: {
        Accept: 'application/json,text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        Host: 'm.jingxi.com',
        Cookie: cookie,
        Referer: 'https://st.jingxi.com/my/userinfo.html?sceneval=2&ptag=7205.12.4',
        'User-Agent': `jdapp;android;10.1.3;10;${randomString(
          40
        )};network/wifi;model/WLZ-AN00;addressid/874716028;aid/550eca6b467ca4f3;oaid/00000000-0000-0000-0000-000000000000;osVer/29;appBuild/90017;partner/jingdong;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 10; WLZ-AN00 Build/HUAWEIWLZ-AN00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045714 Mobile Safari/537.36`,
        deviceOS: 'android',
        deviceOSVersion: 10,
        deviceName: 'WeiXin',
      },
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              console.log('1');
              return;
            }
            if (data['retcode'] === 0) {
              $.nickName = data.nickname || $.UserName;
            } else {
              $.nickName = $.UserName;
            }
          } else {
            console.log(`京东服务器返回空数据`);
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

function randomString(e) {
  e = e || 32;
  let t = 'abcdefghijklmnopqrstuvwxyz0123456789',
    a = t.length,
    n = '';
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

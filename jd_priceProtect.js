/*
京东保价
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东保价
10 0,12,23 * * * jd_priceProtect.js, tag=京东保价, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon==============
[Script]
cron "10 0,12,23 * * *" script-path=jd_priceProtect.js,tag=京东保价
===============Surge=================
京东保价 = type=cron,cronexp="10 0,12,23 * * *",wake-system=1,timeout=3600,script-path=jd_priceProtect.js
============小火箭=========
京东保价 = type=cron,script-path=jd_priceProtect.js, cronexpr="10 0,12,23 * * *", timeout=3600, enable=true
 */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东价格保护');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const jsdom = $.isNode() ? require('jsdom') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message,
  allMessage = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  await jstoken();
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.token = '';
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
      await price();
      await $.wait(2000);
    }
  }
  if (allMessage) {
    if ($.isNode()) await notify.sendNotify(`${$.name}`, `${allMessage}`);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function price() {
  let num = 0;
  do {
    $.token = $.jab.getToken() || '';
    if ($.token) {
      await siteppM_skuOnceApply();
    }
    num++;
  } while (num < 3 && !$.token);
  await showMsg();
}

async function siteppM_skuOnceApply() {
  let body = {
    sid: '',
    type: '25',
    forcebot: '',
    token: $.token,
    feSt: $.token ? 's' : 'f',
  };
  return new Promise(async (resolve) => {
    $.post(taskUrl('siteppM_skuOnceApply', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} siteppM_skuOnceApply API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.flag) {
              await $.wait(25 * 1000);
              await siteppM_appliedSuccAmount();
            } else {
              console.log(`保价失败：${data.responseMessage}`);
              message += `保价失败：${data.responseMessage}\n`;
            }
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
function siteppM_appliedSuccAmount() {
  let body = {
    sid: '',
    type: '25',
    forcebot: '',
    num: 15,
  };
  return new Promise((resolve) => {
    $.post(taskUrl('siteppM_appliedSuccAmount', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} siteppM_appliedSuccAmount API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.flag) {
              console.log(`保价成功：返还${data.succAmount}元`);
              message += `保价成功：返还${data.succAmount}元\n`;
            } else {
              console.log(`保价失败：没有可保价的订单`);
            }
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

async function jstoken() {
  const { JSDOM } = jsdom;
  let resourceLoader = new jsdom.ResourceLoader({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:91.0) Gecko/20100101 Firefox/91.0',
    referrer: 'https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu',
  });
  let virtualConsole = new jsdom.VirtualConsole();
  let options = {
    url: 'https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu',
    referrer: 'https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:91.0) Gecko/20100101 Firefox/91.0',
    runScripts: 'dangerously',
    resources: resourceLoader,
    includeNodeLocations: true,
    storageQuota: 10000000,
    pretendToBeVisual: true,
    virtualConsole,
  };
  const { window } = new JSDOM(``, options);
  const jdPriceJs = await downloadUrl('https://js-nocaptcha.jd.com/statics/js/main.min.js');
  try {
    window.eval(jdPriceJs);
    window.HTMLCanvasElement.prototype.getContext = () => {
      return {};
    };
    $.jab = new window.JAB({
      bizId: 'jdjiabao',
      initCaptcha: false,
    });
  } catch (e) {}
}

function downloadUrl(url) {
  return new Promise((resolve) => {
    const options = { url, timeout: 10000 };
    $.get(options, async (err, resp, data) => {
      let res = null;
      try {
        if (err) {
          console.log(`⚠️网络请求失败`);
        } else {
          res = data;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(res);
      }
    });
  });
}

function showMsg() {
  return new Promise((resolve) => {
    if (message) {
      allMessage += `【京东账号${$.index}】${$.nickName || $.UserName}\n${message}${$.index !== cookiesArr.length ? '\n\n' : '\n\n'}`;
    }
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName || $.UserName}\n${message}`);
    resolve();
  });
}

function taskUrl(functionId, body) {
  return {
    url: `${JD_API_HOST}api?appid=siteppM&functionId=${functionId}&forcebot=&t=${Date.now()}`,
    body: `body=${encodeURIComponent(JSON.stringify(body))}`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://msitepp-fm.jd.com',
      'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://msitepp-fm.jd.com/',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
    },
  };
}
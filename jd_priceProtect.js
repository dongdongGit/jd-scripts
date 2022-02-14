/*
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东保价
1 0,12,20 * * * jd_priceProtect.js, tag=京东保价, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

================Loon==============
[Script]
cron "1 0,12,20 * * *" script-path=jd_priceProtect.js,tag=京东保价

===============Surge=================
京东保价 = type=cron,cronexp="1 0,12,20 * * *",wake-system=1,timeout=3600,script-path=jd_priceProtect.js

============小火箭=========
京东保价 = type=cron,script-path=jd_priceProtect.js, cronexpr="1 0,12,20 * * *", timeout=3600, enable=true
 */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东价格保护');
const CryptoJS = require('crypto-js');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const jsdom = $.isNode() ? require('jsdom') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message,
  allMessage = '';
Date.prototype.Format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1, //月份
    'd+': this.getDate(), //日
    'h+': this.getHours(), //小时
    'm+': this.getMinutes(), //分
    's+': this.getSeconds(), //秒
    S: this.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o) if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
  return fmt;
};

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/';
let algo = {
  '3adb2': {},
};
let h5st = '';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  await getAlgo('3adb2');
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
      if (i != cookiesArr.length - 1) {
        await $.wait(2000);
        await jstoken();
      }
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
  let params = {
    code: '3adb2',
    functionId: 'siteppM_priceskusPull',
    body,
  };
  h5st = await getH5st(params);
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
  // const { window } = new JSDOM(``, options);
  // const jdPriceJs = await downloadUrl("https://js-nocaptcha.jd.com/statics/js/main.min.js")
  const dom = new JSDOM(`<body><script src="https://js-nocaptcha.jd.com/statics/js/main.min.js"></script></body>`, options);
  await $.wait(1000);
  try {
    // window.eval(jdPriceJs)
    // window.HTMLCanvasElement.prototype.getContext = () => {
    //   return {};
    // };
    $.jab = new dom.window.JAB({
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
    body: `body=${encodeURIComponent(JSON.stringify(body))}&h5st=${encodeURIComponent(h5st)}`,
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

async function getAlgo(id) {
  let fp = await generateFp();
  algo[id].fingerprint = fp;
  const options = {
    url: `https://cactus.jd.com/request_algo?g_ty=ajax`,
    headers: {
      Authority: 'cactus.jd.com',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
      'Content-Type': 'application/json',
      Origin: 'https://h5.m.jd.com',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      Referer: 'https://h5.m.jd.com/',
      'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7',
    },
    body: JSON.stringify({
      version: '3.0',
      fp: fp,
      appId: id.toString(),
      timestamp: Date.now(),
      platform: 'web',
      expandParams: '',
    }),
  };
  return new Promise(async (resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`request_algo 签名参数API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['status'] === 200) {
              algo[id].token = data.data.result.tk;
              let enCryptMethodJDString = data.data.result.algo;
              if (enCryptMethodJDString) algo[id].enCryptMethodJD = new Function(`return ${enCryptMethodJDString}`)();
              console.log(`获取加密参数成功！`);
            } else {
              console.log(`fp: ${fp}`);
              console.log('request_algo 签名参数API请求失败:');
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
function generateFp() {
  let e = '0123456789';
  let a = 13;
  let i = '';
  for (; a--; ) i += e[(Math.random() * e.length) | 0];
  return (i + Date.now()).slice(0, 16);
}
async function getH5st(params) {
  let date = new Date(),
    timestamp,
    key,
    SHA256;
  timestamp = date.Format('yyyyMMddhhmmssS');
  key = await algo[params.code].enCryptMethodJD(algo[params.code].token, algo[params.code].fingerprint, timestamp, params.code, CryptoJS).toString();
  SHA256 = await getSHA256(key, params, date.getTime());

  return `${timestamp};${algo[params.code].fingerprint};${params.code};${algo[params.code].token};${SHA256};3.0;${date.getTime()}`;
}
function getSHA256(key, params, dete) {
  let SHA256 = CryptoJS.SHA256(JSON.stringify(params.body)).toString();
  let stringSign = `appid:siteppM&body:${SHA256}&&functionId:${params.functionId}&t:${dete}`;
  let hash = CryptoJS.HmacSHA256(stringSign, key);
  let hashInHex = CryptoJS.enc.Hex.stringify(hash);

  return hashInHex;
}

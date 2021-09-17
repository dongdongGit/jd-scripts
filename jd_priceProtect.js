/*
cron 35 0 * * * jd_priceProtect.js
京东价格保护：脚本更新地址 https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master//jd_priceProtect.js
脚本兼容: QuantumultX, Node.js
==========================Quantumultx=========================
打开手机客户端，或者浏览器访问 https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu
[rewrite_local]
https:\/\/api\.m.jd.com\/api\?appid=siteppM&functionId=siteppM_priceskusPull url script-request-body https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_priceProtect.js
[task_local]
# 京东价格保护
5 1 * * * https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_priceProtect.js, tag=京东价格保护, img-url=https://raw.githubusercontent.com/ZCY01/img/master/pricev1.png, enabled=true
*/

const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东价格保护');
let jsdom = require('jsdom');
const unifiedGatewayName = 'https://api.m.jd.com';

// 请先配置 token!!!最好抓APP的！
$.token = '';
$.HyperParam = {
  sid_hid: '',
  type_hid: '3',
  forcebot: '',
};
!(async () => {
  await requireConfig();
  for (let i = 0; i < $.cookiesArr.length; i++) {
    if ($.cookiesArr[i]) {
      $.cookie = $.cookiesArr[i];
      $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      await $.totalBean();
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `X东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {
          'open-url': 'https://bean.m.jd.com/',
        });
        await $.notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `X东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        continue;
      }
      console.log(`\n***********开始【X东账号${$.index}】${$.nickName || $.UserName}********\n`);
      await jstoken();
      $.refundtotalamount = 0;
      console.log(`$.token\n'${$.token}`);
      //$.token = $.tokenList.length > i ? $.tokenList[i] : ($.token || '')
      $.feSt = $.token ? 's' : 'f';

      $.applied = false;
      await onceApply();
      if ($.applied) {
        await checkOnceAppliedResult();
      }
      await showMsg();
      await $.wait(1000);
    }
  }
})()
  .catch((e) => {
    console.log(`❗️ ${$.name} 运行错误！\n${e}`);
  })
  .finally(() => $.done());

function requireConfig() {
  return new Promise((resolve) => {
    console.log('开始获取配置文件\n');
    $.notify = $.isNode() ? require('./sendNotify') : { sendNotify: async () => {} };
    //获取 Cookies
    $.cookiesArr = [];
    if ($.isNode()) {
      //Node.js用户请在jdCookie.js处填写X东ck;
      const jdCookieNode = require('./jdCookie.js');
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          $.cookiesArr.push(jdCookieNode[item]);
        }
      });
      if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
    } else {
      //IOS等用户直接用NobyDa的jd $.cookie
      $.cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
    }
    console.log(`共${$.cookiesArr.length}个X东账号\n`);
    resolve();
  });
}

function onceApply() {
  return new Promise((resolve, reject) => {
    let paramObj = {};
    paramObj.sid = $.HyperParam.sid_hid;
    paramObj.type = $.HyperParam.type_hid;
    paramObj.forcebot = $.HyperParam.forcebot;
    paramObj.token = $.token;
    paramObj.feSt = $.feSt;

    let options = taskurl('siteppM_skuOnceApply', paramObj);
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.flag) {
            $.applied = true;
          } else {
            console.log(`一键价格保护失败，原因：${data.responseMessage}`);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

function checkOnceAppliedResult() {
  return new Promise((resolve, reject) => {
    let paramObj = {};
    paramObj.sid = $.HyperParam.sid_hid;
    paramObj.type = $.HyperParam.type_hid;
    paramObj.forcebot = $.forcebot;
    paramObj.num = 20;

    let options = taskurl('siteppM_appliedSuccAmount', paramObj);
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.flag) {
            $.refundtotalamount = data.succAmount;
          } else {
            console.log(`一键价格保护结果：${JSON.stringify(data)}`);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

function taskurl(functionid, body) {
  const urlStr = `${unifiedGatewayName}/api?appid=siteppM&functionId=${functionid}&forcebot=${$.HyperParam.forcebot}&t=${new Date().getTime()}`;
  return {
    url: urlStr,
    headers: {
      Host: 'api.m.jd.com',
      Accept: '*/*',
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://msitepp-fm.jd.com',
      Connection: 'keep-alive',
      Referer: 'https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      Cookie: $.cookie,
    },
    body: body ? `body=${encodeURIComponent(JSON.stringify(body))}` : undefined,
  };
}

async function showMsg() {
  const message = `X东账号${$.index} ${$.nickName || $.UserName}\n🎉 本次价格保护金额：${$.refundtotalamount}💰`;
  console.log(message);
  if ($.refundtotalamount) {
    $.msg($.name, ``, message, {
      'open-url': 'https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu',
    });
    await $.notify.sendNotify($.name, message);
  }
}
async function jstoken() {
  let { JSDOM } = jsdom;
  resourceLoader = new jsdom.ResourceLoader({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:91.0) Gecko/20100101 Firefox/91.0',
    referrer: 'https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu?sid=0b5a9d5564059f36ed16a8967c37e24w',
  });
  var options = {
    referrer: 'https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu?sid=0b5a9d5564059f36ed16a8967c37e24w',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:91.0) Gecko/20100101 Firefox/91.0',
    runScripts: 'dangerously',
    resources: resourceLoader,
    //  cookieJar,
    includeNodeLocations: true,
    storageQuota: 10000000,
    pretendToBeVisual: true,
  };
  $.dom = new JSDOM(`<body><script src="https://js-nocaptcha.jd.com/statics/js/main.min.js"></script></body>`, options);
  //
  // 屏蔽error错误
  //
  console.error = function () {};
  await $.wait(1000);
  try {
    feSt = 's';
    jab = new $.dom.window.JAB({
      bizId: 'jdjiabao',
      initCaptcha: false,
    });
    $.token = jab.getToken();
  } catch (e) {}
}

/* 
cron 14 10 * * * https://raw.githubusercontent.com/smiek2121/scripts/master/jd_sign_graphics.js

*/

// const validator = require('./JDJRValidator_Pure.js');
// const Faker=require('./sign_graphics_validate.js');
const config = require('./utils/config.js');
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东签到图形验证');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
// CryptoScripts()
$.CryptoJS = $.isNode() ? require('crypto-js') : CryptoJS;
let cookiesArr = [],
  cookie = '';

let message = '',
  subTitle = '',
  beanNum = 0;
let fp = '';
let eid = '';
let signFlag = false;
let successNum = 0;
let errorNum = 0;
let JD_API_HOST = 'https://jdjoy.jd.com';
$.invokeKey = config.invokeKey;
let lkt = 0;

if ($.isNode()) {
  if (process.env.JOY_HOST) {
    JD_API_HOST = process.env.JOY_HOST;
  }
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
// getUA()
// $.get = validator.injectToRequest($.get.bind($), 'channelSign', $.UA)
// $.post = validator.injectToRequest($.post.bind($), 'channelSign', $.UA)

const turnTableId = [
  { name: '京东商城-健康', id: 527, url: 'https://prodev.m.jd.com/mall/active/w2oeK5yLdHqHvwef7SMMy4PL8LF/index.html' },
  { name: '京东商城-清洁', id: 446, url: 'https://prodev.m.jd.com/mall/active/2Tjm6ay1ZbZ3v7UbriTj6kHy9dn6/index.html' },
  { name: '京东商城-个护', id: 336, url: 'https://prodev.m.jd.com/mall/active/2tZssTgnQsiUqhmg5ooLSHY9XSeN/index.html' },
  { name: '京东商城-母婴', id: 458, url: 'https://prodev.m.jd.com/mall/active/3BbAVGQPDd6vTyHYjmAutXrKAos6/index.html' },
  { name: '京东商城-数码', id: 347, url: 'https://prodev.m.jd.com/mall/active/4SWjnZSCTHPYjE5T7j35rxxuMTb6/index.html' },
  { name: 'PLUS会员定制', id: 1265, url: 'https://prodev.m.jd.com/mall/active/N9MpLQdxZgiczZaMx2SzmSfZSvF/index.html' },
  { name: '京东商城-童装', id: 511, url: 'https://prodev.m.jd.com/mall/active/3Af6mZNcf5m795T8dtDVfDwWVNhJ/index.html' },
  { name: '京东商城-内衣', id: 1071, url: 'https://prodev.m.jd.com/mall/active/4PgpL1xqPSW1sVXCJ3xopDbB1f69/index.html' },
  { name: '京东超市', id: 1204, url: 'https://pro.m.jd.com/mall/active/QPwDgLSops2bcsYqQ57hENGrjgj/index.html' },
];

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.nickName = '';
      $.isLogin = true;
      await $.totalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      beanNum = 0;
      successNum = 0;
      errorNum = 0;
      invalidNum = 0;
      subTitle = '';
      lkt = new Date().getTime();
      await getUA();
      await signRun();
      const UTC8 = new Date().getTime() + new Date().getTimezoneOffset() * 60000 + 28800000;
      $.beanSignTime = new Date(UTC8).toLocaleString('zh', { hour12: false }).replace(' 24:', ' 00:');
      let msg = `【京东账号${$.index}】${$.nickName || $.UserName}\n【签到时间】:  ${$.beanSignTime}\n【签到概览】:  成功${successNum}个, 失败${errorNum}个${
        (invalidNum && '，失效' + invalidNum + '个') || ''
      }\n${(beanNum > 0 && '【签到奖励】:  ' + beanNum + '京豆') || ''}\n`;
      message += msg + '\n';
      if ($.isNode()) $.msg($.name, msg);
    }
  }
  await showMsg();
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function showMsg() {
  $.msg($.name, `【签到数量】:  ${turnTableId.length}个\n` + subTitle + message);
  if ($.isNode() && message) await notify.sendNotify(`${$.name}`, `【签到数量】:  ${turnTableId.length}个\n` + subTitle + message);
}
async function signRun() {
  for (let i in turnTableId) {
    signFlag = 0;
    await Login(i);
    if (signFlag == 1) {
      successNum++;
    } else if (signFlag == 2) {
      invalidNum++;
    } else {
      errorNum++;
    }
    let time = Math.random() * 4000
    console.log(`等待${(time/1000).toFixed(3)}秒`)
    await $.wait(parseInt(time, 10))
  }
}

function Login(i) {
  return new Promise(async (resolve) => {
    $.appId = '9a4de';
    await requestAlgo();
    $.get(taskUrl(turnTableId[i].id), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${turnTableId[i].name} 登录: API查询请求失败 ‼️‼️`);
          console.log(`${JSON.stringify(err)}`);
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data);
            if (data.success && data.data) {
              data = data.data;
              if (data.hasSign === false) {
                // let arr = await Faker.getBody($.UA,turnTableId[i].url)
                // fp = arr.fp
                // await getEid(arr)
                $.appId = 'b342e';
                await requestAlgo();
                await Sign(i, 1);
                let time = Math.random() * 4000
                console.log(`等待${(time/1000).toFixed(3)}秒`)
                await $.wait(parseInt(time, 10))
              } else if (data.hasSign === true) {
                if (data.records && data.records[0]) {
                  for (let i in data.records) {
                    let item = data.records[i];
                    if ((item.hasSign == false && item.index != 1) || i == data.records.length - 1) {
                      if (item.hasSign == false) i = i - 1;
                      // beanNum += Number(data.records[i].beanQuantity)
                      break;
                    }
                  }
                }
                signFlag = 1;
                console.log(`${turnTableId[i].name} 已签到`);
              } else {
                signFlag = 2;
                console.log(`${turnTableId[i].name} 无法签到\n签到地址:${turnTableId[i].url}\n`);
              }
            } else {
              if (data.errorMessage) {
                if (data.errorMessage.indexOf('已签到') > -1 || data.errorMessage.indexOf('今天已经签到') > -1) {
                  signFlag = 1;
                }
                console.log(`${turnTableId[i].name} ${data.errorMessage}`);
              } else {
                console.log(`${turnTableId[i].name} ${JSON.stringify(data)}`);
              }
            }
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`);
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
function Sign(i, t) {
  return new Promise((resolve) => {
    let options = tasPostkUrl(turnTableId[i].id);
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${turnTableId[i].name} 签到: API查询请求失败 ‼️‼️`);
          throw new Error(err);
        } else {
          let res = $.toObj(data, data);
          if (typeof res === 'object') {
            if (res.success && res.data) {
              let resData = res.data;
              if (Number(resData.jdBeanQuantity) > 0) beanNum += Number(resData.jdBeanQuantity);
              signFlag = true;
              console.log(`${turnTableId[i].name} 签到成功:获得 ${Number(resData.jdBeanQuantity)}京豆`);
            } else {
              if (res.errorMessage) {
                if (res.errorMessage.indexOf('已签到') > -1 || res.errorMessage.indexOf('今天已经签到') > -1) {
                  signFlag = true;
                }
                if (res.errorMessage.indexOf('火爆') > -1 && t == 1) {
                  await Sign(i, 2);
                } else {
                  console.log(`${turnTableId[i].name} ${res.errorMessage}`);
                }
              } else {
                console.log(`${turnTableId[i].name} ${data}`);
              }
            }
          } else {
            console.log(`${turnTableId[i].name} ${data}`);
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

function getEid(arr) {
  return new Promise((resolve) => {
    const options = {
      url: `https://gia.jd.com/fcf.html?a=${arr.a}`,
      body: `d=${arr.d}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': $.UA,
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${turnTableId[i].name} 登录: API查询请求失败 ‼️‼️`);
          throw new Error(err);
        } else {
          if (data.indexOf('*_*') > 0) {
            data = data.split('*_*', 2);
            data = JSON.parse(data[1]);
            eid = data.eid;
          } else {
            console.log(`京豆api返回数据为空，请检查自身原因`);
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

function taskUrl(turnTableId) {
  let time = Date.now();
  let body = { turnTableId: `${turnTableId}` };
  let t = [
    { key: 'appid', value: 'jdchoujiang_h5' },
    { key: 'body', value: $.CryptoJS.SHA256($.toStr(body, body)).toString() },
    { key: 'client', value: '' },
    { key: 'clientVersion', value: '' },
    { key: 'functionId', value: 'turncardChannelDetail' },
    { key: 't', value: time },
  ];
  let h5st = geth5st(t) || 'undefined';
  let url = `https://api.m.jd.com/api?client=&clientVersion=&appid=jdchoujiang_h5&t=${time}&functionId=turncardChannelDetail&body=${escape(JSON.stringify(body))}&h5st=${h5st}`;
  return {
    url,
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      Cookie: cookie,
      Origin: 'https://prodev.m.jd.com',
      Referer: 'https://prodev.m.jd.com/',
      'User-Agent': $.UA,
    },
  };
}
function tasPostkUrl(turnTableId) {
  let time = Date.now();
  let body = { turnTableId: `${turnTableId}`, fp: '', eid: '' };
  let t = [
    { key: 'appid', value: 'jdchoujiang_h5' },
    { key: 'body', value: $.CryptoJS.SHA256($.toStr(body, body)).toString() },
    { key: 'client', value: '' },
    { key: 'clientVersion', value: '' },
    { key: 'functionId', value: 'turncardChannelSign' },
    { key: 't', value: time },
  ];
  let h5st = geth5st(t) || 'undefined';
  let url = `https://api.m.jd.com/api?client=&clientVersion=&appid=jdchoujiang_h5&functionId=turncardChannelSign&t=${time}&body=${escape(JSON.stringify(body))}&h5st=${h5st}`;
  return {
    url,
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Cookie: cookie,
      Origin: 'https://prodev.m.jd.com',
      Referer: 'https://prodev.m.jd.com/',
      'User-Agent': $.UA,
    },
  };
}

async function requestAlgo() {
  var s = '',
    a = '0123456789',
    u = a,
    c = (Math.random() * 10) | 0;
  do {
    ss = getRandomIDPro({ size: 1, customDict: a }) + '';
    if (s.indexOf(ss) == -1) s += ss;
  } while (s.length < 3);
  for (let i of s.slice()) u = u.replace(i, '');
  $.fp = getRandomIDPro({ size: c, customDict: u }) + '' + s + getRandomIDPro({ size: 14 - (c + 3) + 1, customDict: u }) + c + '';
  let opts = {
    url: `https://cactus.jd.com/request_algo?g_ty=ajax`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Origin: 'https://prodev.m.jd.com',
      Referer: 'https://prodev.m.jd.com/',
      'User-Agent': $.UA,
    },
    body: `{"version":"3.0","fp":"${$.fp}","appId":"${$.appId}","timestamp":${Date.now()},"platform":"web","expandParams":""}`,
  };
  return new Promise(async (resolve) => {
    $.post(opts, (err, resp, data) => {
      try {
        const { ret, msg, data: { result } = {} } = JSON.parse(data);
        $.token = result.tk;
        $.genKey = new Function(`return ${result.algo}`)();
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function getRandomIDPro() {
  var e,
    t,
    a = void 0 === (n = (t = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {}).size) ? 10 : n,
    n = void 0 === (n = t.dictType) ? 'number' : n,
    i = '';
  if ((t = t.customDict) && 'string' == typeof t) e = t;
  else
    switch (n) {
      case 'alphabet':
        e = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        break;
      case 'max':
        e = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
        break;
      case 'number':
      default:
        e = '0123456789';
    }

  for (; a--; ) i += e[(Math.random() * e.length) | 0];
  return i;
}
function geth5st(t) {
  // return ''
  let a = t
    .map(function (e) {
      return e['key'] + ':' + e['value'];
    })
    ['join']('&');
  let time = Date.now();
  let hash1 = '';
  let timestamp = format('yyyyMMddhhmmssSSS', time);
  hash1 = $.genKey($.token, $.fp.toString(), timestamp.toString(), $.appId.toString(), $.CryptoJS).toString();
  const hash2 = $.CryptoJS.HmacSHA256(a, hash1.toString()).toString();
  let h5st = [''.concat(timestamp.toString()), ''.concat($.fp.toString()), ''.concat($.appId.toString()), ''.concat($.token), ''.concat(hash2), '3.0', ''.concat(time)].join(';');
  return encodeURIComponent(h5st);
}
function format(a, time) {
  if (!a) a = 'yyyy-MM-dd';
  var t;
  if (!time) {
    t = Date.now();
  } else {
    t = new Date(time);
  }
  var e,
    n = new Date(t),
    d = a,
    l = {
      'M+': n.getMonth() + 1,
      'd+': n.getDate(),
      'D+': n.getDate(),
      'h+': n.getHours(),
      'H+': n.getHours(),
      'm+': n.getMinutes(),
      's+': n.getSeconds(),
      'w+': n.getDay(),
      'q+': Math.floor((n.getMonth() + 3) / 3),
      'S+': n.getMilliseconds(),
    };
  /(y+)/i.test(d) && (d = d.replace(RegExp.$1, ''.concat(n.getFullYear()).substr(4 - RegExp.$1.length)));
  Object.keys(l).forEach((e) => {
    if (new RegExp('('.concat(e, ')')).test(d)) {
      var t,
        a = 'S+' === e ? '000' : '00';
      d = d.replace(RegExp.$1, 1 == RegExp.$1.length ? l[e] : ''.concat(a).concat(l[e]).substr(''.concat(l[e]).length));
    }
  });
  return d;
}
function getUA() {
  $.UA = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36`;
}

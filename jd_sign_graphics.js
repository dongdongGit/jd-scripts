/* 
14 10 * * * jd_sign_graphics.js

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

const validatorCount = process.env.JDJR_validator_Count ? process.env.JDJR_validator_Count : 100;
const PNG = require('png-js');
const https = require('https');
const stream = require('stream');
const zlib = require('zlib');
const vm = require('vm');

let message = '',
  subTitle = '',
  beanNum = 0;
let fp = '';
let eid = '';
let signFlag = false;
let successNum = 0;
let errorNum = 0;
let JD_API_HOST = 'https://jdjoy.jd.com';
$.invokeKey = 'q8DNJdpcfRQ69gIx';
$.invokeKey = $.isNode() ? (process.env.JD_invokeKey ? process.env.JD_invokeKey : `${$.invokeKey}`) : $.getdata('JD_invokeKey') ? $.getdata('JD_invokeKey') : `${$.invokeKey}`;
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

const turnTableId = [
  { name: '京东商城-健康', id: 527, url: 'https://prodev.m.jd.com/mall/active/w2oeK5yLdHqHvwef7SMMy4PL8LF/index.html' },
  { name: '京东商城-清洁', id: 446, url: 'https://prodev.m.jd.com/mall/active/2Tjm6ay1ZbZ3v7UbriTj6kHy9dn6/index.html' },
  { name: '京东商城-个护', id: 336, url: 'https://prodev.m.jd.com/mall/active/2tZssTgnQsiUqhmg5ooLSHY9XSeN/index.html' },
  { name: '京东商城-母婴', id: 458, url: 'https://prodev.m.jd.com/mall/active/3BbAVGQPDd6vTyHYjmAutXrKAos6/index.html' },
  { name: '京东商城-数码', id: 347, url: 'https://prodev.m.jd.com/mall/active/4SWjnZSCTHPYjE5T7j35rxxuMTb6/index.html' },
  { name: 'PLUS会员定制', id: 1265, url: 'https://prodev.m.jd.com/mall/active/N9MpLQdxZgiczZaMx2SzmSfZSvF/index.html' },
  // { "name": "京东商城-童装", "id": 511, "url": "https://prodev.m.jd.com/mall/active/3Af6mZNcf5m795T8dtDVfDwWVNhJ/index.html" },
  // { "name": "京东商城-内衣", "id": 1071, "url": "https://prodev.m.jd.com/mall/active/4PgpL1xqPSW1sVXCJ3xopDbB1f69/index.html" },
  // { "name": "京东超市", "id": 1204, "url": "https://pro.m.jd.com/mall/active/QPwDgLSops2bcsYqQ57hENGrjgj/index.html" },
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
    $.validatorUrl = turnTableId[i].url || '';
    signFlag = 0;
    await Login(i);
    if (signFlag == 1) {
      successNum++;
    } else if (signFlag == 2) {
      invalidNum++;
    } else {
      errorNum++;
    }
    let time = Math.random() * 2000 + 2000;
    console.log(`等待${(time / 1000).toFixed(3)}秒`);
    await $.wait(parseInt(time, 10));
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
                // console.log("验证码："+$.validate)
                if ($.validate) {
                  if ($.validatorTime < 33) {
                    let time = Math.random() * 5000 + 33000 - $.validatorTime * 1000;
                    console.log(`等待${(time / 1000).toFixed(3)}秒`);
                    await $.wait(parseInt(time, 10));
                  }
                  await Sign(i, 3);
                }
                let time = Math.random() * 5000 + 32000;
                console.log(`等待${(time / 1000).toFixed(3)}秒`);
                await $.wait(parseInt(time, 10));
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
          $.validate = '';
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
                } else if (res.errorMessage.indexOf('进行验证') > -1) {
                  await injectToRequest('channelSign');
                } else if (res.errorMessage.indexOf('火爆') > -1 && t == 2) {
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
  let url = `https://api.m.jd.com/api?client=&clientVersion=&appid=jdchoujiang_h5&t=${time}&functionId=turncardChannelDetail&body=${JSON.stringify(body)}&h5st=${h5st}`;
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
  let body = { turnTableId: `${turnTableId}`, fp: fp, eid: eid };
  if ($.validate) {
    body['validate'] = $.validate;
  }
  let t = [
    { key: 'appid', value: 'jdchoujiang_h5' },
    { key: 'body', value: $.CryptoJS.SHA256($.toStr(body, body)).toString() },
    { key: 'client', value: '' },
    { key: 'clientVersion', value: '' },
    { key: 'functionId', value: 'turncardChannelSign' },
    { key: 't', value: time },
  ];
  let h5st = geth5st(t) || 'undefined';
  let url = `https://api.m.jd.com/api?client=&clientVersion=&appid=jdchoujiang_h5&functionId=turncardChannelSign&t=${time}&body=${JSON.stringify(body)}&h5st=${h5st}`;
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
  return h5st;
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
function jsonParse(str) {
  if (typeof str == 'string') {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie');
      return [];
    }
  }
}

function getUA() {
  $.UA = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36`;
}
function randomString(e) {
  e = e || 32;
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

async function injectToRequest(scene = 'cww') {
  console.log('JDJR验证中......');
  let res = await new JDJRValidator().run(scene, eid);
  if (res.validate) {
    $.validate = res.validate;
  }
}

Math.avg = function average() {
  var sum = 0;
  var len = this.length;
  for (var i = 0; i < len; i++) {
    sum += this[i];
  }
  return sum / len;
};

function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
class PNGDecoder extends PNG {
  constructor(args) {
    super(args);
    this.pixels = [];
  }
  decodeToPixels() {
    return new Promise((resolve) => {
      this.decode((pixels) => {
        this.pixels = pixels;
        resolve();
      });
    });
  }
  getImageData(x, y, w, h) {
    const { pixels } = this;
    const len = w * h * 4;
    const startIndex = x * 4 + y * (w * 4);
    return { data: pixels.slice(startIndex, startIndex + len) };
  }
}
const PUZZLE_GAP = 8;
const PUZZLE_PAD = 10;
class PuzzleRecognizer {
  constructor(bg, patch, y) {
    // console.log(bg);
    const imgBg = new PNGDecoder(Buffer.from(bg, 'base64'));
    const imgPatch = new PNGDecoder(Buffer.from(patch, 'base64'));
    // console.log(imgBg);
    this.bg = imgBg;
    this.patch = imgPatch;
    this.rawBg = bg;
    this.rawPatch = patch;
    this.y = y;
    this.w = imgBg.width;
    this.h = imgBg.height;
    // this.w = 260;
    // this.h = 101;
  }
  async run() {
    await this.bg.decodeToPixels();
    await this.patch.decodeToPixels();
    return this.recognize();
  }

  recognize() {
    const { ctx, w: width, bg } = this;
    const { width: patchWidth, height: patchHeight } = this.patch;
    const posY = this.y + PUZZLE_PAD + (patchHeight - PUZZLE_PAD) / 2 - PUZZLE_GAP / 2;
    // const cData = ctx.getImageData(0, a.y + 10 + 20 - 4, 360, 8).data;
    const cData = bg.getImageData(0, posY, width, PUZZLE_GAP).data;
    const lumas = [];
    for (let x = 0; x < width; x++) {
      var sum = 0;
      // y xais
      for (let y = 0; y < PUZZLE_GAP; y++) {
        var idx = x * 4 + y * (width * 4);
        var r = cData[idx];
        var g = cData[idx + 1];
        var b = cData[idx + 2];
        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sum += luma;
      }
      lumas.push(sum / PUZZLE_GAP);
    }
    const n = 2; // minium macroscopic image width (px)
    const margin = patchWidth - PUZZLE_PAD;
    const diff = 20; // macroscopic brightness difference
    const radius = PUZZLE_PAD;
    for (let i = 0, len = lumas.length - 2 * 4; i < len; i++) {
      const left = (lumas[i] + lumas[i + 1]) / n;
      const right = (lumas[i + 2] + lumas[i + 3]) / n;
      const mi = margin + i;
      const mLeft = (lumas[mi] + lumas[mi + 1]) / n;
      const mRigth = (lumas[mi + 2] + lumas[mi + 3]) / n;
      if (left - right > diff && mLeft - mRigth < -diff) {
        const pieces = lumas.slice(i + 2, margin + i + 2);
        const median = pieces.sort((x1, x2) => x1 - x2)[20];
        const avg = Math.avg(pieces);
        // noise reducation
        if (median > left || median > mRigth) return;
        if (avg > 100) return;
        // console.table({left,right,mLeft,mRigth,median});
        // ctx.fillRect(i+n-radius, 0, 1, 360);
        // console.log(i+n-radius);
        return i + n - radius;
      }
    }

    // not found
    return -1;
  }

  runWithCanvas() {
    const { createCanvas, Image } = require('canvas');
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d');
    const imgBg = new Image();
    const imgPatch = new Image();
    const prefix = 'data:image/png;base64,';
    imgBg.src = prefix + this.rawBg;
    imgPatch.src = prefix + this.rawPatch;
    const { naturalWidth: w, naturalHeight: h } = imgBg;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imgBg, 0, 0, w, h);
    const width = w;
    const { naturalWidth, naturalHeight } = imgPatch;
    const posY = this.y + PUZZLE_PAD + (naturalHeight - PUZZLE_PAD) / 2 - PUZZLE_GAP / 2;
    // const cData = ctx.getImageData(0, a.y + 10 + 20 - 4, 360, 8).data;
    const cData = ctx.getImageData(0, posY, width, PUZZLE_GAP).data;
    const lumas = [];
    for (let x = 0; x < width; x++) {
      var sum = 0;
      // y xais
      for (let y = 0; y < PUZZLE_GAP; y++) {
        var idx = x * 4 + y * (width * 4);
        var r = cData[idx];
        var g = cData[idx + 1];
        var b = cData[idx + 2];
        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sum += luma;
      }
      lumas.push(sum / PUZZLE_GAP);
    }
    const n = 2; // minium macroscopic image width (px)
    const margin = naturalWidth - PUZZLE_PAD;
    const diff = 20; // macroscopic brightness difference
    const radius = PUZZLE_PAD;
    for (let i = 0, len = lumas.length - 2 * 4; i < len; i++) {
      const left = (lumas[i] + lumas[i + 1]) / n;
      const right = (lumas[i + 2] + lumas[i + 3]) / n;
      const mi = margin + i;
      const mLeft = (lumas[mi] + lumas[mi + 1]) / n;
      const mRigth = (lumas[mi + 2] + lumas[mi + 3]) / n;
      if (left - right > diff && mLeft - mRigth < -diff) {
        const pieces = lumas.slice(i + 2, margin + i + 2);
        const median = pieces.sort((x1, x2) => x1 - x2)[20];
        const avg = Math.avg(pieces);
        // noise reducation
        if (median > left || median > mRigth) return;
        if (avg > 100) return;
        // console.table({left,right,mLeft,mRigth,median});
        // ctx.fillRect(i+n-radius, 0, 1, 360);
        // console.log(i+n-radius);
        return i + n - radius;
      }
    }
    // not found
    return -1;
  }
}
const DATA = {
  appId: '17839d5db83',
  product: 'embed',
  lang: 'zh_CN',
};
const SERVER = 'iv.jd.com';
class JDJRValidator {
  constructor() {
    this.data = {};
    this.x = 0;
    this.t = Date.now();
    this.count = 0;
  }
  async run(scene = 'cww', eid = '') {
    const tryRecognize = async () => {
      const x = await this.recognize(scene, eid);
      if (x > 0) {
        return x;
      }
      // retry
      return await tryRecognize();
    };
    const puzzleX = await tryRecognize();
    // console.log(puzzleX);
    const pos = new MousePosFaker(puzzleX).run();
    const d = getCoordinate(pos);
    // console.log(pos[pos.length-1][2] -Date.now());
    // await sleep(4500);
    await sleep(pos[pos.length - 1][2] - Date.now());
    this.count++;
    const result = await JDJRValidator.jsonp('/slide/s.html', { d, ...this.data }, scene);
    if (result.message === 'success') {
      // console.log(result);
      $.validatorTime = (Date.now() - this.t) / 1000;
      console.log(`JDJR验证用时: ${$.validatorTime}秒`);
      return result;
    } else {
      console.log(`验证失败: ${this.count}/${validatorCount}`);
      // console.log(JSON.stringify(result));
      if (this.count >= validatorCount) {
        console.log('JDJR验证次数已达上限，退出验证');
        return result;
      } else {
        // await sleep(300);
        return await this.run(scene, eid);
      }
    }
  }

  async recognize(scene, eid) {
    const data = await JDJRValidator.jsonp('/slide/g.html', { e: eid }, scene);
    const { bg, patch, y } = data;
    // const uri = 'data:image/png;base64,';
    // const re = new PuzzleRecognizer(uri+bg, uri+patch, y);
    const re = new PuzzleRecognizer(bg, patch, y);
    // console.log(JSON.stringify(re))
    const puzzleX = await re.run();

    if (puzzleX > 0) {
      this.data = {
        c: data.challenge,
        w: re.w,
        e: eid,
        s: '',
        o: '',
        o1: 0,
        u: $.validatorUrl || 'https://prodev.m.jd.com',
      };
      this.x = puzzleX;
    }
    return puzzleX;
  }

  async report(n) {
    console.time('PuzzleRecognizer');
    let count = 0;

    for (let i = 0; i < n; i++) {
      const x = await this.recognize();

      if (x > 0) count++;
      if (i % 50 === 0) {
        // console.log('%f\%', (i / n) * 100);
      }
    }

    console.log('验证成功: %f%', (count / n) * 100);
    console.clear();
    console.timeEnd('PuzzleRecognizer');
  }

  static jsonp(api, data = {}, scene) {
    return new Promise((resolve, reject) => {
      const fnId = `jsonp_${String(Math.random()).replace('.', '')}`;
      const extraData = { callback: fnId };
      const query = new URLSearchParams({ ...DATA, ...{ scene: scene }, ...data, ...extraData }).toString();
      const url = `https://${SERVER}${api}?${query}`;
      const headers = {
        Accept: '*/*',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        Connection: 'keep-alive',
        Host: 'iv.jd.com',
        Referer: 'https://prodev.m.jd.com/',
        'User-Agent': $.UA,
      };

      const req = https.get(url, { headers }, (response) => {
        let res = response;
        if (res.headers['content-encoding'] === 'gzip') {
          const unzipStream = new stream.PassThrough();
          stream.pipeline(response, zlib.createGunzip(), unzipStream, reject);
          res = unzipStream;
        }
        res.setEncoding('utf8');

        let rawData = '';

        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            const ctx = {
              [fnId]: (data) => (ctx.data = data),
              data: {},
            };

            vm.createContext(ctx);
            vm.runInContext(rawData, ctx);

            // console.log(ctx.data);
            res.resume();
            resolve(ctx.data);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

function getCoordinate(c) {
  function string10to64(d) {
    var c = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-~'.split(''),
      b = c.length,
      e = +d,
      a = [];
    do {
      mod = e % b;
      e = (e - mod) / b;
      a.unshift(c[mod]);
    } while (e);
    return a.join('');
  }

  function prefixInteger(a, b) {
    return (Array(b).join(0) + a).slice(-b);
  }

  function pretreatment(d, c, b) {
    var e = string10to64(Math.abs(d));
    var a = '';
    if (!b) {
      a += d > 0 ? '1' : '0';
    }
    a += prefixInteger(e, c);
    return a;
  }

  var b = new Array();
  for (var e = 0; e < c.length; e++) {
    if (e == 0) {
      b.push(pretreatment(c[e][0] < 262143 ? c[e][0] : 262143, 3, true));
      b.push(pretreatment(c[e][1] < 16777215 ? c[e][1] : 16777215, 4, true));
      b.push(pretreatment(c[e][2] < 4398046511103 ? c[e][2] : 4398046511103, 7, true));
    } else {
      var a = c[e][0] - c[e - 1][0];
      var f = c[e][1] - c[e - 1][1];
      var d = c[e][2] - c[e - 1][2];
      b.push(pretreatment(a < 4095 ? a : 4095, 2, false));
      b.push(pretreatment(f < 4095 ? f : 4095, 2, false));
      b.push(pretreatment(d < 16777215 ? d : 16777215, 4, true));
    }
  }
  return b.join('');
}

const HZ = 20;

class MousePosFaker {
  constructor(puzzleX) {
    this.x = parseInt(Math.random() * 20 + 20, 10);
    this.y = parseInt(Math.random() * 80 + 80, 10);
    this.t = Date.now();
    this.pos = [[this.x, this.y, this.t]];
    this.minDuration = parseInt(1000 / HZ, 10);
    // this.puzzleX = puzzleX;
    this.puzzleX = puzzleX + parseInt(Math.random() * 2 - 1, 10);

    this.STEP = parseInt(Math.random() * 6 + 5, 10);
    this.DURATION = parseInt(Math.random() * 7 + 14, 10) * 100;
    // [9,1600] [10,1400]
    this.STEP = 9;
    // this.DURATION = 2000;
    // console.log(this.STEP, this.DURATION);
  }

  run() {
    const perX = this.puzzleX / this.STEP;
    const perDuration = this.DURATION / this.STEP;
    const firstPos = [this.x - parseInt(Math.random() * 6, 10), this.y + parseInt(Math.random() * 11, 10), this.t];

    this.pos.unshift(firstPos);
    this.stepPos(perX, perDuration);
    this.fixPos();

    const reactTime = parseInt(60 + Math.random() * 100, 10);
    const lastIdx = this.pos.length - 1;
    const lastPos = [this.pos[lastIdx][0], this.pos[lastIdx][1], this.pos[lastIdx][2] + reactTime];

    this.pos.push(lastPos);
    return this.pos;
  }

  stepPos(x, duration) {
    let n = 0;
    const sqrt2 = Math.sqrt(2);
    for (let i = 1; i <= this.STEP; i++) {
      n += 1 / i;
    }
    for (let i = 0; i < this.STEP; i++) {
      x = this.puzzleX / (n * (i + 1));
      const currX = parseInt(Math.random() * 30 - 15 + x, 10);
      const currY = parseInt(Math.random() * 7 - 3, 10);
      const currDuration = parseInt((Math.random() * 0.4 + 0.8) * duration, 10);

      this.moveToAndCollect({
        x: currX,
        y: currY,
        duration: currDuration,
      });
    }
  }

  fixPos() {
    const actualX = this.pos[this.pos.length - 1][0] - this.pos[1][0];
    const deviation = this.puzzleX - actualX;

    if (Math.abs(deviation) > 4) {
      this.moveToAndCollect({
        x: deviation,
        y: parseInt(Math.random() * 8 - 3, 10),
        duration: 250,
      });
    }
  }

  moveToAndCollect({ x, y, duration }) {
    let movedX = 0;
    let movedY = 0;
    let movedT = 0;
    const times = duration / this.minDuration;
    let perX = x / times;
    let perY = y / times;
    let padDuration = 0;

    if (Math.abs(perX) < 1) {
      padDuration = duration / Math.abs(x) - this.minDuration;
      perX = 1;
      perY = y / Math.abs(x);
    }

    while (Math.abs(movedX) < Math.abs(x)) {
      const rDuration = parseInt(padDuration + Math.random() * 16 - 4, 10);

      movedX += perX + Math.random() * 2 - 1;
      movedY += perY;
      movedT += this.minDuration + rDuration;

      const currX = parseInt(this.x + movedX, 10);
      const currY = parseInt(this.y + movedY, 10);
      const currT = this.t + movedT;

      this.pos.push([currX, currY, currT]);
    }

    this.x += x;
    this.y += y;
    this.t += Math.max(duration, movedT);
  }
}

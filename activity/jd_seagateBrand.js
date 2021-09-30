/*

https://lzkj-isv.isvjd.com/drawCenter/activity?activityId=78d0a8cb3612470f84bb61981609177f&shopid=1000000174

如需加购请设置环境变量[guaunknownTask_addSku4]为"true"

17 10 * 9,10 * jd_SeagateBrand.js
*/

const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
let $ = jd_env.env('希捷品牌日瓜分百万京豆');
const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';

const notify = $.isNode() ? require('../sendNotify') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
let guaunknownTask_addSku = 'true';
guaunknownTask_addSku = $.isNode()
  ? process.env.guaunknownTask_addSku4
    ? process.env.guaunknownTask_addSku4
    : `${guaunknownTask_addSku}`
  : $.getdata('guaunknownTask_addSku4')
  ? $.getdata('guaunknownTask_addSku4')
  : `${guaunknownTask_addSku}`;
guaunknownTask_addSku = $.isNode()
  ? process.env.guaunknownTask_addSku_All
    ? process.env.guaunknownTask_addSku_All
    : `${guaunknownTask_addSku}`
  : $.getdata('guaunknownTask_addSku_All')
  ? $.getdata('guaunknownTask_addSku_All')
  : `${guaunknownTask_addSku}`;
allMessage = '';
message = '';
let UA = '';
let lz_jdpin_token_cookie = '';
let activityCookie = '';
$.hotFlag = false;
$.outFlag = false;
$.activityId = '758d2381bde04fb49603da3b2bbbc30d';
$.shareUuid = '';
//f71b49e041e445bc80976825056fe289
$.temp = [];
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
      'open-url': 'https://bean.m.jd.com/',
    });
    return;
  }
  console.log(`入口:\nhttps://3.cn/102Qir-AW`);
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      message = '';
      $.bean = 0;
      $.hotFlag = false;
      await getUA();
      $.nickName = '';
      $.isLogin = true;
      await $.totalBean();
      console.log(`\n\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await run();
      if ($.index == 1 && !$.actorUuid) break;
      if ($.outFlag) break;
    }
  }
  if (allMessage) {
    $.msg($.name, ``, `${allMessage}`);
    if ($.isNode()) {
      await notify.sendNotify(`${$.name}`, `${allMessage}`);
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

async function run() {
  try {
    $.Token = '';
    $.Pin = '';
    lz_jdpin_token_cookie = '';
    await takePostRequest('isvObfuscator');
    await getCk();
    await takePostRequest('getSimpleActInfoVo');
    await takePostRequest('getMyPing');
    await takePostRequest('accessLogWithAD');
    $.attrTouXiang = 'https://img10.360buyimg.com/imgzone/jfs/t1/7020/27/13511/6142/5c5138d8E4df2e764/5a1216a3a5043c5d.png';
    await takePostRequest('getUserInfo');
    await takePostRequest('activityContent');
    if (!$.actorUuid) {
      console.log('获取不到[actorUuid]退出执行，请重新执行');
      return;
    }
    await takePostRequest('helpFriend');
    $.taskList = [];
    $.chance = 0;
    await takePostRequest('myInfo');
    console.log(`当前有${$.chance}次机会`);
    await $.wait(parseInt(Math.random() * 1000 + 2000, 10));
    let flag = 0;
    for (let i in $.taskList || []) {
      $.oneTask = $.taskList[i];
      console.log(`${$.oneTask.taskName} ${$.oneTask.curNum}/${$.oneTask.maxNeed}`);
      $.oneProduct = '';
      let num = $.oneTask.maxNeed - $.oneTask.curNum;
      if (num == 0 || $.oneTask.taskName.indexOf('邀请助力') > -1) continue;
      flag = 1;
      if ($.oneTask.taskType == 'followsku' || $.oneTask.taskType == 'scansku' || $.oneTask.taskType == 'add2cart') {
        $.ProductList = [];
        $.runFalag = true;
        $.getProductType = 3;
        if ($.oneTask.taskType == 'scansku') {
          $.getProductType = 4;
        } else if ($.oneTask.taskType == 'add2cart') {
          if (guaunknownTask_addSku + '' != 'true') console.log('\n如需加购请设置环境变量[guaunknownTask_addSku4]为"true"\n');
          if (guaunknownTask_addSku + '' != 'true') continue;
          $.getProductType = 1;
        }
        if (num > 0) await takePostRequest('getProduct');
        for (let p in $.ProductList) {
          $.oneProduct = $.ProductList[p];
          if ($.oneProduct.taskDone !== true) {
            console.log(`[${$.oneTask.taskName}] ${$.oneProduct.name}`);
            await takePostRequest('doTask');
            await $.wait(parseInt(Math.random() * 1000 + 2000, 10));
            if (!$.runFalag) break;
          }
        }
      } else if ($.oneTask.taskType == 'dailysign') {
        await takePostRequest('doTask');
        await $.wait(parseInt(Math.random() * 1000 + 2000, 10));
      } else if ($.oneTask.taskType == 'scanurl') {
        console.log(`[${$.oneTask.taskName}] ${($.toObj($.oneTask.params, '') && $.toObj($.oneTask.params).name) || ''}`);
        await takePostRequest('doTask');
        await $.wait(parseInt(Math.random() * 1000 + 2000, 10));
      }
    }
    if (flag == 1) {
      await takePostRequest('myInfo');
      console.log(`当前有${$.chance}次机会`);
      await $.wait(parseInt(Math.random() * 1000 + 2000, 10));
    }
    $.bean = 0;
    for (i = 1; $.chance--; i++) {
      console.log(`第${i}次抽奖`);
      await takePostRequest('luckyDraw');
      await $.wait(parseInt(Math.random() * 1000 + 2000, 10));
      if (i >= 8) {
        console.log('抽奖次数太多，请再此执行脚本\n后面基本没有奖励了，可以明天再来抽奖');
        break;
      }
    }
    if ($.bean > 0) {
      allMessage += `【京东账号${$.index}】${$.nickName || $.UserName}\n本次运行获得${$.bean}京豆\n`;
    }
    await takePostRequest('myPrize');
    await $.wait(parseInt(Math.random() * 1000 + 4000, 10));
    if ($.hotFlag) {
      console.log('该账号可能是黑号');
      return;
    }
    console.log($.actorUuid);
    console.log(`当前助力:${$.shareUuid}`);
    if ($.index == 1) {
      $.shareUuid = $.actorUuid;
      console.log(`后面的号都会助力:${$.shareUuid}`);
    }
  } catch (e) {
    console.log(e);
  }
}

async function takePostRequest(type) {
  if ($.hotFlag) return;
  let url = '';
  let body = ``;
  let method = 'POST';
  switch (type) {
    case 'isvObfuscator':
      url = `https://api.m.jd.com/client.action?functionId=isvObfuscator`;
      body = `area=16_1315_1316_53522&body=%7B%22url%22%3A%22https%3A%5C/%5C/lzkj-isv.isvjcloud.com%22%2C%22id%22%3A%22%22%7D&build=167814&client=apple&clientVersion=10.1.4&d_brand=apple&d_model=iPhone8%2C1&eid=eidId10b812191seBCFGmtbeTX2vXF3lbgDAVwQhSA8wKqj6OA9J4foPQm3UzRwrrLdO23B3E2wCUY/bODH01VnxiEnAUvoM6SiEnmP3IPqRuO%2By/%2BZo&isBackground=N&joycious=63&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=2f7578cb634065f9beae94d013f172e197d62283&osVersion=13.1.2&partner=apple&rfs=0000&scope=01&screen=750%2A1334&sign=49fb2800eed6700247d65315fa87b0ea&st=1631445914013&sv=121&uemps=0-0&uts=0f31TVRjBSsqndu4/jgUPz6uymy50MQJJg2e1%2BOm%2BnR1ghsACkwYaC5T8MBzacXL6lGgaG3tN/7VfZQ0cWxakYsUC/7HByKaKmZk3lGgs%2BN5SLVQqcT1dHwmltRmrJSASnmzmKt1eAZIDPljSoe6HXngZ0%2BTDeBQhdhlfx4zdJqC287%2BIyA%2BTp5qKeb%2BpuZA8KOI8jvMLJAVVfbhSV2SRg%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=796606e8e181aa5865ec20728a27238b`;
      break;
    case 'getSimpleActInfoVo':
      url = `https://lzkj-isv.isvjcloud.com/customer/getSimpleActInfoVo`;
      body = `activityId=${$.activityId}`;
      break;
    case 'getMyPing':
      url = `https://lzkj-isv.isvjcloud.com/customer/getMyPing`;
      body = `userId=${$.shopId || $.venderId || ''}&token=${$.Token}&fromType=APP`;
      break;
    case 'accessLogWithAD':
      url = `https://lzkj-isv.isvjcloud.com/common/accessLogWithAD`;
      let pageurl = `https://lzkj-isv.isvjcloud.com/drawCenter/activity?activityId=${$.activityId}&shareUuid=${$.shareUuid}`;
      body = `venderId=${$.shopId || $.venderId || ''}&code=2001&pin=${encodeURIComponent($.Pin)}&activityId=${$.activityId}&pageUrl=${encodeURIComponent(pageurl)}&subType=APP&adSource=null`;
      break;
    case 'getUserInfo':
      url = `https://lzkj-isv.isvjcloud.com/wxActionCommon/getUserInfo`;
      body = `pin=${encodeURIComponent($.Pin)}`;
      break;
    case 'activityContent':
      url = `https://lzkj-isv.isvjcloud.com/drawCenter/activityContent`;
      body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}&pinImg=${encodeURIComponent($.attrTouXiang)}&nick=${encodeURIComponent($.nickname)}&cjyxPin=&cjhyPin=&shareUuid=${
        $.shareUuid
      }`;
      break;
    case 'helpFriend':
      url = `https://lzkj-isv.isvjcloud.com/drawCenter/helpFriend`;
      body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}&shareUuid=${$.shareUuid}`;
      break;
    case 'myInfo':
      url = `https://lzkj-isv.isvjcloud.com/drawCenter/myInfo`;
      body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}`;
      break;
    case 'getProduct':
      url = `https://lzkj-isv.isvjcloud.com/drawCenter/getProduct`;
      body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}&type=${$.getProductType}`;
      break;
    case 'doTask':
      url = `https://lzkj-isv.isvjcloud.com/drawCenter/doTask`;
      body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}&taskId=${($.oneTask.taskType == 'scanurl' && $.oneTask.taskId) || $.oneTask.taskType || ''}&param=${
        $.oneProduct.skuId || ''
      }`;
      break;
    case 'luckyDraw':
      url = `https://lzkj-isv.isvjcloud.com/drawCenter/draw/luckyDraw`;
      body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}`;
      break;
    case 'myPrize':
      url = `https://lzkj-isv.isvjcloud.com/drawCenter/myPrize`;
      body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}`;
      break;
    default:
      console.log(`错误${type}`);
  }
  let myRequest = getPostRequest(url, body, method);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        setActivityCookie(resp);
        if (err) {
          if (resp && resp.statusCode && resp.statusCode == 493) {
            console.log('此ip已被限制，请过10分钟后再执行脚本\n');
            $.outFlag = true;
          }
          console.log(`${$.toStr(err, err)}`);
          console.log(`${type} API请求失败，请检查网路重试`);
        } else {
          dealReturn(type, data);
        }
      } catch (e) {
        // console.log(data);
        console.log(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function dealReturn(type, data) {
  let res = '';
  try {
    if (type != 'accessLogWithAD') {
      res = JSON.parse(data);
    }
  } catch (e) {
    console.log(`${type} 执行任务异常`);
    console.log(data);
    $.runFalag = false;
  }
  switch (type) {
    case 'isvObfuscator':
      if (typeof res == 'object' && res.errcode == 0) {
        if (typeof res.token != 'undefined') $.Token = res.token;
      } else if (typeof res == 'object' && res.message) {
        console.log(`isvObfuscator ${res.message || ''}`);
      } else {
        console.log(data);
      }
      break;
    case 'getSimpleActInfoVo':
      if (typeof res == 'object' && res.result && res.result === true) {
        if (typeof res.data.shopId != 'undefined') $.shopId = res.data.shopId;
        if (typeof res.data.venderId != 'undefined') $.venderId = res.data.venderId;
      } else if (typeof res == 'object' && res.errorMessage) {
        console.log(`${type} ${res.errorMessage || ''}`);
      } else {
        console.log(`${type} ${data}`);
      }
      break;
    case 'getMyPing':
      if (typeof res == 'object' && res.result && res.result === true) {
        if (res.data && typeof res.data.secretPin != 'undefined') $.Pin = res.data.secretPin;
        if (res.data && typeof res.data.nickname != 'undefined') $.nickname = res.data.nickname;
      } else if (typeof res == 'object' && res.errorMessage) {
        console.log(`${type} ${res.errorMessage || ''}`);
      } else {
        console.log(`${type} ${data}`);
      }
      break;
    case 'getUserInfo':
      if (typeof res == 'object' && res.result && res.result === true) {
        if (res.data && typeof res.data.yunMidImageUrl != 'undefined')
          $.attrTouXiang = res.data.yunMidImageUrl || 'https://img10.360buyimg.com/imgzone/jfs/t1/7020/27/13511/6142/5c5138d8E4df2e764/5a1216a3a5043c5d.png';
      } else if (typeof res == 'object' && res.errorMessage) {
        console.log(`${type} ${res.errorMessage || ''}`);
      } else {
        console.log(`${type} ${data}`);
      }
      break;
    case 'activityContent':
      if (typeof res == 'object' && res.result && res.result === true) {
        if (typeof res.data.uid != 'undefined') $.actorUuid = res.data.uid;
      } else if (typeof res == 'object' && res.errorMessage) {
        console.log(`${type} ${res.errorMessage || ''}`);
      } else {
        console.log(`${type} ${data}`);
      }
      break;
    case 'helpFriend':
      console.log(`${type} ${data}`);
      break;
    case 'myInfo':
      if (typeof res == 'object' && res.result && res.result === true) {
        if (res.data) {
          $.chance = res.data.chance || 0;
          $.taskList = res.data.taskList || [];
        }
      } else if (typeof res == 'object' && res.errorMessage) {
        console.log(`${type} ${res.errorMessage || ''}`);
      } else {
        console.log(`${type} ${data}`);
      }
      break;
    case 'getProduct':
      if (typeof res == 'object' && res.result && res.result === true) {
        if (res.data) {
          $.ProductList = res.data || [];
        }
      } else if (typeof res == 'object' && res.errorMessage) {
        console.log(`${type} ${res.errorMessage || ''}`);
      } else {
        console.log(`${type} ${data}`);
      }
      break;
    case 'doTask':
      if (typeof res == 'object' && res.result && res.result === true) {
        if (typeof res.data == 'number' && res.data > 0) console.log(`获得${res.data}次机会`);
      } else if (typeof res == 'object' && res.errorMessage) {
        if (res.errorMessage == '任务已完成') $.runFalag = false;
        console.log(`${type} ${res.errorMessage || ''}`);
      } else {
        console.log(`${type} ${data}`);
      }
      break;
    case 'luckyDraw':
      if (typeof res == 'object' && res.result && res.result === true) {
        if (typeof res.data == 'object') {
          let msg = (res.data.drawOk == true && ((res.data.drawInfoType == 6 && res.data.name) || '')) || '空气💨';
          if (msg) {
            $.bean += (msg.match(/\d+/) && Number(msg.match(/\d+/)[0])) || 0;
          }
          console.log(`抽奖获得:${msg || data}`);
        } else {
          console.log(`${type} ${data}`);
        }
      } else if (typeof res == 'object' && res.errorMessage) {
        if (res.errorMessage == '任务已完成') $.runFalag = false;
        console.log(`${type} ${res.errorMessage || ''}`);
      } else {
        console.log(`${type} ${data}`);
      }
      break;
    case 'myPrize':
      if (typeof res == 'object' && res.result && res.result === true) {
        if (typeof res.data == 'object') {
          console.log('我的奖品:');
          let num = 0;
          for (let i of res.data || []) {
            if (i.prizeName.indexOf('京豆') > -1) {
              num += (i.prizeName.match(/\d+/) && Number(i.prizeName.match(/\d+/)[0])) || 0;
            } else {
              console.log(`  ${i.prizeName || i}`);
            }
          }
          console.log(`  ${num}京豆\n`);
        } else {
          console.log(`${type} ${data}`);
        }
      } else if (typeof res == 'object' && res.errorMessage) {
        if (res.errorMessage == '任务已完成') $.runFalag = false;
        console.log(`${type} ${res.errorMessage || ''}`);
      } else {
        console.log(`${type} ${data}`);
      }
      break;

    case 'accessLogWithAD':
      break;

    default:
      console.log(`${type}-> ${data}`);
  }
  if (typeof res == 'object' && res.errorMessage) {
    if (res.errorMessage.indexOf('火爆') > -1) {
      $.hotFlag = true;
    }
  }
}

function getPostRequest(url, body, method = 'POST') {
  let ck = cookie;
  let host = '';
  let headers = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-cn',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    Cookie: `${ck}`,
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': `${UA || $.UA}`,
  };
  if (url.indexOf('lzkj-isv.isvjcloud.com') > -1) {
    headers['Referer'] = `https://lzkj-isv.isvjcloud.com/drawCenter/activity?activityId=${$.activityId}&shareUuid=${$.shareUuid}`;
    headers['Origin'] = `https://lzkj-isv.isvjcloud.com`;
    headers['Cookie'] = `${(lz_jdpin_token_cookie && lz_jdpin_token_cookie) || ''}${($.Pin && 'AUTH_C_USER=' + $.Pin + ';') || ''}${activityCookie}`;
  }
  if (method == 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    headers['Accept'] = 'application/json';
  }
  // console.log(headers)
  // console.log(headers.Cookie)
  return { url: url, method: method, headers: headers, body: body, timeout: 30000 };
}

function setActivityCookie(resp) {
  let LZ_TOKEN_KEY = '';
  let LZ_TOKEN_VALUE = '';
  let lz_jdpin_token = '';
  let setcookies = (resp && resp['headers'] && (resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || '')) || '';
  let setcookie = '';
  if (setcookies) {
    if (typeof setcookies != 'object') {
      setcookie = setcookies.split(',');
    } else setcookie = setcookies;
    for (let ck of setcookie) {
      let name = ck.split(';')[0].trim();
      if (name.split('=')[1]) {
        // console.log(name.replace(/ /g,''))
        if (name.indexOf('LZ_TOKEN_KEY=') > -1) LZ_TOKEN_KEY = name.replace(/ /g, '') + ';';
        if (name.indexOf('LZ_TOKEN_VALUE=') > -1) LZ_TOKEN_VALUE = name.replace(/ /g, '') + ';';
        if (name.indexOf('lz_jdpin_token=') > -1) lz_jdpin_token = '' + name.replace(/ /g, '') + ';';
      }
    }
  }
  if (LZ_TOKEN_KEY && LZ_TOKEN_VALUE) activityCookie = `${LZ_TOKEN_KEY} ${LZ_TOKEN_VALUE}`;
  if (lz_jdpin_token) lz_jdpin_token_cookie = lz_jdpin_token;
}
function getCk() {
  return new Promise((resolve) => {
    let get = {
      url: `https://lzkj-isv.isvjcloud.com/drawCenter/activity?activityId=${$.activityId}&shareUuid=${$.shareUuid}`,
      followRedirect: false,
      headers: {
        'User-Agent': $.UA,
      },
      timeout: 30000,
    };
    $.get(get, async (err, resp, data) => {
      try {
        if (err) {
          if (resp.statusCode && resp.statusCode == 493) {
            console.log('此ip已被限制，请过10分钟后再执行脚本\n');
            $.outFlag = true;
          }
          console.log(`${$.toStr(err)}`);
          console.log(`${$.name} cookie API请求失败，请检查网路重试`);
        } else {
          setActivityCookie(resp);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
async function getUA() {
  $.UA = `jdapp;iPhone;10.1.4;13.1.2;${randomString(
    40
  )};network/wifi;model/iPhone8,1;addressid/2308460611;appBuild/167814;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;
}
function randomString(e) {
  e = e || 32;
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

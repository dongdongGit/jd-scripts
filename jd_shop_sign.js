/*
店铺签到，各类店铺签到，有新的店铺直接添加token即可
============Quantumultx===============
[task_local]
#店铺签到
15 2,14 * * * https://raw.githubusercontent.com/KingRan/KR/main/jd_shop_sign.js, tag=店铺签到, enabled=true
===========Loon============
[Script]
cron "15 2,14 * * *" script-path=https://raw.githubusercontent.com/KingRan/KR/main/jd_shop_sign.js,tag=店铺签到
============Surge=============
店铺签到 = type=cron,cronexp="15 2,14 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/KingRan/KR/main/jd_shop_sign.js
===========小火箭========
店铺签到 = type=cron,script-path=https://raw.githubusercontent.com/KingRan/KR/main/jd_shop_sign.jss, cronexpr="15 2,14 * * *", timeout=3600, enable=true
*/
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('店铺签到');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  allMessage = '',
  message;
const JD_API_HOST = 'https://api.m.jd.com/api?appid=interCenter_shopSign';

let activityId = '';
let vender = '';
let num = 0;
let shopname = '';
const token = [
  '1BF7556DFA8680BBCDD2F57937830BB7',
  '4BE1B58FE1360409A5967CAD1127B5A8',
  '34864F266AFC02DDB7EEAD5A2AF9B4F7',
  '7166EF6ED03BA34C3DBBA1ADB27E56C1',
  'C031053EDBD2C047C072C53F80D82577',
  '18FB7E1DE514D5E40D880585D4145DEC',
  'CACEC89AD3A20309748FEC03B0B0C50C',
  '6359776E10B514A773610D94579BFA3B',
  'B30FC91ED327EE2E1C7C8B2214D8751A',
  '3AF4B68A4BB3BD09D371B766E6A1B721',
  '273EC9E9CA27DFDD85478972A1A0ED6F',
  'A7DDDEAE3438B27260BDC8B1A555CE6F',
  '3B27B2B9E70249C339D66F27B7E133F0',
  'AED3C29E6DA2F0AA84C08F0F726D59C2',
  '6CB820BAC6C0CD8D1F90C342F0EA1018',
  '38C4871110737702A9B3E6CC452977D1',
  'AED3C29E6DA2F0AA84C08F0F726D59C2',
  '35BA76ED53A953E03F77EE5379C28BE5',
  '038B83D1D0D374F58821C7EDC4F3B5AE',
  '0EED5C32E8002D6EF892D3995A0A9AA5',
  'D5A12069E47F17718EF7E7381444A5FE',
  '9F64084BD36FE0EBCDE1EDC956656501',
  '7516691B34E89137D3C911BBF7D86ACD',
];

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || '[]';
  cookiesData = jd_helpers.jsonParse(cookiesData);
  cookiesArr = cookiesData.map((item) => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter((item) => item !== '' && item !== null && item !== undefined);
}

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
      await dpqd();
      await showMsg();
      await $.wait(1500);
    }
  }
  if ($.isNode() && allMessage) {
    await notify.sendNotify(`${$.name}`, `${allMessage}`);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

//开始店铺签到
async function dpqd() {
  for (var j = 0; j < token.length; j++) {
    num = j + 1;
    if (token[j] == '') {
      continue;
    }
    getUA();
    await getvenderId(token[j]);
    if (vender == '') {
      continue;
    }
    await getvenderName(vender);
    await getActivityInfo(token[j], vender);
    await signCollectGift(token[j], vender, activityId);
    await taskUrl(token[j], vender);
  }
}

//获取店铺ID
function getvenderId(token) {
  return new Promise((resolve) => {
    const options = {
      url: `https://api.m.jd.com/api?appid=interCenter_shopSign&t=${Date.now()}&loginType=2&functionId=interact_center_shopSign_getActivityInfo&body={%22token%22:%22${token}%22,%22venderId%22:%22%22}&jsonp=jsonp1000`,
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        cookie: cookie,
        referer: 'https://h5.m.jd.com/',
        'User-Agent': $.UA,
        // "User-Agent": `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          $.logErr(err);
        } else {
          //console.log(data)
          data = JSON.parse(/{(.*)}/g.exec(data)[0]);
          if (data.code == 402) {
            vender = '';
            console.log(`第` + num + `个店铺签到活动已失效`);
            message += `第` + num + `个店铺签到活动已失效\n`;
          } else {
            vender = data.data.venderId;
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

//获取店铺名称
function getvenderName(venderId) {
  return new Promise((resolve) => {
    const options = {
      url: `https://wq.jd.com/mshop/QueryShopMemberInfoJson?venderId=${venderId}`,
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        cookie: cookie,
        'User-Agent': $.UA,
        // "User-Agent": `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          $.logErr(err);
        } else {
          //console.log(data)
          data = JSON.parse(data);
          shopName = data.shopName;
          console.log(`【` + shopName + `】`);
          message += `【` + shopName + `】`;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

//获取店铺活动信息
function getActivityInfo(token, venderId) {
  return new Promise((resolve) => {
    const options = {
      url: `${JD_API_HOST}&t=${Date.now()}&loginType=2&functionId=interact_center_shopSign_getActivityInfo&body={%22token%22:%22${token}%22,%22venderId%22:${venderId}}&jsonp=jsonp1005`,
      headers: {
        accept: 'accept',
        'accept-encoding': 'gzip, deflate',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        cookie: cookie,
        referer: `https://h5.m.jd.com/babelDiy/Zeus/2PAAf74aG3D61qvfKUM5dxUssJQ9/index.html?token=${token}&sceneval=2&jxsid=16105853541009626903&cu=true&utm_source=kong&utm_medium=jingfen&utm_campaign=t_1001280291_&utm_term=fa3f8f38c56f44e2b4bfc2f37bce9713`,
        'User-Agent': $.UA,
        // "User-Agent": `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          // console.log(data)
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          $.logErr(err);
        } else {
          //console.log(data)
          data = JSON.parse(/{(.*)}/g.exec(data)[0]);
          activityId = data.data.id;
          //console.log(data)
          let mes = '';
          for (let i = 0; i < data.data.continuePrizeRuleList.length; i++) {
            const level = data.data.continuePrizeRuleList[i].level;
            const discount = data.data.continuePrizeRuleList[i].prizeList[0].discount;
            mes += '签到' + level + '天,获得' + discount + '豆';
          }
          // console.log(message+mes+'\n')
          // message += mes+'\n'
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

//店铺签到
function signCollectGift(token, venderId, activitytemp) {
  return new Promise((resolve) => {
    const options = {
      url: `${JD_API_HOST}&t=${Date.now()}&loginType=2&functionId=interact_center_shopSign_signCollectGift&body={%22token%22:%22${token}%22,%22venderId%22:688200,%22activityId%22:${activitytemp},%22type%22:56,%22actionType%22:7}&jsonp=jsonp1004`,
      headers: {
        accept: 'accept',
        'accept-encoding': 'gzip, deflate',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        cookie: cookie,
        referer: `https://h5.m.jd.com/babelDiy/Zeus/2PAAf74aG3D61qvfKUM5dxUssJQ9/index.html?token=${token}&sceneval=2&jxsid=16105853541009626903&cu=true&utm_source=kong&utm_medium=jingfen&utm_campaign=t_1001280291_&utm_term=fa3f8f38c56f44e2b4bfc2f37bce9713`,
        'User-Agent': $.UA,
        // "User-Agent": `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          $.logErr(err);
        } else {
          //console.log(data)
          data = JSON.parse(/{(.*)}/g.exec(data)[0]);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

//店铺获取签到信息
function taskUrl(token, venderId) {
  return new Promise((resolve) => {
    const options = {
      url: `${JD_API_HOST}&t=${Date.now()}&loginType=2&functionId=interact_center_shopSign_getSignRecord&body={%22token%22:%22${token}%22,%22venderId%22:${venderId},%22activityId%22:${activityId},%22type%22:56}&jsonp=jsonp1006`,
      headers: {
        accept: 'application/json',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9',
        cookie: cookie,
        referer: `https://h5.m.jd.com/`,
        'User-Agent': $.UA,
        // "user-agent": `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          $.logErr(err);
        } else {
          //console.log(data)
          data = JSON.parse(/{(.*)}/g.exec(data)[0]);
          console.log(`已签到：` + data.data.days + `天`);
          message += `已签到：` + data.data.days + `天\n`;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

async function showMsg() {
  if ($.isNode()) {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    allMessage += `【京东账号${$.index}】${$.nickName}\n${message}${$.index !== cookiesArr.length ? '\n\n' : ''}`;
  }
}

function randomString(e) {
  e = e || 32;
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

function getUA() {
  $.UA = `jdapp;iPhone;10.2.2;13.1.2;${randomString(
    40
  )};M/5.0;network/wifi;ADID/;model/iPhone8,1;addressid/2308460611;appBuild/167863;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;`;
}

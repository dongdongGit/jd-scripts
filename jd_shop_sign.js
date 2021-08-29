/*
店铺签到，各类店铺签到，有新的店铺直接添加token即可
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
  message;
const JD_API_HOST = 'https://api.m.jd.com/api?appid=interCenter_shopSign';

let activityId = '';
let vender = '';
let num = 0;
let shopname = '';
const token = [
  '3973CC4C080450D34557B6F8C46307C8',
  'ACD7EB42FB65AF1A447AEB329235DE04', //每日，3豆；15天，100豆；
  '5BB2C6C6332AD842011240152F7550EB', //每日，6豆；7天，100豆；
  '6C6B2702DDAAEDEBE5E68E41B6264CF6', //每日，5豆；7天，200积分；
  'CDC56C42F64CA34677E5894F28AF4871', //每日，100分；1天，200分、2豆；2天，1000分、25-3券；
  '2075567CC6ED0F30EAFFCF901F6C486D', //每日，2豆；10天，100豆；
  'A133DE5D8D1A5A612F49CBE1D9BCE7AA', //每日，2豆；20天，5元e卡；
  'E9E4861F0B12E5E483C949C818E3EAB8', //每日，1豆；10天，20豆；20天，50豆；
  '83E9B38C310EB5D26657977EF8FECA0F', //7天，20积分；15天，30豆；
  '7DE1E4B12326576BF7C5D347CC909451', //每日，10豆；7天，100豆；
  '513B43DB672C8C7B0D975DB75328A131', //每日，5豆；26天，88豆；
  'EFFD0BF4069A8B6882A55FB07ACDA60F', //10天，30豆；20天，60豆；30天，100豆;
  '517AD3C83C8D5EE281BB808BFF283C17', //签到28天，100京豆
  'E528907E4FEC60FC75CBFE1BAFA95F8D', //7天，40豆；15天，100豆；30天，100豆;
  '419EA534F344B41A0D40E351F8DA8AA7',
];
//IOS等用户直接用NobyDa的jd cookie

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
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
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
      if (i < 1) {
        await showMsg();
      }
    }
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
        'User-Agent': `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`,
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
        'User-Agent': `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`,
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
        referer: `https://h5.m.jd.com/babelDiy/Zeus/2PAAf74aG3D61qvfKUM5dxUssJQ9/index.html?token=${token}&sceneval=2&jxsid=16178634353215523301&cu=true&utm_source=kong&utm_medium=jingfen&utm_campaign=t_2009753434_&utm_term=fa3f8f38c56f44e2b4bfc2f37bce9713`,
        'User-Agent': `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`,
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
          //console.log(message+mes+'\n')
          //message += mes+'\n'
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
        referer: `https://h5.m.jd.com/babelDiy/Zeus/2PAAf74aG3D61qvfKUM5dxUssJQ9/index.html?token=${token}&sceneval=2&jxsid=16178634353215523301&cu=true&utm_source=kong&utm_medium=jingfen&utm_campaign=t_2009753434_&utm_term=fa3f8f38c56f44e2b4bfc2f37bce9713`,
        'User-Agent': `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`,
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
        'user-agent': `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`,
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
  if ($.isNode() && !process.env.SHOP_SIGN_NOTIFY_CONTROL) {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】${$.nickName}\n${message}`);
  }
}

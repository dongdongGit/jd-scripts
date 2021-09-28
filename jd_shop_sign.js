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
  '98CCFA28021D0623A6835480228862D5',//2-3天70京豆；
  '9133123518A9C372D79D54407C5DF0F9',//15天100京豆；
  'B633CA47876BC61E7F639EBED79DDF34',//3天20京豆；
  'D92B26255A899BF4DD32B80196EB8934',
  '10B6286F445A9F94C356B35469DB9A4D',
  '5C1B739656B358743D816EAE714C83F3',
  "A4469A359592ECFDF1A927B3EE6E7357", 
  "FAC8EFA459B45C8208817F11C313C05D", 
  '1D9BC39B71C4DF268D034D4DC78B81D3',
  '3D99640B8E65273658E3A21908FFEC4C',
  '9544C0361A02BCE538FBECA84D3A9508',
  '261F616B5F721EFB1E112D6A1FA69BE1',
  '94E9660F7E513526BE90DAE600414C03',
  '9944E3E6476F61BEF9D4107210D24D55',
  'D48CC0BF38018BFBD65E495201A160C6',
  'C1B43EE810DF7CF9BCD82256690AD16B',
  '0FD7C0E275B44718D79AD02D0D73770F',
  'FEFF64118D0FB5D049763864E46ACBA3',
  'EBAA272399094FA03629BF1A6D1410EC',
  'CEDDE5C4517E0F402FD4B9A62B1F22D6',
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
      url: `https://api.m.jd.com/api?appid=interCenter_shopSign&t=${Date.now()}&loginType=2&functionId=interact_center_shopSign_getActivityInfo&body={%22token%22:%22${token}%22,%22venderId%22:%22%22}`,
      headers: {
        cookie: cookie,
        referer: 'https://h5.m.jd.com/'
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
      url: `${JD_API_HOST}&t=${Date.now()}&loginType=2&functionId=interact_center_shopSign_getActivityInfo&body={%22token%22:%22${token}%22,%22venderId%22:${venderId}}`,
      headers: {
        cookie: cookie,
        referer: `https://h5.m.jd.com/babelDiy/Zeus/2PAAf74aG3D61qvfKUM5dxUssJQ9/index.html?token=${token}&sceneval=2&jxsid=16178634353215523301&cu=true&utm_source=kong&utm_medium=jingfen&utm_campaign=t_2009753434_&utm_term=fa3f8f38c56f44e2b4bfc2f37bce9713`
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          // console.log(data)
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          $.logErr(err);
        } else {
          data = JSON.parse(data);
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
      url: `${JD_API_HOST}&t=${Date.now()}&loginType=2&functionId=interact_center_shopSign_signCollectGift&body={%22token%22:%22${token}%22,%22venderId%22:688200,%22activityId%22:${activitytemp},%22type%22:56,%22actionType%22:7}`,
      headers: {
        cookie: cookie,
        referer: `https://h5.m.jd.com/babelDiy/Zeus/2PAAf74aG3D61qvfKUM5dxUssJQ9/index.html?token=${token}&sceneval=2&jxsid=16178634353215523301&cu=true&utm_source=kong&utm_medium=jingfen&utm_campaign=t_2009753434_&utm_term=fa3f8f38c56f44e2b4bfc2f37bce9713`,
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
      url: `${JD_API_HOST}&t=${Date.now()}&loginType=2&functionId=interact_center_shopSign_getSignRecord&body={%22token%22:%22${token}%22,%22venderId%22:${venderId},%22activityId%22:${activityId},%22type%22:56}`,
      headers: {
        cookie: cookie,
        referer: `https://h5.m.jd.com/`,
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

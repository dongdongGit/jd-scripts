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
  'A6E8FA5B2571061CF4A5BF0E3B5B848A',
  'A667ACD4437B1451CCE2ACE46C45C31C',
  'CEF366C139A7D0A5ADC99F19CFBA4054',
  '214C073A7D4EB5EC9CCA1E45E8673C9E',
  '2A9A3CEC924CAE7FE0176B42DF0D88F4',
  '407910EA26539B7058C483ACAAD92EA8',
  'BEDD374AD88B5789E8B38CDA3978F542',
  'F741C9C67E4B67ABEF716F27AB2AF6F8',
  'BBF635BBA70E5B6F3AA0FFD5CE6D63A5',
  '3A5DA1F4D7BE40E65654C733F7333657',
  '5988608149D2C71FB2AAE1AA9D35EDE4',
  'C2C9FE340BEA6E4FE8B4B868904DABB2',
  '603A6D84F23C176DB1F932A9FDDDA5F2',
  'FBD586E1BA834B20BD4CC7CC04C3D0BD',
  'E2C480571521C4CC992AF19BB6B4978E',
  'A82BB3D06455B9674F63F48979A73BCC',
  '7DC877395EBDCFE3C3E6031782CAB049',
  'B49BC0794947A75595CF1DFA7C7304D8',
  '50A6EFF0F4CFCE65B0FA46CF0A23DB53',
  '889BB484BDC0F98C9760B44DE353E04E',
  '95FB2047E4912D89A9394B446C118E08',
  '09B11D03ED26858DC16DC11A2D92816E',
  '49672BF85F90A1C9B2AF486521F47EC0',
  '6B807AAB2FAB609ABCC64F3D948A7990',
  'CEF366C139A7D0A5ADC99F19CFBA4054',
  'BA157BE581B5E40BDFEBD44277AF29B7',
  'EDC5452E351B6360488A611BBCB6FD18',
  '3A5DA1F4D7BE40E65654C733F7333657',
  '6DA953F013BAF9AC80B074A15752048F',
  'C30B2DCBE52B8830CA52B5D7FFB1FC12',
  '2F18BA1F94BB3F601ADC5CB0756F32BB',
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
        referer: 'https://h5.m.jd.com/',
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
        referer: `https://h5.m.jd.com/babelDiy/Zeus/2PAAf74aG3D61qvfKUM5dxUssJQ9/index.html?token=${token}&sceneval=2&jxsid=16178634353215523301&cu=true&utm_source=kong&utm_medium=jingfen&utm_campaign=t_2009753434_&utm_term=fa3f8f38c56f44e2b4bfc2f37bce9713`,
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

/**
芥么签到
入口：微信-芥么小程序
cron 11 7,15 * * * jd_zsign.js
*/
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('芥么签到');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
$.shareCodes = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  UUID = getUUID('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  for (let i = 0; i < cookiesArr.length; i++) {
    UA = `jdapp;iPhone;10.0.8;14.6;${UUID};network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214222493;appBuild/168841;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16E158;supportJDSHWK/1`;
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
      await main();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function main() {
  await apSignIn_day();
  await signPrizeDetailList();
  if ($.tasklist) {
    for (const vo of $.tasklist) {
      await apCashWithDraw(vo.prizeType, vo.business, vo.id, vo.poolBaseId, vo.prizeGroupId, vo.prizeBaseId);
    }
  } else {
    $.log('没有获取到信息');
  }
}
function apCashWithDraw(prizeType, business, id, poolBaseId, prizeGroupId, prizeBaseId) {
  let body = {
    linkId: 'KRFM89OcZwyjnyOIPyAZxA',
    businessSource: 'DAY_DAY_RED_PACKET_SIGN',
    base: { prizeType: prizeType, business: business, id: id, poolBaseId: poolBaseId, prizeGroupId: prizeGroupId, prizeBaseId: prizeBaseId },
  };
  return new Promise((resolve) => {
    $.post(taskPostUrl('apCashWithDraw', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.success) {
              if (data.data.status === '310') {
                console.log(data.data.message);
              } else if (data.data.status === '1000') {
                console.log('今天已经完成提现了');
              }
            } else {
              console.log(JSON.stringify(data));
            }
          } else {
            console.log('没有返回数据');
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
function signPrizeDetailList() {
  let body = { linkId: 'KRFM89OcZwyjnyOIPyAZxA', serviceName: 'dayDaySignGetRedEnvelopeSignService', business: 1, pageSize: 20, page: 1 };
  return new Promise((resolve) => {
    $.post(taskPostUrl('signPrizeDetailList', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            $.tasklist = data.data.prizeDrawBaseVoPageBean.items;
          } else {
            console.log('没有返回数据');
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
function apSignIn_day() {
  let body = { linkId: 'KRFM89OcZwyjnyOIPyAZxA', serviceName: 'dayDaySignGetRedEnvelopeSignService', business: 1 };
  return new Promise((resolve) => {
    $.post(taskPostUrl('apSignIn_day', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.success) {
              if (data.data.historySignInAnCycle) {
                console.log(`签到成功：获得${data.data.historySignInAnCycle[0].prizeAwardVale}`);
              } else {
                console.log(data.data.retMessage);
              }
            } else {
              console.log(JSON.stringify(data));
            }
          } else {
            console.log('没有返回数据');
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

function taskPostUrl(function_id, body) {
  return {
    url: `https://api.m.jd.com/?functionId=${function_id}&body=${escape(JSON.stringify(body))}&_t=${new Date().getTime()}&appid=activities_platform`,
    headers: {
      Host: 'api.m.jd.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://zsign.jd.com',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      Accept: 'application/json, text/plain, */*',
      'User-Agent': UA,
      'Content-Length': '206',
      'Accept-Language': 'zh-cn',
      Cookie: cookie,
    },
  };
}
function getUUID(x = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', t = 0) {
  return x.replace(/[xy]/g, function (x) {
    var r = (16 * Math.random()) | 0,
      n = 'x' == x ? r : (3 & r) | 8;
    return (uuid = t ? n.toString(36).toUpperCase() : n.toString(36)), uuid;
  });
}

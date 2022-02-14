/*
京东通天塔--签到
脚本更新时间：2021-12-17 14:20
脚本兼容: Node.js
===========================
[task_local]
#京东通天塔--签到
3 9,23 * * * jd_m_sign.js, tag=京东通天塔--签到, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东通天塔签到');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message = '';
$.shareCodes = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
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
      await jdsign();
      // await showMsg();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function jdsign() {
  try {
    console.log(`签到开始........`);
    await getInfo('https://pro.m.jd.com/mall/active/3S28janPLYmtFxypu37AYAGgivfp/index.html'); //拍拍二手签到
    await $.wait(2000);
    await getInfo('https://pro.m.jd.com/mall/active/kPM3Xedz1PBiGQjY4ZYGmeVvrts/index.html'); //陪伴
    await $.wait(2000);
    await getInfo('https://pro.m.jd.com/mall/active/3SC6rw5iBg66qrXPGmZMqFDwcyXi/index.html'); //京东图书
    //     await getInfo("https://pro.m.jd.com/mall/active/ZrH7gGAcEkY2gH8wXqyAPoQgk6t/index.html");//箱包签到
    //     await $.wait(1000)
    //     await getInfo("https://pro.m.jd.com/mall/active/4RXyb1W4Y986LJW8ToqMK14BdTD/index.html");//鞋靴馆签到

    //     await $.wait(1000)
    //     await getInfo("https://pro.m.jd.com/mall/active/3joSPpr7RgdHMbcuqoRQ8HbcPo9U/index.html");//生活特权签到
  } catch (e) {
    $.logErr(e);
  }
}

async function getInfo(url) {
  return new Promise((resolve) => {
    $.get(
      {
        url,
        headers: {
          Cookie: cookie,
          'User-Agent': 'JD4iPhone/167650 (iPhone; iOS 13.7; Scale/3.00)',
        },
      },
      async (err, resp, data) => {
        try {
          $.encryptProjectId = resp.body.match(/"encryptProjectId\\":\\"(.*?)\\"/)[1];
          $.encryptAssignmentId = resp.body.match(/"encryptAssignmentId\\":\\"(.*?)\\"/)[1];
          await doInteractiveAssignment($.encryptProjectId, $.encryptAssignmentId);
          resolve();
        } catch (e) {
          console.log(e);
        }
      }
    );
  });
}

// 签到
async function doInteractiveAssignment(encryptProjectId, AssignmentId) {
  return new Promise(async (resolve) => {
    $.post(
      taskUrl('doInteractiveAssignment', {
        encryptProjectId: encryptProjectId,
        encryptAssignmentId: AssignmentId,
        sourceCode: 'aceaceqingzhan',
        itemId: '1',
        actionType: '',
        completionFlag: 'true',
        ext: {},
      }),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`doInteractiveAssignment API请求失败，请检查网路重试`);
          } else {
            if (jd_helpers.safeGet(data)) {
              data = JSON.parse(data);
              if (data.subCode == '0' && data.rewardsInfo) {
                // console.log(data.rewardsInfo);
                if (data.rewardsInfo.successRewards['3'] && data.rewardsInfo.successRewards['3'].length != 0) {
                  console.log(`${data.rewardsInfo.successRewards['3'][0].rewardName},获得${data.rewardsInfo.successRewards['3'][0].quantity}京豆`);
                } else if (data.rewardsInfo.failRewards.length != 0) {
                  console.log(`失败：${data.rewardsInfo.failRewards[0].msg}`);
                }
              } else if (data.subCode == '1403' || data.subCode == '1703') {
                console.log(data.msg);
              } else {
                console.log(data.msg);
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      }
    );
  });
}

function taskUrl(functionId, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${functionId}&body=${encodeURI(JSON.stringify(body))}&appid=babelh5&sign=11&t=${new Date().getTime()}`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://pro.m.jd.com',
      'Accept-Language': 'zh-cn',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://pro.m.jd.com',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
    },
  };
}

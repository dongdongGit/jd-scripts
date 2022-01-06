/*
年货签到
by:小手冰凉 tg:@chianPLA
交流群：https://t.me/jdPLA2
脚本更新时间：2021-12-27 19:20
脚本兼容: Node.js
新手写脚本，难免有bug，能用且用。
改自Aaron
===========================
[task_local]
#年货签到
6 1,13,23 * * * jd_nh_sign.js, tag=年货签到, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('年货签到');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
let uuid;
let hotInfo = {};
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
      $.encryptProjectId = '';
      message = '';
      ($.sku = []), ($.sku2 = []), ($.adv = []);
      await getInfo('https://prodev.m.jd.com/mall/active/fARfxZh3zdMqs4tkFBhpqaQKTGA/index.html'); //集魔方首页
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

      uuid = randomString(40);
      console.log(`年货节签到\n`);
      await queryInteractiveInfo($.encryptProjectId, 'aceaceglqd20211215');
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function queryInteractiveInfo(encryptProjectId, sourceCode) {
  return new Promise(async (resolve) => {
    $.post(taskUrl('queryInteractiveInfo', { encryptProjectId: encryptProjectId, sourceCode: sourceCode }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`queryInteractiveInfo API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code == '0') {
            for (let v of data.assignmentList) {
              if (new Date().getDate() == 9 && v.assignmentName == '9日大奖') {
                await queryInteractiveRewardInfo($.encryptProjectId, v.encryptAssignmentId, 'aceaceglqd20211215');
                await doInteractiveAssignment($.encryptProjectId, v.encryptAssignmentId, 'aceaceglqd20211215');
              } else if (new Date().getDate() == 17 && v.assignmentName == '17日大奖') {
                await queryInteractiveRewardInfo($.encryptProjectId, v.encryptAssignmentId, 'aceaceglqd20211215');
                await doInteractiveAssignment($.encryptProjectId, v.encryptAssignmentId, 'aceaceglqd20211215');
              } else if (new Date().getDate() == 24 && v.assignmentName == '24日大奖') {
                await queryInteractiveRewardInfo($.encryptProjectId, v.encryptAssignmentId, 'aceaceglqd20211215');
                await doInteractiveAssignment($.encryptProjectId, v.encryptAssignmentId, 'aceaceglqd20211215');
              } else if (v.assignmentName == '签到') {
                await queryInteractiveRewardInfo($.encryptProjectId, v.encryptAssignmentId, 'aceaceglqd20211215');
                await doInteractiveAssignment($.encryptProjectId, v.encryptAssignmentId, 'aceaceglqd20211215');
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function queryInteractiveRewardInfo(encryptProjectId, AssignmentId, sourceCode) {
  body = { encryptProjectId: encryptProjectId, encryptProjectPoolId: AssignmentId, sourceCode: sourceCode, ext: { pageSize: 30, detailTypeFlag: 2, currentPage: 1 } };
  return new Promise(async (resolve) => {
    $.post(taskUrl('queryInteractiveRewardInfo', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`queryInteractiveRewardInfo API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
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

// 兑换
async function doInteractiveAssignment(encryptProjectId, AssignmentId, sourceCode) {
  return new Promise(async (resolve) => {
    $.post(taskUrl('doInteractiveAssignment', { encryptProjectId: encryptProjectId, encryptAssignmentId: AssignmentId, sourceCode: sourceCode, completionFlag: true }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`doInteractiveAssignment API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.subCode == '0') {
              console.log(`当前兑换${JSON.stringify(data.rewardsInfo.successRewards)}`);
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
    });
  });
}

function taskUrl(functionId, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${functionId}&body=${JSON.stringify(body)}&appid=publicUseApi&client=wh5&clientVersion=1.0.0&sid=&uuid=&area=22_2005_2009_36999&networkType=`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://prodev.m.jd.com',
      'Accept-Language': 'zh-cn',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://prodev.m.jd.com/mall/active/fARfxZh3zdMqs4tkFBhpqaQKTGA/index.html',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
    },
  };
}

function getInfo(url) {
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
          $.encryptProjectId = resp.body.match(/"projectId":"(.*?)"/)[1];
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}
function randomString(e) {
  let t = 'abcdef0123456789';
  if (e === 16) t = 'abcdefghijklmnopqrstuvwxyz0123456789';
  e = e || 32;
  let a = t.length,
    n = '';
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}
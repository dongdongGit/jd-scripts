/**
集魔方
cron 11 10 * * * jd_rubik_cube.js
*/
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('集魔方');
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
  await getInteractionHomeInfo();
  await $.wait(500);
  await queryInteractiveInfo($.projectId);
  if ($.taskList) {
    for (const vo of $.taskList) {
      if (vo.ext.extraType !== 'brandMemberList' && vo.ext.extraType !== 'assistTaskDetail') {
        if (vo.completionCnt < vo.assignmentTimesLimit) {
          console.log(`任务：${vo.assignmentName},去完成`);
          if (vo.ext) {
            if (vo.ext.extraType === 'sign1') {
              await doInteractiveAssignment($.projectId, vo.encryptAssignmentId, vo.ext.sign1.itemId);
            }
            for (let vi of vo.ext.productsInfo ?? []) {
              if (vi.status === 1) {
                await doInteractiveAssignment($.projectId, vo.encryptAssignmentId, vi.itemId);
              }
            }
            for (let vi of vo.ext.shoppingActivity ?? []) {
              if (vi.status === 1) {
                await doInteractiveAssignment($.projectId, vo.encryptAssignmentId, vi.advId, 1);
                await $.wait(6000);
                await doInteractiveAssignment($.projectId, vo.encryptAssignmentId, vi.advId, 0);
              }
            }
            for (let vi of vo.ext.browseShop ?? []) {
              if (vi.status === 1) {
                await doInteractiveAssignment($.projectId, vo.encryptAssignmentId, vi.itemId, 1);
                await $.wait(6000);
                await doInteractiveAssignment($.projectId, vo.encryptAssignmentId, vi.itemId, 0);
              }
            }
            for (let vi of vo.ext.addCart ?? []) {
              if (vi.status === 1) {
                await doInteractiveAssignment($.projectId, vo.encryptAssignmentId, vi.itemId, 1);
                await $.wait(6000);
                await doInteractiveAssignment($.projectId, vo.encryptAssignmentId, vi.itemId, 0);
              }
            }
          }
        } else {
          console.log(`任务：${vo.assignmentName},已完成`);
        }
      }
    }
  } else {
    $.log('没有获取到活动信息');
  }
}
function doInteractiveAssignment(projectId, encryptAssignmentId, itemId, actionType) {
  let body = { encryptProjectId: projectId, encryptAssignmentId: encryptAssignmentId, sourceCode: 'acexinpin0823', itemId: itemId, actionType: actionType, completionFlag: '', ext: {} };
  return new Promise((resolve) => {
    $.post(taskPostUrl('doInteractiveAssignment', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            console.log(data.msg);
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
function queryInteractiveInfo(projectId) {
  let body = { encryptProjectId: projectId, sourceCode: 'acexinpin0823', ext: {} };
  return new Promise((resolve) => {
    $.post(taskPostUrl('queryInteractiveInfo', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            $.taskList = data.assignmentList;
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
function getInteractionHomeInfo() {
  let body = { sign: 'u6vtLQ7ztxgykLEr' };
  return new Promise((resolve) => {
    $.get(taskPostUrl('getInteractionHomeInfo', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data) {
            if (data.result.giftConfig) {
              $.projectId = data.result.taskConfig.projectId;
            } else {
              console.log('获取projectId失败');
            }
          } else {
            console.log(JSON.stringify(data));
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
    url: `https://api.m.jd.com/?functionId=${function_id}&body=${escape(JSON.stringify(body))}&appid=content_ecology&client=wh5&clientVersion=1.0.0`,
    headers: {
      Host: 'api.m.jd.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://h5.m.jd.com',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      Accept: 'application/json, text/plain, */*',
      'User-Agent': UA,
      Referer: 'https://h5.m.jd.com/babelDiy/Zeus/2bf3XEEyWG11pQzPGkKpKX2GxJz2/index.html',
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

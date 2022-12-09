/*
积分换话费
入口：首页-生活·缴费-积分换话费
cron 33 7,19 * * * jd_dwapp.js
*/
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('积分换话费');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
CryptoJS = $.isNode() ? require('crypto-js') : CryptoJS;
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
      $.eko = false;
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
  $.log('去签到');
  await usersign();
  await tasklist();
  if ($.tasklist) {
    for (let i = 0; i < $.tasklist.length; i++) {
      console.log(`去领取${$.tasklist[i].taskDesc}任务`);
      await taskrecord($.tasklist[i].id);
      await $.wait(3000);
      console.log(`去领取积分`);
      await taskreceive($.tasklist[i].id);
    }
  }
}
async function taskrecord(id) {
  enc = await sign(id + '1');
  let body = { id: id, agentNum: 'm', taskType: 1, followChannelStatus: '', ...enc };
  return new Promise((resolve) => {
    $.post(taskPostUrl('task/dwRecord', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data) {
            if (data.code === 200) {
              if (data.data.dwUserTask) {
                $.log(' 领取任务成功');
              } else {
                $.log(' 此任务已经领取过了');
              }
            } else {
              console.log(JSON.stringify(data));
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

async function taskreceive(id) {
  enc = await sign(id);
  let body = { id: id, ...enc };
  return new Promise((resolve) => {
    $.post(taskPostUrl('task/dwReceive', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data) {
            if (data.code === 200 && data.data.success) {
              console.log(` 领取任务积分：获得${data.data.giveScoreNum}`);
            } else if (data.code === 200 && !data.data.success) {
              console.log(' 积分已经领取完了');
            } else {
              console.log(JSON.stringify(data));
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

async function usersign() {
  body = await sign();
  return new Promise((resolve) => {
    $.post(taskPostUrl('dwSign', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data) {
            if (data.code === 200) {
              console.log(`签到成功：获得积分${data.data.signInfo.signNum}\n`);
            } else {
              console.log('似乎签到完成了\n');
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

async function tasklist() {
  body = await sign();
  return new Promise((resolve) => {
    $.post(taskPostUrl('task/dwList', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data) {
            $.tasklist = data.data;
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
    url: `https://dwapp.jd.com/user/${function_id}`,
    body: JSON.stringify(body),
    headers: {
      Host: 'dwapp.jd.com',
      Origin: 'https://prodev.m.jd.com',
      Connection: 'keep-alive',
      Accept: '*/*',
      'User-Agent': `jdapp;iPhone;10.1.0;13.5;${$.UUID};network/wifi;model/iPhone11,6;addressid/4596882376;appBuild/167774;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
      'Accept-Language': 'zh-cn',
      Referer: 'https://prodev.m.jd.com/mall/active/eEcYM32eezJB7YX4SBihziJCiGV/index.html',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
  };
}

function getUUID(format = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', UpperCase = 0) {
  return format.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    if (UpperCase) {
      uuid = v.toString(36).toUpperCase();
    } else {
      uuid = v.toString(36);
    }
    return uuid;
  });
}

async function sign(en) {
  time = new Date().getTime();
  let encStr = en || '';
  const encTail = `${time}e9c398ffcb2d4824b4d0a703e38yffdd`;
  encStr = CryptoJS.MD5(encStr + encTail).toString();
  return { t: time, encStr: encStr };
}

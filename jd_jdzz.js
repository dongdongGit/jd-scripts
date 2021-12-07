/*
京东赚赚
活动入口：京东赚赚小程序
长期活动，每日收益2毛左右，多号互助会较多
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
by:小手冰凉 tg:@chianPLA
date:2021-12-1 12:59:00
============Quantumultx===============
[task_local]
# 京东赚赚
10 11,20 * * * jd_jdzz.js, tag=京东赚赚, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdzz.png, enabled=true
================Loon==============
[Script]
cron "10 11,20 * * *" script-path=jd_jdzz.js,tag=京东赚赚
===============Surge=================
京东赚赚 = type=cron,cronexp="10 11,20 * * *",wake-system=1,timeout=3600,script-path=jd_jdzz.js
============小火箭=========
京东赚赚 = type=cron,script-path=jd_jdzz.js, cronexpr="10 11,20 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东赚赚');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message = '',
  allMessage = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let nowTimes = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000);
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
      await jdWish();
    }
  }
  if (allMessage) {
    //NODE端,默认每月一日运行进行推送通知一次
    if ($.isNode() && nowTimes.getDate() === 1 && (process.env.JDZZ_NOTIFY_CONTROL ? process.env.JDZZ_NOTIFY_CONTROL === 'false' : !!1)) {
      await notify.sendNotify($.name, allMessage);
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function jdWish() {
  $.bean = 0;
  await getTaskList(true);
  await getUserInfo();
  $.nowBean = parseInt($.totalBeanNum);
  $.nowNum = parseInt($.totalNum);
  for (let i = 0; i < $.taskList.length; ++i) {
    let task = $.taskList[i];
    // console.log(task);
    if (task['taskId'] === 1 && task['status'] !== 2) {
      console.log(`去做任务：${task.taskName}`);
      await doTask({ taskId: task['taskId'], taskItem: {}, actionType: 0, taskToken: task['taskToken'], mpVersion: '3.4.0' });
    } else if (task['taskId'] !== 3 && task['status'] !== 2) {
      console.log(`去做任务：${task.taskName}`);
      if (task['itemId']) await doTask({ itemId: task['itemId'], taskId: task['taskId'], taskItem: {}, actionType: 0, taskToken: task['taskToken'], mpVersion: '3.4.0' });
      else await doTask({ taskId: task['taskId'], taskItem: {}, actionType: 0, taskToken: task['taskToken'], mpVersion: '3.4.0' });
      await $.wait(3000);
    }
  }
  await getTaskList();
  // await showMsg();
}

function showMsg() {
  return new Promise(async (resolve) => {
    message += `本次获得${parseInt($.totalBeanNum) - $.nowBean}京豆，${parseInt($.totalNum) - $.nowNum}金币\n`;
    message += `累计获得${$.totalBeanNum}京豆，${$.totalNum}金币\n可兑换${$.totalNum / 10000}元无门槛红包\n兑换入口:京东赚赚微信小程序->赚好礼->金币提现`;
    if (parseInt($.totalBeanNum) - $.nowBean > 0) {
      //IOS运行获得京豆大于0通知
      $.msg($.name, '', `京东账号${$.index} ${$.nickName}\n${message}`);
    } else {
      $.log(message);
    }
    allMessage += `京东账号${$.index} ${$.nickName}\n当前金币：${$.totalNum}个\n可兑换无门槛红包：${parseInt($.totalNum) / 10000}元\n兑换入口:京东赚赚微信小程序->赚好礼->金币提现${
      $.index !== cookiesArr.length ? '\n\n' : ''
    }`;
    resolve();
  });
}

function getUserInfo() {
  return new Promise((resolve) => {
    $.get(taskUrl('interactIndex'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
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

function getTaskList(flag = false) {
  return new Promise((resolve) => {
    $.get(taskUrl('interactTaskIndex', { mpVersion: '3.4.0' }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            $.taskList = data.data.taskDetailResList;
            $.totalNum = data.data.totalNum;
            $.totalBeanNum = data.data.totalBeanNum;
            if (flag && $.taskList.filter((item) => !!item && item['taskId'] === 3) && $.taskList.filter((item) => !!item && item['taskId'] === 3).length) {
              console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友互助码】${$.taskList.filter((item) => !!item && item['taskId'] === 3)[0]['itemId']}\n`);
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

// 完成
function doTask(body, func = 'doInteractTask') {
  // console.log(taskUrl("doInteractTask", body))
  return new Promise((resolve) => {
    $.get(taskUrl(func, body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            // console.log(data)
            if (func === 'doInteractTask') {
              if (data.subCode === 'S000') {
                console.log(`任务完成，获得 ${data.data.taskDetailResList[0].incomeAmountConf} 金币，${data.data.taskDetailResList[0].beanNum} 京豆`);
                $.bean += parseInt(data.data.taskDetailResList[0].beanNum);
              } else {
                console.log(`任务失败，错误信息：${data.message}`);
              }
            } else {
              console.log(`${data.data.helpResDesc}`);
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
    url: `${JD_API_HOST}?functionId=${functionId}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=9.1.0`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/json',
      Referer: 'http://wq.jd.com/wxapp/pages/hd-interaction/index/index',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
}
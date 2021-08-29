/**
 王者荣耀投票，脚本内随机随缘助力，，可以多跑几次试试看有没有助力上或者自己改脚本
 cron 23 8,9 22-31,1-5 8,9 * jd_king.js
 投票有几率获得豆子，没有抽中提示，没有推送，不要问我有没有抽到，反正很随缘。
 */

const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('王者荣耀投票');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let cookiesArr = [];
let UA = ``;
$.allInvite = [];
let useInfo = {};
$.helpEncryptAssignmentId = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
let uuid = randomWord(false, 40, 40);
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    UA = `jdapp;iPhone;10.0.8;14.6;${uuid};network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214222493;appBuild/168841;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16E158;supportJDSHWK/1`;
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = '';
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    await $.totalBean();
    console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
      });

      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue;
    }
    try {
      await main();
    } catch (e) {
      console.log(JSON.stringify(e));
    }
    await $.wait(1000);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function main() {
  $.invite = '';
  if ($.allInvite.length > 0) {
    $.invite = getRandomArrayElements($.allInvite, 1)[0];
  }
  $.activityId = 'wzplayertp';
  $.runFlag = false;
  $.activityInfo = {};
  await takeRequest('voteIndex');
  if (JSON.stringify($.activityInfo) === '{}') {
    console.log(`获取活动详情失败`);
    return;
  }
  console.log(`获取活动详情成功`);
  $.encryptProjectId = $.activityInfo.userInfoVO.encryptPin;
  useInfo[$.nickName] = $.encryptProjectId;
  await $.wait(2000);
  $.taskList = [];
  await takeRequest('voteTaskList');
  await $.wait(2000);
  await doTask();
  await $.wait(2000);
  let havePoll = $.activityInfo.userInfoVO.havePoll;
  let alreadPoll = $.activityInfo.userInfoVO.alreadPoll;
  let time = (havePoll - alreadPoll) / 5;
  console.log(`当前票数:${havePoll - alreadPoll},可以投票：${time}次`);
  for (let i = 0; i < time; i++) {
    let candidateVOS = $.activityInfo.candidateVOS;
    $.candidateId = getRandomArrayElements(candidateVOS, 1)[0].candidateId;
    console.log(`给${$.candidateId}投票`);
    await takeRequest('voteAndGetLuck');
    await $.wait(2000);
  }
}
async function doTask() {
  $.runFlag = false;
  for (let i = 0; i < $.taskList.length; i++) {
    $.oneTask = $.taskList[i];
    if ($.oneTask.status.finished) {
      console.log(`任务：${$.oneTask.type}，已完成`);
      continue;
    }
    if ($.oneTask.type === 'INVITE') {
      $.allInvite.push($.encryptProjectId);
    } else {
      console.log(`任务：${$.oneTask.type}，去执行`);
      $.taskInfo = {};
      await takeRequest('voteTaskDetail');
      await $.wait(1000);
      if (!$.taskInfo.status.finished && $.taskInfo.taskItemList.length > 0) {
        let finishNeed = $.taskInfo.status.finishNeed;
        for (let j = 0; j < finishNeed; j++) {
          $.oneInfo = $.taskInfo.taskItemList[j];
          console.log(`去浏览：${$.oneInfo.itemName}`);
          await takeRequest('doVoteTask');
          await $.wait(2000);
        }
        $.runFlag = true;
      } else {
        console.log(`失败`);
      }
    }
  }
  if ($.runFlag) {
    await takeRequest('voteIndex');
  }
}

function getRandomArrayElements(arr, count) {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - count,
    temp,
    index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

async function takeRequest(type) {
  let body = ``;
  let myRequest = ``;
  switch (type) {
    case 'voteIndex':
      body = `functionId=voteIndex&body={"actId":"wzplayertp","encryptPin":"${$.invite}"}&appid=megatron&client=megatron&clientVersion=1.0.0&_t=${Date.now()}`;
      break;
    case 'voteTaskList':
      body = `functionId=voteTaskList&body={"activityId":"wzplayertp"}&appid=megatron&client=megatron&clientVersion=1.0.0&_t=${Date.now()}`;
      break;
    case 'voteTaskDetail':
      body = `functionId=voteTaskDetail&body={"activityId":"wzplayertp","taskType":"${$.oneTask.type}"}&appid=megatron&client=megatron&clientVersion=1.0.0&_t=${Date.now()}`;
      break;
    case 'doVoteTask':
      body = `functionId=doVoteTask&body={"actId":"wzplayertp","taskType":"${$.oneTask.type}","itemId":"${
        $.oneInfo.itemId
      }","fp":"","token":"","frontendInitStatus":"","pageClickKey":-1,"platform":3}&appid=megatron&client=ios&clientVersion=10_6&networkType=&eid=&uuid=${uuid}&osVersion=10_6&d_brand=&d_model=&referer=-1&agent=-1&screen=414*736&lang=zh_CN&_t=${Date.now()}`;
      break;
    case 'voteAndGetLuck':
      body = `functionId=voteAndGetLuck&body={"actId":"wzplayertp","candidateId":"${
        $.candidateId
      }","voteNum":5,"fp":"","token":"","frontendInitStatus":"","pageClickKey":-1,"platform":3}&appid=megatron&client=ios&clientVersion=10_6&networkType=&eid=&uuid=${uuid}&osVersion=10_6&d_brand=&d_model=&referer=-1&agent=-1&screen=414*736&lang=zh_CN&_t=${Date.now()}`;
      break;
    default:
      console.log(`错误${type}`);
  }
  myRequest = getRequest(body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        dealReturn(type, data);
      } catch (e) {
        console.log(data);
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function dealReturn(type, data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log(`返回信息异常：${data}\n`);
    return;
  }
  switch (type) {
    case 'voteIndex':
      if (data.code === 0 && data.data) {
        $.activityInfo = data.data;
      }
      break;
    case 'voteTaskList':
      if (data.code === 0) {
        $.taskList = data.data;
      }
      break;
    case 'voteTaskDetail':
      if (data.code === 0) {
        $.taskInfo = data.data;
      }
      break;
    case 'doVoteTask':
      console.log(JSON.stringify(data));
      break;
    case 'voteAndGetLuck':
      console.log(JSON.stringify(data));
      break;
    case 'help':
      if (data.code === 0 && data.data.bizCode === '0') {
        $.codeInfo.time++;
        console.log(`助力成功`);
      } else if (data.code === '0' && data.data.bizCode === '104') {
        $.codeInfo.time++;
        console.log(`已助力过`);
      } else if (data.code === '0' && data.data.bizCode === '108') {
        $.canHelp = false;
        console.log(`助力次数已用完`);
      } else if (data.code === '0' && data.data.bizCode === '103') {
        console.log(`助力已满`);
        $.codeInfo.time = 3;
      } else if (data.code === '0' && data.data.bizCode === '2001') {
        $.canHelp = false;
        console.log(`黑号`);
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    default:
      console.log(JSON.stringify(data));
  }
}

function getRequest(body) {
  let url = 'https://api.m.jd.com/';
  const headers = {
    Origin: `https://oneshow-wz.jd.com`,
    Cookie: $.cookie,
    Connection: `keep-alive`,
    Accept: `application/json, text/plain, */*`,
    Referer: `https://oneshow-wz.jd.com/`,
    Host: `api.m.jd.com`,
    'User-Agent': UA,
    'Accept-Language': `zh-cn`,
    'Accept-Encoding': `gzip, deflate, br`,
  };
  return { url: url, headers: headers, body: body };
}

function randomWord(randomFlag, min, max) {
  var str = '',
    range = min,
    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

  // 随机产生
  if (randomFlag) {
    range = Math.round(Math.random() * (max - min)) + min;
  }
  for (var i = 0; i < range; i++) {
    pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
}
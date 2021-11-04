/*
双11特物
APP首页下滑,任务，互助
cron 10 9,13,16,19,20 2-8 11 * https://raw.githubusercontent.com/star261/jd/main/scripts/jd_superBrand.js
* */
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('双11特物');

const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
let shareList = [];
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookiesArr[i];
      $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
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
      try {
        await main($.cookie);
      } catch (e) {
        console.log(JSON.stringify(e));
      }
    }
  }
  if (shareList.length === 0) {
    return;
  }
  let allShareList = [];
  for (let i = 0; i < cookiesArr.length; i++) {
    let cookie = cookiesArr[i];
    let userName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
    for (let j = 0; j < shareList.length; j++) {
      if (shareList[j].user === userName) {
        allShareList.push(shareList[j]);
        break;
      }
    }
  }
  console.log(`\n-----------------------互助----------------------\n`);
  for (let i = 0; i < cookiesArr.length; i++) {
    let cookie = cookiesArr[i];
    let userName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
    let canHelp = true;
    for (let j = 0; j < allShareList.length && canHelp; j++) {
      let oneCodeInfo = allShareList[j];
      if (oneCodeInfo.user === userName || oneCodeInfo.need === 0) {
        continue;
      }
      console.log(`\n${userName}去助力:${oneCodeInfo.user}`);
      let doSupport = await takeRequest(
        cookie,
        'superBrandDoTask',
        `{"source":"card","activityId":${oneCodeInfo.activityId},"encryptProjectId":"${oneCodeInfo.encryptProjectId}","encryptAssignmentId":"${oneCodeInfo.encryptAssignmentId}","assignmentType":2,"itemId":"${oneCodeInfo.itemId}","actionType":0}`
      );
      if (doSupport.bizCode === '0') {
        console.log(`助力成功`);
      } else if (doSupport.bizCode === '103') {
        console.log(`助力已满`);
        oneCodeInfo.max = true;
      } else if (doSupport.bizCode === '108') {
        console.log(`助力次数已用完`);
        canHelp = false;
      }
      console.log(`助力结果：${JSON.stringify(doSupport)}`);
      await $.wait(2000);
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function main(cookie) {
  let userName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
  let cardInfo = await takeRequest(cookie, 'showSecondFloorCardInfo', `{"source":"card"}`);
  if (JSON.stringify(cardInfo) === '{}' || !cardInfo || !cardInfo.result || !cardInfo.result.activityBaseInfo) {
    console.log(`${userName},获取活动详情失败1`);
    return;
  }
  let activityBaseInfo = cardInfo.result.activityBaseInfo;
  let activityId = activityBaseInfo.activityId;
  let taskListInfo = await takeRequest(cookie, 'superBrandTaskList', `{"source":"card","activityId":${activityId},"assistInfoFlag":1}`);
  if (JSON.stringify(taskListInfo) === '{}' || JSON.stringify(cardInfo) === '{}') {
    console.log(`${userName},获取活动详情失败2`);
    return;
  }
  if (!taskListInfo || !taskListInfo.result || !taskListInfo.result.taskList) {
    console.log(`${userName},黑号`);
    return;
  }
  let taskList = taskListInfo.result.taskList || [];
  console.log(`\n${userName},获取活动详情成功`);
  let encryptProjectId = activityBaseInfo.encryptProjectId;
  let activityCardInfo = cardInfo.result.activityCardInfo;
  if (activityCardInfo.divideTimeStatus === 1 && activityCardInfo.divideStatus === 0 && activityCardInfo.cardStatus === 1) {
    console.log(`${userName},去瓜分`);
    let lotteryInfo = await takeRequest(cookie, 'superBrandTaskLottery', `{"source":"card","activityId":${activityId},"encryptProjectId":"${encryptProjectId}","tag":"divide"}`);
    console.log(`结果：${JSON.stringify(lotteryInfo)}`);
    return;
  } else if (activityCardInfo.divideTimeStatus === 1 && activityCardInfo.divideStatus === 1 && activityCardInfo.cardStatus === 1) {
    console.log(`${userName},已瓜分`);
    return;
  } else {
    console.log(`${userName},未集齐或者未到瓜分时间`);
  }
  await $.wait(2000);
  for (let i = 0; i < taskList.length; i++) {
    let oneTask = taskList[i];
    if (oneTask.completionFlag) {
      console.log(`任务：${oneTask.assignmentName},已完成`);
      if (oneTask.assignmentType === 2) {
        let time = oneTask.ext.cardAssistBoxRest || '0';
        for (let j = 0; j < time; j++) {
          console.log(`领取助力奖励`);
          let lottery = await takeRequest(cookie, 'superBrandTaskLottery', `{"source":"card","activityId":${activityId},"encryptProjectId":"${encryptProjectId}"}`);
          console.log(`结果：${JSON.stringify(lottery)}`);
          await $.wait(3000);
        }
      }
      continue;
    }
    if (oneTask.assignmentType === 1) {
      console.log(`任务：${oneTask.assignmentName},去执行,请稍稍`);
      let itemId = oneTask.ext.shoppingActivity[0].itemId || '';
      if (!itemId) {
        console.log(`任务：${oneTask.assignmentName},信息异常`);
      }
      let doInfo = await takeRequest(
        cookie,
        'superBrandDoTask',
        `{"source":"card","activityId":${activityId},"encryptProjectId":"${encryptProjectId}","encryptAssignmentId":"${oneTask.encryptAssignmentId}","assignmentType":${oneTask.assignmentType},"itemId":"${itemId}","actionType":0}`
      );
      console.log(`执行结果：${JSON.stringify(doInfo)}`);
      await $.wait(3000);
    }
    if (oneTask.assignmentType === 3) {
      console.log(`任务：${oneTask.assignmentName},去执行,请稍稍`);
      let itemId = oneTask.ext.followShop[0].itemId || '';
      if (!itemId) {
        console.log(`任务：${oneTask.assignmentName},信息异常`);
      }
      let doInfo = await takeRequest(
        cookie,
        'superBrandDoTask',
        `{"source":"card","activityId":${activityId},"encryptProjectId":"${encryptProjectId}","encryptAssignmentId":"${oneTask.encryptAssignmentId}","assignmentType":${oneTask.assignmentType},"itemId":"${itemId}","actionType":0}`
      );
      console.log(`执行结果：${JSON.stringify(doInfo)}`);
      await $.wait(3000);
    }
    if (oneTask.assignmentType === 7) {
      console.log(`任务：${oneTask.assignmentName},去执行,请稍稍`);
      let itemId = oneTask.ext.brandMemberList[0].itemId || '';
      if (!itemId) {
        console.log(`任务：${oneTask.assignmentName},信息异常`);
      }
      let doInfo = await takeRequest(
        cookie,
        'superBrandDoTask',
        `{"source":"card","activityId":${activityId},"encryptProjectId":"${encryptProjectId}","encryptAssignmentId":"${oneTask.encryptAssignmentId}","assignmentType":${oneTask.assignmentType},"itemId":"${itemId}","actionType":0}`
      );
      console.log(`执行结果：${JSON.stringify(doInfo)}`);
      await $.wait(3000);
    }
    if (oneTask.assignmentType === 5) {
      let signList = oneTask.ext.sign2 || [];
      if (signList.length === 0) {
        console.log(`任务：${oneTask.assignmentName},信息异常`);
      }
      if (oneTask.assignmentName === '首页限时下拉') {
        for (let j = 0; j < signList.length; j++) {
          if (signList[j].status === 1) {
            console.log(`任务：${oneTask.assignmentName},去执行,请稍稍`);
            let itemId = signList[j].itemId;
            let doInfo = await takeRequest(
              cookie,
              'superBrandDoTask',
              `{"source":"card","activityId":${activityId},"encryptProjectId":"${encryptProjectId}","encryptAssignmentId":"${oneTask.encryptAssignmentId}","assignmentType":${oneTask.assignmentType},"itemId":"${itemId}","actionType":0,"dropDownChannel":1}`
            );
            console.log(`执行结果：${JSON.stringify(doInfo)}`);
            await $.wait(3000);
          }
        }
      } else if (oneTask.assignmentName === '去首页下拉参与小游戏') {
        for (let j = 0; j < signList.length; j++) {
          if (signList[j].status === 1) {
            console.log(`任务：${oneTask.assignmentName},去执行,请稍稍`);
            let gameInfo = await takeRequest(cookie, 'showSecondFloorGameInfo', `{"source":"card"}`);
            let secCode = gameInfo.result.activityGameInfo.gameCurrentRewardInfo.secCode;
            let gameEncryptAssignmentId = gameInfo.result.activityGameInfo.gameCurrentRewardInfo.encryptAssignmentId;
            await $.wait(3000);
            let doInfo = await takeRequest(
              cookie,
              'superBrandTaskLottery',
              `{"source":"card","activityId":${activityId},"encryptProjectId":"${encryptProjectId}","encryptAssignmentId":"${gameEncryptAssignmentId}","secCode":"${secCode}"}`
            );
            console.log(`执行结果：${JSON.stringify(doInfo)}`);
            await $.wait(3000);
          }
        }
      }
    }
    if (oneTask.assignmentType === 2) {
      let itemId = oneTask.ext.assistTaskDetail.itemId || '';
      if (!itemId) {
        console.log(`任务：${oneTask.assignmentName},信息异常`);
      }
      shareList.push({ user: userName, activityId: activityId, encryptProjectId: encryptProjectId, encryptAssignmentId: oneTask.encryptAssignmentId, itemId: itemId, max: false });
    }
  }
}
async function takeRequest(cookie, functionId, bodyInfo) {
  let body = ``;
  let url = `https://api.m.jd.com/?uuid=8888&client=wh5&area=&appid=ProductZ4Brand&functionId=${functionId}&t=${Date.now()}&body=${encodeURIComponent(bodyInfo)}`;
  const headers = {
    Origin: `https://prodev.m.jd.com`,
    Cookie: cookie,
    Connection: `keep-alive`,
    Accept: `application/json, text/plain, */*`,
    Referer: `https://prodev.m.jd.com/mall/active/ZskuZGqQMZ2j6L99PM1L8jg2F2a/index.html`,
    Host: `api.m.jd.com`,
    'user-agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    'Accept-Language': `zh-cn`,
    'Accept-Encoding': `gzip, deflate, br`,
  };
  let myRequest = { url: url, headers: headers, body: body };
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (err) {
          console.log(err);
        } else {
          data = JSON.parse(data);
          if (data && data.data && JSON.stringify(data.data) === '{}') {
            console.log(JSON.stringify(data));
          }
        }
      } catch (e) {
        console.log(data);
        //$.logErr(e, resp)
      } finally {
        resolve(data.data || {});
      }
    });
  });
}

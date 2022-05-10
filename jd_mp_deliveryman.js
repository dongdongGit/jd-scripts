/**
 * 小鸽有礼-京小哥助手（微信小程序）
 * 每天抽奖25豆
 * 活动入口：微信小程序-京小哥助手
 * 2 2 * * * jd_mp_deliveryman.js 签到免单
 */

const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('微信小程序-京小哥助手');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const activityCode = '1519660363614781440';
$.helpCodeList = ['c9a1eb5d26944918b1e260c398d64fe0'];
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
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
      $.nickName = $.UserName;
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

      await dailyLottery();
    }
  }
  for (let i = 0; i < $.helpCodeList.length && cookiesArr.length > 0; i++) {
    if ($.helpCodeList[i].needHelp === 0) {
      continue;
    }
    for (let j = 0; j < cookiesArr.length && $.helpCodeList[i].needHelp !== 0; j++) {
      $.helpFlag = '';
      cookie = cookiesArr[j];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      if ($.helpCodeList[i].use === $.UserName) {
        continue;
      }
      console.log(`${$.UserName}助力:${$.helpCodeList[i].helpCpde}`);
      await helpFriend($.helpCodeList[i].helpCpde);
      if ($.helpFlag === true) {
        $.helpCodeList[i].needHelp -= 1;
      }
      cookiesArr.splice(j, 1);
      j--;
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function dailyLottery() {
  $.lotteryInfo = {};
  $.missionList = [];
  await Promise.all([getLotteryInfo(), getQueryMissionList()]);
  console.log(`初始化`);
  if ($.lotteryInfo.success !== true) {
    console.log(`${$.UserName}数据异常，执行失败`);
    return;
  }
  if ($.missionList.length === 0) {
    console.log(`${$.UserName}获取任务列表失败`);
  } else {
    await doMission(); //做任务
    await $.wait(1000);
    await Promise.all([getLotteryInfo(), getQueryMissionList()]);
    // await doMission();//做任务
    // await $.wait(1000);
    // await Promise.all([getLotteryInfo(), getQueryMissionList()]);
  }
  await $.wait(1000);
  if ($.missionList.length === 0) {
    console.log(`${$.UserName}获取任务列表失败`);
  } else {
    await collectionTimes(); //领任务奖励
    await $.wait(1000);
    await Promise.all([getLotteryInfo(), getQueryMissionList()]);
  }
  let drawNum = $.lotteryInfo.content.drawNum || 0;
  console.log(`共有${drawNum}次抽奖机会`);
  $.drawNumber = 1;
  for (let i = 0; i < drawNum; i++) {
    await $.wait(2000);
    //执行抽奖
    await lotteryDraw();
    $.drawNumber++;
  }
}

//助力
async function helpFriend(missionNo) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","missionNo":"${missionNo}"}]`;
  const myRequest = getPostRequest('luckdraw/helpFriend', body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        /*
         * {"code":1,"content":true,"data":true,"errorMsg":"SUCCESS","msg":"SUCCESS","success":true}
         * */
        console.log(`助力结果:${data}`);
        data = JSON.parse(data);
        if (data.success === true && data.content === true) {
          console.log(`助力成功`);
          $.helpFlag = true;
        } else {
          $.helpFlag = false;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//做任务
async function collectionTimes() {
  console.log(`开始领任务奖励`);
  for (let i = 0; i < $.missionList.length; i++) {
    await $.wait(1000);
    if ($.missionList[i].status === 11) {
      let getRewardNos = $.missionList[i].getRewardNos;
      for (let j = 0; j < getRewardNos.length; j++) {
        await collectionOneMission($.missionList[i].title, getRewardNos[j]); //领奖励
        await $.wait(2000);
      }
    }
  }
}

//做任务
async function doMission() {
  console.log(`开始执行任务`);
  for (let i = 0; i < $.missionList.length; i++) {
    if ($.missionList[i].status !== 1) {
      continue;
    }
    await $.wait(3000);
    if ($.missionList[i].jumpType === 135) {
      await doOneMission($.missionList[i]);
    } else if ($.missionList[i].jumpType === 1) {
      await createInvitation($.missionList[i]);
    }
  }
}

//邀请好友来抽奖
async function createInvitation(missionInfo) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}"}]`;
  const myRequest = getPostRequest('luckdraw/createInvitation', body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        //{"code": 1,"content": "ML:786c65ea-ca5c-4b3b-8b07-7ca5adaa8deb","data": "ML:786c65ea-ca5c-4b3b-8b07-7ca5adaa8deb","errorMsg": "SUCCESS","msg": "SUCCESS","success": true}
        data = JSON.parse(data);
        if (data.success === true) {
          $.helpCodeList.push({
            use: $.UserName,
            helpCpde: data.data,
            needHelp: missionInfo['totalNum'] - missionInfo['completeNum'],
          });
          console.log(`互助码(内部多账号自己互助)：${data.data}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//领奖励
async function collectionOneMission(title, getRewardNo) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}","getCode":"${getRewardNo}"}]`;
  const myRequest = getPostRequest('luckDraw/getDrawChance', body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true) {
          console.log(`${title}，领取任务奖励成功`);
        } else {
          console.log(JSON.stringify(data));
          console.log(`${title}，领取任务执行失败`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//做任务
async function doOneMission(missionInfo) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}","missionNo":"${missionInfo.missionNo}","params":${JSON.stringify(missionInfo.params)}}]`;
  const myRequest = getPostRequest('luckdraw/completeMission', body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true) {
          console.log(`${missionInfo.title}，任务执行成功`);
        } else {
          console.log(JSON.stringify(data));
          console.log(`${missionInfo.title}，任务执行失败`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//获取任务列表
async function getQueryMissionList() {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}"}]`;
  const myRequest = getPostRequest('luckdraw/queryMissionList', body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true) {
          $.missionList = data.content.missionList;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//获取信息
async function getLotteryInfo() {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}"}]`;
  const myRequest = getPostRequest('luckdraw/queryActivityBaseInfo', body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        $.lotteryInfo = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function lotteryDraw() {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}"}]`;
  const myRequest = getPostRequest('luckdraw/draw', body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true) {
          console.log(`${$.name}第${$.drawNumber}次抽奖，获得：${data.content.rewardDTO.title || ' '}`);
        } else {
          console.log(`${$.name}第${$.drawNumber}次抽奖失败`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function getPostRequest(type, body) {
  const url = `https://lop-proxy.jd.com/${type}`;
  const method = `POST`;
  const headers = {
    'Accept-Encoding': `gzip, deflate, br`,
    Host: `lop-proxy.jd.com`,
    Origin: `https://jingcai-h5.jd.com`,
    Connection: `keep-alive`,
    'biz-type': `service-monitor`,
    'Accept-Language': `zh-cn`,
    version: `1.0.0`,
    'Content-Type': `application/json;charset=utf-8`,
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A404 MicroMessenger/8.0.4(0x1800042c) NetType/4G Language/zh_CN',
    Referer: `https://jingcai-h5.jd.com`,
    ClientInfo: `{"appName":"jingcai","client":"m"}`,
    access: `H5`,
    Accept: `application/json, text/plain, */*`,
    'jexpress-report-time': `${new Date().getTime()}`,
    'source-client': `2`,
    'X-Requested-With': `XMLHttpRequest`,
    Cookie: cookie,
    'LOP-DN': `jingcai.jd.com`,
    AppParams: `{"appid":158,"ticket_type":"m"}`,
    'app-key': `jexpress`,
  };
  return { url: url, method: method, headers: headers, body: body };
}

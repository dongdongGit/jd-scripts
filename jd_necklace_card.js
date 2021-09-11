/*
京东APP 领券 --》浮窗集卡
cron 30 9,21 1-12 9 *  jd_necklacecard.js
*/

const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('天天集卡券');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const activityKey = '66f241a0515adf04b2ecb500827b119d';
$.inviteList = [];
let cookiesArr = [];
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
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = '';
    await $.totalBean();
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
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
  }
  cookiesArr = getRandomArrayElements(cookiesArr, cookiesArr.length);
  for (let i = 0; i < cookiesArr.length; i++) {
    $.canHelp = true;
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    for (let j = 0; j < $.inviteList.length && $.canHelp; j++) {
      $.oneInvite = $.inviteList[j];
      if ($.UserName === $.oneInvite.user || $.oneInvite.max) {
        continue;
      }
      console.log(`${$.UserName}去助力${$.oneInvite.user},助力码 ${$.oneInvite.groupId}`);
      await takeGetRequest('necklacecard_assist');
      await $.wait(3000);
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
  $.activityDetail = {};
  await takeGetRequest('necklacecard_cardHomePage');
  if (JSON.stringify($.activityDetail) === '{}') {
    console.log(`获取活动失败`);
    return;
  }
  console.log(`获取活动成功，已有卡片【${$.activityDetail.collectedCardsNum}】张，总共需要卡片【${$.activityDetail.totalCardsNum}】张`);
  await $.wait(2000);
  $.taskInfo = {};
  $.runFlag = false;
  $.updateFlag = false;
  let time = 0;
  do {
    await takeGetRequest('necklacecard_taskList');
    await $.wait(2000);
    await doTask($.taskInfo.componentTaskInfo);
    time++;
  } while ($.runFlag && time < 5);
  $.assistTaskInfo = $.taskInfo.assistTaskInfo;
  if ($.assistTaskInfo.assistDetails.length === $.assistTaskInfo.maxAssistedTimes) {
    console.log(`助力已满`);
  } else {
    await takeGetRequest('necklacecard_openGroup');
    await $.wait(2000);
  }
  if ($.updateFlag) {
    await takeGetRequest('necklacecard_cardHomePage');
    await $.wait(2000);
  }
  if ($.activityDetail.drawCardStatus === 2) {
    let drawCardChance = $.activityDetail.drawCardChance || 0;
    console.log(`可以抽奖${drawCardChance}次`);
    for (let i = 0; i < drawCardChance; i++) {
      console.log(`进行第${i + 1}次抽奖`);
      await takeGetRequest('necklacecard_openCard');
      await $.wait(3000);
    }
    await takeGetRequest('necklacecard_cardHomePage');
    await $.wait(2000);
  } else {
    console.log(`没有抽奖次数`);
  }
  if ($.activityDetail.collectedCardsNum === $.activityDetail.totalCardsNum) {
    let thisMessage = `第【${$.index}】个账号，卡片已满，进APP查看`;
    await notify.sendNotify('天天集卡券', thisMessage);
  } else {
    console.log(`已有卡片【${$.activityDetail.collectedCardsNum}】张，总共需要卡片【${$.activityDetail.totalCardsNum}】张`);
  }
}

async function doTask(taskList) {
  for (let i = 0; i < taskList.length; i++) {
    $.oneTaskInfo = taskList[i];
    if ($.oneTaskInfo.taskStatus === 3) {
      console.log(`任务：${$.oneTaskInfo.taskTitle || $.oneTaskInfo.name}，已完成`);
      continue;
    }
    if (($.oneTaskInfo.taskStatus === 1 || $.oneTaskInfo.taskStatus === 2) && [1, 2, 3, 4].indexOf($.oneTaskInfo.taskType) !== -1) {
      console.log(`任务：${$.oneTaskInfo.taskTitle || $.oneTaskInfo.name}，去执行`);
      await takeGetRequest('necklacecard_taskReport');
      await $.wait(3000);
      $.runFlag = true;
      $.updateFlag = true;
    } else {
      console.log(`任务：${$.oneTaskInfo.taskTitle || $.oneTaskInfo.name}，不执行`);
    }
  }
}

async function takeGetRequest(type) {
  let url = ``;
  let body = ``;
  let myRequest = ``;
  switch (type) {
    case 'necklacecard_cardHomePage':
    case 'necklacecard_taskList':
    case 'necklacecard_openCard':
    case 'necklacecard_openGroup':
      body = `body={"activityKey":"${activityKey}"}`;
      break;
    case 'necklacecard_taskReport':
      body = `body={"activityKey":"${activityKey}","encryptTaskId":"${$.oneTaskInfo.encryptTaskId}","itemId":"${$.oneTaskInfo.itemId}"}`;
      break;
    case 'necklacecard_assist':
      body = `body={"activityKey":"${activityKey}","groupId":"${$.oneInvite.groupId}","uuid":"${randomWord(false, 40, 40)}"}`;
      break;
    default:
      console.log(`错误${type}`);
  }
  url = `https://api.m.jd.com/api?functionId=${type}&appid=coupon-necklace&client=wh5&t=${Date.now()}`;
  myRequest = getPostRequest(url, body);
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
    case 'necklacecard_cardHomePage':
      if (data.rtn_code === 0) {
        $.activityDetail = data.data.result;
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    case 'necklacecard_taskList':
      if (data.rtn_code === 0) {
        $.taskInfo = data.data.result;
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    case 'necklacecard_taskReport':
      if (data.rtn_code === 0) {
        console.log(`执行成功`);
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    case 'necklacecard_openCard':
      if (data.rtn_code === 0) {
        console.log(`获得卡片：${data.data.result.cardName || ''}`);
      }
      console.log(JSON.stringify(data));
      break;
    case 'necklacecard_openGroup':
      if (data.rtn_code === 0) {
        let groupId = data.data.result.groupId;
        console.log(`助力ID：${groupId}`);
        $.inviteList.push({
          groupId: groupId,
          user: $.UserName,
          max: false,
        });
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    case 'necklacecard_assist':
      if (data.rtn_code === 0) {
        let thisData = data.data;
        if (thisData.biz_code === 0) {
          console.log(`助力成功`);
        } else if (thisData.biz_code === 6) {
          console.log(`助力次数已用完`);
          $.canHelp = false;
        } else if (thisData.biz_code === 7) {
          console.log(`助力已满`);
          $.oneInvite.max = true;
        } else if (thisData.biz_code === 2222) {
          console.log(`黑号`);
          $.canHelp = false;
        } else {
          console.log(JSON.stringify(data));
        }
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    default:
      console.log(JSON.stringify(data));
  }
}

function getPostRequest(url, body) {
  const method = `POST`;
  const headers = {
    Accept: `application/json, text/plain, */*`,
    Origin: `https://h5.m.jd.com`,
    'Accept-Encoding': `gzip, deflate, br`,
    Cookie: $.cookie,
    'Content-Type': `application/x-www-form-urlencoded`,
    Host: `api.m.jd.com`,
    Connection: `keep-alive`,
    'User-Agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    Referer: `https://h5.m.jd.com/babelDiy/Zeus/3Ck6vd8Tz4sJFme5keU9KifFM3aW/index.html`,
    'Accept-Language': `zh-cn`,
  };
  return { url: url, method: method, headers: headers, body: body };
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
/**
 * 随机从一数组里面取
 * @param arr
 * @param count
 * @returns {Buffer}
 */
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
function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: 'https://me-api.jd.com/user_new/info/GetJDUserInfoUnion',
      headers: {
        Host: 'me-api.jd.com',
        Accept: '*/*',
        Connection: 'keep-alive',
        Cookie: $.cookie,
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        Referer: 'https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === '1001') {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === '0' && data.data && data.data.hasOwnProperty('userInfo')) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            $.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e);
      } finally {
        resolve();
      }
    });
  });
}

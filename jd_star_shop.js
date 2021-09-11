/*
9.10-9.17 明星小店
cron 12 19 10-17 9 * jd_star_shop.js
 */

const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('明星小店');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
$.inviteCodeList = [];
$.authorCodeList = [];
let cookiesArr = [];
$.linkID = '';
let uniqueIdList = [{ id: 'RU59FC', name: '尹正', linkID: 'o4Z4uGy8EYe_-RY7p-Uw_Q', taskId: 244 }];
const rewardList = ['o4Z4uGy8EYe_-RY7p-Uw_Q'];
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
  console.log(`==================开始执行明星小店任务==================`);
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
    await main();
  }
  if ($.authorCodeList.length > 0) {
    $.inviteCodeList.push(...getRandomArrayElements($.authorCodeList, 1));
  }
  cookiesArr = getRandomArrayElements(cookiesArr, cookiesArr.length);
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.taskId = false;
    while (!$.taskId) {
      let sar = Math.floor(Math.random() * uniqueIdList.length);
      $.uniqueId = uniqueIdList[sar].id;
      $.linkID = uniqueIdList[sar].linkID;
      $.taskId = uniqueIdList[sar].taskId;
    }
    for (let k = 0; k < $.inviteCodeList.length; k++) {
      $.oneCode = $.inviteCodeList[k];
      console.log(`${$.UserName}去助力：${$.uniqueId} 活动，助力码：${$.oneCode}`);
      //await takePostRequest('help');
      await help();
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

async function help() {
  const url = `https://api.m.jd.com/?functionId=activityStarBackGetProgressInfo&body={%22starId%22:%22${$.uniqueId}%22,%22sharePin%22:%22${$.oneCode}%22,%22taskId%22:%22${
    $.taskId
  }%22,%22linkId%22:%22${$.linkID}%22}&_t=${Date.now()}&appid=activities_platform`;
  const headers = {
    Origin: `https://prodev.m.jd.com`,
    Cookie: $.cookie,
    Connection: `keep-alive`,
    Accept: `application/json, text/plain, */*`,
    Referer: `https://prodev.m.jd.com/mall/active/34LcYfTMVLu6QPowsoLtk383Hcfv/index.html`,
    Host: `api.m.jd.com`,
    'User-Agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    'Accept-Encoding': `gzip, deflate, br`,
    'Accept-Language': `zh-cn`,
  };
  let myRequest = { url: url, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        try {
          console.log(data);
        } catch (e) {
          console.log(`返回异常：${data}`);
          return;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function main() {
  let sendMessage = '';
  uniqueIdList = getRandomArrayElements(uniqueIdList, uniqueIdList.length);
  console.log(`现共查询到${uniqueIdList.length}个明星小店\n`);
  for (let j = 0; j < uniqueIdList.length; j++) {
    try {
      $.uniqueId = uniqueIdList[j].id;
      $.helpCode = '';
      console.log(`开始第${j + 1}个明星小店，ID：${$.uniqueId},明星：${uniqueIdList[j].name}`);
      $.linkID = uniqueIdList[j].linkID;
      await starShop();
      await $.wait(1000);
      if (j === 0) {
        console.log(`互助码：${$.helpCode}`);
        $.inviteCodeList.push($.helpCode);
      }
      console.log(`\n`);
    } catch (e) {
      console.log(JSON.stringify(e.message));
    }
  }
  console.log(`=============${$.UserName}：明星小店奖励汇总================`);
  await $.wait(1000);
  for (let i = 0; i < rewardList.length; i++) {
    $.linkID = rewardList[i];
    $.rewards = [];
    await getReward();
    for (let i = 0; i < $.rewards.length; i++) {
      if ($.rewards[i].prizeType === 1) {
        console.log(`获得优惠券`);
      } else if ($.rewards[i].prizeType === 6) {
        console.log(`获得明星照片或者视频`);
      } else if ($.rewards[i].prizeType === 5) {
        if (!$.rewards[i].fillReceiverFlag) {
          console.log(`获得实物：${$.rewards[i].prizeDesc || ''},未填写地址`);
          sendMessage += `【京东账号${$.index}】${$.UserName}，获得实物：${$.rewards[i].prizeDesc || ''}\n`;
        } else {
          console.log(`获得实物：${$.rewards[i].prizeDesc || ''},已填写地址`);
        }
      } else if ($.rewards[i].prizeType === 10) {
        console.log(`获得京豆`);
      } else {
        console.log(`获得其他：${$.rewards[i].prizeDesc || ''}`);
      }
    }
  }
  if (sendMessage) {
    sendMessage += `填写收货地址路径：\n京东首页，搜索明星（尹正），进入明星小店，我的礼物，填写收货地址`;
    await notify.sendNotify(`星店长`, sendMessage);
  }
}

Date.prototype.Format = function (fmt) {
  //author: meizz
  var o = {
    'M+': this.getUTCMonth() + 1, //月份
    'd+': this.getUTCDate(), //日
    'h+': this.getUTCHours(), //小时
    'm+': this.getUTCMinutes(), //分
    's+': this.getUTCSeconds(), //秒
    'q+': Math.floor((this.getUTCMonth() + 3) / 3), //季度
    S: this.getUTCMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getUTCFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o) if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
  return fmt;
};
async function getReward() {
  const url = `https://api.m.jd.com/?functionId=activityStarBackGetRewardList&body={%22linkId%22:%22${$.linkID}%22}&_t=${Date.now()}&appid=activities_platform`;
  const method = `GET`;
  const headers = {
    Origin: `https://prodev.m.jd.com`,
    Cookie: $.cookie,
    Connection: `keep-alive`,
    Accept: `application/json, text/plain, */*`,
    Referer: `https://prodev.m.jd.com/mall/active/7s5TYVpp8dKXF4FrDqe55H8esSV/index.html`,
    Host: `api.m.jd.com`,
    'User-Agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    'Accept-Encoding': `gzip, deflate, br`,
    'Accept-Language': `zh-cn`,
  };
  const myRequest = { url: url, method: method, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.code === 0) {
          $.rewards = data.data;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function starShop() {
  $.info = {};
  //await takePostRequest('activityStarBackGetProgressBarInfo');
  await getInfo();
  if (JSON.stringify($.info) === '{}') {
    console.log(`获取活动失败，ID：${$.uniqueId}`);
  }
  let prize = $.info.prize;
  let runFlag = false;
  for (let i = 1; i < 5; i++) {
    $.onePrize = prize[i];
    if ($.onePrize.state === 1) {
      console.log(`去抽奖，奖品为：${$.onePrize.name}`);
      await takePostRequest('activityStarBackDrawPrize');
      await $.wait(2000);
    } else if ($.onePrize.state === 0) {
      runFlag = true;
    }
  }
  if (!runFlag) {
    console.log(`该明星小店已完成所有抽奖`);
    return;
  }
  $.taskList = [];
  await takePostRequest('apTaskList');
  await $.wait(2000);
  $.runFlag = false;
  for (let i = 0; i < $.taskList.length; i++) {
    $.oneTask = $.taskList[i];
    if ($.oneTask.taskFinished) {
      console.log(`任务：${$.oneTask.taskTitle}，已完成`);
      continue;
    }
    if ($.oneTask.taskType === 'SHARE_INVITE') {
      continue;
    }
    $.runFlag = true;
    console.log(`去做任务：${$.oneTask.taskTitle}`);
    if ($.oneTask.taskType === 'SIGN') {
      await takePostRequest('SIGN');
      await $.wait(2000);
    } else if ($.oneTask.taskType === 'BROWSE_CHANNEL' || $.oneTask.taskType === 'FOLLOW_SHOP') {
      $.taskDetail = {};
      $.taskItemList = [];
      await takePostRequest('apTaskDetail');
      $.taskItemList = $.taskDetail.taskItemList || [];
      for (let j = 0; j < $.taskItemList.length; j++) {
        $.oneItemInfo = $.taskItemList[j];
        console.log(`浏览：${$.oneItemInfo.itemName}`);
        await takePostRequest('apDoTask');
        await $.wait(2000);
      }
    }
  }
  if ($.runFlag) {
    await getInfo();
    prize = $.info.prize;
    for (let i = 1; i < 5; i++) {
      $.onePrize = prize[i];
      if ($.onePrize.state === 1) {
        console.log(`去抽奖，奖品为：${$.onePrize.name}`);
        await takePostRequest('activityStarBackDrawPrize');
        await $.wait(2000);
      }
    }
  }
}

async function takePostRequest(type) {
  let body = ``;
  let myRequest = ``;
  switch (type) {
    case 'activityStarBackGetProgressBarInfo':
      body = `functionId=activityStarBackGetProgressBarInfo&body={"starId":"${$.uniqueId}","linkId":"${$.linkID}"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      console.log(body);
      break;
    case 'apTaskList':
      body = `functionId=apTaskList&body={"uniqueId":"${$.uniqueId}","linkId":"${$.linkID}"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case 'SIGN':
      body = `functionId=apDoTask&body={"taskType":"${$.oneTask.taskType}","taskId":${$.oneTask.id},"uniqueId":"${$.uniqueId}","linkId":"${$.linkID}"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case 'apTaskDetail':
      body = `functionId=apTaskDetail&body={"taskType":"${$.oneTask.taskType}","taskId":${$.oneTask.id},"uniqueId":"${$.uniqueId}","channel":4,"linkId":"${
        $.linkID
      }"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case 'apDoTask':
      body = `functionId=apDoTask&body={"taskType":"${$.oneTask.taskType}","taskId":${$.oneTask.id},"uniqueId":"${$.uniqueId}","channel":4,"linkId":"${$.linkID}","itemId":"${encodeURIComponent(
        $.oneItemInfo.itemId
      )}"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case 'help':
      body = `functionId=activityStarBackGetProgressBarInfo&body={"starId":"${$.uniqueId}","sharePin":"${$.oneCode}","taskId":"129","linkId":"${$.linkID}"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case 'activityStarBackDrawPrize':
      body = `functionId=activityStarBackDrawPrize&body={"starId":"${$.uniqueId}","poolId":${$.onePrize.id},"pos":${$.onePrize.pos},"linkId":"${$.linkID}"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    default:
      console.log(`错误${type}`);
  }
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        dealReturn(type, data);
      } catch (e) {
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
    console.log(`返回异常：${data}`);
    return;
  }
  switch (type) {
    case 'activityStarBackGetProgressBarInfo':
      if (data.code === 0) {
        console.log(`${data.data.shareText}`);
        $.helpCode = data.data.encryptPin;
        $.info = data.data;
      }
      break;
    case 'apTaskList':
      if (data.code === 0) {
        $.taskList = data.data;
      }
      break;
    case 'SIGN':
      if (data.code === 0) {
        console.log('签到成功');
      }
      break;
    case 'apTaskDetail':
      if (data.code === 0) {
        $.taskDetail = data.data;
      }
      break;
    case 'apDoTask':
      if (data.code === 0) {
        console.log('成功');
      }
      break;
    case 'help':
      console.log('助力结果：' + JSON.stringify(data));
      break;
    case 'activityStarBackDrawPrize':
      if (data.code === 0) {
        if (data.data.prizeType === 0) {
          console.log(`未抽中`);
        } else {
          console.log(`恭喜你、可能抽中了（以明星小店奖励汇总为准）`);
        }
      }
      console.log(JSON.stringify(data));
      break;
    default:
      console.log('异常');
      console.log(JSON.stringify(data));
  }
}

function getPostRequest(body) {
  const url = `https://api.m.jd.com/?${body}`;
  const headers = {
    Origin: `https://prodev.m.jd.com`,
    Cookie: $.cookie,
    Connection: `keep-alive`,
    Accept: `application/json, text/plain, */*`,
    Referer: `https://prodev.m.jd.com/mall/active/34LcYfTMVLu6QPowsoLtk383Hcfv/index.html`,
    Host: `api.m.jd.com`,
    'User-Agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    'Accept-Encoding': `gzip, deflate, br`,
    'Accept-Language': `zh-cn`,
  };
  return { url: url, headers: headers, body: '' };
}

async function getInfo() {
  const url = `https://api.m.jd.com/?functionId=activityStarBackGetProgressInfo&body={%22starId%22:%22${$.uniqueId}%22,%22linkId%22:%22${$.linkID}%22}&_t=${Date.now()}&appid=activities_platform`;
  const headers = {
    Origin: `https://prodev.m.jd.com`,
    Cookie: $.cookie,
    Connection: `keep-alive`,
    Accept: `application/json, text/plain, */*`,
    Referer: `https://prodev.m.jd.com/mall/active/34LcYfTMVLu6QPowsoLtk383Hcfv/index.html`,
    Host: `api.m.jd.com`,
    'User-Agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    'Accept-Encoding': `gzip, deflate, br`,
    'Accept-Language': `zh-cn`,
  };
  let myRequest = { url: url, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        try {
          data = JSON.parse(data);
          if (data.code === 0) {
            console.log(`${data.data.shareText}`);
            $.helpCode = data.data.encryptPin;
            $.info = data.data;
          }
        } catch (e) {
          console.log(`返回异常：${data}`);
          return;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
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

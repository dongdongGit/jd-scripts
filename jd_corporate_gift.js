/*
author:Ariszy

[task_local]
#企有此礼
30 0 * * * jd_qycl, tag= 企有此礼
================Loon==============
[Script]
cron "30 0 * * *" script-path= jd_qycl,tag= 企有此礼
===============Surge=================
企有此礼 = type=cron,cronexp="30 0 * * *",wake-system=1,timeout=3600,script-path= jd_qycl
============小火箭=========
企有此礼 = type=cron,script-path= jd_qycl, cronexpr="30 0 * * *", timeout=3600, enable=true
*/

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('企有此礼');
const notify = $.isNode() ? require('./sendNotify') : '';
cookiesArr = [];
CodeArr = [];
cookie = '';
var list2tokenArr = [],
  list4tokenArr = [],
  list6tokenArr = [],
  list5tokenArr = [],
  list4tokenArr = [],
  list3tokenArr = [],
  list1tokenArr = [],
  list2tokenArr = [],
  listtokenArr = [],
  list0tokenArr = [],
  list1tokenArr = [];
var taskid, token, helpcode;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
let tz = $.getval('tz') || '1'; //0关闭通知，1默认开启
const invite = 1; //新用户自动邀请，0关闭，1默认开启
const logs = 0; //0为关闭日志，1为开启
var hour = '';
var minute = '';
if ($.isNode()) {
  hour = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).getHours();
  minute = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).getMinutes();
} else {
  hour = new Date().getHours();
  minute = new Date().getMinutes();
}
//CK运行
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
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    message = '';
    $.isLogin = true;
    $.index = i + 1;
    $.skuIds = [];
    console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
    await $.totalBean();
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
      });

      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue;
    }
    await gethelpcode();
    await getlist();
    await Ariszy();
    await zy();
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    message = '';
    $.isLogin = true;
    $.index = i + 1;
    console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}助力模块*********\n`);

    await control();
    await lottery();
    await userScore();
    await $.clearShoppingCart();
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

function PostRequest(uri, body) {
  const url = `https://api.m.jd.com/client.action`;
  const method = `POST`;
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-cn',
    Connection: 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: cookie,
    Host: 'api.m.jd.com',
    'User-Agent':
      'jdapp;iPhone;10.0.6;14.4;0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849;network/4g;model/iPhone12,1;addressid/2377723269;appBuild/167724;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
  };
  return { url: url, method: method, headers: headers, body: body };
}

async function doTask() {
  const body = `functionId=harmony_collectScore&body=%7B%22appId%22:%221ElBTx6o%22,%22taskToken%22:%22${token}%22,%22taskId%22:${taskid},%22actionType%22:1%7D&client=wh5&clientVersion=1.0.0`;
  const MyRequest = PostRequest(``, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.code == 0) {
          console.log('\n' + result.data.bizMsg + '\n');
          await $.wait(10000);
        } else {
          $.log(result.data.bizMsg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function doneTask() {
  const body = `functionId=harmony_collectScore&body=%7B%22appId%22:%221ElBTx6o%22,%22taskToken%22:%22${token}%22,%22taskId%22:${taskid},%22actionType%22:0%7D&client=wh5&clientVersion=1.0.0`;
  const MyRequest = PostRequest(``, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.data.bizCode == 0) {
          console.log(result.data.bizMsg + '获得' + result.data.result.score + ';共有' + result.data.result.userScore + '\n');
          await $.wait(4000);
        } else {
          console.log(result.data.bizMsg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function lottery() {
  const body = `functionId=interact_template_getLotteryResult&body=%7B%22appId%22:%221ElBTx6o%22%7D&client=wh5&clientVersion=1.0.0`;
  const MyRequest = PostRequest(``, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.data.result.userAwardsCacheDto.type == 2) {
          console.log('\n获得' + result.data.result.userAwardsCacheDto.jBeanAwardVo.ext + '\n');
          await $.wait(4000);
        } else {
          $.log('恭喜你获得京豆0个\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function getLottery() {
  const body = `functionId=interact_template_getLotteryResult&body=%7B%22appId%22:%221ElBTx6o%22%7D&client=wh5&clientVersion=1.0.0`;
  const MyRequest = PostRequest(``, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.data.bizCode == 0 && result.data.result.lotteryReturnCode == 0) {
          console.log('\n获得' + result.data.result.userAwardsCacheDto.jBeanAwardVo.prizeName + '\n');
          await $.wait(4000);
        } else {
          $.log(result.data.bizMsg + '  恭喜你抽中了0豆豆\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function Ariszy() {
  for (let j = 0; j < listtokenArr.length; j++) {
    token = list2tokenArr[j];
    taskid = listtokenArr[j].match(/\d+/);
    $.log('TaskId：' + taskid);
    $.log('Token：' + token);
    await doTask();
    await doneTask();
  }
}
async function scans() {
  for (let j = 0; j < list0tokenArr.length; j++) {
    token = list1tokenArr[j];
    taskid = list0tokenArr[j].match(/\d+/);
    $.log('TaskId：' + taskid);
    $.log('Token：' + token);
    await doTask();
    await doneTask();
  }
}
async function zy() {
  listtokenArr.splice(0, listtokenArr.length);
  list2tokenArr.splice(0, list2tokenArr.length);
  list0tokenArr.splice(0, list0tokenArr.length);
  list1tokenArr.splice(0, list1tokenArr.length);
}
async function Zy() {
  for (let i = 0; i < 7; i++) {
    await scan();
    await scans();
    list0tokenArr.splice(0, list0tokenArr.length);
    list1tokenArr.splice(0, list1tokenArr.length);
  }
}
async function control() {
  for (let i = 0; i < list1tokenArr.distinct().length; i++) {
    helpcode = list1tokenArr[i];
    await dosupport();
    await $.wait(4000);
  }
}
async function dosupport() {
  const body = `functionId=harmony_collectScore&body=%7B%22appId%22:%221ElBTx6o%22,%22taskToken%22:%22${helpcode}%22,%22taskId%22:6,%22actionType%22:0%7D&client=wh5&clientVersion=1.0.0`;
  const MyRequest = PostRequest(``, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.data.bizCode == 0) {
          console.log(result.data.bizMsg + '获得' + result.data.result.score + ';共有' + result.data.result.userScore + '\n');
          await $.wait(4000);
        } else {
          console.log(result.data.bizMsg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function getlist() {
  const MyRequest = PostRequest(``, `functionId=healthyDay_getHomeData&body=%7B%22appId%22:%221ElBTx6o%22,%22taskToken%22:%22%22,%22channelId%22:1%7D&client=wh5&clientVersion=1.0.0`);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        // console.log(result.data.result.taskVos[4].productInfoVos);
        if (logs) $.log(data);
        if (result.code == 0) {
          console.log('查看任务列表\n');
          let list1 = result.data.result.taskVos.find((item) => item.taskId == 1);
          listtokenArr.push(1 + list1.simpleRecordInfoVo.taskToken);
          list2tokenArr.push(list1.simpleRecordInfoVo.taskToken);

          let list2 = result.data.result.taskVos.find((item) => item.taskId == 2);
          for (let i = 0; i < list2.shoppingActivityVos.length; i++) {
            listtokenArr.push(2 + list2.shoppingActivityVos[i].taskToken);
            list2tokenArr.push(list2.shoppingActivityVos[i].taskToken);
          }

          let list3 = result.data.result.taskVos.find((item) => item.taskId == 3);
          for (let i = 0; i < list3.followShopVo.length; i++) {
            listtokenArr.push(3 + list3.followShopVo[i].taskToken);
            list2tokenArr.push(list3.followShopVo[i].taskToken);
          }

          let list4 = result.data.result.taskVos.find((item) => item.taskId == 4);
          for (let i = 0; i < list4.shoppingActivityVos.length; i++) {
            listtokenArr.push(4 + list4.shoppingActivityVos[i].taskToken);
            list2tokenArr.push(list4.shoppingActivityVos[i].taskToken);
            //$.log(list4.productInfoVos[i].taskToken)
          }

          let list5 = result.data.result.taskVos.find((item) => item.taskId == 5);
          for (let i = 0; i < list5.productInfoVos.length; i++) {
            listtokenArr.push(5 + list5.productInfoVos[i].taskToken);
            list2tokenArr.push(list5.productInfoVos[i].taskToken);
            $.skuIds.push(list5.productInfoVos[i].skuId)
            //$.log(list5.followShopVo[i].taskToken)
          }

          //$.log(JSON.stringify(listtokenArr))
        } else {
          $.log(result.data.bizMsg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function scan() {
  const MyRequest = PostRequest(``, `functionId=healthyDay_getHomeData&body=%7B%22appId%22:%221ElBTx6o%22,%22taskToken%22:%22%22,%22channelId%22:1%7D&client=wh5&clientVersion=1.0.0`);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.code == 0) {
          let list6 = result.data.result.taskVos.find((item) => item.taskId == 6);
          for (let i = 0; i < list4.productInfoVos.length; i++) {
            list0tokenArr.push(6 + list6.productInfoVos[i].taskToken);
            list1tokenArr.push(list4.productInfoVos[i].taskToken);
          }
        } else {
          $.log(result.data.bizMsg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function gethelpcode() {
  const MyRequest = PostRequest(``, `functionId=healthyDay_getHomeData&body=%7B%22appId%22%3A%221ElBTx6o%22%2C%22taskToken%22%3A%22%22%2C%22channelId%22%3A1%7D&client=wh5&clientVersion=1.0.0`);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.code == 0) {
          let list6 = result.data.result.taskVos.find((item) => item.taskId == 6);
          list0tokenArr.push(6 + list6.assistTaskDetailVo.taskToken);
          list1tokenArr.push(list6.assistTaskDetailVo.taskToken);
        } else {
          $.log(result.data.bizMsg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}

async function userScore() {
  const MyRequest = PostRequest(``, `functionId=healthyDay_getHomeData&body={"appId":"1ElBTx6o","taskToken":"","channelId":1}&client=wh5&clientVersion=1.0.0`);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.code == 0) {
          let userScore = result.data.result.userInfo.userScore;
          $.log('共有省心值：' + userScore + ';开始抽奖' + Math.floor(userScore / 300) + '次');
          for (let i = 0; i < Math.floor(userScore / 300); i++) {
            await getLottery();
          }
        } else {
          $.log(result.data.bizMsg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
//showmsg
//boxjs设置tz=1，在12点<=20和23点>=40时间段通知，其余时间打印日志

async function showmsg() {
  if (tz == 1) {
    if ($.isNode()) {
      if ((hour == 12 && minute <= 20) || (hour == 23 && minute >= 40)) {
        await notify.sendNotify($.name, message);
      } else {
        $.log(message);
      }
    } else {
      if ((hour == 12 && minute <= 20) || (hour == 23 && minute >= 40)) {
        $.msg(zhiyi, '', message);
      } else {
        $.log(message);
      }
    }
  } else {
    $.log(message);
  }
}

Array.prototype.distinct = function () {
  var arr = this,
    result = [],
    len = arr.length;
  arr.forEach(function (v, i, arr) {
    //这里利用map，filter方法也可以实现
    var bool = arr.indexOf(v, i + 1); //从传入参数的下一个索引值开始寻找是否存在重复
    if (bool === -1) {
      result.push(v);
    }
  });
  return result;
};

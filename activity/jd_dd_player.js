/*
[task_local]
#东东玩家
40 0,19 https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_ddwj.js, tag= 东东玩家
================Loon==============
[Script]
cron "40 0,19" script-path= https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_ddwj.js,tag= 东东玩家
===============Surge=================
东东玩家 = type=cron,cronexp="40 0,19",wake-system=1,timeout=3600,script-path= https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_ddwj.js
============小火箭=========
东东玩家 = type=cron,script-path= https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_ddwj.js, cronexpr="40 0,19", timeout=3600, enable=true
*/

const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
const $ = jd_env.env('东东玩家');
const notify = $.isNode() ? require('../sendNotify') : '';
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
var taskid, token, helpcode, secretp, userUnlockedPlaceNum;
const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';
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
    await gethelpcode();
    await getlist();
    await getsecretp();
    await getfeedtoken();
    await Ariszy();
    await zy();
    //await userScore()
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    message = '';
    $.isLogin = true;
    $.index = i + 1;
    console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}助力模块*********\n`);
    await getsecretp();
    await control();
    await userScore();
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

function PostRequest(uri, body) {
  const url = `https://api.m.jd.com/client.action?${uri}`;
  const method = `POST`;
  const headers = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-cn',
    Connection: 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded',
    Origin: 'https://h5.m.jd.com',
    Cookie: cookie,
    Host: 'api.m.jd.com',
    'User-Agent':
      'jdapp;iPhone;10.0.6;14.4;0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849;network/4g;model/iPhone12,1;addressid/2377723269;appBuild/167724;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
  };
  return { url: url, method: method, headers: headers, body: body };
}

async function doTask() {
  const body = `functionId=funny_collectScore&body=%7B%22taskId%22%3A${taskid}%2C%22taskToken%22%3A%22${token}%22%2C%22ss%22%3A%22%7B%5C%22extraData%5C%22%3A%7B%5C%22log%5C%22%3A%5C%22%5C%22%2C%5C%22sceneid%5C%22%3A%5C%22HWJhPageh5%5C%22%7D%2C%5C%22secretp%5C%22%3A%5C%22${secretp}%5C%22%2C%5C%22random%5C%22%3A%5C%2243136926%5C%22%7D%22%2C%22actionType%22%3A1%7D&client=wh5&clientVersion=1.0.0&uuid=0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849&appid=o2_act`;
  const MyRequest = PostRequest(`advId=funny_collectScore`, body);
  //$.log(JSON.stringify(MyRequest))
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.code == 0) {
          console.log('\n' + result.data.bizMsg + '\n');
          await $.wait(8000);
        } else {
          $.log(result.msg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function DoTask() {
  const body = `functionId=funny_collectScore&body=%7B%22taskId%22%3A${taskid}%2C%22taskToken%22%3A%22${token}%22%2C%22ss%22%3A%22%7B%5C%22extraData%5C%22%3A%7B%5C%22log%5C%22%3A%5C%22%5C%22%2C%5C%22sceneid%5C%22%3A%5C%22HWJhPageh5%5C%22%7D%2C%5C%22secretp%5C%22%3A%5C%22${secretp}%5C%22%2C%5C%22random%5C%22%3A%5C%2243136926%5C%22%7D%22%2C%22actionType%22%3A0%7D&client=wh5&clientVersion=1.0.0&uuid=0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849&appid=o2_act`;
  const MyRequest = PostRequest(`advId=funny_collectScore`, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.data.bizCode == 0) {
          console.log(result.data.result.successToast + '\n');
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
async function unlock() {
  const body = `functionId=funny_raise&body=%7B%22id%22%3A${userUnlockedPlaceNum}%2C%22ss%22%3A%22%7B%5C%22extraData%5C%22%3A%7B%5C%22log%5C%22%3A%5C%22%5C%22%2C%5C%22sceneid%5C%22%3A%5C%22HWJhPageh5%5C%22%7D%2C%5C%22secretp%5C%22%3A%5C%22${secretp}%5C%22%2C%5C%22random%5C%22%3A%5C%2276834380%5C%22%7D%22%7D&client=wh5&clientVersion=1.0.0&uuid=0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849&appid=o2_act`;
  //$.log(secretp)
  const MyRequest = PostRequest(`advId=funny_raise`, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.data.bizCode == 0) {
          console.log('\n获得' + result.data.result.levelUpAward.pieceRedpacket.value + result.data.result.levelUpAward.pieceRedpacket.name + '\n');
          await $.wait(4000);
        } else {
          $.log('解锁失败，好玩币不足' + result.data.bizMsg + '\n');
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function getsecretp() {
  const body = `functionId=funny_getHomeData&body=%7B%22isNeedPop%22%3A%221%22%2C%22currentEarth%22%3A3%7D&client=wh5&clientVersion=1.0.0&appid=o2_act`;
  const MyRequest = PostRequest(`advId=funny_getHomeData`, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        secretp = result.data.result.homeMainInfo.secretp;
        userUnlockedPlaceNum = result.data.result.homeMainInfo.raiseInfo.userEarthInfo.userUnlockedPlaceNum;
        //$.log(userUnlockedPlaceNum)
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
    if (taskid == 2 || taskid == 4 || taskid == 8 || taskid == 14) {
      await doTask();
      await DoTask();
    } else {
      await doTask();
    }
  }
}
async function scans() {
  for (let j = 0; j < list0tokenArr.length; j++) {
    token = list1tokenArr[j];
    taskid = list0tokenArr[j].match(/\d+/);
    $.log('TaskId：' + taskid);
    $.log('Token：' + token);
    await doTask();
    await DoTask();
  }
}
async function zy() {
  listtokenArr.splice(0, listtokenArr.length);
  list2tokenArr.splice(0, list2tokenArr.length);
  //list0tokenArr.splice(0,list0tokenArr.length);
  //list1tokenArr.splice(0,list1tokenArr.length);
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
  const body = `functionId=funny_collectScore&body=%7B%22ss%22%3A%22%7B%5C%22extraData%5C%22%3A%7B%5C%22log%5C%22%3A%5C%22%5C%22%2C%5C%22sceneid%5C%22%3A%5C%22HWJhPageh5%5C%22%7D%2C%5C%22secretp%5C%22%3A%5C%22${secretp}%5C%22%2C%5C%22random%5C%22%3A%5C%2269009870%5C%22%7D%22%2C%22inviteId%22%3A%22${helpcode}%22%2C%22isCommonDealError%22%3Atrue%7D&client=wh5&clientVersion=1.0.0&uuid=0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849&appid=o2_act`;
  const MyRequest = PostRequest(`advId=funny_collectScore`, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.data.bizCode == 0) {
          console.log(result.data.bizMsg + '获得' + result.data.result.score + '好玩豆\n');
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
  const MyRequest = PostRequest(
    `?advId=funny_getTaskDetail`,
    `functionId=funny_getTaskDetail&body=%7B%22taskId%22%3A%22%22%2C%22appSign%22%3A%221%22%7D&client=wh5&clientVersion=1.0.0&uuid=0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849&appid=o2_act`
  );
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.code == 0) {
          console.log('查看任务列表\n');

          let list2 = result.data.result.taskVos.find((item) => item.taskId == 2);
          let maxTimes2 = list2.maxTimes;
          for (let i = 0; i < maxTimes2; i++) {
            listtokenArr.push(2 + list2.shoppingActivityVos[i].taskToken);
            list2tokenArr.push(list2.shoppingActivityVos[i].taskToken);
          }

          let list3 = result.data.result.taskVos.find((item) => item.taskId == 3);
          let maxTimes3 = list3.maxTimes;
          for (let i = 0; i < maxTimes3; i++) {
            listtokenArr.push(3 + list3.shoppingActivityVos[i].taskToken);
            list2tokenArr.push(list3.shoppingActivityVos[i].taskToken);
          }

          let list4 = result.data.result.taskVos.find((item) => item.taskId == 4);
          let maxTimes4 = list4.maxTimes;
          for (let i = 0; i < maxTimes4; i++) {
            listtokenArr.push(4 + list4.browseShopVo[i].taskToken);
            list2tokenArr.push(list4.browseShopVo[i].taskToken);
            //$.log(list4.productInfoVos[i].taskToken)
          }

          let list6 = result.data.result.taskVos.find((item) => item.taskId == 6);
          let maxTimes6 = list6.maxTimes;
          for (let i = 0; i < maxTimes6; i++) {
            listtokenArr.push(6 + list6.brandMemberVos[i].taskToken);
            list2tokenArr.push(list6.brandMemberVos[i].taskToken);
            //$.log(list5.followShopVo[i].taskToken)
          }

          let list7 = result.data.result.taskVos.find((item) => item.taskId == 7);
          let maxTimes7 = list7.maxTimes;
          for (let i = 0; i < maxTimes7; i++) {
            listtokenArr.push(7 + list7.shoppingActivityVos[i].taskToken);
            list2tokenArr.push(list7.shoppingActivityVos[i].taskToken);
            //$.log(list5.followShopVo[i].taskToken)
          }
          let list8 = result.data.result.taskVos.find((item) => item.taskId == 8);
          let maxTimes8 = list8.maxTimes;
          for (let i = 0; i < maxTimes8; i++) {
            listtokenArr.push(8 + list8.shoppingActivityVos[i].taskToken);
            list2tokenArr.push(list8.shoppingActivityVos[i].taskToken);
            //$.log(list5.followShopVo[i].taskToken)
          }
          //$.log(JSON.stringify(listtokenArr))
          let list13 = result.data.result.taskVos.find((item) => item.taskId == 13);
          let maxTimes13 = list13.maxTimes;
          for (let i = 0; i < maxTimes13; i++) {
            listtokenArr.push(13 + list13.followShopVo[i].taskToken);
            list2tokenArr.push(list13.followShopVo[i].taskToken);
            //$.log(list5.followShopVo[i].taskToken)
          }
          let list14 = result.data.result.taskVos.find((item) => item.taskId == 14);
          let maxTimes14 = list14.maxTimes;
          for (let i = 0; i < maxTimes14; i++) {
            listtokenArr.push(14 + list14.shoppingActivityVos[i].taskToken);
            list2tokenArr.push(list14.shoppingActivityVos[i].taskToken);
            //$.log(list5.followShopVo[i].taskToken)
          }
          let list15 = result.data.result.taskVos.find((item) => item.taskId == 15);
          let maxTimes15 = list15.maxTimes;
          for (let i = 0; i < maxTimes15; i++) {
            listtokenArr.push(15 + list15.shoppingActivityVos[i].taskToken);
            list2tokenArr.push(list15.shoppingActivityVos[i].taskToken);
            //$.log(list5.followShopVo[i].taskToken)
          }
          let list16 = result.data.result.taskVos.find((item) => item.taskId == 16);
          let maxTimes16 = list16.maxTimes;
          for (let i = 0; i < maxTimes16; i++) {
            listtokenArr.push(16 + list16.shoppingActivityVos[i].taskToken);
            list2tokenArr.push(list16.shoppingActivityVos[i].taskToken);
            //$.log(list5.followShopVo[i].taskToken)
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
async function getfeedtoken() {
  for (let i = 9; i < 13; i++) {
    await getfeedlist(i);
  }
}
async function getfeedlist(Taskid) {
  const Body = `functionId=funny_getFeedDetail&body=%7B%22taskId%22%3A%22${Taskid}%22%7D&client=wh5&clientVersion=1.0.0&appid=o2_act`;
  const MyRequest = PostRequest(`?advId=funny_getFeedDetail`, Body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.data.bizCode == 0) {
          let lists = result.data.result.addProductVos.find((item) => item.taskId == Taskid);
          let maxTimes = lists.maxTimes;
          for (let i = 0; i < maxTimes; i++) {
            listtokenArr.push(Taskid + lists.productInfoVos[i].taskToken);
            list2tokenArr.push(lists.productInfoVos[i].taskToken);
            //$.log(JSON.stringify((list2tokenArr)))
          }
          //await zy()
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
  const MyRequest = PostRequest(
    `?advId=funny_getTaskDetail`,
    `functionId=funny_getTaskDetail&body=%7B%22taskId%22%3A%22%22%2C%22appSign%22%3A%221%22%7D&client=wh5&clientVersion=1.0.0&uuid=0bcbcdb2a68f16cf9c9ad7c9b944fd141646a849&appid=o2_act`
  );
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.code == 0) {
          let list5 = result.data.result.taskVos.find((item) => item.taskId == 5);
          list0tokenArr.push(5 + list5.assistTaskDetailVo.taskToken);
          list1tokenArr.push(list5.assistTaskDetailVo.taskToken);
          //$.log(list5.assistTaskDetailVo.taskToken)
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
  const body = `functionId=funny_getHomeData&body=%7B%22isNeedPop%22%3A%221%22%2C%22currentEarth%22%3A3%7D&client=wh5&clientVersion=1.0.0&appid=o2_act`;
  const MyRequest = PostRequest(`advId=funny_getHomeData`, body);
  return new Promise((resolve) => {
    $.post(MyRequest, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (logs) $.log(data);
        if (result.code == 0) {
          let userScore = result.data.result.homeMainInfo.raiseInfo.remainScore;
          let turn = Math.floor(userScore / (result.data.result.homeMainInfo.raiseInfo.nextLevelScore - result.data.result.homeMainInfo.raiseInfo.curLevelStartScore));
          if (turn > 0) {
            $.log('共有好玩币：' + userScore + ';开始解锁🔓' + turn + '次\n');
            for (let i = 0; i < turn; i++) {
              await unlock();
            }
          } else $.log('好玩币不够,不解锁\n');
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

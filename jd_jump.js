/*
跳跳乐瓜分京豆脚本
更新时间：2021-05-21
活动入口：来客有礼(微信小程序)=>跳跳乐或京东APP=》首页=》母婴馆=》底部中间
注：脚本好像还是会加商品到购物车，慎使用
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
================QuantumultX==================
[task_local]
#跳跳乐瓜分京豆
1 0,11,21 * * * jd_jump.js, tag=跳跳乐瓜分京豆, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
===================Loon==============
[Script]
cron "1 0,11,21 * * *" script-path=jd_jump.js, tag=跳跳乐瓜分京豆
===============Surge===============
[Script]
跳跳乐瓜分京豆 = type=cron,cronexp="1 0,11,21 * * *",wake-system=1,timeout=3600,script-path=jd_jump.js
====================================小火箭=============================
跳跳乐瓜分京豆 = type=cron,script-path=jd_jump.js, cronexpr="1 0,11,21 * * *", timeout=3600, enable=true
*/

const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('跳跳乐瓜分京豆');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
// $.helpCodeList = [];
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
  console.log(`注：脚本好像还是会加商品到购物车，慎使用。\n`);
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
      await jump();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function jump() {
  $.nowTime = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
  $.jumpList = [];
  await getGameList();
  if ($.jumpList.length === 0) {
    console.log(`获取活动列表失败，请等待下一期活动\n`);
    return;
  }
  await $.wait(1000);
  for (let i = 0; i < $.jumpList.length; i++) {
    $.jumpId = $.jumpList[i].id;
    $.oneJumpInfo = {};
    $.rewardList = [];
    let oldReward = 0;
    let newReward = 0;
    await getOneJumpInfo();
    if (JSON.stringify($.oneJumpInfo) === '{}') {
      console.log(`获取ID为${$.jumpId}的活动详情失败`);
      continue;
    }
    $.jumpName = $.oneJumpInfo.jumpActivityDetail.name;
    if ($.oneJumpInfo.userInfo.userState === 'received') {
      console.log(`${$.jumpName},活动已结束，已参与瓜分`);
      console.log(`\n`);
      continue;
    } else if ($.oneJumpInfo.userInfo.userState === 'unreceive') {
      $.shareBean = 0;
      //瓜分
      console.log(`${$.jumpName},瓜分京豆`);
      await receive();
      await $.wait(2000);
      await rewards();
      console.log(`瓜分获得${$.shareBean}京豆\n`);
      continue;
    } else if ($.nowTime > $.oneJumpInfo.jumpActivityDetail.endTime) {
      console.log(`${$.jumpName},活动已结束`);
      console.log(`\n`);
      continue;
    } else if ($.oneJumpInfo.userInfo.userState === 'complete') {
      console.log(`${$.jumpName},已到达终点，等待瓜分，瓜分时间：${new Date($.oneJumpInfo.jumpActivityDetail.endTime)} 之后`);
      console.log(`\n`);
      break;
    } else if ($.oneJumpInfo.userInfo.userState === 'playing') {
      console.log(
        `开始执行活动：${$.jumpName}，活动时间：${new Date($.oneJumpInfo.jumpActivityDetail.startTime).toLocaleString()}至${new Date($.oneJumpInfo.jumpActivityDetail.endTime).toLocaleString()}`
      );
    } else {
      //complete
      console.log(`异常`);
      continue;
    }
    await $.wait(1000);
    await getBeanRewards();
    oldReward = await getReward();
    console.log(`已获得京豆：${oldReward}`);
    await $.wait(1000);
    $.taskList = [];
    await getTaskList();
    await $.wait(1000);
    await doTask();
    if ($.oneJumpInfo.userInfo.gridTaskDone === false) {
      await domission();
    }
    await $.wait(1000);
    await getOneJumpInfo();
    let flag = true;
    if ($.oneJumpInfo.userInfo.diceLeft === 0) {
      console.log(`骰子数量为0`);
    }
    let runTime = 0;
    while ($.oneJumpInfo.userInfo.diceLeft > 0 && flag && runTime < 10) {
      //丢骰子
      await throwDice();
      if ($.gridType && ($.gridType === 'boom' || $.gridType === 'road_block' || $.gridType === 'join_member' || $.gridType === 'add_cart')) break;
      await $.wait(3000);
      switch ($.gridType) {
        case 'give_dice':
        case 'empty':
        case 'lose_dice':
        case 'cart_bean':
        case 'arrow':
          //不用处理
          break;
        case 'go_back':
        case 'go_ahead':
          await throwDice();
          await $.wait(2000);
          await getOneJumpInfo();
          if ($.oneJumpInfo.userInfo.gridTaskDone === false) {
            await domission();
          }
          break;
        case 'follow_channel':
        case 'scan_good':
        case 'add_cart':
        case 'join_member':
        case 'boom':
        case 'road_block':
        case 'follow_shop':
          await domission();
          break;
        case 'destination':
          flag = false;
          console.log('到达终点');
          break;
        default:
          flag = false;
          console.log('未判断情况');
      }
      await $.wait(2000);
      await getOneJumpInfo();
      runTime++;
    }
    newReward = await getReward();
    console.log(`执行结束,本次执行获得${newReward - oldReward}京豆,共获得${newReward}京豆`);
    console.log(`\n`);
    await $.wait(2000);
  }
}

async function rewards() {
  const myRequest = getGetRequest('rewards', `activityId=${$.jumpId}`);
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        //console.log(data);
        if (data) {
          data = JSON.parse(data);
          if (data.success === true) {
            let rewardList = data.datas;
            for (let i = 0; i < rewardList.length; i++) {
              if (rewardList[i].activityId === $.jumpId) {
                $.shareBean = rewardList[i].shareBean;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function getReward() {
  await getBeanRewards();
  let reward = 0;
  for (let j = 0; j < $.rewardList.length; j++) {
    reward += Number($.rewardList[j].value);
  }
  return reward;
}

//做任务
async function domission() {
  console.log('执行骰子任务');
  const myRequest = getGetRequest('doTask', `activityId=${$.jumpId}`);
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function throwDice() {
  console.log('丢骰子');
  const myRequest = getGetRequest('throwDice', `activityId=${$.jumpId}&fp=&eid=`);
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        //console.log(data);
        if (data) {
          data = JSON.parse(data);
          $.gridType = data.data.gridInfo && data.data.gridInfo.gridType;
          console.log(`丢骰子结果：${$.gridType}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve($.gridType);
      }
    });
  });
}

async function getBeanRewards() {
  const myRequest = getGetRequest('getBeanRewards', `activityId=${$.jumpId}`);
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        if (data) {
          data = JSON.parse(data);
          $.rewardList = data.datas;
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
async function doTask() {
  let addFlag = true;
  for (let i = 0; i < $.taskList.length; i++) {
    let oneTask = $.taskList[i];
    if (oneTask.state === 'finished') {
      console.log(`${oneTask.content},已完成`);
      continue;
    }
    if (oneTask.gridTask === 'add_cart' && oneTask.state === 'unfinish' && addFlag) {
      if (oneTask.gridTask === 'add_cart') {
        console.log(`不做：【${oneTask.content}】 任务`);
        continue;
      }
      console.log(`开始执行任务：${oneTask.content}`);
      let skuList = [];
      for (let j = 0; j < oneTask.goodsInfo.length; j++) {
        skuList.push(oneTask.goodsInfo[j].sku);
      }
      skuList.sort(sortNumber);
      await addCart(skuList);
      addFlag = false;
    }
  }
}

async function addCart(skuList) {
  let body = `{"activityId":"${$.jumpId}","skuList":${JSON.stringify(skuList)}}`;
  const myRequest = getPostRequest('addCart', body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (data) {
          data = JSON.parse(data);
          if (data.success === true) {
            console.log(`任务执行成功`);
          }
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
async function getTaskList() {
  const myRequest = getGetRequest('getTools', `activityId=${$.jumpId}&reqSource=h5`);
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        if (data) {
          data = JSON.parse(data);
          if (data.success === true) {
            $.taskList = data.datas;
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function receive() {
  const myRequest = getGetRequest('receive', `activityId=${$.jumpId}`);
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        if (data) {
          data = JSON.parse(data);
          if (data.success === true) {
            console.log(`瓜分成功`);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//获取活动信息
async function getOneJumpInfo() {
  const myRequest = getGetRequest('getHomeInfo', `activityId=${$.jumpId}`);
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        if (data) {
          data = JSON.parse(data);
          if (data.success === true) {
            $.oneJumpInfo = data.data;
            //console.log(JSON.stringify($.oneJumpInfo))
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//获取活动列表
async function getGameList() {
  const myRequest = getGetRequest('getGameList', 'pageSize=8&pageNum=1');
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        if (data) {
          data = JSON.parse(data);
          if (data.success === true) {
            $.jumpList = data.datas;
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function getGetRequest(type, body) {
  const url = `https://jdjoy.jd.com/jump/${type}?${body}`;
  const method = `GET`;
  const headers = {
    Cookie: cookie,
    Accept: `*/*`,
    Connection: `keep-alive`,
    Referer: `https://jdjoy.jd.com/dist/taro/index.html/`,
    'Accept-Encoding': `gzip, deflate, br`,
    Host: `jdjoy.jd.com`,
    'User-Agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    'Accept-Language': `zh-cn`,
  };
  return { url: url, method: method, headers: headers };
}

function getPostRequest(type, body) {
  const url = `https://jdjoy.jd.com/jump/${type}`;
  const method = `POST`;
  const headers = {
    Accept: `*/*`,
    Origin: `https://jdjoy.jd.com`,
    'Accept-Encoding': `gzip, deflate, br`,
    Cookie: cookie,
    'Content-Type': `application/json`,
    Host: `jdjoy.jd.com`,
    Connection: `keep-alive`,
    'User-Agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    Referer: `https://jdjoy.jd.com/dist/taro/index.html/`,
    'Accept-Language': `zh-cn`,
  };
  return (myRequest = { url: url, method: method, headers: headers, body: body });
}

function sortNumber(a, b) {
  return a - b;
}

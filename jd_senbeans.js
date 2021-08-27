/*
送豆得豆
活动入口：来客有礼小程序
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#送豆得豆
45 1,12 * * * jd_sendBeans.js, tag=送豆得豆, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon==============
[Script]
cron "45 1,12 * * *" script-path=jd_sendBeans.js,tag=送豆得豆
===============Surge=================
送豆得豆 = type=cron,cronexp="45 1,12 * * *",wake-system=1,timeout=3600,script-path=jd_sendBeans.js
============小火箭=========
送豆得豆 = type=cron,script-path=jd_sendBeans.js, cronexpr="45 1,12 * * *", timeout=3600, enable=true
 */
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('送豆得豆');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
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
  $.isLoginInfo = {};
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  $.activityId = '';
  $.completeNumbers = '';
  console.log(`开始获取活动信息`);
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.index = i + 1;
    $.isLogin = true;
    $.nickName = '';
    await TotalBean();
    $.isLoginInfo[$.UserName] = $.isLogin;
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
      });
      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue;
    }
    await myReward();
  }
  for (let i = 0; (cookiesArr.length < 3 ? i < cookiesArr.length : i < 3) && $.activityId === ''; i++) {
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.isLogin = true;
    $.nickName = '';
    if (!$.isLoginInfo[$.UserName]) continue;
    await getActivityInfo();
  }
  if ($.activityId === '') {
    console.log(`获取活动ID失败`);
    return;
  }
  let openCount = Math.floor((Number(cookiesArr.length) - 1) / Number($.completeNumbers));
  console.log(`\n共有${cookiesArr.length}个账号，前${openCount}个账号可以开团\n`);
  $.openTuanList = [];
  console.log(`前${openCount}个账号开始开团\n`);
  for (let i = 0; i < cookiesArr.length && i < openCount; i++) {
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.index = i + 1;
    $.isLogin = true;
    $.nickName = '';
    if (!$.isLoginInfo[$.UserName]) {
      await TotalBean();
      console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
      $.isLoginInfo[$.UserName] = $.isLogin;
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
    } else {
      console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
    }
    await openTuan();
  }
  console.log('\n开团信息\n' + JSON.stringify($.openTuanList));
  console.log(`\n开始互助\n`);
  let ckList = getRandomArrayElements(cookiesArr, cookiesArr.length);
  for (let i = 0; i < ckList.length && $.openTuanList.length > 0; i++) {
    $.cookie = ckList[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.index = i + 1;
    $.isLogin = true;
    if (!$.isLoginInfo[$.UserName]) {
      await TotalBean();
      $.isLoginInfo[$.UserName] = $.isLogin;
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
    }
    await helpMain();
  }
  console.log(`\n开始领取奖励\n`);
  for (let i = 0; i < cookiesArr.length && i < openCount; i++) {
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.index = i + 1;
    $.isLogin = true;
    if (!$.isLoginInfo[$.UserName]) {
      await TotalBean();
      $.isLoginInfo[$.UserName] = $.isLogin;
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
    }
    console.log(`\n*****开始【京东账号${$.index}】${$.UserName}*****\n`);
    await rewardMain();
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function getActivityInfo() {
  $.activityList = [];
  await getActivityList();
  if ($.activityList.length === 0) {
    return;
  }
  for (let i = 0; i < $.activityList.length; i++) {
    if ($.activityList[i].status !== 'NOT_BEGIN') {
      $.activityId = $.activityList[i].activeId;
      break;
    }
  }
  await $.wait(3000);
  $.detail = {};
  await getActivityDetail();
  if (JSON.stringify($.detail) === '{}') {
    console.log(`获取活动详情失败`);
    return;
  } else {
    console.log(`获取活动详情成功`);
  }
  $.completeNumbers = $.detail.activityInfo.completeNumbers;
  console.log(`获取到的活动ID：${$.activityId},需要邀请${$.completeNumbers}人瓜分`);
}

async function myReward() {
  return new Promise(async (resolve) => {
    let lkt = new Date().getTime();
    let lks = $.md5('' + 'ztmFUCxcPMNyUq0P' + lkt).toString();
    let options = {
      url: `https://sendbeans.jd.com/common/api/bean/activity/myReward?itemsPerPage=10&currentPage=1&sendType=0&invokeKey=ztmFUCxcPMNyUq0P`,
      headers: {
        Host: 'sendbeans.jd.com',
        Origin: 'https://sendbeans.jd.com',
        Cookie: $.cookie,
        'app-id': 'h5',
        Connection: 'keep-alive',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        Referer: 'https://sendbeans.jd.com/dist/index.html',
        'Accept-Encoding': 'gzip, deflate, br',
        openId: '',
        lkt: lkt,
        lks: lks,
      },
    };
    $.get(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success) {
          for (let key of Object.keys(data.datas)) {
            let vo = data.datas[key];
            if (vo.status === 3 && vo.type === 2) {
              $.rewardRecordId = vo.id;
              await rewardBean();
              $.rewardRecordId = '';
            }
          }
        } else {
          console.log(JSON.stringify(data));
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(data);
      }
    });
  });
}

async function getActivityList() {
  return new Promise((resolve) => {
    let lkt = new Date().getTime();
    let lks = $.md5('' + 'ztmFUCxcPMNyUq0P' + lkt).toString();
    let options = {
      url: `https://sendbeans.jd.com/common/api/bean/activity/get/entry/list/by/channel?channelId=14&channelType=H5&sendType=0&singleActivity=false&invokeKey=ztmFUCxcPMNyUq0P`,
      headers: {
        Host: 'sendbeans.jd.com',
        Origin: 'https://sendbeans.jd.com',
        Cookie: $.cookie,
        Connection: 'keep-alive',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        Referer: 'https://sendbeans.jd.com/dist/index.html',
        'Accept-Encoding': 'gzip, deflate, br',
        openId: '',
        lkt: lkt,
        lks: lks,
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success) {
          $.activityList = data.data.items;
        } else {
          console.log(JSON.stringify(data));
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(data);
      }
    });
  });
}

async function openTuan() {
  $.detail = {};
  $.rewardRecordId = '';
  await getActivityDetail();
  if (JSON.stringify($.detail) === '{}') {
    console.log(`获取活动详情失败`);
    return;
  } else {
    $.rewardRecordId = $.detail.rewardRecordId;
    console.log(`获取活动详情成功`);
  }
  await $.wait(3000);
  if (!$.rewardRecordId) {
    if (!$.detail.invited) {
      await invite();
      await $.wait(1000);
      await getActivityDetail();
      await $.wait(3000);
      $.rewardRecordId = $.detail.rewardRecordId;
      console.log(`【京东账号${$.index}】${$.UserName} 瓜分ID:${$.rewardRecordId}`);
    }
  } else {
    console.log(`【京东账号${$.index}】${$.UserName} 瓜分ID:${$.rewardRecordId}`);
  }
  $.openTuanList.push({
    user: $.UserName,
    rewardRecordId: $.rewardRecordId,
    completed: $.detail.completed,
    rewardOk: $.detail.rewardOk,
  });
}

async function helpMain() {
  $.canHelp = true;
  for (let j = 0; j < $.openTuanList.length && $.canHelp; j++) {
    $.oneTuanInfo = $.openTuanList[j];
    if ($.UserName === $.oneTuanInfo['user']) {
      continue;
    }
    if ($.oneTuanInfo['completed']) {
      continue;
    }
    console.log(`${$.UserName}去助力${$.oneTuanInfo['user']}`);
    $.detail = {};
    $.rewardRecordId = '';
    await getActivityDetail();
    if (JSON.stringify($.detail) === '{}') {
      console.log(`获取活动详情失败`);
      return;
    } else {
      $.rewardRecordId = $.detail.rewardRecordId;
      console.log(`获取活动详情成功`);
    }
    await $.wait(3000);
    await help();
    await $.wait(2000);
  }
}

async function rewardMain() {
  $.detail = {};
  $.rewardRecordId = '';
  await getActivityDetail();
  if (JSON.stringify($.detail) === '{}') {
    console.log(`获取活动详情失败`);
    return;
  } else {
    $.rewardRecordId = $.detail.rewardRecordId;
    console.log(`获取活动详情成功`);
  }
  await $.wait(3000);
  if ($.rewardRecordId && $.detail.completed && !$.detail.rewardOk) {
    await rewardBean();
    await $.wait(2000);
  } else if ($.rewardRecordId && $.detail.completed && $.detail.rewardOk) {
    console.log(`奖励已领取`);
  } else {
    console.log(`未满足条件，不可领取奖励`);
  }
}
async function rewardBean() {
  return new Promise((resolve) => {
    let lkt = new Date().getTime();
    let lks = $.md5('' + 'ztmFUCxcPMNyUq0P' + lkt).toString();
    let options = {
      url: `https://draw.jdfcloud.com/common/api/bean/activity/sendBean?rewardRecordId=${$.rewardRecordId}&jdChannelId=&userSource=mp&appId=wxccb5c536b0ecd1bf&invokeKey=ztmFUCxcPMNyUq0P`,
      headers: {
        'content-type': `application/json`,
        Connection: `keep-alive`,
        'Accept-Encoding': `gzip,compress,br,deflate`,
        'App-Id': `wxccb5c536b0ecd1bf`,
        'Lottery-Access-Signature': `wxccb5c536b0ecd1bf1537237540544h79HlfU`,
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        openId: `oPcgJ4_X7uCMeTgGmar-rmiWst1Y`,
        Host: `draw.jdfcloud.com`,
        Referer: `https://servicewechat.com/wxccb5c536b0ecd1bf/733/page-frame.html`,
        cookie: $.cookie,
        lkt: lkt,
        lks: lks,
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success) {
          console.log(`领取豆子奖励成功`);
        } else {
          console.log(JSON.stringify(data));
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(data);
      }
    });
  });
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

async function help() {
  await new Promise((resolve) => {
    let lkt = new Date().getTime();
    let lks = $.md5('' + 'ztmFUCxcPMNyUq0P' + lkt).toString();
    let options = {
      url: `https://draw.jdfcloud.com/common/api/bean/activity/participate?activityId=${$.activityId}&inviteUserPin=${encodeURIComponent(
        $.oneTuanInfo['user']
      )}&invokeKey=ztmFUCxcPMNyUq0P&timestap=${Date.now()}`,
      headers: {
        'content-type': `application/json`,
        Connection: `keep-alive`,
        'Accept-Encoding': `gzip,compress,br,deflate`,
        'App-Id': `wxccb5c536b0ecd1bf`,
        'Lottery-Access-Signature': `wxccb5c536b0ecd1bf1537237540544h79HlfU`,
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        openId: `oPcgJ4_X7uCMeTgGmar-rmiWst1Y`,
        Host: `draw.jdfcloud.com`,
        Referer: `https://servicewechat.com/wxccb5c536b0ecd1bf/733/page-frame.html`,
        cookie: $.cookie,
        lkt: lkt,
        lks: lks,
      },
    };
    $.post(options, (err, resp, res) => {
      try {
        if (res) {
          res = JSON.parse(res);
          if (res.data.result === 5) {
            $.oneTuanInfo['completed'] = true;
          } else if (res.data.result === 0 || res.data.result === 1) {
            $.canHelp = false;
          }
          console.log(JSON.stringify(res));
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(res);
      }
    });
  });
}

async function invite() {
  let lkt = new Date().getTime();
  let lks = $.md5('' + 'ztmFUCxcPMNyUq0P' + lkt).toString();
  const url = `https://draw.jdfcloud.com/common/api/bean/activity/invite?openId=oPcgJ4_X7uCMeTgGmar-rmiWst1Y&activityId=${$.activityId}&userSource=mp&formId=123&jdChannelId=&fp=&appId=wxccb5c536b0ecd1bf&invokeKey=ztmFUCxcPMNyUq0P`;
  const method = `POST`;
  const headers = {
    'content-type': `application/json`,
    Connection: `keep-alive`,
    'Accept-Encoding': `gzip,compress,br,deflate`,
    'App-Id': `wxccb5c536b0ecd1bf`,
    'Lottery-Access-Signature': `wxccb5c536b0ecd1bf1537237540544h79HlfU`,
    'User-Agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    openId: `oPcgJ4_X7uCMeTgGmar-rmiWst1Y`,
    Host: `draw.jdfcloud.com`,
    Referer: `https://servicewechat.com/wxccb5c536b0ecd1bf/733/page-frame.html`,
    cookie: $.cookie,
    lkt: lkt,
    lks: lks,
  };
  const body = `{}`;
  const myRequest = {
    url: url,
    method: method,
    headers: headers,
    body: body,
  };
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success) {
          console.log(`发起瓜分成功`);
        } else {
          console.log(JSON.stringify(data));
        }
      } catch (e) {
        console.log(data);
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function getActivityDetail() {
  let lkt = new Date().getTime();
  let lks = $.md5('' + 'ztmFUCxcPMNyUq0P' + lkt).toString();
  const url = `https://draw.jdfcloud.com/common/api/bean/activity/detail?activityId=${
    $.activityId
  }&userOpenId=oPcgJ4_X7uCMeTgGmar-rmiWst1Y&timestap=${Date.now()}&userSource=mp&jdChannelId=&appId=wxccb5c536b0ecd1bf&invokeKey=ztmFUCxcPMNyUq0P`;
  const method = `GET`;
  const headers = {
    cookie: $.cookie,
    openId: `oPcgJ4_X7uCMeTgGmar-rmiWst1Y`,
    Connection: `keep-alive`,
    'App-Id': `wxccb5c536b0ecd1bf`,
    'content-type': `application/json`,
    Host: `draw.jdfcloud.com`,
    'Accept-Encoding': `gzip,compress,br,deflate`,
    'User-Agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    'Lottery-Access-Signature': `wxccb5c536b0ecd1bf1537237540544h79HlfU`,
    Referer: `https://servicewechat.com/wxccb5c536b0ecd1bf/733/page-frame.html`,
    lkt: lkt,
    lks: lks,
  };
  const myRequest = { url: url, method: method, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        //console.log(data);
        data = JSON.parse(data);
        if (data.success) {
          $.detail = data.data;
        }
      } catch (e) {
        //console.log(data);
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: 'https://wq.jd.com/user_new/info/GetJDUserInfoUnion?sceneval=2',
      headers: {
        Host: 'wq.jd.com',
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
            if (data['retcode'] === 1001) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === 0 && data.data && data.data.hasOwnProperty('userInfo')) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            console.log('京东服务器返回空数据');
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
// md5
// prettier-ignore
!function(n){function t(n,t){var r=(65535&n)+(65535&t);return(n>>16)+(t>>16)+(r>>16)<<16|65535&r}function r(n,t){return n<<t|n>>>32-t}function e(n,e,o,u,c,f){return t(r(t(t(e,n),t(u,f)),c),o)}function o(n,t,r,o,u,c,f){return e(t&r|~t&o,n,t,u,c,f)}function u(n,t,r,o,u,c,f){return e(t&o|r&~o,n,t,u,c,f)}function c(n,t,r,o,u,c,f){return e(t^r^o,n,t,u,c,f)}function f(n,t,r,o,u,c,f){return e(r^(t|~o),n,t,u,c,f)}function i(n,r){n[r>>5]|=128<<r%32,n[14+(r+64>>>9<<4)]=r;var e,i,a,d,h,l=1732584193,g=-271733879,v=-1732584194,m=271733878;for(e=0;e<n.length;e+=16){i=l,a=g,d=v,h=m,g=f(g=f(g=f(g=f(g=c(g=c(g=c(g=c(g=u(g=u(g=u(g=u(g=o(g=o(g=o(g=o(g,v=o(v,m=o(m,l=o(l,g,v,m,n[e],7,-680876936),g,v,n[e+1],12,-389564586),l,g,n[e+2],17,606105819),m,l,n[e+3],22,-1044525330),v=o(v,m=o(m,l=o(l,g,v,m,n[e+4],7,-176418897),g,v,n[e+5],12,1200080426),l,g,n[e+6],17,-1473231341),m,l,n[e+7],22,-45705983),v=o(v,m=o(m,l=o(l,g,v,m,n[e+8],7,1770035416),g,v,n[e+9],12,-1958414417),l,g,n[e+10],17,-42063),m,l,n[e+11],22,-1990404162),v=o(v,m=o(m,l=o(l,g,v,m,n[e+12],7,1804603682),g,v,n[e+13],12,-40341101),l,g,n[e+14],17,-1502002290),m,l,n[e+15],22,1236535329),v=u(v,m=u(m,l=u(l,g,v,m,n[e+1],5,-165796510),g,v,n[e+6],9,-1069501632),l,g,n[e+11],14,643717713),m,l,n[e],20,-373897302),v=u(v,m=u(m,l=u(l,g,v,m,n[e+5],5,-701558691),g,v,n[e+10],9,38016083),l,g,n[e+15],14,-660478335),m,l,n[e+4],20,-405537848),v=u(v,m=u(m,l=u(l,g,v,m,n[e+9],5,568446438),g,v,n[e+14],9,-1019803690),l,g,n[e+3],14,-187363961),m,l,n[e+8],20,1163531501),v=u(v,m=u(m,l=u(l,g,v,m,n[e+13],5,-1444681467),g,v,n[e+2],9,-51403784),l,g,n[e+7],14,1735328473),m,l,n[e+12],20,-1926607734),v=c(v,m=c(m,l=c(l,g,v,m,n[e+5],4,-378558),g,v,n[e+8],11,-2022574463),l,g,n[e+11],16,1839030562),m,l,n[e+14],23,-35309556),v=c(v,m=c(m,l=c(l,g,v,m,n[e+1],4,-1530992060),g,v,n[e+4],11,1272893353),l,g,n[e+7],16,-155497632),m,l,n[e+10],23,-1094730640),v=c(v,m=c(m,l=c(l,g,v,m,n[e+13],4,681279174),g,v,n[e],11,-358537222),l,g,n[e+3],16,-722521979),m,l,n[e+6],23,76029189),v=c(v,m=c(m,l=c(l,g,v,m,n[e+9],4,-640364487),g,v,n[e+12],11,-421815835),l,g,n[e+15],16,530742520),m,l,n[e+2],23,-995338651),v=f(v,m=f(m,l=f(l,g,v,m,n[e],6,-198630844),g,v,n[e+7],10,1126891415),l,g,n[e+14],15,-1416354905),m,l,n[e+5],21,-57434055),v=f(v,m=f(m,l=f(l,g,v,m,n[e+12],6,1700485571),g,v,n[e+3],10,-1894986606),l,g,n[e+10],15,-1051523),m,l,n[e+1],21,-2054922799),v=f(v,m=f(m,l=f(l,g,v,m,n[e+8],6,1873313359),g,v,n[e+15],10,-30611744),l,g,n[e+6],15,-1560198380),m,l,n[e+13],21,1309151649),v=f(v,m=f(m,l=f(l,g,v,m,n[e+4],6,-145523070),g,v,n[e+11],10,-1120210379),l,g,n[e+2],15,718787259),m,l,n[e+9],21,-343485551),l=t(l,i),g=t(g,a),v=t(v,d),m=t(m,h)}return[l,g,v,m]}function a(n){var t,r="",e=32*n.length;for(t=0;t<e;t+=8){r+=String.fromCharCode(n[t>>5]>>>t%32&255)}return r}function d(n){var t,r=[];for(r[(n.length>>2)-1]=void 0,t=0;t<r.length;t+=1){r[t]=0}var e=8*n.length;for(t=0;t<e;t+=8){r[t>>5]|=(255&n.charCodeAt(t/8))<<t%32}return r}function h(n){return a(i(d(n),8*n.length))}function l(n,t){var r,e,o=d(n),u=[],c=[];for(u[15]=c[15]=void 0,o.length>16&&(o=i(o,8*n.length)),r=0;r<16;r+=1){u[r]=909522486^o[r],c[r]=1549556828^o[r]}return e=i(u.concat(d(t)),512+8*t.length),a(i(c.concat(e),640))}function g(n){var t,r,e="";for(r=0;r<n.length;r+=1){t=n.charCodeAt(r),e+="0123456789abcdef".charAt(t>>>4&15)+"0123456789abcdef".charAt(15&t)}return e}function v(n){return unescape(encodeURIComponent(n))}function m(n){return h(v(n))}function p(n){return g(m(n))}function s(n,t){return l(v(n),v(t))}function C(n,t){return g(s(n,t))}function A(n,t,r){return t?r?s(t,n):C(t,n):r?m(n):p(n)}$.md5=A}(this);

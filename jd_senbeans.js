/*
* 来客有礼小程序
搬运不知名大佬的脚本
* cron 45 4 * * *
* */
const $ = new Env("送豆得豆");
const notify = $.isNode() ? require("./sendNotify") : "";
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  $.isLoginInfo = {};
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  $.activityId = "";
  $.completeNumbers = "";
  console.log(`开始获取活动信息`);
  for (let i = 0; i < cookiesArr.length && $.activityId === "" && i < 3; i++) {
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1]);
    $.isLogin = true;
    $.nickName = $.UserName;
    await TotalBean();
    $.isLoginInfo[$.UserName] = $.isLogin;
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        "open-url": "https://bean.m.jd.com/bean/signIndex.action",
      });
      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue;
    }
    await getActivityInfo();
  }
  if ($.activityId === "") {
    console.log(`获取活动ID失败`);
    return;
  }
  let openCount = Math.floor((Number(cookiesArr.length) - 1) / Number($.completeNumbers));
  console.log(`\n共有${cookiesArr.length}个账号，前${openCount}个账号可以开团\n`);
  $.openTuanList = [];
  console.log(`前${openCount}个账号开始开团\n`);
  for (let i = 0; i < cookiesArr.length && i < openCount; i++) {
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1]);
    $.index = i + 1;
    $.isLogin = true;
    $.nickName = $.UserName;
    if (!$.isLoginInfo[$.UserName]) {
      await TotalBean();
      console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
      $.isLoginInfo[$.UserName] = $.isLogin;
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action",
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
  console.log("\n开团信息\n" + JSON.stringify($.openTuanList));
  console.log(`\n开始互助\n`);
  let ckList = getRandomArrayElements(cookiesArr, cookiesArr.length);
  for (let i = 0; i < ckList.length && $.openTuanList.length > 0; i++) {
    $.cookie = ckList[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1]);
    $.index = i + 1;
    $.isLogin = true;
    if (!$.isLoginInfo[$.UserName]) {
      await TotalBean();
      $.isLoginInfo[$.UserName] = $.isLogin;
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action",
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
  for (let i = 0; i < cookiesArr.length && i < openCount && $.openTuanList.length > 0; i++) {
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1]);
    $.index = i + 1;
    $.isLogin = true;
    if (!$.isLoginInfo[$.UserName]) {
      await TotalBean();
      $.isLoginInfo[$.UserName] = $.isLogin;
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action",
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
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
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
    if ($.activityList[i].status !== "NOT_BEGIN") {
      $.activityId = $.activityList[i].activeId;
      break;
    }
  }
  await $.wait(3000);
  $.detail = {};
  await getActivityDetail();
  if (JSON.stringify($.detail) === "{}") {
    console.log(`获取活动详情失败`);
    return;
  } else {
    console.log(`获取活动详情成功`);
  }
  $.completeNumbers = $.detail.activityInfo.completeNumbers;
  console.log(`获取到的活动ID：${$.activityId},需要邀请${$.completeNumbers}人瓜分`);
}

async function getActivityList() {
  return new Promise((resolve) => {
    let options = {
      url: `https://sendbeans.jd.com/common/api/bean/activity/get/entry/list/by/channel?channelId=14&channelType=H5&sendType=0&singleActivity=false&invokeKey=NRp8OPxZMFXmGkaE`,
      headers: {
        Host: "sendbeans.jd.com",
        Origin: "https://sendbeans.jd.com",
        Cookie: $.cookie,
        Connection: "keep-alive",
        Accept: "application/json, text/plain, */*",
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Accept-Language": "zh-cn",
        Referer: "https://sendbeans.jd.com/dist/index.html?lng=120.273690&lat=31.525514&sid=c212f63c30c4bc6abfcc7889495d2acw&un_area=12_984_3382_0",
        "Accept-Encoding": "gzip, deflate, br",
        openId: "",
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
  $.rewardRecordId = "";
  await getActivityDetail();
  if (JSON.stringify($.detail) === "{}") {
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
    if ($.UserName === $.oneTuanInfo["user"]) {
      continue;
    }
    if ($.oneTuanInfo["completed"]) {
      continue;
    }
    console.log(`${$.UserName}去助力${$.oneTuanInfo["user"]}`);
    $.detail = {};
    $.rewardRecordId = "";
    await getActivityDetail();
    if (JSON.stringify($.detail) === "{}") {
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
  $.rewardRecordId = "";
  await getActivityDetail();
  if (JSON.stringify($.detail) === "{}") {
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
    let options = {
      url: `https://draw.jdfcloud.com/common/api/bean/activity/sendBean?rewardRecordId=${$.rewardRecordId}&jdChannelId=&userSource=mp&appId=wxccb5c536b0ecd1bf&invokeKey=NRp8OPxZMFXmGkaE`,
      headers: {
        "content-type": `application/json`,
        Connection: `keep-alive`,
        "Accept-Encoding": `gzip,compress,br,deflate`,
        "App-Id": `wxccb5c536b0ecd1bf`,
        "Lottery-Access-Signature": `wxccb5c536b0ecd1bf1537237540544h79HlfU`,
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        openId: `oPcgJ4_X7uCMeTgGmar-rmiWst1Y`,
        Host: `draw.jdfcloud.com`,
        Referer: `https://servicewechat.com/wxccb5c536b0ecd1bf/733/page-frame.html`,
        cookie: $.cookie,
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
    let options = {
      url: `https://draw.jdfcloud.com/common/api/bean/activity/participate?activityId=${$.activityId}&inviteUserPin=${encodeURIComponent(
        $.oneTuanInfo["user"]
      )}&invokeKey=NRp8OPxZMFXmGkaE&timestap=${Date.now()}`,
      headers: {
        "content-type": `application/json`,
        Connection: `keep-alive`,
        "Accept-Encoding": `gzip,compress,br,deflate`,
        "App-Id": `wxccb5c536b0ecd1bf`,
        "Lottery-Access-Signature": `wxccb5c536b0ecd1bf1537237540544h79HlfU`,
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        openId: `oPcgJ4_X7uCMeTgGmar-rmiWst1Y`,
        Host: `draw.jdfcloud.com`,
        Referer: `https://servicewechat.com/wxccb5c536b0ecd1bf/733/page-frame.html`,
        cookie: $.cookie,
      },
    };
    $.post(options, (err, resp, res) => {
      try {
        if (res) {
          res = JSON.parse(res);
          if (res.data.result === 5) {
            $.oneTuanInfo["completed"] = true;
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
  const url = `https://draw.jdfcloud.com/common/api/bean/activity/invite?openId=oPcgJ4_X7uCMeTgGmar-rmiWst1Y&activityId=${$.activityId}&userSource=mp&formId=123&jdChannelId=&fp=&appId=wxccb5c536b0ecd1bf&invokeKey=NRp8OPxZMFXmGkaE`;
  const method = `POST`;
  const headers = {
    "content-type": `application/json`,
    Connection: `keep-alive`,
    "Accept-Encoding": `gzip,compress,br,deflate`,
    "App-Id": `wxccb5c536b0ecd1bf`,
    "Lottery-Access-Signature": `wxccb5c536b0ecd1bf1537237540544h79HlfU`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    openId: `oPcgJ4_X7uCMeTgGmar-rmiWst1Y`,
    Host: `draw.jdfcloud.com`,
    Referer: `https://servicewechat.com/wxccb5c536b0ecd1bf/733/page-frame.html`,
    cookie: $.cookie,
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
  const url = `https://draw.jdfcloud.com/common/api/bean/activity/detail?activityId=${
    $.activityId
  }&userOpenId=oPcgJ4_X7uCMeTgGmar-rmiWst1Y&timestap=${Date.now()}&userSource=mp&jdChannelId=&appId=wxccb5c536b0ecd1bf&invokeKey=NRp8OPxZMFXmGkaE`;
  const method = `GET`;
  const headers = {
    cookie: $.cookie,
    openId: `oPcgJ4_X7uCMeTgGmar-rmiWst1Y`,
    Connection: `keep-alive`,
    "App-Id": `wxccb5c536b0ecd1bf`,
    "content-type": `application/json`,
    Host: `draw.jdfcloud.com`,
    "Accept-Encoding": `gzip,compress,br,deflate`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    "Lottery-Access-Signature": `wxccb5c536b0ecd1bf1537237540544h79HlfU`,
    Referer: `https://servicewechat.com/wxccb5c536b0ecd1bf/733/page-frame.html`,
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
      url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
      headers: {
        Host: "me-api.jd.com",
        Accept: "*/*",
        Connection: "keep-alive",
        Cookie: $.cookie,
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Accept-Language": "zh-cn",
        Referer: "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
        "Accept-Encoding": "gzip, deflate, br",
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data["retcode"] === "1001") {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data["retcode"] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            $.log("京东服务器返回空数据");
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



/**
 *   执行一次就可以了，最多10个豆子
 *   cron   54 5 9-15 8 *
 *   不要问我是哪个活动，问了我也不告诉你,我也找不到入口了
 */
const jd_heplers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("家电815周年庆礼包");
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
const notify = $.isNode() ? require("./sendNotify") : "";
let cookiesArr = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_heplers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    await getUA();
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = "";
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    await TotalBean();
    console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        "open-url": "https://bean.m.jd.com/bean/signIndex.action",
      });
      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue;
    }
    await main();
    await $.wait(1000);
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

async function main() {
  $.activityInfo = {};
  await takePostRequest("index");
  if (JSON.stringify($.activityInfo) === "{}") {
    console.log(`获取活动详情失败`);
    return;
  }
  await $.wait(500);
  await doTask();
}

async function doTask() {
  if ($.activityInfo.tasksList && $.activityInfo.tasksList.length > 0) {
    $.tasksList = $.activityInfo.tasksList;
    for (let i = 0; i < $.tasksList.length; i++) {
      $.oneTask = $.tasksList[i];
      if ($.oneTask.finishNum === 1) {
        console.log(`任务：${$.oneTask.taskName},已完成`);
        continue;
      }
      console.log(`任务：${$.oneTask.taskName},去执行`);
      await takePostRequest("doTask");
      if ($.hotFlag) {
        break;
      }
      await $.wait(5000);
      await takePostRequest("getReward");
      await $.wait(500);
    }
  }
}

async function takePostRequest(type) {
  let body = "";
  switch (type) {
    case "index":
      body = `appid=anniversary-celebra&functionId=jd_interaction_prod&body={"apiMapping":"/api/index/index"}&t=${Date.now()}&loginType=2`;
      break;
    case "doTask":
      body = `appid=anniversary-celebra&functionId=jd_interaction_prod&body={"parentId":"${$.oneTask.parentId}","taskId":"${
        $.oneTask.taskId
      }","apiMapping":"/api/task/doTask"}&t=${Date.now()}&loginType=2`;
      break;
    case "getReward":
      body = `appid=anniversary-celebra&functionId=jd_interaction_prod&body={"parentId":"${$.oneTask.parentId}","taskId":"${$.oneTask.taskId}","timeStamp":${
        $.timeStamp
      },"apiMapping":"/api/task/getReward"}&t=${Date.now()}&loginType=2`;
      break;
    default:
      console.log(`错误${type}`);
  }
  let myRequest = getPostRequest(body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (data) {
          dealReturn(type, data);
        } else {
          console.log(`返回空`);
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
function dealReturn(type, data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log(`执行任务异常`);
    console.log(data);
    $.runFalag = false;
  }
  switch (type) {
    case "index":
      if (data && data.code === 200) {
        $.activityInfo = data.data;
      }
      break;
    case "doTask":
      if (data && data.code === 200) {
        $.timeStamp = data.data.timeStamp;
      } else {
        $.hotFlag = true;
        console.log(JSON.stringify(data));
      }
      break;
    case "getReward":
      if (data && data.code === 200) {
        console.log(`执行成功，获得京豆:${data.data.jbean || 0}`);
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    default:
      console.log(JSON.stringify(data));
  }
}
function getPostRequest(body) {
  let url = `https://api.m.jd.com/api`;
  const headers = {
    Accept: `application/json, text/plain, */*`,
    Origin: `https://welfare.m.jd.com`,
    "Accept-Encoding": `gzip, deflate, br`,
    Cookie: $.cookie,
    "Content-Type": `application/x-www-form-urlencoded`,
    Host: `api.m.jd.com`,
    Connection: `keep-alive`,
    "User-Agent": $.UA,
    Referer: `https://welfare.m.jd.com/`,
    "Accept-Language": `zh-cn`,
  };
  return { url: url, headers: headers, body: body };
}
async function getUA() {
  $.UA = `jdapp;iPhone;10.0.10;14.3;${randomString(
    40
  )};network/wifi;model/iPhone12,1;addressid/3364463029;appBuild/167764;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;
}
function randomString(e) {
  e = e || 32;
  let t = "abcdef0123456789",
    a = t.length,
    n = "";
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}
function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      headers: {
        Accept: "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        Connection: "keep-alive",
        Cookie: $.cookie,
        Referer: "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      },
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data["retcode"] === 13) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data["retcode"] === 0) {
              $.nickName = (data["base"] && data["base"].nickname) || $.UserName;
            } else {
              $.nickName = $.UserName;
            }
          } else {
            console.log(`京东服务器返回空数据`);
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

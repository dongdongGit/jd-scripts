/*
10豆 
入口：排行榜-宝藏榜
10 10 * * * jd_TreasureRank.js
updatetime: 2022/9/29
author: https://github.com/6dylan6/jdpro
 */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东宝藏榜');
const notify = $.isNode() ? require("./sendNotify") : "";
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let jdNotify = true;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  message = "";
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false")
    console.log = () => {};
} else {
  cookiesArr = [
    $.getdata("CookieJD"),
    $.getdata("CookieJD2"),
    ...jd_helpers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie),
  ].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg(
      $.name,
      "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取",
      "https://bean.m.jd.com/bean/signIndex.action",
      { "open-url": "https://bean.m.jd.com/bean/signIndex.action" }
    );
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(
        cookie.match(/pt_pin=([^; ]+)(?=;?)/) &&
          cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
      );
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      await $.totalBean();
      console.log(
        `\n******开始【京东账号${$.index}】${
          $.nickName || $.UserName
        }*********\n`
      );
      if (!$.isLogin) {
        $.msg(
          $.name,
          `【提示】cookie已失效`,
          `京东账号${$.index} ${
            $.nickName || $.UserName
          }\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`,
          { "open-url": "https://bean.m.jd.com/bean/signIndex.action" }
        );
        if ($.isNode()) {
          await notify.sendNotify(
            `${$.name}cookie已失效 - ${$.UserName}`,
            `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`
          );
        }
        continue;
      }
      await doTreasureInteractive({ type: "3", itemId: "" }, 3);
      await $.wait(2000);
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

function getTreasureRanks() {
  body =
    'functionId=getTreasureRanks&body={"queryType":"1","rankType":18,"ids":["1"]}&appid=newrank_action&clientVersion=11.2.2&client=wh5&ext={"prstate":"0"}';
  return new Promise(async (resolve) => {
    $.post(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(` API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.isSuccess) {
            $.storeIdlist = data.result.data.map((valu, index, arr) => {
              return valu.storeId;
            });
          } else {
            console.log(data);
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

function doTreasureInteractive(body, type) {
  body = `functionId=doTreasureInteractive&body=${encodeURIComponent(
    JSON.stringify(body)
  )}&appid=newrank_action&clientVersion=11.2.2&client=wh5&ext={"prstate":"0"}`;
  return new Promise(async (resolve) => {
    $.post(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(` API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          //console.log(data);
          if (data.isSuccess) {
            switch (type) {
              case 1:
                $.browseTaskCompletionCnt = data.result.browseTaskCompletionCnt;
                break;
              case 2:
                $.taskParam = data.result.taskParam;
                break;
              case 3:
                if (data.result.rewardType === 20001) {
                  console.log(data.result.rewardTitle, data.result.discount);
                } else {
                  console.log(data);
                }
                break;
            }
          } else {
            console.log(data);
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

function taskUrl(body) {
  return {
    url: `https://api.m.jd.com/client.action`,
    body,
    headers: {
      Host: "api.m.jd.com",
      origin: "https://h5.m.jd.com",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require("./USER_AGENTS").USER_AGENT
        : $.getdata("JDUA")
        ? $.getdata("JDUA")
        : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      Cookie: cookie,
    },
  };
}

function getExtract(array) {
  const random = (min, max) => Math.floor(Math.random() * (max - min) + min);
  let index = random(0, array.length);
  return array.splice(index, 1);
}
function showMsg() {
  return new Promise((resolve) => {
    if (!jdNotify) {
      $.msg($.name, "", `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve();
  });
}
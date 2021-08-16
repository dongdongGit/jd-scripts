// author: 疯疯
/*
东东健康社区收集能量收集能量(不做任务，任务脚本请使用jd_health.js)
更新时间：2021-4-23
活动入口：京东APP首页搜索 "玩一玩"即可

已支持IOS多京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
===================quantumultx================
[task_local]
#东东健康社区收集能量
5-45/20 * * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_health_collect.js, tag=东东健康社区收集能量, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

=====================Loon================
[Script]
cron "5-45/20 * * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_health_collect.js, tag=东东健康社区收集能量

====================Surge================
东东健康社区收集能量 = type=cron,cronexp=5-45/20 * * * *,wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_health_collect.js

============小火箭=========
东东健康社区收集能量 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_health_collect.js, cronexpr="5-45/20 * * * *", timeout=3600, enable=true
 */
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("东东健康社区收集能量收集");
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let cookiesArr = [],
  cookie = "",
  message;

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = "https://api.m.jd.com/client.action";
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/", { "open-url": "https://bean.m.jd.com/" });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      message = "";
      console.log(`\n******开始【京东账号${$.index}】${$.UserName}*********\n`);
      await collectScore();
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

function collectScore() {
  return new Promise((resolve) => {
    $.get(taskUrl("jdhealth_collectProduceScore", {}), (err, resp, data) => {
      try {
        if (jd_helpers.safeGet(data)) {
          data = $.toObj(data);
          if (data?.data?.bizCode === 0) {
            if (data?.data?.result?.produceScore) console.log(`任务完成成功，获得：${data?.data?.result?.produceScore ?? "未知"}能量`);
            else console.log(`任务领取结果：${data?.data?.bizMsg ?? JSON.stringify(data)}`);
          } else {
            console.log(`任务完成失败：${data?.data?.bizMsg ?? JSON.stringify(data)}`);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve();
      }
    });
  });
}

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}/client.action?functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0`,
    headers: {
      Cookie: cookie,
      origin: "https://h5.m.jd.com",
      referer: "https://h5.m.jd.com/",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require("./USER_AGENTS").USER_AGENT
        : $.getdata("JDUA")
        ? $.getdata("JDUA")
        : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    },
  };
}

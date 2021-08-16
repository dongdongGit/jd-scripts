/*
act time 7.16----
[task_local]
20 0 * * * 
*/
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("柠檬特务Z行动-星小店");
const notify = $.isNode() ? require("./sendNotify") : "";
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let useInfo = {};

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  message;
let newShareCodes = [];
let lsjdh = "";
let a1 = "BLUZG8";
let a2 = "5JFCD6";
let a3 = "CR522U";
if (process.env.lsjdh) {
  lsjdh = process.env.lsjdh;
}
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_helpers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      message = "";
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action",
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await info(a1);
      await info(a2);
      await info(a3);
    }
  }
  console.log(`\n开始账号内互助\n`);
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    if (!useInfo[$.UserName]) continue;
    $.canHelp = true;
    for (let j = 0; j < newShareCodes.length && $.canHelp; j++) {
      $.oneCodeInfo = newShareCodes[j];
      if ($.UserName === newShareCodes[j].usr || $.oneCodeInfo.max) {
        continue;
      }
      console.log(`${$.UserName}去助力${newShareCodes[j].usr}`);
      nick = useInfo[$.UserName];
      await dohelp(newShareCodes[j].code, a1);
      await dohelp(newShareCodes[j].code, a2);
      await dohelp(newShareCodes[j].code, a3);
    }
    await cj(a1, 452, 1);
    await cj(a1, 453, 2);
    await cj(a1, 454, 3);
    await cj(a1, 455, 4);

    await cj(a2, 456, 1);
    await cj(a2, 457, 2);
    await cj(a2, 458, 3);
    await cj(a2, 459, 4);

    await cj(a3, 456, 1);
    await cj(a3, 457, 2);
    await cj(a3, 458, 3);
    await cj(a3, 459, 4);
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

function info(starId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,
      body: `functionId=activityStarBackGetProgressBarInfo&body={"starId":"${starId}","linkId":"Z3R-aayeVbewLRdgKI1_Jg"}&_t=1626316025621&appid=activities_platform`,
      headers: {
        Origin: "https://prodev.m.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "okhttp/3.12.1;jdmall;android;version/10.0.4;build/88641;screen/1080x2208;os/10;network/4g;",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        const reust = JSON.parse(data);
        if (reust.errMsg == "success") {
          jf = reust.data.backValue;
          pin = reust.data.encryptPin;

          $.log("积分：" + jf);
          $.log("邀请码: " + pin);
          useInfo[$.UserName] = pin;
          newShareCodes.push({ usr: $.UserName, code: pin, max: false });
          await dotask("SIGN", 185, "", a1);
          await tasklist(a1);
          await dotask("SIGN", 185, "", a2);
          await tasklist(a2);
          await dotask("SIGN", 185, "", a3);
          await tasklist(a3);
        } else if (reust.errMsg !== "success") {
          $.log(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function tasklist(uniqueId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,
      //functionId=apTaskDetail&body={"taskType":"BROWSE_CHANNEL","taskId":191,"uniqueId":"BLUZG8","channel":4,"linkId":"Z3R-aayeVbewLRdgKI1_Jg"}&_t=1626317904063&appid=activities_platform
      body: `functionId=apTaskDetail&body={"taskType":"BROWSE_CHANNEL","taskId":191,"uniqueId":"${uniqueId}","channel":4,"linkId":"Z3R-aayeVbewLRdgKI1_Jg"}&_t=1626317904063&appid=activities_platform`,
      headers: {
        Origin: "https://prodev.m.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "okhttp/3.12.1;jdmall;android;version/10.0.4;build/88641;screen/1080x2208;os/10;network/4g;",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        const reust = JSON.parse(data);
        if (reust.success == true) {
          list = reust.data.taskItemList;
          for (let i = 0; i < list.length; i++) {
            itemId = list[i].itemId;
            await dotask("BROWSE_CHANNEL", 191, itemId, a1);
            await dotask("BROWSE_CHANNEL", 191, itemId, a2);
            await dotask("BROWSE_CHANNEL", 191, itemId, a3);
          }
        } else if (reust.success == false) {
          $.log(reust.errMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function dotask(taskType, taskId, itemId, uniqueId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=apDoTask&body={"taskType":"${taskType}","taskId":${taskId},"uniqueId":"${uniqueId}","channel":4,"linkId":"Z3R-aayeVbewLRdgKI1_Jg","itemId":"${itemId}"}&_t=1626316024481&appid=activities_platform`,
      headers: {
        Origin: "https://prodev.m.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "okhttp/3.12.1;jdmall;android;version/10.0.4;build/88641;screen/1080x2208;os/10;network/4g;",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        const reust = JSON.parse(data);
        if (reust.success == true) {
          $.log(reust.errMsg);
        } else if (reust.success == false) {
          $.log(reust.errMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function dohelp(sharePin, starId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,
      //functionId=activityStarBackGetProgressBarInfo&body={"starId":"BLUZG8","sharePin":"vH5Yx30SvoLMGnX5akG5pQ","taskId":"186","linkId":"Z3R-aayeVbewLRdgKI1_Jg"}&_t=1626317592646&appid=activities_platform
      body: `functionId=activityStarBackGetProgressBarInfo&body={"starId":"${starId}","sharePin":"${sharePin}","taskId":"186","linkId":"Z3R-aayeVbewLRdgKI1_Jg"}&_t=1626317592646&appid=activities_platform`,
      headers: {
        Origin: "https://prodev.m.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "okhttp/3.12.1;jdmall;android;version/10.0.4;build/88641;screen/1080x2208;os/10;network/4g;",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        const reust = JSON.parse(data);
        if (reust.success == true) {
          $.log(reust.errMsg);
        } else if (reust.success == false) {
          $.log(reust.errMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function cj(starId, poolId, pos) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=activityStarBackDrawPrize&body={"starId":"${starId}","poolId":${poolId},"pos":${pos},"linkId":"Z3R-aayeVbewLRdgKI1_Jg"}&_t=1626319813484&appid=activities_platform`,
      headers: {
        Origin: "https://prodev.m.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "okhttp/3.12.1;jdmall;android;version/10.0.4;build/88641;screen/1080x2208;os/10;network/4g;",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        const reust = JSON.parse(data);
        if (reust.success == true) {
          $.log(reust.data.resMsg);
        } else if (reust.success == false) {
          $.log("积分不足 " + reust.errMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      headers: {
        Accept: "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        Connection: "keep-alive",
        Cookie: cookie,
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

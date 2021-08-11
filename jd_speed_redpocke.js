/*
京东极速版红包
自动提现微信现金
更新时间：2021-8-2
活动时间：2021-4-6至2021-5-30
活动地址：https://prodev.m.jd.com/jdlite/active/31U4T6S4PbcK83HyLPioeCWrD63j/index.html
活动入口：京东极速版-领红包
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东极速版红包
20 0,22 * * * jd_speed_redpocke.js, tag=京东极速版红包, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon==============
[Script]
cron "20 0,22 * * *" script-path=jd_speed_redpocke.js,tag=京东极速版红包
===============Surge=================
京东极速版红包 = type=cron,cronexp="20 0,22 * * *",wake-system=1,timeout=3600,script-path=jd_speed_redpocke.js
============小火箭=========
京东极速版红包 = type=cron,script-path=jd_speed_redpocke.js, cronexpr="20 0,22 * * *", timeout=3600, enable=true
*/
const jd_heplers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("京东极速版红包");

const notify = $.isNode() ? require("./sendNotify") : "";
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let cookiesArr = [],
  cookie = "",
  message;
const linkId = "9wdf1YTT2L59Vr-meKskLA";
const signLinkId = "9WA12jYGulArzWS7vcrwhw";
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
  if (JSON.stringify(process.env).indexOf("GITHUB") > -1) process.exit(0);
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_heplers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      console.log(`\n如提示活动火爆,可再执行一次尝试\n`);
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
      await jsRedPacket();
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

async function jsRedPacket() {
  try {
    await invite();
    await sign(); //极速版签到提现
    await reward_query();
    for (let i = 0; i < 3; ++i) {
      await redPacket(); //开红包
      await $.wait(2000);
    }
    await getPacketList(); //领红包提现
    await signPrizeDetailList();
    await showMsg();
  } catch (e) {
    $.logErr(e);
  }
}

function showMsg() {
  return new Promise((resolve) => {
    if (message) $.msg($.name, "", `京东账号${$.index}${$.nickName}\n${message}`);
    resolve();
  });
}
async function sign() {
  return new Promise((resolve) => {
    const body = { linkId: signLinkId, serviceName: "dayDaySignGetRedEnvelopeSignService", business: 1 };
    const options = {
      url: `https://api.m.jd.com`,
      body: `functionId=apSignIn_day&body=${escape(JSON.stringify(body))}&_t=${+new Date()}&appid=activities_platform`,
      headers: {
        Cookie: cookie,
        Host: "api.m.jd.com",
        Origin: "https://daily-redpacket.jd.com",
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "*/*",
        Connection: "keep-alive",
        "User-Agent":
          "jdltapp;iPhone;3.3.2;14.5.1network/wifi;hasUPPay/0;pushNoticeIsOpen/1;lang/zh_CN;model/iPhone13,2;addressid/137923973;hasOCPay/0;appBuild/1047;supportBestPay/0;pv/467.11;apprpd/MyJD_Main;",
        "Accept-Language": "zh-Hans-CN;q=1, en-CN;q=0.9, zh-Hant-CN;q=0.8",
        Referer: "https://daily-redpacket.jd.com/?activityId=9WA12jYGulArzWS7vcrwhw",
        "Accept-Encoding": "gzip, deflate, br",
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = $.toObj(data);
            if (data.code === 0) {
              if (data.data.retCode === 0) {
                message += `极速版签到提现：签到成功\n`;
                console.log(`极速版签到提现：签到成功\n`);
              } else {
                console.log(`极速版签到提现：签到失败:${data.data.retMessage}\n`);
              }
            } else {
              console.log(`极速版签到提现：签到异常:${JSON.stringify(data)}\n`);
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function reward_query() {
  return new Promise((resolve) => {
    $.get(
      taskGetUrl("spring_reward_query", {
        inviter: [""][Math.floor(Math.random() * 1)],
        linkId,
      }),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} API请求失败，请检查网路重试`);
          } else {
            if (jd_heplers.safeGet(data)) {
              data = JSON.parse(data);
              if (data.code === 0) {
              } else {
                console.log(data.errMsg);
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      }
    );
  });
}
async function redPacket() {
  return new Promise((resolve) => {
    $.get(taskGetUrl("spring_reward_receive", { inviter: [""][Math.floor(Math.random() * 1)], linkId }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data.received.prizeType !== 1) {
                message += `获得${data.data.received.prizeDesc}\n`;
                console.log(`获得${data.data.received.prizeDesc}`);
              } else {
                console.log("获得优惠券");
              }
            } else {
              console.log(data.errMsg);
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function getPacketList() {
  return new Promise((resolve) => {
    $.get(taskGetUrl("spring_reward_list", { pageNum: 1, pageSize: 100, linkId, inviter: "" }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              for (let item of data.data.items.filter((vo) => vo.prizeType === 4)) {
                if (item.state === 0) {
                  console.log(`去提现${item.amount}微信现金`);
                  message += `提现${item.amount}微信现金，`;
                  await cashOut(item.id, item.poolBaseId, item.prizeGroupId, item.prizeBaseId);
                }
              }
            } else {
              console.log(data.errMsg);
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function signPrizeDetailList() {
  return new Promise((resolve) => {
    const body = { linkId: signLinkId, serviceName: "dayDaySignGetRedEnvelopeSignService", business: 1, pageSize: 20, page: 1 };
    const options = {
      url: `https://api.m.jd.com`,
      body: `functionId=signPrizeDetailList&body=${escape(JSON.stringify(body))}&_t=${+new Date()}&appid=activities_platform`,
      headers: {
        Cookie: cookie,
        Host: "api.m.jd.com",
        Origin: "https://daily-redpacket.jd.com",
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "*/*",
        Connection: "keep-alive",
        "User-Agent":
          "jdltapp;iPhone;3.3.2;14.5.1network/wifi;hasUPPay/0;pushNoticeIsOpen/1;lang/zh_CN;model/iPhone13,2;addressid/137923973;hasOCPay/0;appBuild/1047;supportBestPay/0;pv/467.11;apprpd/MyJD_Main;",
        "Accept-Language": "zh-Hans-CN;q=1, en-CN;q=0.9, zh-Hant-CN;q=0.8",
        Referer: "https://daily-redpacket.jd.com/?activityId=9WA12jYGulArzWS7vcrwhw",
        "Accept-Encoding": "gzip, deflate, br",
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = $.toObj(data);
            if (data.code === 0) {
              if (data.data.code === 0) {
                const list = (data.data.prizeDrawBaseVoPageBean.items || []).filter((vo) => vo["prizeType"] === 4 && vo["prizeStatus"] === 0);
                for (let code of list) {
                  console.log(`极速版签到提现，去提现${code["prizeValue"]}现金\n`);
                  message += `极速版签到提现，去提现${code["prizeValue"]}微信现金，`;
                  await apCashWithDraw(code["id"], code["poolBaseId"], code["prizeGroupId"], code["prizeBaseId"]);
                }
              } else {
                console.log(`极速版签到查询奖品：失败:${JSON.stringify(data)}\n`);
              }
            } else {
              console.log(`极速版签到查询奖品：异常:${JSON.stringify(data)}\n`);
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function apCashWithDraw(id, poolBaseId, prizeGroupId, prizeBaseId) {
  return new Promise((resolve) => {
    const body = {
      linkId: signLinkId,
      businessSource: "DAY_DAY_RED_PACKET_SIGN",
      base: {
        prizeType: 4,
        business: "dayDayRedPacket",
        id: id,
        poolBaseId: poolBaseId,
        prizeGroupId: prizeGroupId,
        prizeBaseId: prizeBaseId,
      },
    };
    const options = {
      url: `https://api.m.jd.com`,
      body: `functionId=apCashWithDraw&body=${escape(JSON.stringify(body))}&_t=${+new Date()}&appid=activities_platform`,
      headers: {
        Cookie: cookie,
        Host: "api.m.jd.com",
        Origin: "https://daily-redpacket.jd.com",
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "*/*",
        Connection: "keep-alive",
        "User-Agent":
          "jdltapp;iPhone;3.3.2;14.5.1network/wifi;hasUPPay/0;pushNoticeIsOpen/1;lang/zh_CN;model/iPhone13,2;addressid/137923973;hasOCPay/0;appBuild/1047;supportBestPay/0;pv/467.11;apprpd/MyJD_Main;",
        "Accept-Language": "zh-Hans-CN;q=1, en-CN;q=0.9, zh-Hant-CN;q=0.8",
        Referer: "https://daily-redpacket.jd.com/?activityId=9WA12jYGulArzWS7vcrwhw",
        "Accept-Encoding": "gzip, deflate, br",
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = $.toObj(data);
            if (data.code === 0) {
              if (data.data.status === "310") {
                console.log(`极速版签到提现现金成功！`);
                message += `极速版签到提现现金成功！`;
              } else {
                console.log(`极速版签到提现现金：失败:${JSON.stringify(data)}\n`);
              }
            } else {
              console.log(`极速版签到提现现金：异常:${JSON.stringify(data)}\n`);
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function cashOut(id, poolBaseId, prizeGroupId, prizeBaseId) {
  let body = {
    businessSource: "SPRING_FESTIVAL_RED_ENVELOPE",
    base: {
      id: id,
      business: null,
      poolBaseId: poolBaseId,
      prizeGroupId: prizeGroupId,
      prizeBaseId: prizeBaseId,
      prizeType: 4,
    },
    linkId,
    inviter: "",
  };
  return new Promise((resolve) => {
    $.post(taskPostUrl("apCashWithDraw", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            console.log(`提现零钱结果：${data}`);
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data["data"]["status"] === "310") {
                console.log(`提现成功！`);
                message += `提现成功！\n`;
              } else {
                console.log(`提现失败：${data["data"]["message"]}`);
                message += `提现失败：${data["data"]["message"]}`;
              }
            } else {
              console.log(`提现异常：${data["errMsg"]}`);
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function invite() {
  let t = +new Date();
  let inviterId = ["5V7vHE23qh2EkdBHXRFDuA=="][Math.floor(Math.random() * 1)];
  var headers = {
    Host: "api.m.jd.com",
    accept: "application/json, text/plain, */*",
    "content-type": "application/x-www-form-urlencoded",
    origin: "https://invite-reward.jd.com",
    "accept-language": "zh-cn",
    "user-agent": $.isNode()
      ? process.env.JS_USER_AGENT
        ? process.env.JS_USER_AGENT
        : require("./JS_USER_AGENTS").USER_AGENT
      : $.getdata("JSUA")
      ? $.getdata("JSUA")
      : "'jdltapp;iPad;3.1.0;14.4;network/wifi;Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    referer: "https://invite-reward.jd.com/",
    Cookie: cookie,
  };

  var dataString = `functionId=InviteFriendChangeAssertsService&body={"method":"attendInviteActivity","data":{"inviterPin":"${encodeURIComponent(
    inviterId
  )}","channel":1,"token":"","frontendInitStatus":""}}&referer=-1&eid=eidI9b2981202fsec83iRW1nTsOVzCocWda3YHPN471AY78%2FQBhYbXeWtdg%2F3TCtVTMrE1JjM8Sqt8f2TqF1Z5P%2FRPGlzA1dERP0Z5bLWdq5N5B2VbBO&aid=&client=ios&clientVersion=14.4.2&networkType=wifi&fp=-1&uuid=ab048084b47df24880613326feffdf7eee471488&osVersion=14.4.2&d_brand=iPhone&d_model=iPhone10,2&agent=-1&pageClickKey=-1&platform=3&lang=zh_CN&appid=market-task-h5&_t=${t}`;
  var options = {
    url: `https://api.m.jd.com/?t=${t}`,
    headers: headers,
    body: dataString,
  };
  $.post(options, (err, resp, data) => {
    // console.log(data)
  });
}

function taskPostUrl(function_id, body) {
  return {
    url: `https://api.m.jd.com/`,
    body: `appid=activities_platform&functionId=${function_id}&body=${escape(JSON.stringify(body))}&t=${+new Date()}`,
    headers: {
      Cookie: cookie,
      Host: "api.m.jd.com",
      Accept: "*/*",
      Connection: "keep-alive",
      // 'user-agent': $.isNode() ? (process.env.JS_USER_AGENT ? process.env.JS_USER_AGENT : (require('./JS_USER_AGENTS').USER_AGENT)) : ($.getdata('JSUA') ? $.getdata('JSUA') : "'jdltapp;iPad;3.1.0;14.4;network/wifi;Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
      "user-agent":
        "jdltapp;iPhone;3.3.2;14.3;b488010ad24c40885d846e66931abaf532ed26a5;network/4g;hasUPPay/0;pushNoticeIsOpen/0;lang/zh_CN;model/iPhone11,8;addressid/2005183373;hasOCPay/0;appBuild/1049;supportBestPay/0;pv/220.46;apprpd/;ref/JDLTSubMainPageViewController;psq/0;ads/;psn/b488010ad24c40885d846e66931abaf532ed26a5|520;jdv/0|iosapp|t_335139774|liteshare|CopyURL|1618673222002|1618673227;adk/;app_device/IOS;pap/JA2020_3112531|3.3.2|IOS 14.3;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1 ",
      "Accept-Language": "zh-Hans-CN;q=1,en-CN;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/x-www-form-urlencoded",
      referer: "https://an.jd.com/babelDiy/Zeus/q1eB6WUB8oC4eH1BsCLWvQakVsX/index.html",
    },
  };
}

function taskGetUrl(function_id, body) {
  return {
    url: `https://api.m.jd.com/?appid=activities_platform&functionId=${function_id}&body=${escape(JSON.stringify(body))}&t=${+new Date()}`,
    headers: {
      Cookie: cookie,
      Host: "api.m.jd.com",
      Accept: "*/*",
      Connection: "keep-alive",
      "user-agent": $.isNode()
        ? process.env.JS_USER_AGENT
          ? process.env.JS_USER_AGENT
          : require("./JS_USER_AGENTS").USER_AGENT
        : $.getdata("JSUA")
        ? $.getdata("JSUA")
        : "'jdltapp;iPad;3.1.0;14.4;network/wifi;Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      "Accept-Language": "zh-Hans-CN;q=1,en-CN;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/x-www-form-urlencoded",
      referer: "https://an.jd.com/babelDiy/Zeus/q1eB6WUB8oC4eH1BsCLWvQakVsX/index.html",
    },
  };
}

function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
      headers: {
        Host: "me-api.jd.com",
        Accept: "*/*",
        Connection: "keep-alive",
        Cookie: cookie,
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
            console.log("京东服务器返回空数据");
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
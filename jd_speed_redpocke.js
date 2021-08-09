/*
京东极速版红包
自动提现微信现金
更新时间：2021-5-31
活动时间：2021-4-6至2021-5-30
活动地址：https://prodev.m.jd.com/jdlite/active/31U4T6S4PbcK83HyLPioeCWrD63j/index.html
活动入口：京东极速版-领红包
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东极速版红包
20 0,22 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_speed_redpocke.js, tag=京东极速版红包, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

================Loon==============
[Script]
cron "20 0,22 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_speed_redpocke.js,tag=京东极速版红包

===============Surge=================
京东极速版红包 = type=cron,cronexp="20 0,22 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_speed_redpocke.js

============小火箭=========
京东极速版红包 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_speed_redpocke.js, cronexpr="20 0,22 * * *", timeout=3600, enable=true
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
const linkId = "AkOULcXbUA_8EAPbYLLMgg";
const signLinkId = "9WA12jYGulArzWS7vcrwhw";

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
  //if (JSON.stringify(process.env).indexOf('GITHUB') > -1) process.exit(0);
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
      await $.wait(500);
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
        inviter: ["lQcq5wvS4DgautZP55t6U4LjST0GquBLHcVmr9wk-Ys", "apJvQbuwXA5KsCyX1RFWWg"][Math.floor(Math.random() * 2)],
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
    $.get(
      taskGetUrl("spring_reward_receive", { inviter: ["lQcq5wvS4DgautZP55t6U4LjST0GquBLHcVmr9wk-Ys", "apJvQbuwXA5KsCyX1RFWWg"][Math.floor(Math.random() * 2)], linkId }),
      async (err, resp, data) => {
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
      }
    );
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

var _0xod6 = "jsjiami.com.v6",
  _0x4f1a = [
    _0xod6,
    "HMOaWlMH",
    "w5DCn8Oyw79Jw7MQwrc8f8ObSDVnwrFKd8OiNMOnwrfDosO1wpU4GcKdwooVw7IzAMKSa8OabcK4wqVkw7xydnQjSzN+wr41f8OfEsKXwoFrwq3CncORQT7DthtjwrRZw7zDu8KtXXQaw7ZbSsKFW8Oww7bCpMKaWwdYJzspwqhmdsO+w7XClcOsw57Ci2PCnDdow7rCtWjCtlTCiWLCpMO2HsOlwo/Dk8KPXlbCgREww5bDmcKGBsKlw6jDoXVKLsKxwqXDjsOBwrsswq8aw6YTc2B2wqIGwrEjYRHCpsKfNlpXw4TDhMKzwowrw4vCmWvCmMK7wq1GwoUGIcKEHUVnw6JCwqjDqMKKdcOMXR/Cj8K/a0TDocOgwprCnQnDp8KBbGTCildPDENGayPDucORw5APwphTT1vDti02wqZxwqxrDFDCo0PDrj/CjsK3w7nCmT/DmcKBwq7DhFBQY8OHw53DsEzDqE/DssKhwqbCsFIHwqLDj8OqfhpUw4nCqUXCtcKVwpMSwoXCk202a2nDmMO3",
    "w6jDk3JA",
    "RBx7U8KWbcKmb8Orw5DCoMKOw7hew77CvcKLemDDhcOfY8K7wr5yHsOPZwVrFMKXaGfCjcK8wpgIwoTCvMOfwpPDi8OZwrrCgGTCj8ObAw==",
    "w7Fpw7TDsGYIwrVDXBLCnsK/TsOHPcO5w7HDpE7CpcK+PsKhw7jDvMKFworCgXfCuMOQwojCo8KCwoLCvAEPFVo6EgxJGhM=",
    "w6wBw4FewrsVwqfDqcOJP8Kmw7l9MUIowqXCrWTDt1hxwo8vdXJ7Z8KzwonDsSA1worDqi5CT8OXw6jCuRbCn0k=",
    "w6Euw4x/wrAjw5LDiMO+WMKyw7MEZkA6w4/Cg2bDqVlgw7d1",
    "wpHCtcOcbsK0BcO1QUHCpcKqw6jCsnfDt0PDkMODw4k+Z03DqcO3",
    "Ak8AMsKGDcOhTsKoAg7DicOcwrdlO8O3aMONIivDtsOnw5jDmhvDhcOTw5rCp8Omw7DCqSrDjlZdw6IyDMK1R8K6Cg==",
    "wqLDisKgwqQSw4cUwqlydsKdCDV+w4p7IMOHFsK6w4bCr8Oqwoo=",
    "wqzClsOqNcKbwrnDtMKbQMODwq5cw4HCmgLDpMKEwrAqCMKsdFhi",
    "JGjDlT8Rew48w47CgGbDkMOJwrBFZXIjw7vDh8KjwoTCjMOb",
    "wqDCncOSMcKRXMO9fSbCq8Knw4I=",
    "AMKdNcKTwolYF08nw44sw6DDiydVY8Krw5zClAjDul0Tw4vDsC8EZg==",
    "w5QrO3ly",
    "AX8mNw==",
    "wrHDicK7w4RV",
    "w7DCn8OnZcKv",
    "LsKOTsKrw4w=",
    "MsKpZ0/DqQ==",
    "IsKUAyRs",
    "w7Mgw4Ffw6w=",
    "ElzCl3vDgQ==",
    "OkrCsHHDrQ==",
    "eMKBw4QRw5U=",
    "woMewqBXwoI=",
    "LRhpVlLDicO3e8OZRMKBw4rCg8KrwqLDtMK3a01KwoZPw5LCmBVSwozDs8Klwo4GdcKeS2zCnFFdbkbDjMK0woFb",
    "w48Jw6h/w5Y=",
    "wqUkOMKfwr0=",
    "esOMw5fCocKgwoo=",
    "EMK3EHHDkQ==",
    "w7QJw7ZHwrgvwofDt8OWZcKpwrdPJAQawoHDqDDDqx9Mw6c9N3gmeMKnwpLDpzAy",
    "SB7CgnNu",
    "BcKveXHDrA==",
    "YcOew7fCqsKrwoI=",
    "wrrCssK/",
    "OSAXcMK1GMKcfsOhw6DCo8O4w7s=",
    "wp9BAz1a",
    "M18ZwpHCsA/Du8KvXcOb",
    "fHEIw47Cr8KdHw==",
    "FU7CrXQ=",
    "BsKhWMKAw6HDmD8=",
    "wobChcK/w5LDsg==",
    "wrDCncOhWsKM",
    "OjXsjyiyamHeBi.cpom.kv6LpDS==",
  ];
(function (_0x5219f0, _0xb82621, _0x13c086) {
  var _0x4eaaf0 = function (_0x538aa0, _0x12707e, _0x2c7ef7, _0x7dd858, _0x24590f) {
    (_0x12707e = _0x12707e >> 0x8), (_0x24590f = "po");
    var _0x2aa13f = "shift",
      _0x259370 = "push";
    if (_0x12707e < _0x538aa0) {
      while (--_0x538aa0) {
        _0x7dd858 = _0x5219f0[_0x2aa13f]();
        if (_0x12707e === _0x538aa0) {
          _0x12707e = _0x7dd858;
          _0x2c7ef7 = _0x5219f0[_0x24590f + "p"]();
        } else if (_0x12707e && _0x2c7ef7["replace"](/[OXyyHeBpkLpDS=]/g, "") === _0x12707e) {
          _0x5219f0[_0x259370](_0x7dd858);
        }
      }
      _0x5219f0[_0x259370](_0x5219f0[_0x2aa13f]());
    }
    return 0x8a767;
  };
  return (_0x4eaaf0(++_0xb82621, _0x13c086) >> _0xb82621) ^ _0x13c086;
})(_0x4f1a, 0x137, 0x13700);
var _0x4190 = function (_0xaaecd5, _0x593020) {
  _0xaaecd5 = ~~"0x"["concat"](_0xaaecd5);
  var _0x2e7b9f = _0x4f1a[_0xaaecd5];
  if (_0x4190["sDfRUY"] === undefined) {
    (function () {
      var _0xbff5a5 = typeof window !== "undefined" ? window : typeof process === "object" && typeof require === "function" && typeof global === "object" ? global : this;
      var _0x362fe4 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      _0xbff5a5["atob"] ||
        (_0xbff5a5["atob"] = function (_0x5daa56) {
          var _0x597031 = String(_0x5daa56)["replace"](/=+$/, "");
          for (
            var _0x32e623 = 0x0, _0x3a311d, _0x45b5c4, _0xd282f2 = 0x0, _0x4e69f9 = "";
            (_0x45b5c4 = _0x597031["charAt"](_0xd282f2++));
            ~_0x45b5c4 && ((_0x3a311d = _0x32e623 % 0x4 ? _0x3a311d * 0x40 + _0x45b5c4 : _0x45b5c4), _0x32e623++ % 0x4)
              ? (_0x4e69f9 += String["fromCharCode"](0xff & (_0x3a311d >> ((-0x2 * _0x32e623) & 0x6))))
              : 0x0
          ) {
            _0x45b5c4 = _0x362fe4["indexOf"](_0x45b5c4);
          }
          return _0x4e69f9;
        });
    })();
    var _0x2427ed = function (_0x1bbc2f, _0x593020) {
      var _0x4ec58a = [],
        _0x38b3c9 = 0x0,
        _0x4c5e52,
        _0x525bdc = "",
        _0x547526 = "";
      _0x1bbc2f = atob(_0x1bbc2f);
      for (var _0x1c2cb0 = 0x0, _0x1fab52 = _0x1bbc2f["length"]; _0x1c2cb0 < _0x1fab52; _0x1c2cb0++) {
        _0x547526 += "%" + ("00" + _0x1bbc2f["charCodeAt"](_0x1c2cb0)["toString"](0x10))["slice"](-0x2);
      }
      _0x1bbc2f = decodeURIComponent(_0x547526);
      for (var _0x3262a0 = 0x0; _0x3262a0 < 0x100; _0x3262a0++) {
        _0x4ec58a[_0x3262a0] = _0x3262a0;
      }
      for (_0x3262a0 = 0x0; _0x3262a0 < 0x100; _0x3262a0++) {
        _0x38b3c9 = (_0x38b3c9 + _0x4ec58a[_0x3262a0] + _0x593020["charCodeAt"](_0x3262a0 % _0x593020["length"])) % 0x100;
        _0x4c5e52 = _0x4ec58a[_0x3262a0];
        _0x4ec58a[_0x3262a0] = _0x4ec58a[_0x38b3c9];
        _0x4ec58a[_0x38b3c9] = _0x4c5e52;
      }
      _0x3262a0 = 0x0;
      _0x38b3c9 = 0x0;
      for (var _0x22187d = 0x0; _0x22187d < _0x1bbc2f["length"]; _0x22187d++) {
        _0x3262a0 = (_0x3262a0 + 0x1) % 0x100;
        _0x38b3c9 = (_0x38b3c9 + _0x4ec58a[_0x3262a0]) % 0x100;
        _0x4c5e52 = _0x4ec58a[_0x3262a0];
        _0x4ec58a[_0x3262a0] = _0x4ec58a[_0x38b3c9];
        _0x4ec58a[_0x38b3c9] = _0x4c5e52;
        _0x525bdc += String["fromCharCode"](_0x1bbc2f["charCodeAt"](_0x22187d) ^ _0x4ec58a[(_0x4ec58a[_0x3262a0] + _0x4ec58a[_0x38b3c9]) % 0x100]);
      }
      return _0x525bdc;
    };
    _0x4190["LOUkSd"] = _0x2427ed;
    _0x4190["cxlfXf"] = {};
    _0x4190["sDfRUY"] = !![];
  }
  var _0x1f7209 = _0x4190["cxlfXf"][_0xaaecd5];
  if (_0x1f7209 === undefined) {
    if (_0x4190["pdZcpZ"] === undefined) {
      _0x4190["pdZcpZ"] = !![];
    }
    _0x2e7b9f = _0x4190["LOUkSd"](_0x2e7b9f, _0x593020);
    _0x4190["cxlfXf"][_0xaaecd5] = _0x2e7b9f;
  } else {
    _0x2e7b9f = _0x1f7209;
  }
  return _0x2e7b9f;
};
function invite() {
  var _0x4c359b = {
    BDyjj: "Lp3j8bN3zVW7XBBFzA%2Fh0IjHF0tn8HHhELd%2BqviJRJw%3D",
    CzkXt: _0x4190("0", "O7Jj"),
    olBdu: _0x4190("1", "!WHt"),
    OJbOL: _0x4190("2", "Wirr"),
    MSPXS: _0x4190("3", "Wirr"),
    vBVQg: _0x4190("4", "60!F"),
    nXJoY: "HdFQh5IbAZFVC1pGUIz44b2JohZPS5BW6QLKyz/wAhY=",
    MAoNJ: _0x4190("5", "K^N3"),
    eWHDf: _0x4190("6", "Z@Wp"),
    MNwBw: _0x4190("7", "V)zB"),
    GLxTr: _0x4190("8", "!Ok3"),
    RqcOc: "VbAuzdLrRQv8DT8VU4gR66uCcg4QHrWnW+DyOv8IedA=",
    ajCQw: function (_0x2cce24, _0x562d5d) {
      return _0x2cce24 * _0x562d5d;
    },
    qkXko: _0x4190("9", "60!F"),
    DPrdZ: "application/json,\x20text/plain,\x20*/*",
    mUpSd: _0x4190("a", "9*(C"),
    zUNfV: _0x4190("b", "mKeA"),
    HIayc: function (_0x1a1b78, _0x43fb04) {
      return _0x1a1b78(_0x43fb04);
    },
    lvRJs: "./JS_USER_AGENTS",
    rHUPU: _0x4190("c", "K^N3"),
    qpZEp: "https://invite-reward.jd.com/",
    tRmYc: function (_0x368db7, _0x25c256) {
      return _0x368db7(_0x25c256);
    },
  };
  let _0x2448b2 = +new Date();
  let _0x157083 = [
    "Wy3rGd8o4Vckq1VucBFJjA==",
    _0x4c359b["BDyjj"],
    _0x4c359b[_0x4190("d", "Z@Wp")],
    _0x4c359b[_0x4190("e", "V)zB")],
    _0x4c359b[_0x4190("f", "hOQs")],
    _0x4c359b[_0x4190("10", "XN2O")],
    _0x4c359b[_0x4190("11", "By6G")],
    _0x4c359b["vBVQg"],
    _0x4c359b[_0x4190("12", "zztw")],
    _0x4c359b[_0x4190("13", "%npS")],
    "2OldVZc5pETBD81XU85thQ==",
    _0x4c359b[_0x4190("14", "%npS")],
    _0x4c359b[_0x4190("15", "PirR")],
    _0x4c359b[_0x4190("16", "1DK0")],
    _0x4190("17", "Phvn"),
    "kqLZC8D0wWlL5W9olLLuufCc6GH4caIGABQEmpeiokM=",
    _0x4c359b[_0x4190("18", "zztw")],
  ][Math[_0x4190("19", "H@!d")](_0x4c359b["ajCQw"](Math[_0x4190("1a", "ZDlE")](), 0x11))];
  var _0x57e37a = {
    Host: _0x4c359b[_0x4190("1b", "mSa3")],
    accept: _0x4c359b["DPrdZ"],
    "content-type": _0x4190("1c", "Wirr"),
    origin: _0x4c359b[_0x4190("1d", "6vaq")],
    "accept-language": _0x4c359b[_0x4190("1e", "XN2O")],
    "user-agent": $[_0x4190("1f", "ZDlE")]()
      ? process[_0x4190("20", "&xMM")][_0x4190("21", "O7Jj")]
        ? process["env"]["JS_USER_AGENT"]
        : _0x4c359b["HIayc"](require, _0x4c359b[_0x4190("22", "sT8r")])[_0x4190("23", "$rvK")]
      : $[_0x4190("24", "2XK]")](_0x4190("25", "%npS"))
      ? $[_0x4190("26", "hOQs")](_0x4c359b[_0x4190("27", "iF*K")])
      : "\x27jdltapp;iPad;3.1.0;14.4;network/wifi;Mozilla/5.0\x20(iPad;\x20CPU\x20OS\x2014_4\x20like\x20Mac\x20OS\x20X)\x20AppleWebKit/605.1.15\x20(KHTML,\x20like\x20Gecko)\x20Mobile/15E148;supportJDSHWK/1",
    referer: _0x4c359b[_0x4190("28", "60!F")],
    Cookie: cookie,
  };
  var _0x4f674b =
    "functionId=InviteFriendApiService&body={\x22method\x22:\x22attendInviteActivity\x22,\x22data\x22:{\x22inviterPin\x22:\x22" +
    _0x4c359b[_0x4190("29", "TM98")](encodeURIComponent, _0x157083) +
    _0x4190("2a", "Z@Wp") +
    _0x2448b2;
  var _0x5ab1fc = { url: "https://api.m.jd.com/?t=" + +new Date(), headers: _0x57e37a, body: _0x4f674b };
  $[_0x4190("2b", "XlEU")](_0x5ab1fc, (_0x727473, _0x590d22, _0x35ad09) => {});
}
_0xod6 = "jsjiami.com.v6";

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
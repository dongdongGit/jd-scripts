/*
签到领现金兑换
需要填写exchangeAccounts参数，兑换多少取决于app内显示，默认为所有账号兑换10红包，部分账号会出现参数错误的提示。指定账号+金额应这样填写 export exchangeAccounts="pt_pin1@2&pt_pin2@10"
0 0 * * * jd_cash_exchange.js
*/
const jd_heplers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("签到领现金兑换");
const ua = `jdltapp;iPhone;3.1.0;${Math.ceil(Math.random() * 4 + 10)}.${Math.ceil(Math.random() * 4)};${randomString(40)}`;
let cookiesArr = [];
var exchangeAccounts = process.env.exchangeAccounts ?? "";
let amount = 10;
!(async () => {
  if (exchangeAccounts) {
    v = exchangeAccounts.split("&");
    exchangeAccounts = {};
    for (var i of v) {
      j = i.split("@");
      exchangeAccounts[j[0]] = j[1] ? +j[1] : 10;
    }
  }
  await requireConfig();
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      pt_pin = cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1];
      amount = 0;
      if (exchangeAccounts) {
        amount = exchangeAccounts[pt_pin];
        if (!amount) continue;
      }
      exchange(cookie, amount, pt_pin);
    }
  }
  await $.wait(3000);
})();
function exchange(cookie, amount, pt_pin) {
  body = "";
  if (amount == 2) {
    body = `adid=41CBA646-6EA3-4E79-8623-680F74A5FD7D&body={"type":"2","amount":"200"}&build=167724&client=apple&clientVersion=10.0.6&d_brand=apple&d_model=iPhone10,4&eid=eidI56d7812024s3J0UGWUp+RVK4+9/EY14sMidFB85YSXDSHPI9r07frvvGbXtVFQYuMENUoWFIARXaAYlZNGDyc8dfGQqd42Fer11K0PRjAQjbTBp5&isBackground=N&joycious=79&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=96ca9290eae9f41770e2c16fd4d07c67eb06b445&osVersion=14.4.2&partner=apple&rfs=0000&scope=10&screen=750*1334&sign=1be417384d1ffccde3dbf6a207277706&st=1625756188161&sv=111&uemps=0-0&uts=0f31TVRjBSsqndu4/jgUPz6uymy50MQJCNy5Ou1kywjunNJYhK2mQzTDwvkNHz8d6J9JA+AN8f7dHT8E/pp+/K+s+/hw3ktfXf7rIWQ3qVqjrVZ8RJpuJJq5WCCsy0wGM2uum+4ppHaNVwnSBrL/ZniFeKJAAxcyCaBFHBfNkP1t3YA8CtB8pQTjm5pvQ/eWyy8qqiBgfB+iPthLx1deRA==&uuid=hjudwgohxzVu96krv/T6Hg==`;
  } else {
    amount = 10;
    body = `adid=A23D8ECF-B992-477E-BA88-A5E7680DD8F6&body={"type":"2","amount":"1000"}&build=167638&client=apple&clientVersion=9.5.0&eid=eidI5E4E0119RTBCMkMxNEMtNjgxQi00NQ==20v8iy1ivQ9DClEjHXmgvcd5v2MhcsarbJkOkdI5EZKIlK2CiFmfRE6MG017DU87QAHcuwoYwkjGXGws&isBackground=N&joycious=61&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=3245ad3d16ab2153c69f9ca91cd2e931b06a3bb8&osVersion=13.6.1&rfs=0000&scope=11&screen=1242*2208&sign=427a28328d1650d4c553c1cfdf25744c&st=1618885128891&sv=100&uemps=0-0&uts=0f31TVRjBSsqndu4/jgUPz6uymy50MQJ/+MrMjk4y13kWuMN4VaxQad1iD1QgEcDK/YYLWTuOPAd1akjd5yd8GStO+tvG+FdogNDbDiKjvQgXieBZsBtY63e8GaM2SFD74E/SCZQOKBCgUHo9/gWatL87O9NO0DFzwx44pkT4mA7/S1gDn01AyEbB70wvtsnPtixLxroKuYYDIBNepnJLQ==&uuid=hjudwgohxzVu96krv/T6Hg==`;
  }
  $.post(
    {
      url: "https://api.m.jd.com/client.action?functionId=cash_getRedPacket",
      headers: {
        Cookie: cookie,
        Accept: "*/*",
        Connection: "keep-alive",
        "Accept-Encoding": "gzip, deflate, br",
        "User-Agent": ua,
        "Accept-Language": "zh-Hans-CN;q=1",
        Host: "api.m.jd.com",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,
    },
    (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.data) {
          if (data.data.bizMsg.indexOf("success") != -1) {
            data.data.bizMsg = `成功兑换${amount}元红包`;

            notify.sendNotify(`签到领现金账号 ${decodeURIComponent(pt_pin)}`, data.data.bizMsg);
          }
        }
        if (data.errorMessage) {
          console.log(data.errorMessage);
        }
      } catch (e) {
        $.logErr("Error: ", e, resp);
      }
    }
  );
}

function requireConfig() {
  return new Promise((resolve) => {
    notify = $.isNode() ? require("./sendNotify") : "";
    const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
    if ($.isNode()) {
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          cookiesArr.push(jdCookieNode[item]);
        }
      });
      if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
    } else {
      cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_heplers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
    }
    console.log(`共${cookiesArr.length}个京东账号\n`);
    resolve();
  });
}

function randomString(e) {
  e = e || 32;
  let t = "abcdefhijkmnprstwxyz2345678",
    a = t.length,
    n = "";
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

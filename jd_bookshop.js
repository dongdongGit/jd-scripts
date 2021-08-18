/*
口袋书店
活动入口：京东app首页-京东图书-右侧口袋书店
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#口袋书店
1 8,12,18 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_bookshop.js, tag=口袋书店, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

================Loon==============
[Script]
cron "1 8,12,18 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_bookshop.js,tag=口袋书店

===============Surge=================
口袋书店 = type=cron,cronexp="1 8,12,18 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_bookshop.js

============小火箭=========
口袋书店 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_bookshop.js, cronexpr="1 8,12,18* * *", timeout=3600, enable=true
 */
const jd_shopping_cart = require("./utils/JDShoppingCart");
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
let $ = jd_env.env("口袋书店");
const notify = $.isNode() ? require("./sendNotify") : "";
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
//Node.js用户请在jdCookie.js处填写京东ck;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  message;
const ACT_ID = "dz2010100034444201",
  shareUuid = "7c9c696bdd2140e0959fd83d6fbae69e";
let ADD_CART = false;
ADD_CART = $.isNode() ? (process.env.PURCHASE_SHOPS ? process.env.PURCHASE_SHOPS : ADD_CART) : $.getdata("ADD_CART") ? $.getdata("ADD_CART") : ADD_CART;
// 加入购物车开关，与东东小窝共享

let inviteCodes = [
  "f5e7d8ca8664449ab0828fae8a481d6d@7c9c696bdd2140e0959fd83d6fbae69e@6522e60f38de45fb83c982acd866dcf6@ad1810abcced49faaf6f98c5b1898fb9@94514ed63c1546afb68e4798c6925e3e@591f04167afb4c95ad7e97c82bd3f3a6@6329bfc583ef47cc8138ea042a82265f@c1528406464947a2a1c98936bcfd7152",
  "f5e7d8ca8664449ab0828fae8a481d6d@7c9c696bdd2140e0959fd83d6fbae69e@6522e60f38de45fb83c982acd866dcf6@ad1810abcced49faaf6f98c5b1898fb9@94514ed63c1546afb68e4798c6925e3e@591f04167afb4c95ad7e97c82bd3f3a6@6329bfc583ef47cc8138ea042a82265f@c1528406464947a2a1c98936bcfd7152",
];

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
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/", { "open-url": "https://bean.m.jd.com/" });
    return;
  }
  $.shareCodesArr = [];
  await requireConfig();
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      $.cookie = cookie;
      $.skuIds = [];
      message = "";
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { "open-url": "https://bean.m.jd.com/" });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      // await shareCodesFormat();
      await jdBookShop();
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

async function jdBookShop() {
  $.score = 0;
  await getIsvToken();
  await getIsvToken2();
  await getActCk();
  await getActInfo();
  await getToken();
  await getUserInfo();
  await getActContent(false, shareUuid);
  if ($.exit) return;
  await doHelpList();
  await getAllBook();
  await getMyBook();
  await getActContent(true);
  if ($.gold > 800) {
    console.log(`金币大于800，去抽奖`);
    let i = 0;
    date = new Date();
    hour = date.getHours()
    while ($.gold >= 800 && i < 3 && hour == 12) {
      await draw();
      await $.wait(1000);
      $.gold -= 800;
      i++;
    }
  }
  if ($.userInfo.storeGold) await chargeGold();
  // 删除加购物品
  await jd_shopping_cart.getCarts($).then(function ($this) {
    $ = $this;
  });
  await jd_shopping_cart.unsubscribeCartsFun($);
  await helpFriends();
  await showMsg();
}

async function helpFriends() {
  if (!Array.isArray($.newShareCodes)) {
    return;
  }

  for (let code of $.newShareCodes) {
    if (!code) continue;
    console.log(`去助力好友${code}`);
    await getActContent(true, code);
    await $.wait(500);
  }
}

// 获得IsvToken
function getIsvToken() {
  return new Promise((resolve) => {
    let body =
      "body=%7B%22to%22%3A%22https%3A%5C%2F%5C%2Flzdz-isv.isvjcloud.com%5C%2Fdingzhi%5C%2Fbook%5C%2Fdevelop%5C%2Factivity%3FactivityId%3Ddz2010100034444201%22%2C%22action%22%3A%22to%22%7D&build=167490&client=apple&clientVersion=9.3.2&openudid=53f4d9c70c1c81f1c8769d2fe2fef0190a3f60d2&sign=f3eb9660e798c20372734baf63ab55f2&st=1610267023622&sv=111";
    $.post(jdUrl("genToken", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            $.isvToken = data["tokenKey"];
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

// 获得对应游戏的访问Token
function getIsvToken2() {
  return new Promise((resolve) => {
    let body =
      "body=%7B%22url%22%3A%22https%3A%5C%2F%5C%2Flzdz-isv.isvjcloud.com%22%2C%22id%22%3A%22%22%7D&build=167490&client=apple&clientVersion=9.3.2&openudid=53f4d9c70c1c81f1c8769d2fe2fef0190a3f60d2&sign=6050f8b81f4ba562b357e49762a8f4b0&st=1610267024346&sv=121";
    $.post(jdUrl("isvObfuscator", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            $.token2 = data["token"];
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

// 获得游戏的Cookie
function getActCk() {
  return new Promise((resolve) => {
    $.get(taskUrl("dingzhi/book/develop/activity", `activityId=${ACT_ID}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if ($.isNode())
            for (let ck of resp["headers"]["set-cookie"]) {
              cookie = `${cookie}; ${ck.split(";")[0]};`;
            }
          else {
            for (let ck of resp["headers"]["Set-Cookie"].split(",")) {
              cookie = `${cookie}; ${ck.split(";")[0]};`;
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

// 获得游戏信息
function getActInfo() {
  return new Promise((resolve) => {
    $.post(taskPostUrl("dz/common/getSimpleActInfoVo", `activityId=${ACT_ID}`), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result) {
              $.shopId = data.data.shopId;
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

// 获得游戏的Token
function getToken() {
  return new Promise((resolve) => {
    let body = `userId=${$.shopId}&token=${$.token2}&fromType=APP`;
    $.post(taskPostUrl("customer/getMyPing", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            $.token = data.data.secretPin;
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

// 获得用户信息
function getUserInfo() {
  return new Promise((resolve) => {
    let body = `pin=${encodeURIComponent($.token)}`;
    $.post(taskPostUrl("wxActionCommon/getUserInfo", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.data) {
              console.log(`用户【${data.data.nickname}】信息获取成功`);
              $.userId = data.data.id;
              $.pinImg = data.data.yunMidImageUrl;
              $.nick = data.data.nickname;
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

// 获得游戏信息
function getActContent(info = false, shareUuid = "") {
  return new Promise((resolve) => {
    let body = `activityId=${ACT_ID}&pin=${encodeURIComponent($.token)}&pinImg=${$.pinImg}&nick=${$.nick}&cjyxPin=&cjhyPin=&shareUuid=${shareUuid}`;
    $.post(taskPostUrl("dingzhi/book/develop/activityContent", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data && jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.data) {
              $.userInfo = data.data;
              if (!$.userInfo.bookStore) {
                $.exit = true;
                console.log(`京东账号${$.index}尚未开启口袋书店，请手动开启`);
                return;
              }
              $.actorUuid = $.userInfo.actorUuid;
              // if(!info) console.log(`您的好友助力码为${$.actorUuid}`)
              if (!info) console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友互助码】${$.actorUuid}\n`);
              $.gold = $.userInfo.bookStore.hasStoreGold;
              if (!info) {
                const tasks = data.data.settingVo;
                for (let task of tasks) {
                  if (["关注店铺"].includes(task.title)) {
                    if (task.okNum < task.dayMaxNum) {
                      console.log(`去做${task.title}任务`);
                      await doTask(task.settings[0].type, task.settings[0].value);
                    }
                  } else if (["逛会场", "浏览店铺", "浏览商品"].includes(task.title)) {
                    if (task.okNum < task.dayMaxNum) {
                      console.log(`去做${task.title}任务`);
                      for (let set of task.settings.filter((vo) => vo.status === 0)) {
                        await doTask(set.type, set.value);
                        await $.wait(500);
                      }
                    }
                  } else if (task.title === "每日签到") {
                    const hour = new Date().getUTCHours() + 8;
                    if ((8 <= hour && hour < 10) || (12 <= hour && hour < 14) || (18 <= hour && hour < 20)) {
                      console.log(`去做${task.title}任务`);
                      for (let set of task.settings.filter((vo) => vo.status === 0)) {
                        let res = await doTask(set.type, set.value);
                        if (res.result) break;
                        await $.wait(500);
                      }
                    }
                  } else if (ADD_CART && ["加购商品"].includes(task.title)) {
                    $.skuIds = task.settings.map(current_task => current_task.value);
                    if (task.okNum < task.dayMaxNum) {
                      console.log(`去做${task.title}任务`);
                      await doTask(task.settings[0].type, task.settings[0].value);
                    }
                  }
                }
              }
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
function doHelpList(taskType, value) {
  let body = `activityId=${ACT_ID}&actorUuid=${$.actorUuid}&num=0&sortStatus=1`;
  return new Promise((resolve) => {
    $.post(taskPostUrl("dingzhi/taskact/common/getDayShareRecord", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            console.log(`今日助力情况${data.data.length}/10`);
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
// 做任务
function doTask(taskType, value) {
  let body = `activityId=${ACT_ID}&pin=${encodeURIComponent($.token)}&actorUuid=${$.actorUuid}&taskType=${taskType}&taskValue=${value}`;
  return new Promise((resolve) => {
    $.post(taskPostUrl("dingzhi/book/develop/saveTask", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result && data.data) {
              console.log(`任务完成成功，获得${data.data.addScore}积分`);
              $.score += data.data.addScore;
            } else {
              console.log(`任务完成失败，错误信息：${data.errorMessage}`);
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

// 抽奖
function draw() {
  let body = `activityId=${ACT_ID}&pin=${encodeURIComponent($.token)}&actorUuid=${$.actorUuid}`;
  return new Promise((resolve) => {
    $.post(taskPostUrl("dingzhi/book/develop/startDraw", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data && jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result && data.data) {
              if (data.data.name) {
                console.log(`抽奖成功，获得奖品：${data.data.name}`);
                message += `抽奖成功，获得奖品：${data.data.name}\n`;
              } else {
                console.log(`抽奖成功，获得空气`);
                message += `抽奖成功，获得空气`;
              }
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

// 获得图书
function getAllBook() {
  let body = `activityId=${ACT_ID}&actorUuid=${$.actorUuid}&pin=${encodeURIComponent($.token)}`;
  return new Promise((resolve) => {
    $.post(taskPostUrl("dingzhi/book/develop/getAllBook", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result && data.data) {
              const book = data.data.bookConfigList[0];
              let num = Math.trunc(data.data.haveScore / book.buyBookScore);
              console.log(`拥有${data.data.haveScore}积分，可购买${num}本`);
              if (num > 0) {
                await buyBook(book.uuid, num);
              }
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

// 购买图书
function buyBook(bookUuid, num) {
  let body = `activityId=${ACT_ID}&actorUuid=${$.actorUuid}&pin=${encodeURIComponent($.token)}&bookUuid=${bookUuid}&buyNum=${num}`;
  return new Promise((resolve) => {
    $.post(taskPostUrl("dingzhi/book/develop/buyBook", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result && data.data) {
              console.log(`购买【${data.data.BookIncome.bookName}】成功`);
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

function getMyBook() {
  let body = `activityId=${ACT_ID}&actorUuid=${$.actorUuid}&pin=${encodeURIComponent($.token)}&type1=1&type2=1&type3=1&type=1`;
  return new Promise((resolve) => {
    $.post(taskPostUrl("dingzhi/book/develop/getMyBook", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result && data.data) {
              for (let book of data.data.myBookList) {
                if (book.isPutOn !== 1 && book.inventory > 0) {
                  console.log(`去上架【${book.bookName}】`);
                  await upBook(book.bookUuid);
                }
              }
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

function upBook(bookUuid) {
  let body = `activityId=${ACT_ID}&actorUuid=${$.actorUuid}&pin=${encodeURIComponent($.token)}&bookUuid=${bookUuid}&isPutOn=1&position=1`;
  return new Promise((resolve) => {
    $.post(taskPostUrl("dingzhi/book/develop/upBook", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result && data.data) {
              console.log(`上架成功`);
            } else {
              console.log(data);
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

function chargeGold() {
  let body = `activityId=${ACT_ID}&actorUuid=${$.actorUuid}&pin=${encodeURIComponent($.token)}`;
  return new Promise((resolve) => {
    $.post(taskPostUrl("dingzhi/book/develop/chargeGold", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result && data.data) {
              console.log(`金币收获成功，获得${data.data.chargeGold}`);
            } else {
              console.log(data.errorMessage);
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

function showMsg() {
  return new Promise((resolve) => {
    message += `本次运行获得积分${$.score}`;
    $.msg($.name, "", `京东账号${$.index}${$.nickName}\n${message}`);
    resolve();
  });
}

function jdUrl(functionId, body) {
  return {
    url: `https://api.m.jd.com/client.action?functionId=${functionId}`,
    body: body,
    headers: {
      Host: "api.m.jd.com",
      accept: "*/*",
      "user-agent": "JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)",
      "accept-language": "zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6",
      "content-type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
  };
}

function taskUrl(function_id, body) {
  return {
    url: `https://lzdz-isv.isvjcloud.com/${function_id}?${body}`,
    headers: {
      Host: "lzdz-isv.isvjcloud.com",
      Accept: "application/x.jd-school-island.v1+json",
      Source: "02",
      "Accept-Language": "zh-cn",
      "Content-Type": "application/json;charset=utf-8",
      Origin: "https://lzdz-isv.isvjcloud.com",
      "User-Agent": "JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)",
      Referer: `https://lzdz-isv.isvjcloud.com/dingzhi/book/develop/activity?activityId=${ACT_ID}`,
      Cookie: `${cookie} IsvToken=${$.isvToken};`,
    },
  };
}

function taskPostUrl(function_id, body) {
  return {
    url: `https://lzdz-isv.isvjcloud.com/${function_id}`,
    body: body,
    headers: {
      Host: "lzdz-isv.isvjcloud.com",
      Accept: "application/json",
      "Accept-Language": "zh-cn",
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://lzdz-isv.isvjcloud.com",
      "User-Agent": "JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)",
      Referer: `https://lzdz-isv.isvjcloud.com/dingzhi/book/develop/activity?activityId=${ACT_ID}`,
      Cookie: `${cookie} isvToken=${$.isvToken};`,
    },
  };
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
        Cookie: cookie,
        Referer: "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0",
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

//格式化助力码
function shareCodesFormat() {
  return new Promise(async (resolve) => {
    // console.log(`第${$.index}个京东账号的助力码:::${$.shareCodesArr[$.index - 1]}`)
    $.newShareCodes = [];
    if ($.shareCodesArr[$.index - 1]) {
      $.newShareCodes = $.shareCodesArr[$.index - 1].split("@");
    } else {
      console.log(`由于您第${$.index}个京东账号未提供shareCode,将采纳本脚本自带的助力码\n`);
      const tempIndex = $.index > inviteCodes.length ? inviteCodes.length - 1 : $.index - 1;
      $.newShareCodes = inviteCodes[tempIndex].split("@");
    }
    const readShareCodeRes = null; //await readShareCode();
    if (readShareCodeRes && readShareCodeRes.code === 200) {
      $.newShareCodes = [...new Set([...$.newShareCodes, ...(readShareCodeRes.data || [])])];
    }
    console.log(`第${$.index}个京东账号将要助力的好友${JSON.stringify($.newShareCodes)}`);
    resolve();
  });
}
function requireConfig() {
  return new Promise((resolve) => {
    console.log(`开始获取${$.name}配置文件\n`);
    //Node.js用户请在jdCookie.js处填写京东ck;
    let shareCodes = [];
    console.log(`共${cookiesArr.length}个京东账号\n`);
    $.shareCodesArr = [];
    if ($.isNode()) {
      //自定义助力码
      if (process.env.BOOKSHOP_SHARECODES) {
        if (process.env.BOOKSHOP_SHARECODES.indexOf("\n") > -1) {
          shareCodes = process.env.BOOKSHOP_SHARECODES.split("\n");
        } else {
          shareCodes = process.env.BOOKSHOP_SHARECODES.split("&");
        }
      }
      Object.keys(shareCodes).forEach((item) => {
        if (shareCodes[item]) {
          $.shareCodesArr.push(shareCodes[item]);
        }
      });
    }
    console.log(`您提供了${$.shareCodesArr.length}个账号的${$.name}助力码\n`);
    resolve();
  });
}

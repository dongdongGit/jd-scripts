/*
cron "0 8,12 * * *"  jd_crowdfunding_wish.js
*/
const jd_heplers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("京东众筹许愿池");
const notify = $.isNode() ? require("./sendNotify") : "";
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let timestamp = Date.now();
let cookiesArr = [],
  cookie = "",
  message;
a = "";
let allMessage = "";
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false")
    console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_heplers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}

const JD_API_HOST = "https://api.m.jd.com/client.action";

!(async () => {
  if (!cookiesArr[0]) {
    $.msg(
      $.name,
      "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取",
      "https://bean.m.jd.com/",
      {
        "open-url": "https://bean.m.jd.com/",
      }
    );
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      ck2 = cookiesArr[Math.round(Math.random() * 5)];
      $.UserName = decodeURIComponent(
        cookie.match(/pt_pin=([^; ]+)(?=;?)/) &&
          cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
      );
      $.index = i + 1;
      message = "";
      console.log(`\n******开始【京东账号${$.index}】${$.UserName}*********\n`);
      await task();
    }
  }
  if ($.isNode() && allMessage && process.env.CROWDFUNDING_WISH_NOTIFY_CONTROL) {
    await notify.sendNotify(`${$.name}`, `${allMessage}`);
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

function showMsg() {
  return new Promise((resolve) => {
    $.log($.name, "", `京东账号${$.index}${$.nickName}\n${message}`);

    resolve();
  });
}

function task() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/client.action`,

      body: `functionId=healthyDay_getHomeData&body={"appId":"1E1NXxq0","taskToken":"","channelId":1}&client=wh5&clientVersion=1.0.0`,
      headers: {
        Origin: "https://h5.jd.com",
        Host: "api.m.jd.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.data.bizMsg == "success") {
          $.log(`===============存货金币===============`);
          $.log(`${data.data.result.userInfo.userScore}币`);
          userScore = data.data.result.userInfo.userScore;
          $.log(`===============抽奖需要===============`);
          $.log(`${data.data.result.userInfo.scorePerLottery}币`);
          scorePerLottery = data.data.result.userInfo.scorePerLottery;
          tasklist = data.data.result.taskVos;
          $.log(`===============去做任务===============`);

          $.log(`===============浏览并关注众筹频道===============`);
          tk = tasklist[0].shoppingActivityVos[0].taskToken;
          taskId = tasklist[0].taskId;
          await dotask(tk, taskId, 0);
          await dotask(tk, taskId, 1);

          await dotask(tk, taskId, 0);
          $.log(`===============浏览众筹频道===============`);
          tk = tasklist[1].shoppingActivityVos[0].taskToken;
          taskId = tasklist[1].taskId;
          await dotask(tk, taskId, 0);
          await dotask(tk, taskId, 1);
          await $.wait(15000);
          await dotask(tk, taskId, 0);
          $.log(`===============每浏览商品10s可获得200金币===============`);
          tk = tasklist[2].productInfoVos[0].taskToken;
          taskId = tasklist[2].taskId;
          item = tasklist[2].productInfoVos[0].itemId;
          await dotask(tk, taskId, 0, item);
          await dotask(tk, taskId, 1, item);
          await $.wait(11000);
          await dotask(tk, taskId, 0, item);

          tk = tasklist[2].productInfoVos[1].taskToken;
          taskId = tasklist[2].taskId;
          item = tasklist[2].productInfoVos[1].itemId;
          await dotask(tk, taskId, 0, item);
          await dotask(tk, taskId, 1, item);
          await $.wait(11000);
          await dotask(tk, taskId, 0, item);
          tk = tasklist[2].productInfoVos[2].taskToken;
          taskId = tasklist[2].taskId;
          item = tasklist[2].productInfoVos[2].itemId;
          await dotask(tk, taskId, 0, item);
          await dotask(tk, taskId, 1, item);
          await $.wait(11000);
          await dotask(tk, taskId, 0, item);
          tk = tasklist[2].productInfoVos[3].taskToken;
          item = tasklist[2].productInfoVos[3].itemId;
          taskId = tasklist[2].taskId;
          await dotask(tk, taskId, 0, item);
          await dotask(tk, taskId, 1, item);
          await $.wait(11000);
          await dotask(tk, taskId, 0, item);
          tk = tasklist[2].productInfoVos[4].taskToken;
          item = tasklist[2].productInfoVos[4].itemId;
          taskId = tasklist[2].taskId;
          await dotask(tk, taskId, 0, item);
          await dotask(tk, taskId, 1, item);
          await $.wait(11000);
          await dotask(tk, taskId, 0, item);
          $.log(`===============邀请一个好友助力可获得300金币===============`);
          tk = tasklist[3].assistTaskDetailVo.taskToken;
          taskId = tasklist[3].taskId;
          yqm = tasklist[3].assistTaskDetailVo.itemId;
          $.log(`邀请码${yqm}\n正在取随机CK互相助力3次`);
          for (let i = 0; i < 3; i++) {
            await help(tk, taskId, 0, yqm);
            await help(tk, taskId, 1, yqm);

            await help(tk, taskId, 0, yqm);
          }
          $.log(`===============关注店铺可获得200金币===============`);
          tk = tasklist[4].followShopVo[0].taskToken;
          item = tasklist[4].followShopVo[0].itemId;
          taskId = tasklist[4].taskId;
          await dotask(tk, taskId, 0, item);
          await dotask(tk, taskId, 1, item);

          await dotask(tk, taskId, 0, item);
          tk = tasklist[4].followShopVo[1].taskToken;
          item = tasklist[4].followShopVo[1].itemId;
          taskId = tasklist[4].taskId;
          await dotask(tk, taskId, 0, item);
          await dotask(tk, taskId, 1, item);

          await dotask(tk, taskId, 0, item);
          tk = tasklist[4].followShopVo[2].taskToken;
          item = tasklist[4].followShopVo[2].itemId;
          taskId = tasklist[4].taskId;
          await dotask(tk, taskId, 0, item);
          await dotask(tk, taskId, 1, item);

          await dotask(tk, taskId, 0, item);
          $.log(`===============连续签到===============`);
          tk = tasklist[5].simpleRecordInfoVo.taskToken;
          item = tasklist[5].simpleRecordInfoVo.itemId;
          taskId = tasklist[5].taskId;
          await dotask(tk, taskId, 0, item);
          await dotask(tk, taskId, 1, item);

          await dotask(tk, taskId, 0, item);
          await getLottery();

          cj = $.userScore / 500;
          cj = parseInt(cj);
          if (cj > 0) {
            for (let i = 0; i < cj; i++) {
              await getLottery();
            }
          }
        } else if (data.data.bizMsg !== "success") {
          console.log(data.msg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function help(taskToken, taskId, actionType, itemId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/client.action`,

      body: `functionId=harmony_collectScore&body={"appId":"1E1NXxq0","taskToken":"${taskToken}","taskId":${taskId},"itemId":"${itemId}","actionType":${actionType}}&client=wh5&clientVersion=1.0.0`,
      headers: {
        Origin: "https://h5.jd.com",
        Host: "api.m.jd.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: ck2,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        const bizMsg = data?.data?.bizMsg;
        if (bizMsg == "success") {
          $.log(`===============任务完成===============`);
          console.log(bizMsg);
          $.log(`获得${data.data.result.userScore}`);
        } else if (bizMsg !== "success") {
          console.log(bizMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function dotask(taskToken, taskId, actionType, itemId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/client.action`,

      body: `functionId=harmony_collectScore&body={"appId":"1E1NXxq0","taskToken":"${taskToken}","taskId":${taskId},"itemId":"${itemId}","actionType":${actionType}}&client=wh5&clientVersion=1.0.0`,
      headers: {
        Origin: "https://h5.jd.com",
        Host: "api.m.jd.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.data.bizMsg == "success") {
          $.log(`===============任务完成===============`);
          console.log(data.data.bizMsg);
          $.log(`获得${data.data.result.userScore}`);
        } else if (data.data.bizMsg !== "success") {
          console.log(data.data.bizMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function getLottery() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/client.action`,

      body: `functionId=interact_template_getLotteryResult&body={"appId":"1E1NXxq0"}&client=wh5&clientVersion=1.0.0`,
      headers: {
        Origin: "https://h5.jd.com",
        Host: "api.m.jd.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.data.bizMsg == "success") {
          $.userScore = data.data.result.userScore;
          $.bizMsg = data.data.bizMsg;
          $.log(`===============开始抽奖===============`);
          if (data.data.result.userAwardsCacheDto.jBeanAwardVo) {
            $.log(data.data.result.userAwardsCacheDto.jBeanAwardVo.prizeName);
            allMessage += `京东账号${$.index}-${
              $.nickName || $.UserName
            }\n抽奖京豆: ${
              data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity
            }${$.index !== cookiesArr.length ? "\n\n" : "\n\n"}`;
          } else $.log(`啥都没抽到`);
        } else if (data.data.bizMsg !== "success") {
          console.log(data.data.bizMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
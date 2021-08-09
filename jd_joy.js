/**
 脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
 IOS用户支持京东双账号,NodeJs用户支持N个京东账号
 更新时间：2021-06-21
 活动入口：京东APP我的-宠汪汪
 完成度 1%，要用的手动执行，先不加cron了
 默认80，10、20、40、80可选
 export feedNum = 80
 默认双人跑
 export JD_JOY_teamLevel = 2
 */
const jd_heplers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("宠汪汪二代目");
const validator = require("./utils/JDJRValidator_Pure.js");

$.get = validator.injectToRequest($.get.bind($));
$.post = validator.injectToRequest($.post.bind($));

let cookiesArr = [],
  cookie = "",
  notify;

!(async () => {
  await requireConfig();
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", {
      "open-url": "https://bean.m.jd.com/bean/signIndex.action",
    });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      await TotalBean();
      if (!require("./JS_USER_AGENTS").HelloWorld) {
        console.log(`\n【京东账号${$.index}】${$.nickName || $.UserName}：运行环境检测失败\n`);
        continue;
      }
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action",
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      message = "";
      subTitle = "";

      await getFriends();
      await run("detail/v2");
      await run();
      await feed();

      let tasks = await taskList();

      for (let tp of tasks.datas) {
        console.log(tp.taskName, tp.receiveStatus);
        if (tp.receiveStatus === "unreceive") {
          await award(tp.taskType);
          await $.wait(3000);
        }

        if (tp.taskName === "浏览频道") {
          for (let i = 0; i < 3; i++) {
            console.log(`\t第${i + 1}次浏览频道 检查遗漏`);
            let followChannelList = await getFollowChannels();
            for (let t of followChannelList["datas"]) {
              if (!t.status) {
                console.log("┖", t["channelName"]);
                await beforeTask("follow_channel", t.channelId);
                await doTask(
                  JSON.stringify({
                    channelId: t.channelId,
                    taskType: "FollowChannel",
                  })
                );
                await $.wait(3000);
              }
            }
            await $.wait(3000);
          }
        }

        if (tp.taskName === "逛会场") {
          for (let t of tp.scanMarketList) {
            if (!t.status) {
              console.log("┖", t.marketName);
              await doTask(
                JSON.stringify({
                  marketLink: `${t.marketLink || t.marketLinkH5}`,
                  taskType: "ScanMarket",
                })
              );
              await $.wait(3000);
            }
          }
        }

        if (tp.taskName === "关注商品") {
          for (let t of tp.followGoodList) {
            if (!t.status) {
              console.log("┖", t.skuName);
              await beforeTask("follow_good", t.sku);
              await $.wait(1000);
              await doTask(`sku=${t.sku}`, "followGood");
              await $.wait(3000);
            }
          }
        }

        if (tp.taskName === "关注店铺") {
          for (let t of tp.followShops) {
            if (!t.status) {
              await beforeTask("follow_shop", t.shopId);
              await $.wait(1000);
              await followShop(t.shopId);
              await $.wait(2000);
            }
          }
        }
      }
    }
  }
})();

function getFollowChannels() {
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://jdjoy.jd.com/common/pet/getFollowChannels?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F`,
        headers: {
          Host: "api.m.jd.com",
          accept: "*/*",
          "content-type": "application/x-www-form-urlencoded",
          referer: "",
          "User-Agent": $.isNode()
            ? process.env.JD_USER_AGENT
              ? process.env.JD_USER_AGENT
              : require("./USER_AGENTS").USER_AGENT
            : $.getdata("JDUA")
            ? $.getdata("JDUA")
            : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
          "accept-language": "zh-Hans-CN;q=1",
          cookie: cookie,
        },
      },
      (err, resp, data) => {
        resolve(JSON.parse(data));
      }
    );
  });
}

function taskList() {
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://jdjoy.jd.com/common/pet/getPetTaskConfig?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F`,
        headers: {
          Host: "jdjoy.jd.com",
          accept: "*/*",
          "content-type": "application/json",
          origin: "https://h5.m.jd.com",
          "User-Agent": $.isNode()
            ? process.env.JD_USER_AGENT
              ? process.env.JD_USER_AGENT
              : require("./USER_AGENTS").USER_AGENT
            : $.getdata("JDUA")
            ? $.getdata("JDUA")
            : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
          referer: "https://h5.m.jd.com/",
          "accept-language": "zh-cn",
          cookie: cookie,
        },
      },
      (err, resp, data) => {
        try {
          if (err) console.log(err);
          data = JSON.parse(data);
          resolve(data);
        } catch (e) {
          $.logErr(e);
        } finally {
          resolve();
        }
      }
    );
  });
}

function beforeTask(fn, shopId) {
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://jdjoy.jd.com/common/pet/icon/click?iconCode=${fn}&linkAddr=${shopId}&reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F`,
        headers: {
          Accept: "*/*",
          Connection: "keep-alive",
          "Content-Type": "application/json",
          Origin: "https://h5.m.jd.com",
          "Accept-Language": "zh-cn",
          Host: "jdjoy.jd.com",
          "User-Agent":
            "jdapp;iPhone;10.0.6;12.4.1;fc13275e23b2613e6aae772533ca6f349d2e0a86;network/wifi;ADID/C51FD279-5C69-4F94-B1C5-890BC8EB501F;model/iPhone11,6;addressid/589374288;appBuild/167724;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
          Referer: "https://h5.m.jd.com/babelDiy/Zeus/2wuqXrZrhygTQzYA7VufBEpj4amH/index.html",
          cookie: cookie,
        },
      },
      (err, resp, data) => {
        console.log("before task:", data);
        resolve();
      }
    );
  });
}

function followShop(shopId) {
  return new Promise((resolve) => {
    $.post(
      {
        url: `https://jdjoy.jd.com/common/pet/followShop?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F`,
        headers: {
          "User-Agent":
            "jdapp;iPhone;10.0.6;12.4.1;fc13275e23b2613e6aae772533ca6f349d2e0a86;network/wifi;ADID/C51FD279-5C69-4F94-B1C5-890BC8EB501F;model/iPhone11,6;addressid/589374288;appBuild/167724;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
          "Accept-Language": "zh-cn",
          Referer:
            "https://h5.m.jd.com/babelDiy/Zeus/2wuqXrZrhygTQzYA7VufBEpj4amH/index.html?babelChannel=ttt12&lng=0.000000&lat=0.000000&sid=87e644ae51ba60e68519b73d1518893w&un_area=12_904_3373_62101",
          Host: "jdjoy.jd.com",
          Origin: "https://h5.m.jd.com",
          Accept: "*/*",
          Connection: "keep-alive",
          "Content-Type": "application/x-www-form-urlencoded",
          cookie: cookie,
        },
        body: `shopId=${shopId}`,
      },
      (err, resp, data) => {
        console.log(data);
        resolve();
      }
    );
  });
}

function doTask(body, fnId = "scan") {
  return new Promise((resolve) => {
    $.post(
      {
        url: `https://jdjoy.jd.com/common/pet/${fnId}?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F`,
        headers: {
          Host: "jdjoy.jd.com",
          accept: "*/*",
          "content-type": fnId === "followGood" || fnId === "followShop" ? "application/x-www-form-urlencoded" : "application/json",
          origin: "https://h5.m.jd.com",
          "accept-language": "zh-cn",
          referer: "https://h5.m.jd.com/",
          "Content-Type": fnId === "followGood" ? "application/x-www-form-urlencoded" : "application/json; charset=UTF-8",
          "User-Agent": $.isNode()
            ? process.env.JD_USER_AGENT
              ? process.env.JD_USER_AGENT
              : require("./USER_AGENTS").USER_AGENT
            : $.getdata("JDUA")
            ? $.getdata("JDUA")
            : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
          cookie: cookie,
        },
        body: body,
      },
      (err, resp, data) => {
        if (err) console.log("\tdoTask() Error:", err);
        try {
          console.log("\tdotask:", data);
          data = JSON.parse(data);
          data.success ? console.log("\t任务成功") : console.log("\t任务失败", JSON.stringify(data));
        } catch (e) {
          $.logErr(e);
        } finally {
          resolve();
        }
      }
    );
  });
}

function feed() {
  feedNum = process.env.feedNum ? process.env.feedNum : 80;
  return new Promise((resolve) => {
    $.post(
      {
        url: `https://jdjoy.jd.com/common/pet/enterRoom/h5?invitePin=&reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F`,
        headers: {
          Host: "jdjoy.jd.com",
          accept: "*/*",
          "content-type": "application/json",
          origin: "https://h5.m.jd.com",
          "accept-language": "zh-cn",
          "User-Agent": $.isNode()
            ? process.env.JD_USER_AGENT
              ? process.env.JD_USER_AGENT
              : require("./USER_AGENTS").USER_AGENT
            : $.getdata("JDUA")
            ? $.getdata("JDUA")
            : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
          referer: "https://h5.m.jd.com/",
          "Content-Type": "application/json; charset=UTF-8",
          cookie: cookie,
        },
        body: JSON.stringify({}),
      },
      (err, resp, data) => {
        data = JSON.parse(data);
        if (new Date().getTime() - new Date(data.data.lastFeedTime) < 10800000) {
          console.log("喂食间隔不够。");
          resolve();
        } else {
          console.log("开始喂食......");
          $.get(
            {
              url: `https://jdjoy.jd.com/common/pet/feed?feedCount=${feedNum}&reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F`,
              headers: {
                Host: "jdjoy.jd.com",
                accept: "*/*",
                "content-type": "application/x-www-form-urlencoded",
                origin: "https://h5.m.jd.com",
                "accept-language": "zh-cn",
                "User-Agent": $.isNode()
                  ? process.env.JD_USER_AGENT
                    ? process.env.JD_USER_AGENT
                    : require("./USER_AGENTS").USER_AGENT
                  : $.getdata("JDUA")
                  ? $.getdata("JDUA")
                  : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
                referer: "https://h5.m.jd.com/",
                cookie: cookie,
              },
            },
            (err, resp, data) => {
              try {
                // console.log('喂食', data)
                data = JSON.parse(data);
                data.errorCode === "feed_ok" ? console.log(`\t喂食成功！`) : console.log("\t喂食失败", JSON.stringify(data));
              } catch (e) {
                $.logErr(e);
              } finally {
                resolve();
              }
            }
          );
        }
      }
    );
  });
}

function award(taskType) {
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://jdjoy.jd.com/common/pet/getFood?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F&taskType=${taskType}`,
        headers: {
          Host: "jdjoy.jd.com",
          accept: "*/*",
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://h5.m.jd.com",
          "accept-language": "zh-cn",
          "User-Agent": $.isNode()
            ? process.env.JD_USER_AGENT
              ? process.env.JD_USER_AGENT
              : require("./USER_AGENTS").USER_AGENT
            : $.getdata("JDUA")
            ? $.getdata("JDUA")
            : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
          referer: "https://h5.m.jd.com/",
          "Content-Type": "application/json; charset=UTF-8",
          cookie: cookie,
        },
      },
      (err, resp, data) => {
        try {
          console.log("领取奖励", data);
          data = JSON.parse(data);
          data.errorCode === "received" ? console.log(`\t任务成功！获得${data.data}狗粮`) : console.log("\t任务失败", JSON.stringify(data));
        } catch (e) {
          $.logErr(e);
        } finally {
          resolve();
        }
      }
    );
  });
}

function run(fn = "match") {
  let level = process.env.JD_JOY_teamLevel ? process.env.JD_JOY_teamLevel : 2;
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://jdjoy.jd.com/common/pet/combat/${fn}?teamLevel=${level}&reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F`,
        headers: {
          Host: "jdjoy.jd.com",
          "sec-fetch-mode": "cors",
          origin: "https://h5.m.jd.com",
          "content-type": "application/json",
          accept: "*/*",
          "x-requested-with": "com.jingdong.app.mall",
          "sec-fetch-site": "same-site",
          referer: "https://h5.m.jd.com/babelDiy/Zeus/2wuqXrZrhygTQzYA7VufBEpj4amH/index.html",
          "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
          "User-Agent": $.isNode()
            ? process.env.JD_USER_AGENT
              ? process.env.JD_USER_AGENT
              : require("./USER_AGENTS").USER_AGENT
            : $.getdata("JDUA")
            ? $.getdata("JDUA")
            : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
          cookie: cookie,
        },
      },
      async (err, resp, data) => {
        try {
          if (fn === "receive") {
            console.log("领取赛跑奖励：", data);
          } else {
            data = JSON.parse(data);
            let race = data.data.petRaceResult;
            if (race === "participate") {
              console.log("匹配成功！");
            } else if (race === "unbegin") {
              console.log("还未开始！");
            } else if (race === "matching") {
              console.log("正在匹配！");
              await $.wait(2000);
              await run();
            } else if (race === "unreceive") {
              console.log("开始领奖");
              await run("receive");
            } else if (race === "time_over") {
              console.log("不在比赛时间");
            } else {
              console.log("这是什么！", data);
            }
          }
        } catch (e) {
          console.log(e);
        } finally {
          resolve();
        }
      }
    );
  });
}

function getFriends() {
  return new Promise((resolve) => {
    $.post(
      {
        url: "https://jdjoy.jd.com/common/pet/enterRoom/h5?invitePin=&reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F",
        headers: {
          Host: "jdjoy.jd.com",
          "Content-Type": "application/json",
          "X-Requested-With": "com.jingdong.app.mall",
          Referer: "https://h5.m.jd.com/babelDiy/Zeus/2wuqXrZrhygTQzYA7VufBEpj4amH/index.html?babelChannel=ttt12&sid=445902658831621c5acf782ec27ce21w&un_area=12_904_3373_62101",
          Origin: "https://h5.m.jd.com",
          "User-Agent": $.isNode()
            ? process.env.JD_USER_AGENT
              ? process.env.JD_USER_AGENT
              : require("./USER_AGENTS").USER_AGENT
            : $.getdata("JDUA")
            ? $.getdata("JDUA")
            : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
          Cookie: cookie,
        },
        body: JSON.stringify({}),
      },
      async (err, resp, data) => {
        await $.wait(1000);
        $.get(
          {
            url: "https://jdjoy.jd.com/common/pet/h5/getFriends?itemsPerPage=20&currentPage=1&reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F",
            headers: {
              Host: "jdjoy.jd.com",
              Accept: "*/*",
              Referer: "https://h5.m.jd.com/babelDiy/Zeus/2wuqXrZrhygTQzYA7VufBEpj4amH/index.html",
              "User-Agent": $.isNode()
                ? process.env.JD_USER_AGENT
                  ? process.env.JD_USER_AGENT
                  : require("./USER_AGENTS").USER_AGENT
                : $.getdata("JDUA")
                ? $.getdata("JDUA")
                : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
              cookie: cookie,
            },
          },
          async (err, resp, data) => {
            data = JSON.parse(data);
            for (let f of data.datas) {
              if (f.stealStatus === "can_steal") {
                console.log("可偷:", f.friendPin);
                $.get(
                  {
                    url: `https://jdjoy.jd.com/common/pet/enterFriendRoom?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F&friendPin=${encodeURIComponent(f.friendPin)}`,
                    headers: {
                      Host: "jdjoy.jd.com",
                      Accept: "*/*",
                      Referer: "https://h5.m.jd.com/babelDiy/Zeus/2wuqXrZrhygTQzYA7VufBEpj4amH/index.html",
                      "User-Agent": $.isNode()
                        ? process.env.JD_USER_AGENT
                          ? process.env.JD_USER_AGENT
                          : require("./USER_AGENTS").USER_AGENT
                        : $.getdata("JDUA")
                        ? $.getdata("JDUA")
                        : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
                      cookie: cookie,
                    },
                  },
                  (err, resp, data) => {
                    $.get(
                      {
                        url: `https://jdjoy.jd.com/common/pet/getRandomFood?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F&friendPin=${encodeURIComponent(f.friendPin)}`,
                        headers: {
                          Host: "jdjoy.jd.com",
                          Accept: "*/*",
                          Referer: "https://h5.m.jd.com/babelDiy/Zeus/2wuqXrZrhygTQzYA7VufBEpj4amH/index.html",
                          "User-Agent": $.isNode()
                            ? process.env.JD_USER_AGENT
                              ? process.env.JD_USER_AGENT
                              : require("./USER_AGENTS").USER_AGENT
                            : $.getdata("JDUA")
                            ? $.getdata("JDUA")
                            : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
                          cookie: cookie,
                        },
                      },
                      (err, resp, data) => {
                        data = JSON.parse(data);
                        console.log("偷狗粮:", data.errorCode, data.data);
                      }
                    );
                  }
                );
              }
              await $.wait(1500);
            }
            resolve();
          }
        );
      }
    );
  });
}

function requireConfig() {
  return new Promise((resolve) => {
    notify = $.isNode() ? require("./sendNotify") : "";
    //Node.js用户请在jdCookie.js处填写京东ck;
    const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
    //IOS等用户直接用NobyDa的jd cookie
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

function TotalBean() {
  return new Promise((resolve) => {
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

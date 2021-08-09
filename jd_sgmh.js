/*
闪购盲盒
长期活动，一人每天5次助力机会，10次被助机会，被助力一次获得一次抽奖机会，前几次必中京豆
修改自 @yangtingxiao 抽奖机脚本
活动入口：京东APP首页-闪购-闪购盲盒
网页地址：https://h5.m.jd.com/babelDiy/Zeus/3vzA7uGuWL2QeJ5UeecbbAVKXftQ/index.html
更新地址：https://gitee.com/lxk0301/jd_scripts/raw/master/jd_sgmh.js
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#闪购盲盒
20 8 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_sgmh.js, tag=闪购盲盒, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

================Loon==============
[Script]
cron "20 8 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_sgmh.js, tag=闪购盲盒

===============Surge=================
闪购盲盒 = type=cron,cronexp="20 8 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_sgmh.js

============小火箭=========
闪购盲盒 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_sgmh.js, cronexpr="20 8 * * *", timeout=3600, enable=true

 */
const jd_heplers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("闪购盲盒");
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let appId = "1EFRXxg",
  homeDataFunPrefix = "interact_template",
  collectScoreFunPrefix = "harmony",
  message = "";
let lotteryResultFunPrefix = homeDataFunPrefix,
  browseTime = 6;
const inviteCodes = [
  "T0206qwtB09HohePeUeryLJVCjVQmoaT5kRrbA@T026tv5zRxcY9lbXTxv2kfUIcLnkxACjVQmoaT5kRrbA@T0225KkcRR1MoQeCIE79naQJdACjVQmoaT5kRrbA@T0225KkcRh8f_AGBJkv1kKINdwCjVQmoaT5kRrbA@T0205KkcPnlwqyeBWGeN1ZJzCjVQmoaT5kRrbA@T0225KkcRhgf8lyDdR7xwP4JIACjVQmoaT5kRrbA@T010-b4vCEZcrACjVQmoaT5kRrbA@T0147awsGkdIvQ2JIwCjVQmoaT5kRrbA@T0205KkcAktviim9SWS3471KCjVQmoaT5kRrbA@T0225KkcRUsco1DXJhPwkvFbIACjVQmoaT5kRrbA@T0225KkcREgQpFDXdRj9waULcwCjVQmoaT5kRrbA@T0225KkcRkseoQCEJUv3xvFcdQCjVQmoaT5kRrbA@T0225KkcRUoY8AWDcR6hxfdYJgCjVQmoaT5kRrbA@T0087aF6Qx4YCjVQmoaT5kRrbA",
  "T0206qwtB09HohePeUeryLJVCjVQmoaT5kRrbA@T026tv5zRxcY9lbXTxv2kfUIcLnkxACjVQmoaT5kRrbA@T0225KkcRR1MoQeCIE79naQJdACjVQmoaT5kRrbA@T0225KkcRh8f_AGBJkv1kKINdwCjVQmoaT5kRrbA@T0205KkcPnlwqyeBWGeN1ZJzCjVQmoaT5kRrbA@T0225KkcRhgf8lyDdR7xwP4JIACjVQmoaT5kRrbA@T010-b4vCEZcrACjVQmoaT5kRrbA@T0147awsGkdIvQ2JIwCjVQmoaT5kRrbA@T0205KkcAktviim9SWS3471KCjVQmoaT5kRrbA@T0225KkcRUsco1DXJhPwkvFbIACjVQmoaT5kRrbA@T0225KkcREgQpFDXdRj9waULcwCjVQmoaT5kRrbA@T0225KkcRkseoQCEJUv3xvFcdQCjVQmoaT5kRrbA@T0225KkcRUoY8AWDcR6hxfdYJgCjVQmoaT5kRrbA@T0087aF6Qx4YCjVQmoaT5kRrbA",
];
const randomCount = 0;
const notify = $.isNode() ? require("./sendNotify") : "";
let merge = {};
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "";
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_heplers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}

const JD_API_HOST = `https://api.m.jd.com/client.action`;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/", { "open-url": "https://bean.m.jd.com/" });
    return;
  }
  await requireConfig();
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      $.beans = 0;
      message = "";
      await TotalBean();
      await shareCodesFormat();
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
      await interact_template_getHomeData();
      await showMsg();
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());
//获取活动信息
function interact_template_getHomeData(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html`,
          Host: `api.m.jd.com`,
          "Accept-Encoding": `gzip, deflate, br`,
          "Accept-Language": `zh-cn`,
        },
        body: `functionId=${homeDataFunPrefix}_getHomeData&body={"appId":"${appId}","taskToken":""}&client=wh5&clientVersion=1.0.0`,
      };

      $.post(url, async (err, resp, data) => {
        try {
          data = JSON.parse(data);
          if (data.data.bizCode !== 0) {
            console.log(data.data.bizMsg);
            return;
          }
          scorePerLottery = data.data.result.userInfo.scorePerLottery || data.data.result.userInfo.lotteryMinusScore;
          if (data.data.result.raiseInfo && data.data.result.raiseInfo.levelList) scorePerLottery = data.data.result.raiseInfo.levelList[data.data.result.raiseInfo.scoreLevel];
          //console.log(scorePerLottery)
          for (let i = 0; i < data.data.result.taskVos.length; i++) {
            console.log(
              "\n" +
                data.data.result.taskVos[i].taskType +
                "-" +
                data.data.result.taskVos[i].taskName +
                "-" +
                (data.data.result.taskVos[i].status === 1 ? `已完成${data.data.result.taskVos[i].times}-未完成${data.data.result.taskVos[i].maxTimes}` : "全部已完成")
            );
            //签到
            if (data.data.result.taskVos[i].taskName === "邀请好友助力") {
              console.log(`您的好友助力码为:${data.data.result.taskVos[i].assistTaskDetailVo.taskToken}`);
              for (let code of $.newShareCodes) {
                if (!code) continue;
                await harmony_collectScore(code, data.data.result.taskVos[i].taskId);
                await $.wait(2000);
              }
            } else if (data.data.result.taskVos[i].status === 3) {
              console.log("开始抽奖");
              await interact_template_getLotteryResult(data.data.result.taskVos[i].taskId);
            } else if ([0, 13].includes(data.data.result.taskVos[i].taskType)) {
              if (data.data.result.taskVos[i].status === 1) {
                await harmony_collectScore(data.data.result.taskVos[i].simpleRecordInfoVo.taskToken, data.data.result.taskVos[i].taskId);
              }
            } else if ([14, 6].includes(data.data.result.taskVos[i].taskType)) {
              //console.log(data.data.result.taskVos[i].assistTaskDetailVo.taskToken)
              for (let j = 0; j < (data.data.result.userInfo.lotteryNum || 0); j++) {
                if (appId === "1EFRTxQ") {
                  await ts_smashGoldenEggs();
                } else {
                  await interact_template_getLotteryResult(data.data.result.taskVos[i].taskId);
                }
              }
            }
            let list =
              data.data.result.taskVos[i].productInfoVos || data.data.result.taskVos[i].followShopVo || data.data.result.taskVos[i].shoppingActivityVos || data.data.result.taskVos[i].browseShopVo;
            for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
              for (let j in list) {
                if (list[j].status === 1) {
                  //console.log(list[j].simpleRecordInfoVo||list[j].assistTaskDetailVo)
                  console.log("\n" + (list[j].title || list[j].shopName || list[j].skuName));
                  //console.log(list[j].itemId)
                  if (list[j].itemId) {
                    await harmony_collectScore(list[j].taskToken, data.data.result.taskVos[i].taskId, list[j].itemId, 1);
                    if (k === data.data.result.taskVos[i].maxTimes - 1) await interact_template_getLotteryResult(data.data.result.taskVos[i].taskId);
                  } else {
                    await harmony_collectScore(list[j].taskToken, data.data.result.taskVos[i].taskId);
                  }
                  list[j].status = 2;
                  break;
                }
              }
            }
          }
          if (scorePerLottery) await interact_template_getLotteryResult();
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}
//做任务
function harmony_collectScore(taskToken, taskId, itemId = "", actionType = 0, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html`, //?inviteId=P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ?inviteId=${shareCode}
          Host: `api.m.jd.com`,
          "Accept-Encoding": `gzip, deflate, br`,
          "Accept-Language": `zh-cn`,
        },
        body: `functionId=${collectScoreFunPrefix}_collectScore&body={"appId":"${appId}","taskToken":"${taskToken}","taskId":${taskId}${
          itemId ? ',"itemId":"' + itemId + '"' : ""
        },"actionType":${actionType}&client=wh5&clientVersion=1.0.0`,
      };
      //console.log(url.body)
      //if (appId === "1EFRTxQ") url.body += "&appid=golden-egg"
      $.post(url, async (err, resp, data) => {
        try {
          data = JSON.parse(data);
          if (data.data.bizMsg === "任务领取成功") {
            await harmony_collectScore(taskToken, taskId, itemId, 0, parseInt(browseTime) * 1000);
          } else {
            console.log(data.data.bizMsg);
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}
//抽奖
function interact_template_getLotteryResult(taskId, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html?inviteId=P04z54XCjVXmYaW5m9cZ2f433tIlGBj3JnLHD0`, //?inviteId=P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ
          Host: `api.m.jd.com`,
          "Accept-Encoding": `gzip, deflate, br`,
          "Accept-Language": `zh-cn`,
        },
        body: `functionId=${lotteryResultFunPrefix}_getLotteryResult&body={"appId":"${appId}"${taskId ? ',"taskId":"' + taskId + '"' : ""}}&client=wh5&clientVersion=1.0.0`,
      };
      //console.log(url.body)
      //if (appId === "1EFRTxQ") url.body = `functionId=ts_getLottery&body={"appId":"${appId}"${taskId ? ',"taskId":"'+taskId+'"' : ''}}&client=wh5&clientVersion=1.0.0&appid=golden-egg`
      $.post(url, async (err, resp, data) => {
        try {
          if (!timeout) console.log("\n开始抽奖");
          data = JSON.parse(data);
          if (data.data.bizCode === 0) {
            if (data.data.result.userAwardsCacheDto.jBeanAwardVo) {
              console.log("京豆:" + data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity);
              $.beans += parseInt(data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity);
            }
            if (data.data.result.raiseInfo) scorePerLottery = parseInt(data.data.result.raiseInfo.nextLevelScore);
            if (parseInt(data.data.result.userScore) >= scorePerLottery && scorePerLottery) {
              await interact_template_getLotteryResult(1000);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}

//通知
function showMsg() {
  message += `任务已完成，本次运行获得京豆${$.beans}`;
  return new Promise((resolve) => {
    if ($.beans) $.msg($.name, "", `【京东账号${$.index}】${$.nickName}\n${message}`);
    $.log(`【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve();
  });
}

function requireConfig() {
  return new Promise(async (resolve) => {
    console.log(`开始获取${$.name}配置文件\n`);
    //Node.js用户请在jdCookie.js处填写京东ck;
    let shareCodes = [];
    console.log(`共${cookiesArr.length}个京东账号\n`);
    if ($.isNode() && process.env.JDSGMH_SHARECODES) {
      if (process.env.JDSGMH_SHARECODES.indexOf("\n") > -1) {
        shareCodes = process.env.JDSGMH_SHARECODES.split("\n");
      } else {
        shareCodes = process.env.JDSGMH_SHARECODES.split("&");
      }
    }
    $.shareCodesArr = [];
    if ($.isNode()) {
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
    const readShareCodeRes = await readShareCode();
    // console.log(readShareCodeRes)
    if (readShareCodeRes && readShareCodeRes.code === 200) {
      $.newShareCodes = [...new Set([...$.newShareCodes, ...(readShareCodeRes.data || [])])];
    }
    console.log(`第${$.index}个京东账号将要助力的好友${JSON.stringify($.newShareCodes)}`);
    resolve();
  });
}

function readShareCode() {
  console.log(`开始`);
  return new Promise(async (resolve) => {
    $.get(
      {
        url: `http://jd.turinglabs.net/api/v2/jd/sgmh/read/${randomCount}/`,
        timeout: 10000,
      },
      (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} API请求失败，请检查网路重试`);
          } else {
            if (data) {
              console.log(`随机取${randomCount}个码放到您固定的互助码后面(不影响已有固定互助)`);
              data = JSON.parse(data);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      }
    );
    await $.wait(2000);
    resolve();
  });
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
            : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"
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
              $.nickName = data["base"].nickname;
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

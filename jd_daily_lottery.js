/*
小鸽有礼 - 每日抽奖
活动入口：京东首页搜索 边玩边赚
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
===================quantumultx================
[task_local]
#每日抽奖
13 1,22,23 * * * jd_daily_lottery.js, tag=每日抽奖, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
=====================Loon================
[Script]
cron "13 1,22,23 * * *" script-path=jd_daily_lottery.js, tag=每日抽奖
====================Surge================
每日抽奖 = type=cron,cronexp="13 1,22,23 * * *",wake-system=1,timeout=3600,script-path=jd_daily_lottery.js
============小火箭=========
每日抽奖 = type=cron,script-path=jd_daily_lottery.js, cronexpr="13 1,22,23 * * *", timeout=3600, enable=true
*/
const $ = new Env("小鸽有礼-每日抽奖");
const notify = $.isNode() ? require("./sendNotify") : "";
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let activityType = "";
let activityCode = "";
const activityInfoList = [
  {
    activityType: "WonderfulLuckDrawApi",
    activityCode: "1410048365793640448",
    title: "小哥有礼",
  },
  {
    activityType: "luckdraw",
    activityCode: "1407251415377641472",
    title: "每日转盘",
  },
];
$.helpCodeList = [];
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "";
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
    ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie),
  ].filter((item) => !!item);
}
let allMessage = "";
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
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(
        cookie.match(/pt_pin=([^; ]+)(?=;?)/) &&
          cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
      );
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      await TotalBean();
      console.log(
        `\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`
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

      for (let j = 0; j < activityInfoList.length; j++) {
        activityType = activityInfoList[j].activityType;
        activityCode = activityInfoList[j].activityCode;
        console.log(`=============${activityInfoList[j].title}=============`);
        await dailyLottery();
      }
    }
  }
  // console.log(`\=============每日抽奖互助=============`)
  // activityType = activityInfoList[1].activityType;
  // activityCode = activityInfoList[1].activityCode;
  // for (let i = 0; i < $.helpCodeList.length && cookiesArr.length > 0; i++) {
  //   if ($.helpCodeList[i].needHelp === 0) {
  //     continue;
  //   }
  //   for (let j = 0; j < cookiesArr.length && $.helpCodeList[i].needHelp !== 0; j++) {
  //     $.helpFlag = '';
  //     cookie = cookiesArr[j];
  //     $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
  //     if ($.helpCodeList[i].use === $.UserName) {
  //       continue;
  //     }
  //     console.log(`${$.UserName}助力:${$.helpCodeList[i].helpCpde}`);
  //     $.oneCode = $.helpCodeList[i].helpCpde;
  //     //await helpFriend($.helpCodeList[i].helpCpde);
  //     await takePosttRequest('helpFriend');
  //     if ($.helpFlag === true) {
  //       $.helpCodeList[i].needHelp -= 1;
  //     }
  //     cookiesArr.splice(j, 1);
  //     j--;
  //   }
  // }
  if (allMessage) {
    notify.sendNotify("小哥有礼-每日抽奖", allMessage);
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

async function dailyLottery() {
  $.lotteryInfo = {};
  $.missionList = [];
  await Promise.all([
    takePosttRequest("queryActivityBaseInfo"),
    takePosttRequest("queryMissionList"),
  ]);
  console.log(`初始化`);
  if ($.lotteryInfo.success !== true) {
    console.log(`${$.UserName}数据异常，执行失败`);
    return;
  }
  if ($.missionList.length === 0) {
    console.log(`${$.UserName}获取任务列表失败`);
    return;
  }
  $.runTime = 0;
  do {
    $.runFlag = false;
    await doMission(); //做任务
    await collectionTimes(); //领任务奖励
    $.runTime++;
  } while ($.runFlag && $.runTime < 30);
  let drawNum = $.lotteryInfo.content.drawNum || 0;
  console.log(`共有${drawNum}次抽奖机会`);
  for (let i = 0; i < drawNum; i++) {
    $.drawNumber = i + 1;
    await $.wait(1000);
    //执行抽奖
    await takePosttRequest("draw");
  }
  await $.wait(1000);
  //奖励列表
  await takePosttRequest("queryWinFlowList");
}

async function takePosttRequest(functionId) {
  let myRequest = ``;
  let body = ``;
  switch (functionId) {
    case "queryActivityBaseInfo":
    case "queryMissionList":
    case "draw":
    case "queryWinFlowList":
    case "createInvitation":
      body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}"}]`;
      break;
    case "completeMission":
      if ($.oneMission.params) {
        body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}","missionNo":"${
          $.oneMission.missionNo
        }","params":${JSON.stringify($.oneMission.params)}}]`;
      } else {
        body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}","missionNo":"${$.oneMission.missionNo}"}]`;
      }
      break;
    case "getDrawChance":
      body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}","getCode":"${$.oneRewardNos}"}]`;
      break;
    case "helpFriend":
      body = `[{"userNo":"$cooMrdGatewayUid$","missionNo":"${$.oneCode}"}]`;
      break;
    default:
      console.log(`错误${functionId}`);
  }
  myRequest = getPostRequest(functionId, body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        dealReturn(functionId, data);
      } catch (e) {
        console.log(data);
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function dealReturn(functionId, data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log(`解析错误:${data}`);
    return;
  }
  switch (functionId) {
    case "queryActivityBaseInfo":
      $.lotteryInfo = data;
      break;
    case "queryMissionList":
      if (data.success === true) {
        $.missionList = data.content.missionList;
      }
      break;
    case "completeMission":
      if (data.success === true) {
        console.log(`${$.oneMission.title}，任务执行成功`);
        $.runFlag = true;
      } else {
        console.log(JSON.stringify(data));
        console.log(`${$.oneMission.title}，任务执行失败`);
      }
      break;
    case "getDrawChance":
      if (data.success === true) {
        console.log(`${$.oneMission.title}，领取任务奖励成功`);
      } else {
        console.log(JSON.stringify(data));
        console.log(`${$.oneMission.title}，领取任务执行失败`);
      }
      break;
    case "draw":
      if (data.success === true) {
        console.log(
          `${$.name}第${$.drawNumber}次抽奖，获得：${
            data.content.rewardDTO.title || " "
          }`
        );
      } else {
        console.log(`${$.name}第${$.drawNumber}次抽奖失败`);
      }
      break;
    case "queryWinFlowList":
      if (data.success === true) {
        let contentList = data.content;
        let bean = 0;
        for (let i = 0; i < contentList.length; i++) {
          if (
            contentList[i].type === -2 || //快递券
            contentList[i].type === 4 || //维修券
            contentList[i].type === 3 || //郎酒满减券
            contentList[i].type === 2 || //满减券
            contentList[i].type === 31 //卡片
          ) {
          } else if (contentList[i].type === 102) {
            bean += 2;
          } else {
            console.log(contentList[i].name);
            allMessage += `第${$.index}个账号，${$.UserName},获得:${contentList[i].name}\n`;
          }
        }
        console.log(`获得京豆总计${bean}`);
      } else {
        console.log(`获取奖品列表失败`);
      }
      break;
    case "createInvitation":
      if (data.success === true) {
        $.helpCodeList.push({
          use: $.UserName,
          helpCpde: data.data,
          needHelp: missionInfo["totalNum"] - missionInfo["completeNum"],
        });
        console.log(`互助码(内部多账号自己互助)：${data.data}`);
      }
      break;
    case "helpFriend":
      console.log(`助力结果:${JSON.stringify(data)}`);
      if (data.success === true && data.content === true) {
        console.log(`助力成功`);
        $.helpFlag = true;
      } else {
        $.helpFlag = false;
      }
      break;
    default:
      console.log(JSON.stringify(data));
  }
}

//做任务
async function doMission() {
  let flag = false; //是否执行过任务
  for (let i = 0; i < $.missionList.length; i++) {
    if ($.missionList[i].status !== 1) {
      continue;
    }
    if (
      $.missionList[i].jumpType === 135 ||
      $.missionList[i].jumpType === 136 ||
      $.missionList[i].jumpType === 137 ||
      $.missionList[i].jumpType === 45 ||
      $.missionList[i].jumpType === 31
    ) {
      $.oneMission = $.missionList[i];
      console.log(
        `开始执行任务:${$.oneMission.title}  ${$.oneMission.desc || ""}`
      );
      await takePosttRequest("completeMission");
      await $.wait(1000);
      flag = true;
    } else if ($.missionList[i].jumpType === 1) {
      await takePosttRequest("createInvitation");
      await $.wait(1000);
    }
  }
  if (flag) {
    await $.wait(1000);
    await Promise.all([
      takePosttRequest("queryActivityBaseInfo"),
      takePosttRequest("queryMissionList"),
    ]);
    await $.wait(1000);
  }
}

//领任务奖励
async function collectionTimes() {
  let flag = false;
  for (let i = 0; i < $.missionList.length; i++) {
    if ($.missionList[i].status === 11) {
      $.oneMission = $.missionList[i];
      console.log(`领取奖励:${$.oneMission.title}  ${$.oneMission.desc || ""}`);
      let getRewardNos = $.oneMission.getRewardNos;
      for (let j = 0; j < getRewardNos.length; j++) {
        $.oneRewardNos = getRewardNos[j];
        await takePosttRequest("getDrawChance");
        await $.wait(1000);
        flag = true;
      }
    }
  }
  if (flag) {
    await $.wait(1000);
    await Promise.all([
      takePosttRequest("queryActivityBaseInfo"),
      takePosttRequest("queryMissionList"),
    ]);
    await $.wait(1000);
  }
}

function getPostRequest(functionId, body) {
  const url = `https://lop-proxy.jd.com/${activityType}/${functionId}`;
  const method = `POST`;
  const headers = {
    "Accept-Encoding": `gzip, deflate, br`,
    Host: `lop-proxy.jd.com`,
    Origin: `https://jingcai-h5.jd.com`,
    Connection: `keep-alive`,
    "biz-type": `service-monitor`,
    "Accept-Language": `zh-cn`,
    version: `1.0.0`,
    "Content-Type": `application/json;charset=utf-8`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0",
    Referer: `https://jingcai-h5.jd.com`,
    ClientInfo: `{"appName":"jingcai","client":"m"}`,
    access: `H5`,
    Accept: `application/json, text/plain, */*`,
    "jexpress-report-time": `${new Date().getTime()}`,
    "source-client": `2`,
    "X-Requested-With": `XMLHttpRequest`,
    Cookie: cookie,
    "LOP-DN": `jingcai.jd.com`,
    AppParams: `{"appid":158,"ticket_type":"m"}`,
    "app-key": `jexpress`,
  };
  return { url: url, method: method, headers: headers, body: body };
}
function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: "https://wq.jd.com/user_new/info/GetJDUserInfoUnion?sceneval=2",
      headers: {
        Host: "wq.jd.com",
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
            if (data["retcode"] === 1001) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (
              data["retcode"] === 0 &&
              data.data &&
              data.data.hasOwnProperty("userInfo")
            ) {
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


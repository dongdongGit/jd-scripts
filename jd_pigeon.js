/*
活动：京小鸽吾悦寄
活动路径：边玩边赚-》京小鸽吾悦寄
很小的几率能抽到实物。
*/
const jd_heplers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("京小鸽吾悦寄");
const notify = $.isNode() ? require("./sendNotify") : "";
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
$.helpCodeList = {};
$.sendCardList = [];
$.message = "";
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "";
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  let cookiesData = $.getdata("CookiesJD") || "[]";
  cookiesData = jd_heplers.jsonParse(cookiesData);
  cookiesArr = cookiesData.map((item) => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata("CookieJD2"), $.getdata("CookieJD")]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter((item) => item !== "" && item !== null && item !== undefined);
}

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", {
      "open-url": "https://bean.m.jd.com/bean/signIndex.action",
    });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.thisHelpCode = {};
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = $.UserName;
      await TotalBean();
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
      await jxg();
    }
  }
  if ($.message) {
    await notify.sendNotify(`京小鸽吾悦寄`, $.message);
  }
  if ($.sendCardList.length > 0) {
    $.sendCardList = $.sendCardList.sort(randomsort);
    console.log(`\nsendCode开始领取赠送卡片`);
    $.sendCode = $.sendCardList.shift();
    for (let i = 0; i < cookiesArr.length / 2; i++) {
      $.getCodeFlag = true;
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      if ($.sendCode) {
        do {
          await transferBoxCard($.sendCode);
        } while ($.getCodeFlag && $.sendCode);
      }
    }
  }
  console.log(`\n\n开始账号内互助`);
  let newCookiesArr = [];
  for (let i = 0; i < cookiesArr.length; i += 4) {
    newCookiesArr.push(cookiesArr.slice(i, i + 4));
  }
  for (let i = 0; i < newCookiesArr.length; i++) {
    let thisCookiesArr = newCookiesArr[i];
    let codeList = [];
    for (let j = 0; j < thisCookiesArr.length; j++) {
      cookie = thisCookiesArr[j];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      codeList.push({
        name: $.UserName,
        helpCode: $.helpCodeList[$.UserName],
      });
    }
    for (let j = 0; j < thisCookiesArr.length; j++) {
      cookie = thisCookiesArr[j];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      for (let k = 0; k < codeList.length; k++) {
        if (codeList[k].name === $.UserName) {
          continue;
        } else {
          console.log(`${$.UserName}助力：${codeList[k].helpCode}`);
          await helpFriend(codeList[k].helpCode);
          await $.wait(2000);
        }
      }
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

async function jxg() {
  $.userInfo = {};
  $.cardList = [];
  $.missionList = [];
  $.shareCode = "";
  console.log(`初始化`);
  await Promise.all([getBoxUserRewardWinners(), getCardInfo(), getQueryRuleInfo(), getNewShare()]);
  if ($.userInfo.code !== 1 || $.userInfo.success !== true) {
    console.log(`获取用户信息失败`);
    return;
  }
  if ($.missionList.length === 0) {
    console.log(`获取任务列表失败`);
  } else {
    await $.wait(2000);
    await doMission(); //做任务
  }
  await getCardInfo();
  await $.wait(2000);
  $.synthesisType = true;
  for (let i = 0; i < $.cardList.length && i < 7; i++) {
    if ($.cardList[i].num === 0) {
      $.synthesisType = false;
    }
  }
  if ($.synthesisType) {
    console.log("开始合成卡片");
    await synthesize();
    await $.wait(3000);
    console.log("抽奖");
    await getBigReward();
  } else {
    console.log("卡片不足，不能合成");
  }
  if ($.index > cookiesArr.length - cookiesArr.length / 3) {
    console.log("开始赠送卡片");
    for (let i = 0; i < $.cardList.length; i++) {
      if ($.cardList[i].num > 0) {
        //获取卡片详情
        $.cardDetailList = [];
        await getCardDetail($.cardList[i].type);
        await $.wait(1000);
        if ($.cardDetailList.length > 0) {
          await sendBoxCard($.cardDetailList[0].card.userCardId);
        }
      }
    }
  }
  await $.wait(1000);
  await getFlowList();
}

function randomsort(a, b) {
  return Math.random() > 0.5 ? -1 : 1;
  //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
}

async function getFlowList() {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityNo":""}]`;
  const myRequest = getPostRequest("MangHeApi/getFlowList", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        let winFlowDTOList = data.content.winFlowDTOList;
        for (let i = 0; i < winFlowDTOList.length; i++) {
          if (
            winFlowDTOList[i].type === -2 || //快递券
            winFlowDTOList[i].type === -3 //满减券
          ) {
            continue;
          } else if (winFlowDTOList[i].type === 41) {
            if (winFlowDTOList[i].hasAddress !== 1) {
              $.message += `第${$.index}个账号，${$.UserName},获得实物:${winFlowDTOList[i].name}\n`;
            }
            console.log(JSON.stringify(winFlowDTOList[i]));
          } else {
            console.log(JSON.stringify(winFlowDTOList[i]));
            $.message += `第${$.index}个账号，${$.UserName},获得:${winFlowDTOList[i].name}\n`;
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

//领取
async function transferBoxCard(cordId) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","flowNo":"${cordId}"}]`;
  const myRequest = getPostRequest("MangHeApi/transferBoxCard", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data?.error_response?.code == 2) {
          $.getCodeFlag = false;
          console.log(`接口调用失败，${data?.error_response?.zh_desc}`);
        }
        if (data.success === true && data.code === 1) {
          console.log(`${$.UserName}领取卡片成功，获得${data.content.card.name || "未知"}`);
          $.sendCode = $.sendCardList.shift();
        } else if (data.success === false && data.code === -1004) {
          $.getCodeFlag = false;
          console.log(`${$.UserName}领取失败，${data.errorMsg}`);
        }
      } catch (e) {
        $.getCodeFlag = false;
        $.sendCode = "";
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//赠送卡片
async function sendBoxCard(userCardId) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","sendType":1,"cardId":${userCardId}}]`;
  const myRequest = getPostRequest("MangHeApi/sendBoxCard", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true && data.code === 1) {
          console.log(`卡片赠送成功，赠送ID：${data.content}`);
          $.sendCardList.push(data.content);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//获取卡片详情
async function getCardDetail(type) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","cardType":${type}}]`;
  const myRequest = getPostRequest("MangHeApi/getCardDetail", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true && data.code === 1) {
          $.cardDetailList = data.content;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//抽奖
async function getBigReward() {
  const body = `[{"userNo":"$cooMrdGatewayUid$"}]`;
  const myRequest = getPostRequest("MangHeApi/getBigReward", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        console.log(data);
        data = JSON.parse(data);
        if (data.success === true && data.code === 1) {
          if (data && data.content && data.content.rewardDTO) {
            console.log(`抽奖成功，获得：${data.content.rewardDTO.title || "未知内容"}`);
            //$.message += `第${$.index}个${$.UserName}获得${data.content.rewardDTO.title || '未知内容'}\n`
          } else {
            console.log(`抽奖成功，获得：未知内容,${JSON.stringify(data)}`);
            //$.message += `第${$.index}个${$.UserName}获得未知内容，${JSON.stringify(data)}\n`
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

//合成
async function synthesize() {
  const body = `[{"userNo":"$cooMrdGatewayUid$"}]`;
  const myRequest = getPostRequest("MangHeApi/synthesize", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true && data.code === 1) {
          console.log(`合成成功`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//做任务
async function doMission() {
  let flag = false;
  console.log(`开始执行任务`);
  for (let i = 0; i < $.missionList.length; i++) {
    $.missionName = $.missionList[i].name;
    if ($.missionList[i].status === 1 && $.missionList[i].jumpType === 31) {
      await $.wait(3000);
      //签到
      await signIn();
      await $.wait(1000);
      flag = true;
    } else if ($.missionList[i].status === 1 && $.missionList[i].jumpType === 41) {
      await $.wait(3000);
      //访问精彩
      await setUserHasView();
      flag = true;
    }
  }
  if (flag) {
    await getQueryRuleInfo();
  }
  for (let i = 0; i < $.missionList.length; i++) {
    $.missionName = $.missionList[i].name;
    //领取卡片
    if ($.missionList[i].status === 11 && $.missionList[i].getRewardNos.length > 0) {
      for (let j = 0; j < $.missionList[i].getRewardNos.length; j++) {
        await getCard($.missionList[i].getRewardNos[j]);
        await $.wait(3000);
      }
    }
  }
  console.log(`执行任务结束`);
}

async function getCard(code) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","getCode":"${code}"}]`;
  const myRequest = getPostRequest("MangHeApi/getCard", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true && data.code === 1) {
          console.log(`完成任务${$.missionName},获得卡片：${data.content.card.name}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function setUserHasView() {
  const body = `[{"userNo":"$cooMrdGatewayUid$"}]`;
  const myRequest = getPostRequest("mangHeApi/setUserHasView", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true && data.code === 1) {
          console.log(`执行任务：${$.missionName},成功`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//签到
async function signIn() {
  const body = `[{"userNo":"$cooMrdGatewayUid$"}]`;
  const myRequest = getPostRequest("mangHeApi/signIn", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true && data.code === 1) {
          console.log(`执行任务：${$.missionName},成功`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//获取互助码
async function getNewShare() {
  const body = `[{"userNo":"$cooMrdGatewayUid$"}]`;
  const myRequest = getPostRequest("MangHeApi/newShare", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true) {
          $.helpCodeList[$.UserName] = data.content;
          console.log(`互助码：${data.content}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//获取任务列表
async function getQueryRuleInfo() {
  const body = `[{"userNo":"$cooMrdGatewayUid$"}]`;
  const myRequest = getPostRequest("MangHeApi/queryRuleInfo", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true) {
          $.missionList = data.content;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function getCardInfo() {
  const body = `[{"userNo":"$cooMrdGatewayUid$"}]`;
  const myRequest = getPostRequest("MangHeApi/getCardInfo", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true && data.code === 1) {
          $.cardList = data.content.cardInfos;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//获取用户信息
async function getBoxUserRewardWinners() {
  const body = `[{"userNo":"$cooMrdGatewayUid$"}]`;
  const myRequest = getPostRequest("MangHeApi/boxUserRewardWinners", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (data) {
          $.userInfo = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//助力
async function helpFriend(helpCode) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","missionNo":"${helpCode}"}]`;
  const myRequest = getPostRequest("MangHeApi/helpFriend", body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        /*
         * {"code":1,"content":true,"data":true,"errorMsg":"SUCCESS","msg":"SUCCESS","success":true}
         * */
        console.log(`助力结果:${data}`);
        data = JSON.parse(data);
        if (data.success === true && data.content === true) {
          console.log(`助力成功`);
          $.helpFlag = true;
        } else {
          $.helpFlag = false;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function getPostRequest(type, body) {
  const url = `https://lop-proxy.jd.com/${type}`;
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
  return {
    url: url,
    method: method,
    headers: headers,
    body: body,
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
            //$.nickName = data['base'].nickname;
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

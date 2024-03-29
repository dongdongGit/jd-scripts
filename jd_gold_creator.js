/*
金榜创造营
活动入口：https://h5.m.jd.com/babelDiy/Zeus/2H5Ng86mUJLXToEo57qWkJkjFPxw/index.html
13 5 * * * jd_gold_creator.js, tag=金榜创造营, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('金榜创造营');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  message;

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false")
    console.log = () => {};
  if (JSON.stringify(process.env).indexOf("GITHUB") > -1) process.exit(0);
} else {
  cookiesArr = [
    $.getdata("CookieJD"),
    $.getdata("CookieJD2"),
    ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie),
  ].filter((item) => !!item);
}
const JD_API_HOST = "https://api.m.jd.com/client.action";

!(async () => {
  if (!cookiesArr[0]) {
    $.msg(
      $.name,
      "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取",
      "https://bean.m.jd.com/",
      { "open-url": "https://bean.m.jd.com/" }
    );
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(
        cookie.match(/pt_pin=([^; ]+)(?=;?)/) &&
          cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
      );
      $.index = i + 1;
      $.isLogin = true;
      $.beans = 0;
      $.nickName = "";
      message = "";
      await $.totalBean();
      console.log(
        `\n******开始【京东账号${$.index}】${
          $.nickName || $.UserName
        }*********\n`
      );
      if (!$.isLogin) {
        $.msg(
          $.name,
          `【提示】cookie已失效`,
          `京东账号${$.index} ${
            $.nickName || $.UserName
          }\n请重新登录获取\nhttps://bean.m.jd.com/`,
          { "open-url": "https://bean.m.jd.com/" }
        );

        if ($.isNode()) {
          await notify.sendNotify(
            `${$.name}cookie已失效 - ${$.UserName}`,
            `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`
          );
        } else {
          $.setdata("", `CookieJD${i ? i + 1 : ""}`); //cookie失效，故清空cookie。$.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        }
        continue;
      }
      await main();
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });
async function main() {
  try {
    await goldCreatorTab(); //获取顶部主题
    await $.wait(1000);
    await getDetail();
    await $.wait(500);
    await goldCreatorPublish();
    await $.wait(500);
    await showMsg();
  } catch (e) {
    $.logErr(e);
  }
}
function showMsg() {
  return new Promise((resolve) => {
    if ($.beans) {
      message += `本次运行获得${$.beans}京豆`;
      $.msg(
        $.name,
        "",
        `【京东账号${$.index}】${$.UserName || $.nickName}\n${message}`
      );
    }
    resolve();
  });
}
async function getDetail() {
  $.subTitleInfos = $.subTitleInfos.filter(
    (vo) => !!vo && vo["hasVoted"] === "0"
  );
  for (let item of $.subTitleInfos) {
    console.log(`\n开始给【${item["longTitle"]}】主题下的商品进行投票`);
    await goldCreatorDetail(
      item["matGrpId"],
      item["subTitleId"],
      item["taskId"],
      item["batchId"]
    );
    await $.wait(2000);
  }
}
function goldCreatorTab() {
  $.subTitleInfos = [];
  return new Promise((resolve) => {
    const body = { subTitleId: "", isPrivateVote: "0" };
    const options = taskUrl("goldCreatorTab", body);
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(
            `${$.name} goldCreatorDetail API请求失败，请检查网路重试`
          );
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === "0") {
              $.subTitleInfos = data.result.subTitleInfos || [];
              let unVoted = $.subTitleInfos.length;
              console.log(`共有${$.subTitleInfos.length}个主题`);
              $.stageId = data.result.mainTitleHeadInfo.stageId;
              $.advGrpId = data.result.mainTitleHeadInfo.advGrpId;
              await goldCreatorDetail(
                $.subTitleInfos[0]["matGrpId"],
                $.subTitleInfos[0]["subTitleId"],
                $.subTitleInfos[0]["taskId"],
                $.subTitleInfos[0]["batchId"],
                true
              );
              $.subTitleInfos = $.subTitleInfos.filter(
                (vo) => !!vo && vo["hasVoted"] === "0"
              );
              console.log(`已投票${unVoted - $.subTitleInfos.length}主题\n`);
            } else {
              console.log(`goldCreatorTab 异常：${JSON.stringify(data)}`);
            }
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
//获取每个主题下面待投票的商品
function goldCreatorDetail(groupId, subTitleId, taskId, batchId, flag = false) {
  $.skuList = [];
  $.taskList = [];
  $.remainVotes = 0;
  return new Promise((resolve) => {
    const body = {
      groupId,
      stageId: $.stageId,
      subTitleId,
      batchId,
      skuId: "",
      taskId: Number(taskId),
    };
    const options = taskUrl("goldCreatorDetail", body);
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(
            `${$.name} goldCreatorDetail API请求失败，请检查网路重试`
          );
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === "0") {
              $.remainVotes = data.result.remainVotes || 0;
              $.skuList = data.result.skuList || [];
              $.taskList = data.result.taskList || [];
              $.signTask = data.result.signTask;
              if (flag) {
                await doTask2(batchId);
              } else {
                console.log(`当前剩余投票次数：${$.remainVotes}`);
                await doTask(subTitleId, taskId, batchId);
              }
            } else {
              console.log(`goldCreatorDetail 异常：${JSON.stringify(data)}`);
            }
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
async function doTask(subTitleId, taskId, batchId) {
  $.skuList = $.skuList.filter((vo) => !!vo && vo["isVoted"] === 0);
  let randIndex = Math.floor(Math.random() * $.skuList.length);
  console.log(`给 【${$.skuList[randIndex]["name"]}】 商品投票`);
  const body = {
    stageId: $.stageId,
    subTitleId,
    skuId: $.skuList[randIndex]["skuId"],
    taskId: Number(taskId),
    itemId: "1",
    rankId: $.skuList[randIndex]["rankId"],
    type: 1,
    batchId,
    version: "2",
  };
  await goldCreatorDoTask(body);
}
async function doTask2(batchId) {
  for (let task of $.taskList) {
    task = task.filter((vo) => !!vo && vo["taskStatus"] === 1);
    for (let item of task) {
      console.log(`\n做额外任务：${item["taskName"]}`);
      const body = {
        taskId: item["taskId"],
        itemId: item["taskItemInfo"]["itemId"],
        type: item["taskType"],
        batchId,
        version: "2",
      };
      if (item["taskType"] === 1) {
        body["type"] = 2;
      }
      await goldCreatorDoTask(body);
      await $.wait(2000);
    }
  }
  if ($.signTask["taskStatus"] === 1) {
    const body = {
      taskId: $.signTask["taskId"],
      itemId: $.signTask["taskItemInfo"]["itemId"],
      type: $.signTask["taskType"],
      batchId,
    };
    await goldCreatorDoTask(body);
  }
}
function goldCreatorDoTask(body) {
  return new Promise((resolve) => {
    const options = taskUrl("goldCreatorDoTask", body);
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(
            `${$.name} goldCreatorDetail API请求失败，请检查网路重试`
          );
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === "0") {
              if (data.result.taskCode === "0") {
                console.log(`成功，获得 ${data.result.lotteryScore}京豆`);
                if (data.result.lotteryScore)
                  $.beans += parseInt(data.result.lotteryScore);
              } else {
                console.log(`失败：${data.result["taskMsg"]}\n`);
              }
            } else {
              console.log(`失败：${JSON.stringify(data)}\n`);
            }
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
function goldCreatorPublish() {
  return new Promise((resolve) => {
    $.get(taskUrl("goldCreatorPublish"), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(
            `${$.name} goldCreatorPublish API请求失败，请检查网路重试`
          );
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === "0") {
              if (data.result.subCode === "0") {
                console.log(
                  data.result.lotteryResult.lotteryCode === "0"
                    ? `揭榜成功：获得${data.result.lotteryResult.lotteryScore}京豆`
                    : `揭榜成功：获得空气~`
                );
              }
            } else {
              console.log(`揭榜失败：${JSON.stringify(data)}`);
            }
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
function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(
      JSON.stringify(body)
    )}&appid=content_ecology&clientVersion=11.3.0&client=wh5&jsonp=`,
    headers: {
      Host: "api.m.jd.com",
      Referer: "https://h5.m.jd.com/",
      Cookie: cookie,
      "User-Agent": $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require("./USER_AGENTS").USER_AGENT
        : $.getdata("JDUA")
        ? $.getdata("JDUA")
        : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    },
  };
}

/*
特务Z
cron 23 8,9 5 8 *
要跑2次
*/
const $ = new Env("特务Z");
const notify = $.isNode() ? require("./sendNotify") : "";
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let cookiesArr = [];
let UA = ``;
$.allInvite = [];
let useInfo = {};
$.helpEncryptAssignmentId = "";
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    UA = `jdapp;iPhone;10.0.8;14.6;${randomWord(
      false,
      40,
      40
    )};network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214222493;appBuild/168841;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16E158;supportJDSHWK/1`;
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = "";
    await TotalBean();
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        "open-url": "https://bean.m.jd.com/bean/signIndex.action",
      });

      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue;
    }
    try {
      await main();
    } catch (e) {
      console.log(JSON.stringify(e));
    }
    await $.wait(1000);
  }
  if ($.allInvite.length > 0) {
    console.log(`\n开始脚本内互助\n`);
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookiesArr[i];
    $.canHelp = true;
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.encryptProjectId = useInfo[$.nickName];
    for (let j = 0; j < $.allInvite.length && $.canHelp; j++) {
      $.codeInfo = $.allInvite[j];
      $.code = $.codeInfo.code;
      if ($.UserName === $.codeInfo.userName || $.codeInfo.time === 3) {
        continue;
      }
      console.log(`${$.UserName},去助力:${$.code}`);
      await takeRequest("help");
      await $.wait(2000);
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
  $.runFlag = false;
  $.activityInfo = {};
  await takeRequest("superBrandSecondFloorMainPage");
  if (JSON.stringify($.activityInfo) === "{}") {
    console.log(`获取活动详情失败`);
    return;
  }
  console.log(`获取活动详情成功`);
  $.activityId = $.activityInfo.activityBaseInfo.activityId;
  $.activityName = $.activityInfo.activityBaseInfo.activityName;
  $.callNumber = $.activityInfo.activityUserInfo.userStarNum;
  console.log(`当前活动:${$.activityName},ID：${$.activityId},可抽奖次数:${$.callNumber}`);
  $.encryptProjectId = $.activityInfo.activityBaseInfo.encryptProjectId;
  useInfo[$.nickName] = $.encryptProjectId;
  await $.wait(2000);
  $.taskList = [];
  await takeRequest("superBrandTaskList");
  await $.wait(2000);
  await doTask();
  if ($.runFlag) {
    await takeRequest("superBrandSecondFloorMainPage");
    $.callNumber = $.activityInfo.activityUserInfo.userStarNum;
    console.log(`可抽奖次数:${$.callNumber}`);
  }
  for (let i = 0; i < $.callNumber; i++) {
    console.log(`进行抽奖`);
    await takeRequest("superBrandTaskLottery"); //抽奖
    await $.wait(2000);
  }
}
async function doTask() {
  for (let i = 0; i < $.taskList.length; i++) {
    $.oneTask = $.taskList[i];
    if ($.oneTask.completionFlag) {
      console.log(`任务：${$.oneTask.assignmentName}，已完成`);
      continue;
    }
    if ($.oneTask.assignmentType === 3 || $.oneTask.assignmentType === 0) {
      console.log(`任务：${$.oneTask.assignmentName}，去执行`);
      if ($.oneTask.ext && $.oneTask.ext.followShop && $.oneTask.ext.followShop[0]) {
        $.runInfo = $.oneTask.ext.followShop[0];
      } else {
        $.runInfo = { itemId: null };
      }
      await takeRequest("superBrandDoTask");
      await $.wait(2000);
      $.runFlag = true;
    } else if ($.oneTask.assignmentType === 2) {
      console.log(`助力码：${$.oneTask.ext.assistTaskDetail.itemId}`);
      $.allInvite.push({
        userName: $.UserName,
        code: $.oneTask.ext.assistTaskDetail.itemId,
        time: 0,
        max: true,
      });
      $.helpEncryptAssignmentId = $.oneTask.encryptAssignmentId;
    }
  }
}

async function takeRequest(type) {
  let url = ``;
  let myRequest = ``;
  switch (type) {
    case "superBrandSecondFloorMainPage":
      url = `https://api.m.jd.com/api?functionId=superBrandSecondFloorMainPage&appid=ProductZ4Brand&client=wh5&t=${Date.now()}&body=%7B%22source%22:%22secondfloor%22%7D`;
      break;
    case "superBrandTaskList":
      url = `https://api.m.jd.com/api?functionId=superBrandTaskList&appid=ProductZ4Brand&client=wh5&t=${Date.now()}&body=%7B%22source%22:%22secondfloor%22,%22activityId%22:${
        $.activityId
      },%22assistInfoFlag%22:1%7D`;
      break;
    case "superBrandDoTask":
      if ($.runInfo.itemId === null) {
        url = `https://api.m.jd.com/api?functionId=superBrandDoTask&appid=ProductZ4Brand&client=wh5&t=${Date.now()}&body=%7B%22source%22:%22secondfloor%22,%22activityId%22:${
          $.activityId
        },%22encryptProjectId%22:%22${$.encryptProjectId}%22,%22encryptAssignmentId%22:%22${$.oneTask.encryptAssignmentId}%22,%22assignmentType%22:${
          $.oneTask.assignmentType
        },%22completionFlag%22:1,%22itemId%22:%22${$.runInfo.itemId}%22,%22actionType%22:0%7D`;
      } else {
        url = `https://api.m.jd.com/api?functionId=superBrandDoTask&appid=ProductZ4Brand&client=wh5&t=${Date.now()}&body=%7B%22source%22:%22secondfloor%22,%22activityId%22:${
          $.activityId
        },%22encryptProjectId%22:%22${$.encryptProjectId}%22,%22encryptAssignmentId%22:%22${$.oneTask.encryptAssignmentId}%22,%22assignmentType%22:${$.oneTask.assignmentType},%22itemId%22:%22${
          $.runInfo.itemId
        }%22,%22actionType%22:0%7D`;
      }
      break;
    case "superBrandTaskLottery":
      url = `https://api.m.jd.com/api?functionId=superBrandTaskLottery&appid=ProductZ4Brand&client=wh5&t=${Date.now()}&body=%7B%22source%22:%22secondfloor%22,%22activityId%22:${$.activityId}%7D`;
      break;
    case "help":
      url = `https://api.m.jd.com/api?functionId=superBrandDoTask&appid=ProductZ4Brand&client=wh5&t=${Date.now()}&body=%7B%22source%22:%22secondfloor%22,%22activityId%22:${
        $.activityId
      },%22encryptProjectId%22:%22${$.encryptProjectId}%22,%22encryptAssignmentId%22:%22${$.helpEncryptAssignmentId}%22,%22assignmentType%22:2,%22itemId%22:%22${$.code}%22,%22actionType%22:0%7D`;
      break;
    default:
      console.log(`错误${type}`);
  }
  myRequest = getRequest(url);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        dealReturn(type, data);
      } catch (e) {
        console.log(data);
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function dealReturn(type, data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log(`返回信息异常：${data}\n`);
    return;
  }
  switch (type) {
    case "superBrandSecondFloorMainPage":
      if (data.code === "0" && data.data && data.data.result) {
        $.activityInfo = data.data.result;
      }
      break;
    case "superBrandTaskList":
      if (data.code === "0") {
        $.taskList = data.data.result.taskList;
      }
      break;
    case "superBrandDoTask":
      if (data.code === "0") {
        console.log(JSON.stringify(data.data.bizMsg));
      }
      break;
    case "superBrandTaskLottery":
      if (data.code === "0" && data.data.bizCode !== "TK000") {
        $.runFlag = false;
        console.log(`抽奖次数已用完`);
      } else if (data.code === "0" && data.data.bizCode == "TK000") {
        if (data.data && data.data.result && data.data.result.rewardComponent && data.data.result.rewardComponent.beanList) {
          if (data.data.result.rewardComponent.beanList.length > 0) {
            console.log(`获得豆子：${data.data.result.rewardComponent.beanList[0].quantity}`);
          }
        }
      } else {
        $.runFlag = false;
        console.log(`抽奖失败`);
      }
      console.log(JSON.stringify(data));
      break;

    case "help":
      if (data.code === "0" && data.data.bizCode === "0") {
        $.codeInfo.time++;
        console.log(`助力成功`);
      } else if (data.code === "0" && data.data.bizCode === "104") {
        $.codeInfo.time++;
        console.log(`已助力过`);
      } else if (data.code === "0" && data.data.bizCode === "108") {
        $.canHelp = false;
        console.log(`助力次数已用完`);
      } else if (data.code === "0" && data.data.bizCode === "103") {
        console.log(`助力已满`);
        $.codeInfo.time = 3;
      } else if (data.code === "0" && data.data.bizCode === "2001") {
        $.canHelp = false;
        console.log(`黑号`);
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    default:
      console.log(JSON.stringify(data));
  }
}

function getRequest(url) {
  const headers = {
    Origin: `https://pro.m.jd.com`,
    Cookie: $.cookie,
    Connection: `keep-alive`,
    Accept: `application/json, text/plain, */*`,
    Referer: `https://pro.m.jd.com/mall/active/4UgUvnFebXGw6CbzvN6cadmfczuP/index.html`,
    Host: `api.m.jd.com`,
    "User-Agent": UA,
    "Accept-Language": `zh-cn`,
    "Accept-Encoding": `gzip, deflate, br`,
  };
  return { url: url, headers: headers, body: `` };
}

function randomWord(randomFlag, min, max) {
  var str = "",
    range = min,
    arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

  // 随机产生
  if (randomFlag) {
    range = Math.round(Math.random() * (max - min)) + min;
  }
  for (var i = 0; i < range; i++) {
    pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
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
        Cookie: $.cookie,
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


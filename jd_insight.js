/**
京洞察问卷通知
35 9 * * * jd_insight.js
*/
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("京洞察问卷通知");
const notify = $.isNode() ? require("./sendNotify") : "";
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  msg = "",
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
    ...jd_helpers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie),
  ].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg(
      $.name,
      "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取",
      "https://bean.m.jd.com/bean/signIndex.action",
      {
        "open-url": "https://bean.m.jd.com/bean/signIndex.action",
      }
    );
    return;
  }
  UUID = getUUID("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  for (let i = 0; i < cookiesArr.length; i++) {
    UA = `jdapp;iPhone;10.0.8;14.6;${UUID};network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214222493;appBuild/168841;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16E158;supportJDSHWK/1`;
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(
        cookie.match(/pt_pin=([^; ]+)(?=;?)/) &&
          cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
      );
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      $.maxPage = "1";
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
          }\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`,
          {
            "open-url": "https://bean.m.jd.com/bean/signIndex.action",
          }
        );

        if ($.isNode()) {
          await notify.sendNotify(
            `${$.name}cookie已失效 - ${$.UserName}`,
            `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`
          );
        }
        continue;
      }
      await main();
    }
  }
  if (msg) {
    await notify.sendNotify(`答问卷得京豆`, msg);
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

async function main() {
  console.log(`开始获取京洞察调研列表...\n`);
  let data = await GetSurveyList();
  if (data.result == true) {
    let list = data.messages.list;
    if (list.length > 0) {
      msg += `${$.nickName || $.UserName}>>>>>>\n`;
      msg += `共${list.length}个类型调查问卷\n`;
      for (let index = 0; index < list.length; index++) {
        const item = list[index].surveyList;
        msg += `类型:${list[index].type}\n`;
        for (let index = 0; index < item.length; index++) {
          let surveyItem = item[index];
          let title = surveyItem.title;
          let subTitle = surveyItem.subTitle;
          let answerUrl = surveyItem.answerUrl;
          msg += `${index + 1}.【${title}】 ${subTitle}\n${answerUrl}\n\n`;
        }
      }
      $.log(msg);
    } else {
      $.log("当前账户没有京调研问卷");
    }
  } else {
    $.log("京洞察调研列表请求错误 返回结果为空" + JSON.stringify(data));
  }
}

function getUUID(x = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", t = 0) {
  return x.replace(/[xy]/g, function (x) {
    var r = (16 * Math.random()) | 0,
      n = "x" == x ? r : (3 & r) | 8;
    return (uuid = t ? n.toString(36).toUpperCase() : n.toString(36)), uuid;
  });
}

function GetSurveyList() {
  const options = {
    url: "https://answer.jd.com/community/survey/list",
    headers: {
      Cookie: $.cookie,
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1",
    },
  };
  return new Promise((resolve) => {
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(err);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
          } else {
            console.log("没有返回数据");
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

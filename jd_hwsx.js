/*
入口 京东 频道 京东众筹
抽奖红包在我的钱包查看
具体多少看运气
[task_local]
20 12,14 * * *
*/
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("京东众筹好物上新");
const notify = $.isNode() ? require("./sendNotify") : "";
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  message;

const randomCount = $.isNode() ? 5 : 5;

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_helpers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = "https://wq.jd.com/";
let allMessage = "";
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", {
      "open-url": "https://bean.m.jd.com/bean/signIndex.action",
    });
    return;
  }
  //await requireConfig()
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      message = "";
      await TotalBean();
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
      await info();
    }
  }
  if ($.isNode() && allMessage) {
    await notify.sendNotify(`${$.name}`, `${allMessage}`);
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

function info() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://wq.jd.com/activep2/lingonggame/Query?activeid=10086139&token=d8e48c7dc95a82d34894350bea9735e0&sceneval=2&callback=query&_=1624584656140`,
      headers: {
        Referer: "https://anmp.jd.com/babelDiy/Zeus/PYfjLrcTLCMwYgFZ1EoQcs4uMkn/index.html?lng=106.286929&lat=29.969358&sid=1c98c3013bd5808a5977e0f9d5f5272w&un_area=17_1458_1463_43894",
        "User-Agent":
          "jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/wifi;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        Cookie: cookie,
      },
    };
    $.get(options, async (err, resp, data) => {
      try {
        data = data.match(/^\w+\((\{[^()]+\})/)[1];
        data = JSON.parse(data);
        if (data.errcode == 0) {
          console.log(`剩余游戏抽奖次数${data.data.currdaydrawnum}`);
          cs = data.data.currdaydrawnum;
          if (cs > 0) {
            console.log(`即将抽奖25次,14点再继续25次 分开中奖几率可能大些`);
            for (let i = 0; i < 25; i++) {
              await $.wait(1000);
              await gettoken();
              await draw();
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

function gettoken() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://wq.jd.com/active/getfunction?activeid=10086139&token=d8e48c7dc95a82d34894350bea9735e0&sceneval=2&t=1624586312861&callback=GetFunctionC&_=1624586312862`,
      headers: {
        Referer: "https://anmp.jd.com/babelDiy/Zeus/PYfjLrcTLCMwYgFZ1EoQcs4uMkn/index.html?lng=106.286929&lat=29.969358&sid=1c98c3013bd5808a5977e0f9d5f5272w&un_area=17_1458_1463_43894",
        "User-Agent":
          "jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/wifi;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        Cookie: cookie,
      },
    };
    $.get(options, async (err, resp, data) => {
      try {
        a = data.match(/a = (.*?)\;/)[1];
        token = data.match(/TOKEN":"(.*?)"/)[1] + eval(a);
        //$.log(token)
        $.log(`promotejs=${token}`);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function draw() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://wq.jd.com/activep2/lingonggame/Draw?activeid=10086139&token=d8e48c7dc95a82d34894350bea9735e0&sceneval=2&scene=base&callback=Draw&_=1624602738900`,
      headers: {
        Referer: "https://anmp.jd.com/babelDiy/Zeus/PYfjLrcTLCMwYgFZ1EoQcs4uMkn/index.html?lng=106.286929&lat=29.969358&sid=1c98c3013bd5808a5977e0f9d5f5272w&un_area=17_1458_1463_43894",
        "User-Agent":
          "jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/wifi;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        Cookie: cookie + `promotejs=${token}`,
      },
    };
    $.get(options, async (err, resp, data) => {
      try {
        data = data.match(/^\w+\((\{[^()]+\})/)[1];
        data = JSON.parse(data);
        if (data.errcode == 0) {
          if (data.data.level == 1) {
            console.log(data);
            console.log(`\n恭喜你抽到了红包\n请前往京东我的钱包查看余额`);
            //allMessage += `京东账号${$.index}-${$.nickName || $.UserName}\n恭喜你抽到了红包 请前往京东我的钱包查看余额${$.index !== cookiesArr.length ? '\n\n' : '\n\n'}`;
          } else if (data.data.level == 0) {
            console.log(data);
            console.log(`\n你的运气太差了毛都没抽到`);
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
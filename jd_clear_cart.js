/*
脚本：清空购物车
更新时间：2021-07-24
因其他脚本会加入商品到购物车，故此脚本用来取消清空购物车
默认：每运行一次脚本清空购物车所有商品
建议此脚本运行时间在 其他脚本运行之后 再执行

脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js, 小火箭
==============Quantumult X===========
[task_local]
#清空购物车
55 17 * * * jd_cleancart.js, tag=清空购物车, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
===========Loon============
[Script]
cron "55 17 * * *" script-path=jd_cleancart.js,tag=清空购物车
============Surge=============
清空购物车 = type=cron,cronexp="55 17 * * *",wake-system=1,timeout=3600,script-path=jd_cleancart.js
===========小火箭========
清空购物车 = type=cron,script-path=jd_cleancart.js, cronexpr="55 17 * * *", timeout=3600, enable=true
 */
const $ = new Env("清空购物车");
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
const notify = $.isNode() ? require("./sendNotify") : "";

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  allMessage = "";
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
    ...jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie),
  ].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg(
      "【京东账号一】清空购物车失败",
      "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取",
      "https://bean.m.jd.com/bean/signIndex.action",
      { "open-url": "https://bean.m.jd.com/bean/signIndex.action" }
    );
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
        `\n****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`
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
      allMessage += `京东账号${$.index} - ${$.nickName}\n`;
      await getCarts();
      allMessage += `购物车商品数：${$.cartsTotalNum}\n`;
      if ($.cartsTotalNum > 0) {
        await unsubscribeCartsFun();
      }
      allMessage += "\n";
    }
  }
  if (allMessage) {
    allMessage = allMessage.substring(0, allMessage.length - 1);
    if (
      $.isNode() &&
      (process.env.CASH_NOTIFY_CONTROL
        ? process.env.CASH_NOTIFY_CONTROL === "false"
        : !!1)
    )
      await notify.sendNotify($.name, allMessage);
    $.msg($.name, "", allMessage);
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

function unsubscribeCartsFun() {
  return new Promise((resolve) => {
    const options = {
      url: `https://wq.jd.com/deal/mshopcart/rmvCmdy?sceneval=2&g_login_type=1&g_ty=ajax`,
      body: `pingouchannel=0&commlist=${$.commlist}&type=0&checked=0&locationid=${$.areaId}&templete=1&reg=1&scene=0&version=20190418&traceid=${$.traceId}&tabMenuType=1&sceneval=2`,
      headers: {
        Accept: "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        Connection: "keep-alive",
        Cookie: cookie,
        Referer: "https://p.m.jd.com/",
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
        data = JSON.parse(data);
        if (data["errId"] == "0") {
          allMessage += `清空结果：✅\n`;
        } else {
          allMessage += `清空结果：❌\n`;
        }
      } catch (e) {
        allMessage += `清空结果：❌\n`;
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function getStr(text, start, end) {
  var str = text;
  var aPos = str.indexOf(start);
  if (aPos < 0) {
    return null;
  }
  var bPos = str.indexOf(end, aPos + start.length);
  if (bPos < 0) {
    return null;
  }
  var retstr = str.substr(
    aPos + start.length,
    text.length - (aPos + start.length) - (text.length - bPos)
  );
  return retstr;
}
function getCarts() {
  $.shopsTotalNum = 0;
  return new Promise((resolve) => {
    const option = {
      url: `https://p.m.jd.com/cart/cart.action`,
      headers: {
        Host: "p.m.jd.com",
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
        "Accept-Encoding": "gzip, deflate, br",
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(
          getStr(data, "window.cartData =", "window._PFM_TIMING")
        );
        $.cartsTotalNum = 0;
        if (data.errId === "0") {
          $.traceId = data["traceId"];
          $.areaId = data["areaId"];
          let itemId, sKuId, index, temp;
          $.commlist = "";
          for (let i = 0; i < data["cart"]["venderCart"].length; i++) {
            const vender = data["cart"]["venderCart"][i];
            for (let s = 0; s < vender["sortedItems"].length; s++) {
              const sorted = vender["sortedItems"][s];
              itemId = sorted["itemId"];
              for (let m = 0; m < sorted["polyItem"]["products"].length; m++) {
                const products = sorted["polyItem"]["products"][m];
                if (itemId == products["mainSku"]["id"]) {
                  sKuId = "";
                  index = "1";
                } else {
                  sKuId = itemId;
                  index = sorted["polyType"] == "4" ? "13" : "11";
                }
                temp = [
                  products["mainSku"]["id"],
                  ,
                  "1",
                  products["mainSku"]["id"],
                  index,
                  sKuId,
                  "0",
                  "skuUuid:" +
                    products["skuUuid"] +
                    "@@useUuid:" +
                    products["useUuid"],
                ].join(",");
                if ($.commlist.length > 0) {
                  $.commlist += "$";
                }
                $.commlist += temp;
                $.cartsTotalNum += 1;
              }
            }
          }
          if ($.commlist.length > 0) {
            $.commlist = encodeURIComponent($.commlist);
          }
          console.log(`当前购物车商品数：${$.cartsTotalNum}个\n`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
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
              $.nickName =
                (data["base"] && data["base"].nickname) || $.UserName;
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
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg(
        $.name,
        "",
        "请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie"
      );
      return [];
    }
  }
}


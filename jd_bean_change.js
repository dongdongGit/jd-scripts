/*
京东资产变动通知脚本：https://gitee.com/lxk0301/jd_scripts/raw/master/jd_bean_change.js
Modified time: 2021-06-9 15:25:41
统计昨日京豆的变化情况，包括收入，支出，以及显示当前京豆数量,目前小问题:下单使用京豆后,退款重新购买,计算统计会出现异常
统计红包以及过期红包
网页查看地址 : https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean
支持京东双账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============QuantumultX==============
[task_local]
#京东资产变动通知
2 9 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_bean_change.js, tag=京东资产变动通知, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon===============
[Script]
cron "2 9 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_bean_change.js, tag=京东资产变动通知
=============Surge===========
[Script]
京东资产变动通知 = type=cron,cronexp="2 9 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_bean_change.js

============小火箭=========
京东资产变动通知 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_bean_change.js, cronexpr="2 9 * * *", timeout=3600, enable=true
 */
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("京东资产变动通知");
const notify = $.isNode() ? require("./sendNotify") : "";
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let allMessage = "";
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "";
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_helpers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.beanCount = 0;
      $.incomeBean = 0;
      $.expenseBean = 0;
      $.todayIncomeBean = 0;
      $.errorMsg = "";
      $.isLogin = true;
      $.nickName = "";
      $.message = "";
      $.balance = 0;
      $.expiredBalance = 0;
      await TotalBean();
      console.log(`\n********开始【京东账号${$.index}】${$.nickName || $.UserName}******\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action",
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await bean();
      await showMsg();
    }
  }

  if ($.isNode() && allMessage) {
    await notify.sendNotify(`${$.name}`, `${allMessage}`, { url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean` });
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });
async function showMsg() {
  if ($.errorMsg) return;
  allMessage += `账号${$.index}：${$.nickName || $.UserName}\n今日收入：${$.todayIncomeBean}京豆 \n昨日收入：${$.incomeBean}京豆 \n昨日支出：${$.expenseBean}京豆 \n当前京豆：${
    $.beanCount
  }(今日将过期${$.expirejingdou})京豆 ${$.message}${$.index !== cookiesArr.length ? "\n\n" : ""}`;
  // if ($.isNode()) {
  //   await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `账号${$.index}：${$.nickName || $.UserName}\n昨日收入：${$.incomeBean}京豆 \n昨日支出：${$.expenseBean}京豆 \n当前京豆：${$.beanCount}京豆 ${$.message}`, { url: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean` })
  // }
  $.msg(
    $.name,
    "",
    `账号${$.index}：${$.nickName || $.UserName}\n今日收入：${$.todayIncomeBean}京豆 \n昨日收入：${$.incomeBean}京豆 \n昨日支出：${$.expenseBean}京豆 \n当前京豆：${$.beanCount}(今日将过期${
      $.expirejingdou
    })京豆${$.message}`,
    { "open-url": "https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean" }
  );
}
async function bean() {
  // console.log(`北京时间零点时间戳:${parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000}`);
  // console.log(`北京时间2020-10-28 06:16:05::${new Date("2020/10/28 06:16:05+08:00").getTime()}`)
  // 不管哪个时区。得到都是当前时刻北京时间的时间戳 new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000

  //前一天的0:0:0时间戳
  const tm = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000 - 24 * 60 * 60 * 1000;
  // 今天0:0:0时间戳
  const tm1 = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000;
  let page = 1,
    t = 0,
    yesterdayArr = [],
    todayArr = [];
  do {
    let response = await getJingBeanBalanceDetail(page);
    // console.log(`第${page}页: ${JSON.stringify(response)}`);
    if (response && response.code === "0") {
      page++;
      let detailList = response.detailList;
      if (detailList && detailList.length > 0) {
        for (let item of detailList) {
          const date = item.date.replace(/-/g, "/") + "+08:00";
          if (new Date(date).getTime() >= tm1 && !item["eventMassage"].includes("退还") && !item["eventMassage"].includes("扣赠")) {
            todayArr.push(item);
          } else if (tm <= new Date(date).getTime() && new Date(date).getTime() < tm1 && !item["eventMassage"].includes("退还") && !item["eventMassage"].includes("扣赠")) {
            //昨日的
            yesterdayArr.push(item);
          } else if (tm > new Date(date).getTime()) {
            //前天的
            t = 1;
            break;
          }
        }
      } else {
        $.errorMsg = `数据异常`;
        $.msg($.name, ``, `账号${$.index}：${$.nickName}\n${$.errorMsg}`);
        t = 1;
      }
    } else if (response && response.code === "3") {
      console.log(`cookie已过期，或者填写不规范，跳出`);
      t = 1;
    } else {
      console.log(`未知情况：${JSON.stringify(response)}`);
      console.log(`未知情况，跳出`);
      t = 1;
    }
  } while (t === 0);
  for (let item of yesterdayArr) {
    if (Number(item.amount) > 0) {
      $.incomeBean += Number(item.amount);
    } else if (Number(item.amount) < 0) {
      $.expenseBean += Number(item.amount);
    }
  }
  for (let item of todayArr) {
    if (Number(item.amount) > 0) {
      $.todayIncomeBean += Number(item.amount);
    }
  }
  await queryexpirejingdou(); //过期京豆
  await redPacket(); //过期红包
  // console.log(`昨日收入：${$.incomeBean}个京豆 `);
  // console.log(`昨日支出：${$.expenseBean}个京豆 `)
}
function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
      headers: {
        Host: "me-api.jd.com",
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
            if (data["retcode"] === "1001") {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data["retcode"] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
            if (data["retcode"] === "0" && data.data && data.data["assetInfo"]) {
              $.beanCount = data.data && data.data["assetInfo"]["beanNum"];
            }
          } else {
            $.log("京东服务器返回空数据");
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
function getJingBeanBalanceDetail(page) {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://api.m.jd.com/client.action?functionId=getJingBeanBalanceDetail`,
      body: `body=${escape(JSON.stringify({ pageSize: "20", page: page.toString() }))}&appid=ld`,
      headers: {
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        Host: "api.m.jd.com",
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
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
            // console.log(data)
          } else {
            console.log(`京东服务器返回空数据`);
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
function queryexpirejingdou() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://wq.jd.com/activep3/singjd/queryexpirejingdou?_=${Date.now()}&g_login_type=1&sceneval=2`,
      headers: {
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        Connection: "keep-alive",
        Cookie: cookie,
        Host: "wq.jd.com",
        Referer: "https://wqs.jd.com/promote/201801/bean/mybean.html",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Mobile/15E148 Safari/604.1",
      },
    };
    $.expirejingdou = 0;
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data.slice(23, -13));
            // console.log(data)
            if (data.ret === 0) {
              data["expirejingdou"].map((item) => {
                console.log(`${timeFormat(item["time"] * 1000)}日过期京豆：${item["expireamount"]}\n`);
              });
              $.expirejingdou = data["expirejingdou"][0]["expireamount"];
              // if ($.expirejingdou > 0) {
              //   $.message += `\n今日将过期：${$.expirejingdou}京豆 `;
              // }
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
function redPacket() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://m.jingxi.com/user/info/QueryUserRedEnvelopesV2?type=1&orgFlag=JD_PinGou_New&page=1&cashRedType=1&redBalanceFlag=1&channel=1&_=${+new Date()}&sceneval=2&g_login_type=1&g_ty=ls`,
      headers: {
        Host: "m.jingxi.com",
        Accept: "*/*",
        Connection: "keep-alive",
        "Accept-Language": "zh-cn",
        Referer: "https://st.jingxi.com/my/redpacket.shtml?newPg=App&jxsid=16156262265849285961",
        "Accept-Encoding": "gzip, deflate, br",
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
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data).data;
            ($.jxRed = 0), ($.jsRed = 0), ($.jdRed = 0), ($.jdhRed = 0), ($.jxRedExpire = 0), ($.jsRedExpire = 0), ($.jdRedExpire = 0), ($.jdhRedExpire = 0);
            let t = new Date();
            t.setDate(t.getDate() + 1);
            t.setHours(0, 0, 0, 0);
            t = parseInt((t - 1) / 1000);
            for (let vo of data.useRedInfo.redList || []) {
              if (vo.orgLimitStr && vo.orgLimitStr.includes("京喜")) {
                $.jxRed += parseFloat(vo.balance);
                if (vo["endTime"] === t) {
                  $.jxRedExpire += parseFloat(vo.balance);
                }
              } else if (vo.activityName.includes("极速版")) {
                $.jsRed += parseFloat(vo.balance);
                if (vo["endTime"] === t) {
                  $.jsRedExpire += parseFloat(vo.balance);
                }
              } else if (vo.orgLimitStr && vo.orgLimitStr.includes("京东健康")) {
                $.jdhRed += parseFloat(vo.balance);
                if (vo["endTime"] === t) {
                  $.jdhRedExpire += parseFloat(vo.balance);
                }
              } else {
                $.jdRed += parseFloat(vo.balance);
                if (vo["endTime"] === t) {
                  $.jdRedExpire += parseFloat(vo.balance);
                }
              }
            }
            $.jxRed = $.jxRed.toFixed(2);
            $.jsRed = $.jsRed.toFixed(2);
            $.jdRed = $.jdRed.toFixed(2);
            $.jdhRed = $.jdhRed.toFixed(2);
            $.balance = data.balance;
            $.expiredBalance = ($.jxRedExpire + $.jsRedExpire + $.jdRedExpire).toFixed(2);
            $.message += `\n当前总红包：${$.balance}(今日总过期${$.expiredBalance})元\n京喜红包：${$.jxRed}(今日将过期${$.jxRedExpire.toFixed(2)})元\n极速红包：${
              $.jsRed
            }(今日将过期${$.jsRedExpire.toFixed(2)})元\n京东红包：${$.jdRed}(今日将过期${$.jdRedExpire.toFixed(2)})元\n健康红包：${$.jdhRed}(今日将过期${$.jdhRedExpire.toFixed(2)})元`;
          } else {
            console.log(`京东服务器返回空数据`);
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

function timeFormat(time) {
  let date;
  if (time) {
    date = new Date(time);
  } else {
    date = new Date();
  }
  return date.getFullYear() + "-" + (date.getMonth() + 1 >= 10 ? date.getMonth() + 1 : "0" + (date.getMonth() + 1)) + "-" + (date.getDate() >= 10 ? date.getDate() : "0" + date.getDate());
}

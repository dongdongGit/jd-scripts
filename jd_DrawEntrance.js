/*
天天优惠大乐透
活动入口-领券-券后9.9
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
15 6 * * * jd_DrawEntrance.js, tag=天天优惠大乐透,  enabled=true
================Loon==============
[Script]
cron "15 6 * * *" script-path=jd_DrawEntrance.js,tag=天天优惠大乐透
===============Surge=================
天天优惠大乐透 = type=cron,cronexp="15 6 * * *",wake-system=1,timeout=3600,script-path=jd_DrawEntrance.js
============小火箭=========
天天优惠大乐透 = type=cron,script-path=jd_DrawEntrance.js, cronexpr="15 6 * * *", timeout=3600, enable=true
 */
const jd_heplers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("天天优惠大乐透");
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = false; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_heplers.safeGet($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/api';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {
      "open-url": "https://bean.m.jd.com/bean/signIndex.action"
    });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      // message = ''; //不重置信息内容
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action"
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      $.ADID = getUUID('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 1);
      $.UUID = getUUID('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
      $.noChance = false;
      await extend();
      for (let x = 0; x < 3; x++) {
        if ($.noChance) {
          continue
        }
        $.log("\n尝试抽奖")
        await doLuckDrawEntrance();
        await $.wait(1000 * 1)
      }
    }
  }
  if (message !== "") {
    if ($.isNode()) {
      await notify.sendNotify($.name, message)
    } else {
      $.msg($.name, '', message)
    }
  }
})()
.catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

function extend() {
  return new Promise(resolve => {
    $.post(taskUrl("getLuckyDrawResourceConfig", {
      "platformType": "1"
    }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(err)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            $.extend = data.result.luckyDrawConfig.extend
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function doLuckDrawEntrance() {
  let body = {
    "platformType": "1",
    "extend": $.extend
  }
  return new Promise(resolve => {
    $.post(taskUrl("doLuckDrawEntrance", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.success && "luckyDrawData" in data.result) {
              if (data.result.luckyDrawData.checkWinOrNot) { //调整判断的顺序
                switch (data.result.luckyDrawData.couponType) {
                  case '2':
                    console.log(`   成功领取优惠券：${data.result.luckyDrawData.discount}\n   ${data.result.luckyDrawData.quotaDesc}，${data.result.luckyDrawData.prizeName}`)
                    break;
                  case '0':
                    console.log(`   成功领取无门槛红包：${data.result.luckyDrawData.quota}`)
                    //message += `\n【京东账号${$.index}】${$.nickName || $.UserName} \n          成功领取无门槛红包：${data.result.luckyDrawData.quota}`//增加通知内容
                    break;
                  default:
                    console.log(JSON.stringify(data)) //这边把对象已文本形式输出，避免对象中的属性有数组形式造成不完全打印
                    break;
                }
              } else {
                $.noChance = true;
                console.log("已经没有次数了");
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&appid=XPMSGC2019&client=m&clientVersion=1.0.0&area=19_1601_3633_63252&geo=[object Object]&uuid=${$.UUID}`,
    headers: {
      "Cookie": cookie,
      "Host": "api.m.jd.com",
      "Origin": "https://h5.m.jd.com",
      "Content-Length": "0",
      "Connection": "keep-alive",
      "Accept": "application/json, text/plain, */*",
      "User-Agent": `jdapp;iPhone;9.5.0;13.5;${$.UUID};network/wifi;ADID/${$.ADID};supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone11,6;addressid/138222502;supportBestPay/0;appBuild/167638;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
      "Accept-Language": "zh-cn",
      "Referer": "https://h5.m.jd.com/babelDiy/Zeus/yj8mbcm6roENn7qhNdhiekyeqtd/index.html",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "text/plain",
    }
  }
}

function getUUID(format = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', UpperCase = 0) {
  return format.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    if (UpperCase) {
      uuid = v.toString(36).toUpperCase();
    } else {
      uuid = v.toString(36)
    }
    return uuid;
  });
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": `jdapp;iPhone;9.5.0;13.5;${$.UUID};network/wifi;ADID/${$.ADID};supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone11,6;addressid/138222502;supportBestPay/0;appBuild/167638;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            if (data['retcode'] === 0) {
              $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
            } else {
              $.nickName = $.UserName
            }
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
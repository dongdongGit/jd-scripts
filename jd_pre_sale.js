/*
预售福利机
活动入口：https://prodev.m.jd.com/mall/active/3QvpPkepEuB5hRgtQvWJ2bjRTCA8/index.html
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#预售福利机
5 0,2 * * * https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_ys.js, tag=预售福利机, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon==============
[Script]
cron "5 0,2 * * *" script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_ys.js,tag=预售福利机
===============Surge=================
预售福利机 = type=cron,cronexp="5 0,2 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_ys.js
============小火箭=========
预售福利机 = type=cron,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_ys.js, cronexpr="5 0,2 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('预售福利机');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
const JD_API_HOST = 'https://www.kmg-jd.com/api';
let allMessage = '';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await $.totalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await jdYs()
      await $.wait(2000)
    }
  }
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })

async function jdYs() {
  await getActiveInfo()
  if (!$.appId) return
  await getToken()
  if (!$.Authorization) return
  await active()
  await active('', false)
}

async function getActiveInfo(url = 'https://prodev.m.jd.com/mall/active/3QvpPkepEuB5hRgtQvWJ2bjRTCA8/index.html') {
  let options = {
    url,
    headers: {
      "Host": "prodev.m.jd.com",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cookie": cookie
    }
  }
  return new Promise(async resolve => {
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} getActiveInfo API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data && data.match(/window\.performance.mark\(e\)}}\((.*)\);<\/script>/)[1])
            for (let key of Object.keys(data.codeFloors)) {
              let vo = data.codeFloors[key]
              if (vo.boardParams && vo.boardParams.appId) {
                $.appId = vo.boardParams.appId
              }
            }
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

async function getToken() {
  return new Promise(async resolve => {
    let options = {
      url: `https://jdjoy.jd.com/saas/framework/encrypt/pin?appId=${$.appId}`,
      headers: {
        "Host": "jdjoy.jd.com",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://prodev.m.jd.com",
        "Referer": "https://prodev.m.jd.com/",
        "Accept-Encoding": "gzip, deflate, br",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Cookie": cookie
      }
    }
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} getToken API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.success) {
              $.lkToken = data.data.lkToken
              await verify($.lkToken)
            }
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
function verify(lkToken) {
  return new Promise(resolve => {
    $.post(taskUrl(`user/verify`, {"parameters":{"userId":"","lkToken":lkToken,"username":"sdfas"}}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} verify API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              $.Authorization = data.token
            } else if (data.code === 403) {
              console.log(`活动太火爆了，还是去买买买吧！！！`)
            }
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
function active(shareId = null, type = true) {
  return new Promise(resolve => {
    $.post(taskUrl(`presaleGift/active`, {"attributes":{"activeId":"presaleGiftD9gBzawG","shareId":shareId,"lkToken":$.lkToken,"valueDay":new Date().Format("yyyyMMdd")}}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} active API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              if (type) {
                if (!shareId) {
                  $.joinId = data.data.userVO.joinId
                  for (let key of Object.keys(data.data.jobMap)) {
                    let vo = data.data.jobMap[key]
                    if (key === "sign" || key === "channel" || key === "viewLive" || key === "viewWare" || key === "followShop") {
                      for (let details of vo.details) {
                        console.log(`去做【${details.title}】`)
                        if (!details.done) {
                          await job(vo.jobForm, details.config)
                          if (key === "viewLive" || key === "viewWare") {
                            await $.wait(5 * 1000)
                          } else {
                            await $.wait(2 * 1000)
                          }
                        } else {
                          console.log(`任务已完成`)
                        }
                      }
                    }
                  }
                }
              } else {
                let num = Math.floor(data.data.userVO.points / data.data.needDrawPoints)
                if (num === 0) {
                  console.log(`\n无可抽奖次数`)
                } else {
                  console.log(`\n抽奖次数：${num}，开始抽奖`)
                }
                for (let i = 0; i < num; i++) {
                  await lottery()
                  await $.wait(2000)
                }
              }
            }
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
function job(jobForm, jobDetail) {
  return new Promise(resolve => {
    $.post(taskUrl(`presaleGift/job`, {"attributes":{"activeId":"presaleGiftD9gBzawG","joinId":$.joinId,"jobForm":jobForm,"jobDetail":jobDetail,"valueDay":new Date().Format("yyyyMMdd")}}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} job API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              console.log(data.data.signDays > 0 ? `签到成功：签到${data.data.signDays}天，获得${data.data.val}金币` : `完成成功：获得${data.data.val}金币`)
            } else {
              console.log(`完成失败：${data.msg}`)
            }
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
function lottery() {
  return new Promise(resolve => {
    $.post(taskUrl(`presaleGift/lottery`, {"attributes":{"activeId":"presaleGiftD9gBzawG","joinId":$.joinId,"lotteryForm":0}}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} lottery API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              if (data.data) {
                console.log(`抽奖成功：获得${data.data.awardVal}${data.data.awardName}`)
              } else {
                console.log(`抽奖成功：获得空气~`)
              }
            } else {
              console.log(`抽奖失败：${data.msg}`)
            }
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

function showMsg() {
  return new Promise(resolve => {
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve()
  })
}

function taskUrl(functionId, body) {
  return {
    url: `${JD_API_HOST}/${functionId}`,
    body: JSON.stringify(body),
    headers: {
      "Host": "www.kmg-jd.com",
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://www.kmg-jd.com",
      "Content-Type": "application/json;charset=UTF-8",
      "Authorization": $.Authorization ? $.Authorization : "null",
      "Referer": "https://www.kmg-jd.com/presaleGift/index.html",
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
      "Accept-Encoding": "gzip, deflate, br",
      "Cookie": cookie
    }
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      url: "https://wq.jd.com/user_new/info/GetJDUserInfoUnion?sceneval=2",
      headers: {
        Host: "wq.jd.com",
        Accept: "*/*",
        Connection: "keep-alive",
        Cookie: cookie,
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
        "Accept-Language": "zh-cn",
        "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 1001) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === 0 && data.data && data.data.hasOwnProperty("userInfo")) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            console.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e)
      } finally {
        resolve();
      }
    })
  })
}
Date.prototype.Format = function (fmt) { //author: meizz
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}
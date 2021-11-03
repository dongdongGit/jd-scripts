/*
攒金币 赢大礼
活动地址: 京东APP-智能生活-右侧悬浮窗
活动时间：2021-09-28到2021-10-28
脚本兼容: QuantumultX, Surge,Loon, JSBox, Node.js
=================================Quantumultx=========================
[task_local]
#攒金币 赢大礼
22 0,8 * * * 、jd_GoldcoinToGift.js, tag=攒金币 赢大礼, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

=================================Loon===================================
[Script]
cron "22 0,8 * * *" script-path=、jd_GoldcoinToGift.js,tag=攒金币 赢大礼

===================================Surge================================
攒金币 赢大礼 = type=cron,cronexp="22 0,8 * * *",wake-system=1,timeout=3600,script-path=、jd_GoldcoinToGift.js

====================================小火箭=============================
攒金币 赢大礼 = type=cron,script-path=jd_GoldcoinToGift.js, cronexpr="22 0,8 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
const $ = jd_env.env('攒金币 赢大礼');
const notify = $.isNode() ? require('../sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message, allMessage = '';
$.shareId = [
  'ffbe3aeb-7547-4779-a909-add5d69cbb84'
];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/api';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
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
      $.pushcode = true
      $.hot = false
      await GoldcoinToGift()
    }
  }
  let res = await getAuthorShareCode('')

  $.shareId = [...new Set([...$.shareId, ...(res || [])])]
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.canHelp = true
    if ($.shareId && $.shareId.length) {
      console.log(`\n开始互助\n`);
      for (let j = 0; j < $.shareId.length && $.canHelp; j++) {
        console.log(`账号${$.UserName} 去助力 ${$.shareId[j]}`)
        $.delcode = false
        await doSupport($.shareId[j])
        await $.wait(2000)
        if ($.delcode) {
          $.shareId.splice(j, 1)
          j--
          continue
        }
      }
    } else {
      break
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function GoldcoinToGift() {
  try {
    await getSupportList(false)
    if ($.hot) return
    await getShareId()
    await regist()
    await getSupportList()

    $.complete = false
    let num = 0
    do {
      await getTaskList()
      await $.wait(2000)
      num++
    } while (num < 10 && !$.complete)

  } catch (e) {
    $.logErr(e)
  }
}

function getSupportList(type = true) {
  const body = {"apiMapping":"/api/supportTask/getSupportList"}
  return new Promise(resolve => {
    $.post(taskurl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} getSupportList API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (type) {
              if (data.code === 200) {
                console.log(`已有${data.data.supportedNum}人助力`)
                if (data.data.rewardTime > 0) {
                  console.log(`领取助力奖励`)
                  for (let i = 0; i < data.data.rewardTime; i++) {
                    await getSupportReward()
                    await $.wait(2000)
                  }
                  console.log('')
                }
              }
            } else {
              if (data.code === 200) {
                if (data.data.supportedNum >= data.data.supportNeedNum) {
                  $.pushcode = false
                }
              } else if (data.code === 1002) {
                $.hot = true
                console.log(`活动太火爆了，还是去买买买吧！`)
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function getSupportReward() {
  const body = {"apiMapping":"/api/supportTask/getSupportReward"}
  return new Promise(resolve => {
    $.post(taskurl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} getSupportReward API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              console.log(`领取成功：获得${data.data.score}金币,${data.data.jbean}京豆`)
            } else {
              console.log(`领取失败：${data.msg}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function doSupport(shareId) {
  const body = {"shareId":shareId,"apiMapping":"/api/supportTask/doSupport"}
  return new Promise(resolve => {
    $.post(taskurl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} doSupport API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              if (data.data.status === 7) {
                console.log(`助力成功`)
              } else if (data.data.status === 1) {
                console.log(`助力失败：不能助力自己`)
              } else if (data.data.status === 3) {
                console.log(`助力失败：已助力过此好友`)
              } else if (data.data.status === 5) {
                console.log(`助力失败：没有助力次数`)
                $.canHelp = false
              } else if (data.data.status === 4) {
                console.log(`助力失败：此好友助力已满`)
                $.delcode = true
              } else {
                console.log(JSON.stringify(data))
              }
            } else if (data.code === 1001) {
              console.log(`助力失败：${data.msg}`)
              $.canHelp = false
            } else if (data.code === 1002) {
              console.log(`助力失败：${data.msg}`)
              $.canHelp = false
            } else {
              console.log(JSON.stringify(data))
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function getShareId() {
  const body = {"apiMapping":"/api/supportTask/getShareId"}
  return new Promise(resolve => {
    $.post(taskurl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} getShareId API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              console.log(`【京东账号${$.index}（${$.UserName}）的攒金币赢大礼好友互助码】${data.data}`)
              if ($.pushcode) $.shareId.push(data.data)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function getTaskList() {
  const body = {"apiMapping":"/api/task/getTaskList"}
  return new Promise(resolve => {
    $.post(taskurl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} getTaskList API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            for (let key of Object.keys(data.data)) {
              let vo = data.data[key]
              if (vo.type === "BROWSE_TASK") {
                console.log(`去做【${vo.taskName}】`)
                if (vo.finishNum < vo.totalNum) {
                  let timeStamp = (await doTask(vo.parentId, vo.taskId)).data.timeStamp
                  await $.wait(5000)
                  await getBrowseStatus(vo.parentId, vo.taskId, timeStamp)
                  await $.wait(2000)
                  await getReward(vo.parentId, vo.taskId)
                } else {
                  console.log(`任务已完成`)
                  $.complete = true
                }
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function doTask(parentId, taskId) {
  const body = {"parentId":parentId,"taskId":taskId,"apiMapping":"/api/task/doTask"}
  return new Promise(resolve => {
    $.post(taskurl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} doTask API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            // console.log(`doTask`, JSON.stringify(data))
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function getBrowseStatus(parentId, taskId, timeStamp) {
  const body = {"parentId":parentId,"taskId":taskId,"timeStamp":timeStamp,"apiMapping":"/api/task/getBrowseStatus"}
  return new Promise(resolve => {
    $.post(taskurl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} getBrowseStatus API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            // console.log(`getBrowseStatus`, JSON.stringify(data))
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function getReward(parentId, taskId) {
  const body = {"parentId":parentId,"taskId":taskId,"timeStamp":Date.now(),"apiMapping":"/api/task/getReward"}
  return new Promise(resolve => {
    $.post(taskurl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} getReward API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              console.log(`完成成功：获得${data.data.score}金币,${data.data.jbean}京豆`)
            } else {
              console.log(`完成失败：${data.msg}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}
function regist() {
  const body = {"apiMapping":"/api/regist"}
  return new Promise(resolve => {
    $.post(taskurl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} regist API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              if (data.data.signed && data.data.doRegist) {
                for (let key of Object.keys(data.data.registList).reverse()) {
                  let vo = data.data.registList[key]
                  if (vo.registed) {
                    console.log(`签到成功：获得${vo.score}金币,${vo.jbean}京豆`)
                    break
                  }
                }
              } else {
                console.log(`签到失败：今日已签到`)
              }
            } else {
              console.log(`签到失败：${data.msg}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

function taskurl(body = {}) {
  return {
    url: `${JD_API_HOST}?appid=china-joy&functionId=jd_home_pro&body=${JSON.stringify(body)}&t=${Date.now()}&loginType=2`,
    headers: {
      "Host": "api.m.jd.com",
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/x-www-form-urlencoded",
      "Origin": "https://small-home.jd.com",
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('../USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
      "Referer": "https://small-home.jd.com/",
      "Accept-Encoding": "gzip, deflate, br",
      "cookie": cookie
    }
  }
}

function getAuthorShareCode(url) {
  return new Promise(async resolve => {
    const options = {
      url: `${url}?${new Date()}`, "timeout": 10000, headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
      }
    };
    if ($.isNode() && process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
      const tunnel = require("tunnel");
      const agent = {
        https: tunnel.httpsOverHttp({
          proxy: {
            host: process.env.TG_PROXY_HOST,
            port: process.env.TG_PROXY_PORT * 1
          }
        })
      }
      Object.assign(options, { agent })
    }
    $.get(options, async (err, resp, data) => {
      try {
        resolve(JSON.parse(data))
      } catch (e) {
        // $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
    await $.wait(10000)
    resolve();
  })
}


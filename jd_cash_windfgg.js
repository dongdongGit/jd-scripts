/**
 * 签到领现金_Windfgg，每日2毛～5毛
 * cron "0 0 6 * *" sign_xj.js,tag=签到领现金
 * 
 * 无助力活动 助力码无用
 * 活动入口：京东APP搜索领现金进入
 * 满30提现 目前有3、8、15、30的红包
 */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('签到领现金_Windfgg');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let allMessage = '';
let jdWindfggToken = '';
jdWindfggToken = $.isNode() ? (process.env.WindfggToken ? process.env.WindfggToken : `${jdWindfggToken}`) : ($.getdata('WindfggToken') ? $.getdata('WindfggToken') : `${jdWindfggToken}`);
if (!jdWindfggToken) {
  console.log('\n请前往 https://t.me/wind_fgg   获取Token\n请填写Windfgg获取的Token,变量是WindfggToken');
  return;
}

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {
      "open-url": "https://bean.m.jd.com/bean/signIndex.action"
    });
    return;
  }
  // await requireConfig()

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
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action"
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await jdCash()
    }
  }
  if (allMessage) {
    if ($.isNode() && (process.env.CASH_NOTIFY_CONTROL ? process.env.CASH_NOTIFY_CONTROL === 'false' : !!1)) await notify.sendNotify($.name, allMessage);
    $.msg($.name, '', allMessage);
  }
})()
.catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })
async function jdCash() {
  $.signMoney = 0;
  await mob_sign()
  await mob_home()
  await appindex()
  await index()

  $.exchangeBeanNum = 0;

  await appindex(true)
}

async function appindex(info = false) {
  let functionId = "cash_homePage"
  let sign = `body=%7B%7D&build=167968&client=apple&clientVersion=10.4.0&d_brand=apple&d_model=iPhone13%2C3&ef=1&eid=eidI25488122a6s9Uqq6qodtQx6rgQhFlHkaE1KqvCRbzRnPZgP/93P%2BzfeY8nyrCw1FMzlQ1pE4X9JdmFEYKWdd1VxutadX0iJ6xedL%2BVBrSHCeDGV1&ep=%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22screen%22%3A%22CJO3CMeyDJCy%22%2C%22osVersion%22%3A%22CJUkDK%3D%3D%22%2C%22openudid%22%3A%22CJSmCWU0DNYnYtS0DtGmCJY0YJcmDwCmYJC0DNHwZNc5ZQU2DJc3Zq%3D%3D%22%2C%22area%22%3A%22CJZpCJCmC180ENcnCv80ENc1EK%3D%3D%22%2C%22uuid%22%3A%22aQf1ZRdxb2r4ovZ1EJZhcxYlVNZSZz09%22%7D%2C%22ts%22%3A1648428189%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D&ext=%7B%22prstate%22%3A%220%22%2C%22pvcStu%22%3A%221%22%7D&isBackground=N&joycious=104&lang=zh_CN&networkType=3g&networklibtype=JDNetworkBaseAF&partner=apple&rfs=0000&scope=11&sign=98c0ea91318ef1313786d86d832f1d4d&st=1648428208392&sv=101&uemps=0-0&uts=0f31TVRjBSv7E8yLFU2g86XnPdLdKKyuazYDek9RnAdkKCbH50GbhlCSab3I2jwM04d75h5qDPiLMTl0I3dvlb3OFGnqX9NrfHUwDOpTEaxACTwWl6n//EOFSpqtKDhg%2BvlR1wAh0RSZ3J87iAf36Ce6nonmQvQAva7GoJM9Nbtdah0dgzXboUL2m5YqrJ1hWoxhCecLcrUWWbHTyAY3Rw%3D%3D`
  return new Promise((resolve) => {
    $.post(apptaskUrl(functionId, sign), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`appindex API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0 && data.data.result) {
              if (info) {
                if (message) {
                  message += `当前现金：${data.data.result.totalMoney}元`;
                  allMessage += `京东账号${$.index}${$.nickName}\n${message}${$.index !== cookiesArr.length ? '\n\n' : ''}`;
                }
                console.log(`\n\n当前现金：${data.data.result.totalMoney}元`);
                return
              }
              $.signMoney = data.data.result.totalMoney;
              // console.log(`您的助力码为${data.data.result.invitedCode}`)
              //console.log(`\n【京东账号${$.index}（${$.UserName}）的好友互助码】${data.data.result.invitedCode}\n`);
              let helpInfo = {
                'inviteCode': data.data.result.invitedCode,
                'shareDate': data.data.result.shareDate
              }
              $.shareDate = data.data.result.shareDate;
              // $.log(`shareDate: ${$.shareDate}`)
              // console.log(helpInfo)
              for (let task of data.data.result.taskInfos) {
                if (task.type === 4) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await appdoTask(task.type, task.jump.params.skuId)
                    await $.wait(5000)
                  }
                } else if (task.type === 2) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await appdoTask(task.type, task.jump.params.shopId)
                    await $.wait(5000)
                  }
                } else if (task.type === 30) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await appdoTask(task.type, task.jump.params.path)
                    await $.wait(5000)
                  }
                } else if (task.type === 16 || task.type === 3 || task.type === 5 || task.type === 17 || task.type === 21) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await appdoTask(task.type, task.jump.params.url)
                    await $.wait(5000)
                  }
                }
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

function index() {
  return new Promise((resolve) => {
    $.get(taskUrl("cash_mob_home"), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`index API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0 && data.data.result) {
              for (let task of data.data.result.taskInfos) {
                if (task.type === 4) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await doTask(task.type, task.jump.params.skuId)
                    await $.wait(5000)
                  }
                } else if (task.type === 2) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await doTask(task.type, task.jump.params.shopId)
                    await $.wait(5000)
                  }
                } else if (task.type === 31) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await doTask(task.type, task.jump.params.path)
                    await $.wait(5000)
                  }
                } else if (task.type === 16 || task.type === 3 || task.type === 5 || task.type === 17 || task.type === 21) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await doTask(task.type, task.jump.params.url)
                    await $.wait(5000)
                  }
                }
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
async function appdoTask(type, taskInfo) {
  let functionId = 'cash_doTask'
  let body = {
    "type": type,
    "taskInfo": taskInfo
  }
  let sign = await getSignfromPanda(functionId, body)

  return new Promise((resolve) => {
    $.post(apptaskUrl(functionId, sign), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`appdoTask API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              console.log(`任务完成成功`)
              // console.log(data.data.result.taskInfos)
            } else {
              console.log(JSON.stringify(data))
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

function doTask(type, taskInfo) {
  return new Promise((resolve) => {
    $.get(taskUrl("cash_doTask", {
      "type": type,
      "taskInfo": taskInfo
    }), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`doTask API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              console.log(`任务完成成功`)
              // console.log(data.data.result.taskInfos)
            } else {
              console.log(data)
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

function getSignfromPanda(functionId, body) {
  var strsign = '';
  let data = {
    "fn": functionId,
    "body": body
  }
  return new Promise((resolve) => {
    let url = {
      url: "https://api.windfgg.cf/jd/sign",
      body: JSON.stringify(data),
      followRedirect: false,
      headers: {
        'Accept': '*/*',
        "accept-encoding": "gzip, deflate, br",
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + jdWindfggToken
      },
      timeout: 30000
    }
    $.post(url, async (err, resp, data) => {
      try {
        data = JSON.parse(data);

        if (data && data.code == 200) {
          lnrequesttimes = data.request_times;
          console.log("连接Windfgg服务成功，当前Token使用次数为" + lnrequesttimes);
          if (data.data)
            strsign = data.data || '';
          if (strsign != '')
            resolve(strsign);
        } else if (data.code == 201) {
          console.log("签名获取失败,Token使用次数上限.");
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve('');
      }
    })
  })
}

function randomString(e) {
  e = e || 32;
  let t = "abcdefghijklmnopqrstuvwxyz0123456789",
    a = t.length,
    n = "";
  for (let i = 0; i < e; i++)
    n += t.charAt(Math.floor(Math.random() * a));
  return n
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

function apptaskUrl(functionId = "", body = "") {
  return {
    url: `${JD_API_HOST}?functionId=${functionId}`,
    body,
    headers: {
      'Cookie': cookie,
      'Host': 'api.m.jd.com',
      'Connection': 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': '',
      'User-Agent': 'JD4iPhone/167774 (iPhone; iOS 14.7.1; Scale/3.00)',
      'Accept-Language': 'zh-Hans-CN;q=1',
      'Accept-Encoding': 'gzip, deflate, br',
    }
  }
}

function taskUrl(functionId, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${functionId}&body=${encodeURIComponent(JSON.stringify(body))}&appid=CashRewardMiniH5Env&appid=9.1.0`,
    headers: {
      'Cookie': cookie,
      'Host': 'api.m.jd.com',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Referer': 'http://wq.jd.com/wxapp/pages/hd-interaction/index/index',
      'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    }
  }
}

function getAuthorShareCode(url) {
  return new Promise(resolve => {
    const options = {
      url: `${url}?${new Date()}`,
      "timeout": 30000,
      headers: {
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
      Object.assign(options, {
        agent
      })
    }
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {} else {
          if (data) data = JSON.parse(data)
        }
      } catch (e) {
        // $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

//签到
function mob_sign() {
  return new Promise((resolve) => {
    $.get(taskUrl("cash_mob_sign", {
      "breakReward": 1
    }), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`cash_mob_sign API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            // console.log(data);
            if (data.data.bizCode === 0) {
              console.log(`签到${data.data.bizMsg}`)
            } else {
              console.log(data.data.bizMsg)
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

//获取任务
function mob_home() {
  return new Promise((resolve) => {
    $.get(taskUrl("cash_mob_home"), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`cash_mob_home API请求失败，请检查网路重试`)
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0 && data.data.result) {
              for (let task of data.data.result.taskInfos) {
                if (task.type === 4) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await doTask(task.type, task.jump.params.skuId)
                    await $.wait(5000)
                  }
                } else if (task.type === 2) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await doTask(task.type, task.jump.params.shopId)
                    await $.wait(5000)
                  }
                } else if (task.type === 31) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await doTask(task.type, task.jump.params.path)
                    await $.wait(5000)
                  }
                } else if (task.type === 16 || task.type === 3 || task.type === 5 || task.type === 17 || task.type === 21) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i + 1}/${task.times}`)
                    await doTask(task.type, task.jump.params.url)
                    await $.wait(5000)
                  }
                }
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
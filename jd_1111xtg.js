/**
 * name: 京东-双11星推官
 * author: @lof
 */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('双11星推官');
const jdCookieNode = $['isNode']() ? require('./jdCookie.js') : '';

let inviteCodes = ['d091ca0d-ca98-458c-80f6-1618f3c7f1fc'];
let cookiesArr = [],
  cookie = '';

Object['keys'](jdCookieNode)['forEach']((item) => {
  cookiesArr.push(jdCookieNode[item]);
});

let XTG_1111_LOTTERY = 'N';
if (process['env']['XTG_1111_LOTTERY']) XTG_1111_LOTTERY = process['env']['XTG_1111_LOTTERY'];

!(async () => {
  try {
    for (let i = 0; i < cookiesArr.length; i++) {
      if (cookiesArr[i]) {
        cookie = cookiesArr[i];
        $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        $['index'] = i + 1;
        $['nickName'] = '';

        console.log(`\n********开始【京东账号${$.index}】${$.nickName || $.UserName}  ******\n`);
        await getUA();
        await xtg_do_sign();
        for (let i = 0; i < 8; i++) {
          var tasksList = await xtg_star_push_jd_prod('/api/task/getTaskList');
          for (let task of tasksList) {
            // console.log(task)
            if (task.taskState == '0') {
              console.log(`任务${task.taskName},parentId=${task.parentId}taskId=${task.taskId}【已完成】`);
            } else {
              console.log(`任务${task.taskName},parentId=${task.parentId}taskId=${task.taskId}【做任务】`);
              startT = new Date().getTime();
              rewardST = await xtg_do_task(task.parentId, task.taskId, startT);
              if (task.type == 'BROWSE_TASK' || rewardST) {
                await $.wait(1000 * 12);
                await xtg_get_reward(task.parentId, task.taskId, rewardST, new Date().getTime());
              } else {
                await $.wait(1000 * 2);
              }
            }
          }
        }
        await xtg_get_shareId();
      }
    }

    // 开始内部助力
    console.log(inviteCodes);
    for (let i = 0; i < cookiesArr.length; i++) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.canHelp = true;
      for (let code of inviteCodes) {
        if ($.UserName === code['user']) continue;
        if (code['shareId'] && code['shareId'] != 'undefined') {
          console.log(`【${$.UserName}】去助力【${code['user']}】邀请码：${code['shareId']}`);
          if (!$.canHelp) break;
          await xtg_inner_help(code['shareId']);
          await $.wait(1000 * 1);
        }
      }
    }

    if (XTG_1111_LOTTERY == 'Y') {
      //开始抽奖
      for (let i = 0; i < cookiesArr.length; i++) {
        cookie = cookiesArr[i];
        $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        $.index = i + 1;
        canLottery = true;
        console.log(`【${$.UserName}】开始抽奖。。。`);
        do {
          canLottery = await xtg_lottery();
          await $.wait(1000 * 1);
        } while (canLottery);
      }
    }
  } catch (e) {
    $.log(e);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

//内部互助
function xtg_inner_help(inviteId) {
  let body = { shareId: inviteId, apiMapping: '/api/supportTask/doSupport' };
  let opt = {
    url: `https://api.m.jd.com/api`,
    body: `appid=china-joy&functionId=star_push_jd_prod&body=${escape(JSON.stringify(body))}&t=${new Date().getTime()}&loginType=2`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'https://starintroducer.jd.com',
      Referer: 'https://starintroducer.jd.com/',
    },
  };
  // console.log(opt)
  return new Promise((resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = $.toObj(data);
          if (data.code === 200) {
            console.log(JSON.stringify(data));
            if (data.data && data.data.status === 4) console.log(`助力结果：对方助力已满`);
            if (data.data && data.data.status === 5) console.log(`助力结果：助力次数不足`);
            $.canHelp = false;
            if (data.data && data.data.status === 7) console.log(`助力结果：助力成功`);
          } else {
            console.log(`助力异常：${JSON.stringify(data)}`);
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

//获取任务列表
function xtg_star_push_jd_prod(apiMapping) {
  t = new Date().getTime();
  let body = { apiMapping: apiMapping };
  let opt = {
    url: `https://api.m.jd.com/api`,
    body: `appid=china-joy&functionId=star_push_jd_prod&body=${escape(JSON.stringify(body))}&t=${t}&loginType=2`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'https://starintroducer.jd.com',
      Referer: 'https://starintroducer.jd.com/',
    },
  };
  return new Promise((resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 200) {
              resolve(data.data);
            } else {
              console.log(`❌获取任务失败:${JSON.stringify(data)}\n`);
              resolve([]);
            }
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
//做任务
function xtg_do_task(parentId, taskId, t) {
  let body = {
    parentId: parentId,
    taskId: taskId,
    apiMapping: '/api/task/doTask',
  };
  let opt = {
    url: `https://api.m.jd.com/api`,
    body: `appid=china-joy&functionId=star_push_jd_prod&body=${escape(JSON.stringify(body))}&t=${t}&loginType=2`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'https://starintroducer.jd.com',
      Referer: 'https://starintroducer.jd.com/',
    },
  };
  return new Promise((resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 200) {
              console.log(`做任务`, data.msg);
              if (data.data.timeStamp) {
                resolve(data.data.timeStamp);
              } else {
                resolve();
              }
            } else {
              console.log(`❌请求任务失败:${JSON.stringify(data)}\n`);
            }
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

//取奖励
function xtg_get_reward(parentId, taskId, startST, endST) {
  let body = {
    parentId: parentId,
    taskId: taskId,
    timeStamp: startST,
    apiMapping: '/api/task/getReward',
  };
  let opt = {
    url: `https://api.m.jd.com/api`,
    body: `appid=china-joy&functionId=star_push_jd_prod&body=${escape(JSON.stringify(body))}&t=${endST}&loginType=2`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'https://starintroducer.jd.com',
      Referer: 'https://starintroducer.jd.com/',
    },
  };
  // console.log(opt)
  return new Promise((resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 200) {
              console.log(`领取奖励`, data.msg);
            } else {
              console.log(`❌奖励领取失败:${JSON.stringify(data)}\n`);
            }
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

//签到
function xtg_do_sign() {
  t = new Date().getTime();
  let body = { apiMapping: '/api/task/doSign' };
  let opt = {
    url: `https://api.m.jd.com/api`,
    body: `appid=china-joy&functionId=star_push_jd_prod&body=${escape(JSON.stringify(body))}&t=${t}&loginType=2`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'https://starintroducer.jd.com',
      Referer: 'https://starintroducer.jd.com/',
    },
  };
  return new Promise((resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 200) {
              console.log(`签到`, data.msg);
              if (data.data.timeStamp) {
                resolve(data.data.timeStamp);
              } else {
                resolve();
              }
            } else {
              console.log(`❌签到失败:${JSON.stringify(data)}\n`);
            }
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
//获取互助ID
function xtg_lottery() {
  let body = { apiMapping: '/api/lottery/lottery' };
  let opt = {
    url: `https://api.m.jd.com/api`,
    body: `appid=china-joy&functionId=star_push_jd_prod&body=${escape(JSON.stringify(body))}&t=${new Date().getTime()}&loginType=2`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'https://starintroducer.jd.com',
      Referer: 'https://starintroducer.jd.com/',
    },
  };
  // console.log(opt)
  return new Promise((resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 200) {
              // console.log(JSON.stringify(data.data))
              if (data.data.prizeName) {
                console.log(`🎉恭喜获得${data.data.prizeName} ${data.data.prizeCount} 个`);
              } else {
                console.log(`未中奖`);
              }
              resolve(true);
            } else if (data.code === 4003) {
              console.log(data.msg);
              resolve(false);
            } else {
              console.log(`❌抽奖失败:${JSON.stringify(data)}\n`);
            }
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

//获取互助ID
function xtg_get_shareId() {
  let body = { apiMapping: '/api/supportTask/getShareId' };
  let opt = {
    url: `https://api.m.jd.com/api`,
    body: `appid=china-joy&functionId=star_push_jd_prod&body=${escape(JSON.stringify(body))}&t=${new Date().getTime()}&loginType=2`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'https://starintroducer.jd.com',
      Referer: 'https://starintroducer.jd.com/',
    },
  };
  // console.log(opt)
  return new Promise((resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 200) {
              console.log(`${$.UserName} 互助码:`, data.data);
              inviteCodes.push({
                user: $.UserName,
                shareId: data.data,
              });
            } else {
              console.log(`❌获取互助码失败:${JSON.stringify(data)}\n`);
            }
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

async function getUA() {
  $.UA = `jdapp;iPhone;10.1.4;15.0.2;${randomString(
    40
  )};network/wifi;model/iPhone13,2;addressid/1358146595;appBuild/167810;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;
}

function randomString(e) {
  e = e || 32;
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/*
金榜年终奖
脚本会给内置的码进行助力
活动时间：2021-12-12日结束
活动入口：京东APP首页右边浮动飘窗
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#金榜年终奖
10 0,2 * * * https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_split.js, tag=年终奖, enabled=true
================Loon==============
[Script]
cron "10 0,2 * * *" script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_split.js,tag=年终奖
===============Surge=================
金榜年终奖 = type=cron,cronexp="10 0,2 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_split.js
============小火箭=========
金榜年终奖 = type=cron,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_split.js, cronexpr="10 0,2 * * *", timeout=3600, enable=true
 */
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("金榜年终奖");
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
const randomCount = $.isNode() ? 20 : 5;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
$.shareCodes = [
  'T0225KkcRRcd_AbUJB2nk_YCcACjRQmoaX5kRrbA'
];
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.hot = false;
      message = '';
      await $.totalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await jdSplit();
    }
  }
  let res = await getAuthorShareCode('https://raw.githubusercontent.com/Aaron-lv/updateTeam/master/shareCodes/split.json');
  if (!res) {
    $.http
      .get({ url: 'https://purge.jsdelivr.net/gh/Aaron-lv/updateTeam@master/shareCodes/split.json' })
      .then((resp) => {})
      .catch((e) => console.log('刷新CDN异常', e));
    await $.wait(1000);
    res = await getAuthorShareCode('https://cdn.jsdelivr.net/gh/Aaron-lv/updateTeam@master/shareCodes/split.json');
  }
  $.newShareCodes = [...new Set([...$.shareCodes, ...(res || [])])];
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.canHelp = true;
    if ($.newShareCodes && $.newShareCodes.length) {
      console.log(`\n开始互助\n`);
      for (let j = 0; j < $.newShareCodes.length && $.canHelp; j++) {
        console.log(`账号${$.UserName} 去助力 ${$.newShareCodes[j]}`);
        $.delcode = false;
        await jdsplit_collectScore($.newShareCodes[j], 6, null);
        await $.wait(2000);
        if ($.delcode) {
          $.newShareCodes.splice(j, 1);
          j--;
          continue;
        }
      }
    } else {
      break;
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
async function jdSplit() {
  await jdsplit_getTaskDetail();
  if ($.hot) return;
  await doTask();
  await showMsg();
}
function showMsg() {
  return new Promise((resolve) => {
    message += `任务已做完：具体奖品去发活动页面查看\n活动入口：京东APP首页右边浮动飘窗`;
    $.msg($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    resolve();
  });
}
async function doTask() {
  for (let item of $.taskVos) {
    if (item.taskType === 8) {
      //看看商品任务
      if (item.status === 1) {
        console.log(`准备做此任务：${item.taskName}`);
        for (let task of item.productInfoVos) {
          if (task.status === 1) {
            await jdsplit_collectScore(task.taskToken, item.taskId, task.itemId, 1);
            await $.wait(4000);
            await jdsplit_collectScore(task.taskToken, item.taskId, task.itemId, 0);
          }
        }
        await jdsplit_getLottery(item.taskId);
      } else if (item.status !== 4) {
        await jdsplit_getLottery(item.taskId);
        console.log(`${item.taskName}已做完`);
      }
    }
    if (item.taskType === 9) {
      //逛会场任务
      if (item.status === 1) {
        console.log(`准备做此任务：${item.taskName}`);
        for (let task of item.shoppingActivityVos) {
          if (task.status === 1) {
            await jdsplit_collectScore(task.taskToken, item.taskId, task.itemId, 1);
            await $.wait(4000);
            await jdsplit_collectScore(task.taskToken, item.taskId, task.itemId, 0);
          }
        }
        await jdsplit_getLottery(item.taskId);
      } else if (item.status !== 4) {
        await jdsplit_getLottery(item.taskId);
        console.log(`${item.taskName}已做完`);
      }
    }
  }
}

//领取做完任务的奖励
function jdsplit_collectScore(taskToken, taskId, itemId, actionType = 0) {
  return new Promise((resolve) => {
    let body = { appId: '1EFVXxg', taskToken: taskToken, taskId: taskId, itemId: itemId, actionType: actionType };
    $.post(taskPostUrl('harmony_collectScore', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} harmony_collectScore API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 1) {
              console.log(`任务领取成功`);
            } else if (data.data.bizCode === 0) {
              if (data.data.result.taskType === 6) {
                if (data.data.bizMsg === 'success') {
                  console.log(`助力成功`);
                }
              } else {
                console.log(`任务完成成功`);
              }
            } else {
              if (taskId === 6) {
                if (data.data.bizCode === 108 || data.data.bizMsg === '已达到助力上限') {
                  console.log(`助力机会已耗尽`);
                  $.canHelp = false;
                } else if (data.data.bizCode === 109 || data.data.bizMsg === '不能自己给自己助力') {
                  console.log(data.data.bizMsg);
                } else if (data.data.bizCode === -1001 || data.data.bizMsg === '活动太火爆啦') {
                  console.log(data.data.bizMsg);
                  $.canHelp = false;
                } else if (data.data.bizCode === 104 || data.data.bizMsg === '您今日已为好友助力过了哦~') {
                  console.log(data.data.bizMsg);
                } else if (data.data.bizCode === 103 || data.data.bizMsg === '助力已满员！谢谢你哦~') {
                  console.log(data.data.bizMsg);
                  $.delcode = true;
                } else {
                  console.log(JSON.stringify(data));
                }
              } else {
                console.log(`${data.data.bizMsg}`);
              }
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

// 抽奖
function jdsplit_getLottery(taskId) {
  return new Promise((resolve) => {
    let body = { appId: '1EFVXxg', taskId: taskId };
    $.post(taskPostUrl('splitHongbao_getLotteryResult', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} splitHongbao_getLotteryResult API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              console.log(`红包领取结果：${data.data.result.userAwardsCacheDto.redPacketVO.name}`);
              console.log(`获得：${data.data.result.userAwardsCacheDto.redPacketVO.value || 0}红包`);
            } else {
              console.log(JSON.stringify(data));
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

function jdsplit_getTaskDetail() {
  return new Promise((resolve) => {
    $.post(taskPostUrl('splitHongbao_getHomeData', { appId: '1EFVXxg', taskToken: '' }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} splitHongbao_getHomeData API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              $.taskVos = data.data.result.taskVos; //任务列表
              $.taskVos.map((item) => {
                if (item.taskType === 6) {
                  console.log(`\n您的${$.name}好友助力邀请码：${item.assistTaskDetailVo.taskToken}\n`);
                  if (item.times < item.maxTimes) {
                    $.shareCodes.push(item.assistTaskDetailVo.taskToken);
                  }
                }
              });
              if (data.data.result.userInfo.lotteryNum > 0) {
                for (let i = data.data.result.userInfo.lotteryNum; i > 0; i--) {
                  await jdsplit_getLottery('');
                  await $.wait(1000);
                }
              }
            } else {
              if (data.data.bizCode === -1001 || data.data.bizMsg === '活动太火爆啦') {
                console.log(data.data.bizMsg);
                $.hot = true;
              }
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

function taskPostUrl(function_id, body = {}) {
  return {
    url: JD_API_HOST,
    body: `functionId=${function_id}&body=${JSON.stringify(body)}&client=wh5&clientVersion=1.0.0`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://h5.m.jd.com',
      'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://h5.m.jd.com/',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
    },
  };
}

function getAuthorShareCode(url) {
  return new Promise(async (resolve) => {
    const options = {
      url: `${url}?${new Date()}`,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88',
      },
    };
    if ($.isNode() && process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
      const tunnel = require('tunnel');
      const agent = {
        https: tunnel.httpsOverHttp({
          proxy: {
            host: process.env.TG_PROXY_HOST,
            port: process.env.TG_PROXY_PORT * 1,
          },
        }),
      };
      Object.assign(options, { agent });
    }
    $.get(options, async (err, resp, data) => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        // $.logErr(e, resp)
      } finally {
        resolve();
      }
    });
    await $.wait(10000);
    resolve();
  });
}

function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      headers: {
        Accept: 'application/json,text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        Cookie: cookie,
        Referer: 'https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
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
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === 0) {
              $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
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

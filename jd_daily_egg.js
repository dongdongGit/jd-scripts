/*
Last Modified time: 2020-11-20 14:11:01
活动入口：京东金融-天天提鹅
定时收鹅蛋,兑换金币
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#天天提鹅
10 * * * * jd_daily_egg.js, tag=天天提鹅, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdte.png, enabled=true
================Loon==============
[Script]
cron "10 * * * *" script-path=jd_daily_egg.js,tag=天天提鹅
===============Surge=================
天天提鹅 = type=cron,cronexp="10 * * * *",wake-system=1,timeout=3600,script-path=jd_daily_egg.js
============小火箭=========
天天提鹅 = type=cron,script-path=jd_daily_egg.js, cronexpr="10 * * * *", timeout=3600, enable=true
 */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('天天提鹅');
let cookiesArr = [],
  cookie = '';
const JD_API_HOST = 'https://ms.jr.jd.com/gw/generic/uc/h5/m';
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const dailyEggUrl = 'https://active.jd.com/forever/btgoose/?channelLv=yxjh&jrcontainer=h5&jrlogin=true';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const { JSDOM } = $.isNode() ? require('jsdom') : '';
const { window } = new JSDOM(``, { url: dailyEggUrl, runScripts: 'outside-only', pretentToBeVisual: true, resources: 'usable' });
const Faker = require('./utils/JDSignValidator.js');
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  window.eval(await downloadUrl(`https://storage.360buyimg.com/rama/common/btgoose/aar.min.js`));
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.stopNext = false;
      await $.totalBean();
      console.log(`\n***********开始【京东账号${$.index}】${$.nickName || $.UserName}********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      const fakerBody = Faker.getBody(dailyEggUrl);
      $.fp = fakerBody.fp;
      $.eid = await getClientData(fakerBody);
      $.token = (await downloadUrl('https://gia.jd.com/m.html')).match(/var\s*?jd_risk_token_id\s*?=\s*["`'](\S*?)["`'];?/)?.[1] || '';
      await jdDailyEgg();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
async function jdDailyEgg() {
  await toDailyHome();
  if ($.stopNext) return;
  if ($.isFirstLogin) {
    await toDailySignIn();
  }
  await toWithdraw();
  await doTask();
  await toGoldExchange();
}

async function doTask(funcMissionId = null) {
  let errMissionID = [3410];
  errMissionID = [...errMissionID, ...errMissionID.map((x) => x.toString())];
  const taskWaitTime = 15;
  let res;
  let taskList = (await doApi('queryGooseTaskList', false))?.data ?? [];
  taskList = taskList.filter((x) => [-1, 0, 1].includes(x.status) && !errMissionID.includes(x.missionId));
  if (funcMissionId) taskList = taskList.filter((x) => x.missionId === funcMissionId);
  for (let task of taskList) {
    let { doLink, missionId, awards, name, position, status } = task;
    switch (status) {
      case -1:
        res = await doApi('receiveGooseTask', false, { missionId });
        console.log(`领任务'${name}'结果：${res.code === '0000' ? '成功！' : `失败！原因：${res.msg}`}`);
        await $.wait(3000);
        if (res.code === '0000') {
          await doTask(missionId);
          return;
        }
        break;
      // 正在做
      case 0:
        var tempBody = {};
        Object.assign(tempBody, { missionId: doLink.getValByKey('missionId'), readTime: +(doLink.getValByKey('readTime') || '-1') });
        if (tempBody.missionId && typeof tempBody.readTime !== -1) {
          res = await doApi('queryMissionReceiveAfterStatus', false, { missionId: tempBody.missionId });
          await $.wait(tempBody.readTime * 1e3);
          res = await doApi('finishReadMission', false, tempBody);
          if (res.code === '0000') {
            await doTask(missionId);
          } else {
            console.log(`做任务'${name}'结果：失败！原因：${res.msg}`);
          }
          return;
        } else if (doLink.getValByKey('juid')) {
          res = await doApi('getJumpInfo', false, { juid: doLink.getValByKey('juid') });
          if (res.code === '0000') {
            await doTask(missionId);
          } else {
            console.log(`做任务'${name}'结果：失败！原因：${res.msg}`);
          }
          return;
        }
        break;
      // 领奖状态
      case 1:
        awards = awards[0] ?? awards;
        let { awardRealNum, awardName } = awards;
        let msg = [];
        msg.push(funcMissionId ? `做任务'${name}'结果：成功！` : `任务'${name}'已可领奖。`);
        msg.push('领奖励结果：');
        res = await doApi('receiveGooseTaskReward', false, { missionId });
        msg.push(res.code === '0000' ? `成功！获得${awardRealNum}${awardName.replace(/^个?/, '个')}` : `失败！原因：${res.msg}`);
        console.log(msg.join(''));
        break;
      // 已完成
      case 2:
      default:
    }
  }
}

function toGoldExchange() {
  return new Promise(async (resolve) => {
    const body = getBody();
    $.get(taskUrl('toGoldExchange', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.code === '0000') {
                console.log(`兑换金币:${data.resultData.data.cnumber}`);
                console.log(`当前总金币:${data.resultData.data.goldTotal}`);
              } else if (data.resultData.code !== '0000') {
                console.log(`兑换金币失败:${data.resultData.msg}`);
              }
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
function toWithdraw() {
  return new Promise(async (resolve) => {
    const body = getBody();
    $.get(taskUrl('toWithdraw', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.code === '0000') {
                console.log(`收取鹅蛋:${data.resultData.data.eggTotal}个成功`);
                console.log(`当前总鹅蛋数量:${data.resultData.data.userLevelDto.userHaveEggNum}`);
              } else if (data.resultData.code !== '0000') {
                console.log(`收取鹅蛋失败:${data.resultData.msg}`);
              }
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
function toDailyHome() {
  $.isFirstLogin = false;
  return new Promise(async (resolve) => {
    const body = getBody(true);
    $.get(taskUrl('toDailyHome', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data);
            if (data.resultData.code !== '0000') {
              $.stopNext = true;
              console.log($.name + `（${arguments.callee.name}）` + '：' + data.resultData.msg);
              return;
            }
            let shareUuid = data?.resultData?.data?.shareUuid;
            if (!$.shareUuid && typeof shareUuid === 'string') Object.assign($, { shareUuid });
            let isFirstLogin = data?.resultData?.data?.isFristLogin;
            if (typeof isFirstLogin === 'string') {
              $.isFirstLogin = (() => {
                try {
                  return JSON.parse(isFirstLogin);
                } catch (e) {
                  return false;
                }
              })();
            } else if (typeof isFirstLogin === 'boolean') {
              Object.assign($, { isFirstLogin });
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
function ots(t) {
  if (typeof t === 'object') {
    return JSON.stringify(t);
  }
  return t;
}
async function doApi(functionId = '', withSign = false, preBody = {}, preUrl = '') {
  let body = { ...preBody, ...getBody(withSign) };
  switch (functionId) {
    case 'receiveGooseTask':
      body = {
        missionId: preBody.missionId.toString(),
        shareUuid: $.inviteId ?? '',
        riskDeviceInfo: $.riskDeviceInfo,
        channelLv: 'yxjh',
        environment: 'jrApp',
      };
      break;
    case 'receiveGooseTaskReward':
      body = {
        missionId: preBody.missionId.toString(),
        riskDeviceInfo: $.riskDeviceInfo,
        channelLv: 'yxjh',
        environment: 'jrApp',
      };
      break;
    case 'queryMission':
    case 'queryPlayActiveHelper':
    case 'queryMissionReceiveAfterStatus':
    case 'finishReadMission':
    case 'getJumpInfo':
      preUrl = `https://ms.jr.jd.com/gw/generic/mission/h5/m/${functionId}?reqData=`;
      preUrl += JSON.stringify(preBody).replace(/"/g, (x) => encodeURIComponent(x));
      break;
    default:
      break;
  }
  const option = taskUrl(functionId, body);
  if (preUrl) {
    Object.assign(option, { url: preUrl });
  }
  return new Promise((resolve) => {
    $.get(option, (err, resp, data) => {
      const res = {};
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data);
            if (data.resultCode !== 0) {
              console.log($.name + `（${functionId}）` + '：' + data.resultMsg);
            } else {
              Object.assign(res, data?.resultData ?? {});
            }
          } else {
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(res);
      }
    });
  });
}
function toDailySignIn() {
  const body = getBody();
  return new Promise((resolve) => {
    $.get(taskUrl('toDailySignIn', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            // console.log(data)
            data = JSON.parse(data);
            if (data.resultData.code !== '0000') {
              $.stopNext = true;
              console.log($.name + `（${arguments.callee.name}）` + '：' + data.resultData.msg);
              return;
            }
            console.log('每日首次登陆签到礼包：' + ots(data.resultData.data.signAward));
          } else {
            console.log(`京东服务器返回空数据`);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        $.isFirstLogin = false;
        resolve();
      }
    });
  });
}
function getBody(withSign = true) {
  const riskDeviceInfo = ($.riskDeviceInfo = JSON.stringify({
    eid: $.eid,
    fp: $.fp,
    token: $.token,
  }));
  const signData = {
    channelLv: 'yxjh',
    environment: 'jrApp',
    riskDeviceInfo,
    shareUuid: 'uuid',
  };
  if ($.isFirstLogin) {
    delete signData.riskDeviceInfo;
  }
  if (!withSign) {
    return {
      ...signData,
      timeSign: Math.random(),
    };
  }
  $.aar = new window.AAR();
  const nonce = $.aar.nonce();
  const signature = $.aar.sign(JSON.stringify(signData), nonce);
  return {
    ...signData,
    timeSign: Math.random(),
    nonce,
    signature,
  };
}

function taskUrl(function_id, body) {
  return {
    url: `${JD_API_HOST}/${function_id}?reqData=${JSON.stringify(body).replace(/"/g, (x) => encodeURIComponent(x))}`,
    headers: {
      Accept: `application/json`,
      Origin: `https://active.jd.com`,
      'Accept-Encoding': `gzip, deflate, br`,
      Cookie: cookie,
      'Content-Type': `application/x-www-form-urlencoded;charset=UTF-8`,
      Host: `ms.jr.jd.com`,
      Connection: `keep-alive`,
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: dailyEggUrl,
      'Accept-Language': `zh-cn`,
    },
  };
}
function getClientData(fakerBody) {
  return new Promise((resolve) => {
    const options = {
      url: `https://gia.jd.com/fcf.html?a=${fakerBody.a}`,
      body: `d=${fakerBody.d}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${JSON.stringify(arguments)}: API查询请求失败 ‼️‼️`);
          throw new Error(err);
        } else {
          if (data.indexOf('*_*') > 0) {
            data = data.split('*_*', 2);
            data = JSON.parse(data[1]).eid;
          } else {
            console.log(`京东api返回数据为空，请检查自身原因`);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data || '');
      }
    });
  });
}
function downloadUrl(url) {
  return new Promise((resolve) => {
    const options = {
      url,
      timeout: 10000,
      followRedirect: false,
      headers: {
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.get(options, async (err, resp, data) => {
      let res = '';
      try {
        if (err) {
          console.log(`⚠️网络请求失败`);
        } else {
          res = data;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(res);
      }
    });
  });
}
String.prototype.getValByKey = function (str) {
  const reg = new RegExp(`(^|\\?|&)${str}\=(.*?)(&|$)`);
  let res = '';
  if (reg.test(this)) {
    res = this.match(reg)[2];
  }
  return res;
};

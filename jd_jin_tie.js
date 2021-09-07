/*
领金贴(只做签到以及互助任务里面的部分任务)
活动入口：京东APP首页-领金贴，[活动地址](https://active.jd.com/forever/cashback/index/)
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
=================QuantumultX==============
[task_local]
#领金贴
10 15 * * * jd_jin_tie.js, tag=领金贴, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
===========Loon===============
[Script]
cron "10 15 * * *" script-path=jd_jin_tie.js,tag=领金贴
=======Surge===========
领金贴 = type=cron,cronexp="10 15 * * *",wake-system=1,timeout=3600,script-path=jd_jin_tie.js
==============小火箭=============
领金贴 = type=cron,script-path=jd_jin_tie.js, cronexpr="10 15 * * *", timeout=3600, enable=true
 */
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('领金贴');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message,
  allMessage = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
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
      await main();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function main() {
  try {
    await channelUserSignInfo_xh();
    await queryMission_xh();
    await channelUserSubsidyInfo_xh();
  } catch (e) {
    $.logErr(e);
  }
}

function channelUserSignInfo_xh() {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      source: 'JD_APP',
      channel: 'scljticon',
      channelLv: 'scljticon',
      apiVersion: '4.0.0',
      riskDeviceParam: `{\"macAddress\":\"\",\"imei\":\"\",\"eid\":\"\",\"openUUID\":\"\",\"uuid\":\"\",\"traceIp\":\"\",\"os\":\"\",\"osVersion\":\"\",\"appId\":\"\",\"clientVersion\":\"\",\"resolution\":\"\",\"channelInfo\":\"\",\"networkType\":\"\",\"startNo\":42,\"openid\":\"\",\"token\":\"\",\"sid\":\"\",\"terminalType\":\"\",\"longtitude\":\"\",\"latitude\":\"\",\"securityData\":\"\",\"jscContent\":\"\",\"fnHttpHead\":\"\",\"receiveRequestTime\":\"\",\"port\":80,\"appType\":\"\",\"deviceType\":\"\",\"fp\":\"\",\"ip\":\"\",\"idfa\":\"\",\"sdkToken\":\"\"}`,
      others: { shareId: '' },
    });
    const options = taskUrl_xh('channelUserSignInfo', body, 'jrm');
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.resultCode === 0) {
            if (data.resultData.code === '000') {
              $.keepSigned = 0;
              let state = false;
              for (let i in data.resultData.data.signDetail) {
                if (data.resultData.data.signDetail[i].signed) $.keepSigned += 1;
                if (data.resultData.data.dayId === data.resultData.data.signDetail[i].id) {
                  state = data.resultData.data.signDetail[i].signed;
                  console.log('获取签到状态成功', state ? '今日已签到' : '今日未签到', '连续签到', $.keepSigned, '天\n');
                }
              }
              if (!state) await channelSignInSubsidy_xh();
            } else {
              console.log('获取签到状态失败', data.resultData.msg);
            }
          } else {
            console.log('获取签到状态失败', data.resultMsg);
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

function channelSignInSubsidy_xh() {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      source: 'JD_APP',
      channel: 'scljticon',
      channelLv: 'scljticon',
      apiVersion: '4.0.0',
      riskDeviceParam: `{\"macAddress\":\"\",\"imei\":\"\",\"eid\":\"\",\"openUUID\":\"\",\"uuid\":\"\",\"traceIp\":\"\",\"os\":\"\",\"osVersion\":\"\",\"appId\":\"\",\"clientVersion\":\"\",\"resolution\":\"\",\"channelInfo\":\"\",\"networkType\":\"\",\"startNo\":42,\"openid\":\"\",\"token\":\"\",\"sid\":\"\",\"terminalType\":\"\",\"longtitude\":\"\",\"latitude\":\"\",\"securityData\":\"\",\"jscContent\":\"\",\"fnHttpHead\":\"\",\"receiveRequestTime\":\"\",\"port\":80,\"appType\":\"\",\"deviceType\":\"\",\"fp\":\"\",\"ip\":\"\",\"idfa\":\"\",\"sdkToken\":\"\"}`,
      others: { shareId: '' },
    });
    const options = taskUrl_xh('channelSignInSubsidy', body, 'jrm');
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.resultCode === 0) {
            if (data.resultData.code === '000') {
              if (data.resultData.data.signSuccess) {
                console.log(`签到成功，获得 0.0${data.resultData.data.rewardAmount}元`);
              }
            } else if (data.resultData.code === '001') {
              console.log(`签到失败，可能今天已签到`);
            } else {
              // console.log(data)
              console.log('签到失败');
            }
          } else {
            // console.log(data)
            console.log('签到失败');
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

function queryMission_xh() {
  return new Promise((resolve) => {
    $.taskData = [];
    const options = {
      url: 'https://ms.jr.jd.com/gw/generic/mission/h5/m/queryMission?reqData=%7B%22channelCode%22:%22SUBSIDY2%22,%22riskDeviceParam%22:%22%7B%5C%22eid%5C%22:%5C%22%5C%22,%5C%22fp%5C%22:%5C%22%5C%22,%5C%22sdkToken%5C%22:%5C%22%5C%22,%5C%22token%5C%22:%5C%22%5C%22,%5C%22undefined%5C%22:%5C%22%5C%22%7D%22,%22channel%22:%22%22%7D',
      headers: {
        Accept: `*/*`,
        Origin: `https://u.jr.jd.com`,
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
        Referer: `https://u.jr.jd.com/`,
        'Accept-Language': `zh-cn`,
      },
    };
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.resultCode === 0) {
            if (data.resultData.code === '0000') {
              console.log('互动任务获取成功');
              $.taskData = data.resultData.data;
              for (let task of $.taskData) {
                if (task.missionId !== 4648) {
                  console.log(`\n任务id：${task.missionId} 任务状态：${task.status}`);
                  if (task.status === -1) {
                    console.log(`正在做任务：${task.missionId}`);
                    await receiveMission_xh(task.missionId);
                    await queryMissionReceiveAfterStatus_xh(task.missionId);
                  } else if (task.status === 0) {
                    await queryMissionReceiveAfterStatus_xh(task.missionId);
                  } else if (task.status === 1) {
                    console.log(`正在领取任务：${task.missionId} 奖励`);
                    await awardMission_xh(task.missionId);
                  } else if (task.status === 2) {
                    console.log(`任务id：${task.missionId} 已完成`);
                  }
                }
              }
            } else {
              console.log('获取互动任务失败', data);
            }
          } else {
            console.log('获取互动任务失败', data);
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

function receiveMission_xh(missionId) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      missionId: `${missionId}`,
      channelCode: 'SUBSIDY2',
      timeStamp: new Date().toString(),
      env: 'JDAPP',
    });
    const options = taskUrl_xh('receiveMission', body);
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.resultCode === 0) {
            if (data.resultData.code === '0000') {
              if (data.resultData.success) {
                console.log('领取任务成功');
              }
            } else if (data.resultData.code === '0005') {
              console.log('已经接取过该任务');
            } else {
              console.log('领取任务失败', data);
            }
          } else {
            console.log('领取任务失败', data);
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

function queryMissionReceiveAfterStatus_xh(taskId) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ missionId: `${taskId}` });
    const options = taskUrl_xh('queryMissionReceiveAfterStatus', body);
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.resultCode === 0) {
            if (data.resultData.code === '0000') {
              console.log('正在浏览，等待10s');
              await $.wait(10000);
              await finishReadMission_xh(`${taskId}`);
            } else if (data.resultData.code === '0003') {
              console.log('任务浏览失败', '非法参数');
            } else if (data.resultData.code === '0001') {
              console.log('任务浏览失败', '状态不正确');
            } else {
              console.log('任务浏览失败', data);
            }
          } else {
            console.log('任务浏览失败', data);
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

function finishReadMission_xh(missionId) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      missionId: `${missionId}`,
      readTime: 10,
    });
    const options = taskUrl_xh('finishReadMission', body);
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.resultCode === 0) {
            if (data.resultData.code === '0000') {
              if (data.resultData.success) {
                console.log('任务执行成功');
                await awardMission_xh(missionId);
              }
            } else if (data.resultData.code === '0001' || data.resultData.code === '0004') {
              console.log('状态不正确');
            } else {
              console.log('任务执行失败', data);
            }
          } else {
            console.log('任务执行失败', data);
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

function awardMission_xh(missionId) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      missionId: `${missionId}`,
      channelCode: 'SUBSIDY2',
      timeStamp: new Date().toString(),
      env: 'JDAPP',
    });
    const options = taskUrl_xh('awardMission', body);
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.resultCode === 0) {
            if (data.resultData.code === '0000') {
              if (data.resultData.success) {
                console.log('领取金贴成功');
              }
            } else if (data.resultData.code === '0004') {
              console.log('不满足领奖条件，可能已经完成');
            } else {
              console.log('领取金贴失败', data);
            }
          } else {
            console.log('领取金贴失败', data);
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

function channelUserSubsidyInfo_xh() {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      source: 'JD_APP',
      channel: 'scljticon',
      channelLv: 'scljticon',
      apiVersion: '4.0.0',
      riskDeviceParam: `{\"macAddress\":\"\",\"imei\":\"\",\"eid\":\"\",\"openUUID\":\"\",\"uuid\":\"\",\"traceIp\":\"\",\"os\":\"\",\"osVersion\":\"\",\"appId\":\"\",\"clientVersion\":\"\",\"resolution\":\"\",\"channelInfo\":\"\",\"networkType\":\"\",\"startNo\":42,\"openid\":\"\",\"token\":\"\",\"sid\":\"\",\"terminalType\":\"\",\"longtitude\":\"\",\"latitude\":\"\",\"securityData\":\"\",\"jscContent\":\"\",\"fnHttpHead\":\"\",\"receiveRequestTime\":\"\",\"port\":80,\"appType\":\"\",\"deviceType\":\"\",\"fp\":\"\",\"ip\":\"\",\"idfa\":\"\",\"sdkToken\":\"\"}`,
      others: { shareId: '' },
    });
    const options = taskUrl_xh('channelUserSubsidyInfo', body, 'jrm');
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.resultCode === 0) {
            if (data.resultData.code === '000') {
              console.log(`\n京东账号${$.index} ${$.nickName || $.UserName} 当前总金贴：${data.resultData.data.availableAmount}元`);
            } else {
              console.log('获取当前总金贴失败', data);
            }
          } else {
            console.log('获取当前总金贴失败', data);
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

function taskUrl_xh(function_id, body, type = 'mission') {
  return {
    url: `https://ms.jr.jd.com/gw/generic/${type}/h5/m/${function_id}?reqData=${encodeURIComponent(body)}`,
    headers: {
      Accept: `*/*`,
      Origin: `https://u.jr.jd.com`,
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
      Referer: `https://u.jr.jd.com/`,
      'Accept-Language': `zh-cn`,
    },
  };
}

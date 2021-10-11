/*
*
活动入口：京东金融APP-签到-天天拼图
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
京东金融天天拼图
20 0,16 * * * jd_ttpt.js, tag=京东金融天天拼图, enabled=true
================Loon==============
[Script]
cron "20 0,16 * * *" script-path=jd_ttpt.js,tag=京东金融天天拼图
===============Surge=================
京东金融天天拼图 = type=cron,cronexp="20 0,16 * * *",wake-system=1,timeout=20,script-path=jd_ttpt.js
============小火箭============
京东金融天天拼图 = type=cron,script-path=jd_ttpt.js, cronexpr="20 0,16 * * *", timeout=3600, enable=true
*
*/
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('天天拼图');
const url = require('url');
let cookiesArr = [],
  cookie = '',
  allMessage = '';
const JD_API_HOST = 'https://ms.jr.jd.com/gw/generic/uc/h5/m';
const MISSION_BASE_API = `https://ms.jr.jd.com/gw/generic/mission/h5/m`;
const domainUrl = 'https://uua.jr.jd.com/mem-channel/polymerization/?channelLv=syicon&jrcontainer=h5&jrlogin=true';
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
  if (process.env.PIGPETSHARECODES) {
    shareId = process.env.PIGPETSHARECODES;
  }
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  console.log(`\n活动入口：京东金融APP->签到->天天拼图\n`);
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.canRun = true;
      await $.totalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
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
    await getNewMissions(); //领取任务
    if (!$.canRun) return;
    await getNewMissions(); //重新查询任务
    await missions();
    await grantAward();
  } catch (e) {
    $.logErr(e);
  }
}

async function missions() {
  for (let item of $.workVoList) {
    if (item.workStatus === 1) {
      console.log(`\n【${item.workName}】任务已做完,开始领取奖励`);
      await getAwardFromMc(item.mid);
      await $.wait(1000);
    } else if (item.workStatus === 2) {
      console.log(`\n${item.workName}已完成`);
    } else if (item.workStatus === -1) {
      console.log(`\n${item.workName}未领取`);
      await receiveMission(item.mid);
    } else if (item.workStatus === 0) {
      console.log(`\n执行【${item.workName}】任务`);
      let parse;
      if (item.url) {
        parse = url.parse(item.url, true, true);
      } else {
        parse = {};
      }
      if (parse.query && parse.query.readTime) {
        await queryMissionReceiveAfterStatus(parse.query.missionId);
        await $.wait(parse.query.readTime * 1000);
        await finishReadMission(parse.query.missionId, parse.query.readTime);
        await $.wait(1000);
        await getAwardFromMc(parse.query.missionId);
      } else if (parse.query && parse.query.juid) {
        await getJumpInfo(parse.query.juid);
        await $.wait(4000);
      }
    }
  }
}

//领取做完任务的奖品
function getAwardFromMc(missionId) {
  return new Promise(async (resolve) => {
    const body = {
      source: 1,
      awardType: 2,
      missionId: missionId,
      riskDeviceParam: '{}',
      domainUrl: domainUrl,
    };
    $.post(taskUrl('getAwardFromMc', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.code === '200') {
                if (data.resultData.data) {
                  if (data.resultData.data.nextStatus) {
                    console.log(`\n奖励${data.resultData.data.opMsg}`);
                  }
                }
              } else {
                console.log(`其他情况：${JSON.stringify(data)}`);
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

//查询任务列表
async function getNewMissions() {
  return new Promise(async (resolve) => {
    const body = {
      source: 1,
      awardType: 2,
      riskDeviceParam: '{}',
      domainUrl: domainUrl,
    };
    $.post(taskUrl('getNewMissions', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getNewMissions API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.code === '200') {
                if (data.resultData.data.result) {
                  $.workVoList = data.resultData.data.result[0].workVoList;
                  $.awardStatus = data.resultData.data.result[0].awardStatus;
                  if (!$.awardStatus) {
                    for (let item of $.workVoList) {
                      if (item.workStatus === -1) {
                        console.log(`\n领取【${item.workName}】任务`);
                        await receiveMission(item.mid);
                      }
                    }
                  }
                } else {
                  console.log(`\n获取任务失败：${JSON.stringify(data)}`);
                  $.canRun = false;
                }
              } else {
                console.log(`其他情况：${JSON.stringify(data)}`);
              }
            }
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

function receiveMission(missionId) {
  return new Promise(async (resolve) => {
    const body = {
      source: 1,
      awardType: 2,
      missionId: missionId,
      riskDeviceParam: '{}',
      domainUrl: domainUrl,
    };
    $.post(taskUrl('receiveMission', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getNewMissions API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.code === '200') {
              } else {
                console.log(`其他情况：${JSON.stringify(data)}`);
              }
            }
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

function grantAward() {
  return new Promise(async (resolve) => {
    const body = {
      source: 1,
      riskDeviceParam: '{}',
      domainUrl: domainUrl,
    };
    $.post(taskUrl('grantAward', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} grantAward API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.resultCode === 0) {
              if (data.resultData.code === '200') {
                console.log(`\n终极宝箱开启${data.resultData.msg}\n`);
              } else {
                console.log(`其他情况：${JSON.stringify(data)}`);
              }
            }
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

function getJumpInfo(juid) {
  return new Promise(async (resolve) => {
    const body = { juid: juid };
    const options = {
      url: `${MISSION_BASE_API}/getJumpInfo?reqData=${escape(JSON.stringify(body))}`,
      headers: {
        Host: 'ms.jr.jd.com',
        Origin: 'https://active.jd.com',
        Connection: 'keep-alive',
        Accept: 'application/json',
        Cookie: cookie,
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148/application=JDJR-App&deviceId=1423833363730383d273532393d243445364-d224341443d2938333530323445433033353&eufv=1&clientType=ios&iosType=iphone&clientVersion=6.1.70&HiClVersion=6.1.70&isUpdate=0&osVersion=13.7&osName=iOS&platform=iPhone 6s (A1633/A1688/A1691/A1700)&screen=667*375&src=App Store&netWork=1&netWorkType=1&CpayJS=UnionPay/1.0 JDJR&stockSDK=stocksdk-iphone_3.5.0&sPoint=&jdPay=(*#@jdPaySDK*#@jdPayChannel=jdfinance&jdPayChannelVersion=6.1.70&jdPaySdkVersion=3.00.52.00&jdPayClientName=iOS*#@jdPaySDK*#@)',
        'Accept-Language': 'zh-cn',
        Referer: 'https://u1.jr.jd.com/uc-fe-wxgrowing/cloudpig/index/',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            console.log('getJumpInfo', data);
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

function queryMissionReceiveAfterStatus(missionId) {
  return new Promise((resolve) => {
    const body = { missionId: missionId };
    const options = {
      url: `${MISSION_BASE_API}/queryMissionReceiveAfterStatus?reqData=${escape(JSON.stringify(body))}`,
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        Connection: 'keep-alive',
        Host: 'ms.jr.jd.com',
        Cookie: cookie,
        Origin: 'https://jdjoy.jd.com',
        Referer: 'https://jdjoy.jd.com/',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            console.log('queryMissionReceiveAfterStatus', data);
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

//做完浏览任务发送信息API
async function finishReadMission(missionId, readTime) {
  return new Promise(async (resolve) => {
    const body = { missionId: missionId, readTime: readTime * 1 };
    const options = {
      url: `${MISSION_BASE_API}/finishReadMission?reqData=${escape(JSON.stringify(body))}`,
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        Connection: 'keep-alive',
        Host: 'ms.jr.jd.com',
        Cookie: cookie,
        Origin: 'https://jdjoy.jd.com',
        Referer: 'https://jdjoy.jd.com/',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            console.log('finishReadMission', data);
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

function taskUrl(function_id, body) {
  return {
    url: `${JD_API_HOST}/${function_id}`,
    body: `reqData=${encodeURIComponent(JSON.stringify(body))}`,
    headers: {
      Accept: `*/*`,
      Origin: `https://u.jr.jd.com`,
      'Accept-Encoding': `gzip, deflate, br`,
      Cookie: cookie,
      'Content-Type': `application/x-www-form-urlencoded;charset=UTF-8`,
      Host: `ms.jr.jd.com`,
      Connection: `keep-alive`,
      'User-Agent': `jdapp;android;8.5.12;9;network/wifi;model/GM1910;addressid/1302541636;aid/ac31e03386ddbec6;oaid/;osVer/28;appBuild/73078;adk/;ads/;pap/JA2015_311210|8.5.12|ANDROID 9;osv/9;pv/117.24;jdv/0|kong|t_1000217905_|jingfen|644e9b005c8542c1ac273da7763971d8|1589905791552|1589905794;ref/com.jingdong.app.mall.WebActivity;partner/oppo;apprpd/Home_Main;Mozilla/5.0 (Linux; Android 9; GM1910 Build/PKQ1.190110.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36 Edg/86.0.4240.111`,
      Referer: `https://u.jr.jd.com/`,
      'Accept-Language': `zh-cn`,
    },
  };
}

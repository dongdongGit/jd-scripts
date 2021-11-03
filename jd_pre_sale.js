/*
预售福利机
助力逻辑：CK1 助力作者，其余账号助力CK1 CK1活动火爆按顺序顺延
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
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
let joinIdInfo = {},
  AuthorizationInfo = {};
let num;
$.shareCodes = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://www.kmg-jd.com/api';
let allMessage = '';
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
      $.joinId = '';
      $.lkToken = '';
      $.Authorization = '';
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
      num = 0;
      await jdYs();
      joinIdInfo[$.UserName] = $.joinId;
      AuthorizationInfo[$.UserName] = $.Authorization;
    }
  }
  let res = await getAuthorShareCode('https://raw.githubusercontent.com/Aaron-lv/updateTeam/master/shareCodes/ys.json');
  if (!res) {
    $.http
      .get({ url: 'https://purge.jsdelivr.net/gh/Aaron-lv/updateTeam@master/shareCodes/ys.json' })
      .then((resp) => {})
      .catch((e) => console.log('刷新CDN异常', e));
    await $.wait(1000);
    res = await getAuthorShareCode('https://cdn.jsdelivr.net/gh/Aaron-lv/updateTeam@master/shareCodes/ys.json');
  }
  $.shareCodes = [...new Set([...$.shareCodes, ...(res || [])])];
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.canHelp = true;
    if (joinIdInfo[$.UserName]) {
      $.joinId = joinIdInfo[$.UserName];
      $.Authorization = AuthorizationInfo[$.UserName];
    } else {
      continue;
    }
    if (i === 0) {
      let shareCodes = res[Math.floor(Math.random() * res.length)] || [];
      if (shareCodes && shareCodes.length) {
        console.log(`\n开始互助\n`);
        for (let j = 0; j < shareCodes.length && $.canHelp; j++) {
          console.log(`CK1 账号${$.UserName} 去助力作者 ${shareCodes[j]}`);
          $.delcode = false;
          await share(shareCodes[j]);
          await $.wait(2000);
          if ($.delcode) {
            shareCodes.splice(j, 1);
            j--;
            continue;
          }
        }
      } else {
        break;
      }
    } else {
      if ($.shareCodes && $.shareCodes.length) {
        console.log(`\n开始互助\n`);
        for (let j = 0; j < $.shareCodes.length && $.canHelp; j++) {
          console.log(`账号${$.UserName} 去助力 ${$.shareCodes[j]}`);
          $.delcode = false;
          await share($.shareCodes[j]);
          await $.wait(2000);
          if ($.delcode) {
            $.shareCodes.splice(j, 1);
            j--;
            continue;
          }
        }
      } else {
        break;
      }
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function jdYs() {
  await getActiveInfo();
  if (!$.appId) return;
  await getToken();
  if (!$.lkToken) return;
  await verify();
  if (!$.Authorization) return;
  await active();
  await active('', false);
}

async function getActiveInfo(url = 'https://prodev.m.jd.com/mall/active/3QvpPkepEuB5hRgtQvWJ2bjRTCA8/index.html') {
  let options = {
    url,
    headers: {
      Host: 'prodev.m.jd.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
    },
  };
  return new Promise(async (resolve) => {
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getActiveInfo API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data && data.match(/window\.performance.mark\(e\)}}\((.*)\);<\/script>/)[1]);
            for (let key of Object.keys(data.codeFloors)) {
              let vo = data.codeFloors[key];
              if (vo.boardParams && vo.boardParams.appId) {
                $.appId = vo.boardParams.appId;
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

async function getToken() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jdjoy.jd.com/saas/framework/encrypt/pin?appId=${$.appId}`,
      headers: {
        Host: 'jdjoy.jd.com',
        Accept: 'application/json, text/plain, */*',
        Origin: 'https://prodev.m.jd.com',
        Referer: 'https://prodev.m.jd.com/',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
        Cookie: cookie,
      },
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getToken API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.success) {
              $.lkToken = data.data.lkToken;
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
function verify() {
  return new Promise((resolve) => {
    $.post(taskUrl(`user/verify`, { parameters: { userId: '', lkToken: $.lkToken, username: 'sdfas' } }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} verify API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 200) {
              $.Authorization = data.token;
            } else if (data.code === 403) {
              console.log(`活动太火爆了，还是去买买买吧！！！`);
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
function active(shareId = null, type = true) {
  return new Promise((resolve) => {
    $.post(
      taskUrl(`presaleGift/active`, { attributes: { activeId: 'presaleGiftD9gBzawG', shareId: shareId, lkToken: $.lkToken, valueDay: new Date().Format('yyyyMMdd') } }),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(JSON.stringify(err));
            console.log(`${$.name} active API请求失败，请检查网路重试`);
          } else {
            if (jd_helpers.safeGet(data)) {
              data = JSON.parse(data);
              if (data.code === 200) {
                if (type) {
                  if (!shareId) {
                    $.joinId = data.data.userVO.joinId;
                    console.log(`【京东账号${$.index}（${$.UserName}）的预售福利机好友互助码】${$.joinId}`);
                    $.shareCodes.push($.joinId);
                    for (let key of Object.keys(data.data.jobMap)) {
                      let vo = data.data.jobMap[key];
                      if (key === 'sign' || key === 'channel' || key === 'viewLive' || key === 'viewWare' || key === 'followShop') {
                        for (let details of vo.details) {
                          console.log(`去做【${details.title}】`);
                          if (!details.done) {
                            await job(vo.jobForm, details.config);
                            if (key === 'viewLive' || key === 'viewWare') {
                              await $.wait(5 * 1000);
                            } else {
                              await $.wait(2 * 1000);
                            }
                          } else {
                            console.log(`任务已完成`);
                          }
                        }
                      }
                    }
                  }
                } else {
                  let num = Math.floor(data.data.userVO.points / data.data.needDrawPoints);
                  if (num === 0) {
                    console.log(`\n无可抽奖次数`);
                  } else {
                    console.log(`\n抽奖次数：${num}，开始抽奖`);
                  }
                  $.stop = false;
                  for (let i = 0; i < num && !$.stop; i++) {
                    await lottery();
                    await $.wait(2000);
                  }
                }
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}
function job(jobForm, jobDetail) {
  return new Promise((resolve) => {
    $.post(
      taskUrl(`presaleGift/job`, { attributes: { activeId: 'presaleGiftD9gBzawG', joinId: $.joinId, jobForm: jobForm, jobDetail: jobDetail, valueDay: new Date().Format('yyyyMMdd') } }),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(JSON.stringify(err));
            console.log(`${$.name} job API请求失败，请检查网路重试`);
          } else {
            if (jd_helpers.safeGet(data)) {
              data = JSON.parse(data);
              if (data.code === 200) {
                console.log(data.data.signDays > 0 ? `签到成功：签到${data.data.signDays}天，获得${data.data.val}金币` : `完成成功：获得${data.data.val}金币`);
              } else {
                console.log(`完成失败：${data.msg}`);
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}
function lottery() {
  return new Promise((resolve) => {
    $.post(taskUrl(`presaleGift/lottery`, { attributes: { activeId: 'presaleGiftD9gBzawG', joinId: $.joinId, lotteryForm: 0 } }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} lottery API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 200) {
              if (data.data) {
                console.log(`抽奖成功：获得${data.data.awardVal}${data.data.awardName}`);
                num = 0;
              } else {
                console.log(`抽奖成功：获得空气~`);
                num++;
                if (num === 5) $.stop = true;
              }
            } else {
              console.log(`抽奖失败：${data.msg}`);
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
function share(shareId) {
  return new Promise((resolve) => {
    $.post(taskUrl(`presaleGift/share`, { attributes: { activeId: 'presaleGiftD9gBzawG', joinId: $.joinId, shareId: shareId, valueDay: new Date().Format('yyyyMMdd') } }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} share API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 200) {
              if (data.data.helpStatus === 1) {
                console.log(`助力成功`);
              } else if (data.data.helpStatus === 4) {
                console.log(`助力失败：无助力次数`);
                $.canHelp = false;
              } else if (data.data.helpStatus === 0) {
                console.log(`助力失败：不能助力自己`);
              } else if (data.data.helpStatus === 2) {
                console.log(`助力失败：已助力过此好友`);
              } else {
                console.log(JSON.stringify(data));
              }
            } else {
              console.log(`助力失败：${data.msg}`);
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

function showMsg() {
  return new Promise((resolve) => {
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve();
  });
}

function taskUrl(functionId, body) {
  return {
    url: `${JD_API_HOST}/${functionId}`,
    body: JSON.stringify(body),
    headers: {
      Host: 'www.kmg-jd.com',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://www.kmg-jd.com',
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: $.Authorization ? $.Authorization : 'null',
      Referer: 'https://www.kmg-jd.com/presaleGift/index.html',
      'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
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
Date.prototype.Format = function (fmt) {
  //author: meizz
  var o = {
    'M+': this.getMonth() + 1, //月份
    'd+': this.getDate(), //日
    'h+': this.getHours(), //小时
    'm+': this.getMinutes(), //分
    's+': this.getSeconds(), //秒
    S: this.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o) if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
  return fmt;
};

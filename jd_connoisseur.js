/*
内容鉴赏官
更新时间：2021-09-09
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#内容鉴赏官
15 3,6 * * * jd_connoisseur.js, tag=内容鉴赏官, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

================Loon==============
[Script]
cron "15 3,6 * * *" script-path=jd_connoisseur.js,tag=内容鉴赏官

===============Surge=================
内容鉴赏官 = type=cron,cronexp="15 3,6 * * *",wake-system=1,timeout=3600,script-path=jd_connoisseur.js

============小火箭=========
内容鉴赏官 = type=cron,script-path=jd_connoisseur.js, cronexpr="15 3,6 * * *", timeout=3600, enable=true
 */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('内容鉴赏官');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
let isLoginInfo = {};
$.shareCodes = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/';
let agid = [],
  pageId,
  encodeActivityId,
  paginationFlrs,
  activityId;
let allMessage = '';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  let res = [
    { use: '18237091240_p', code: 'Sv_VxQxkZ_FXVJBqb1A' },
    { use: 'pluto.5218_m', code: 'S_qE2BEEH8FbWKHWp' },
    { use: 'jd_50f2be46743fc', code: 'S5KkcRR5P9waCJBzzkPRcJw' },
    { use: '15082992273_p', code: 'Sv_hzSBwQ_FbVJxmb1A' },
    { use: 'jd_680c996309fbf', code: 'S5KkcRhYZpl3eJhn0naFYIg' },
    { use: 'jd_5cd15c4b0807c', code: 'S5KkcRU1N9FGEJEj0nPcNJw' },
    { use: 'jd_TTcYfwuzDbnh', code: 'S5KkcJHpKnAKQZVCAxqlS' },
    { use: '%E6%B8%B8%E6%9E%97yl', code: 'SaHX7lrC-vAg' },
    { use: 'jd_544cacc7b14ef', code: 'S5KkcRRodpgWEcx2mlfNfIg' },
    { use: '313333079-954679', code: 'SvfxwQx0a9VPePRPxkPENfQ' },
  ];
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await $.totalBean();
      isLoginInfo[$.UserName] = $.isLogin;
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
      await jdConnoisseur();
    }
  }
  $.shareCodes = [...$.shareCodes, ...(res || [])];
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      if (!isLoginInfo[$.UserName]) continue;
      $.canHelp = true;
      if ($.shareCodes && $.shareCodes.length) {
        console.log(`\n开始互助\n`);
        for (let j = 0; j < $.shareCodes.length && $.canHelp; j++) {
          console.log(`账号${$.UserName} 去助力 ${$.shareCodes[j].use} 的助力码 ${$.shareCodes[j].code}`);
          if ($.UserName === $.shareCodes[j].use) {
            console.log(`助力失败：不能助力自己`);
            continue;
          }
          $.delcode = false;
          await getTaskInfo('2', $.projectCode, $.taskCode, '24', '2', $.shareCodes[j].code);
          await $.wait(2000);
          if ($.delcode) {
            $.shareCodes.splice(j, 1);
            j--;
            continue;
          }
        }
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

async function jdConnoisseur() {
  await getActiveInfo();
  await $.wait(2000);
  await getshareCode();
}

async function getActiveInfo(url = 'https://prodev.m.jd.com/mall/active/2y1S9xVYdTud2VmFqhHbkcoAYhJT/index.html') {
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
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
    },
  };
  return new Promise(async (resolve) => {
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getActiveInfo API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = data && data.match(/window\.performance.mark\(e\)}}\((.*)\);<\/script>/)[1];
            data = JSON.parse(data);
            pageId = data.activityInfo.pageId;
            encodeActivityId = data.activityInfo.encodeActivityId;
            paginationFlrs = data.paginationFlrs;
            activityId = data.activityInfo.activityId;
            for (let key of Object.keys(data.codeFloors)) {
              let vo = data.codeFloors[key];
              if (vo.ofn && vo.ofn === '3') {
                agid.push(vo.materialParams.advIdKOC[0].advGrpId);
                agid.push(vo.materialParams.advIdVideo[0].advGrpId);
                console.log(`去做【${vo.boardParams.btnText}】`);
                await getTaskInfo('5', vo.boardParams.projectCode, vo.boardParams.taskCode, '3');
                await $.wait(2000);
              } else if (vo.ofn && vo.ofn === '8') {
                console.log(`去做【${vo.boardParams.titleText}】`);
                await getTaskInfo('9', vo.boardParams.projectCode, vo.boardParams.taskCode, '8');
                await $.wait(2000);
              } else if (vo.ofn && (vo.ofn === '10' || vo.ofn === '12' || vo.ofn === '14' || vo.ofn === '16' || vo.ofn === '18')) {
                await getTaskInfo('1', vo.boardParams.projectCode, vo.boardParams.taskCode, vo.ofn);
                await $.wait(2000);
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
async function getTaskInfo(type, projectId, assignmentId, ofn, helpType = '1', itemId = '') {
  let body = { type: type, projectId: projectId, assignmentId: assignmentId, doneHide: false };
  if (ofn === '24') body['itemId'] = itemId;
  body['helpType'] = helpType;
  return new Promise(async (resolve) => {
    $.post(taskUrl('interactive_info', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getTaskInfo API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            allow_values = ['3', '10', '14', '16', '18', '20'];
            if (allow_values.includes(ofn)) {
              if (ofn !== '3') console.log(`去做【${data.data[0].title}】`);
              if (data.code === '0' && data.data) {
                if (data.data[0].status !== '2') {
                  await interactive_done(type, data.data[0].projectId, data.data[0].assignmentId, data.data[0].itemId);
                  await $.wait(2000);
                } else {
                  console.log(ofn === '3' ? `今日已签到` : `任务已完成`);
                }
              } else {
                console.log(data.message);
              }
            } else if (ofn === '8') {
              if (data.code === '0' && data.data) {
                if (data.data[0].status !== '2') {
                  await sign_interactive_done(type, data.data[0].projectId, data.data[0].assignmentId);
                  await $.wait(2000);
                  await interactive_reward(type, data.data[0].projectId, data.data[0].assignmentId);
                } else {
                  console.log(`任务已完成`);
                }
              } else {
                console.log(data.message);
              }
            } else if (ofn === '12') {
              if (data.code === '0' && data.data) {
                console.log(`去做【${data.data[0].title}】`);
                if (data.data[0].status !== '2') {
                  await interactive_accept(type, data.data[0].projectId, data.data[0].assignmentId, data.data[0].itemId);
                  await $.wait(2000);
                  await qryViewkitCallbackResult(data.data[0].projectId, data.data[0].assignmentId, data.data[0].itemId);
                } else {
                  console.log(`任务已完成`);
                }
              } else {
                console.log(data.message);
              }
            } else if (ofn === '24') {
              if (helpType === '1') {
                if (data.code === '0' && data.data) {
                  if (data.data[0].status !== '2') {
                    console.log(`【京东账号${$.index}（${$.UserName}）的内容鉴赏官好友互助码】${data.data[0].itemId}`);
                    $.shareCodes.push({
                      use: $.UserName,
                      code: data.data[0].itemId,
                    });
                  }
                } else {
                  console.log(data.message);
                }
              } else if (helpType === '2') {
                if (data.code === '0' && data.data) {
                  if (data.data[0].code === '0') {
                    await interactive_done(type, $.projectCode, $.taskCode, itemId);
                  } else if (data.data[0].code === '103') {
                    $.canHelp = false;
                    console.log(`助力失败：无助力次数`);
                  } else if (data.data[0].code === '102') {
                    console.log(`助力失败：${data.data[0].msg}`);
                  } else if (data.data[0].code === '106') {
                    $.delcode = true;
                    console.log(`助力失败：您的好友已完成任务`);
                  } else {
                    console.log(JSON.stringify(data));
                  }
                } else {
                  console.log(data.message);
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
    });
  });
}
function interactive_done(type, projectId, assignmentId, itemId) {
  let body = { projectId: projectId, assignmentId: assignmentId, itemId: itemId, type: type };
  if (type === '5' || type === '2') body['agid'] = agid;
  return new Promise((resolve) => {
    $.post(taskUrl('interactive_done', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} interactive_done API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (type === '2') {
              if (data.code === '0') {
                console.log(data.data.msg);
                if (!data.data.success) $.canHelp = false;
              } else {
                console.log(data.message);
              }
            } else {
              if (data.code === '0') {
                console.log(data.data.rewardMsg);
              } else {
                console.log(data.message);
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
async function sign_interactive_done(type, projectId, assignmentId) {
  let functionId = 'interactive_done';
  let body = JSON.stringify({ assignmentId: assignmentId, type: type, projectId: projectId });
  let uuid = randomString(16);
  let sign = await getSign(functionId, body, uuid);
  let url = `${JD_API_HOST}client.action?functionId=${functionId}&client=apple&clientVersion=10.1.0&uuid=${uuid}&${sign}`;
  return new Promise((resolve) => {
    $.post(taskPostUrl(url, body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} sign_interactive_done API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
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
function interactive_reward(type, projectId, assignmentId) {
  return new Promise((resolve) => {
    $.post(taskUrl('interactive_reward', { projectId: projectId, assignmentId: assignmentId, type: type }), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} interactive_reward API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.code === '0') {
              console.log(data.data.rewardMsg);
            } else {
              console.log(data.message);
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
function interactive_accept(type, projectId, assignmentId, itemId) {
  return new Promise((resolve) => {
    $.post(taskUrl('interactive_accept', { projectId: projectId, assignmentId: assignmentId, type: type, itemId: itemId }), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} interactive_accept API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
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
async function qryViewkitCallbackResult(encryptProjectId, encryptAssignmentId, itemId) {
  let functionId = 'qryViewkitCallbackResult';
  let body = JSON.stringify({
    dataSource: 'babelInteractive',
    method: 'customDoInteractiveAssignmentForBabel',
    reqParams: `{\"itemId\":\"${itemId}\",\"encryptProjectId\":\"${encryptProjectId}\",\"encryptAssignmentId\":\"${encryptAssignmentId}\"}`,
  });
  let uuid = randomString(16);
  let sign = await getSign(functionId, body, uuid);
  let url = `${JD_API_HOST}client.action?functionId=${functionId}&client=apple&clientVersion=10.1.0&uuid=${uuid}&${sign}`;
  return new Promise((resolve) => {
    $.post(taskPostUrl(url, body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} qryViewkitCallbackResult API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            console.log(`恭喜获得2个京豆`);
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
async function getshareCode() {
  let body = JSON.stringify({
    activityId: encodeActivityId,
    pageNum: '-1',
    innerAnchor: '',
    innerExtId: '',
    hideTopFoot: '',
    innerLinkBase64: '',
    innerIndex: '0',
    focus: '',
    forceTop: '',
    addressId: '',
    posLng: '',
    posLat: '',
    homeLng: '',
    homeLat: '',
    headId: '',
    headArea: '',
    warehouseId: '',
    dcId: '',
    babelChannel: 'ttt3',
    mitemAddrId: '',
    geo: { lng: '', lat: '' },
    flt: '',
    jda: '168871293.16308322604432132666501.1630832260.1631174347.1631180687.40',
    topNavStyle: '',
    url: `https://prodev.m.jd.com/mall/active/${encodeActivityId}/index.html?babelChannel=ttt3&tttparams=eisYm3eyJnTG5nIjoiMTE3LjAxMDA3MSIsImdMYXQiOiI0MC4xODk5My6J9&lng=&lat=&sid=&un_area=1_2953_54044_0`,
    fullUrl: `https://prodev.m.jd.com/mall/active/${encodeActivityId}/index.html?babelChannel=ttt3&tttparams=eisYm3eyJnTG5nIjoiMTE3LjAxMDA3MSIsImdMYXQiOiI0MC4xODk5My6J9&lng=&lat=&sid=&un_area=1_2953_54044_0`,
    autoSkipEmptyPage: false,
    paginationParam: '2',
    paginationFlrs: paginationFlrs,
    transParam: `{\"bsessionId\":\"\",\"babelChannel\":\"ttt3\",\"actId\":\"${activityId}\",\"enActId\":\"${encodeActivityId}\",\"pageId\":\"${pageId}\",\"encryptCouponFlag\":\"1\",\"sc\":\"apple\",\"scv\":\"10.1.2\",\"requestChannel\":\"h5\",\"jdAtHomePage\":\"0\"}`,
    siteClient: 'apple',
    siteClientVersion: '10.1.2',
    matProExt: {
      unpl: 'V2_ZzNtbUBSS0dzARMEfhxYDGIEGl9LUBBHclgVUyxJWgBuVhAPclRCFnUUR1xnGFUUZAEZXUNcQBFFCEZkexhdBG4KFV9FUXMldglHGXsYXWtlTiJeQmdCJXUPR1NzH1oGYAsaXEFXShJ8CENRcxxbNVcDG15yV0IUdwlGVHkaXAFhBRFtclZzFEUJdhUVGV0EYQMRXUAaQxJ0D05SfRpbDW8CEV1LUEoVcA1OUXwpXTVk',
    },
    userInterest: { whiteNote: '0_0_0', payment: '0_0_0', plusNew: '0_0_0', plusRenew: '0_0_0' },
  });
  let options = {
    url: `${JD_API_HOST}?client=wh5&clientVersion=1.0.0&functionId=qryH5BabelFloors`,
    body: `body=${escape(body)}`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://prodev.m.jd.com',
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
  return new Promise(async (resolve) => {
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getshareCode API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            for (let key of Object.keys(data.floorList)) {
              let vo = data.floorList[key];
              if (vo.ofn && vo.ofn === '22') {
                await getTaskInfo('1', vo.boardParams.projectCode, vo.boardParams.taskCode, vo.ofn);
                await $.wait(2000);
              } else if (vo.ofn && vo.ofn === '24') {
                $.projectCode = vo.boardParams.projectCode;
                $.taskCode = vo.boardParams.taskCode;
              }
            }
            await getTaskInfo('2', $.projectCode, $.taskCode, '22');
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
  if (functionId === 'interactive_info') {
    body = `[${escape(JSON.stringify(body))}]`;
  } else {
    body = escape(JSON.stringify(body));
  }
  return {
    url: `${JD_API_HOST}${functionId}?functionId=${functionId}&appid=contenth5_common&body=${body}&client=wh5`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://prodev.m.jd.com',
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://prodev.m.jd.com/mall/active/2y1S9xVYdTud2VmFqhHbkcoAYhJT/index.html',
      Cookie: cookie,
    },
  };
}
function taskPostUrl(url, body) {
  return {
    url,
    body: `body=${escape(body)}`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: '',
      'User-Agent': 'JD4iPhone/167774 (iPhone; iOS 14.7.1; Scale/3.00)',
      'Accept-Language': 'zh-Hans-CN;q=1',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
}
function getSign(functionid, body, uuid) {
  return new Promise(async (resolve) => {
    let data = {
      functionId: functionid,
      body: body,
      uuid: uuid,
      client: 'apple',
      clientVersion: '10.1.0',
    };
    let HostArr = ['jdsign.cf', 'signer.nz.lu'];
    let Host = HostArr[Math.floor(Math.random() * HostArr.length)];
    let options = {
      url: `https://cdn.nz.lu/ddo`,
      body: JSON.stringify(data),
      headers: {
        Host,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88',
      },
      timeout: 30000,
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getSign API请求失败，请检查网路重试`);
        } else {
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function randomString(e) {
  e = e || 32;
  let t = 'abcdefghijklmnopqrstuvwxyz0123456789',
    a = t.length,
    n = '';
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
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

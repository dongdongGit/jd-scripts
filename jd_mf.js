/*
京东小魔方
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东小魔方
31 2,8 * * * https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_mf.js, tag=京东小魔方, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon==============
[Script]
cron "31 2,8 * * *" script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_mf.js,tag=京东小魔方
===============Surge=================
京东小魔方 = type=cron,cronexp="31 2,8 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_mf.js
============小火箭=========
京东小魔方 = type=cron,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_mf.js, cronexpr="31 2,8 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东小魔方');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
let uuid;
$.shareCodes = ['S5KkcRRcd_AbUJB2nk_YCcA'];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let allMessage = '';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  // $.authorCode = await getAuthorShareCode('https://raw.githubusercontent.com/Aaron-lv/updateTeam/master/shareCodes/jd_updateCash.json')
  // if (!$.authorCode) {
  //   $.http.get({url: 'https://purge.jsdelivr.net/gh/Aaron-lv/updateTeam@master/shareCodes/jd_updateCash.json'}).then((resp) => {}).catch((e) => $.log('刷新CDN异常', e));
  //   await $.wait(1000)
  //   $.authorCode = await getAuthorShareCode('https://cdn.jsdelivr.net/gh/Aaron-lv/updateTeam@master/shareCodes/jd_updateCash.json') || []
  // }
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
      $.sku = [];
      uuid = randomString(40);
      await jdMofang();
    }
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.canHelp = true;
    if ($.shareCodes && $.shareCodes.length) {
      console.log(`\n开始内部助力`);
      for (let j = 0; j < $.shareCodes.length && $.canHelp; j++) {
        console.log(`\n账号${$.UserName} 去助力 ${$.shareCodes[j].use} 的助力码 ${$.shareCodes[j].code}`);
        if ($.UserName === $.shareCodes[j].use) {
          console.log(`助力失败：不能助力自己`);
          continue;
        }
        $.delcode = false;
        await doInteractiveAssignment('assistTaskDetail', $.encryptProjectId, $.sourceCode, $.encryptAssignmentId, $.shareCodes[j].code);
        await $.wait(2000);
        if ($.delcode) {
          $.shareCodes.splice(j, 1);
          j--;
          continue;
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

async function jdMofang() {
  console.log(`集魔方 赢大奖`);
  await getInteractionHomeInfo();
  // console.log(`\n集魔方 抽京豆 赢新品`)
  // await getInteractionInfo()
}

async function getInteractionHomeInfo() {
  return new Promise(async (resolve) => {
    $.post(taskUrl('getInteractionHomeInfo', { sign: 'u6vtLQ7ztxgykLEr' }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getInteractionHomeInfo API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            await queryInteractiveInfo(data.result.taskConfig.projectId, 'acexinpin0823');
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
async function queryInteractiveInfo(encryptProjectId, sourceCode) {
  return new Promise(async (resolve) => {
    $.post(taskUrl('queryInteractiveInfo', { encryptProjectId: encryptProjectId, sourceCode: sourceCode, ext: {} }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} queryInteractiveInfo API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            for (let assignment of data.assignmentList) {
              let vo = assignment;
              if (Object.keys(vo.ext).length == 0) {
                await doInteractiveAssignmentV2({
                  completionFlag: vo.completionFlag,
                  encryptAssignmentId: vo.encryptAssignmentId,
                  encryptProjectId: encryptProjectId,
                  sourceCode: sourceCode,
                });

              } else {
                if (vo.ext.extraType === 'sign1') {
                  console.log(`去做【${vo.assignmentName}】`);
                  if (vo.ext[vo.ext.extraType].status !== 2) {
                    let signDay = (vo.ext[vo.ext.extraType].signList && vo.ext[vo.ext.extraType].signList.length) || 0;
                    $.type = vo.rewards[signDay].rewardType;
                    await doInteractiveAssignment(vo.ext.extraType, encryptProjectId, sourceCode, vo.encryptAssignmentId, vo.ext[vo.ext.extraType].itemId);
                  } else {
                    console.log(`今日已签到`);
                  }
                } else if (vo.ext.extraType === 'assistTaskDetail') {
                  console.log(`【京东账号${$.index}（${$.UserName}）的京东小魔方好友互助码】${vo.ext[vo.ext.extraType].itemId}`);
                  $.encryptProjectId = encryptProjectId;
                  $.encryptAssignmentId = vo.encryptAssignmentId;
                  $.sourceCode = sourceCode;
                  if (vo.completionCnt < vo.assignmentTimesLimit) {
                    $.shareCodes.push({
                      code: vo.ext[vo.ext.extraType].itemId,
                      use: $.UserName,
                    });
                  } else {
                    console.log(`助力已满`);
                  }
                } else if (vo.ext.extraType !== 'brandMemberList') {
                  console.log(`去做【${vo.assignmentName}】`);
                  if (vo.completionCnt < vo.assignmentTimesLimit) {
                    $.type = vo.rewards[0].rewardType;
                    for (let key of Object.keys(vo.ext[vo.ext.extraType])) {
                      let task = vo.ext[vo.ext.extraType][key];
                      if (task.status !== 2) {
                        if (vo.ext.extraType !== 'productsInfo' && vo.ext.extraType !== 'addCart') {
                          await doInteractiveAssignment(vo.ext.extraType, encryptProjectId, sourceCode, vo.encryptAssignmentId, task.itemId, '1');
                          await $.wait(vo.ext.waitDuration * 1000 || 2000);
                        }
                        if (vo.ext.extraType === 'browseShop') {
                          $.rewardmsg = `完成成功：获得${vo.rewards[0].rewardValue}${vo.rewards[0].rewardName}`;
                          await qryViewkitCallbackResult(encryptProjectId, vo.encryptAssignmentId, task.itemId);
                        } else {
                          $.complete = false;
                          await doInteractiveAssignment(vo.ext.extraType, encryptProjectId, sourceCode, vo.encryptAssignmentId, task.itemId, '0');
                          if ($.complete) break;
                        }
                      }
                    }
                  } else {
                    console.log(`任务已完成`);
                  }
                }
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
    $.post(taskSignUrl(url, body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} qryViewkitCallbackResult API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.code === '0' || data.msg === 'query success!') {
              console.log($.rewardmsg);
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
function doInteractiveAssignment(extraType, encryptProjectId, sourceCode, encryptAssignmentId, itemId, actionType = '') {
  return new Promise((resolve) => {
    $.post(
      taskUrl('doInteractiveAssignment', {
        encryptProjectId: encryptProjectId,
        encryptAssignmentId: encryptAssignmentId,
        sourceCode: sourceCode,
        itemId: itemId,
        actionType: actionType,
        completionFlag: '',
        ext: {},
      }),
      (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} doInteractiveAssignment API请求失败，请检查网路重试`);
          } else {
            if (jd_helpers.safeGet(data)) {
              data = JSON.parse(data);
              if (extraType === 'assistTaskDetail') {
                if (data.msg === '已达助力上限' || data.subCode === '108') {
                  $.canHelp = false;
                  console.log(`助力失败：${data.msg}`);
                } else if (data.msg === '任务已完成' || data.subCode === '103') {
                  $.delcode = true;
                  console.log(`助力失败：您的好友助力已满`);
                } else if (data.msg === '任务完成' || data.subCode === '0') {
                  console.log(`助力成功`);
                }
              } else if (extraType === 'sign1') {
                console.log(
                  `签到成功：获得${
                    data.rewardsInfo.successRewards[$.type][0]
                      ? `${data.rewardsInfo.successRewards[$.type][0].quantity}${data.rewardsInfo.successRewards[$.type][0].rewardName}`
                      : `${data.rewardsInfo.successRewards[$.type].quantityDetails[0].quantity}${data.rewardsInfo.successRewards[$.type].quantityDetails[0].rewardName}`
                  }`
                );
              } else if (actionType === '0') {
                if (data.assignmentInfo.completionCnt === data.assignmentInfo.maxTimes) {
                  $.complete = true;
                  console.log(
                    `完成成功：获得${
                      data.rewardsInfo.successRewards[$.type][0]
                        ? `${data.rewardsInfo.successRewards[$.type][0].quantity}${data.rewardsInfo.successRewards[$.type][0].rewardName}`
                        : `${data.rewardsInfo.successRewards[$.type].quantityDetails[0].quantity}${data.rewardsInfo.successRewards[$.type].quantityDetails[0].rewardName}`
                    }`
                  );
                }
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      }
    );
  });
}
function doInteractiveAssignmentV2(params) {
  return new Promise((resolve) => {
    params = Object.assign({
      completionFlag: true,
      encryptAssignmentId: '',
      encryptProjectId: '',
      sourceCode: ''
    }, params)
    $.post(
      taskUrl('doInteractiveAssignment', params),
      (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} doInteractiveAssignment API请求失败，请检查网路重试`);
          } else {
            if (jd_helpers.safeGet(data)) {
              data = JSON.parse(data);
              console.log(data);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      }
    );
  });
}

async function getInteractionInfo(type = true) {
  return new Promise(async (resolve) => {
    $.post(taskPostUrl('getInteractionInfo', { sign: 3 }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getInteractionInfo API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (type) {
              $.interactionId = data.result.interactionId;
              $.taskPoolId = data.result.taskPoolInfo.taskPoolId;
              for (let key of Object.keys(data.result.taskPoolInfo.taskList)) {
                let vo = data.result.taskPoolInfo.taskList[key];
                if (vo.taskStatus === 0) {
                  if (vo.taskId === 2002) {
                    await queryPanamaPage(vo.groupId);
                    for (let id of $.sku) {
                      $.complete = false;
                      await executeNewInteractionTask(vo.taskId, vo.groupId, id);
                      await $.wait(2000);
                      if ($.complete) break;
                    }
                  } else {
                    for (let id of vo.taskGroupList) {
                      $.complete = false;
                      await executeNewInteractionTask(vo.taskId, id);
                      await $.wait(2000);
                      if ($.complete) break;
                    }
                  }
                } else {
                  console.log(`已找到当前魔方`);
                }
              }
              data = await getInteractionInfo(false);
              if (data.result.hasFinalLottery === 0) {
                let num = 0;
                for (let key of Object.keys(data.result.taskPoolInfo.taskRecord)) {
                  let vo = data.result.taskPoolInfo.taskRecord[key];
                  num += vo;
                }
                if (num >= 9) {
                  console.log(`共找到${num}个魔方，可开启礼盒`);
                  await getNewFinalLotteryInfo();
                } else {
                  console.log(`共找到${num}个魔方，不可开启礼盒`);
                }
              } else {
                console.log(`已开启礼盒`);
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
function queryPanamaPage(groupId) {
  return new Promise((resolve) => {
    $.post(taskPostUrl('queryPanamaPage', { activityId: '2umkvbpZCUtyN6gcymN88ew8WLeU', dynamicParam: {}, geo: { lng: '', lat: '' }, previewTime: '' }), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} queryPanamaPage API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            for (let key of Object.keys(data.floorList)) {
              let vo = data.floorList[key];
              if (vo.data && vo.data.head && vo.data.head.groupId === groupId) {
                for (let key of Object.keys(vo.data.head.list)) {
                  let skuVo = vo.data.head.list[key];
                  $.sku.push(skuVo.skuId);
                }
                break;
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
function executeNewInteractionTask(taskType, advertId, sku = '') {
  let body = { sign: 3, interactionId: $.interactionId, taskPoolId: $.taskPoolId, taskType: taskType, advertId: advertId };
  if (taskType === 2002) body['sku'] = sku;
  return new Promise((resolve) => {
    $.post(taskPostUrl('executeNewInteractionTask', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} executeNewInteractionTask API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result.hasDown === 1) {
              console.log(data.result.isLottery === 1 ? `找到了一个魔方，获得${data.result.lotteryInfoList[0].quantity || ''}${data.result.lotteryInfoList[0].name}` : `找到了一个魔方`);
              $.complete = true;
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


function getNewFinalLotteryInfo() {
  return new Promise((resolve) => {
    $.post(taskPostUrl('getNewFinalLotteryInfo', { sign: 3, interactionId: $.interactionId }), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getNewFinalLotteryInfo API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.result.lotteryStatus === 1) {
              console.log(`开启礼盒成功：获得${data.result.lotteryInfoList[0].quantity}${data.result.lotteryInfoList[0].name}`);
            } else {
              console.log(`开启礼盒成功：${data.result.toast}`);
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

function taskUrl(functionId, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${functionId}&body=${escape(JSON.stringify(body))}&appid=content_ecology&client=wh5&clientVersion=1.0.0`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://h5.m.jd.com',
      'Accept-Language': 'zh-cn',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://h5.m.jd.com/babelDiy/Zeus/2bf3XEEyWG11pQzPGkKpKX2GxJz2/index.html',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
    },
  };
}
function taskPostUrl(functionId, body = {}) {
  body = JSON.stringify(body);
  if (functionId === 'queryPanamaPage') body = escape(body);
  return {
    url: `${JD_API_HOST}?functionId=${functionId}&body=${body}&client=wh5&clientVersion=10.1.4&appid=content_ecology&eufv=false&uuid=${uuid}&t=${Date.now()}`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://h5.m.jd.com',
      'Accept-Language': 'zh-cn',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://h5.m.jd.com/babelDiy/Zeus/2umkvbpZCUtyN6gcymN88ew8WLeU/index.html',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
    },
  };
}
function taskSignUrl(url, body) {
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
function randomString(e) {
  let t = 'abcdef0123456789';
  if (e === 16) t = 'abcdefghijklmnopqrstuvwxyz0123456789';
  e = e || 32;
  let a = t.length,
    n = '';
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
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
      timeout: 30 * 1000,
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
function getAuthorShareCode(url) {
  return new Promise((resolve) => {
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
        if (err) {
        } else {
          if (data) data = JSON.parse(data);
        }
      } catch (e) {
        // $.logErr(e, resp)
      } finally {
        resolve(data);
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

/*

建议手动先点开一次
33 0,6-23/2 * * * jd_19E.js

*/

const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
let $ = jd_env.env('热爱奇旅');

const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';

let cookiesArr = [],
  cookie = '',
  message;
let secretp = '',
  inviteId = ['ZXASTT0225KkcRRcd_AbUJB2nk_YCcAFjRWn6S7zB55awQ'];

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let inviteCodes = [];
$.shareCodesArr = [];

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  $.inviteIdCodesArr = {};
  for (let i = 0; i < cookiesArr.length && true; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      await getUA();
    }
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      //   await shareCodesFormat()
      $.newShareCodes = [];
      for (let i = 0; i < $.newShareCodes.length && true; ++i) {
        console.log(`\n开始助力 【${$.newShareCodes[i]}】`);
        let res = await getInfo($.newShareCodes[i]);
        if (res && res['data'] && res['data']['bizCode'] === 0) {
          if (res['data']['result']['toasts'] && res['data']['result']['toasts'][0] && res['data']['result']['toasts'][0]['status'] === '3') {
            console.log(`助力次数已耗尽，跳出`);
            break;
          }
          if (res['data']['result']['toasts'] && res['data']['result']['toasts'][0]) {
            console.log(`助力 【${$.newShareCodes[i]}】:${res.data.result.toasts[0].msg}`);
          }
        }
        if ((res && res['status'] && res['status'] === '3') || (res && res.data && res.data.bizCode === -11)) {
          // 助力次数耗尽 || 黑号
          break;
        }
      }
      try {
        await get_secretp();

        do {
          var conti = false;
          await promote_collectAtuoScore();
          res = await promote_getTaskDetail();

          for (var p = 0; p < res.lotteryTaskVos[0].badgeAwardVos.length; p++) {
            if (res.lotteryTaskVos[0].badgeAwardVos[p].status == 3) {
              await promote_getBadgeAward(res.lotteryTaskVos[0].badgeAwardVos[p].awardToken);
            }
          }
          let task = [];
          let r = [];
          for (var p = 0; p < res.taskVos.length; p++) {
            task = res.taskVos[p];
            if (task.status != 1) continue;
            switch (task.taskType) {
              case 7:
              case 9:
              case 3:
              case 6:
              case 26:
                var tmp = [];
                if (task.taskType == 7) {
                  tmp = task.browseShopVo;
                } else {
                  tmp = task.shoppingActivityVos;
                }

                for (var o = 0; o < tmp.length; o++) {
                  console.log(`\n ${tmp[o].title ? tmp[o].title : tmp[o].shopName}`);
                  if (tmp[o].status == 1) {
                    conti = true;
                    await promote_collectScore(tmp[o].taskToken, task.taskId);
                  }
                }
                await $.wait(8000);
                for (var o = 0; o < tmp.length; o++) {
                  if (tmp[o].status == 1) {
                    conti = true;
                    await qryViewkitCallbackResult(tmp[o].taskToken);
                  }
                }
                break;
              case 2:
                r = await promote_getFeedDetail(task.taskId);
                var t = 0;
                for (var o = 0; o < r.productInfoVos.length; o++) {
                  if (r.productInfoVos[o].status == 1) {
                    conti = true;
                    await promote_collectScore(r.productInfoVos[o].taskToken, task.taskId);
                    t++;
                    if (t >= 5) break;
                  }
                }
                break;
              case 5:
                r = await promote_getFeedDetail2(task.taskId);
                var t = 0;
                for (var o = 0; o < r.browseShopVo.length; o++) {
                  if (r.browseShopVo[o].status == 1) {
                    conti = true;
                    await promote_collectScore(r.browseShopVo[o].taskToken, task.taskId);
                    t++;
                    if (t >= 5) break;
                  }
                }
                break;
              case 21:
                for (var o = 0; o < task.brandMemberVos.length; o++) {
                  if (task.brandMemberVos[o].status == 1) {
                    console.log(`\n ${task.brandMemberVos[o].title}`);
                    memberUrl = task.brandMemberVos[o].memberUrl;
                    memberUrl = transform(memberUrl);
                    await join(task.brandMemberVos[o].vendorIds, memberUrl.channel, memberUrl.shopId ? memberUrl.shopId : '');
                    await promote_collectScore(task.brandMemberVos[o].taskToken, task.taskId);
                  }
                }
            }
          }
          await $.wait(1000);
        } while (conti);

        await promote_sign();
        do {
          var ret = await promote_raise();
        } while (ret);
        console.log(`\n助力码：${res.inviteId}\n`);
        $.newShareCodes.push(res.inviteId);
        inviteId.push(res.inviteId);
      } catch (e) {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
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

function transform(str) {
  var REQUEST = new Object(),
    data = str.slice(str.indexOf('?') + 1, str.length - 1),
    aParams = data.substr(1).split('&');
  for (i = 0; i < aParams.length; i++) {
    var aParam = aParams[i].split('=');
    REQUEST[aParam[0]] = aParam[1];
  }
  return REQUEST;
}

function get_secretp() {
  let body = {};
  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_getHomeData', body), async (err, resp, data) => {
      //console.log(data)
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code == 0) {
              if (data.data && data.data.bizCode === 0) {
                secretp = data.data.result.homeMainInfo.secretp;
                console.log(secretp);
              }
            } else if (data.code != 0) {
              //console.log(`\nsecretp失败:${JSON.stringify(data)}\n`)
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

function promote_sign() {
  let body = { ss: { extraData: { log: '', sceneid: 'RAhomePageh5' }, secretp: secretp, random: randomString(6) } };
  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_sign', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                console.log(`\n 签到成功`);
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              console.log(`\n签到失败:${JSON.stringify(data)}\n`);
              resolve(false);
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

function promote_raise() {
  let body = { scenceId: 4, ss: { extraData: { log: '', sceneid: 'RAhomePageh5' }, secretp: secretp, random: randomString(6) } };
  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_raise', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                console.log(`\n 升级成功`);
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              console.log(`\n升级失败:${JSON.stringify(data)}\n`);
              resolve(false);
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

function promote_collectAtuoScore() {
  let body = { ss: { extraData: { log: '', sceneid: 'RAhomePageh5' }, secretp: secretp, random: randomString(6) } };
  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_collectAtuoScore', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                console.log(`\n 成功领取${data.data.result.produceScore}个币`);
              }
            } else {
              //console.log(`\nsecretp失败:${JSON.stringify(data)}\n`)
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

function promote_getTaskDetail() {
  let body = {};
  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_getTaskDetail', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                if (data.data.result.inviteId == null) {
                  console.log('黑号');
                  resolve('');
                }
                inviteId.push(data.data.result.inviteId);
                resolve(data.data.result);
              }
            } else {
              //console.log(`\nsecretp失败:${JSON.stringify(data)}\n`)
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

function promote_collectScore(taskToken, taskId) {
  let body = { taskId: taskId, taskToken: taskToken, actionType: 1, ss: { extraData: { log: '', sceneid: 'RAhomePageh5' }, secretp: secretp, random: randomString(6) } };

  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_collectScore', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                console.log(data.msg);
              }
            } else {
              console.log(`\n 失败:${JSON.stringify(data)}\n`);
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

function qryViewkitCallbackResult(taskToken) {
  let body = {
    dataSource: 'newshortAward',
    method: 'getTaskAward',
    reqParams: `{\"taskToken\":"${taskToken}"}`,
    sdkVersion: '1.0.0',
    clientLanguage: 'zh',
    onlyTimeId: new Date().getTime(),
    riskParam: {
      platform: '3',
      orgType: '2',
      openId: '-1',
      pageClickKey: 'Babel_VKCoupon',
      eid: '',
      fp: '-1',
      shshshfp: '',
      shshshfpa: '',
      shshshfpb: '',
      childActivityUrl: '',
      userArea: '-1',
      client: '',
      clientVersion: '',
      uuid: '',
      osVersion: '',
      brand: '',
      model: '',
      networkType: '',
      jda: '-1',
    },
  };

  return new Promise((resolve) => {
    $.post(taskPostUrl2('qryViewkitCallbackResult', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            if (data.indexOf('已完成') != -1) {
              data = JSON.parse(data);
              console.log(`\n ${data.toast.subTitle}`);
            } else {
              console.log(`\n失败:${JSON.stringify(data)}\n`);
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

function promote_getBadgeAward(taskToken) {
  let body = { awardToken: taskToken };

  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_getBadgeAward', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                for (let i = 0; i < data.data.result.myAwardVos.length; i++) {
                  switch (data.data.result.myAwardVos[i].type) {
                    case 15:
                      console.log(`\n 获得${data.data.result.myAwardVos[i].pointVo.score}币`);
                      break;
                    case 1:
                      //console.log(`\n 获得优惠券 满${data.result.myAwardVos[1].couponVo.usageThreshold}-${data.result.myAwardVos[i].couponVo.quota}  ${data.result.myAwardVos[i].couponVo.useRange}`)
                      break;
                  }
                }
              }
            } else {
              console.log(`\n 失败:${JSON.stringify(data)}\n`);
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

function promote_getFeedDetail(taskId) {
  let body = { taskId: taskId.toString() };

  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_getFeedDetail', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                resolve(data.data.result.addProductVos[0]);
              }
            } else {
              console.log(`\n 失败:${JSON.stringify(data)}\n`);
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

function promote_getFeedDetail2(taskId) {
  let body = { taskId: taskId.toString() };

  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_getFeedDetail', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                resolve(data.data.result.taskVos[0]);
              }
            } else {
              console.log(`\n 失败:${JSON.stringify(data)}\n`);
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

function join(venderId, channel, shopId) {
  let shopId_ = shopId != '' ? `,"shopId":"${shopId}"` : '';
  return new Promise((resolve) => {
    $.get(
      {
        url: `https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=bindWithVender&body={"venderId":"${venderId}"${shopId_},"bindByVerifyCodeFlag":1,"registerExtend":{},"writeChildFlag":0,"channel":${channel}}&client=H5&clientVersion=9.2.0&uuid=88888`,
        headers: {
          'Content-Type': 'text/plain; Charset=UTF-8',
          Cookie: cookie,
          Host: 'api.m.jd.com',
          Connection: 'keep-alive',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': $.UA,
          'Accept-Language': 'zh-cn',
          Referer: `https://shopmember.m.jd.com/shopcard/?venderId=${venderId}&shopId=${venderId}&venderType=5&channel=401&returnUrl=https://lzdz1-isv.isvjcloud.com/dingzhi/personal/care/activity/4540555?activityId=dz210768869313`,
          'Accept-Encoding': 'gzip, deflate, br',
        },
      },
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} API请求失败，请检查网路重试`);
          } else {
            if (jd_helpers.safeGet(data)) {
              if (data.indexOf('成功') != -1) {
                console.log(`\n 入会成功\n`);
              } else {
                console.log(`\n 失败:${JSON.stringify(data)}\n`);
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

function taskPostUrl(functionId, body) {
  return {
    //functionId=promote_getHomeData&body={}&client=wh5&clientVersion=1.0.0
    url: `${JD_API_HOST}`,
    body: `functionId=${functionId}&body=${escape(JSON.stringify(body))}&client=m&clientVersion=-1&appid=signed_wh5`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      Origin: 'https://wbbny.m.jd.com',
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
}

function taskPostUrl2(functionId, body) {
  return {
    url: `${JD_API_HOST}?functionId=${functionId}&client=wh5`,
    body: `body=${escape(JSON.stringify(body))}`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'https://wbbny.m.jd.com',
    },
  };
}

function getUA() {
  $.UA = `jdapp;android;10.0.6;11;9363537336739353-2636733333439346;network/wifi;model/KB2000;addressid/138121554;aid/9657c795bc73349d;oaid/;osVer/30;appBuild/88852;partner/oppo;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 11; KB2000 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045537 Mobile Safari/537.36`;
}

function randomString(e) {
  e = e || 32;
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

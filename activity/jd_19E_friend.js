/*
建议手动先点开一次
20 0,8 * * * jd_19E_friend.js
快速助力、加入队伍、升级，跑一次即可
*/

const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
let $ = jd_env.env('热爱奇旅助力组队升级');

const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';

let cookiesArr = [],
  cookie = '';
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

$.shareCodesArr = [];
let groups = [];
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  console.log('\n仅助力+组队+升级，快速跑完\n');
  await getUA();
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
      await get_secretp();
      if ($.huobao == false) {
        console.log(`火爆`);
        continue;
      }
      await promote_collectAtuoScore(); //定时领取
      let res;
      //此处修改组队人数 默认前3组队
      if (i < 3) {
        res = await promote_pk_getHomeData();
        if (res.data.result.groupInfo.memberList) {
          let memberCount = res.data.result.groupInfo.memberList.length;
          console.log('当前队伍有', memberCount, '人');
          let groupJoinInviteId = '';

          if (memberCount < 30) {
            groupJoinInviteId = res.data.result.groupInfo.groupJoinInviteId;
            res = await getEncryptedPinColor();
            groups.push({ mpin: res.result, groupJoinInviteId: groupJoinInviteId });
            console.log('队伍未满:', groupJoinInviteId);
          }
        }
      }
      try {
        res = await promote_getTaskDetail();
        await promote_sign();
        do {
          var ret = await promote_raise();
          await $.wait(1000);
        } while (ret);
      } catch (e) {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
      }
    }
  }
  try {
    for (let i = 0; i < cookiesArr.length; i++) {
      if (cookiesArr[i]) {
        cookie = cookiesArr[i];
        $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        $.index = i + 1;
        $.isLogin = true;
        $.nickName = '';
        message = '';
        console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
        await get_secretp();
        if ($.huobao == false) {
          console.log(`火爆`);
          continue;
        }
        await $.wait(1000);
        let res, bizCode;
        for (let j = 0; j < inviteId.length; j++) {
          console.log(`\n开始助力 【${inviteId[j]}】`);
          res = await help(inviteId[j]);
          bizCode = res['data']['bizCode'];
          if (res['data']['bizCode'] === 0) {
            console.log('助力成功,获得：', parseFloat(res.data.result.acquiredScore), '金币');
            if (res.data.result?.redpacket?.value) console.log('🧧', parseFloat(res.data.result?.redpacket?.value));
            //console.log('助力结果：'+res.data.bizMsg)
          } else if (bizCode == 108) {
            //无助力
            console.log(res.data.bizMsg);
            break;
          } else if (bizCode == -201) {
            //好友人气爆棚，不需要助力啦~
            console.log(res.data.bizMsg);
            inviteId.splice(j, 1);
            j--;
            continue;
          } else {
            console.log(res.data.bizCode + res.data.bizMsg);
          }
          await $.wait(1000);
        }

        res = await promote_pk_getHomeData();
        if (res.data.result.groupInfo.memberList) {
          let memberCount = res.data.result.groupInfo.memberList.length;
          if (memberCount === 1) {
            for (let group of groups) {
              console.log('\n开始加入队伍：', group.groupJoinInviteId);
              res = await collectFriendRecordColor(group.mpin);
              res = await promote_pk_joinGroup(group.groupJoinInviteId);
              await $.wait(3000);
              if (res.data.bizCode === 0) {
                console.log('加入队伍成功');
                break;
              } else {
                console.log(res.data.bizMsg);
              }
              res = await promote_pk_getHomeData();
            }
          }
          await $.wait(3000);
        }
      }
    }
  } catch (e) {
    $.log(`❌ ${$.name}, 失败! 原因: `, e);
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
            $.huobao = data.data.success;
            if (data.code == 0) {
              if (data.data && data.data.bizCode === 0) {
                secretp = data.data.result.homeMainInfo.secretp;
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
                console.log(`签到成功`);
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              console.log(`签到失败:${JSON.stringify(data)}\n`);
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
    $.post(taskPostUrl('promote_collectAutoScore', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                console.log(`成功领取${data.data.result.produceScore}个币`);
              }
            } else {
              //console.log(`\n\nsecretp失败:${JSON.stringify(data)}\n`)
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
                inviteIdss = data.data.result.inviteId;
                if (!inviteIdss) {
                  console.log('黑号');
                  resolve('');
                }
                console.log(inviteIdss);
                inviteId.push(data.data.result.inviteId);
                resolve(data.data.result);
              }
            } else {
              //console.log(`\n\nsecretp失败:${JSON.stringify(data)}\n`)
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

function help(inviteId) {
  let body = { actionType: 0, inviteId: inviteId, ss: { extraData: { log: '', sceneid: 'RAhomePageh5' }, secretp: secretp, random: randomString(6) } };
  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_collectScore', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            //console.log(data)
            //if (data.data.bizCode === 0) {
            //if (data.data && data['data']['bizCode'] === 0) {
            //  console.log(data.bizMsg)
            //}
            //} else {
            // console.log(`\n 失败:` + data.bizMsg)
            // }
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
  let s = Math.floor(Math.random() * 3) + 1;
  let body = { scenceId: s, ss: { extraData: { log: '', sceneid: 'RAhomePageh5' }, secretp: secretp, random: randomString(6) } };
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
                console.log(`升级成功`);
                resolve(true);
              } else {
                resolve(false);
              }
            } else {
              console.log(`升级失败:${JSON.stringify(data)}\n`);
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
function promote_pk_getHomeData() {
  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_pk_getHomeData', {}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
          } else {
            console.log(`\n\n 失败:${JSON.stringify(data)}\n`);
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

function getEncryptedPinColor() {
  return new Promise((resolve) => {
    $.post(taskPostUrl2('getEncryptedPinColor', {}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
          } else {
            console.log(`\n\n 失败:${JSON.stringify(data)}\n`);
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

function collectFriendRecordColor(mpin) {
  return new Promise((resolve) => {
    $.post(taskPostUrl('collectFriendRecordColor', { mpin: mpin, businessCode: '20136', assistType: '2', shareSource: 1 }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
          } else {
            console.log(`\n\n 失败:${JSON.stringify(data)}\n`);
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

function promote_pk_joinGroup(groupJoinInviteId) {
  let body = { inviteId: groupJoinInviteId, ss: { extraData: { log: '', sceneid: 'RAhomePageh5' }, secretp: secretp, random: randomString(6) }, confirmFlag: 1 };
  return new Promise((resolve) => {
    $.post(taskPostUrl('promote_pk_joinGroup', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
          } else {
            console.log(`\n\n 失败:${JSON.stringify(data)}\n`);
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

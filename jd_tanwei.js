/*
探味奇遇记
活动入口：美食馆-右侧悬浮
活动时间：5月17-6月16
宝箱陆续开放
来自：6dylan6/jdpro
31 0,13 26-31,1-16 5,6 * jd_tanwei.js
 */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('探味奇遇记');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message = '';
let encryptProjectId = '3NhNqgKD5WYkmLLsudX1Z2vVS5pP';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
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
      await twqyj();
      await $.wait(1000);
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function twqyj() {
  try {
    let tk = await queryInteractiveInfo();
    for (let key of Object.keys(tk.assignmentList).reverse()) {
      let vo = tk.assignmentList[key];
      if (vo.completionFlag || vo.assignmentType == 30) {
        console.log('任务已完成');
      } else {
        if (vo.ext && vo.ext.extraType == 'sign1') {
          await sign(encryptProjectId, vo.encryptAssignmentId);
        } else {
          await dotask(encryptProjectId, vo.encryptAssignmentId);
        }
      }
      await $.wait(1000);
    }
  } catch (e) {
    $.logErr(e);
  }
}

async function queryInteractiveInfo() {
  return new Promise(async (resolve) => {
    $.post(taskUrl('queryInteractiveInfo', { encryptProjectId: encryptProjectId, sourceCode: 'acemsg0406' }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`queryInteractiveInfo API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
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

async function sign(encryptProjectId, AssignmentId) {
  return new Promise(async (resolve) => {
    $.post(
      taskUrl('doInteractiveAssignment', { encryptProjectId: encryptProjectId, encryptAssignmentId: AssignmentId, sourceCode: 'acemsg0406', itemId: '1', completionFlag: 'true' }),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`doInteractiveAssignment API请求失败，请检查网路重试`);
          } else {
            if (jd_helpers.safeGet(data)) {
              data = JSON.parse(data);
              if (data.subCode == 0) {
                if (data.rewardsInfo.successRewards['3'] && data.rewardsInfo.successRewards['3'].length != 0) {
                  console.log(`${data.rewardsInfo.successRewards['3'][0].rewardName},获得${data.rewardsInfo.successRewards['3'][0].quantity}京豆`);
                } else if (data.rewardsInfo.failRewards.length != 0) {
                  console.log(`失败：${data.rewardsInfo.failRewards[0].msg}`);
                }
              } else {
                console.log(data.msg);
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

async function dotask(encryptProjectId, AssignmentId) {
  return new Promise(async (resolve) => {
    $.post(taskUrl('doInteractiveAssignment', { encryptProjectId: encryptProjectId, encryptAssignmentId: AssignmentId, sourceCode: 'acemsg0406', completionFlag: true }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`doInteractiveAssignment API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.subCode == '0' && data.rewardsInfo.hasOwnProperty('successRewards')) {
              if (data.rewardsInfo.successRewards['3'] && data.rewardsInfo.successRewards['3'].length != 0) {
                console.log(`${data.rewardsInfo.successRewards['3'][0].rewardName},获得${data.rewardsInfo.successRewards['3'][0].quantity}京豆`);
                //              } else if (data.rewardsInfo.failRewards.length != 0) {
                //                console.log(`失败：${data.rewardsInfo.failRewards[0].msg}`);
              }
            } else {
              console.log(data.msg);
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
    url: `${JD_API_HOST}?functionId=${functionId}&body=${encodeURI(JSON.stringify(body))}&appid=publicUseApi&client=wh5&clientVersion=1.0.0&networkType=&t=${new Date().getTime()}`,
    headers: {
      Host: 'api.m.jd.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://h5.m.jd.com',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://h5.m.jd.com/babelDiy/Zeus/4HEXbcWBwHW2yxmoY9LnBoCZ9kcB/index.html',
      Cookie: cookie,
    },
  };
}

function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: 'https://wq.jd.com/user_new/info/GetJDUserInfoUnion?sceneval=2',
      headers: {
        Host: 'wq.jd.com',
        Accept: '*/*',
        Connection: 'keep-alive',
        Cookie: cookie,
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        Referer: 'https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 1001) {
              $.isLogin = false;
              return;
            }
            if (data['retcode'] === 0 && data.data && data.data.hasOwnProperty('userInfo')) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            console.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e);
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

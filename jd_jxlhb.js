/*
京喜领88元红包
活动入口：京喜app-》我的-》京喜领88元红包
助力逻辑：先自己京东账号相互助力，如有剩余助力机会，则助力作者
温馨提示：如提示助力火爆，可尝试寻找京东客服
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js
==============Quantumult X==============
[task_local]
#京喜领88元红包
4 2,10 * * * jd_jxlhb.js, tag=京喜领88元红包, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
==============Loon==============
[Script]
cron "4 2,10 * * *" script-path=jd_jxlhb.js,tag=京喜领88元红包
================Surge===============
京喜领88元红包 = type=cron,cronexp="4 2,10 * * *",wake-system=1,timeout=3600,script-path=jd_jxlhb.js
===============小火箭==========
京喜领88元红包 = type=cron,script-path=jd_jxlhb.js, cronexpr="4 2,10 * * *", timeout=3600, enable=true
 */
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京喜领88元红包');
const notify = $.isNode() ? require('./sendNotify') : {};
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : {};
let cookiesArr = [],
  cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
$.packetIdArr = [];
$.activeId = '489177';
const BASE_URL = 'https://wq.jd.com/cubeactive/steprewardv3';

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  console.log('京喜领88元红包\n' + '活动入口：京喜app-》我的-》京喜领88元红包\n' + '助力逻辑：先自己京东账号相互助力，如有剩余助力机会，则助力作者\n' + '温馨提示：如提示助力火爆，可尝试寻找京东客服');
  let res = {
    codes: [
      'sA0J0amfPeyFqzbgvE-y2gaI74FNyzusXDCrolDtDSl1Ffe2U484vy5GrKcjlRVW',
      'sA0J0amfPeyFqzbgvE-y2tqRwON31iSASOeFuHYjxoHM5gvo3PFHtKDit6ox2T6N',
      'sA0J0amfPeyFqzbgvE-y2hiIWClV8YRBnTMgBNSwH39NuyKCdmZ7fteCRWgQCXBF',
      'sA0J0amfPeyFqzbgvE-y2kuyEmg-wp5x2_BAy4mDJAl1Ffe2U484vy5GrKcjlRVW',
      'sA0J0amfPeyFqzbgvE-y2olgK5JYS91rt-eb4jCMcYC34nahYK90s2LKux5NytUE',
      'sA0J0amfPeyFqzbgvE-y2kwK1hQMNklGYZukr1bgRAxo5KmLP7SxTfu6nKX6Y-9A',
      'sA0J0amfPeyFqzbgvE-y2r0jcuka2nNs28XfLnwrQFKBmmR2p9NU8N9Q_k76AtJd',
      'sA0J0amfPeyFqzbgvE-y2qn7nwG5hC8Yi1Je215kkT4uN1oWXCwb4S_LZowYKNNP',
      'sA0J0amfPeyFqzbgvE-y2ggBcwceuB7bZb3cq2tWH4fKfUsyeq5_JbTM6XoxkX90',
      'sA0J0amfPeyFqzbgvE-y2q5ZlUewN6DWBt1BII3h8QWkRU2jxVAmNkBoZGHiEaQR',
      'sA0J0amfPeyFqzbgvE-y2pL_SCqdayM24TdBmzUymvk',
    ],
    activeId: '489177',
  };
  if (res && res.activeId) $.activeId = res.activeId;
  $.authorMyShareIds = [...((res && res.codes) || [])];
  //开启红包,获取互助码
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.index = i + 1;
    $.isLogin = true;
    $.nickName = '';
    await TotalBean();
    console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
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
  //互助
  console.log(`\n\n自己京东账号助力码：\n${JSON.stringify($.packetIdArr)}\n\n`);
  console.log(`\n开始助力：助力逻辑 先自己京东相互助力，如有剩余助力机会，则助力作者\n`);
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.canHelp = true;
    $.max = false;
    for (let code of $.packetIdArr) {
      if (!code) continue;
      if ($.UserName === code['userName']) continue;
      console.log(`【${$.UserName}】去助力【${code['userName']}】邀请码：${code['strUserPin']}`);
      await enrollFriend(code['strUserPin']);
      await $.wait(3000);
      if ($.max) continue;
      if (!$.canHelp) break;
    }
    if ($.canHelp) {
      console.log(`\n【${$.UserName}】有剩余助力机会，开始助力作者\n`);
      for (let item of $.authorMyShareIds) {
        if (!item) continue;
        console.log(`【${$.UserName}】去助力作者的邀请码：${item}`);
        await enrollFriend(item);
        await $.wait(3000);
        if ($.max) continue;
        if (!$.canHelp) break;
      }
    }
  }
  //拆红包
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.canOpenGrade = true;
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    for (let grade of $.grades) {
      if (!$.packetIdArr[i]) continue;
      console.log(`\n【${$.UserName}】去拆第${grade}个红包`);
      await openRedPack($.packetIdArr[i]['strUserPin'], grade);
      await $.wait(2000);
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
  await joinActive();
  await $.wait(2000);
  await getUserInfo();
  await $.wait(2000);
}
//参与活动
function joinActive() {
  return new Promise((resolve) => {
    const body = '';
    const options = taskurl('JoinActive', body, 'activeId,channel,phoneid,publishFlag,stepreward_jstoken,timestamp');
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}:  API查询请求失败 ‼️‼️`);
          $.logErr(err);
        } else {
          // console.log('开启活动', data)
          data = JSON.parse(data);
          if (data.iRet === 0) {
            console.log(`活动开启成功,助力邀请码为:${data.Data.strUserPin}\n`);
          } else {
            console.log(`活动开启失败：${data.sErrMsg}\n`);
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
//获取助力码
function getUserInfo() {
  return new Promise((resolve) => {
    const body = `joinDate=${$.time('yyyyMMdd')}`;
    const options = taskurl('GetUserInfo', body, 'activeId,channel,joinDate,phoneid,publishFlag,timestamp');
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}:  API查询请求失败 ‼️‼️`);
          $.logErr(err);
        } else {
          // console.log('获取助力码', data)
          data = JSON.parse(data);
          if (data.iRet === 0) {
            $.grades = [];
            $.helpNum = '';
            let grades = data.Data.gradeConfig;
            for (let key of Object.keys(grades)) {
              let vo = grades[key];
              $.grades.push(vo.dwGrade);
              $.helpNum = vo.dwHelpTimes;
            }
            if (data.Data.dwHelpedTimes === $.helpNum) {
              console.log(`${$.grades[$.grades.length - 1]}个阶梯红包已全部拆完\n`);
            } else {
              console.log(`获取助力码成功：${data.Data.strUserPin}\n`);
              if (data.Data.strUserPin) {
                $.packetIdArr.push({
                  strUserPin: data.Data.strUserPin,
                  userName: $.UserName,
                });
              }
            }
          } else {
            console.log(`获取助力码失败：${data.sErrMsg}\n`);
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
//助力好友
function enrollFriend(strPin) {
  return new Promise((resolve) => {
    // console.log('\nstrPin ' + strPin);
    const body = `strPin=${strPin}&joinDate=${$.time('yyyyMMdd')}`;
    const options = taskurl('EnrollFriend', body, 'activeId,channel,joinDate,phoneid,publishFlag,strPin,timestamp');
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}:  API查询请求失败 ‼️‼️`);
          $.log(JSON.stringify(err));
        } else {
          // console.log('助力结果', data)
          data = JSON.parse(data);
          if (data.iRet === 0) {
            //{"Data":{"prizeInfo":[]},"iRet":0,"sErrMsg":"成功"}
            console.log(`助力成功🎉:${data.sErrMsg}\n`);
            // if (data.Data.strUserPin) $.packetIdArr.push(data.Data.strUserPin);
          } else {
            if (data.iRet === 2000) $.canHelp = false; //未登录
            if (data.iRet === 2015) $.canHelp = false; //助力已达上限
            if (data.iRet === 2016) {
              $.canHelp = false; //助力火爆
              console.log(`温馨提示：如提示助力火爆，可尝试寻找京东客服`);
            }
            if (data.iRet === 2013) $.max = true;
            console.log(`助力失败:${data.sErrMsg}\n`);
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

function openRedPack(strPin, grade) {
  return new Promise((resolve) => {
    const body = `strPin=${strPin}&grade=${grade}`;
    const options = taskurl('DoGradeDraw', body, 'activeId,channel,grade,phoneid,publishFlag,stepreward_jstoken,strPin,timestamp');
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}:  API查询请求失败 ‼️‼️`);
          $.logErr(err);
        } else {
          // console.log(`拆红包结果：${data}`);
          data = JSON.parse(data);
          if (data.iRet === 0) {
            console.log(`拆红包成功:${data.sErrMsg}\n`);
          } else {
            if (data.iRet === 2017) $.canOpenGrade = false;
            console.log(`拆红包失败:${data.sErrMsg}\n`);
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

function taskurl(function_path, body = '', stk) {
  let url = `${BASE_URL}/${function_path}?activeId=${$.activeId}&publishFlag=1&channel=7&${body}&sceneval=2&g_login_type=1&timestamp=${Date.now()}&_=${Date.now() + 2}&_ste=1`;
  const deviceId = `${
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  }`;
  url += `&phoneid=${deviceId}`;
  url += `&stepreward_jstoken=${Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)}`;
  if (stk) {
    url += '&_stk=' + encodeURIComponent(stk);
  }
  return {
    url: url,
    headers: {
      Host: 'wq.jd.com',
      Cookie: cookie,
      accept: '*/*',
      'user-agent': `jdpingou;iPhone;4.8.2;14.5.1;${deviceId};network/wifi;model/iPhone13,4;appBuild/100546;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/0;hasOCPay/0;supportBestPay/0;session/318;pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`,
      'accept-language': 'zh-cn',
      referer: `https://wqactive.jd.com/cube/front/activePublish/step_reward/${$.activeId}.html?aid=${$.activeId}`,
    },
  };
}

function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: 'https://me-api.jd.com/user_new/info/GetJDUserInfoUnion',
      headers: {
        Host: 'me-api.jd.com',
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
            if (data['retcode'] === '1001') {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === '0' && data.data && data.data.hasOwnProperty('userInfo')) {
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

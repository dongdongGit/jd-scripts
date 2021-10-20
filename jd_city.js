/*
城城领现金
=================================Quantumultx=========================
[task_local]
#城城领现金
0 0-23/5,22 * 10 * gua_city.js, tag=城城领现金, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('城城领现金');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//自动抽奖 ，环境变量  JD_CITY_EXCHANGE
let exchangeFlag = $.getdata('jdJxdExchange') || 'false'; //是否开启自动抽奖，建议活动快结束开启，默认关闭
exchangeFlag = $.isNode() ? (process.env.jdJxdExchange ? process.env.jdJxdExchange : `${exchangeFlag}`) : $.getdata('jdJxdExchange') ? $.getdata('jdJxdExchange') : `${exchangeFlag}`;

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let inviteCodes = [
  'RtGKzeWgSFigeoTJENU70nwoh7idxzH2aDTVSxKgn4MggVeQ2g'
];
$.shareCodesArr = [];

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  // await requireConfig();
  if (exchangeFlag + '' == 'true') {
    console.log(`脚本自动抽奖`);
  } else {
    console.log(`脚本不会自动抽奖，建议活动快结束开启，默认关闭(在10.29日自动开启抽奖),如需自动抽奖请设置环境变量  JD_CITY_EXCHANGE 为true`);
  }
  $.inviteIdCodesArr = {};
  for (let i = 0; i < cookiesArr.length && true; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      await getUA();
      await getInviteId();
    }
  }
  if (Object.getOwnPropertyNames($.inviteIdCodesArr).length > 0) {
    for (let i = 0; i < cookiesArr.length && true; i++) {
      if (cookiesArr[i]) {
        cookie = cookiesArr[i];
        $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        $.index = i + 1;
        let code = [];
        for (let s = 0; s < cookiesArr.length && true; s++) {
          if (s != $.index - 1 && $.inviteIdCodesArr[s]) code.push($.inviteIdCodesArr[s]);
        }
        if (code.length > 0) $.shareCodesArr.push(code.join('@'));
      }
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
      await getUA();
      await shareCodesFormat();
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
      // await getInfo($.newShareCodes[i], true)
      await getInviteInfo(); //雇佣
      if (exchangeFlag + '' == 'true') {
        const res = await city_lotteryAward(); //抽奖
        if (res && res > 0) {
          for (let i = 0; i < new Array(res).fill('').length; i++) {
            await $.wait(1000);
            await city_lotteryAward(); //抽奖
          }
        }
      } else {
        //默认10.29开启抽奖
        if (new Date().getMonth() + 1 === 10 && new Date().getDate() >= 29) {
          const res = await city_lotteryAward(); //抽奖
          if (res && res > 0) {
            for (let i = 0; i < new Array(res).fill('').length; i++) {
              await $.wait(1000);
              await city_lotteryAward(); //抽奖
            }
          }
        }
      }
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

function taskPostUrl(functionId, body) {
  return {
    url: `${JD_API_HOST}`,
    body: `functionId=${functionId}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0`,
    headers: {
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
}
function getInviteId() {
  let body = { lbsCity: '16', realLbsCity: '1315', inviteId: '', headImg: '', userName: '', taskChannel: '1' };
  return new Promise((resolve) => {
    $.post(taskPostUrl('city_getHomeData', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            // if (inviteId) $.log(`\n助力结果:\n${data}\n`)
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                if (data.data && data.data.result.userActBaseInfo.inviteId) {
                  console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友互助码】${data.data && data.data.result.userActBaseInfo.inviteId}\n`);
                  $.inviteIdCodesArr[$.index - 1] = data.data.result.userActBaseInfo.inviteId;
                }
              } else {
                console.log(`\n\n获取邀请码失败:${data.data.bizMsg}`);
                if (data.data && !data.data.result.userActBaseInfo.inviteId) {
                  console.log(`账号已黑，看不到邀请码\n`);
                }
              }
            } else {
              console.log(`\n\ncity_getHomeData失败:${JSON.stringify(data)}\n`);
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
function getInfo(inviteId, flag = false) {
  let body = { lbsCity: '16', realLbsCity: '1315', inviteId: inviteId, headImg: '', userName: '', taskChannel: '1' };
  return new Promise((resolve) => {
    $.post(taskPostUrl('city_getHomeData', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            // if (inviteId) $.log(`\n助力结果:\n${data}\n`)
            data = JSON.parse(data);
            if (data.code === 0) {
              if (data.data && data['data']['bizCode'] === 0) {
                console.log(`待提现:￥${data.data.result.userActBaseInfo.poolMoney}`);
                for (let vo of (data.data.result && data.data.result.popWindows) || []) {
                  if (vo && vo.type === 'dailycash_second') {
                    await receiveCash();
                    await $.wait(2 * 1000);
                  }
                }
                for (let vo of (data.data.result && data.data.result.mainInfos) || []) {
                  if (vo && vo.remaingAssistNum === 0 && vo.status === '1') {
                    console.log(vo.roundNum);
                    await receiveCash(vo.roundNum);
                    await $.wait(2 * 1000);
                  }
                }
                if (flag) {
                  // console.log(data.data.result.taskInfo.taskDetailResultVo.taskVos)
                  for (let vo of (data.data.result && data.data.result.taskInfo.taskDetailResultVo.taskVos && false) || []) {
                    if (vo && vo.status == 1) {
                      console.log(vo.taskName);
                      // console.log(vo.roundNum)
                      // await receiveCash(vo.roundNum)
                      // await $.wait(2*1000)
                    }
                  }
                }
              } else {
                console.log(`\n\n${inviteId ? '助力好友' : '获取邀请码'}失败:${data.data.bizMsg}`);
                if (flag) {
                  if (data.data && !data.data.result.userActBaseInfo.inviteId) {
                    console.log(`账号已黑，看不到邀请码\n`);
                  }
                }
              }
            } else {
              console.log(`\n\ncity_getHomeData失败:${JSON.stringify(data)}\n`);
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
function receiveCash(roundNum = '') {
  let body = { cashType: 2 };
  if (roundNum) body = { cashType: 1, roundNum: roundNum };
  return new Promise((resolve) => {
    $.post(taskPostUrl('city_receiveCash', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            console.log(`领红包结果${data}`);
            data = JSON.parse(data);
            if (data['data']['bizCode'] === 0) {
              console.log(`获得 ${data.data.result.currentTimeCash} 元，共计 ${data.data.result.totalCash} 元`);
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
function getInviteInfo() {
  let body = {};
  return new Promise((resolve) => {
    $.post(taskPostUrl('city_masterMainData', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            // console.log(data)
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
function city_lotteryAward() {
  let body = {};
  return new Promise((resolve) => {
    $.post(taskPostUrl('city_lotteryAward', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            console.log(`抽奖结果：${data}`);
            data = JSON.parse(data);
            if (data['data']['bizCode'] === 0) {
              const lotteryNum = data['data']['result']['lotteryNum'];
              resolve(lotteryNum);
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
function readShareCode() {
  console.log(`开始`);
  return new Promise(async (resolve) => {
    $.get({ url: `https://jd.smiek.tk/city`, timeout: 10000 }, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`助力池 API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
    await $.wait(10000);
    resolve();
  });
}
//格式化助力码
function shareCodesFormat() {
  return new Promise(async (resolve) => {
    // console.log(`第${$.index}个京东账号的助力码:::${$.shareCodesArr[$.index - 1]}`)
    $.newShareCodes = [];
    if ($.shareCodesArr[$.index - 1]) {
      $.newShareCodes = $.shareCodesArr[$.index - 1].split('@');
    }
    if ($.index == 1) $.newShareCodes = [...inviteCodes, ...$.newShareCodes];
    try {
      const readShareCodeRes = await readShareCode();
      if (readShareCodeRes && readShareCodeRes.code === 200) {
        $.newShareCodes = [...new Set([...$.newShareCodes, ...(readShareCodeRes.data || [])])];
      }
    } catch (e) {
      console.log(e);
    }
    console.log(`第${$.index}个京东账号将要助力的好友${JSON.stringify($.newShareCodes)}`);
    resolve();
  });
}
function requireConfig() {
  return new Promise((resolve) => {
    console.log(`开始获取${$.name}配置文件\n`);
    //Node.js用户请在jdCookie.js处填写京东ck;
    let shareCodes = [];
    if ($.isNode()) {
      if (process.env.JD_CITY_EXCHANGE) {
        exchangeFlag = process.env.JD_CITY_EXCHANGE || exchangeFlag;
      }
      if (process.env.CITY_SHARECODES) {
        if (process.env.CITY_SHARECODES.indexOf('\n') > -1) {
          shareCodes = process.env.CITY_SHARECODES.split('\n');
        } else {
          shareCodes = process.env.CITY_SHARECODES.split('&');
        }
      }
    }
    console.log(`共${cookiesArr.length}个京东账号\n`);
    $.shareCodesArr = [];
    if ($.isNode()) {
      Object.keys(shareCodes).forEach((item) => {
        if (shareCodes[item]) {
          $.shareCodesArr.push(shareCodes[item]);
        }
      });
    }
    console.log(`您提供了${$.shareCodesArr.length}个账号的${$.name}助力码\n`);
    resolve();
  });
}
function getUA() {
  $.UA = `jdapp;iPhone;10.2.0;13.1.2;${randomString(
    40
  )};M/5.0;network/wifi;ADID/;model/iPhone8,1;addressid/2308460611;appBuild/167853;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;`;
}
function randomString(e) {
  e = e || 32;
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

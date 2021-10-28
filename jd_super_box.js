/*
京东超级盒子
活动时间：未知
更新地址：https://raw.githubusercontent.com/Chibinl/JD-JX/main/jd_superbox.js
活动入口：https://prodev.m.jd.com/mall/active/3z9BVbnAa1sVy88yEyKdp9wcWZ7Z/index.html
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#京东超级盒子
10 1,6,8 25-31,1-11 10,11 * jd_superbox.js, tag=京东超级盒子, enabled=true

================Loon==============
[Script]
cron "10 1,6,8 25-31,1-11 10,11 *" script-path=jd_superbox.js,tag=京东超级盒子

===============Surge=================
京东超级盒子 = type=cron,cronexp="10 1,6,8 25-31,1-11 10,11 *",wake-system=1,timeout=3600,script-path=jd_superbox.js

============小火箭=========
京东超级盒子 = type=cron,script-path=jd_superbox.js, cronexpr="10 1,6,8 25-31,1-11 10,11 *", timeout=3600, enable=true
*/
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('京东超级盒子');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
const randomCount = $.isNode() ? 20 : 5;

const inviteCodes = [];
$.allInvite = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
  if (JSON.stringify(process.env).indexOf('GITHUB') > -1) process.exit(0);
} else {
  let cookiesData = $.getdata('CookiesJD') || '[]';
  cookiesData = jd_helpers.jsonParse(cookiesData);
  cookiesArr = cookiesData.map((item) => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter((item) => item !== '' && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://api.m.jd.com/';
const UA = `jdapp;iPhone;10.2.0;14.6;${randomWord(
  false,
  40,
  40
)};network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/0;appBuild/167853;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16E158;supportJDSHWK/1`;
function randomWord(randomFlag, min, max) {
  var str = '',
    range = min,
    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

  // 随机产生
  if (randomFlag) {
    range = Math.round(Math.random() * (max - min)) + min;
  }
  for (var i = 0; i < range; i++) {
    pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
    return;
  }
  await requireConfig();
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.beans = 0;
      $.nickName = '';
      message = '';
      await $.totalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { 'open-url': 'https://bean.m.jd.com/' });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        } else {
          $.setdata('', `CookieJD${i ? i + 1 : ''}`); //cookie失效，故清空cookie。$.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        }
        continue;
      }
      await shareCodesFormat();
      await superBox();
      await showMsg();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

function showMsg() {
  message += `本次运行获得${$.earn}红包`;
  return new Promise((resolve) => {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve();
  });
}

async function superBox() {
  $.earn = 0.0;
  await drawInfo();
  await getTask();
  await drawInfo(false);
  await helpFriends();
}

async function helpFriends() {
  for (let code of $.newShareCodes) {
    if (!code) continue;
    console.log(`去助力好友${code}`);
    const helpRes = await doSupport(code);
    await $.wait(1000);
  }
}

function getTask() {
  return new Promise((resolve) => {
    $.get(taskUrl('apTaskList', { linkId: 'DQFdr1ttvWWzn0wsQ7JDZQ', encryptPin: '' }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.success) {
              for (let vo of data.data) {
                if (vo.taskType === 'BROWSE_SHOP') {
                  if (vo.taskDoTimes < vo.taskLimitTimes) {
                    console.log(`去做${vo.taskTitle}任务`);
                    for (let i = vo.taskDoTimes; i < vo.taskLimitTimes; ++i) {
                      await getTaskDetail(vo.id, vo.taskType);
                      return;
                    }
                  } else console.log(`${vo.taskTitle}任务已做完`);
                } else if (vo.taskType === 'SHARE_INVITE') {
                  console.log(`助力任务完成进度${vo.taskDoTimes}/${vo.taskLimitTimes}`);
                }
              }
            } else {
              console.log(`任务获取失败`);
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
function getTaskDetail(taskId, taskType) {
  let body = {
    taskId: taskId,
    taskType: taskType,
    channel: 4,
    linkId: 'DQFdr1ttvWWzn0wsQ7JDZQ',
    encryptPin: '',
  };
  return new Promise((resolve) => {
    $.get(taskUrl('apTaskDetail', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.success) {
              for (let vo of data.data.taskItemList) {
                await doTask(taskId, taskType, vo.itemId);
                await $.wait(1000);
              }
            } else {
              console.log(`任务获取失败`);
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
function doTask(taskId, taskType, itemId) {
  let body = {
    taskId: taskId,
    taskType: taskType,
    channel: 4,
    itemId: itemId,
    linkId: 'DQFdr1ttvWWzn0wsQ7JDZQ',
    encryptPin: '',
  };
  return new Promise((resolve) => {
    $.post(taskPostUrl('apDoTask', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);

            if (data.success) {
              console.log(`任务完成成功`);
            } else {
              console.log(`任务完成失败`);
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
function drawInfo(share = true) {
  let body = { taskId: '', linkId: 'DQFdr1ttvWWzn0wsQ7JDZQ', encryptPin: '' };
  return new Promise((resolve) => {
    $.get(taskUrl('superboxSupBoxHomePage', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.success) {
              if (share) {
                console.log(`您的好友助力码为${data.data.encryptPin}`);
              } else {
                console.log(`剩余抽奖次数${data.data.lotteryNumber}`);
                let i = data.data.lotteryNumber;
                let time = new Date().getHours();

                if (i && time >= 23) console.log(`去抽奖`);
                while (i-- && time >= 23) {
                  await draw();
                  await $.wait(1000);
                }
              }
            } else {
              console.log(`抽奖失败`);
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
function draw() {
  let body = { taskId: '', linkId: 'DQFdr1ttvWWzn0wsQ7JDZQ', encryptPin: '' };
  return new Promise((resolve) => {
    $.get(taskUrl('superboxOrdinaryLottery', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.success) {
              if (data.data.discount) {
                $.earn += parseFloat(data.data.discount);
                console.log(`获得${data.data.discount}红包`);
              } else console.log(`获得空气`);
            } else {
              console.log(`抽奖失败`);
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

function doSupport(shareId) {
  let body = { taskId: '332', linkId: 'DQFdr1ttvWWzn0wsQ7JDZQ', encryptPin: shareId };
  return new Promise((resolve) => {
    $.get(taskUrl('superboxSupBoxHomePage', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.success) {
              console.log(`助力成功`);
            } else {
              console.log(`助力失败`);
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
function getTs() {
  return new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
}

function taskPostUrl(function_id, body = {}) {
  const t = getTs();
  return {
    url: `${JD_API_HOST}`,
    body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&_t=${t}&appid=activities_platform`,
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Host: 'api.m.jd.com',
      Referer: 'https://prodev.m.jd.com',
      Cookie: cookie,
      dnt: '1',
      pragma: 'no-cache',
      'User-Agent': UA,
    },
  };
}

function taskUrl(function_id, body = {}) {
  const t = getTs();
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&_t=${t}&appid=activities_platform`,
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Host: 'api.m.jd.com',
      Referer: 'https://prodev.m.jd.com',
      Cookie: cookie,
      'User-Agent': UA,
    },
  };
}

function requireConfig() {
  return new Promise((resolve) => {
    console.log(`开始获取${$.name}配置文件\n`);
    //Node.js用户请在jdCookie.js处填写京东ck;
    let shareCodes = [];
    console.log(`共${cookiesArr.length}个京东账号\n`);
    if ($.isNode() && process.env.JDSUPERBOX_SHARECODES) {
      if (process.env.JDSUPERBOX_SHARECODES.indexOf('\n') > -1) {
        shareCodes = process.env.JDSUPERBOX_SHARECODES.split('\n');
      } else {
        shareCodes = process.env.JDSUPERBOX_SHARECODES.split('&');
      }
    }
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

//格式化助力码
function shareCodesFormat() {
  return new Promise(async (resolve) => {
    // console.log(`第${$.index}个京东账号的助力码:::${$.shareCodesArr[$.index - 1]}`)
    $.newShareCodes = [
      'qeFo6LEi5F7S_tWuny6MTtzpbOw3JnAsRyrH3lBfXx8'
    ];
    if ($.shareCodesArr[$.index - 1]) {
      $.newShareCodes = $.shareCodesArr[$.index - 1].split('@');
    } else {
      console.log(`由于您第${$.index}个京东账号未提供shareCode,将采纳本脚本自带的助力码\n`);
      const tempIndex = $.index > inviteCodes.length ? inviteCodes.length - 1 : $.index - 1;
      $.newShareCodes = (inviteCodes[tempIndex] && inviteCodes[tempIndex].split('@')) || [];
    }
    //const readShareCodeRes = null; // await readShareCode();
    //if (readShareCodeRes && readShareCodeRes.code === 200) {
    // $.newShareCodes = [...new Set([...$.newShareCodes, ...(readShareCodeRes.data || [])])];
    //}
    console.log(`第${$.index}个京东账号将要助力的好友${JSON.stringify($.newShareCodes)}`);
    resolve();
  });
}
function readShareCode() {
  console.log(`开始`);
  return new Promise(async (resolve) => {
    $.get(
      {
        url: `http://jd.turinglabs.net/api/v2/jd/festival/read/${randomCount}/`,
        timeout: 10000,
      },
      (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} API请求失败，请检查网路重试`);
          } else {
            if (data) {
              console.log(`随机取${randomCount}个PK助力码放到您固定的互助码后面(不影响已有固定互助)`);
              data = JSON.parse(data);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      }
    );
    await $.wait(10000);
    resolve();
  });
}

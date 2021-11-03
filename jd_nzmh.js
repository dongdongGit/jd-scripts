/*
女装盲盒
活动时间：2021-10-31至2021-11-30
活动地址：https://anmp.jd.com/babelDiy/Zeus/4DYrdEbbkinoufRCg9LXnRxJKEZS/index.html
活动入口：京东app-女装馆-赢京豆
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#女装盲盒
35 1,23 * * * jd_nzmh.js, tag=女装盲盒, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon==============
[Script]
cron "35 1,23 * * *" script-path=jd_nzmh.js,tag=女装盲盒
===============Surge=================
女装盲盒 = type=cron,cronexp="35 1,23 * * *",wake-system=1,timeout=3600,script-path=jd_nzmh.js
============小火箭=========
女装盲盒 = type=cron,script-path=jd_nzmh.js, cronexpr="35 1,23 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('女装盲盒抽京豆');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
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
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
    return;
  }
  console.log('女装盲盒\n' + '活动时间：2021-10-31至2021-11-30\n' + '活动地址：https://anmp.jd.com/babelDiy/Zeus/4DYrdEbbkinoufRCg9LXnRxJKEZS/index.html');
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.beans = 0;
      message = '';
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      await $.totalBean();
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { 'open-url': 'https://bean.m.jd.com/' });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      try {
        await jdMh('https://anmp.jd.com/babelDiy/Zeus/4DYrdEbbkinoufRCg9LXnRxJKEZS/index.html');
      } catch (e) {
        $.logErr(e);
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

async function jdMh(url) {
  try {
    await getInfo(url);
    await getUserInfo();
    await draw();
    while ($.userInfo.bless >= $.userInfo.cost_bless_one_time) {
      await draw();
      await getUserInfo();
      await $.wait(500);
    }
    await showMsg();
  } catch (e) {
    $.logErr(e);
  }
}

function showMsg() {
  return new Promise((resolve) => {
    if ($.beans) {
      message += `本次运行获得${$.beans}京豆`;
      $.msg($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve();
  });
}

function getInfo(url) {
  console.log(`url:${url}`);
  return new Promise((resolve) => {
    $.get(
      {
        url,
        headers: {
          Cookie: cookie,
        },
      },
      (err, resp, data) => {
        try {
          $.info = JSON.parse(data.match(/var snsConfig = (.*)/)[1]);
          $.prize = JSON.parse($.info.prize);
          resolve();
        } catch (e) {
          console.log(e);
        }
      }
    );
  });
}

function getUserInfo() {
  return new Promise((resolve) => {
    $.get(taskUrl('query'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jd_helpers.jsonParse(resp.body)['message']}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          $.userInfo = JSON.parse(data.match(/query\((.*)\n/)[1]).data;
          // console.log(`您的好友助力码为${$.userInfo.shareid}`)
          console.log(`当前幸运值：${$.userInfo.bless}`);
          for (let task of $.info.config.tasks) {
            if (!$.userInfo.complete_task_list.includes(task['_id'])) {
              console.log(`去做任务${task['_id']}`);
              await doTask(task['_id']);
              await $.wait(500);
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

function doTask(taskId) {
  let body = `task_bless=10&taskid=${taskId}`;
  return new Promise((resolve) => {
    $.get(taskUrl('completeTask', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jd_helpers.jsonParse(resp.body)['message']}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data.match(/query\((.*)\n/)[1]);
          if (data.data.complete_task_list.includes(taskId)) {
            console.log(`任务完成成功，当前幸运值${data.data.curbless}`);
            $.userInfo.bless = data.data.curbless;
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

function draw() {
  return new Promise((resolve) => {
    $.get(taskUrl('draw'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jd_helpers.jsonParse(resp.body)['message']}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data.match(/query\((.*)\n/)[1]);
          if (data.data && data.data.drawflag) {
            if ($.prize.filter((vo) => vo.prizeLevel === data.data.level).length > 0) {
              console.log(`获得${$.prize.filter((vo) => vo.prizeLevel === data.data.level)[0].prizename}`);
              $.beans += $.prize.filter((vo) => vo.prizeLevel === data.data.level)[0].beansPerNum;
            } else {
              console.log(`抽奖 未中奖`);
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

function taskUrl(function_id, body = '') {
  body = `activeid=${$.info.activeId}&token=${$.info.actToken}&sceneval=2&_=${new Date().getTime()}&callback=query&${body}`;
  return {
    url: `https://wq.jd.com/activet2/piggybank/${function_id}?${body}`,
    headers: {
      Host: 'wq.jd.com',
      Accept: 'application/json',
      'Accept-Language': 'zh-cn',
      'Content-Type': 'application/json;charset=utf-8',
      Origin: 'wq.jd.com',
      'User-Agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
      Referer: `https://anmp.jd.com/babelDiy/Zeus/xKACpgVjVJM7zPKbd5AGCij5yV9/index.html?wxAppName=jd`,
      Cookie: cookie,
    },
  };
}


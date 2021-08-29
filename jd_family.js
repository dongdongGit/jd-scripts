/*
京东家庭号
活动入口：玩一玩-家庭号
8000幸福值可换100京豆，一天任务做完大概300幸福值，周期较长
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js

易黑号，建议禁用
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东家庭号
1 12,23 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_family.js, tag=京东家庭号, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_family.png, enabled=true

================Loon==============
[Script]
cron "1 12,23 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_family.js,tag=京东家庭号

===============Surge=================
京东家庭号 = type=cron,cronexp="1 12,23 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_family.js

============小火箭=========
京东家庭号 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_family.js, cronexpr="1 12,23 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东家庭号');
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
      $.beans = 0;
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
      await jdFamily();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function jdFamily() {
  await getInfo();
  await getUserInfo();
  await getUserInfo(true);
  await showMsg();
}

function showMsg() {
  return new Promise((resolve) => {
    // message += `本次运行获得${$.beans}京豆`
    $.log($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    resolve();
  });
}

function getInfo() {
  return new Promise((resolve) => {
    $.get(
      {
        url: 'https://lgame.jd.com/babelDiy/Zeus/VhPVVaw8nTSVr69E757fyCebwKG/index.html',
        headers: {
          Cookie: cookie,
        },
      },
      async (err, resp, data) => {
        try {
          $.info = JSON.parse(data.match(/var snsConfig = (.*)/)[1]);
          $.prize = JSON.parse($.info.prize);
        } catch (e) {
          console.log(e);
        } finally {
          resolve();
        }
      }
    );
  });
}

function getUserInfo(info = false) {
  return new Promise((resolve) => {
    $.get(taskUrl('family_query'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jd_helpers.jsonParse(resp.body)['message']}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          $.userInfo = JSON.parse(data.match(/query\((.*)\n/)[1]);
          console.log(`当前幸福值：${$.userInfo.tatalprofits}`);
          if (info) {
            message += `当前幸福值：${$.userInfo.tatalprofits}`;
          } else
            for (let task of $.info.config.tasks) {
              let vo = $.userInfo.tasklist.filter((vo) => vo.taskid === task['_id']);
              if (vo.length > 0) {
                vo = vo[0];
                // 5fed97ce5da81a8c069810df 健身 2 9 3
                // 5fed97ce5da81a8c069810de 撸猫 80 6 1
                // 5fed97ce5da81a8c069810dd 做美食 40 10 2
                // 5fed97ce5da81a8c069810dc 去组队 150 13 5
                if (vo['isdo'] === 1) {
                  if (vo['times'] === 0) {
                    console.log(`去做任务${task['_id']}`);
                    await doTask(task['_id']);
                    await $.wait(1000);
                  } else {
                    console.log(`${Math.trunc(vo['times'] / 60)}分钟可后做任务${task['_id']}`);
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

function doTask(taskId) {
  let body = `taskid=${taskId}`;
  return new Promise((resolve) => {
    $.get(taskUrl('family_task', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jd_helpers.jsonParse(resp.body)['message']}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data.match(/query\((.*)\n/)[1]);
          if (data.ret === 0) {
            console.log(`任务完成成功`);
          } else {
            console.log(`任务完成失败，原因未知`);
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
  body = `activeid=${$.info.activeId}&token=${$.info.actToken}&sceneval=2&shareid=&t=${Date.now()}&_=${new Date().getTime()}&callback=query&${body}`;
  return {
    url: `https://wq.jd.com/activep3/family/${function_id}?${body}`,
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

function taskPostUrl(function_id, body) {
  return {
    url: `https://lzdz-isv.isvjcloud.com/${function_id}`,
    body: body,
    headers: {
      Host: 'lzdz-isv.isvjcloud.com',
      Accept: 'application/json',
      'Accept-Language': 'zh-cn',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://lzdz-isv.isvjcloud.com',
      'User-Agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
      Referer: `https://lzdz-isv.isvjcloud.com/dingzhi/book/develop/activity?activityId=${ACT_ID}`,
      Cookie: `${cookie} isvToken=${$.isvToken};`,
    },
  };
}
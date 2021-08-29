/*
超级直播间红包雨
更新时间：2021-06-4
下一场超级直播间时间:06月11日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4334560
下一场超级直播间时间:06月10日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4334536
下一场超级直播间时间:06月09日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4334513
下一场超级直播间时间:06月08日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4272306
下一场超级直播间时间:06月06日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4334496
下一场超级直播间时间:06月05日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4313541
下一场超级直播间时间:06月04日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4228810
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js
==============Quantumult X==============
[task_local]
#超级直播间红包雨
0,30 0-23/1 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_live_redrain.js, tag=超级直播间红包雨, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

==============Loon==============
[Script]
cron "0,30 0-23/1 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_live_redrain.js,tag=超级直播间红包雨

================Surge===============
超级直播间红包雨 = type=cron,cronexp="0,30 0-23/1 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_live_redrain.js

===============小火箭==========
超级直播间红包雨 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_live_redrain.js, cronexpr="0,30 0-23/1 * * *", timeout=3600, enable=true
*/
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('超级直播间红包雨');
let allMessage = '',
  id = 'RRA2cUocg5uYEyuKpWNdh4qE4NW1bN2';
let bodyList = {
  4: {
    url: 'https://api.m.jd.com/client.action?functionId=liveActivityV946&uuid=8888888&client=apple&clientVersion=9.4.1&st=1622787088046&sign=835678723e60414a533d2586769a2633&sv=100',
    body: 'body=%7B%22liveId%22%3A%224228810%22%7D',
  },
  5: {
    url: 'https://api.m.jd.com/client.action?functionId=liveActivityV946&uuid=8888888&client=apple&clientVersion=9.4.1&st=1622787086031&sign=7eea743cf1ca5db443042c182595cb51&sv=122',
    body: 'body=%7B%22liveId%22%3A%224313541%22%7D',
  },
  6: {
    url: 'https://api.m.jd.com/client.action?functionId=liveActivityV946&uuid=8888888&client=apple&clientVersion=9.4.1&st=1622787084017&sign=95253384b3b3662b2ab88ee94d6abcc7&sv=122',
    body: 'body=%7B%22liveId%22%3A%224334496%22%7D',
  },
  8: {
    url: 'https://api.m.jd.com/client.action?functionId=liveActivityV946&uuid=8888888&client=apple&clientVersion=9.4.1&st=1622787080081&sign=76fc5c3b2c8f5c514c9c702ba3a7af5d&sv=100',
    body: 'body=%7B%22liveId%22%3A%224272306%22%7D',
  },
  9: {
    url: 'https://api.m.jd.com/client.action?functionId=liveActivityV946&uuid=8888888&client=apple&clientVersion=9.4.1&st=1622787077047&sign=6323b82d53a8a1dad5c98a405e64bc2b&sv=112',
    body: 'body=%7B%22liveId%22%3A%224334513%22%7D',
  },
  10: {
    url: 'https://api.m.jd.com/client.action?functionId=liveActivityV946&uuid=8888888&client=apple&clientVersion=9.4.1&st=1622787074008&sign=11694f560e1dee217ee1ecd04d49d25f&sv=100',
    body: 'body=%7B%22liveId%22%3A%224334536%22%7D',
  },
  11: {
    url: 'https://api.m.jd.com/client.action?functionId=liveActivityV946&uuid=8888888&client=apple&clientVersion=9.4.1&st=1622787073021&sign=32d1acdd573017244637a8c616cd3b47&sv=102',
    body: 'body=%7B%22liveId%22%3A%224334560%22%7D',
  },
};
let ids = {};
for (let i = 0; i < 24; i++) {
  ids[i] = id;
}
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
  // if (JSON.stringify(process.env).indexOf('GITHUB') > -1) process.exit(0)
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/api';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
    return;
  }
  console.log(
    '下一场超级直播间时间:06月11日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4334560\n' +
      '下一场超级直播间时间:06月10日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4334536\n' +
      '下一场超级直播间时间:06月09日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4334513\n' +
      '下一场超级直播间时间:06月08日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4272306\n' +
      '下一场超级直播间时间:06月06日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4334496\n' +
      '下一场超级直播间时间:06月05日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4313541\n' +
      '下一场超级直播间时间:06月04日  18:00，直播间地址：https://h5.m.jd.com/dev/3pbY8ZuCx4ML99uttZKLHC2QcAMn/live.html?id=4228810'
  );
  $.newAcids = [];
  await getRedRain();

  let nowTs = new Date().getTime();
  if (!($.st <= nowTs && nowTs < $.ed)) {
    $.log(`\n远程红包雨配置获取错误，尝试从本地读取配置`);
    $.http
      .get({ url: `https://purge.jsdelivr.net/gh/gitupdate/updateTeam@master/redrain.json` })
      .then((resp) => {})
      .catch((e) => $.log('刷新CDN异常', e));
    let hour = (new Date().getUTCHours() + 8) % 24;
    let redIds = await getRedRainIds();
    if (!redIds) redIds = await getRedRainIds('https://cdn.jsdelivr.net/gh/gitupdate/updateTeam@master/redrain.json');
    $.newAcids = [...(redIds || [])];
    if ($.newAcids && $.newAcids.length) {
      $.log(`本地红包雨配置获取成功，ID为：${JSON.stringify($.newAcids)}\n`);
    } else {
      $.log(`无法从本地读取配置，请检查运行时间(注：非红包雨时间执行出现此提示请忽略！！！！！！！！！！！)`);
      return;
    }
    // if (ids[hour]) {
    //   $.activityId = ids[hour]
    //   $.log(`本地红包雨配置获取成功，ID为：${$.activityId}\n`)
    // } else {
    //   $.log(`无法从本地读取配置，请检查运行时间(注：非红包雨时间执行出现此提示请忽略！！！！！！！！！！！)`)
    //   $.log(`非红包雨期间出现上面提示请忽略。红包雨期间会正常，此脚本提issue打死！！！！！！！！！！！)`)
    //   return
    // }
  } else {
    $.log(`远程红包雨配置获取成功`);
  }
  for (let id of $.newAcids) {
    // $.activityId = id;
    if (!id) continue;
    console.log(`\n今日${new Date().getHours()}点ID：${id}\n`);
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
          $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, { 'open-url': 'https://bean.m.jd.com/' });
          if ($.isNode()) {
            await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
          }
          continue;
        }
        let nowTs = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
        // console.log(nowTs, $.startTime, $.endTime)
        // await showMsg();
        if (id) await receiveRedRain(id);
      }
    }
  }
  if (allMessage) {
    if ($.isNode()) await notify.sendNotify(`${$.name}`, `${allMessage}`);
    $.msg($.name, '', allMessage);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

function showMsg() {
  return new Promise((resolve) => {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve();
  });
}

function getRedRain() {
  let body;
  if (bodyList.hasOwnProperty(new Date().getDate())) {
    body = bodyList[new Date().getDate()];
  } else {
    return;
  }
  return new Promise((resolve) => {
    $.post(taskGetUrl(body.url, body.body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.data && data.data.iconArea) {
              // console.log(data.data.iconArea.filter(vo => vo['type'] === 'anchor_darw_lottery').length && data.data.iconArea.filter(vo => vo['type'] === 'anchor_darw_lottery')[0].data.lotteryId)
              let act = data.data.iconArea.filter((vo) => vo['type'] === 'platform_red_packege_rain')[0];
              if (act) {
                let url = act.data.activityUrl;
                $.activityId = url.substr(url.indexOf('id=') + 3);
                $.newAcids.push($.activityId);
                $.st = act.startTime;
                $.ed = act.endTime;
                console.log($.activityId);

                console.log(`下一场红包雨开始时间：${new Date($.st)}`);
                console.log(`下一场红包雨结束时间：${new Date($.ed)}`);
              } else {
                console.log(`\n暂无超级直播间红包雨`);
              }
            } else {
              console.log(`\n暂无超级直播间红包雨`);
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

function receiveRedRain(actId) {
  return new Promise((resolve) => {
    const body = { actId };
    $.get(taskUrl('noahRedRainLottery', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.subCode === '0') {
              console.log(`领取成功，获得${JSON.stringify(data.lotteryResult)}`);
              // message+= `领取成功，获得${JSON.stringify(data.lotteryResult)}\n`
              message += `领取成功，获得 ${data.lotteryResult.jPeasList[0].quantity}京豆`;
              allMessage += `京东账号${$.index}${$.nickName || $.UserName}\n领取成功，获得 ${data.lotteryResult.jPeasList[0].quantity}京豆${$.index !== cookiesArr.length ? '\n\n' : ''}`;
            } else if (data.subCode === '8') {
              console.log(`领取失败：本场已领过`);
              message += `领取失败，本场已领过`;
            } else {
              console.log(`异常：${JSON.stringify(data)}`);
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

function taskGetUrl(url, body) {
  return {
    url: url,
    body: body,
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Host: 'api.m.jd.com',
      Referer: `https://h5.m.jd.com/active/redrain/index.html?id=${$.activityId}&lng=0.000000&lat=0.000000&sid=&un_area=`,
      Cookie: cookie,
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };
}

function taskPostUrl(function_id, body = body) {
  return {
    url: `https://api.m.jd.com/client.action?functionId=${function_id}`,
    body: body,
    headers: {
      Host: 'api.m.jd.com',
      'content-type': 'application/x-www-form-urlencoded',
      accept: '*/*',
      'user-agent': 'JD4iPhone/167408 (iPhone; iOS 14.2; Scale/3.00)',
      'accept-language': 'zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6',
      //"Cookie": cookie,
    },
  };
}

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&_=${
      new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000
    }`,
    headers: {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Host: 'api.m.jd.com',
      Referer: `https://h5.m.jd.com/active/redrain/index.html?id=${$.activityId}&lng=0.000000&lat=0.000000&sid=&un_area=`,
      Cookie: cookie,
      'User-Agent': 'JD4iPhone/9.4.5 CFNetwork/1209 Darwin/20.2.0',
    },
  };
}

function getRedRainIds(url = 'https://raw.githubusercontent.com/gitupdate/updateTeam/master/redrain.json') {
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
    await $.wait(10000);
    resolve([]);
  });
}

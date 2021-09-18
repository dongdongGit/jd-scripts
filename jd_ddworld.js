/*
* 活动地址:https://ddsj-dz.isvjcloud.com/dd-world/load_app/load_app.html
cron 20 8 * * * jd_ddworld.js
* */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('东东世界');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let cookiesArr = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
let authorization = {};
let invitelist = [];
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = '';
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    await $.totalBean();
    console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
    if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    
        if ($.isNode()) {
            await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
    }
    await main();
  }
  console.log(JSON.stringify(invitelist));
  cookiesArr = getRandomArrayElements(cookiesArr, cookiesArr.length);
  console.log(`\n\n====================开始脚本内互助===============================`);
  for (let i = 0; i < cookiesArr.length; i++) {
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    if (!authorization[$.UserName]) {
      continue;
    }
    $.canHelp = true;
    $.accessToken = authorization[$.UserName];
    for (let j = 0; j < invitelist.length && $.canHelp; j++) {
      $.oneInvite = invitelist[j];
      if ($.oneInvite.user === $.UserName || $.oneInvite.needTime === 0) {
        continue;
      }
      console.log(`\n${$.UserName}去助力${$.oneInvite.user},助力码:${$.oneInvite.inviter_id}`);
      await takePostRequest('do_assist_task');
    }
    await $.wait(2000);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function main() {
  $.token = ``;
  await getToken();
  if ($.token === ``) {
    console.log(`获取token失败`);
    return;
  }
  $.accessToken = '';
  await takePostRequest('jd-user-info');
  if (!$.accessToken) {
    console.log(`获取accessToken失败`);
    return;
  }
  authorization[$.UserName] = $.accessToken;
  $.userInfo = {};
  await takeGetRequest('get_user_info');
  console.log(`助力码：${$.userInfo.openid}`);
  $.taskList = [];
  await takeGetRequest('get_task');
  await $.wait(2000);
  await doTask();
}
function getRandomArrayElements(arr, count) {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - count,
    temp,
    index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

async function doTask() {
  for (let i = 0; i < $.taskList.length; i++) {
    $.oneTask = $.taskList[i];
    $.taskDetailList = $.oneTask.simpleRecordInfoVo || $.oneTask.browseShopVo || $.oneTask.shoppingActivityVos || $.oneTask.productInfoVos || $.oneTask.assistTaskDetailVo;
    console.log(`任务：${$.oneTask.taskName},需要完成${$.oneTask.maxTimes}次，已完成${$.oneTask.times}次`);
    if ($.oneTask.status === 2) {
      continue;
    }
    if ($.oneTask.taskType === 6) {
      invitelist.push({
        user: $.UserName,
        inviter_id: $.userInfo.openid,
        taskToken: $.taskDetailList.taskToken,
        needTime: Number($.oneTask.maxTimes) - Number($.oneTask.times),
      });
      continue;
    }
    for (let j = 0; j < $.taskDetailList.length; j++) {
      $.info = $.taskDetailList[j];
      if ($.info.status !== 1) {
        continue;
      }
      let waitDuration = 2;
      if (Number($.oneTask.waitDuration) > 0) {
        waitDuration = $.oneTask.waitDuration;
      }
      console.log(`任务：${$.oneTask.taskName} 去执行,等待${waitDuration}秒`);
      await takePostRequest('do_task');
      await $.wait(waitDuration * 1000);
    }
  }
}

async function takePostRequest(type) {
  let body = ``;

  switch (type) {
    case 'jd-user-info':
      body = `token=${$.token}&source=01`;
      break;
    case 'do_task':
      body = `taskToken=${$.info.taskToken}&task_id=${$.oneTask.taskId}&task_type=${$.oneTask.taskType}`;
      break;
    case 'do_assist_task':
      body = `taskToken=${$.oneInvite.taskToken}&inviter_id=${$.oneInvite.inviter_id}`;
      break;
    default:
      console.log(`错误${type}`);
  }
  let myRequest = {
    url: `https://ddsj-dz.isvjcloud.com/dd-api/${type}`,
    headers: {
      Origin: `ddsj-dz.isvjcloud.com`,
      Connection: `keep-alive`,
      Accept: `application/json, text/plain, */*`,
      Authorization: `Bearer ${$.accessToken ?? 'undefined'}`,
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `https://ddsj-dz.isvjcloud.com/dd-world/logined_jd/`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7`,
      Cookie: 'dd-world=${$.accessToken};' + $.cookie,
      Host: `ddsj-dz.isvjcloud.com`,
      'X-Requested-With': 'com.jingdong.app.mall',
    },
    body: body,
  };
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        dealReturn(type, data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
async function takeGetRequest(type) {
  let myRequest = {
    url: `https://ddsj-dz.isvjcloud.com/dd-api/${type}`,
    headers: {
      Origin: `ddsj-dz.isvjcloud.com`,
      Connection: `keep-alive`,
      Accept: `application/json, text/plain, */*`,
      Authorization: `Bearer ${$.accessToken ?? 'undefined'}`,
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `https://ddsj-dz.isvjcloud.com/dd-world/logined_jd/`,
      'Accept-Encoding': `gzip, deflate`,
      'Accept-Language': `zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7`,
      Cookie: 'dd-world=${$.accessToken};' + $.cookie,
      Host: `ddsj-dz.isvjcloud.com`,
      'X-Requested-With': 'com.jingdong.app.mall',
    },
  };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        dealReturn(type, data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function dealReturn(type, data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log(`返回异常：${data}`);
    return;
  }
  switch (type) {
    case 'jd-user-info':
      if (data.access_token) {
        $.accessToken = data.access_token;
      }
      break;
    case 'get_user_info':
      $.userInfo = data;
      break;
    case 'get_task':
      if (data.bizCode === '0') {
        $.taskList = data.result.taskVos;
      }
      break;
    case 'do_task':
      if (data.score) {
        console.log(`执行成功,获得积分:${data.score}`);
      } else {
        console.log(`执行成功`);
      }
      break;
    case 'do_assist_task':
      $.canHelp = false;
      if (data.score) {
        console.log(`助力成功`);
        $.oneInvite.needTime--;
      } else if (data.status_code === 422) {
        console.log(`助力次数已用完`);
      }
      break;
    default:
      console.log('异常');
      console.log(JSON.stringify(data));
  }
}

async function getToken() {
  let config = {
    url: 'https://api.m.jd.com/client.action',
    body: 'functionId=isvObfuscator&body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fddsj-dz.isvjcloud.com%22%7D&uuid=5162ca82aed35fc52e8&client=apple&clientVersion=10.0.10&st=1631884203742&sv=112&sign=fd40dc1c65d20881d92afe96c4aec3d0',
    headers: {
      Host: 'api.m.jd.com',
      accept: '*/*',
      'user-agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
      'accept-language': 'zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6',
      'content-type': 'application/x-www-form-urlencoded',
      Cookie: $.cookie,
    },
  };
  return new Promise((resolve) => {
    $.post(config, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          $.token = data['token'];
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

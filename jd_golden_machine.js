/**
 *  活动路径  手机馆---》IQOO大牌日---〉左下角金机馆
 *  33 4,7 8-20 8 *
 *  第一个账号参加作者内置的团，其他账号参加第一个账号的团
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('金机奖投票');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
$.authorizationInfo = {};
$.joinTeamLsit = [];
$.inviteList = [];
$.authorCode = '';
let res = [];
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  $.authorCode = '611136589fd8b23773';
  for (let i = 0; i < cookiesArr.length; i++) {
    await getUA();
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = '';
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    await $.totalBean();
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
    await $.wait(1000);
    $.authorizationInfo[$.UserName] = $.authorization;
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
  if ($.token === `` || !$.token) {
    console.log(`获取token失败`);
    return;
  }
  console.log(`token:${$.token}`);
  await $.wait(1000);
  $.authorization = ``;
  await getJdUserInfo();
  if ($.authorization === ``) {
    console.log(`获取authorization失败`);
    return;
  }
  await $.wait(1000);
  $.useInfo = {};
  await takeGetRequest('get_user_info');
  if (JSON.stringify($.useInfo) === `{}` || $.useInfo.status_code === 403) {
    console.log(`获取用户信息失败,可能是黑号`);
    return;
  }
  console.log(`组队码：${$.useInfo.code}`);
  await $.wait(1000);
  $.homeInfo = {};
  await takeGetRequest('get_home_info');
  if (JSON.stringify($.homeInfo) === `{}`) {
    console.log(`获取活动详情失败`);
    return;
  }
  if ($.homeInfo.status_code == 10011) {
    console.log(`${$.homeInfo.message}`);
    return;
  }
  if ($.useInfo.member_team_id === 0 && $.authorCode) {
    console.log(`去参团: ${$.authorCode}`);
    await takePostRequest('join_team');
  } else {
    console.log(`已参团`);
  }
  if ($.index === 1) {
    $.authorCode = $.useInfo.code;
  }

  $.needVoteList = $.homeInfo.hard_list;
  await doVote();
  $.needVoteList = $.homeInfo.soft_list;
  await doVote();
  $.teamInfo = {};
  $.type = 1;
  await takeGetRequest('team_info');
  console.log(`自己队伍分数：${$.teamInfo.team_vote_total}`);
  await $.wait(2000);
  if (Number($.teamInfo.my_vote_total) > 0) {
    if ($.teamInfo.draw_total_first === 0 && $.teamInfo.team_vote_total >= 80) {
      console.log(`去抽奖1`);
      $.draw_type = 1;
      await takePostRequest('draw_prize');
      await $.wait(2000);
    }
    if ($.teamInfo.draw_total_second === 0 && $.teamInfo.team_vote_total >= 180) {
      console.log(`去抽奖2`);
      $.draw_type = 2;
      await takePostRequest('draw_prize');
      await $.wait(2000);
    }
  }
  $.type = 2;
  await takeGetRequest('team_info');
  console.log(`加入队伍分数：${$.teamInfo.team_vote_total}`);
  await $.wait(2000);
  if (Number($.teamInfo.my_vote_total) > 0) {
    if ($.teamInfo.draw_total_first === 0 && $.teamInfo.team_vote_total >= 80) {
      console.log(`去抽奖3`);
      $.draw_type = 1;
      await takePostRequest('draw_prize');
      await $.wait(2000);
    }
    if ($.teamInfo.draw_total_second === 0 && $.teamInfo.team_vote_total >= 180) {
      console.log(`去抽奖4`);
      $.draw_type = 2;
      await takePostRequest('draw_prize');
      await $.wait(2000);
    }
  }
  await takeGetRequest('my_prize');
}

async function doVote() {
  for (let i = 0; i < $.needVoteList.length; i++) {
    $.oneVoteInfo = $.needVoteList[i];
    if ($.oneVoteInfo.is_vote === 1) {
      console.log(`${$.oneVoteInfo.name},已投票`);
      continue;
    }
    $.productList = $.oneVoteInfo.product_list;
    $.productList = $.productList.sort(compare('vote_total'));
    $.productInfo = $.productList[0];
    console.log(`${$.oneVoteInfo.name},去投票，投给${$.productInfo.product_name}`);
    await takePostRequest('product_vote');
    await $.wait(2000);
  }
}

function compare(property) {
  return function (a, b) {
    var value1 = a[property];
    var value2 = b[property];
    return value2 - value1;
  };
}
async function takeGetRequest(type) {
  let url = `https://xinrui1-isv.isvjcloud.com/gapi/${type}`;
  if (type === 'team_info') {
    url = `https://xinrui1-isv.isvjcloud.com/gapi/team_info?type=${$.type}`;
  } else if (type === 'my_prize') {
    url = `https://xinrui1-isv.isvjcloud.com/gapi/my_prize?type=5&page=1`;
  }
  let myRequest = getGetRequest(url);
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        dealReturn(type, data);
      } catch (e) {
        console.log(data);
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
async function takePostRequest(type) {
  let url = '';
  let body = '';
  switch (type) {
    case 'product_vote':
      body = JSON.stringify({ position_id: $.oneVoteInfo.id, product_id: $.productInfo.id });
      url = `https://xinrui1-isv.isvjcloud.com/gapi/product_vote`;
      break;
    case 'join_team':
      body = JSON.stringify({ inviter_id: $.authorCode });
      url = `https://xinrui1-isv.isvjcloud.com/gapi/join_team`;
      break;
    case 'draw_prize':
      body = JSON.stringify({ type: $.type, draw_type: $.draw_type });
      url = `https://xinrui1-isv.isvjcloud.com/gapi/draw_prize`;
      break;
    default:
      console.log(`错误${type}`);
  }
  let myRequest = getPostRequest(url, body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (data) {
          dealReturn(type, data);
        } else {
          //console.log(`为空`)
        }
      } catch (e) {
        console.log(data);
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
    console.log(`执行任务异常`);
    console.log(data);
    $.runFalag = false;
  }
  switch (type) {
    case 'get_home_info':
      if (data) {
        $.homeInfo = data;
      }
      break;
    case 'get_user_info':
      if (data) {
        $.useInfo = data;
      }
      break;
    case 'home_task_info':
      if (data) {
        $.taskInfo = data;
      }
      break;
    case 'product_vote':
      if (data) {
        console.log(`投票成功，获得豆子：${data.beans_num || 0}`);
      }
      break;
    case 'join_team':
      if (data) {
        console.log(JSON.stringify(data));
      }
      break;
    case 'team_info':
      if (data) {
        $.teamInfo = data;
      }
      break;
    case 'draw_prize':
      if (data) {
        console.log(JSON.stringify(data));
      }
      break;
    case 'my_prize':
      if (data) {
        let message = '';
        if (data && data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            let oneInfo = data[i];
            if (oneInfo.is_get !== 1) {
              console.log(`奖品：${oneInfo.name},未填写地址`);
              message += oneInfo.name + '\n';
            } else {
              console.log(`奖品：${oneInfo.name},已填写地址`);
            }
          }
          if (message !== '') {
            message = `京东账号${$.index} ${$.UserName},抽到实物，请到APP填写地址\n 活动路径: 手机馆--》IQOO大牌日--》左下角金机馆\n` + message;
            notify.sendNotify(`金机奖投票`, message);
          }
        }
      }
      break;
    default:
      console.log(JSON.stringify(data));
  }
}
function getGetRequest(url) {
  let headers = {
    Host: 'xinrui1-isv.isvjcloud.com',
    'Accept-Encoding': 'gzip, deflate, br',
    Cookie: $.cookie + `wait-update=${$.authorization};`,
    Connection: 'keep-alive',
    'User-Agent': $.UA,
    Authorization: 'bearer ' + ($.authorization === '' ? 'undefined' : $.authorization),
    Referer: 'https://xinrui1-isv.isvjcloud.com/gold-phone/loading/',
    'Accept-Language': 'zh-cn',
  };
  return { url: url, headers: headers };
}
function getPostRequest(url, body) {
  let headers = {
    Host: 'xinrui1-isv.isvjcloud.com',
    Accept: 'application/x.jd-school-raffle.v1+json',
    Authorization: 'Bearer ' + ($.authorization === '' ? 'undefined' : $.authorization),
    Source: '02',
    'Accept-Language': 'zh-cn',
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json;charset=utf-8',
    Origin: 'https://xinrui1-isv.isvjcloud.com',
    'User-Agent': $.UA,
    Connection: 'keep-alive',
    Referer:
      'https://xinrui1-isv.isvjcloud.com/gold-phone/?channel=fc&tttparams=MMzMjfMTeyJnTG5nIjoiMTIxLjM5MzIwMyIsImdMYXQiOiIzMS4yMjI3NzEifQ8%3D%3D&lng=121.393203&lat=31.222771&sid=38228f043bc4906c37889c187fd10b5w&un_area=2_2841_61104_0',
    'Content-Length': 32,
    Cookie: `jd-golden-phone=${$.authorization};`,
  };
  return { url: url, headers: headers, body: body };
}
async function getUA() {
  $.UA = `jdapp;iPhone;10.0.10;14.3;${randomString(
    40
  )};network/wifi;model/iPhone12,1;addressid/3364463029;appBuild/167764;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;
}
function randomString(e) {
  e = e || 32;
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}
async function getToken() {
  let config = {
    url: `https://api.m.jd.com/client.action?functionId=isvObfuscator`,
    body: 'area=16_1315_3486_59648&body=%7B%22url%22%3A%22https%3A%5C/%5C/xinrui1-isv.isvjcloud.com%22%2C%22id%22%3A%22%22%7D&build=167764&client=apple&clientVersion=10.0.10&d_brand=apple&d_model=iPhone12%2C1&eid=eidIde27812210seewuOJWEnRZ6u7X5cB/JIQnsLj51RJEe7PtlRG/yNSbeUMf%2BbNdgjQzFxhZsU4m5/PLZOhi87ebHQ0wPc9qd82Bh%2BVoPAhwbhRqFY&isBackground=N&joycious=54&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=ebf4ce8ecbb641054b00c00483b1cee85660d196&osVersion=14.3&partner=apple&rfs=0000&scope=11&screen=828%2A1792&sign=3090b2b2997d877191d0aef083b8d985&st=1628230407213&sv=102&uemps=0-0&uts=0f31TVRjBSsqndu4/jgUPz6uymy50MQJtgH/sOkA5ELPGCiuUXbsrWcAq%2B0c83LNknkzBXgDXlQ3pq2eMY2enviS/%2BJ6TGkfqBEbO/bQ5%2BKGVjit9RrmNU/D2OwTZ2Bqi/idA2EqDmsJuNS3bvh8kCV4sO4DAHDETkc3g6r8ZeDy72mlQ1hCUss2YaXalY%2BbnkC07OlzyjC8/fuhehBm0g%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=796606e8e181aa5865ec20728a27238b',
    headers: {
      Host: 'api.m.jd.com',
      accept: '*/*',
      'user-agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
      'accept-language': 'zh-Hans-CN;q=1, en-CN;q=0.9',
      'accept-encoding': ' gzip, deflate, br',
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
async function getJdUserInfo() {
  let url = `https://xinrui1-isv.isvjcloud.com/gapi/jd-user-info`;
  let body = `{"token":"${$.token}","source":"01"}`;
  let headers = {
    Host: 'xinrui1-isv.isvjcloud.com',
    Accept: 'application/json, text/plain, */*',
    Authorization: 'bearer ' + ($.authorization === '' ? 'undefined' : $.authorization),
    'Accept-Language': 'zh-cn',
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json;charset=utf-8',
    Origin: 'https://xinrui1-isv.isvjcloud.com',
    'User-Agent': $.UA,
    Connection: 'keep-alive',
    Referer: 'https://xinrui1-isv.isvjcloud.com/gold-phone/logined_jd/',
    'Content-Length': '101',
    Cookie: $.cookie,
  };
  let myRequest = { url: url, headers: headers, body: body };
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (data) {
          data = JSON.parse(data);
          $.authorization = data.access_token;
        }
      } catch (e) {
        console.log(data);
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
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

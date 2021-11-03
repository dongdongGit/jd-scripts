/*
* 活动：APP-美妆馆-右侧浮窗
cron 27 9,10 * * * jd_selectionOfficer.js
* 说明：脚本内互助，无开卡，有加购
* */
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('美妆馆-选品官');

const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [];
let message = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
let authorization = {};
let invitelist = [
  {
    user: 'jd_5949b347c7184',
    inviter_id: '616fd3213279960057',
    needTime: 5,
  },
];
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  if (Date.now() > '1636819200000') {
    console.log(`活动已结束`);
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = '';
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
    await main();
  }
  if (message) {
    message += `活动路径：APP-美妆馆-右侧浮窗`;
    await notify.sendNotify(`选品官`, message);
  }
  if (invitelist.length === 0) {
    return;
  }
  cookiesArr = getRandomArrayElements(cookiesArr, cookiesArr.length);
  console.log(JSON.stringify(invitelist));
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
      await takePostRequest('invite_friend');
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

async function main() {
  $.token = ``;
  await getToken();
  if ($.token === ``) {
    console.log(`获取token失败`);
    return;
  }
  $.accessToken = 'undefined';
  await takePostRequest('jd-user-info');
  if (!$.accessToken || $.accessToken === 'undefined') {
    console.log(`获取accessToken失败`);
    return;
  }
  authorization[$.UserName] = $.accessToken;
  $.userInfo = {};
  $.productList = [];
  await takeGetRequest('get_user_info');
  if (JSON.stringify($.userInfo) === '{}' || !$.userInfo || !$.userInfo.code) {
    console.log(`初始化失败`);
    return;
  }
  $.drawTime = $.userInfo.coins;
  await takeGetRequest('get_newer_product');
  if ($.productList.length === 0) {
    console.log(`获取新品列表失败`);
    return;
  }
  console.log(`助力码：${$.userInfo.code}`);
  if ($.userInfo.name === '') {
    await takePostRequest('edit_info');
  }
  await $.wait(2000);
  if ($.userInfo.select_product.length === 0) {
    let allProductList = [];
    for (let i = 0; i < $.productList.length; i++) {
      let oneList = $.productList[i].get_sub;
      for (let j = 0; j < oneList.length; j++) {
        let proList = oneList[j].get_product;
        for (let k = 0; k < proList.length; k++) {
          allProductList.push(proList[k].id);
        }
      }
    }
    $.allProductList = getRandomArrayElements(allProductList, 10);
    console.log(`随机选择10件商品`);
    await takePostRequest('get_hurt');
  }
  $.taskList = [];
  await takeGetRequest('task_list');
  await $.wait(1000);
  await doTask();
  await $.wait(1000);
  console.log(`可以抽奖：${$.drawTime}次`);
  for (let i = 0; i < $.drawTime; i++) {
    console.log(`进行第${i + 1}次抽奖`);
    await takePostRequest('draw_prize');
    console.log('\n');
    await $.wait(1000);
  }
  await takeGetRequest('get_my_prize?type=2&page=1&page_num=10');
}

async function doTask() {
  for (let i = 0; i < $.taskList.length; i++) {
    $.oneTask = $.taskList[i];
    if ($.oneTask.type === 2) {
      if ($.oneTask.friends.length !== 5) {
        invitelist.push({ user: $.UserName, inviter_id: $.userInfo.code, needTime: 5 - $.oneTask.friends.length });
      }
    }
    if ($.oneTask.type === 1) {
      let subList = $.oneTask.info;
      for (let j = 0; j < subList.length; j++) {
        console.log(`任务：${subList[j].title},去执行`);
        await takePostRequest('sign');
        await $.wait(1000);
      }
    }
    if ($.oneTask.type === 3) {
      let subList = $.oneTask.info;
      for (let j = 0; j < subList.length; j++) {
        $.subListInfo = subList[j];
        console.log(`任务：${subList[j].title},去执行`);
        await takePostRequest('view_meeting');
        await $.wait(1000);
      }
    }
    if ($.oneTask.type === 7) {
      let subList = $.oneTask.info;
      for (let j = 0; j < subList.length; j++) {
        $.subListInfo = subList[j];
        console.log(`任务：${subList[j].title},去执行`);
        await takePostRequest('shop_follow');
        await $.wait(1000);
      }
    }
    if ($.oneTask.type === 8) {
      let subList = $.oneTask.info;
      for (let j = 0; j < subList.length; j++) {
        $.subListInfo = subList[j];
        console.log(`任务：${subList[j].title},去执行`);
        await takePostRequest('add_product');
        await $.wait(1000);
      }
    }
    if ($.oneTask.type === 5) {
      let subList = $.oneTask.info;
      for (let j = 0; j < subList.length; j++) {
        $.subListInfo = subList[j];
        console.log(`任务：${subList[j].title},去执行`);
        await takePostRequest('view_shop');
        await $.wait(1000);
      }
    }
    if ($.oneTask.type === 6) {
      let subList = $.oneTask.info;
      for (let j = 0; j < subList.length; j++) {
        $.subListInfo = subList[j];
        console.log(`任务：${subList[j].title},去执行`);
        await takePostRequest('view_product');
        await $.wait(1000);
      }
    }
  }
}

async function takePostRequest(type) {
  let body = ``;
  switch (type) {
    case 'jd-user-info':
      body = `{"token":"${$.token}","source":"01"}`;
      break;
    case 'edit_info':
      let name = getRandomChineseWord() + getRandomChineseWord();
      let timestamp = Number(Date.now()) - Number(randomNum(86400000, 86400000 * 30));
      let d = new Date(timestamp);
      let date = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      console.log(`取名：${name}，设置生日：${date}`);
      body = `{"name":"${name}","date":"${date}"}`;
      break;
    case 'get_hurt':
      body = `{"ids":[${$.allProductList}]}`;
      console.log(body);
      break;
    case 'sign':
    case 'draw_prize':
      body = ``;
      break;
    case 'view_meeting':
    case 'shop_follow':
    case 'add_product':
    case 'view_shop':
    case 'view_product':
      body = `{"id":${$.subListInfo.id}}`;
      break;
    case 'invite_friend':
      body = `{"inviter_id":"${$.oneInvite.inviter_id}"}`;
      break;
    default:
      console.log(`错误${type}`);
  }
  let myRequest = {
    url: `https://xinruimz1-isv.isvjcloud.com/api/${type}`,
    headers: {
      Host: `xinruimz1-isv.isvjcloud.com`,
      Origin: `https://xinruimz1-isv.isvjcloud.com`,
      Accept: `application/json, text/plain, */*`,
      Authorization: `Bearer ${$.accessToken}`,
      'Accept-Language': `zh-cn`,
      'Accept-Encoding': `gzip, deflate, br`,
      'Content-Type': 'application/json',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: `https://xinruimz1-isv.isvjcloud.com/logined_jd/`,
      Connection: `keep-alive`,
      Cookie: `${$.cookie}`,
    },
    body: body,
  };
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (type === 'edit_info') {
          return;
        }
        if (type === 'invite_friend') {
          if (!data) {
            console.log(`助力成功`);
            $.oneInvite.needTime--;
          } else {
            data = JSON.parse(data);
            console.log(data.message);
            console.log(JSON.stringify(data));
          }
          return;
        }
        dealReturn(type, data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function getRandomChineseWord() {
  var _rsl = '';
  var _randomUniCode = Math.floor(Math.random() * (40870 - 19968) + 19968).toString(16);
  eval('_rsl=' + '"\\u' + _randomUniCode + '"');
  return _rsl;
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

async function takeGetRequest(type) {
  let myRequest = {
    url: `https://xinruimz1-isv.isvjcloud.com/api/${type}`,
    headers: {
      Host: `xinruimz1-isv.isvjcloud.com`,
      'Accept-Encoding': `gzip, deflate, br`,
      Cookie: `jd-beauty-1111=${$.accessToken};IsvToken=${$.token};${$.cookie}`,
      Connection: `keep-alive`,
      Accept: `application/json, text/plain, */*`,
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Authorization: `Bearer ${$.accessToken ?? 'undefined'}`,
      Referer: `https://xinruimz1-isv.isvjcloud.com/loading/`,
      'Accept-Language': 'zh-cn',
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
    case 'task_list':
      $.taskList = data;
      break;
    case 'get_newer_product':
      $.productList = data;
      break;
    case 'get_hurt':
      console.log(`战斗值：${data.hurt}`);
      break;
    case 'sign':
      console.log(`执行成功，获得京豆：${data.beans || 0}`);
      break;
    case 'view_meeting':
    case 'shop_follow':
    case 'add_product':
    case 'view_shop':
    case 'view_product':
      console.log(`执行成功，获得抽奖次数：${data.add_coins || 0}，共有抽奖次数：${data.coins || 0}`);
      $.drawTime = data.coins || 0;
      break;
    case 'draw_prize':
      if (data && data.draw_result && data.draw_result.prize && data.draw_result.prize.name) {
        console.log(`获得：${data.draw_result.prize.name || '空气'}`);
      } else {
        console.log(`获得：空气`);
      }
      console.log(JSON.stringify(data));
      break;
    case 'get_my_prize?type=2&page=1&page_num=10':
      for (let i = 0; i < data.length; i++) {
        if (data[i]) {
          if (data[i].name.indexOf('1元') !== -1) {
            message += `第【${$.index}】个账号，${$.UserName},抽到：${data[i].name}\n`;
            console.log(`第【${$.index}】个账号，${$.UserName},抽到：${data[i].name}`);
          }
        }
      }
      break;
    default:
      console.log('异常');
      console.log(JSON.stringify(data));
  }
}
async function getToken() {
  let config = {
    url: 'https://api.m.jd.com/client.action?functionId=isvObfuscator',
    body: 'body=%7B%22url%22%3A%22https%3A%5C/%5C/xinruimz1-isv.isvjcloud.com%22%2C%22id%22%3A%22%22%7D&build=167853&client=apple&clientVersion=10.2.0&d_brand=apple&d_model=iPhone9%2C2&ef=1&eid=eidI42470115RDhDRjM1NjktODdGQi00RQ%3D%3DB3mSBu%2BcGp7WhKUUyye8/kqi1lxzA3Dv6a89ttwC7YFdT6JFByyAtAfO0TOmN9G2os20ud7RosfkMq80&ep=%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22screen%22%3A%22CJS0CseyCtK4%22%2C%22wifiBssid%22%3A%22ZJHrCtC0CzLuDNUyDNHsEWS5Ztc2EJCmYtUmZQTsDtU%3D%22%2C%22osVersion%22%3A%22CJGkDq%3D%3D%22%2C%22area%22%3A%22Cv8yENCmXzUnENS4XzK%3D%22%2C%22openudid%22%3A%22DWO4YJU3DNDrDWGyYJGnCJLrEQVuCzu2YwSmDNc0DzPvYJOyCQC2YG%3D%3D%22%2C%22uuid%22%3A%22aQf1ZRdxb2r4ovZ1EJZhcxYlVNZSZz09%22%7D%2C%22ts%22%3A1634728816%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D&ext=%7B%22prstate%22%3A%220%22%7D&isBackground=N&joycious=89&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&partner=apple&rfs=0000&scope=01&sign=1bbf1163c91be540a089cd064a06a04a&st=1634729039082&sv=112',
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
function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10);
      break;
    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
      break;
    default:
      return 0;
      break;
  }
}

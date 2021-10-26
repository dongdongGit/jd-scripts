/*
* 活动：潮玩儿制躁团
* 入口：不知道
* 说明：貌似没有加购，没有开卡，蚊子腿豆子，抽到啥看下日志（PS有概率能抽到融创门票）
cron 30 11,22 * * * jd_zzt.js
* */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('潮玩儿制躁团');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let cookiesArr = [],
  cookie = '',
  codeList = [],
  authorizationInfo = {},
  tokenInfo = {};
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
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
      'open-url': 'https://bean.m.jd.com/',
    });
    return;
  }
  if (Date.now() > 1636905600000) {
    console.log(`活动结束`);
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    $.skuIds = [];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.index = i + 1;
    $.nickName = '';
    $.Authorization = 'Bearer undefined';
    $.raveldoubleeleven = '';
    $.cando = true;
    console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
    await main();
    await $.clearShoppingCart();
    await $.wait(1500);
  }
  cookiesArr = getRandomArrayElements(cookiesArr, cookiesArr.length);
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    if (!authorizationInfo[$.UserName]) {
      continue;
    }
    $.token = tokenInfo[$.UserName];
    $.Authorization = `Bearer ${authorizationInfo[$.UserName]}`;
    $.raveldoubleeleven = `ravel-double-eleven=${authorizationInfo[$.UserName]}`;
    $.canHelp = true;
    for (let j = 0; j < codeList.length && $.canHelp; j++) {
      $.oneInfo = codeList[j];
      if ($.oneInfo.user === $.UserName || $.oneInfo.needTime === 0) {
        continue;
      }
      console.log(`${$.UserName},去助力,${$.oneInfo.user}`);
      let helpInfo = await taskPostUrl('invite', `inviter_id=${$.oneInfo.code}`);
      if (!helpInfo) {
        console.log(`助力成功`);
        $.oneInfo.needTime--;
      } else {
        helpInfo = JSON.parse(helpInfo);
        if (helpInfo.status_code === 422) {
          $.canHelp = false;
        }
        console.log(helpInfo.message);
      }
      await $.wait(2000);
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

function getRandomArrayElements(arr, count) {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - count,
    temp,
    index;
  while (i-- > min) {
    getRandomArrayElements;
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}
async function main() {
  $.token = ``;
  await genToken();
  let authres = await taskPostUrl('jd-user-info', `token=${$.token}&source=01`);
  $.Authorization = `Bearer ${authres.access_token}`;
  $.raveldoubleeleven = `ravel-double-eleven=${authres.access_token}`;
  let user = await taskUrl('get_user_info', '');
  if (!$.cando) {
    console.log('黑号跑不起来拉');
    return;
  }
  authorizationInfo[$.UserName] = authres.access_token;
  tokenInfo[$.UserName] = $.token;
  console.log(`昵称：${user.nickname},剩余金币值：${user.coins}，助力码：${user.id}\n`);
  if (user.is_all_map === 1) {
    console.log(`已到达终点`);
    return;
  }
  let taskList = await taskUrl('shop_products', '');
  let state = await taskUrl('state', '');
  if (state.friend.length !== 5) {
    codeList.push({ user: $.UserName, code: user.id, needTime: 5 - state.friend.length });
  }
  for (let key of Object.keys(taskList.products)) {
    let vv = taskList.products[key];
    let isFinishList = state.view_product;
    if (isFinishList.indexOf(vv.id.toString()) === -1) {
      console.log(`去浏览${vv.name} `);
      $.skuIds.push(vv.jd_product_id);
      await taskPostUrl('product_view', `product_id=${vv.id}`);
      await $.wait(1000);
    }
  }
  for (let key of Object.keys(taskList.shops_follow)) {
    let vv = taskList.shops_follow[key];
    let isFinishList = state.view_shop;
    if (isFinishList.indexOf(Number(vv.id)) === -1) {
      console.log(`去浏览${vv.name} `);
      await taskPostUrl('shop_view', `shop_id=${vv.id}`);
      await $.wait(1000);
    }
  }
  for (let key of Object.keys(taskList.meetingplace)) {
    let vv = taskList.meetingplace[key];
    let isFinishList = state.view_meetingplace;
    if (isFinishList.indexOf(Number(vv.id)) === -1) {
      console.log(`去浏览${vv.name} `);
      await taskPostUrl('meetingplace_view', `meetingplace_id=${vv.id}`);
      await $.wait(1000);
    }
  }
  user = await taskUrl('get_user_info', '');
  let time = Math.floor(user.coins / 30);
  console.log(`当前积分：${user.coins},可以摇骰子：${time}次`);
  for (let i = 0; i < time; i++) {
    console.log(`\n进行第${i + 1}次摇骰子`);
    let dice = await taskUrl('dice', '');
    if (dice.prize_info && JSON.stringify(dice.prize_info) !== '[]') {
      if (dice.prize_info.type === 1) {
        console.log(`获得：${dice.prize_info.beans || 0}京豆`);
      }
      if (dice.prize_info.type === 2) {
        console.log(`获得：${dice.prize_info.prize.name || '未知'}`);
      }
      if (dice.prize_info.type === 3) {
        let linInfo = await taskPostUrl('link', `id=${dice.prize_info.id}&token=${dice.prize_info.token}&link=${dice.prize_info.link}`);
        console.log(`点击跳转`);
        console.log(`获得：${linInfo.beans || 0}京豆`);
      }
    } else if (JSON.stringify(dice.prize_info) === '[]' || dice.prize_info === false) {
      if (dice.one_map_beans) {
        console.log(`获得：${dice.one_map_beans || 0}京豆`);
      } else {
        console.log('恭喜您获得了空气');
      }
    }
    console.log(JSON.stringify(dice));
    await $.wait(3000);
    if (dice.step === 18 && dice.next_map_id === 0) {
      console.log(`已到达终点`);
      break;
    }
  }
}
//genToken
function genToken() {
  let config = {
    url: 'https://api.m.jd.com/client.action?functionId=isvObfuscator&clientVersion=10.1.7&build=90635&client=android&partner=jingdong&oaid=00000000-0000-0000-0000-000000000000&eid=eidAefc08122bbs1j2p01xdLSDyetcFPGUikB49qdlOjcv3tgyCw+KS//1lXSCgY7id0GmhxyF0ZguSdaEcar8WGYWMb7ovi1UU9YrL2o9/NRyWkmtYw&sdkVersion=29&lang=zh_CN&harmonyOs=1&networkType=wifi&uts=0f31TVRjBSuLmtuI6furVypvViHfYKJnhz%2FRngM9Hy8Qkw1ZqunqDqXXZRA7p28AcB3rq6Hw4Htbu9ThqeJymKe8B%2BdXA0X67hc47XET3S2L9mI7cGhDJRQbhKN9Crq0Gxo%2BW2TGyV9zutBypKeicuL%2FYEFImVo%2BHT0abEx0lfqueDmeRtNCVUTk8d6cEvj4MOQbC3FCym1a6ogXoUuw0g%3D%3D&uemps=0-0&ext=%7B%22prstate%22%3A%220%22%7D&ef=1&ep=%7B%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22ts%22%3A1634695682827%2C%22ridx%22%3A-1%2C%22cipher%22%3A%7B%22area%22%3A%22CtTpCtKmDV8yCNK5XzC2Czq1%22%2C%22d_model%22%3A%22V0naBUPECNK%3D%22%2C%22wifiBssid%22%3A%22dW5hbw93bq%3D%3D%22%2C%22osVersion%22%3A%22CJK%3D%22%2C%22d_brand%22%3A%22IPVLV0VT%22%2C%22screen%22%3A%22CtS3DyenCNqm%22%2C%22uuid%22%3A%22DJUmZWDrDwS0DtdtYJHwCm%3D%3D%22%2C%22aid%22%3A%22DJUmZWDrDwS0DtdtYJHwCm%3D%3D%22%2C%22openudid%22%3A%22DJUmZWDrDwS0DtdtYJHwCm%3D%3D%22%7D%2C%22ciphertype%22%3A5%2C%22version%22%3A%221.2.0%22%2C%22appname%22%3A%22com.jingdong.app.mall%22%7D&st=1634701437771&sign=05dcc1b6998e53fa01b4cd1450b38bfc&sv=110',
    body: 'body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fxinrui2-isv.isvjcloud.com%22%7D&',
    headers: {
      Host: 'api.m.jd.com',
      accept: '*/*',
      'user-agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
      'accept-language': 'zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6',
      'content-type': 'application/x-www-form-urlencoded',
      Cookie: cookie,
    },
  };
  return new Promise((resolve) => {
    $.post(config, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`isvObfuscator API请求失败，请检查网路重试`);
          console.log(`${JSON.stringify(err)}`);
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

function taskUrl(url, data) {
  let body = {
    url: `https://xinrui2-isv.isvjcloud.com/api/${url}${data}`,
    headers: {
      Host: 'xinrui2-isv.isvjcloud.com',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://xinrui2-isv.isvjcloud.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: $.Authorization,
      cookie: `IsvToken=${$.token}; ${$.raveldoubleeleven}`,
      Referer: 'https://xinrui2-isv.isvjcloud.com/',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };
  return new Promise((resolve) => {
    $.get(body, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} ${url} API请求失败，请检查网路重试`);
          $.cando = false;
        } else {
          data = JSON.parse(data);
          resolve(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function taskPostUrl(url, data) {
  let body = {
    url: `https://xinrui2-isv.isvjcloud.com/api/${url}`,
    body: data,
    headers: {
      Host: 'xinrui2-isv.isvjcloud.com',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://xinrui2-isv.isvjcloud.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: $.Authorization,
      cookie: cookie + `IsvToken=${$.token}; ${$.raveldoubleeleven}`,
      Referer: 'https://xinrui2-isv.isvjcloud.com/',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };
  return new Promise((resolve) => {
    $.post(body, async (err, resp, data) => {
      try {
        if (url === 'invite') {
        } else {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} ${url} API请求失败，请检查网路重试`);
          } else {
            data = JSON.parse(data);
            if ((data.coins && url == 'product_view') || url == 'shop_view' || url == 'meetingplace_view') console.log(`操作成功,获得${data.coins}金币，当前金币${data.user_coins}`);
            resolve(data);
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
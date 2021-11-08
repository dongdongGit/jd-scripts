/*
第一个号助力作者，其他号助力第一个CK
cron 10 9,17 * * * jd_vivo.js
PS:无开卡，有加购，蚊子推豆子，活动结束可以瓜分
* */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('热血心跳,狂解压');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [];
Object.keys(jdCookieNode).forEach((item) => {
  cookiesArr.push(jdCookieNode[item]);
});
let activityID = '',
  cookie = '',
  userName = '';
let token = '',
  LZ_TOKEN_KEY = '',
  LZ_TOKEN_VALUE = '',
  Referer = '',
  nickname = '';
let Host = '',
  venderId = ``,
  shopId = ``,
  pin = ``,
  lz_jdpin_token = ``;
let hotFlag = false;
let attrTouXiang = '';
$.shareUuid = '';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  let res = [
    '6fc07c94e4db4bff907a46fd39084aff'
  ];
  try {
    res = await getAuthorShareCode('');
  } catch (e) {}
  if (!res) {
    try {
      res = await getAuthorShareCode('');
    } catch (e) {}
    if (!res) {
      res = [];
    }
  }
  if (res.length > 0) {
    $.shareUuid = getRandomArrayElements(res, 1)[0];
  }
  let activityList = [{ id: 'dz2110100000406501', endTime: '1638287999000' }];
  for (let i = 0; i < cookiesArr.length; i++) {
    let index = i + 1;
    $.cookie = cookie = cookiesArr[i];
    userName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    console.log(`\n*****开始【京东账号${index}】${userName}*****\n`);
    hotFlag = false;
    $.skuIds = [];
    for (let j = 0; j < activityList.length && !hotFlag; j++) {
      let nowTime = Date.now();
      if (nowTime < activityList[j].endTime) {
        activityID = activityList[j].id;
        console.log(`\n活动ID：` + activityID);
        try {
          await main();
          await $.clearShoppingCart();
        } catch (e) {
          console.log(`异常：` + JSON.stringify(e));
        }
        console.log(`防止黑IP，等待30秒`);
        await $.wait(30000);
      } else {
        console.log(`\n活动ID：${activityID},已过期`);
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

async function main() {
  Host = `lzdz1-isv.isvjcloud.com`;
  Referer = `https://lzdz1-isv.isvjd.com/dingzhi/vivo/iqoojieyapa/activity/dz2110100000406501?activityId=${activityID}&shareUuid=${$.shareUuid}`;
  console.log(`活动地址：${Referer}`);
  (token = ''), (LZ_TOKEN_KEY = ''), (LZ_TOKEN_VALUE = ''), (lz_jdpin_token = ``), (venderId = ``), (shopId = ``), (pin = ``), (nickname = '');
  token = await getToken();
  if (!token) {
    console.log(`获取token失败`);
    return;
  }
  await getWxCommonInfoToken('https://lzdz1-isv.isvjcloud.com/wxCommonInfo/token');
  if (!LZ_TOKEN_KEY || !LZ_TOKEN_VALUE) {
    console.log(`初始化失败`);
    return;
  }
  await takePostRequest('getSimpleActInfoVo');
  if (venderId === ``) {
    console.log(`获取venderId失败`);
    return;
  }
  console.log(`venderId :${venderId}`);
  await getMyPing('https://lzdz1-isv.isvjd.com/customer/getMyPing');
  if (pin === ``) {
    hotFlag = true;
    console.log(`获取pin失败,该账号可能是黑号`);
    return;
  }
  await accessLogWithAD('https://lzdz1-isv.isvjd.com/common/accessLogWithAD');
  attrTouXiang = 'https://img10.360buyimg.com/imgzone/jfs/t1/7020/27/13511/6142/5c5138d8E4df2e764/5a1216a3a5043c5d.png';
  await getUserInfo('https://lzdz1-isv.isvjd.com/wxActionCommon/getUserInfo');
  await getHtml();
  $.activityData = {};
  await takePostRequest('activityContent');
  console.log(`获取活动详情成功`);
  console.log(`助力码：${$.activityData.actorUuid}`);
  await doTask();
  await $.wait(3000);
  await takePostRequest('activityContent');
  //await $.wait(2000);
  //await takePostRequest('guafen');
  let score = $.activityData.score;
  console.log(`可投票次数：` + score);
  let scoreFlag = false;
  $.canScore = true;
  let aa = 0;
  for (let i = 0; i < score && $.canScore && aa < 20; i++) {
    scoreFlag = true;
    console.log(`进行第${i + 1}次投票`);
    await takePostRequest('insxintiao');
    await $.wait(1500);
    aa++;
  }
  if (scoreFlag) {
    await $.wait(1000);
    await takePostRequest('activityContent');
    await $.wait(1000);
  }
  let score2 = $.activityData.score2;
  console.log(`可扭蛋次数：` + score2);
  if (score2 > 0) {
    await takePostRequest('drawContent');
    await $.wait(1000);
  }
  for (let i = 0; i < score2 && i < 10; i++) {
    console.log(`进行第${i + 1}次扭蛋`);
    await takePostRequest('draw');
    await $.wait(1500);
  }
  if ($.index === '1') {
    $.shareUuid = $.activityData.actorUuid;
  }
}
async function doTask() {
  $.taskValue = '';
  if (!$.activityData.signStatus) {
    console.log(`去签到`);
    $.taskType = 0;
    await takePostRequest('saveTask');
    await $.wait(1000);
  } else {
    console.log(`已签到`);
  }
  if (!$.activityData.followShopStatus) {
    console.log(`去关注店铺`);
    $.taskType = 23;
    await takePostRequest('saveTask');
    await $.wait(1000);
  } else {
    console.log(`已关注`);
  }
  if (!$.activityData.addCartStatus) {
    console.log(`去执行加购`);
    $.taskType = 21;
    $.activityData.addCartData.map(function (item) {
      $.skuIds.push(item.value);
    });
    await takePostRequest('saveTask');
    await $.wait(1000);
  } else {
    console.log(`已执行加购`);
  }
  let toMainData = $.activityData.toMainData;
  for (let i = 0; i < toMainData.length; i++) {
    $.taskType = 12;
    if (!toMainData[i].toMainStatus) {
      console.log(`去执行浏览会场`);
      $.taskValue = toMainData[i].value;
      await takePostRequest('saveTask');
      await $.wait(1000);
    }
  }
  let toShopStatus = $.activityData.toShopStatus;
  for (let i = 0; i < toShopStatus.length; i++) {
    $.taskType = 14;
    if (!toShopStatus[i].toShopStatus) {
      console.log(`去执行浏览店铺`);
      $.taskValue = toShopStatus[i].value;
      await takePostRequest('saveTask');
      await $.wait(1000);
    }
  }
  let viewViewData = $.activityData.viewViewData;
  for (let i = 0; i < viewViewData.length; i++) {
    $.taskType = 31;
    if (!viewViewData[i].viewViewStatus) {
      console.log(`去执行浏览视频`);
      $.taskValue = viewViewData[i].value;
      await takePostRequest('saveTask');
      await $.wait(1000);
    }
  }
  // if(!$.activityData.zhiboStatus){
  //     console.log(`去观看直播`);
  //     $.taskType=10;
  //     $.taskValue=10;
  //     await takePostRequest('saveTask');
  //     await $.wait(1000);
  // }else{
  //     console.log(`已观看直播`);
  // }
}
function takePostRequest(type) {
  let url = '';
  let body = ``;
  switch (type) {
    case 'getSimpleActInfoVo':
      url = 'https://lzdz1-isv.isvjd.com/dz/common/getSimpleActInfoVo';
      body = `activityId=${activityID}`;
      break;
    case 'activityContent':
      url = 'https://lzdz1-isv.isvjd.com/dingzhi/vivo/iqoojieyapa/activityContent';
      body = `activityId=${activityID}&pin=${encodeURIComponent(pin)}&pinImg=${encodeURIComponent(attrTouXiang)}&nick=${encodeURIComponent(nickname)}&cjyxPin=&cjhyPin=&shareUuid=${$.shareUuid}`;
      break;
    case 'saveTask':
      url = 'https://lzdz1-isv.isvjd.com/dingzhi/vivo/iqoojieyapa/saveTask';
      body = `pin=${encodeURIComponent(pin)}&activityId=${activityID}&taskType=${$.taskType}&actorUuid=${$.activityData.actorUuid}&shareUuid=${$.shareUuid}&taskValue=${$.taskValue}`;
      break;
    case 'insxintiao':
      url = 'https://lzdz1-isv.isvjd.com/dingzhi/vivo/iqoojieyapa/insxintiao';
      body = `pin=${encodeURIComponent(pin)}&activityId=${activityID}&playerId=37`;
      break;
    case 'draw':
      url = 'https://lzdz1-isv.isvjd.com/dingzhi/vivo/iqoojieyapa/draw';
      body = `activityId=${activityID}&uuid=${$.activityData.actorUuid}&pin=${encodeURIComponent(pin)}`;
      break;
    case 'drawContent':
      url = 'https://lzdz1-isv.isvjd.com/dingzhi/taskact/common/drawContent';
      body = `activityId=${activityID}&pin=${encodeURIComponent(pin)}`;
      break;
    case 'guafen':
      url = 'https://lzdz1-isv.isvjcloud.com/dingzhi/vivo/iqoojieyapa/guafen';
      body = `activityId=${activityID}&pin=${encodeURIComponent(pin)}&playerId=15`;
      break;
    default:
      console.log(`错误${type}`);
  }
  let myRequest = getPostRequest(url, body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
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
function dealReturn(type, data) {
  if (type === 'drawContent') {
    return;
  }
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log(`执行任务异常`);
    console.log(data);
  }
  switch (type) {
    case 'getSimpleActInfoVo':
      if (data.result) {
        shopId = data.data.shopId;
        venderId = data.data.venderId;
      }
      break;
    case 'activityContent':
      if (data.data && data.result && data.count === 0) {
        $.activityData = data.data;
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    case 'saveTask':
      if (data.result === true && data.count === 0) {
        console.log(`执行成功,获得京豆：${data.data.beans || 0}`);
      } else {
        console.log(JSON.stringify(data));
      }
      //console.log(JSON.stringify(data))
      break;
    case 'insxintiao':
      if (data.result === true && data.count === 0) {
        console.log(`投票成功`);
      } else {
        $.canScore = false;
        console.log(JSON.stringify(data));
      }
      break;
    case 'draw':
      if (data.result === true && data.count === 0) {
        let wdsrvo = data.data.wdsrvo;
        if (wdsrvo.drawInfoType === 6) {
          console.log(`获得京豆：${wdsrvo.name}`);
        } else if (wdsrvo.drawInfoType === 0) {
          console.log(`啥都没有抽到`);
        } else {
          console.log(`获得其他`);
        }
      } else {
        //console.log(JSON.stringify(data))
      }
      console.log(JSON.stringify(data));
      break;
    case 'insertCrmPageVisit':
      console.log(JSON.stringify(data));
      break;
    case 'guafen':
      if (data.result === true && data.count === 0) {
        console.log(`瓜分获得：${data.data.beans || '0'}`);
      }
      console.log(JSON.stringify(data));
      break;
    default:
      console.log(JSON.stringify(data));
  }
}
function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
function getHtml() {
  let config = {
    url: Referer,
    headers: {
      Host: Host,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Cookie: `IsvToken=${token};${cookie} LZ_TOKEN_KEY=${LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${LZ_TOKEN_VALUE}; AUTH_C_USER=${pin}; ${lz_jdpin_token}`,
      'User-Agent':
        'jdapp;iPhone;10.1.4;14.6;5a8a5743a5d2a4110a8ed396bb047471ea120c6a;network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214111493;appBuild/167814;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
    },
  };
  return new Promise((resolve) => {
    $.get(config, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function getUserInfo(url) {
  const body = `pin=${encodeURIComponent(pin)}`;
  let myRequest = getPostRequest(url, body);
  return new Promise((resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.count === 0 && data.result) {
              if (data.data.yunMidImageUrl) {
                attrTouXiang = data.data.yunMidImageUrl;
              }
            }
          }
        }
      } catch (e) {
        console.log(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function accessLogWithAD(url) {
  let body = `venderId=${venderId}&code=99&pin=${encodeURIComponent(pin)}&activityId=${activityID}&pageUrl=${encodeURIComponent(Referer)}&subType=app&adSource=null`;
  let myRequest = getPostRequest(url, body);
  return new Promise((resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          let setcookie = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || '';
          if (setcookie) {
            let LZTOKENKEY = setcookie.filter((row) => row.indexOf('LZ_TOKEN_KEY') !== -1)[0];
            if (LZTOKENKEY && LZTOKENKEY.indexOf('LZ_TOKEN_KEY=') > -1) {
              LZ_TOKEN_KEY = (LZTOKENKEY.split(';') && LZTOKENKEY.split(';')[0]) || '';
              LZ_TOKEN_KEY = LZ_TOKEN_KEY.replace('LZ_TOKEN_KEY=', '');
            }
            let LZTOKENVALUE = setcookie.filter((row) => row.indexOf('LZ_TOKEN_VALUE') !== -1)[0];
            if (LZTOKENVALUE && LZTOKENVALUE.indexOf('LZ_TOKEN_VALUE=') > -1) {
              LZ_TOKEN_VALUE = (LZTOKENVALUE.split(';') && LZTOKENVALUE.split(';')[0]) || '';
              LZ_TOKEN_VALUE = LZ_TOKEN_VALUE.replace('LZ_TOKEN_VALUE=', '');
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
function getPostRequest(url, body) {
  const headers = {
    'X-Requested-With': `XMLHttpRequest`,
    Connection: `keep-alive`,
    'Accept-Encoding': `gzip, deflate, br`,
    'Content-Type': `application/x-www-form-urlencoded`,
    Origin: `https://${Host}`,
    'User-Agent': `jdapp;iPhone;10.1.4;14.6;5a8a5743a5d2a4110a8ed396bb047471ea120c6a;network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214111493;appBuild/167814;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
    Cookie: `${cookie} LZ_TOKEN_KEY=${LZ_TOKEN_KEY}; LZ_TOKEN_VALUE=${LZ_TOKEN_VALUE}; AUTH_C_USER=${pin}; ${lz_jdpin_token}`,
    Host: Host,
    Referer: Referer,
    'Accept-Language': `zh-cn`,
    Accept: `application/json`,
  };
  return { url: url, method: `POST`, headers: headers, body: body };
}
function getMyPing(url) {
  let body = `userId=${venderId}&token=${encodeURIComponent(token)}&fromType=APP`;
  let myRequest = getPostRequest(url, body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        let setcookie = resp['headers']['set-cookie'] || resp['headers']['Set-Cookie'] || '';
        if (setcookie) {
          let lzjdpintoken = setcookie.filter((row) => row.indexOf('lz_jdpin_token') !== -1)[0];
          if (lzjdpintoken && lzjdpintoken.indexOf('lz_jdpin_token=') > -1) {
            lz_jdpin_token = (lzjdpintoken.split(';') && lzjdpintoken.split(';')[0] + ';') || '';
          }
          let LZTOKENVALUE = setcookie.filter((row) => row.indexOf('LZ_TOKEN_VALUE') !== -1)[0];
          if (LZTOKENVALUE && LZTOKENVALUE.indexOf('LZ_TOKEN_VALUE=') > -1) {
            LZ_TOKEN_VALUE = (LZTOKENVALUE.split(';') && LZTOKENVALUE.split(';')[0]) || '';
            LZ_TOKEN_VALUE = LZ_TOKEN_VALUE.replace('LZ_TOKEN_VALUE=', '');
          }
        }
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.log(`执行任务异常`);
          console.log(data);
        }
        if (data.data && data.data.secretPin) {
          pin = data.data.secretPin;
          nickname = data.data.nickname;
        } else {
          console.log(JSON.stringify(data));
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
function getWxCommonInfoToken(url) {
  const method = `POST`;
  const headers = {
    'X-Requested-With': `XMLHttpRequest`,
    Connection: `keep-alive`,
    'Accept-Encoding': `gzip, deflate, br`,
    'Content-Type': `application/x-www-form-urlencoded`,
    Origin: `https://${Host}`,
    'User-Agent': `jdapp;iPhone;10.1.4;14.6;5a8a5743a5d2a4110a8ed396bb047471ea120c6a;network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214111493;appBuild/167814;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`,
    Cookie: cookie,
    Host: Host,
    Referer: Referer,
    'Accept-Language': `zh-cn`,
    Accept: `application/json`,
  };
  const body = ``;
  const myRequest = { url: url, method: method, headers: headers, body: body };
  return new Promise((resolve) => {
    $.post(myRequest, async (err, resp, data) => {
      try {
        let res = $.toObj(data);
        if (typeof res == 'object' && res.result === true) {
          if (typeof res.data.LZ_TOKEN_KEY != 'undefined') LZ_TOKEN_KEY = res.data.LZ_TOKEN_KEY;
          if (typeof res.data.LZ_TOKEN_VALUE != 'undefined') LZ_TOKEN_VALUE = res.data.LZ_TOKEN_VALUE;
        } else if (typeof res == 'object' && res.errorMessage) {
          console.log(`token ${res.errorMessage || ''}`);
        } else {
          console.log(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function getToken() {
  let config = {
    url: 'https://api.m.jd.com/client.action?functionId=isvObfuscator',
    body: 'body=%7B%22url%22%3A%22https%3A%5C/%5C/lzdz1-isv.isvjcloud.com%22%2C%22id%22%3A%22%22%7D&build=167863&client=apple&clientVersion=10.2.2&d_brand=apple&d_model=iPhone9%2C2&ef=1&eid=eidI42470115RDhDRjM1NjktODdGQi00RQ%3D%3DB3mSBu%2BcGp7WhKUUyye8/kqi1lxzA3Dv6a89ttwC7YFdT6JFByyAtAfO0TOmN9G2os20ud7RosfkMq80&ep=%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22screen%22%3A%22CJS0CseyCtK4%22%2C%22wifiBssid%22%3A%22ENcmCwPtZWYzCzK0DwTvZQZsY2S5YwVwC2CzCWHsDQU%3D%22%2C%22osVersion%22%3A%22CJGkDq%3D%3D%22%2C%22area%22%3A%22Cv8yENCmXzUnENS4XzK%3D%22%2C%22openudid%22%3A%22DWO4YJU3DNDrDWGyYJGnCJLrEQVuCzu2YwSmDNc0DzPvYJOyCQC2YG%3D%3D%22%2C%22uuid%22%3A%22aQf1ZRdxb2r4ovZ1EJZhcxYlVNZSZz09%22%7D%2C%22ts%22%3A1636080197%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D&ext=%7B%22prstate%22%3A%220%22%7D&isBackground=N&joycious=88&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&partner=apple&rfs=0000&scope=01&sign=390d7ee95da368f4141370ece33795e3&st=1636081272930&sv=110',
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
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data['token'] || '');
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
function getAuthorShareCode(url) {
  return new Promise(async (resolve) => {
    const options = {
      url: `${url}`,
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
        resolve(data || []);
      }
    });
    await $.wait(10000);
    resolve();
  });
}

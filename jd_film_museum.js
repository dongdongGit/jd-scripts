/*
动人影像馆
抽奖貌似没水了，累计签到有豆子，5天25豆，10天50豆，14天100豆  应该能拿到
注意*****************脚本会开一个会员卡，会加购，会助力作者********************
* cron 23 15 13-26 9 *
* https://raw.githubusercontent.com/star261/jd/main/scripts/jd_film_museum.js
* */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('京影像馆东汽车');

const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (Date.now() > 1632672000000) {
    console.log(`活动已结束`);
    return;
  }
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  let res = [];
  // try{res = await getAuthorShareCode('https://raw.githubusercontent.com/star261/jd/main/code/museum.json');}catch (e) {}
  // if(!res){
  //     try{res = await getAuthorShareCode('https://gitee.com/star267/share-code/raw/master/museum.json');}catch (e) {}
  //     if(!res){res = [];}
  // }
  if (res.length === 0) {
    // $.shareUuid = '61944';
    $.shareUuid = '';
  } else {
    $.shareUuid = getRandomArrayElements(res, 1)[0];
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    getUA();
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = '';
    $.skuIds = [];
    await $.totalBean();
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
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
    await $.clearShoppingCart();
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
  $.apptoken = ``;
  await getToken();
  if ($.token === ``) {
    console.log(`获取token失败`);
    return;
  }
  console.log(`获取token成功`);
  await getHtml();
  let apptokenInfo = await takePost('getAppTokenByJDToken', `jdtoken=${$.token}&shareuid=${$.shareUuid}`);
  if (apptokenInfo && apptokenInfo.apptoken) {
    $.apptoken = apptokenInfo.apptoken;
  } else {
    console.log(`获取apptoken失败`);
    return;
  }
  console.log(`获取apptoken成功`);
  await $.wait(500);
  let typeList = ['lotteryCount', 'lotteryHistory', 'isFollow', 'isViewVR', 'isJoin', 'lotteryPublicShow', 'globalLotteryHistory', 'getLiveShowUrl'];
  $.activityInfo = {};
  for (let i = 0; i < typeList.length; i++) {
    $.activityInfo[typeList[i]] = await takeGet(typeList[i]);
    await $.wait(100);
  }
  if (!$.activityInfo.lotteryCount.cuponcode) {
    let cuponcodeInfo = await takeGet('getCuponCode');
    console.log(`获得活动抽奖码：${cuponcodeInfo.cuponcode}`);
    await $.wait(2000);
  } else {
    console.log(`活动抽奖码：${$.activityInfo.lotteryCount.cuponcode}`);
  }
  if ($.activityInfo.isJoin.status === '0' && $.shareUuid) {
    await join('1000085868');
    await $.wait(1000);
    for (let i = 0; i < typeList.length; i++) {
      $.activityInfo[typeList[i]] = await takeGet(typeList[i]);
      await $.wait(100);
    }
  }
  await $.wait(2000);
  await doTask();
  let lotteryCountInfo = await takeGet('lotteryCount');
  let count = lotteryCountInfo.count;
  console.log(`可抽奖：${count}次`);
  for (let i = 0; i < count; i++) {
    console.log(`\n进行第${i + 1}次抽奖`);
    let lotteryInfo = await takeGet('doLottery');
    console.log(JSON.stringify(lotteryInfo));
    await $.wait(2000);
  }
}

async function takePost(type, body) {
  let url = `https://xm.bjsidao.com/${type}`;
  let info = {
    url: url,
    body: body,
    headers: {
      Host: 'xm.bjsidao.com',
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://jmkj2-isv.isvjcloud.com',
      Referer: ' https://jmkj2-isv.isvjcloud.com/',
      Cookie: $.cookie,
      apptoken: $.apptoken,
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
  return new Promise((resolve) => {
    $.post(info, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.data === null) {
            data.data = {};
          }
          data.data.message = data.message;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data.data);
      }
    });
  });
}

async function takeGet(type) {
  let url = `https://xm.bjsidao.com/${type}`;
  let info = {
    url: url,
    headers: {
      Host: 'xm.bjsidao.com',
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://jmkj2-isv.isvjcloud.com',
      Referer: ' https://jmkj2-isv.isvjcloud.com/',
      Cookie: $.cookie,
      apptoken: $.apptoken,
      'User-Agent': $.UA,
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
  return new Promise((resolve) => {
    $.get(info, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.data === null) {
            data.data = {};
          }
          data.data.message = data.message;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data.data);
      }
    });
  });
}

async function doTask() {
  console.log(`执行签到任务`);
  let returnInfo = await takeGet('checkIn');
  console.log(`签到：${returnInfo.message}`);
  await $.wait(2000);
  if ($.activityInfo.isFollow.status === '0') {
    console.log(`执行关注任务`);
    let info = await takeGet('followShop');
    console.log(`关注：${info.message}`);
    await $.wait(2000);
  }
  if ($.activityInfo.isViewVR.status === '0') {
    console.log(`执行VR任务`);
    let info = await takeGet('viewVR');
    console.log(`VR：${info.message}`);
    await $.wait(2000);
  }
  console.log(`进入直播间任务`);
  returnInfo = await takeGet('viewLiveShow');
  console.log(`进入直播间：${returnInfo.message}`);
  await $.wait(2000);
  let itemList = ['100025643312', '100025643292', '100025678746'];
  for (let i = 0; i < itemList.length; i++) {
    console.log(`浏览：${itemList[i]}`);
    returnInfo = await takePost('viewProduct', `sku=${itemList[i]}`);
    console.log(`浏览：${returnInfo.message}`);
    await $.wait(2000);
  }
  for (let i = 0; i < itemList.length; i++) {
    console.log(`加购：${itemList[i]}`);
    returnInfo = await takePost('addToCart', `num=1&itemId=${itemList[i]}`);
    console.log(`加购：${returnInfo.message}`);
    $.skuIds.push(itemList[i]);
    await $.wait(2000);
  }
  let shareTime = 0;
  let runTime = 0;
  do {
    console.log(`执行分享`);
    shareTime++;
    returnInfo = await takeGet('shareCount');
    shareTime = returnInfo.shareCount;
    await $.wait(1000);
    returnInfo = await takeGet('shareReport');
    shareTime = returnInfo.shareCount;
    await $.wait(2000);
    console.log(`已分享：${shareTime}次`);
    runTime++;
  } while (shareTime < 5 && runTime < 5);
}
function getHtml() {
  let config = {
    url: `https://jmkj2-isv.isvjcloud.com//jd/index.html?vtype=share&uid=${$.shareUuid}`,
    headers: {
      Host: 'jmkj2-isv.isvjcloud.com',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Cookie: `${$.cookie}`,
      'User-Agent': $.UA,
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
async function join(venderId) {
  return new Promise(async (resolve) => {
    $.shopactivityId = '';
    await $.wait(1000);
    await getshopactivityId(venderId);
    $.get(ruhui(`${venderId}`), async (err, resp, data) => {
      try {
        // console.log(data)
        data = JSON.parse(data);
        if (data.success == true) {
          $.log(data.message);
          if (data.result && data.result.giftInfo) {
            for (let i of data.result.giftInfo.giftList) {
              console.log(`入会获得:${i.discountString}${i.prizeName}${i.secondLineDesc}`);
            }
          }
        } else if (data.success == false) {
          $.log(data.message);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
async function getshopactivityId(venderId) {
  return new Promise((resolve) => {
    $.get(shopactivityId(`${venderId}`), async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success == true) {
          console.log(`入会:${data.result.shopMemberCardInfo.venderCardName || ''}`);
          $.shopactivityId =
            (data.result.interestsRuleList && data.result.interestsRuleList[0] && data.result.interestsRuleList[0].interestsInfo && data.result.interestsRuleList[0].interestsInfo.activityId) || '';
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function ruhui(functionId) {
  let activityId = ``;
  if ($.shopactivityId) activityId = `,"activityId":${$.shopactivityId}`;
  return {
    url: `https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=bindWithVender&body={"venderId":"${functionId}","shopId":"${functionId}","bindByVerifyCodeFlag":1,"registerExtend":{},"writeChildFlag":0${activityId},"channel":401}&client=H5&clientVersion=9.2.0&uuid=88888`,
    headers: {
      'Content-Type': 'text/plain; Charset=UTF-8',
      Origin: 'https://api.m.jd.com',
      Host: 'api.m.jd.com',
      accept: '*/*',
      'User-Agent': $.UA,
      'content-type': 'application/x-www-form-urlencoded',
      Referer: `https://shopmember.m.jd.com/shopcard/?venderId=${functionId}&shopId=${functionId}&venderType=5&channel=401&returnUrl=https://lzdz1-isv.isvjcloud.com/dingzhi/dz/openCard/activity/832865?activityId=c225ad5922cf4ac8b4a68fd37f486088&shareUuid=${$.shareUuid}`,
      Cookie: $.cookie,
      apptoken: $.apptoken
    },
  };
}
function shopactivityId(functionId) {
  return {
    url: `https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=getShopOpenCardInfo&body=%7B%22venderId%22%3A%22${functionId}%22%2C%22channel%22%3A401%7D&client=H5&clientVersion=9.2.0&uuid=88888`,
    headers: {
      'Content-Type': 'text/plain; Charset=UTF-8',
      Origin: 'https://api.m.jd.com',
      Host: 'api.m.jd.com',
      accept: '*/*',
      'User-Agent': $.UA,
      'content-type': 'application/x-www-form-urlencoded',
      Referer: `https://shopmember.m.jd.com/shopcard/?venderId=${functionId}&shopId=${functionId}&venderType=5&channel=401&returnUrl=https://lzdz1-isv.isvjcloud.com/dingzhi/dz/openCard/activity/832865?activityId=c225ad5922cf4ac8b4a68fd37f486088&shareUuid=${$.shareUuid}`,
      Cookie: $.cookie,
      apptoken: $.apptoken
    },
  };
}
function getToken() {
  let config = {
    url: 'https://api.m.jd.com/client.action?functionId=isvObfuscator',
    body: `area=2_2830_51828_0&body=%7B%22url%22%3A%22https%3A%5C/%5C/jmkj2-isv.isvjcloud.com%5C/%5C/jd%5C/index.html?vtype%3Dshare%26uid%3D1319%26lng%3D121.330575%26lat%3D31.292041%26sid%3Dd68167971a0380420a29f9072a7c491w%26un_area%3D2_2830_51828_0%22%2C%22id%22%3A%22%22%7D&build=167814&client=apple&clientVersion=10.1.4&d_brand=apple&d_model=iPhone9%2C2&eid=eidI42470115RDhDRjM1NjktODdGQi00RQ%3D%3DB3mSBu%2BcGp7WhKUUyye8/kqi1lxzA3Dv6a89ttwC7YFdT6JFByyAtAfO0TOmN9G2os20ud7RosfkMq80&isBackground=N&joycious=93&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=5a8a5743a5d2a4110a8ed396bb047471ea120c6a&osVersion=14.6&partner=apple&rfs=0000&scope=01&screen=1242%2A2208&sign=e1e6d76b164dd52cab8f0dcec61faa76&st=1631528316464&sv=100`,
    headers: {
      Host: 'api.m.jd.com',
      accept: '*/*',
      'user-agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
      'accept-language': 'zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6',
      'content-type': 'application/x-www-form-urlencoded',
      Cookie: $.cookie,
      apptoken: $.apptoken
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
function getUA() {
  $.UA = `jdapp;iPhone;10.0.10;14.3;${randomString(
    40
  )};network/wifi;model/iPhone12,1;addressid/4199175193;appBuild/167741;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;
}
function randomString(e) {
  e = e || 32;
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
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

/*
双11环游记大富翁
cron 0 16 1-11 11 * jd_travel_shop.js
脚本跑起来时间比较久，没有卡开，忘记有没有加购了 0 0
* */

const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('双11环游记大富翁');
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
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
      });
      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue;
    }
    try {
      await main($.cookie);
    } catch (e) {
      $.logErr(e);
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

async function main(cookie) {
  let max = false;
  let userName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
  let homeData = await takeRequest('?functionId=travel_getHomeData', 'functionId=travel_getHomeData&body={}&client=wh5&clientVersion=1.0.0', cookie);
  if (JSON.stringify(homeData) === '{}' || homeData.bizCode !== 0 || homeData.bizMsg !== 'success') {
    console.log(`${userName},初始化失败，可能是黑号`);
    return;
  }
  let body = `functionId=qryCompositeMaterials&body={"qryParam":"[{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"babelCountDownFromAdv\\",\\"id\\":\\"05884370\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"feedBannerT\\",\\"id\\":\\"05860672\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"feedBannerS\\",\\"id\\":\\"05861001\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"feedBannerA\\",\\"id\\":\\"05861003\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"feedBannerB\\",\\"id\\":\\"05861004\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"feedBottomHeadPic\\",\\"id\\":\\"05872092\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"feedBottomData0\\",\\"id\\":\\"05908556\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"fissionData\\",\\"id\\":\\"05863777\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"newProds\\",\\"id\\":\\"05864483\\"}]","activityId":"2vVU4E7JLH9gKYfLQ5EVW6eN2P7B","pageId":"","reqSrc":"","applyKey":"jd_star"}&client=wh5&clientVersion=1.0.0&uuid=8888`;
  let qryCompositeMaterials = await takeRequest('?functionId=qryCompositeMaterials', body, cookie);
  if (qryCompositeMaterials && qryCompositeMaterials.feedBottomData0 && qryCompositeMaterials.feedBottomData0.list) {
    await $.wait(2000);
    let shopList = qryCompositeMaterials.feedBottomData0.list;
    let thisBody = {};
    for (let i = 0; i < shopList.length && !max; i++) {
      let oneShop = shopList[i];
      let shopId = oneShop.link;
      let venderId = oneShop.extension.shopInfo.venderId;
      if (!shopId || !venderId) {
        return;
      }
      console.log(`\n${userName},第${i + 1}个店铺，${oneShop.name},ID:${shopId}`);
      let shopInfo = await takeRequest(
        '?functionId=jm_promotion_queryPromotionInfoByShopId',
        `functionId=jm_promotion_queryPromotionInfoByShopId&body={"shopId":"${shopId}","channel":20}&client=wh5&clientVersion=1.0.0`,
        cookie
      );
      if (shopInfo && shopInfo.innerLink && shopInfo.innerLink.match(/{\"appId\":\"(.*)\",\"category/) && shopInfo.innerLink.match(/{\"appId\":\"(.*)\",\"category/)[1]) {
        let appId = shopInfo.innerLink.match(/{\"appId\":\"(.*)\",\"category/)[1];
        let shopody = `functionId=jm_marketing_maininfo&body=%7B%22shopId%22%3A%22${shopId}%22%2C%22venderId%22%3A%22${venderId}%22%2C%22miniAppId%22%3A%22${appId}%22%7D&t=${Date.now()}&eid=&appid=shop_view&clientVersion=10.0.0&client=wh5&uuid=8888`;
        let mainShopInfo = await takeRequest('', shopody, cookie);
        if (!mainShopInfo.userInfo.attention) {
          console.log(`${userName},去关注`);
          body = `{"shopId":"${shopId}","follow":true,"type":0,"sourceRpc":"shop_app_myfollows_shop","refer":"https://wq.jd.com/pages/index/index"}`;
          shopody = `functionId=followShop&body=${encodeURIComponent(thisBody)}&t=${Date.now()}&eid=&appid=shop_view&clientVersion=10.0.0&client=wh5&uuid=8888`;
          await takeRequest('', shopody, cookie);
          await $.wait(2000);
        } else {
          console.log(`${userName},已关注`);
        }
        let fresh = false;
        let taskList = mainShopInfo.project.viewTaskVOS;
        for (let j = 0; j < taskList.length; j++) {
          let oneTask = taskList[j];
          if (oneTask.type === 1 || oneTask.type === 7 || oneTask.type === 2 || oneTask.type === 6) {
            continue;
          }
          if (oneTask.finishCount !== 0) {
            console.log(`${userName},任务:${oneTask.name},已完成`);
            continue;
          }
          if (oneTask.type === 5 || oneTask.type === 3) {
            console.log(`${userName},任务:${oneTask.name},去执行`);
            let needTime = oneTask.totalCount - oneTask.finishCount;
            thisBody = `{"shopId":"${shopId}","venderId":"${venderId}","miniAppId":"${appId}","taskId":${oneTask.id}}`;
            let taskGoods = await takeRequest(
              '',
              `functionId=jm_goods_taskGoods&body=${encodeURIComponent(thisBody)}&t=${Date.now()}&eid=&appid=shop_view&clientVersion=10.0.0&client=wh5&uuid=8888`,
              cookie
            );
            await $.wait(2000);
            let skuList = taskGoods.skuList;
            for (let k = 0; k < skuList.length && k < needTime; k++) {
              thisBody = `{"shopId":"${shopId}","venderId":"${venderId}","miniAppId":"${appId}","taskId":${oneTask.id},"token":"${oneTask.token}","opType":1,"referSource":${skuList[k].skuId}}`;
              await takeRequest('', `functionId=jm_task_process&body=${encodeURIComponent(thisBody)}&t=${Date.now()}&eid=&appid=shop_view&clientVersion=10.0.0&client=wh5&uuid=8888`, cookie);
              await $.wait(6000);
              thisBody = `{"shopId":"${shopId}","venderId":"${venderId}","miniAppId":"${appId}","taskId":${oneTask.id},"token":"${oneTask.token}","opType":2,"referSource":${skuList[k].skuId}}`;
              let finishInfo = await takeRequest(
                '',
                `functionId=jm_task_process&body=${encodeURIComponent(thisBody)}&t=${Date.now()}&appid=shop_view&clientVersion=10.0.0&client=wh5&uuid=8888`,
                cookie
              );
              if (finishInfo && finishInfo.awardVO) {
                console.log(`${userName},获得：${finishInfo.awardVO.name}`);
              } else {
                max = true;
              }
              //console.log(JSON.stringify(finishInfo)+'\n');
            }
            await $.wait(2000);
            fresh = true;
          } else if (oneTask.type === 8 || oneTask.type === 4) {
            console.log(`${userName},任务:${oneTask.name},去执行`);
            thisBody = `{"shopId":"${shopId}","venderId":"${venderId}","miniAppId":"${appId}","taskId":${oneTask.id},"token":"${oneTask.token}","opType":1}`;
            await takeRequest('', `functionId=jm_task_process&body=${encodeURIComponent(thisBody)}&t=${Date.now()}&eid=&appid=shop_view&clientVersion=10.0.0&client=wh5&uuid=8888`, cookie);
            await $.wait(5000);
            thisBody = `{"shopId":"${shopId}","venderId":"${venderId}","miniAppId":"${appId}","taskId":${oneTask.id},"token":"${oneTask.token}","opType":2}`;
            let finishInfo = await takeRequest(
              '',
              `functionId=jm_task_process&body=${encodeURIComponent(thisBody)}&t=${Date.now()}&eid=&appid=shop_view&clientVersion=10.0.0&client=wh5&uuid=8888`,
              cookie
            );
            if (finishInfo && finishInfo.awardVO) {
              console.log(`${userName},获得：${finishInfo.awardVO.name}`);
            } else {
              max = true;
            }
            await $.wait(2000);
            fresh = true;
          } else {
            console.log(`${userName},任务:${oneTask.name},不执行`);
          }
        }
        if (fresh) {
          shopody = `functionId=jm_marketing_maininfo&body=%7B%22shopId%22%3A%22${shopId}%22%2C%22venderId%22%3A%22${venderId}%22%2C%22miniAppId%22%3A%22${appId}%22%7D&t=${Date.now()}&eid=&appid=shop_view&clientVersion=10.0.0&client=wh5&uuid=8888`;
          mainShopInfo = await takeRequest('', shopody, cookie);
          taskList = mainShopInfo.project.viewTaskVOS;
        }
        let drawTime = mainShopInfo.userInfo.fansIcon;
        let taskId = '';
        let token = '';
        for (let j = 0; j < taskList.length; j++) {
          if (taskList[j].type === 1) {
            taskId = taskList[j].id;
            token = taskList[j].token;
          }
        }
        await $.wait(2000);
        for (let j = 0; j < drawTime; j++) {
          console.log(`${userName},丢一次骰子`);
          thisBody = `{"shopId":"${shopId}","venderId":"${venderId}","miniAppId":"${appId}","taskId":${taskId},"token":"${token}","opType":2}`;
          let finishInfo = await takeRequest(
            '',
            `functionId=jm_task_process&body=${encodeURIComponent(thisBody)}&t=${Date.now()}&eid=&appid=shop_view&clientVersion=10.0.0&client=wh5&uuid=8888`,
            cookie
          );
          if (finishInfo && finishInfo.awardVO) {
            console.log(`${userName},获得：${finishInfo.awardVO.name}`);
          }
          if (JSON.stringify(finishInfo) === '{}') {
            max = true;
          }
          console.log(JSON.stringify(finishInfo) + '\n');
          await $.wait(2000);
        }
      }
    }
  } else {
    console.log(`${userName},获取店铺列表失败`);
  }
}
async function takeRequest(functionId, body, cookie) {
  let url = `https://api.m.jd.com/client.action${functionId}`;
  const headers = {
    Origin: `https://wbbny.m.jd.com`,
    Cookie: cookie,
    Connection: `keep-alive`,
    Accept: `application/json, text/plain, */*`,
    Referer: `https://wbbny.m.jd.com/babelDiy/Zeus/2vVU4E7JLH9gKYfLQ5EVW6eN2P7B/index.html`,
    Host: `api.m.jd.com`,
    'user-agent': $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require('./USER_AGENTS').USER_AGENT
      : $.getdata('JDUA')
      ? $.getdata('JDUA')
      : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    'Accept-Language': `zh-cn`,
    'Accept-Encoding': `gzip, deflate, br`,
  };
  let myRequest = { url: url, headers: headers, body: body };
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        if (err) {
          console.log(err);
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        console.log(data);
        $.logErr(e, resp);
      } finally {
        resolve(data.data || {});
      }
    });
  });
}

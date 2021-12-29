/*
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
IOS用户支持京东双账号,NodeJs用户支持N个京东账号
更新时间：2021-6-6
活动入口：京东APP我的-更多工具-宠汪汪
建议先凌晨0点运行jd_joy.js脚本获取狗粮后，再运行此脚本(jd_joy_steal.js)可偷好友积分，6点运行可偷好友狗粮
feedCount:自定义 每次喂养数量; 等级只和喂养次数有关，与数量无关
推荐每次投喂10个，积累狗粮，然后去玩聚宝盆赌
Combine from Zero-S1/JD_tools(https://github.com/Zero-S1/JD_tools)
==========Quantumult X==========
[task_local]
#京东宠汪汪
15 0-23/2 * * * jd_joy.js, tag=京东宠汪汪, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdcww.png, enabled=true

============Loon===========
[Script]
cron "15 0-23/2 * * *" script-path=jd_joy.js,tag=京东宠汪汪

============Surge==========
[Script]
京东宠汪汪 = type=cron,cronexp="15 0-23/2 * * *",wake-system=1,timeout=3600,script-path=jd_joy.js

===============小火箭==========
京东宠汪汪 = type=cron,script-path=jd_joy.js, cronexpr="15 0-23/2 * * *", timeout=3600, enable=true
*/
const config = require('./utils/config.js');
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('宠汪汪');
const validator = require('./utils/JDJRValidator_Pure.js');
const MD5 = require('crypto-js/md5');

$.get = validator.injectToRequest2($.get.bind($));
$.post = validator.injectToRequest2($.post.bind($));

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const API_URL = 'https://api.m.jd.com/api';
let allMessage = '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
let message = '',
  subTitle = '';
let FEED_NUM = $.getdata('joyFeedCount') * 1 || 10; //每次喂养数量 [10,20,40,80]
let teamLevel = `2`; //参加多少人的赛跑比赛，默认是双人赛跑，可选2，10,50。其他不可选，其中2代表参加双人PK赛，10代表参加10人突围赛，50代表参加50人挑战赛，如若想设置不同账号参加不同类别的比赛则用&区分即可(如：`2&10&50`)
//是否参加宠汪汪双人赛跑（据目前观察，参加双人赛跑不消耗狗粮,如需参加其他多人赛跑，请关闭）
// 默认 'true' 参加双人赛跑，如需关闭 ，请改成 'false';
let joyRunFlag = true;
let jdNotify = true; //是否开启静默运行，默认true开启
let joyRunNotify = true; //宠汪汪赛跑获胜后是否推送通知，true推送，false不推送通知
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
      await $.totalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*******\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      message = '';
      subTitle = '';
      $.validate = '';
      // const zooFaker = require('./utils/JDJRValidator_Pure');
      // $.validate = await zooFaker.injectToRequest()
      await jdJoy();
      await showMsg();
      // await joinTwoPeopleRun();
    }
  }
  if ($.isNode() && joyRunNotify === 'true' && allMessage) await notify.sendNotify(`${$.name}`, `${allMessage}`);
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
async function jdJoy() {
  try {
    await getPetTaskConfigNew();
    if ($.getPetTaskConfigRes.success) {
      if ($.isNode()) {
        if (process.env.JOY_FEED_COUNT) {
          if ([0, 10, 20, 40, 80].indexOf(process.env.JOY_FEED_COUNT * 1) > -1) {
            FEED_NUM = process.env.JOY_FEED_COUNT ? process.env.JOY_FEED_COUNT * 1 : FEED_NUM;
          } else {
            console.log(`您输入的 JOY_FEED_COUNT 为非法数字，请重新输入`);
          }
        }
      }
      await feedPets(FEED_NUM); //喂食
      await Promise.all([petTask(), appPetTask()]);
      await deskGoodsTask(); //限时货柜
      await enterRoom();
      await joinTwoPeopleRun(); //参加双人赛跑
    } else {
      message += `${$.getPetTaskConfigRes.errorMessage}`;
    }
  } catch (e) {
    $.logErr(e);
  }
}
//逛商品得100积分奖励任务
async function deskGoodsTask() {
  const deskGoodsRes = await getDeskGoodDetails();
  if (deskGoodsRes && deskGoodsRes.success) {
    if (deskGoodsRes.data && deskGoodsRes.data.deskGoods) {
      const { deskGoods, taskChance, followCount = 0 } = deskGoodsRes.data;
      console.log(`浏览货柜商品 ${followCount ? followCount : 0}/${taskChance}`);
      if (taskChance === followCount) return;
      for (let item of deskGoods) {
        if (!item['status'] && item['sku']) {
          await followGoodDesk(item['sku']);
          await $.wait(3000);
          await followScan(item['sku']);
        }
      }
    } else {
      console.log(`\n限时商品货架已下架`);
    }
  }
}
//参加双人赛跑
async function joinTwoPeopleRun() {
  joyRunFlag = $.getdata('joyRunFlag') ? $.getdata('joyRunFlag') : joyRunFlag;
  if ($.isNode() && process.env.JOY_RUN_FLAG) {
    joyRunFlag = process.env.JOY_RUN_FLAG;
  }
  if (`${joyRunFlag}` === 'true') {
    let teamLevelTemp = [];
    teamLevelTemp = $.isNode()
      ? process.env.JOY_TEAM_LEVEL
        ? process.env.JOY_TEAM_LEVEL.split('&')
        : teamLevel.split('&')
      : $.getdata('JOY_TEAM_LEVEL')
      ? $.getdata('JOY_TEAM_LEVEL').split('&')
      : teamLevel.split('&');
    teamLevelTemp = teamLevelTemp[$.index - 1] ? teamLevelTemp[$.index - 1] : 2;
    await getPetRace();
    console.log(`\n===以下是京东账号${$.index} ${$.nickName} ${$.petRaceResult.data.teamLimitCount || teamLevelTemp}人赛跑信息===\n`);
    if ($.petRaceResult) {
      let petRaceResult = $.petRaceResult.data.petRaceResult;
      // let raceUsers = $.petRaceResult.data.raceUsers;
      console.log(`赛跑状态：${petRaceResult}\n`);
      if (petRaceResult === 'not_participate') {
        console.log(`暂未参赛，现在为您参加${teamLevelTemp}人赛跑`);
        await runMatch(teamLevelTemp * 1);
        if ($.runMatchResult.success) {
          await getWinCoin();
          console.log(`${$.getWinCoinRes.data.teamLimitCount || teamLevelTemp}人赛跑参加成功\n`);
          message += `${$.getWinCoinRes.data.teamLimitCount || teamLevelTemp}人赛跑：成功参加\n`;
          // if ($.getWinCoinRes.data['supplyOrder']) await energySupplyStation($.getWinCoinRes.data['supplyOrder']);
          await energySupplyStation('2');
          // petRaceResult = $.petRaceResult.data.petRaceResult;
          // await getRankList();
          console.log(`双人赛跑助力请自己手动去邀请好友，脚本不带赛跑助力功能\n`);
        }
      }
      if (petRaceResult === 'unbegin') {
        console.log('比赛还未开始，请九点再来');
      }
      if (petRaceResult === 'time_over') {
        console.log('今日参赛的比赛已经结束，请明天九点再来');
      }
      if (petRaceResult === 'unreceive') {
        console.log('今日参赛的比赛已经结束，现在领取奖励');
        await getWinCoin();
        let winCoin = 0;
        if ($.getWinCoinRes && $.getWinCoinRes.success) {
          winCoin = $.getWinCoinRes.data.winCoin;
        }
        await receiveJoyRunAward();
        console.log(`领取赛跑奖励结果：${JSON.stringify($.receiveJoyRunAwardRes)}`);
        if ($.receiveJoyRunAwardRes.success) {
          joyRunNotify = $.isNode() ? (process.env.JOY_RUN_NOTIFY ? process.env.JOY_RUN_NOTIFY : `${joyRunNotify}`) : $.getdata('joyRunNotify') ? $.getdata('joyRunNotify') : `${joyRunNotify}`;
          $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n太棒了，${$.name}赛跑取得获胜\n恭喜您已获得${winCoin}积分奖励`);
          allMessage += `京东账号${$.index}${$.nickName}\n太棒了，${$.name}赛跑取得获胜\n恭喜您已获得${winCoin}积分奖励${$.index !== cookiesArr.length ? '\n\n' : ''}`;
          // if ($.isNode() && joyRunNotify === 'true') await notify.sendNotify(`${$.name} - 京东账号${$.index} - ${$.nickName}`, `京东账号${$.index}${$.nickName}\n太棒了，${$.name}赛跑取得获胜\n恭喜您已获得${winCoin}积分奖励`)
        }
      }
      if (petRaceResult === 'participate') {
        // if ($.getWinCoinRes.data['supplyOrder']) await energySupplyStation($.getWinCoinRes.data['supplyOrder']);
        await energySupplyStation('2');
        await getRankList();
        if ($.raceUsers && $.raceUsers.length > 0) {
          for (let index = 0; index < $.raceUsers.length; index++) {
            if (index === 0) {
              console.log(`您当前里程：${$.raceUsers[index].distance}KM\n当前排名:第${$.raceUsers[index].rank}名\n将获得积分:${$.raceUsers[index].coin}\n`);
              // message += `您当前里程：${$.raceUsers[index].distance}km\n`;
            } else {
              console.log(`对手 ${$.raceUsers[index].nickName} 当前里程：${$.raceUsers[index].distance}KM`);
              // message += `对手当前里程：${$.raceUsers[index].distance}km\n`;
            }
          }
        }
        console.log('\n今日已参赛，下面显示应援团信息');
        await getBackupInfo();
        if ($.getBackupInfoResult.success) {
          const { currentNickName, totalMembers, totalDistance, backupList } = $.getBackupInfoResult.data;
          console.log(`${currentNickName}的应援团信息如下\n团员：${totalMembers}个\n团员助力的里程数：${totalDistance}\n`);
          if (backupList && backupList.length > 0) {
            for (let item of backupList) {
              console.log(`${item.nickName}为您助力${item.distance}km`);
            }
          } else {
            console.log(`暂无好友为您助力赛跑，如需助力，请手动去邀请好友助力\n`);
          }
        }
      }
    }
  } else {
    console.log(`您设置的是不参加双人赛跑`);
  }
}
//日常任务
async function petTask() {
  for (let item of $.getPetTaskConfigRes.datas || []) {
    const joinedCount = item.joinedCount || 0;
    if (item['receiveStatus'] === 'chance_full') {
      console.log(`${item.taskName} 任务已完成`);
      continue;
    }
    //每日签到
    if (item['taskType'] === 'SignEveryDay') {
      if (item['receiveStatus'] === 'chance_left') {
        console.log('每日签到未完成,需要自己手动去微信小程序【来客有礼】签到，可获得京豆奖励');
      } else if (item['receiveStatus'] === 'unreceive') {
        //已签到，领取签到后的狗粮
        const res = await getFood('SignEveryDay');
        console.log(`领取每日签到狗粮结果：${res.data}`);
      }
    }
    //每日赛跑
    if (item['taskType'] === 'race') {
      if (item['receiveStatus'] === 'chance_left') {
        console.log('每日赛跑未完成');
      } else if (item['receiveStatus'] === 'unreceive') {
        const res = await getFood('race');
        console.log(`领取每日赛跑狗粮结果：${res.data}`);
      }
    }
    //每日兑换
    if (item['taskType'] === 'exchange') {
      if (item['receiveStatus'] === 'chance_left') {
        console.log('每日兑换未完成');
      } else if (item['receiveStatus'] === 'unreceive') {
        const res = await getFood('exchange');
        console.log(`领取每日兑换狗粮结果：${res.data}`);
      }
    }
    //每日帮好友喂一次狗粮
    if (item['taskType'] === 'HelpFeed') {
      if (item['receiveStatus'] === 'chance_left') {
        console.log('每日帮好友喂一次狗粮未完成');
      } else if (item['receiveStatus'] === 'unreceive') {
        const res = await getFood('HelpFeed');
        console.log(`领取每日帮好友喂一次狗粮 狗粮结果：${res.data}`);
      }
    }
    //每日喂狗粮
    if (item['taskType'] === 'FeedEveryDay') {
      if (item['receiveStatus'] === 'chance_left') {
        console.log(`\n${item['taskName']}任务进行中\n`);
      } else if (item['receiveStatus'] === 'unreceive') {
        const res = await getFood('FeedEveryDay');
        console.log(`领取每日喂狗粮 结果：${res.data}`);
      }
    }
    //
    //邀请用户助力,领狗粮.(需手动去做任务)
    if (item['taskType'] === 'InviteUser') {
      if (item['receiveStatus'] === 'chance_left') {
        console.log('未完成,需要自己手动去邀请好友给你助力,可以获得狗粮');
      } else if (item['receiveStatus'] === 'unreceive') {
        const InviteUser = await getFood('InviteUser');
        console.log(`领取助力后的狗粮结果::${JSON.stringify(InviteUser)}`);
      }
    }
    //每日三餐
    if (item['taskType'] === 'ThreeMeals') {
      console.log('-----每日三餐-----');
      if (item['receiveStatus'] === 'unreceive') {
        const ThreeMealsRes = await getFood('ThreeMeals');
        if (ThreeMealsRes.success) {
          if (ThreeMealsRes.errorCode === 'received') {
            console.log(`三餐结果领取成功`);
            message += `【三餐】领取成功，获得${ThreeMealsRes.data}g狗粮\n`;
          }
        }
      }
    }
    //关注店铺
    if (item['taskType'] === 'FollowShop') {
      console.log('-----关注店铺-----');
      const followShops = item.followShops;
      for (let shop of followShops) {
        if (!shop.status) {
          await dofollowShop(shop.shopId);
          await $.wait(1000);
          const followShopRes = await followShop(shop.shopId);
          console.log(`关注店铺${shop.name}结果::${JSON.stringify(followShopRes)}`);
          await $.wait(5000);
        }
      }
    }
    //逛会场
    if (item['taskType'] === 'ScanMarket') {
      console.log('----逛会场----');
      const scanMarketList = item.scanMarketList;
      for (let scanMarketItem of scanMarketList) {
        if (!scanMarketItem.status) {
          const body = {
            marketLink: `${scanMarketItem.marketLink || scanMarketItem.marketLinkH5}`,
            taskType: 'ScanMarket',
          };
          await doScanMarket('scan', encodeURI(body['marketLink']));
          await $.wait(1000);
          const scanMarketRes = await scanMarket('scan', body);
          console.log(`逛会场-${scanMarketItem.marketName}结果::${JSON.stringify(scanMarketRes)}`);
          await $.wait(5000);
        }
      }
    }
    //浏览频道
    if (item['taskType'] === 'FollowChannel') {
      console.log('----浏览频道----');
      const followChannelList = item.followChannelList;
      for (let followChannelItem of followChannelList) {
        if (!followChannelItem.status) {
          const body = {
            channelId: followChannelItem.channelId,
            taskType: 'FollowChannel',
          };
          await doScanMarket('follow_channel', followChannelItem.channelId);
          await $.wait(1000);
          const scanMarketRes = await scanMarket('scan', body);
          console.log(`浏览频道-${followChannelItem.channelName}结果::${JSON.stringify(scanMarketRes)}`);
          await $.wait(5000);
        }
      }
    }
    //关注商品
    if (item['taskType'] === 'FollowGood') {
      console.log('----关注商品----');
      const followGoodList = item.followGoodList;
      for (let followGoodItem of followGoodList) {
        if (!followGoodItem.status) {
          const body = `sku=${followGoodItem.sku}`;
          await doScanMarket('follow_good', followGoodItem.sku);
          await $.wait(1000);
          const scanMarketRes = await scanMarket('followGood', body);
          // const scanMarketRes = await appScanMarket('followGood', `sku=${followGoodItem.sku}&reqSource=h5`, 'application/x-www-form-urlencoded');
          console.log(`关注商品-${followGoodItem.skuName}结果::${JSON.stringify(scanMarketRes)}`);
          await $.wait(5000);
        }
      }
    }
    //看激励视频
    if (item['taskType'] === 'ViewVideo') {
      console.log('----激励视频----');
      if (item.taskChance === joinedCount) {
        console.log('今日激励视频已看完');
      } else {
        for (let i = 0; i < new Array(item.taskChance - joinedCount).fill('').length; i++) {
          console.log(`开始第${i + 1}次看激励视频`);
          const body = { taskType: 'ViewVideo' };
          let sanVideoRes = await scanMarket('scan', body);
          console.log(`看视频激励结果--${JSON.stringify(sanVideoRes)}`);
        }
      }
    }
  }
}
async function appPetTask() {
  await appGetPetTaskConfig();
  // console.log('$.appGetPetTaskConfigRes', $.appGetPetTaskConfigRes.success)
  if ($.appGetPetTaskConfigRes.success) {
    for (let item of $.appGetPetTaskConfigRes.datas || []) {
      if (item['taskType'] === 'ScanMarket' && item['receiveStatus'] === 'chance_left') {
        const scanMarketList = item.scanMarketList;
        for (let scan of scanMarketList) {
          if (!scan.status && scan.showDest === 'h5') {
            const body = { marketLink: `${scan.marketLink || scan.marketLinkH5}`, taskType: 'ScanMarket' };
            await appScanMarket('scan', body);
            await $.wait(5000);
          }
        }
      }
    }
  }
}
function getDeskGoodDetails() {
  return new Promise((resolve) => {
    const url = `https://jdjoy.jd.com/common/pet/getDeskGoodDetails?invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getDeskGoodDetails API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function followScan(sku) {
  return new Promise((resolve) => {
    const body = {
      taskType: 'ScanDeskGood',
      sku: sku,
    };

    const url = `https://jdjoy.jd.com/common/pet/scan?invokeKey=${config.invokeKey}`;
    $.post(taskPostUrl(url, body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} followScan API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
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
function followGoodDesk(sku) {
  return new Promise((resolve) => {
    const queryParameters = {
      // code: '1624363341529274068136',
      iconCode: 'follow_good_desk',
      linkAddr: sku,
      reqSource: 'h5',
      invokeKey: config.invokeKey,
    };
    let queryParametersStr = '';
    Object.keys(queryParameters).map((item) => {
      queryParametersStr += item + '=' + queryParameters[item] + '&';
    });
    queryParametersStr = queryParametersStr.slice(0, queryParametersStr.length - 1);
    let url = `https://jdjoy.jd.com/common/pet/icon/click1?${queryParametersStr}`;

    $.get(taskPostUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} followGoodDesk API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
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
//小程序逛会场，浏览频道，关注商品API
function scanMarket(type, body) {
  return new Promise((resolve) => {
    const url = `https://draw.jdfcloud.com/common/pet/${type}?invokeKey=${config.invokeKey}`;
    $.post(taskPostUrl(url, body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} scanMarket API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function doScanMarket(type, body) {
  return new Promise((resolve) => {
    const url = `https://draw.jdfcloud.com/common/pet/icon/click?iconCode=${type}&linkAddr=${body}&invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} doScanMarket API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

//app逛会场
function appScanMarket(type, body) {
  return new Promise((resolve) => {
    const url = `https://jdjoy.jd.com/common/pet/${type}?invokeKey=${config.invokeKey}`;
    $.post(taskPostUrl(url, body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} appScanMarket API请求失败，请检查网路重试`);
        } else {
          // data = JSON.parse(data);
          console.log(`京东app逛会场结果::${data}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

//领取狗粮API
function getFood(type) {
  return new Promise((resolve) => {
    const url = `https://draw.jdfcloud.com/common/pet/getFood?taskType=${type}&invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getFood API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
//关注店铺api
function followShop(shopId) {
  return new Promise((resolve) => {
    const body = `shopId=${shopId}`;
    const url = `https://draw.jdfcloud.com/common/pet/followShop?invokeKey=${config.invokeKey}`;
    $.post(taskPostUrl(url, body), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} followShop API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function dofollowShop(shopId) {
  return new Promise((resolve) => {
    const url = `https://draw.jdfcloud.com/common/pet/icon/click?iconCode=follow_shop&linkAddr=${shopId}&invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} dofollowShop API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function enterRoom() {
  return new Promise((resolve) => {
    const url = `https://draw.jdfcloud.com/common/pet/enterRoom/h5?invitePin=&openId=&invokeKey=${config.invokeKey}`;
    $.post(taskPostUrl(url, {}), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} enterRoom API请求失败，请检查网路重试`);
        } else {
          $.roomData = JSON.parse(data);
          console.log(`现有狗粮: ${$.roomData.data.petFood}\n`);
          subTitle = `【用户名】${$.roomData.data.pin}`;
          message = `现有积分: ${$.roomData.data.petCoin}\n现有狗粮: ${$.roomData.data.petFood}\n喂养次数: ${$.roomData.data.feedCount}\n宠物等级: ${$.roomData.data.petLevel}\n`;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function appGetPetTaskConfig() {
  return new Promise((resolve) => {
    const url = `https://jdjoy.jd.com/common/pet/getPetTaskConfig?invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} appGetPetTaskConfig API请求失败，请检查网路重试`);
        } else {
          $.appGetPetTaskConfigRes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
//喂食
function feedPets(feedNum) {
  return new Promise((resolve) => {
    console.log(`您设置的喂食数量:${FEED_NUM}g\n`);
    if (FEED_NUM === 0) {
      console.log(`跳出喂食`);
      resolve();
      return;
    }
    console.log(`实际的喂食数量:${feedNum}g\n`);
    const url = `https://draw.jdfcloud.com/common/pet/feed?feedCount=${feedNum}&invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} feedPets API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.success) {
            if (data.errorCode === 'feed_ok') {
              console.log('喂食成功');
              message += `【喂食成功】消耗${feedNum}g狗粮\n`;
            } else if (data.errorCode === 'time_error') {
              console.log('喂食失败：您的汪汪正在食用中,请稍后再喂食');
              message += `【喂食失败】您的汪汪正在食用中,请稍后再喂食\n`;
            } else if (data.errorCode === 'food_insufficient') {
              console.log(`当前喂食${feedNum}g狗粮不够, 现为您降低一档次喂食\n`);
              if (feedNum === 80) {
                feedNum = 40;
              } else if (feedNum === 40) {
                feedNum = 20;
              } else if (feedNum === 20) {
                feedNum = 10;
              } else if (feedNum === 10) {
                feedNum = 0;
              }
              // 如果喂食设置的数量失败, 就降低一个档次喂食.
              if (feedNum !== 0) {
                await feedPets(feedNum);
              } else {
                console.log('您的狗粮已不足10g');
                message += `【喂食失败】您的狗粮已不足10g\n`;
              }
            } else {
              console.log(`其他状态${data.errorCode}`);
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
function getPetTaskConfig() {
  return new Promise((resolve) => {
    const url = `https://draw.jdfcloud.com/common/pet/getPetTaskConfig?invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getPetTaskConfig API请求失败，请检查网路重试`);
        } else {
          console.log(data);
          $.getPetTaskConfigRes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function getPetTaskConfigNew() {
  return new Promise((resolve) => {
    $.post(getUrlParams('petGetPetTaskConfig'), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getPetTaskConfig API请求失败，请检查网路重试`);
        } else {
          $.getPetTaskConfigRes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
//查询赛跑信息API
function getPetRace() {
  return new Promise((resolve) => {
    const url = `https://jdjoy.jd.com/common/pet/combat/detail/v2?help=false&invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getPetRace API请求失败，请检查网路重试`);
        } else {
          $.petRaceResult = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
//查询赛跑排行榜
function getRankList() {
  return new Promise((resolve) => {
    $.raceUsers = [];
    const url = `https://jdjoy.jd.com/common/pet/combat/getRankList?invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getRankList API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.success) {
            $.raceUsers = data.datas;
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
//参加赛跑API
function runMatch(teamLevel, timeout = 5000) {
  if (teamLevel === 10 || teamLevel === 50) timeout = 60000;
  console.log(`正在参赛中，请稍等${timeout / 1000}秒，以防多个账号匹配到统一赛场\n`);
  return new Promise(async (resolve) => {
    await $.wait(timeout);
    const url = `https://jdjoy.jd.com/common/pet/combat/match?teamLevel=${teamLevel}&invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} runMatch API请求失败，请检查网路重试`);
        } else {
          $.runMatchResult = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
//查询应援团信息API
function getBackupInfo() {
  return new Promise((resolve) => {
    const url = `https://jdjoy.jd.com/common/pet/combat/getBackupInfo?invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getBackupInfo API请求失败，请检查网路重试`);
        } else {
          $.getBackupInfoResult = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
//查询赛跑获得多少积分
function getWinCoin() {
  return new Promise((resolve) => {
    const url = `https://draw.jdfcloud.com/common/pet/combat/detail/v2?help=false&invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getWinCoin API请求失败，请检查网路重试`);
        } else {
          if (data) {
            $.getWinCoinRes = JSON.parse(data);
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
//领取赛跑奖励API
function receiveJoyRunAward() {
  return new Promise((resolve) => {
    const url = `https://jdjoy.jd.com/common/pet/combat/receive?invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} receiveJoyRunAward API请求失败，请检查网路重试`);
        } else {
          $.receiveJoyRunAwardRes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
//能力补给站
async function energySupplyStation(showOrder) {
  let status;
  await getSupplyInfo(showOrder);
  if ($.getSupplyInfoRes && $.getSupplyInfoRes.success) {
    if ($.getSupplyInfoRes.data) {
      const { marketList } = $.getSupplyInfoRes.data;
      for (let list of marketList) {
        if (!list['status']) {
          await scanMarket('combat/supply', { showOrder, supplyType: 'scan_market', taskInfo: list.marketLink || list['marketLinkH5'] });
          await getSupplyInfo(showOrder);
        } else {
          $.log(`能力补给站 ${$.getSupplyInfoRes.data.addDistance}km里程 已领取\n`);
          status = list['status'];
        }
      }
      if (!status) {
        await energySupplyStation(showOrder);
      }
    }
  }
}
function getSupplyInfo(showOrder) {
  return new Promise((resolve) => {
    const url = `https://draw.jdfcloud.com/common/pet/combat/getSupplyInfo?showOrder=${showOrder}&invokeKey=${config.invokeKey}`;
    $.get(taskUrl(url), (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} getSupplyInfo API请求失败，请检查网路重试`);
        } else {
          if (data) {
            $.getSupplyInfoRes = JSON.parse(data);
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
function showMsg() {
  jdNotify = $.getdata('jdJoyNotify') ? $.getdata('jdJoyNotify') : jdNotify;
  if (!jdNotify || jdNotify === 'false') {
    $.msg($.name, subTitle, message);
  } else {
    $.log(`\n${message}\n`);
  }
}
function getUrlParams(query, body = {"reqSource":"h5"}){
  lkt = new Date().getTime();
  lks = MD5('' + config.invokeKey + lkt).toString();
  let params = {
    url: API_URL,
    queryParams: {
      appid: 'jdchoujiang_h5',
      body: body
    },
    body: JSON.stringify(body),
    headers: {
      Origin: 'https://h5.m.jd.com',
      Cookie: cookie,
      ContentType: 'application/json',
      lkt: lkt,
      lks: lks
    }
  };

  if (typeof query == 'string') {
    params.queryParams.functionId = query;
  } else if (query instanceof Object) {
    Object.assign(params.queryParams, query)
  }

  url = params.url;
  queryStr = encodeQueryData(params.queryParams);

  return {
    url: url + (url.includes('?') ? '&' : '?') + queryStr,
    body: params.body,
    headers: params.headers
  }
}

function encodeQueryData(queyrParams) {
  const ret = [];
  for (k of Object.keys(queyrParams)) {
    v = queyrParams[k];
    if (typeof v == 'object') {
      v = JSON.stringify(v);
    }
    ret.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
  }

  return ret.join('&');
}
function taskUrl(url) {
  let lkt = new Date().getTime();
  let lks = MD5('' + config.invokeKey + lkt).toString();
  let Host = url.split('/')[2];
  if (Host === 'jdjoy.jd.com') {
    url += '&reqSource=h5';
    return {
      url: url + $.validate,
      headers: {
        Host: 'jdjoy.jd.com',
        Accept: '*/*',
        Origin: 'https://h5.m.jd.com',
        'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        Referer: 'https://h5.m.jd.com/',
        'Accept-Encoding': 'gzip, deflate, br',
        Cookie: cookie,
        lkt: lkt,
        lks: lks,
      },
    };
  } else {
    url += '&reqSource=weapp';
    return {
      url: url + $.validate,
      headers: {
        Host: 'draw.jdfcloud.com',
        Connection: 'keep-alive',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip,compress,br,deflate',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.15(0x18000f25) NetType/WIFI Language/zh_CN',
        Referer: 'https://servicewechat.com/wxccb5c536b0ecd1bf/760/page-frame.html',
        Cookie: cookie,
        lkt: lkt,
        lks: lks,
      },
    };
  }
}
function taskPostUrl(url, body) {
  let lkt = new Date().getTime();
  let lks = MD5('' + config.invokeKey + lkt).toString();
  let Host = url.split('/')[2];
  let CT;
  if (url.indexOf('followShop') > -1 || url.indexOf('followGood') > -1) {
    CT = `application/x-www-form-urlencoded`;
  } else {
    CT = `application/json`;
    body = JSON.stringify(body);
  }
  if (Host === 'jdjoy.jd.com') {
    url += '&reqSource=h5';
    return {
      url: url + $.validate,
      body,
      headers: {
        Host: 'jdjoy.jd.com',
        'Content-Type': CT,
        Accept: '*/*',
        'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Origin: 'https://h5.m.jd.com',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        Referer: 'https://h5.m.jd.com/',
        Cookie: cookie,
        lkt: lkt,
        lks: lks,
      },
    };
  } else {
    url += '&reqSource=weapp';
    return {
      url: url + $.validate,
      body,
      headers: {
        Host: 'draw.jdfcloud.com',
        Connection: 'keep-alive',
        'Content-Type': CT,
        'Accept-Encoding': 'gzip,compress,br,deflate',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.15(0x18000f25) NetType/WIFI Language/zh_CN',
        Referer: 'https://servicewechat.com/wxccb5c536b0ecd1bf/760/page-frame.html',
        Cookie: cookie,
        lkt: lkt,
        lks: lks,
      },
    };
  }
}

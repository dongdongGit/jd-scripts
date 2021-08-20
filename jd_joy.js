/*
jd宠汪汪 搬的https://github.com/uniqueque/QuantumultX/blob/4c1572d93d4d4f883f483f907120a75d925a693e/Script/jd_joy.js
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
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('宠汪汪二代目');
const validator = require('./utils/JDJRValidator_Pure.js');

$.get = validator.injectToRequest2($.get.bind($));
$.post = validator.injectToRequest2($.post.bind($));

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
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
const JD_API_HOST = 'https://jdjoy.jd.com/pet';
const weAppUrl = 'https://draw.jdfcloud.com//pet';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      await TotalBean();
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
    await getPetTaskConfig();
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
          const scanMarketRes = await scanMarket('followGood', body, 'application/x-www-form-urlencoded');
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
    // const url = `${JD_API_HOST}/getDeskGoodDetails`;
    const host = `jdjoy.jd.com`;
    const reqSource = 'h5';
    let opt = {
      url: '//jdjoy.jd.com/common/pet/getDeskGoodDetails?invokeKey=ztmFUCxcPMNyUq0P',
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url, host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
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
    // const url = `${JD_API_HOST}/scan`;
    const host = `jdjoy.jd.com`;
    const reqSource = 'h5';
    const body = {
      taskType: 'ScanDeskGood',
      sku,
    };
    let opt = {
      url: '//jdjoy.jd.com/common/pet/scan?invokeKey=ztmFUCxcPMNyUq0P',
      method: 'POST',
      data: body,
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.post(taskPostUrl(url, JSON.stringify(body), reqSource, host, 'application/json'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
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
//小程序逛会场，浏览频道，关注商品API
function scanMarket(type, body, cType = 'application/json') {
  return new Promise((resolve) => {
    // const url = `${weAppUrl}/${type}`;
    const host = `draw.jdfcloud.com`;
    const reqSource = 'weapp';
    let opt = {
      url: `//draw.jdfcloud.com/common/pet/${type}?invokeKey=ztmFUCxcPMNyUq0P`,
      method: 'POST',
      data: body,
      credentials: 'include',
      header: { 'content-type': cType },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    if (cType === 'application/json') {
      body = JSON.stringify(body);
    }
    $.post(taskPostUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), body, reqSource, host, cType), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
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
    const host = `draw.jdfcloud.com`;
    const reqSource = 'weapp';
    let opt = {
      url: `//draw.jdfcloud.com/common/pet/icon/click?iconCode=${type}&linkAddr=${body}&invokeKey=ztmFUCxcPMNyUq0P`,
      method: 'GET',
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    // console.log(url);
    $.get(taskUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
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
    // const url = `${JD_API_HOST}/${type}`;
    const host = `jdjoy.jd.com`;
    const reqSource = 'h5';
    let opt = {
      url: `//jdjoy.jd.com/common/pet/${type}?invokeKey=ztmFUCxcPMNyUq0P`,
      method: 'POST',
      data: body,
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.post(taskPostUrl(url, JSON.stringify(body), reqSource, host, 'application/json'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
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
    // const url = `${weAppUrl}/getFood?reqSource=weapp&taskType=${type}`;
    const host = `draw.jdfcloud.com`;
    const reqSource = 'weapp';
    let opt = {
      url: `//draw.jdfcloud.com/common/pet/getFood?taskType=${type}&invokeKey=ztmFUCxcPMNyUq0P`,
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
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
    // const url = `${weAppUrl}/followShop`;
    const body = `shopId=${shopId}`;
    const reqSource = 'weapp';
    const host = 'draw.jdfcloud.com';
    let opt = {
      url: '//draw.jdfcloud.com/common/pet/followShop?invokeKey=ztmFUCxcPMNyUq0P',
      method: 'POST',
      data: body,
      credentials: 'include',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.post(taskPostUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), body, reqSource, host, 'application/x-www-form-urlencoded'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
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
    const reqSource = 'weapp';
    const host = 'draw.jdfcloud.com';
    let opt = {
      url: `//draw.jdfcloud.com/common/pet/icon/click?iconCode=follow_shop&linkAddr=${shopId}&invokeKey=ztmFUCxcPMNyUq0P`,
      method: 'GET',
      credentials: 'include',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
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
    // const url = `${weAppUrl}/enterRoom/h5?reqSource=weapp&invitePin=&openId=`;
    const host = `draw.jdfcloud.com`;
    const reqSource = 'weapp';
    let opt = {
      url: `//draw.jdfcloud.com/common/pet/enterRoom/h5?invitePin=&openId=&invokeKey=ztmFUCxcPMNyUq0P`,
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.post({ ...taskUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), host, reqSource), body: '{}' }, (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('JSON.parse(data)', JSON.parse(data))

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
    const host = `jdjoy.jd.com`;
    const reqSource = 'h5';
    let opt = {
      url: '//jdjoy.jd.com/common/pet/getPetTaskConfig?invokeKey=ztmFUCxcPMNyUq0P',
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url, host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('----', JSON.parse(data))
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
    // const url = `${weAppUrl}/feed?feedCount=${feedNum}&reqSource=weapp`;
    const host = `draw.jdfcloud.com`;
    const reqSource = 'weapp';
    let opt = {
      url: `//draw.jdfcloud.com/common/pet/feed?feedCount=${feedNum}&invokeKey=ztmFUCxcPMNyUq0P`,
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), host, reqSource), async (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
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
    // const url = `${weAppUrl}/getPetTaskConfig?reqSource=weapp`;
    // const host = `jdjoy.jd.com`;
    // const reqSource = 'h5';
    const host = `draw.jdfcloud.com`;
    const reqSource = 'weapp';
    let opt = {
      url: '//draw.jdfcloud.com//common/pet/getPetTaskConfig?invokeKey=ztmFUCxcPMNyUq0P',
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('JSON.parse(data)', JSON.parse(data))
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
    // const url = `${JD_API_HOST}/combat/detail/v2?help=false`;
    const host = `jdjoy.jd.com`;
    const reqSource = 'h5';
    let opt = {
      url: '//jdjoy.jd.com/common/pet/combat/detail/v2?help=false&invokeKey=ztmFUCxcPMNyUq0P',
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url, host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('查询赛跑信息API',(data))
          // $.appGetPetTaskConfigRes = JSON.parse(data);
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
    // const url = `${JD_API_HOST}/combat/getRankList`;
    $.raceUsers = [];
    let opt = {
      url: '//jdjoy.jd.com/common/pet/combat/getRankList?invokeKey=ztmFUCxcPMNyUq0P',
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url, `jdjoy.jd.com`, 'h5'), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('查询赛跑信息API',(data))
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
    // const url = `${JD_API_HOST}/combat/match?teamLevel=${teamLevel}`;
    const host = `jdjoy.jd.com`;
    const reqSource = 'h5';
    let opt = {
      url: `//jdjoy.jd.com/common/pet/combat/match?teamLevel=${teamLevel}&invokeKey=ztmFUCxcPMNyUq0P`,
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url, host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('参加赛跑API', JSON.parse(data))
          // $.appGetPetTaskConfigRes = JSON.parse(data);
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
    // const url = `${JD_API_HOST}/combat/getBackupInfo`;
    const host = `jdjoy.jd.com`;
    const reqSource = 'h5';
    let opt = {
      url: '//jdjoy.jd.com/common/pet/combat/getBackupInfo?invokeKey=ztmFUCxcPMNyUq0P',
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url, host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('查询应援团信息API',(data))
          // $.appGetPetTaskConfigRes = JSON.parse(data);
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
    // const url = `${weAppUrl}/combat/detail/v2?help=false&reqSource=weapp`;
    let opt = {
      url: '//draw.jdfcloud.com/common/pet/combat/detail/v2?help=false&invokeKey=ztmFUCxcPMNyUq0P',
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), 'draw.jdfcloud.com', `weapp`), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('查询应援团信息API',(data))
          // $.appGetPetTaskConfigRes = JSON.parse(data);
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
    // const url = `${JD_API_HOST}/combat/receive`;
    const host = `jdjoy.jd.com`;
    const reqSource = 'h5';
    let opt = {
      url: '//jdjoy.jd.com/common/pet/combat/receive?invokeKey=ztmFUCxcPMNyUq0P',
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url, host, reqSource), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('查询应援团信息API',(data))
          // $.appGetPetTaskConfigRes = JSON.parse(data);
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
    // const url = `${weAppUrl}/combat/getSupplyInfo?showOrder=${showOrder}`;
    let opt = {
      url: `//draw.jdfcloud.com/common/pet/combat/getSupplyInfo?showOrder=${showOrder}&invokeKey=ztmFUCxcPMNyUq0P`,
      method: 'GET',
      data: {},
      credentials: 'include',
      header: { 'content-type': 'application/json' },
    };
    const url = 'https:' + taroRequest(opt)['url'] + $.validate;
    $.get(taskUrl(url.replace(/reqSource=h5/, 'reqSource=weapp'), 'draw.jdfcloud.com', `weapp`), (err, resp, data) => {
      try {
        if (err) {
          console.log('\n京东宠汪汪: API查询请求失败 ‼️‼️');
        } else {
          // console.log('查询应援团信息API',(data))
          // $.appGetPetTaskConfigRes = JSON.parse(data);
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
function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://wq.jd.com/user_new/info/QueryJDUserInfo?sceneval=2`,
      headers: {
        Accept: 'application/json,text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        Cookie: cookie,
        Referer: 'https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 1001) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === 0 && data.data && data.data.hasOwnProperty('userInfo')) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            console.log(`京东服务器返回空数据`);
          }
        }
      } catch (e) {
        $.logErr(e);
      } finally {
        resolve();
      }
    });
  });
}
function taskUrl(url, Host, reqSource) {
  return {
    url: url,
    headers: {
      Cookie: cookie,
      // 'reqSource': reqSource,
      Host: Host,
      Connection: 'keep-alive',
      'Content-Type': 'application/json',
      Referer: 'https://jdjoy.jd.com/pet/index',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
}
function taskPostUrl(url, body, reqSource, Host, ContentType) {
  return {
    url: url,
    body: body,
    headers: {
      Cookie: cookie,
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      // 'reqSource': reqSource,
      'Content-Type': ContentType,
      Host: Host,
      Referer: 'https://jdjoy.jd.com/pet/index',
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
}
function taroRequest(e) {
  const a = $.isNode() ? require('crypto-js') : CryptoJS;
  const i = '98c14c997fde50cc18bdefecfd48ceb7';
  const o = a.enc.Utf8.parse(i);
  const r = a.enc.Utf8.parse('ea653f4f3c5eda12');
  let _o = {
    AesEncrypt: function AesEncrypt(e) {
      var n = a.enc.Utf8.parse(e);
      return a.AES.encrypt(n, o, {
        iv: r,
        mode: a.mode.CBC,
        padding: a.pad.Pkcs7,
      }).ciphertext.toString();
    },
    AesDecrypt: function AesDecrypt(e) {
      var n = a.enc.Hex.parse(e),
        t = a.enc.Base64.stringify(n);
      return a.AES.decrypt(t, o, {
        iv: r,
        mode: a.mode.CBC,
        padding: a.pad.Pkcs7,
      })
        .toString(a.enc.Utf8)
        .toString();
    },
    Base64Encode: function Base64Encode(e) {
      var n = a.enc.Utf8.parse(e);
      return a.enc.Base64.stringify(n);
    },
    Base64Decode: function Base64Decode(e) {
      return a.enc.Base64.parse(e).toString(a.enc.Utf8);
    },
    Md5encode: function Md5encode(e) {
      return a.MD5(e).toString();
    },
    keyCode: '98c14c997fde50cc18bdefecfd48ceb7',
  };

  const c = function sortByLetter(e, n) {
    if (e instanceof Array) {
      n = n || [];
      for (var t = 0; t < e.length; t++) n[t] = sortByLetter(e[t], n[t]);
    } else
      !(e instanceof Array) && e instanceof Object
        ? ((n = n || {}),
          Object.keys(e)
            .sort()
            .map(function (t) {
              n[t] = sortByLetter(e[t], n[t]);
            }))
        : (n = e);
    return n;
  };
  const s = function isInWhiteAPI(e) {
    for (var n = ['gift', 'pet'], t = !1, a = 0; a < n.length; a++) {
      var i = n[a];
      e.includes(i) && !t && (t = !0);
    }
    return t;
  };

  const d = function addQueryToPath(e, n) {
    if (n && Object.keys(n).length > 0) {
      var t = Object.keys(n)
        .map(function (e) {
          return e + '=' + n[e];
        })
        .join('&');
      return e.indexOf('?') >= 0 ? e + '&' + t : e + '?' + t;
    }
    return e;
  };
  const l = function apiConvert(e) {
    for (var n = r, t = 0; t < n.length; t++) {
      var a = n[t];
      e.includes(a) && !e.includes('common/' + a) && (e = e.replace(a, 'common/' + a));
    }
    return e;
  };

  var n = e,
    t = (n.header, n.url);
  t += (t.indexOf('?') > -1 ? '&' : '?') + 'reqSource=h5';
  var _a = (function getTimeSign(e) {
    var n = e.url,
      t = e.method,
      a = void 0 === t ? 'GET' : t,
      i = e.data,
      r = e.header,
      m = void 0 === r ? {} : r,
      p = a.toLowerCase(),
      g = _o.keyCode,
      f = m['content-type'] || m['Content-Type'] || '',
      h = '',
      u = +new Date();
    return (
      (h =
        'get' !== p && ('post' !== p || ('application/x-www-form-urlencoded' !== f.toLowerCase() && i && Object.keys(i).length))
          ? _o.Md5encode(_o.Base64Encode(_o.AesEncrypt('' + JSON.stringify(c(i)))) + '_' + g + '_' + u)
          : _o.Md5encode('_' + g + '_' + u)),
      s(n) &&
        ((n = d(n, {
          lks: h,
          lkt: u,
        })),
        (n = l(n))),
      Object.assign(e, {
        url: n,
      })
    );
  })(
    (e = Object.assign(e, {
      url: t,
    }))
  );
  return _a;
}

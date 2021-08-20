/*
开学焕新加油站
活动日期：2021-08-20 00:00:00--2021-08-31 23:59:59
修改自 @yangtingxiao 抽奖机脚本
活动入口：京东APP首页搜索-玩一玩-开学焕新加油站
网页地址：https://h5.m.jd.com/babelDiy/Zeus/3RejAk5YXzhvxXiBR1tzWnUbwneW/index.html
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#开学焕新加油站
20 8 * * * jd_start_school.js, tag=开学焕新加油站, img-url=https://raw.githubusercontent.com/Orz-3/task/master/jd.png, enabled=true

================Loon==============
[Script]
cron "20 8 * * *" script-path=jd_start_school.js, tag=开学焕新加油站

===============Surge=================
开学焕新加油站 = type=cron,cronexp="20 8 * * *",wake-system=1,timeout=3600,script-path=jd_start_school.js

============小火箭=========
开学焕新加油站 = type=cron,script-path=jd_start_school.js, cronexpr="20 8 * * *", timeout=3600, enable=true

 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('开学焕新加油站');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let appId = '1E1xVyqw',
  homeDataFunPrefix = 'healthyDay',
  collectScoreFunPrefix = 'harmony',
  message = '';
let lotteryResultFunPrefix = 'interact_template';
const inviteCodes = [''];
$.newShareCodes = [];
const randomCount = $.isNode() ? 20 : 5;
const notify = $.isNode() ? require('./sendNotify') : '';
let merge = {};
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || '[]';
  cookiesData = jd_helpers.jsonParse(cookiesData);
  cookiesArr = cookiesData.map((item) => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter((item) => item !== '' && item !== null && item !== undefined);
}

const JD_API_HOST = `https://api.m.jd.com/client.action`;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
    return;
  }
  await requireConfig();
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.beans = 0;
      message = '';
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await interactTemplateGetHomeData();
      await showMsg();
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());
//获取活动信息
async function interactTemplateGetHomeData() {
  await getActivityConfig();
  try {
    i = 0;
    for (let task of $.taskVos) {
      console.log(`${task.taskType}-${task.taskName}-` + (task.status === 1 ? `已完成${task.times}-未完成${task.maxTimes}` : '全部已完成') + '\n');

      if (task.taskName === '邀请好友助力') {
        console.log(`您的好友助力码为:${task.assistTaskDetailVo.taskToken}`);
        $.newShareCodes.push(task.assistTaskDetailVo.taskToken);

        for (let code of $.newShareCodes) {
          if (!code) continue;
          await harmonyCollectScore(code, task.taskId);
          await $.wait(2000);
        }
      } else if (task.status === 3) {
        console.log('开始抽奖');

        if ([27].includes(task.taskType)) {
          await healthyDayGetLotteryResult(task.taskId);
        } else {
          await interactTemplateGetLotteryResult(task.taskId);
        }
      } else if ([0, 12, 13].includes(task.taskType)) {
        if (task.status === 1) await harmonyCollectScore(task.simpleRecordInfoVo.taskToken, task.taskId);
      } else if ([14, 6].includes(task.taskType)) {
        for (let j = 0; j < (data.data.result.userInfo.lotteryNum || 0); j++) {
          await interactTemplateGetLotteryResult(task.taskId);
        }
      }

      if (![14, 21].includes(task.taskType)) {
        for (let k = task.times; k < task.maxTimes; k++) {
          let list = task.productInfoVos || task.followShopVo || task.shoppingActivityVos || task.browseShopVo;
          
          if (list.length != task.maxTimes) {
            await getActivityConfig();
            task = $.taskVos[i];
            list = task.productInfoVos || task.followShopVo || task.shoppingActivityVos || task.browseShopVo;
          }

          for (let item of list) {
            if (item.status != 1) {
              continue;
            }
            console.log('\n' + (item.title || item.shopName || item.skuName));
            if (item.itemId) {
              await harmonyCollectScore(item.taskToken, task.taskId, item.itemId, 1, task.waitDuration);
              if (k === task.maxTimes - 1) await interactTemplateGetLotteryResult(task.taskId);
            } else {
              await harmonyCollectScore(item.taskToken, task.taskId);
            }
          }
        }

      }
      i++;
    }

    if ($.scorePerLottery) await interactTemplateGetLotteryResult();
  } catch (e) {
    $.logErr(e);
  }
}
// 获取活动配置
function getActivityConfig() {
  return new Promise((resolve) => {
    let url = {
      url: `${JD_API_HOST}`,
      headers: {
        Origin: `https://h5.m.jd.com`,
        Cookie: cookie,
        Connection: `keep-alive`,
        Accept: `application/json, text/plain, */*`,
        Referer: `https://h5.m.jd.com/babelDiy/Zeus/2zW4dcRWBnTu3FxXJysiFRHAhkZm/index.html`,
        Host: `api.m.jd.com`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Accept-Language': `zh-cn`,
      },
      body: `functionId=${homeDataFunPrefix}_getHomeData&body={"appId":"${appId}","taskToken":""}&client=wh5&clientVersion=1.0.0`,
    };
  
    $.post(url, async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.data.bizCode !== 0) {
          console.log(data.data.bizMsg);
          merge.jdBeans.fail++;
          merge.jdBeans.notify = `${data.data.bizMsg}`;
          return;
        }
  
        $.taskVos = data.data.result.taskVos;
        $.scorePerLottery = data.data.result.userInfo.scorePerLottery || data.data.result.userInfo.lotteryMinusScore;
  
        if (data.data.result.raiseInfo && data.data.result.raiseInfo.levelList) {
          $.scorePerLottery = data.data.result.raiseInfo.levelList[data.data.result.raiseInfo.scoreLevel];
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  })
}
//做任务
function harmonyCollectScore(taskToken, taskId, itemId = '', actionType = 0, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2zW4dcRWBnTu3FxXJysiFRHAhkZm/index.html`,
          Host: `api.m.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
        },
        body: `functionId=${collectScoreFunPrefix}_collectScore&body={"appId":"${appId}","taskToken":"${taskToken}","taskId":${taskId}${
          itemId ? ',"itemId":"' + itemId + '"' : ''
        },"actionType":${actionType}&client=wh5&clientVersion=1.0.0`,
      };

      $.post(url, async (err, resp, data) => {
        try {
          data = JSON.parse(data);
          if (data.data.bizMsg === '任务领取成功') {
            await harmonyCollectScore(taskToken, taskId, itemId, 0, parseInt(timeout) * 1000);
          } else {
            console.log(data.data.bizMsg);
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}
//抽奖
function interactTemplateGetLotteryResult(taskId, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2zW4dcRWBnTu3FxXJysiFRHAhkZm/index.html?inviteId=P04z54XCjVXmYaW5m9cZ2f433tIlGBj3JnLHD0`,
          Host: `api.m.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
        },
        body: `functionId=${lotteryResultFunPrefix}_getLotteryResult&body={"appId":"${appId}"${taskId ? ',"taskId":"' + taskId + '"' : ''}}&client=wh5&clientVersion=1.0.0`,
      };
      $.post(url, async (err, resp, data) => {
        try {
          if (!timeout) console.log('\n抽奖结果');
          data = JSON.parse(data);
          if (data.data.bizCode === 0) {
            if (data.data.result.userAwardsCacheDto.jBeanAwardVo) {
              console.log('京豆:' + data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity);
              $.beans += parseInt(data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity);
            }
            if (data.data.result.raiseInfo) scorePerLottery = parseInt(data.data.result.raiseInfo.nextLevelScore);
            if (parseInt(data.data.result.userScore) >= scorePerLottery && scorePerLottery) {
              await interactTemplateGetLotteryResult(1000);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}
//抽奖
function healthyDayGetLotteryResult(taskId, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2zW4dcRWBnTu3FxXJysiFRHAhkZm/index.html?inviteId=P04z54XCjVXmYaW5m9cZ2f433tIlGBj3JnLHD0`, //?inviteId=P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ
          Host: `api.m.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
        },
        body: `functionId=${homeDataFunPrefix}_getLotteryResult&body={"appId":"${appId}"${taskId ? ',"taskId":"' + taskId + '"' : ''}}&client=wh5&clientVersion=1.0.0`,
      };
      $.post(url, async (err, resp, data) => {
        try {
          if (!timeout) console.log('\n抽奖结果');
          data = JSON.parse(data);
          if (data.data.bizCode === 0) {
            if (data.data.result.userAwardsCacheDto.jBeanAwardVo) {
              console.log('京豆:' + data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity);
              $.beans += parseInt(data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity);
            }
            if (data.data.result.raiseInfo) scorePerLottery = parseInt(data.data.result.raiseInfo.nextLevelScore);
            if (parseInt(data.data.result.userScore) >= scorePerLottery && scorePerLottery) {
              await interactTemplateGetLotteryResult(1000);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}

//通知
function showMsg() {
  message += `任务已完成，本次运行获得京豆${$.beans}`;
  return new Promise((resolve) => {
    if ($.beans) $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    $.log(`【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve();
  });
}

function requireConfig() {
  return new Promise(async (resolve) => {
    console.log(`开始获取${$.name}配置文件\n`);
    //Node.js用户请在jdCookie.js处填写京东ck;
    let shareCodes = [];
    console.log(`共${cookiesArr.length}个京东账号\n`);
    if ($.isNode() && process.env.JDSGMH_SHARECODES) {
      if (process.env.JDSGMH_SHARECODES.indexOf('\n') > -1) {
        shareCodes = process.env.JDSGMH_SHARECODES.split('\n');
      } else {
        shareCodes = process.env.JDSGMH_SHARECODES.split('&');
      }
    }
    $.shareCodesArr = [];
    if ($.isNode()) {
      Object.keys(shareCodes).forEach((item) => {
        if (shareCodes[item]) {
          $.shareCodesArr.push(shareCodes[item]);
        }
      });
    }
    console.log(`您提供了${$.shareCodesArr.length}个账号的${$.name}助力码\n`);
    resolve();
  });
}

function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      headers: {
        Accept: 'application/json,text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        Cookie: cookie,
        Referer: 'https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0'
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
      },
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === 0) {
              $.nickName = data['base'].nickname;
            } else {
              $.nickName = $.UserName;
            }
          } else {
            console.log(`京东服务器返回空数据`);
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

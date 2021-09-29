/*
荣耀换新
活动日期：2021-08-07 00:00:00--2021-08-20 23:59:59
修改自 @yangtingxiao 抽奖机脚本
活动入口：京东APP首页搜索-玩一玩-荣耀换新
网页地址：https://h5.m.jd.com/babelDiy/Zeus/3RejAk5YXzhvxXiBR1tzWnUbwneW/index.html
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#荣耀换新
20 8 * * * jd_ryhx.js, tag=荣耀换新, img-url=https://raw.githubusercontent.com/Orz-3/task/master/jd.png, enabled=true

================Loon==============
[Script]
cron "20 8 * * *" script-path=jd_ryhx.js, tag=荣耀换新

===============Surge=================
荣耀换新 = type=cron,cronexp="20 8 * * *",wake-system=1,timeout=3600,script-path=jd_ryhx.js

============小火箭=========
荣耀换新 = type=cron,script-path=jd_ryhx.js, cronexpr="20 8 * * *", timeout=3600, enable=true

 */
const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
const $ = jd_env.env('荣耀换新');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';
let appId = '1E1NYwqc',
  homeDataFunPrefix = 'healthyDay',
  collectScoreFunPrefix = 'harmony',
  message = '';
let lotteryResultFunPrefix = 'interact_template';
const inviteCodes = [''];
$.newShareCodes = [];
const randomCount = $.isNode() ? 20 : 5;
const notify = $.isNode() ? require('../sendNotify') : '';
let merge = {
  jdBeans: {}
};
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
    $.cookie = cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.beans = 0;
      message = '';
      await $.totalBean();
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
      await interact_template_getHomeData();
      await showMsg();
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());
//获取活动信息
function interact_template_getHomeData(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html`,
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
          scorePerLottery = data.data.result.userInfo.scorePerLottery || data.data.result.userInfo.lotteryMinusScore;
          if (data.data.result.raiseInfo && data.data.result.raiseInfo.levelList) scorePerLottery = data.data.result.raiseInfo.levelList[data.data.result.raiseInfo.scoreLevel];
          //console.log(scorePerLottery)
          for (let i = 0; i < data.data.result.taskVos.length; i++) {
            console.log(
              '\n' +
                data.data.result.taskVos[i].taskType +
                '-' +
                data.data.result.taskVos[i].taskName +
                '-' +
                (data.data.result.taskVos[i].status === 1 ? `已完成${data.data.result.taskVos[i].times}-未完成${data.data.result.taskVos[i].maxTimes}` : '全部已完成')
            );
            //签到
            if (data.data.result.taskVos[i].taskName === '邀请好友助力') {
              console.log(`您的好友助力码为:${data.data.result.taskVos[i].assistTaskDetailVo.taskToken}`);
              $.newShareCodes.push(data.data.result.taskVos[i].assistTaskDetailVo.taskToken);
              for (let code of $.newShareCodes) {
                if (!code) continue;
                await harmony_collectScore(code, data.data.result.taskVos[i].taskId);
                await $.wait(2000);
              }
            } else if (data.data.result.taskVos[i].status === 3) {
              console.log('开始抽奖');
              if ([27].includes(data.data.result.taskVos[i].taskType)) {
                await healthyDay_getLotteryResult(data.data.result.taskVos[i].taskId);
              } else {
                await interact_template_getLotteryResult(data.data.result.taskVos[i].taskId);
              }
            } else if ([0, 12, 13].includes(data.data.result.taskVos[i].taskType)) {
              if (data.data.result.taskVos[i].status === 1) {
                await harmony_collectScore(data.data.result.taskVos[i].simpleRecordInfoVo.taskToken, data.data.result.taskVos[i].taskId);
              }
            } else if ([14, 6].includes(data.data.result.taskVos[i].taskType)) {
              //console.log(data.data.result.taskVos[i].assistTaskDetailVo.taskToken)
              for (let j = 0; j < (data.data.result.userInfo.lotteryNum || 0); j++) {
                if (appId === '1E1NYwqc') {
                  await ts_smashGoldenEggs();
                } else {
                  await interact_template_getLotteryResult(data.data.result.taskVos[i].taskId);
                }
              }
            }
            let list =
              data.data.result.taskVos[i].productInfoVos || data.data.result.taskVos[i].followShopVo || data.data.result.taskVos[i].shoppingActivityVos || data.data.result.taskVos[i].browseShopVo;
            for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
              let browseTime = data.data.result.taskVos[i].waitDuration;
              for (let j in list) {
                if (list[j].status === 1) {
                  //console.log(list[j].simpleRecordInfoVo||list[j].assistTaskDetailVo)
                  console.log('\n' + (list[j].title || list[j].shopName || list[j].skuName));
                  //console.log(list[j].itemId)
                  if (list[j].itemId) {
                    await harmony_collectScore(list[j].taskToken, data.data.result.taskVos[i].taskId, list[j].itemId, 1, data.data.result.taskVos[i].waitDuration);
                    if (k === data.data.result.taskVos[i].maxTimes - 1) await interact_template_getLotteryResult(data.data.result.taskVos[i].taskId);
                  } else {
                    await harmony_collectScore(list[j].taskToken, data.data.result.taskVos[i].taskId);
                  }
                  list[j].status = 2;
                  break;
                }
              }
            }
          }
          if (scorePerLottery) await interact_template_getLotteryResult();
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}
//做任务
function harmony_collectScore(taskToken, taskId, itemId = '', actionType = 0, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html`, //?inviteId=P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ?inviteId=${shareCode}
          Host: `api.m.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
        },
        body: `functionId=${collectScoreFunPrefix}_collectScore&body={"appId":"${appId}","taskToken":"${taskToken}","taskId":${taskId}${
          itemId ? ',"itemId":"' + itemId + '"' : ''
        },"actionType":${actionType}&client=wh5&clientVersion=1.0.0`,
      };
      //console.log(url.body)
      //if (appId === "1E1NYwqc") url.body += "&appid=golden-egg"
      $.post(url, async (err, resp, data) => {
        try {
          data = JSON.parse(data);
          if (data.data.bizMsg === '任务领取成功') {
            await harmony_collectScore(taskToken, taskId, itemId, 0, parseInt(timeout) * 1000);
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
function interact_template_getLotteryResult(taskId, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html?inviteId=P04z54XCjVXmYaW5m9cZ2f433tIlGBj3JnLHD0`, //?inviteId=P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ
          Host: `api.m.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
        },
        body: `functionId=${lotteryResultFunPrefix}_getLotteryResult&body={"appId":"${appId}"${taskId ? ',"taskId":"' + taskId + '"' : ''}}&client=wh5&clientVersion=1.0.0`,
      };
      //console.log(url.body)
      //if (appId === "1E1NYwqc") url.body = `functionId=ts_getLottery&body={"appId":"${appId}"${taskId ? ',"taskId":"'+taskId+'"' : ''}}&client=wh5&clientVersion=1.0.0&appid=golden-egg`
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
              await interact_template_getLotteryResult(1000);
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
function healthyDay_getLotteryResult(taskId, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}`,
        headers: {
          Origin: `https://h5.m.jd.com`,
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/2WBcKYkn8viyxv7MoKKgfzmu7Dss/index.html?inviteId=P04z54XCjVXmYaW5m9cZ2f433tIlGBj3JnLHD0`, //?inviteId=P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ P225KkcRx4b8lbWJU72wvZZcwCjVXmYaS5jQ
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
              await interact_template_getLotteryResult(1000);
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
/*
京东抽奖机
更新时间：2021-08-26 09:29
脚本说明：抽奖活动,有新活动可以@我或者提Issues
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#京东抽奖机
45 0,10 * * * https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_lotteryMachine.js, tag=京东抽奖机, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/jdlottery.png, enabled=true
// Loon
[Script]
cron "45 0,10 * * *" script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_lotteryMachine.js,tag=京东抽奖机
// Surge
京东抽奖机 = type=cron,cronexp=45 0,10 * * *,wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_lotteryMachine.js
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东抽奖机&内部互助');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const STRSPLIT = '|';
const needSum = false; //是否需要显示汇总
const printDetail = false; //是否显示出参详情
const appIdArr = ['1EFRRxA', '1EFRQwA', '1EFRXxg', '1E1NXxq0', '1ElBTx6o', '1FV1VwKc', '1FFRWxaY', '1FFVQyqw', '1FFRWwqg', '1FV1ZwKY', '1FFRWxaY'];
const shareCodeArr = [''];
const homeDataFunPrefixArr = ['interact_template', 'interact_template', 'interact_template', 'interact_template', 'interact_template', 'interact_template'];
const collectScoreFunPrefixArr = ['', '', '', '', '', '', '', '', '', '', '', '', 'interact_template', 'interact_template'];
const lotteryResultFunPrefixArr = ['', '', '', '', '', '', '', '', '', '', '', '', '', 'interact_template', 'interact_template'];
let merge = {};
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
const JD_API_HOST = `https://api.m.jd.com/client.action`;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.isLogin = true;
      initial();
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
      for (let j in appIdArr) {
        //j = appIdArr.length - 1
        //j = 5
        appId = appIdArr[j];
        shareCode = shareCodeArr[j];
        homeDataFunPrefix = homeDataFunPrefixArr[j] || 'healthyDay';
        collectScoreFunPrefix = collectScoreFunPrefixArr[j] || 'harmony';
        lotteryResultFunPrefix = lotteryResultFunPrefixArr[j] || 'interact_template';
        browseTime = 6;
        if (parseInt(j)) console.log(`\n开始第${parseInt(j) + 1}个抽奖活动`);
        await interact_template_getHomeData();
        //break
      }
      await msgShow();
      //break
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());
//获取昵称
function QueryJDUserInfo(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
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
              : require('./USER_AGENTS').USER_AGENT
            : $.getdata('JDUA')
            ? $.getdata('JDUA')
            : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        },
      };
      $.get(url, (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} API请求失败，请检查网路重试`);
          } else {
            if (data) {
              data = JSON.parse(data);
              if (data['retcode'] === 13) {
                merge.enabled = false;
                return;
              }
              if (data['retcode'] === 0) {
                merge.nickname = (data['base'] && data['base'].nickname) || $.UserName;
              } else {
                merge.nickname = $.UserName;
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
    }, timeout);
  });
}
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
          if (printDetail) console.log(data);
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
            if (data.data.result.taskVos[i].status === 3) {
              console.log('开始抽奖');
              await interact_template_getLotteryResult(data.data.result.taskVos[i].taskId);
              continue;
            }
            if ([0, 13, 12].includes(data.data.result.taskVos[i].taskType)) {
              if (data.data.result.taskVos[i].status === 1) {
                await harmony_collectScore(data.data.result.taskVos[i].simpleRecordInfoVo.taskToken, data.data.result.taskVos[i].taskId);
              }
              continue;
            }
            if ([14, 6].includes(data.data.result.taskVos[i].taskType)) {
              console.log(data.data.result.taskVos[i].assistTaskDetailVo.taskToken);
              //shareCodeArr.push(data.data.result.taskVos[i].assistTaskDetailVo.taskToken)
              if (cookiesArr.indexOf(cookie) === 0) {
                shareCodeArr[appIdArr.indexOf(appId)] = data.data.result.taskVos[i].assistTaskDetailVo.taskToken;
              }
              if (shareCode) await harmony_collectScore(shareCode, data.data.result.taskVos[i].taskId);
              for (let j = 0; j < (data.data.result.userInfo.lotteryNum || 0); j++) {
                if (appId === '1EFRTxQ') {
                  await ts_smashGoldenEggs();
                } else {
                  await interact_template_getLotteryResult(data.data.result.taskVos[i].taskId);
                }
              }
              continue;
            }
            let list =
              data.data.result.taskVos[i].productInfoVos || data.data.result.taskVos[i].followShopVo || data.data.result.taskVos[i].shoppingActivityVos || data.data.result.taskVos[i].browseShopVo;
            if (data.data.result.taskVos[i].subTitleName.match(/(\d+)(s)/)) {
              browseTime = parseInt(data.data.result.taskVos[i].subTitleName.match(/(\d+)(s)/)[0]);
            }
            for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
              for (let j in list) {
                if (list[j].status === 1) {
                  //console.log(list[j].simpleRecordInfoVo||list[j].assistTaskDetailVo)
                  console.log('\n' + (list[j].title || list[j].shopName || list[j].skuName));
                  //console.log(list[j].itemId)
                  if (list[j].itemId) {
                    await harmony_collectScore(list[j].taskToken, data.data.result.taskVos[i].taskId, list[j].itemId, 1);
                    if (k === data.data.result.taskVos[i].maxTimes - 1) await interact_template_getLotteryResult(data.data.result.taskVos[i].taskId);
                  } else {
                    await harmony_collectScore(list[j].taskToken, data.data.result.taskVos[i].taskId);
                  }
                  list[j].status = 2;
                  break;
                } else {
                  continue;
                }
              }
            }
          }
          if (scorePerLottery) await interact_template_getLotteryResult();
          //for (let j = 0;j <(data.data.result.userInfo.lotteryNum||0 && appId === "1EFRTxQ");j++) {
          //    await ts_smashGoldenEggs()
          //}
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
      //if (appId === "1EFRTxQ") url.body += "&appid=golden-egg"
      $.post(url, async (err, resp, data) => {
        try {
          if (printDetail) console.log(data);
          data = JSON.parse(data);
          console.log(data.data.bizMsg);
          if (data.data.bizMsg === '任务领取成功') {
            await harmony_collectScore(taskToken, taskId, itemId, 0, parseInt(browseTime) * 1000);
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
      //if (appId === "1EFRTxQ") url.body = `functionId=ts_getLottery&body={"appId":"${appId}"${taskId ? ',"taskId":"'+taskId+'"' : ''}}&client=wh5&clientVersion=1.0.0&appid=golden-egg`
      $.post(url, async (err, resp, data) => {
        try {
          if (printDetail) console.log(data);
          if (!timeout) console.log('\n开始抽奖');
          data = JSON.parse(data);
          if (data.data.bizCode === 0) {
            if (data.data.result.userAwardsCacheDto.jBeanAwardVo) {
              merge.jdBeans.success++;
              console.log('京豆:' + data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity);
              merge.jdBeans.prizeCount += parseInt(data.data.result.userAwardsCacheDto.jBeanAwardVo.quantity);
            }
            if (data.data.result.userAwardsCacheDto.redPacketVO) {
              merge.redPacket.show = true;
              merge.redPacket.success++;
              console.log('红包:' + data.data.result.userAwardsCacheDto.redPacketVO.value);
              merge.redPacket.prizeCount += parseFloat(data.data.result.userAwardsCacheDto.redPacketVO.value);
            }
            if (data.data.result.raiseInfo) scorePerLottery = parseInt(data.data.result.raiseInfo.nextLevelScore);
            if (parseInt(data.data.result.userScore) >= scorePerLottery && scorePerLottery) {
              await interact_template_getLotteryResult(1000);
            }
          } else {
            merge.jdBeans.fail++;
            console.log(data.data.bizMsg);
            if (data.data.bizCode === 111) data.data.bizMsg = '无机会';
            merge.jdBeans.notify = `${data.data.bizMsg}`;
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

function requireConfig() {
  return new Promise((resolve) => {
    //Node.js用户请在jdCookie.js处填写京东ck;
    const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
    //IOS等用户直接用NobyDa的jd cookie
    if ($.isNode()) {
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          cookiesArr.push(jdCookieNode[item]);
        }
      });
    } else {
      let cookiesData = $.getdata('CookiesJD') || '[]';
      cookiesData = jd_helpers.jsonParse(cookiesData);
      cookiesArr = cookiesData.map((item) => item.cookie);
      cookiesArr.reverse();
      cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
      cookiesArr.reverse();
      cookiesArr = cookiesArr.filter((item) => item !== '' && item !== null && item !== undefined);
    }
    console.log(`共${cookiesArr.length}个京东账号\n`);
    resolve();
  });
}

//初始化
function initial() {
  merge = {
    nickname: '',
    enabled: true,
    redPacket: { prizeDesc: '抽得|红包|元', number: true, fixed: 2 }, //定义 动作|奖励名称|奖励单位   是否是数字
    jdBeans: { prizeDesc: '抽得|京豆|个', number: true, fixed: 0 },
  };
  for (let i in merge) {
    merge[i].success = 0;
    merge[i].fail = 0;
    merge[i].prizeCount = 0;
    merge[i].notify = '';
    merge[i].show = true;
  }
  merge.redPacket.show = false;
}
//通知
function msgShow() {
  let message = ''; //https://h5.m.jd.com/babelDiy/Zeus/YgnrqBaEmVHWppzCgW8zjZj3VjV/index.html
  let url = {
    'open-url': `openapp.jdmobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fbean.m.jd.com%2FbeanDetail%2Findex.action%3FresourceValue%3Dbean%22%7D`,
  };
  let title = `京东账号：${merge.nickname}`;
  for (let i in merge) {
    if (typeof merge[i] !== 'object' || !merge[i].show) continue;
    if (merge[i].notify.split('').reverse()[0] === '\n') merge[i].notify = merge[i].notify.substr(0, merge[i].notify.length - 1);
    message +=
      `${merge[i].prizeDesc.split(STRSPLIT)[0]}${merge[i].prizeDesc.split(STRSPLIT)[1]}：` +
      (merge[i].success ? `${merge[i].prizeCount.toFixed(merge[i].fixed)}${merge[i].prizeDesc.split(STRSPLIT)[2]}\n` : `失败：${merge[i].notify}\n`);
  }
  //合计
  if (needSum) {
    $.sum = {};
    for (let i in merge) {
      if (typeof merge[i] !== 'object' || !merge[i].show) continue;
      if (typeof $.sum[merge[i].prizeDesc.split(STRSPLIT)[1]] === 'undefined') $.sum[merge[i].prizeDesc.split(STRSPLIT)[1]] = { count: 0 };
      $.sum[merge[i].prizeDesc.split(STRSPLIT)[1]].count += merge[i].prizeCount;
    }
    message += `合计：`;
    for (let i in $.sum) {
      message += `${$.sum[i].count.toFixed($.sum[i].fixed)}${i}，`;
    }
  }
  message += `请点击通知跳转至APP查看`;
  //message = message.substr(0,message.length - 1);
  $.msg($.name, title, message, url);
}

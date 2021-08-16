/*
点点券，可以兑换无门槛红包（1元，5元，10元，100元，部分红包需抢购）
Last Modified time: 2021-05-28 17:27:14
活动入口：京东APP-领券中心/券后9.9-领点点券 [活动地址](https://h5.m.jd.com/babelDiy/Zeus/41Lkp7DumXYCFmPYtU3LTcnTTXTX/index.html)
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
===============Quantumultx===============
[task_local]
#点点券
20 0,20 * * * jd_necklace.js, tag=点点券, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
 */
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("点点券二代目");
const ZooFaker = require("./utils/ZooFaker_Necklace.js").utils;
let allMessage = ``;
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const openUrl = `openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/41Lkp7DumXYCFmPYtU3LTcnTTXTX/index.html%22%20%7D`;

$.UA = ``;
$.UUID = ``;
$.joyytoken_count = 1;
getUA();
let message = '';
let nowTimes = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000);
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

const JD_API_HOST = 'https://api.m.jd.com/api';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  console.log(`\n通知：[非法请求] 可以等5分钟左右再次执行脚本\n`);
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      errorMsgLllegal = 0;
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      await jd_necklace();
      // break
    }
  }
  if ($.isNode() && allMessage) {
    await notify.sendNotify(`${$.name}`, `${allMessage}`, { url: openUrl });
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
async function jd_necklace() {
  try {
    await necklace_homePage();
    await $.wait(2000);
    await doTask();
    await $.wait(2000);
    await sign();
    await $.wait(2000);
    await necklace_homePage();
    await receiveBubbles();
    await necklace_homePage();
    // // await necklace_exchangeGift($.totalScore);//自动兑换多少钱的无门槛红包，1000代表1元，默认兑换全部点点券
    await showMsg();
    await $.wait(2000);
  } catch (e) {
    $.logErr(e);
  }
}
function showMsg() {
  return new Promise(async (resolve) => {
    $.msg(
      $.name,
      '',
      `京东账号${$.index} ${$.nickName || $.UserName}\n${(errorMsgLllegal > 0 && '当前有' + errorMsgLllegal + '个[非法请求]任务\n') || ''}当前${$.name}：${$.totalScore}个\n可兑换无门槛红包：${
        $.totalScore / 1000
      }元\n点击弹窗即可去兑换(注：此红包具有时效性)`,
      { 'open-url': openUrl }
    );
    // 云端大于10元无门槛红包时进行通知推送
    // if ($.isNode() && $.totalScore >= 20000 && nowTimes.getHours() >= 20) await notify.sendNotify(`${$.name} - 京东账号${$.index}`, `京东账号${$.index}\n当前${$.name}：${$.totalScore}个\n可兑换无门槛红包：${$.totalScore / 1000}元\n点击链接即可去兑换(注：此红包具有时效性)\n↓↓↓ \n\n ${openUrl} \n\n ↑↑↑`, { url: openUrl })
    if ($.isNode() && (nowTimes.getHours() >= 20 || errorMsgLllegal > 0) && (process.env.DDQ_NOTIFY_CONTROL ? process.env.DDQ_NOTIFY_CONTROL === 'false' : !!1)) {
      allMessage += `京东账号${$.index} ${$.nickName || $.UserName}\n${(errorMsgLllegal > 0 && '当前有' + errorMsgLllegal + '个[非法请求]任务\n') || ''}当前${$.name}：${
        $.totalScore
      }个\n可兑换无门槛红包：${$.totalScore / 1000}元\n(京东APP->领券->左上角点点券.注：此红包具有时效性)${
        $.index !== cookiesArr.length ? '\n\n' : `\n↓↓↓ \n\n "https://h5.m.jd.com/babelDiy/Zeus/41Lkp7DumXYCFmPYtU3LTcnTTXTX/index.html" \n\n ↑↑↑`
      }`;
    }
    resolve();
  });
}
async function doTask() {
  for (let item of $.taskConfigVos) {
    if (item.taskStage === 0) {
      console.log(`【${item.taskName}】 任务未领取,开始领取此任务`);
      let res = await necklace_startTask(item.id);
      if (res && res.rtn_code == 0) {
        console.log(`【${item.taskName}】 任务领取成功,开始完成此任务`);
        await $.wait(2000);
        await reportTask(item);
        await $.wait(2000);
      }
    } else if (item.taskStage === 2) {
      console.log(`【${item.taskName}】 任务已做完,奖励未领取`);
    } else if (item.taskStage === 3) {
      console.log(`${item.taskName}奖励已领取`);
    } else if (item.taskStage === 1) {
      console.log(`\n【${item.taskName}】 任务已领取但未完成,开始完成此任务`);
      await reportTask(item);
      await $.wait(2000);
    }
  }
}
async function receiveBubbles() {
  for (let item of $.bubbles) {
    console.log(`\n开始领取点点券`);
    await necklace_chargeScores(item.id);
    await $.wait(2000);
  }
}
async function sign() {
  if ($.signInfo && $.signInfo.todayCurrentSceneSignStatus === 1) {
    console.log(`\n开始每日签到`);
    await necklace_sign();
  } else if ($.signInfo) {
    console.log(`当前${new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).toLocaleString()}已签到`);
  }
}
async function reportTask(item = {}) {
  //普通任务
  if (item['taskType'] === 2) await necklace_startTask(item.id, 'necklace_reportTask');
  //逛很多商品店铺等等任务
  if (item['taskType'] === 6 || item['taskType'] === 8 || item['taskType'] === 5 || item['taskType'] === 9) {
    //浏览精选活动任务
    await necklace_getTask(item.id);
    $.taskItems = $.taskItems.filter((value) => !!value && value['status'] === 0);
    for (let vo of $.taskItems) {
      console.log(`浏览精选活动 【${vo['title']}】`);
      await necklace_startTask(item.id, 'necklace_reportTask', vo['id']);
    }
  }
  //首页浏览XX秒的任务
  // console.log(item)
  if (item['taskType'] === 3) await doAppTask('3', item.id);
  if (item['taskType'] === 4) await doAppTask('4', item.id);
}
//每日签到福利
function necklace_sign() {
  return new Promise(async (resolve) => {
    $.action = 'sign';
    const body = await ZooFaker.get_risk_result($);
    // const body = {
    //   currentDate: $.lastRequestTime.replace(/:/g, "%3A"),
    // }
    $.post(taskPostUrl('necklace_sign', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                console.log(`签到成功，时间：${new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).toLocaleString()}`);
                // $.taskConfigVos = data.data.result.taskConfigVos;
                // $.exchangeGiftConfigs = data.data.result.exchangeGiftConfigs;
              }
            } else if (data.rtn_code === 403 || data.rtn_msg.indexOf('非法请求') > -1) {
              console.log(`每日签到失败：${data.rtn_msg}\n`);
              errorMsgLllegal += 1;
              getUA();
            } else {
              console.log(`每日签到失败：${JSON.stringify(data)}\n`);
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
//兑换无门槛红包
function necklace_exchangeGift(scoreNums) {
  return new Promise((resolve) => {
    const body = {
      scoreNums,
      giftConfigId: 31,
      currentDate: $.lastRequestTime.replace(/:/g, '%3A'),
    };
    $.post(taskPostUrl('necklace_exchangeGift', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                const { result } = data.data;
                message += `${result.redpacketTitle}：${result.redpacketAmount}元兑换成功\n`;
                message += `红包有效期：${new Date(result.endTime + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).toLocaleString('zh', { hour12: false })}`;
                console.log(message);
              }
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
//领取奖励
function necklace_chargeScores(bubleId) {
  return new Promise(async (resolve) => {
    $.id = bubleId;
    $.action = 'chargeScores';
    const body = await ZooFaker.get_risk_result($);
    // const body = {
    //   bubleId,
    //   currentDate: $.lastRequestTime.replace(/:/g, "%3A"),
    // }
    $.post(taskPostUrl('necklace_chargeScores', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                // $.taskConfigVos = data.data.result.taskConfigVos;
                // $.exchangeGiftConfigs = data.data.result.exchangeGiftConfigs;
              }
            } else if (data.rtn_code === 403 || data.rtn_msg.indexOf('非法请求') > -1) {
              console.log(`领取奖励失败：${data.rtn_msg}\n`);
              errorMsgLllegal += 1;
              getUA();
            } else {
              console.log(`领取奖励失败：${JSON.stringify(data)}\n`);
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
function necklace_startTask(taskId, functionId = 'necklace_startTask', itemId = '') {
  return new Promise(async (resolve) => {
    let body = {
      taskId,
      currentDate: $.lastRequestTime.replace(/:/g, '%3A'),
    };
    if (functionId == 'necklace_startTask') {
      $.id = taskId;
      $.action = 'startTask';
      body = await ZooFaker.get_risk_result($);
    } else {
      if (itemId) body['itemId'] = itemId;
    }
    $.post(taskPostUrl(functionId, body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          console.log(`${functionId === 'necklace_startTask' ? '领取任务结果' : '做任务结果'}：${data}`);
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                // $.taskConfigVos = data.data.result.taskConfigVos;
                // $.exchangeGiftConfigs = data.data.result.exchangeGiftConfigs;
              }
            } else if (data.rtn_code === 403 || data.rtn_msg.indexOf('非法请求') > -1) {
              console.log(`${functionId === 'necklace_startTask' ? '领取任务失败' : '做任务结果'}：${data.rtn_msg}\n`);
              errorMsgLllegal += 1;
              getUA();
            } else {
              console.log(`${functionId === 'necklace_startTask' ? '领取任务失败' : '做任务结果'}：${JSON.stringify(data)}\n`);
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
function necklace_getTask(taskId) {
  return new Promise((resolve) => {
    const body = {
      taskId,
      currentDate: $.lastRequestTime.replace(/:/g, '%3A'),
    };
    $.taskItems = [];
    $.post(taskPostUrl('necklace_getTask', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                $.taskItems = data.data.result && data.data.result.taskItems;
              }
            } else if (data.rtn_code === 403 || data.rtn_msg.indexOf('非法请求') > -1) {
              console.log(`浏览精选活动失败：${data.rtn_msg}\n`);
              errorMsgLllegal += 1;
              getUA();
            } else {
              console.log(`浏览精选活动失败：${JSON.stringify(data)}\n`);
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

function necklace_homePage() {
  $.taskConfigVos = [];
  $.bubbles = [];
  $.signInfo = {};
  return new Promise((resolve) => {
    $.post(taskPostUrl('necklace_homePage'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.rtn_code === 0) {
              if (data.data.biz_code === 0) {
                $.taskConfigVos = data.data.result.taskConfigVos;
                $.exchangeGiftConfigs = data.data.result.exchangeGiftConfigs;
                $.lastRequestTime = data.data.result.lastRequestTime;
                $.bubbles = data.data.result.bubbles;
                $.signInfo = data.data.result.signInfo;
                $.totalScore = data.data.result.totalScore;
              }
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

async function doAppTask(type = '3', id) {
  console.log(id);
  let functionId = 'getCcTaskList';
  let body =
    'area=16_1315_3486_59648&body=%7B%22pageClickKey%22%3A%22CouponCenter%22%2C%22shshshfpb%22%3A%22dPH6zeJy%5C/HFogCIf0ZGFYqSDOShGwmpjVOPM%5C/ViCGC5fgBLL9JoI9mjgUt46vjSFeSkmU9DZLEjFaeFTWBj4Axg%3D%3D%22%2C%22eid%22%3A%22eidIeb54812323sf%2BAJEbj5LR0Kf6GUzM9DKXvgCReTpKTRyRwiuxY%5C/uvRHBqebAAKCAXkJFzhWtPj5uoHxNeK3DjTumb%2BrfXOt1w0%5C/dGmOJzfbLuyNo%22%2C%22childActivityUrl%22%3A%22openapp.jdmobile%253a%252f%252fvirtual%253fparams%253d%257b%255c%2522category%255c%2522%253a%255c%2522jump%255c%2522%252c%255c%2522des%255c%2522%253a%255c%2522couponCenter%255c%2522%257d%22%2C%22lat%22%3A%2224.49441271645999%22%2C%22globalLat%22%3A%2224.49335%22%2C%22lng%22%3A%22118.1447713674174%22%2C%22globalLng%22%3A%22118.1423%22%7D&build=167707&client=apple&clientVersion=10.0.4&d_brand=apple&d_model=iPhone12%2C1&eid=eidIeb54812323sf%2BAJEbj5LR0Kf6GUzM9DKXvgCReTpKTRyRwiuxY/uvRHBqebAAKCAXkJFzhWtPj5uoHxNeK3DjTumb%2BrfXOt1w0/dGmOJzfbLuyNo&isBackground=N&joycious=70&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=8a0d1837f803a12eb217fcf5e1f8769cbb3f898d&osVersion=14.3&partner=apple&rfs=0000&scope=11&screen=828%2A1792&sign=75afd018b5751e9ac4cba0b51b8adb3c&st=1624535152771&sv=101&uemps=0-0&uts=0f31TVRjBStsz%2BC9YKuTtbGZPv/xrvQQdSUKvavez1nEbzXO4dLo%2BXEvUHAXAd0VPmZqkUNAf2yO/fBM7ImhPYnyBrotzw06Kk7qP6mG42fhA1t5BkW3ZGLaQgPtiuosYOHPMyHpg%2BJ9ZQBP4g3zsSFq2DUWsTOZbb85I4ThMCgqvymyLl48ebUg7aQTle9CfTJVWu5gx0YZ/ScklgN9Pg%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=796606e8e181aa5865ec20728a27238b';
  await getCcTaskList(functionId, body, type);
  if (Number(id) == 229) {
    body = `area=16_1315_3486_59648&body=%7B%22shshshfpb%22%3A%22dPH6zeJy%5C/HFogCIf0ZGFYqSDOShGwmpjVOPM%5C/ViCGC5fgBLL9JoI9mjgUt46vjSFeSkmU9DZLEjFaeFTWBj4Axg%3D%3D%22%2C%22globalLng%22%3A%22118.1423%22%2C%22globalLat%22%3A%2224.49335%22%2C%22monitorSource%22%3A%22ccgroup_ios_index_task%22%2C%22monitorRefer%22%3A%22%22%2C%22taskType%22%3A%222%22%2C%22childActivityUrl%22%3A%22openapp.jdmobile%253a%252f%252fvirtual%253fparams%253d%257b%255c%2522category%255c%2522%253a%255c%2522jump%255c%2522%252c%255c%2522des%255c%2522%253a%255c%2522couponCenter%255c%2522%257d%22%2C%22pageClickKey%22%3A%22CouponCenter%22%2C%22lat%22%3A%2224.49441271645999%22%2C%22taskId%22%3A%22necklace_229%22%2C%22lng%22%3A%22118.1447713674174%22%2C%22eid%22%3A%22eidIeb54812323sf%2BAJEbj5LR0Kf6GUzM9DKXvgCReTpKTRyRwiuxY%5C/uvRHBqebAAKCAXkJFzhWtPj5uoHxNeK3DjTumb%2BrfXOt1w0%5C/dGmOJzfbLuyNo%22%7D&build=167707&client=apple&clientVersion=10.0.4&d_brand=apple&d_model=iPhone12%2C1&eid=eidIeb54812323sf%2BAJEbj5LR0Kf6GUzM9DKXvgCReTpKTRyRwiuxY/uvRHBqebAAKCAXkJFzhWtPj5uoHxNeK3DjTumb%2BrfXOt1w0/dGmOJzfbLuyNo&isBackground=N&joycious=70&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=8a0d1837f803a12eb217fcf5e1f8769cbb3f898d&osVersion=14.3&partner=apple&rfs=0000&scope=11&screen=828%2A1792&sign=57453a76ffe9440d7961b05405fb4f13&st=1624535165882&sv=110&uemps=0-0&uts=0f31TVRjBStsz%2BC9YKuTtbGZPv/xrvQQdSUKvavez1nEbzXO4dLo%2BXEvUHAXAd0VPmZqkUNAf2yO/fBM7ImhPYnyBrotzw06Kk7qP6mG42fhA1t5BkW3ZGLaQgPtiuosYOHPMyHpg%2BJ9ZQBP4g3zsSFq2DUWsTOZbb85I4ThMCgqvymyLl48ebUg7aQTle9CfTJVWu5gx0YZ/ScklgN9Pg%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=796606e8e181aa5865ec20728a27238b`;
  } else if (Number(id) == 260) {
    body = `area=16_1315_3486_59648&body=%7B%22shshshfpb%22%3A%22hRRVbEkLST%2BoqUB6fhir%2BfMoJS814u0eqASGoy8xq0vV1m9X9zKoAVYtaZjcO4UsQaWNyUrMVkZK5HBZ5aJo5zQ%3D%3D%22%2C%22globalLng%22%3A%22118.1423%22%2C%22globalLat%22%3A%2224.49335%22%2C%22monitorSource%22%3A%22ccgroup_ios_index_task%22%2C%22monitorRefer%22%3A%22%22%2C%22taskType%22%3A%222%22%2C%22childActivityUrl%22%3A%22openapp.jdmobile%253a%252f%252fvirtual%253fparams%253d%257b%255c%2522category%255c%2522%253a%255c%2522jump%255c%2522%252c%255c%2522des%255c%2522%253a%255c%2522couponCenter%255c%2522%257d%22%2C%22pageClickKey%22%3A%22CouponCenter%22%2C%22lat%22%3A%2224.49435886957707%22%2C%22taskId%22%3A%22necklace_260%22%2C%22lng%22%3A%22118.144791637343%22%2C%22eid%22%3A%22eidI0faa812328s1AvGqBpW%2BSouJeXiZIORi9gLxq36FvXhk6SQPmtUFPglIaTIxGXnVzVAwHm%5C/QEwj14SR2vxSgH5tw4rWGdLJtHzSh8bloRLoX8mFY%22%7D&build=167568&client=apple&clientVersion=9.4.2&d_brand=apple&d_model=iPhone12%2C1&eid=eidI0faa812328s1AvGqBpW%2BSouJeXiZIORi9gLxq36FvXhk6SQPmtUFPglIaTIxGXnVzVAwHm/QEwj14SR2vxSgH5tw4rWGdLJtHzSh8bloRLoX8mFY&isBackground=N&joycious=51&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=ebf4ce8ecbb641054b00c00483b1cee85660d196&osVersion=14.3&partner=apple&rfs=0000&scope=11&screen=828%2A1792&sign=93249982ced7ec850c69de8b3e859dab&st=1624610691429&sv=110&uts=0f31TVRjBSsqndu4/jgUPz6uymy50MQJSTfJm3Nbyn7GqB7OtrJRuHoZMYV%2Bs0mkEZsSwjxzwlDPXLeepml5BnM5XPZQmPVomYBHlkSfLJWR5D1y0Ovgf60fpjMS2gXL5aLh50cNO3cmx2GvVTaTeYxvRUl%2BpaW7HXsuBhxJgA6pUzd01tBX9yiFih8xvToesg91Nl8KcWGYzXJ2/hWKXg%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=796606e8e181aa5865ec20728a27238b`;
  } else if (Number(id) == 267) {
    body = `area=16_1315_3486_59648&body=%7B%22shshshfpb%22%3A%22dPH6zeJy%5C/HFogCIf0ZGFYqSDOShGwmpjVOPM%5C/ViCGC5fgBLL9JoI9mjgUt46vjSFeSkmU9DZLEjFaeFTWBj4Axg%3D%3D%22%2C%22globalLng%22%3A%22118.1423%22%2C%22globalLat%22%3A%2224.49335%22%2C%22monitorSource%22%3A%22ccgroup_ios_index_task%22%2C%22monitorRefer%22%3A%22%22%2C%22taskType%22%3A%222%22%2C%22childActivityUrl%22%3A%22openapp.jdmobile%253a%252f%252fvirtual%253fparams%253d%257b%255c%2522category%255c%2522%253a%255c%2522jump%255c%2522%252c%255c%2522des%255c%2522%253a%255c%2522couponCenter%255c%2522%257d%22%2C%22pageClickKey%22%3A%22CouponCenter%22%2C%22lat%22%3A%2224.49437467152672%22%2C%22taskId%22%3A%22necklace_267%22%2C%22lng%22%3A%22118.1447981202065%22%2C%22eid%22%3A%22eidIeb54812323sf%2BAJEbj5LR0Kf6GUzM9DKXvgCReTpKTRyRwiuxY%5C/uvRHBqebAAKCAXkJFzhWtPj5uoHxNeK3DjTumb%2BrfXOt1w0%5C/dGmOJzfbLuyNo%22%7D&build=167707&client=apple&clientVersion=10.0.4&d_brand=apple&d_model=iPhone12%2C1&eid=eidIeb54812323sf%2BAJEbj5LR0Kf6GUzM9DKXvgCReTpKTRyRwiuxY/uvRHBqebAAKCAXkJFzhWtPj5uoHxNeK3DjTumb%2BrfXOt1w0/dGmOJzfbLuyNo&isBackground=N&joycious=70&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=8a0d1837f803a12eb217fcf5e1f8769cbb3f898d&osVersion=14.3&partner=apple&rfs=0000&scope=11&screen=828%2A1792&sign=64e2361aa2a81068930c0c3325fd45ef&st=1624950832218&sv=111&uemps=0-0&uts=0f31TVRjBSsMGLCxYS3UIqlZl8dbXmnuZ4ayfhN43Ot1QaV41onc66czNm7agt5ZxuI/ZiEjTyLMd9C68bu6j250BhqFBz9aHYMZHRsZRt99av4Tsia77GOWxlDaSYf5ixm0pZhBRR4OQ%2BUBD6%2BPW4wCMOS5CO3/VI2cFHPfi%2BdGNinbfncIha86vGUGuGKiHSAf4rUFY4wrafX6Rksw7g%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=796606e8e181aa5865ec20728a27238b`;
  } else if (Number(id) == 273) {
    body = `area=16_1315_3486_59648&body=%7B%22shshshfpb%22%3A%22dPH6zeJy%5C/HFogCIf0ZGFYqSDOShGwmpjVOPM%5C/ViCGC5fgBLL9JoI9mjgUt46vjSFeSkmU9DZLEjFaeFTWBj4Axg%3D%3D%22%2C%22globalLng%22%3A%22118.1423%22%2C%22globalLat%22%3A%2224.49335%22%2C%22monitorSource%22%3A%22ccgroup_ios_index_task%22%2C%22monitorRefer%22%3A%22%22%2C%22taskType%22%3A%222%22%2C%22childActivityUrl%22%3A%22openapp.jdmobile%253a%252f%252fvirtual%253fparams%253d%257b%255c%2522category%255c%2522%253a%255c%2522jump%255c%2522%252c%255c%2522des%255c%2522%253a%255c%2522couponCenter%255c%2522%257d%22%2C%22pageClickKey%22%3A%22CouponCenter%22%2C%22lat%22%3A%2224.494383110087%22%2C%22taskId%22%3A%22necklace_273%22%2C%22lng%22%3A%22118.1447767134287%22%2C%22eid%22%3A%22eidIeb54812323sf%2BAJEbj5LR0Kf6GUzM9DKXvgCReTpKTRyRwiuxY%5C/uvRHBqebAAKCAXkJFzhWtPj5uoHxNeK3DjTumb%2BrfXOt1w0%5C/dGmOJzfbLuyNo%22%7D&build=167741&client=apple&clientVersion=10.0.8&d_brand=apple&d_model=iPhone12%2C1&eid=eidIeb54812323sf%2BAJEbj5LR0Kf6GUzM9DKXvgCReTpKTRyRwiuxY/uvRHBqebAAKCAXkJFzhWtPj5uoHxNeK3DjTumb%2BrfXOt1w0/dGmOJzfbLuyNo&isBackground=N&joycious=71&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=8a0d1837f803a12eb217fcf5e1f8769cbb3f898d&osVersion=14.3&partner=apple&rfs=0000&scope=11&screen=828%2A1792&sign=c5f1773c699259a32596629ff17c77af&st=1627034890276&sv=101&uemps=0-0&uts=0f31TVRjBSuc9dw/M%2Bj%2BYjMPuoLDUbUPjPag%2BZ5OSbdXPyIGbVBxfPOWG8Z24KZdpryfyfoAUE5oYfYi1SuqGZ5atF1ARqzdFrPeo%2BZQVMmuwn/nYDGsLdj0Q9HcidhJXAaY1ti0j023Mv4f/ls51fJl5ypecBgw2sWtd8KiGQncYOe9GxCz6tlkHuSHDk3zN6hF%2BN0deRJOqJP8OOrJog%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=796606e8e181aa5865ec20728a27238b`;
  } else if (Number(id) == 281) {
    body = `area=16_1332_42932_43102&body=%7B%22shshshfpb%22%3A%22hRRVbEkLST%2BoqUB6fhir%2BfMoJS814u0eqASGoy8xq0vV1m9X9zKoAVYtaZjcO4UsQaWNyUrMVkZK5HBZ5aJo5zQ%3D%3D%22%2C%22globalLng%22%3A%22118.541458%22%2C%22globalLat%22%3A%2224.609455%22%2C%22monitorSource%22%3A%22ccgroup_ios_index_task%22%2C%22monitorRefer%22%3A%22%22%2C%22taskType%22%3A%222%22%2C%22childActivityUrl%22%3A%22openapp.jdmobile%253a%252f%252fvirtual%253fparams%253d%257b%255c%2522category%255c%2522%253a%255c%2522jump%255c%2522%252c%255c%2522des%255c%2522%253a%255c%2522couponCenter%255c%2522%257d%22%2C%22pageClickKey%22%3A%22CouponCenter%22%2C%22lat%22%3A%2224.49440185204448%22%2C%22taskId%22%3A%22necklace_281%22%2C%22lng%22%3A%22118.1448096802756%22%2C%22eid%22%3A%22eidI0faa812328s1AvGqBpW%2BSouJeXiZIORi9gLxq36FvXhk6SQPmtUFPglIaTIxGXnVzVAwHm%5C/QEwj14SR2vxSgH5tw4rWGdLJtHzSh8bloRLoX8mFY%22%7D&build=167741&client=apple&clientVersion=10.0.8&d_brand=apple&d_model=iPhone12%2C1&eid=eidI0faa812328s1AvGqBpW%2BSouJeXiZIORi9gLxq36FvXhk6SQPmtUFPglIaTIxGXnVzVAwHm/QEwj14SR2vxSgH5tw4rWGdLJtHzSh8bloRLoX8mFY&isBackground=N&joycious=51&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=ebf4ce8ecbb641054b00c00483b1cee85660d196&osVersion=14.3&partner=apple&rfs=0000&scope=11&screen=828%2A1792&sign=6bf1da7e3c218998ae5bd34a5b9b0d5c&st=1627088377408&sv=122&uemps=0-1&uts=0f31TVRjBSsqndu4/jgUPz6uymy50MQJPuQXd3Iw2YAKsnsGHXGtpI6DTtbcnaz7p7QeCmsoL2Cl/BMWopi0bEL/HBdhfK3iH/oMP6POfCzGYqGUp9HjUx/7lG%2BGpzuUJ%2B7ZrAQF4UMuG2/9epLOLCkpw4w6EgF4FqamAtXxTBCJZ82M%2Bkm26wJx996BKm7JCzdQfT6pJ0aFbovPOlp71A%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D&wifiBssid=796606e8e181aa5865ec20728a27238b`;
  }
  if (type === '4') {
    // https://h5.m.jd.com/babelDiy/Zeus/2fDwtAwAQX1PJh51f3UXzLhKiD86/index.html
    console.log('需等待30秒');
    functionId = 'reportSinkTask';
    body = `&appid=XPMSGC2019&monitorSource=&uuid=16245525345801334814959&body=%7B%22platformType%22%3A%221%22%2C%22taskId%22%3A%22necklace_${id}%22%7D&client=m&clientVersion=4.6.0&area=16_1315_1316_59175&geo=%5Bobject%20Object%5D`;
    await $.wait(15000);
  } else {
    // https://h5.m.jd.com/babelDiy/Zeus/3TcqzbLKXwyiGDzrn5nKV7sSEC8N/index.html
    console.log('需等待15秒');
    functionId = 'reportCcTask';
  }
  await $.wait(1600);
  await getCcTaskList(functionId, body, type);
}
function getCcTaskList(functionId, body, type = '3') {
  let url = `https://api.m.jd.com/client.action?functionId=${functionId}`;
  return new Promise((resolve) => {
    if (functionId === 'getCcTaskList') {
    }
    if (functionId === 'reportCcTask') {
    }
    if (functionId === 'reportSinkTask') {
      url += body;
      body = '';
    }
    // if (type === '4' && functionId === 'reportCcTask'){
    // url = `https://api.m.jd.com/client.action?functionId=${functionId}&body=${escape(JSON.stringify(body))}&uuid=8888888&client=apple&clientVersion=9.4.1&st=1622193986049&sign=f5abd9fd7b9b8abaa25b34088f9e8a54&sv=102`
    // body = `body=${escape(JSON.stringify(body))}`
    // }
    const options = {
      url,
      body,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        'Content-Length': '63',
        'Content-Type': 'application/x-www-form-urlencoded',
        Host: 'api.m.jd.com',
        Origin: 'https://h5.m.jd.com',
        Cookie: cookie + `joyytoken=${'50082' + $.joyytoken};`,
        Referer: 'https://h5.m.jd.com/babelDiy/Zeus/4ZK4ZpvoSreRB92RRo8bpJAQNoTq/index.html',
        'User-Agent': $.UA,
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            if (type === '3' && functionId === 'reportCcTask') console.log(`点击首页领券图标(进入领券中心浏览15s)任务:${data}`);
            if (type === '4' && functionId === 'reportSinkTask') console.log(`点击“券后9.9”任务:${data}`);
            // data = JSON.parse(data);
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
function taskPostUrl(function_id, body = {}) {
  const time = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&appid=coupon-necklace&loginType=2&client=coupon-necklace&t=${Date.now()}`,
    body: `body=${escape(JSON.stringify(body))}`,
    headers: {
      Host: 'api.m.jd.com',
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://h5.m.jd.com',
      'accept-language': 'zh-cn',
      'User-Agent': $.UA,
      referer: 'https://h5.m.jd.com/',
      cookie: cookie + `joyytoken=${'50082' + $.joyytoken};`,
    },
  };
}

function getUA() {
  $.UA = `jdapp;iPhone;10.0.10;14.3;${randomString(
    40
  )};network/wifi;model/iPhone12,1;addressid/4199175193;appBuild/167741;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;
  $.UUID = ($.UA.split(';') && $.UA.split(';')[4]) || '';
  $.joyytoken = '';
}
function randomString(e) {
  e = e || 32;
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

/*
京东全民开红包
Last Modified time: 2021-05-19 16:27:18
活动入口：京东APP首页-领券-锦鲤红包。[活动地址](https://happy.m.jd.com/babelDiy/zjyw/3ugedFa7yA6NhxLN5gw2L3PF9sQC/index.html)
未实现功能：领3张券功能
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
================QuantumultX==================
[task_local]
#京东全民开红包
1 1,2,23 * * * https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_redPacket.js, tag=京东全民开红包, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_redPacket.png, enabled=true
===================Loon==============
[Script]
cron "1 1,2,23 * * *" script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_redPacket.js, tag=京东全民开红包
===============Surge===============
[Script]
京东全民开红包 = type=cron,cronexp="1 1,2,23 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_redPacket.js
====================================小火箭=============================
京东全民开红包 = type=cron,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_redPacket.js, cronexpr="1 1,2,23 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东全民开红包');
const md5 = require('crypto-js/md5');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
$.redPacketId = ['381067298'];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
  if (JSON.stringify(process.env).indexOf('GITHUB') > -1) process.exit(0);
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/api';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  let res = await getAuthorShareCode('');
  if (!res) {
    //$.http.get({url: ''}).then((resp) => {}).catch((e) => $.log('刷新CDN异常', e));
    await $.wait(1000);
    res = await getAuthorShareCode('');
  }
  $.authorMyShareIds = [...(res || [])];
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      await $.totalBean();
      console.log(`\n****开始【京东账号${$.index}】${$.nickName || $.UserName}****\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      $.discount = 0;
      await redPacket();
      await showMsg();
    }
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    $.index = i + 1;
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.canHelp = true;
    $.redPacketId = [...new Set($.redPacketId)];
    if (cookiesArr && cookiesArr.length >= 2) {
      console.log(`\n\n自己账号内部互助`);
      for (let j = 0; j < $.redPacketId.length && $.canHelp; j++) {
        console.log(`账号 ${$.index} ${$.UserName} 开始给 ${$.redPacketId[j]} 进行助力`);
        $.max = false;
        await jinli_h5assist($.redPacketId[j]);
        await $.wait(2000);
        if ($.max) {
          $.redPacketId.splice(j, 1);
          j--;
          continue;
        }
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

async function redPacket() {
  try {
    await doLuckDrawFun(); //券后9.9抽奖
    await taskHomePage(); //查询任务列表
    await doTask(); //领取任务，做任务，领取红包奖励
    await h5activityIndex(); //查询红包基础信息
    await red(); //红包任务(发起助力红包,领取助力红包等)
    await h5activityIndex();
  } catch (e) {
    $.logErr(e);
  }
}
function showMsg() {
  console.log(`\n\n${$.name}获得红包：${$.discount}元\n\n`);
  // $.msg($.name, '', `${$.name}：${$.discount}元`)
}
async function doLuckDrawFun() {
  for (let i = 0; i < 3; i++) {
    await doLuckDrawEntrance();
  }
}
function doLuckDrawEntrance() {
  return new Promise((resolve) => {
    const options = {
      url: 'https://api.m.jd.com/client.action?functionId=doLuckDrawEntrance&body=%7B%22platformType%22%3A%221%22%7D&appid=XPMSGC2019&client=m&clientVersion=1.0.0&area=19_1601_50258_62858&geo=%5Bobject%20Object%5D&uuid=88732f840b77821b345bf07fd71f609e6ff12f43',
      headers: {
        Host: 'api.m.jd.com',
        Origin: 'https://h5.m.jd.com',
        Cookie: cookie,
        'Content-Length': '0',
        Connection: 'keep-alive',
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'jdapp;iPhone;9.5.4;14.3;88732f840b77821b345bf07fd71f609e6ff12f43;network/4g;model/iPhone11,8;addressid/2005183373;appBuild/167668;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        Referer: 'https://h5.m.jd.com/babelDiy/Zeus/yj8mbcm6roENn7qhNdhiekyeqtd/index.html',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data.code === '0' && data.busiCode === '0') {
              if (data.result.luckyDrawData.actId) {
                if (data.result.luckyDrawData.redPacketId) {
                  console.log(`券后9.9抽奖获得【红包】：${data.result.luckyDrawData.quota}元`);
                } else {
                  console.log(`券后9.9抽奖获得【优惠券】：${data.result.luckyDrawData.discount}元：${data.result.luckyDrawData.prizeName}，${data.result.luckyDrawData.quotaDesc}`);
                }
              } else {
                console.log(`券后9.9抽奖获失败：今日3次抽奖机会已用完\n`);
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
async function doTask() {
  if ($.taskHomePageData && $.taskHomePageData.code === 0) {
    $.taskInfo = $.taskHomePageData.data.result.taskInfos;
    if ($.taskInfo && $.taskInfo.length > 0) {
      console.log(`    任务     状态  红包是否领取`);
      for (let item of $.taskInfo) {
        console.log(`${item.title.slice(-6)}   ${item.alreadyReceivedCount ? item.alreadyReceivedCount : 0}/${item.requireCount}      ${item.innerStatus === 4 ? '是' : '否'}`);
      }
      for (let item of $.taskInfo) {
        //innerStatus=4已领取红包，3：任务已完成，红包未领取，2：任务已领取，但未完成，7,未领取任务
        if (item.innerStatus === 4) {
          console.log(`[${item.title}] 已经领取奖励`);
        } else if (item.innerStatus === 3) {
          await receiveTaskRedpacket(item.taskType);
        } else if (item.innerStatus === 2) {
          if (item.taskType !== 0 && item.taskType !== 1) {
            console.log(`开始做【${item.title}】任务`);
            await active(item.taskType);
            console.log(`开始领取【${item.title}】任务所得红包奖励`);
            await receiveTaskRedpacket(item.taskType);
          } else if (item.taskType === 1) {
            //浏览10秒任务
            console.log(`开始做【${item.title}】任务`);
            await doAppTask();
          } else {
            //TODO 领3张优惠券
            console.log(`[${item.title}] 功能未开发`);
          }
        } else if (item.innerStatus !== 4) {
          console.log(`\n开始领取【${item.title}】任务`);
          await startTask(item.taskType);
          if (item.taskType !== 0 && item.taskType !== 1) {
            console.log(`开始做【${item.title}】任务`);
            await active(item.taskType);
            console.log(`开始领取【${item.title}】任务所得红包奖励`);
            await receiveTaskRedpacket(item.taskType);
          } else if (item.taskType === 1) {
            //浏览10秒任务
            console.log(`开始做【${item.title}】任务`);
            await doAppTask();
          } else {
            //TODO 领3张优惠券
            console.log(`[${item.title}] 功能未开发`);
          }
        }
      }
    }
  } else {
    console.log(`\n获取任务列表异常：${JSON.stringify($.taskHomePageData)}\n`);
  }
}
async function red() {
  $.hasSendNumber = 0;
  $.assistants = 0;
  $.waitOpenTimes = 0;
  if ($.h5activityIndex && $.h5activityIndex.data && $.h5activityIndex.data.result) {
    const rewards = $.h5activityIndex.data.result.rewards || [];
    $.hasSendNumber = $.h5activityIndex.data.result.hasSendNumber;
    if ($.h5activityIndex.data.result.redpacketConfigFillRewardInfo) {
      for (let key of Object.keys($.h5activityIndex.data.result.redpacketConfigFillRewardInfo)) {
        let vo = $.h5activityIndex.data.result.redpacketConfigFillRewardInfo[key];
        $.assistants += vo.hasAssistNum;
        if (vo.packetStatus === 1) {
          $.waitOpenTimes += 1;
        }
      }
    }
  }
  if ($.h5activityIndex && $.h5activityIndex.data && $.h5activityIndex.data.biz_code === 10002) {
    //可发起拆红包活动
    await h5launch();
  } else if ($.h5activityIndex && $.h5activityIndex.data && $.h5activityIndex.data.biz_code === 20001) {
    //20001:红包活动正在进行，可拆
    const redPacketId = $.h5activityIndex.data.result.redpacketInfo.id;
    if (redPacketId) $.redPacketId.push(redPacketId);
    console.log(
      `\n\n当前待拆红包ID:${$.h5activityIndex.data.result.redpacketInfo.id}，进度：再邀${
        $.h5activityIndex.data.result.redpacketConfigFillRewardInfo[$.hasSendNumber].requireAssistNum - $.h5activityIndex.data.result.redpacketConfigFillRewardInfo[$.hasSendNumber].hasAssistNum
      }个好友，开第${$.hasSendNumber + 1}个红包。当前已拆红包：${$.hasSendNumber}个，剩余${$.h5activityIndex.data.result.remainRedpacketNumber}个红包待开，已有${$.assistants}好友助力\n\n`
    );
    console.log(`当前可拆红包个数：${$.waitOpenTimes}`);
    if ($.waitOpenTimes > 0) {
      for (let i = 0; i < $.waitOpenTimes; i++) {
        await h5receiveRedpacketAll();
        await $.wait(500);
      }
    }
  } else if ($.h5activityIndex && $.h5activityIndex.data && $.h5activityIndex.data.biz_code === 20002) {
    console.log(`\n${$.h5activityIndex.data.biz_msg}\n`);
  }
}
//获取任务列表API
function taskHomePage() {
  return new Promise((resolve) => {
    $.post(taskUrl(arguments.callee.name.toString(), { clientInfo: {} }), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          $.taskHomePageData = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
//领取任务API,需token
function startTask(taskType) {
  // 从taskHomePage返回的数据里面拿taskType
  let data = { taskType };
  data['token'] = md5(md5('j' + JSON.stringify(data) + 'D'));
  return new Promise((resolve) => {
    $.post(taskUrl(arguments.callee.name.toString(), data), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          console.log(`领取任务：${data}`);
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

//做任务fun
async function active(taskType) {
  const getTaskDetailForColorRes = await getTaskDetailForColor(taskType);
  if (getTaskDetailForColorRes && getTaskDetailForColorRes.code === 0) {
    if (getTaskDetailForColorRes.data && getTaskDetailForColorRes.data.result) {
      const { advertDetails } = getTaskDetailForColorRes.data.result;
      for (let item of advertDetails) {
        await $.wait(1000);
        if (item.id && item.status === 0) {
          await taskReportForColor(taskType, item.id);
        }
      }
    } else {
      console.log(`任务列表为空,手动进入app内检查 是否存在[从京豆首页进领券中心逛30秒]的任务,如存在,请手动完成再运行脚本`);
      $.msg(`${$.name}`, '', '手动进入app内检查\n是否存在[从京豆首页进领券中心逛30秒]的任务\n如存在,请手动完成再运行脚本');
      if ($.isNode())
        await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `执行脚本出现异常\n请手动进入app内检查\n是否存在[从京豆首页进领券中心逛30秒]的任务\n如存在,请手动完成再运行脚本`);
    }
  } else {
    console.log(`---具体任务详情---${JSON.stringify(getTaskDetailForColorRes)}`);
  }
}

//获取具体任务详情API
function getTaskDetailForColor(taskType) {
  const data = { clientInfo: {}, taskType };
  return new Promise((resolve) => {
    $.post(taskUrl(arguments.callee.name.toString(), data), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          // console.log('getTaskDetailForColor', data);
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
//做成任务API
function taskReportForColor(taskType, detailId) {
  const data = { taskType, detailId };
  data['token'] = md5(md5('j' + JSON.stringify(data) + 'D'));
  //console.log(`活动id：：：${detailId}\n`)
  return new Promise((resolve) => {
    $.post(taskUrl(arguments.callee.name.toString(), data), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          // console.log(`taskReportForColor`, data);
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
//领取做完任务后的红包
function receiveTaskRedpacket(taskType) {
  const body = { clientInfo: {}, taskType };
  return new Promise((resolve) => {
    $.post(taskUrl('h5receiveRedpacketAll', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);;
          if (data.code == 0 && data?.data?.success && data?.data?.biz_code === 0) {
            console.log(`红包领取成功，获得${data.data.result.discount}元\n`);
            $.discount += Number(data.data.result.discount);
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
//助力API
function jinli_h5assist(redPacketId) {
  //一个人一天只能助力两次，助力码redPacketId 每天都变
  const body = { clientInfo: {}, redPacketId, followShop: 0, promUserState: '' };
  const options = taskUrl(arguments.callee.name.toString(), body);
  return new Promise((resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
          if (data && data.data && data.data.biz_code === 0) {
            // status ,0:助力成功，1:不能重复助力，3:助力次数耗尽，8:不能为自己助力
            console.log(`助力结果：${data.data.result.statusDesc}`);
            if (data.data.result.status === 2) $.max = true;
            if (data.data.result.status === 3) $.canHelp = false;
            if (data.data.result.status === 9) $.canHelp = false;
          } else {
            console.log(`助力异常：${JSON.stringify(data)}`);
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
//领取红包API
function h5receiveRedpacketAll() {
  const options = taskUrl(arguments.callee.name.toString(), { clientInfo: {} });
  return new Promise((resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
          if (data && data.data && data.data.biz_code === 0) {
            console.log(`拆红包获得：${data.data.result.discount}元`);
          } else {
            console.log(`领红包失败：${JSON.stringify(data)}`);
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
//发起助力红包API
function h5launch() {
  const body = { clientInfo: {}, followShop: 0, promUserState: '' };
  const options = taskUrl(arguments.callee.name.toString(), body);
  return new Promise((resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
          if (data && data.data && data.data.biz_code === 0) {
            if (data.data.result.redPacketId) {
              console.log(`\n\n发起助力红包 成功：红包ID ${data.data.result.redPacketId}`);
              $.redPacketId.push(data.data.result.redPacketId);
            } else {
              console.log(`\n\n发起助力红包 失败：${data.data.result.statusDesc}`);
            }
          } else {
            console.log(`发起助力红包 失败：${JSON.stringify(data)}`);
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
function h5activityIndex() {
  const body = { clientInfo: {}, isjdapp: 1 };
  const options = taskUrl(arguments.callee.name.toString(), body);
  return new Promise((resolve) => {
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`);
          console.log(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
          $.h5activityIndex = data;
          $.discount = 0;
          if ($.h5activityIndex && $.h5activityIndex.data && $.h5activityIndex.data.result) {
            const rewards = $.h5activityIndex.data.result.rewards || [];
            for (let item of rewards) {
              $.discount += item.packetSum;
            }
            if ($.discount) $.discount = $.discount.toFixed(2);
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
async function doAppTask(type = '1') {
  let body = {
    pageClickKey: 'CouponCenter',
    childActivityUrl: 'openapp.jdmobile%3a%2f%2fvirtual%3fparams%3d%7b%5c%22category%5c%22%3a%5c%22jump%5c%22%2c%5c%22des%5c%22%3a%5c%22couponCenter%5c%22%7d',
    lat: '',
    globalLat: '',
    lng: '',
    globalLng: '',
  };
  await getCcTaskList('getCcTaskList', body, type);
  body = {
    globalLng: '',
    globalLat: '',
    monitorSource: 'ccgroup_ios_index_task',
    monitorRefer: '',
    taskType: '1',
    childActivityUrl: 'openapp.jdmobile%3a%2f%2fvirtual%3fparams%3d%7b%5c%22category%5c%22%3a%5c%22jump%5c%22%2c%5c%22des%5c%22%3a%5c%22couponCenter%5c%22%7d',
    pageClickKey: 'CouponCenter',
    lat: '',
    taskId: '727',
    lng: '',
  };
  await $.wait(10500);
  await getCcTaskList('reportCcTask', body, type);
}
function getCcTaskList(functionId, body, type = '1') {
  let url = '';
  return new Promise((resolve) => {
    if (functionId === 'getCcTaskList') {
      url = `https://api.m.jd.com/client.action?functionId=${functionId}&body=${escape(
        JSON.stringify(body)
      )}&uuid=8888888&client=apple&clientVersion=9.4.1&st=1617158358007&sign=a15f78e5846f9b0178dcabb1093a6a7f&sv=100`;
    } else if (functionId === 'reportCcTask') {
      url = `https://api.m.jd.com/client.action?functionId=${functionId}&body=${escape(
        JSON.stringify(body)
      )}&uuid=8888888&client=apple&clientVersion=9.4.1&st=1617158435079&sign=7eff07437dd817dbfa348c209fd5c129&sv=120`;
    }
    const options = {
      url,
      body: `body=${escape(JSON.stringify(body))}`,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        'Content-Length': '63',
        'Content-Type': 'application/x-www-form-urlencoded',
        Host: 'api.m.jd.com',
        Origin: 'https://h5.m.jd.com',
        Cookie: cookie,
        Referer: 'https://h5.m.jd.com/babelDiy/Zeus/4ZK4ZpvoSreRB92RRo8bpJAQNoTq/index.html',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            // data = JSON.parse(data);
            if (type === '1' && functionId === 'reportCcTask') console.log(`京东首页点击“领券”逛10s任务:${data}`);
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
function getAuthorShareCode(url) {
  return new Promise((resolve) => {
    const options = {
      url: `${url}?${new Date()}`,
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
        resolve(data);
      }
    });
  });
}

function taskUrl(functionId, body = {}) {
  return {
    url: `${JD_API_HOST}?appid=jinlihongbao&functionId=${functionId}&loginType=2&client=jinlihongbao&clientVersion=10.1.0&osVersion=iOS&d_brand=iPhone&d_model=iPhone&t=${new Date().getTime() * 1000}`,
    body: `body=${escape(JSON.stringify(body))}`,
    headers: {
      Host: 'api.m.jd.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://happy.m.jd.com',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
      Connection: 'keep-alive',
      Accept: '*/*',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://happy.m.jd.com/babelDiy/zjyw/3ugedFa7yA6NhxLN5gw2L3PF9sQC/index.html',
      'Content-Length': '56',
      'Accept-Language': 'zh-cn',
    },
  };
}

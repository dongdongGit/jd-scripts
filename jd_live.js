/*
京东直播
活动结束时间未知
活动入口：京东APP首页-京东直播
地址：https://h5.m.jd.com/babelDiy/Zeus/2zwQnu4WHRNfqMSdv69UPgpZMnE2/index.html/
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东直播
10-20/5 12 * * * https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_live.js, tag=京东直播, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon==============
[Script]
cron "10-20/5 12 * * *" script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_live.js,tag=京东直播
===============Surge=================
京东直播 = type=cron,cronexp="10-20/5 12 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_scripts/jd_live.js
============小火箭=========
京东直播 = type=cron,script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_live.js, cronexpr="10-20/5 12 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东直播');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
let uuid;
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
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
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
      uuid = randomString(40);
      await jdHealth();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
async function jdHealth() {
  $.bean = 0;
  await getTaskList();
  await sign();
  message += `领奖完成，共计获得 ${$.bean} 京豆\n`;
  await showMsg();
}

function getTs() {
  return new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
}
function showMsg() {
  return new Promise((resolve) => {
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`\n\n京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve();
  });
}

// 开始看
function getTaskList() {
  let body = { timestamp: new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000 };
  return new Promise((resolve) => {
    $.get(taskUrl('liveChannelTaskListToM', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            for (let key of Object.keys(data.data.starLiveList ?? [])) {
              let vo = data.data.starLiveList[key];
              if (vo.state !== 3) {
                let authorId = (await getauthorId(vo.extra.liveId)).data.author.authorId;
                await superTask(vo.extra.liveId, authorId);
                await awardTask('starViewTask', vo.extra.liveId);
              }
            }
            console.log(`去做分享直播间任务`);
            await shareTask();
            await awardTask();
            console.log(`去做浏览直播间任务`);
            await viewTask();
            await awardTask('commonViewTask');
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

async function getauthorId(liveId) {
  let functionId = `liveDetailV910`;
  let body = escape(JSON.stringify({ liveId: liveId, fromId: '', liveList: [], sku: '', source: '17', d: '', direction: '', isNeedVideo: 1 }));
  let uuid = randomString(16);
  let sign = await getSign(functionId, decodeURIComponent(body), uuid);
  let url = `https://api.m.jd.com/client.action?functionId=${functionId}&build=167774&client=apple&clientVersion=10.1.0&uuid=${uuid}&${sign}`;
  return new Promise((resolve) => {
    $.post(taskPostUrl(functionId, body, url), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
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

async function superTask(liveId, authorId) {
  let functionId = `liveChannelReportDataV912`;
  let body = escape(JSON.stringify({ liveId: liveId, type: 'viewTask', authorId: authorId, extra: { time: 60 } }));
  let uuid = randomString(16);
  let sign = await getSign(functionId, decodeURIComponent(body), uuid);
  let url = `https://api.m.jd.com/client.action?functionId=${functionId}&build=167774&client=apple&clientVersion=10.1.0&uuid=${uuid}&${sign}`;
  return new Promise((resolve) => {
    $.post(taskPostUrl(functionId, body, url), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
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
function viewTask() {
  let body =
    'body=%7B%22liveId%22%3A%223008300%22%2C%22type%22%3A%22viewTask%22%2C%22authorId%22%3A%22644894%22%2C%22extra%22%3A%7B%22time%22%3A120%7D%7D&build=167408&client=apple&clientVersion=9.2.0&eid=eidIF3CF0112RTIyQTVGQTEtRDVCQy00Qg%3D%3D6HAJa9%2B/4Vedgo62xKQRoAb47%2Bpyu1EQs/6971aUvk0BQAsZLyQAYeid%2BPgbJ9BQoY1RFtkLCLP5OMqU&isBackground=N&joycious=194&openudid=53f4d9c70c1c81f1c8769d2fe2fef0190a3f60d2&osVersion=14.2&partner=TF&rfs=0000&scope=01&sign=90e14adc21c4bf31232a1ded5f4ba40e&st=1607561111999&sv=111&uts=0f31TVRjBSsxGLJHVBkddxFxBqY/8qFkrfEYLL0gkhB/JVGyEYIoD8r5rLvootZziQYAUyvIPogdJpesEuOMmvlisDx6AR2SEsfp381xPoggwvq8XaMYlOnHUV66TZiSfC%2BSgcLpB2v9cy/0Z41tT%2BuLheoEwBwDDYzANkZjncUI9PDCWpCg5/i0A14XfnsUTfQHbMqa3vwsY6QtsbNsgA%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D';
  return new Promise((resolve) => {
    $.post(taskPostUrl('liveChannelReportDataV912', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
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
function shareTask() {
  let body =
    'body=%7B%22liveId%22%3A%222995233%22%2C%22type%22%3A%22shareTask%22%2C%22authorId%22%3A%22682780%22%2C%22extra%22%3A%7B%22num%22%3A1%7D%7D&build=167408&client=apple&clientVersion=9.2.0&eid=eidIF3CF0112RTIyQTVGQTEtRDVCQy00Qg%3D%3D6HAJa9%2B/4Vedgo62xKQRoAb47%2Bpyu1EQs/6971aUvk0BQAsZLyQAYeid%2BPgbJ9BQoY1RFtkLCLP5OMqU&isBackground=Y&joycious=194&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=53f4d9c70c1c81f1c8769d2fe2fef0190a3f60d2&osVersion=14.2&partner=TF&rfs=0000&scope=01&screen=1242%2A2208&sign=457d557a0902f43cbdf9fb735d2bcd64&st=1607559819969&sv=110&uts=0f31TVRjBSsxGLJHVBkddxFxBqY/8qFkrfEYLL0gkhB/JVGyEYIoD8r5rLvootZziQYAUyvIPogdJpesEuOMmvlisDx6AR2SEsfp381xPoggwvq8XaMYlOnHUV66TZiSfC%2BSgcLpB2v9cy/0Z41tT%2BuLheoEwBwDDYzANkZjncUI9PDCWpCg5/i0A14XfnsUTfQHbMqa3vwsY6QtsbNsgA%3D%3D&uuid=hjudwgohxzVu96krv/T6Hg%3D%3D';
  return new Promise((resolve) => {
    $.post(taskPostUrl('liveChannelReportDataV912', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
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

function awardTask(type = 'shareTask', liveId = '2942545') {
  let body = { type: type, liveId: liveId };
  return new Promise((resolve) => {
    $.post(taskUrl('getChannelTaskRewardToM', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.subCode === '0') {
              $.bean += data.sum;
              console.log(`任务领奖成功，获得 ${data.sum} 京豆`);
              message += `任务领奖成功，获得 ${data.sum} 京豆\n`;
            } else {
              console.log(`任务领奖失败，${data.msg}`);
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
function sign() {
  return new Promise((resolve) => {
    $.get(taskUrl('getChannelTaskRewardToM', { type: 'signTask', itemId: '1' }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.subCode === '0') {
              $.bean += data.sum;
              console.log(`签到领奖成功，获得 ${data.sum} 京豆`);
              message += `任务领奖成功，获得 ${data.sum} 京豆\n`;
            } else {
              console.log(`任务领奖失败，${data.msg}`);
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

function getSign(functionid, body, uuid) {
  return new Promise(async (resolve) => {
    let data = {
      functionId: functionid,
      body: body,
      uuid: uuid,
      client: 'apple',
      clientVersion: '10.1.0',
    };
    let options = {
      url: `https://cdn.nz.lu/ddo`,
      body: JSON.stringify(data),
      headers: {
        Host: 'jdsign.cf',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88',
      },
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getSign API请求失败，请检查网路重试`);
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

function taskPostUrl(function_id, body = {}, url = null) {
  if (url && (function_id === 'liveChannelReportDataV912' || function_id === 'liveDetailV910')) body = `body=${body}`;
  if (!url) url = `https://api.m.jd.com/client.action?functionId=${function_id}`;
  return {
    url: url,
    body: body,
    headers: {
      Host: 'api.m.jd.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: '*/*',
      Referer: '',
      Cookie: cookie,
      Origin: 'https://h5.m.jd.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': '996',
      'User-Agent': 'JD4iPhone/167774 (iPhone; iOS 14.7.1; Scale/3.00)',
      'Accept-Language': 'zh-Hans-CN;q=1',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
}
function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&appid=h5-live&body=${escape(JSON.stringify(body))}&v=${
      new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000
    }&uuid=${uuid}`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookie,
      Origin: 'https://cfe.m.jd.com',
      'Accept-Encoding': 'gzip, deflate, br',
      Referer: 'https://cfe.m.jd.com/privatedomain/live-boborock/20210809/index.html',
      'Accept-Language': 'zh-cn',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };
}
function randomString(e) {
  let t = '0123456789abcdef';
  if (e == 16) {
    t = '0123456789abcdefghijklmnopqrstuvwxyz';
  }
  e = e || 32;
  let a = t.length,
    n = '';
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

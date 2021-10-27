/*
cron 13 0,9 * * * jd_fission.js
*/
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('东东超市抢京豆');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [],
  cookie = '';
let ownCode = null;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || '[]';
  cookiesData = JSON.parse(cookiesData);
  cookiesArr = cookiesData.map((item) => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  UUID = getUUID('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  UA = `jdapp;iPhone;10.1.6;13.5;${UUID};network/wifi;model/iPhone11,6;addressid/4596882376;appBuild/167841;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
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
      await main();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function main() {
  $.canHelp = true;
  $.hotFlag = false;
  await task('smt_newFission_index');
  if (!$.hotFlag) {
    if ($.tasklist) {
      for (const vo of $.tasklist) {
        if (vo.assignmentName === '从首页进京东超市') {
          $.log(`\n去做${vo.assignmentName}任务`);
          if (vo.assignmentTimesLimit != vo.completionCnt) {
            await task('smt_newFission_doAssignment', `{"projectId":"${$.projectId}","assignmentId":"${vo.assignmentId}","itemId":"","type":"${vo.type}"}`);
          } else {
            console.log(`任务：${vo.assignmentName}已完成`);
          }
        }
        if (vo.assignmentName === '关注超市优选店铺') {
          $.log(`\n去做${vo.assignmentName}任务`);
          if (vo.assignmentTimesLimit != vo.completionCnt) {
            for (const vi of vo.ext) {
              if (vi.status === 1) {
                await task('smt_newFission_doAssignment', `{"projectId":"${$.projectId}","assignmentId":"${vo.assignmentId}","itemId":"${vi.itemId}","type":"${vo.type}"}`);
                await $.wait(1000);
              }
            }
          } else {
            console.log(`任务：${vo.assignmentName}已完成`);
          }
        } else if (vo.assignmentName === '逛超市精选会场') {
          $.log(`\n去做${vo.assignmentName}任务`);
          if (vo.assignmentTimesLimit != vo.completionCnt) {
            for (const vi of vo.ext) {
              if (vi.status === 1) {
                await task('smt_newFission_doAssignment', `{"projectId":"${$.projectId}","assignmentId":"${vo.assignmentId}","itemId":"${vi.advId}","type":"${vo.type}"}`);
                await $.wait(1000);
              }
            }
          } else {
            console.log(`任务：${vo.assignmentName}已完成`);
          }
        } else if (vo.assignmentName === '邀请好友助力') {
          if ($.index === 1) {
            if (vo.assignmentTimesLimit != vo.completionCnt) {
              ownCode = vo.assistId;
            }
          } else {
            $.log(`\n去助力${ownCode}`);
            await task('smt_newFission_taskFlag', `{"taskType":"2","operateType":"1","assistId":"${ownCode}"}`);
            if ($.canHelp) {
              await task('smt_newFission_doAssignment', `{"projectId":"${$.projectId}","assignmentId":"${vo.assignmentId}","itemId":"${ownCode}","type":"${vo.type}"}`);
            }
          }
        }
      }
      if ($.userBoxInfoVoList) {
        $.log('\n去领取阶段奖励');
        for (const vo of $.userBoxInfoVoList) {
          await task('smt_newFission_openBox', `{"boxId":"${vo.id}"}`);
        }
      }
    }
  } else {
    console.log('活动火爆啦！');
  }
}

function task(function_id, body) {
  return new Promise((resolve) => {
    $.get(taskUrl(function_id, body), async (err, resp, data) => {
      try {
        if (err) {
          $.log(err);
        } else {
          data = JSON.parse(data);
          switch (function_id) {
            case 'smt_newFission_index':
              if (data.result) {
                $.projectId = data.result.projectId;
                $.tasklist = data.result.taskInfoList;
                $.userBoxInfoVoList = data.result.userBoxInfoVoList;
              }
              if (data.code === '188') {
                $.hotFlag = true;
              }
              break;
            case 'smt_newFission_doAssignment':
              if (data.result.subCode === '0') {
                console.log('任务完成！');
              } else {
                console.log(JSON.stringify(data));
              }
              break;
            case 'smt_newFission_openBox':
              if (data.result.status === 1) {
                console.log(`领取成功，获得${data.result.beanCount}豆子`);
              } else {
                console.log(JSON.stringify(data));
              }
              break;
            case 'smt_newFission_taskFlag':
              if (data.result.assistFlag === '2') {
                $.canHelp = false;
                console.log(`助力失败,每天只能助力一次`);
              }
              break;
            default:
              console.log(JSON.stringify(data));
              break;
          }
        }
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    });
  });
}
function taskUrl(function_id, body) {
  return {
    url: `https://api.m.jd.com/client.action?functionId=${function_id}&body=${body}&clientVersion=10.0.1&appid=smtTimeLimitFission`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: '*/*',
      Connection: 'keep-alive',
      'User-Agent': UA,
      'Accept-Language': 'zh-cn',
      Referer: 'https://h5.m.jd.com/babelDiy/Zeus/3fCUZv7USx24U1zzhLdFV4oDQ37b/index.html',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'text/plain',
      Cookie: cookie,
    },
  };
}

function getUUID(x = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', t = 0) {
  return x.replace(/[xy]/g, function (x) {
    var r = (16 * Math.random()) | 0,
      n = 'x' == x ? r : (3 & r) | 8;
    return (uuid = t ? n.toString(36).toUpperCase() : n.toString(36)), uuid;
  });
}

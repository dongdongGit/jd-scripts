/*
省钱大赢家之翻翻乐
一天可翻多次，但有上限
运气好每次可得0.3元以上的微信现金(需京东账号绑定到微信)
脚本兼容: QuantumultX, Surge,Loon, JSBox, Node.js
=================================Quantumultx=========================
[task_local]
#省钱大赢家之翻翻乐
20 * * * * jd_big_winner.js, tag=省钱大赢家之翻翻乐, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

=================================Loon===================================
[Script]
cron "20 * * * *" script-path=jd_big_winner.js,tag=省钱大赢家之翻翻乐

===================================Surge================================
省钱大赢家之翻翻乐 = type=cron,cronexp="20 * * * *",wake-system=1,timeout=3600,script-path=jd_big_winner.js

====================================小火箭=============================
省钱大赢家之翻翻乐 = type=cron,script-path=jd_big_winner.js, cronexpr="20 * * * *", timeout=3600, enable=true
 */
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('省钱大赢家之翻翻乐');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message = '',
  linkId = 'DA4SkG7NXupA9sksI00L0g',
  fflLinkId = 'YhCkrVusBVa_O2K-7xE6hA';
const JD_API_HOST = 'https://api.m.jd.com/api';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const len = cookiesArr.length;

!(async () => {
  $.redPacketId = [];
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
    return;
  }
  for (let i = 0; i < len; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      await $.totalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      await main();
    }
  }
  if (message) {
    $.msg($.name, '', message);
    //if ($.isNode()) await notify.sendNotify($.name, message);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function main() {
  try {
    $.canApCashWithDraw = false;
    $.changeReward = true;
    $.canOpenRed = true;
    await gambleHomePage();
    if (!$.time) {
      console.log(`开始进行翻翻乐拿红包\n`);
      await gambleOpenReward(); //打开红包
      if ($.canOpenRed) {
        while (!$.canApCashWithDraw && $.changeReward) {
          await openRedReward();
          await $.wait(500);
        }
        if ($.canApCashWithDraw) {
          //提现
          await openRedReward('gambleObtainReward', $.rewardData.rewardType);
          await apCashWithDraw($.rewardData.id, $.rewardData.poolBaseId, $.rewardData.prizeGroupId, $.rewardData.prizeBaseId, $.rewardData.prizeType);
        }
      }
    }
  } catch (e) {
    $.logErr(e);
  }
}

//查询剩余多长时间可进行翻翻乐
function gambleHomePage() {
  const headers = {
    Host: 'api.m.jd.com',
    Origin: 'https://openredpacket-jdlite.jd.com',
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'jdltapp;iPhone;3.3.2;14.4.1;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    Referer: `https://618redpacket.jd.com/withdraw?activityId=${linkId}&channel=wjicon&lng=&lat=&sid=&un_area=`,
    'Accept-Language': 'zh-cn',
    Cookie: cookie,
  };
  const body = { linkId: fflLinkId };
  const options = {
    url: `https://api.m.jd.com/?functionId=gambleHomePage&body=${encodeURIComponent(JSON.stringify(body))}&appid=activities_platform&clientVersion=3.5.0`,
    headers,
  };
  return new Promise((resolve) => {
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['code'] === 0) {
              if (data.data.leftTime === 0) {
                $.time = data.data.leftTime;
              } else {
                $.time = (data.data.leftTime / (60 * 1000)).toFixed(2);
              }
              console.log(`\n查询下次翻翻乐剩余时间成功：\n京东账号【${$.UserName}】距开始剩 ${$.time} 分钟`);
            } else {
              console.log(`查询下次翻翻乐剩余时间失败：${JSON.stringify(data)}\n`);
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
//打开翻翻乐红包
function gambleOpenReward() {
  const headers = {
    Host: 'api.m.jd.com',
    Origin: 'https://openredpacket-jdlite.jd.com',
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'jdltapp;iPhone;3.3.2;14.4.1;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    Referer: `https://618redpacket.jd.com/withdraw?activityId=${linkId}&channel=wjicon&lng=&lat=&sid=&un_area=`,
    'Accept-Language': 'zh-cn',
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: cookie,
  };
  const body = { linkId: fflLinkId };
  const options = {
    url: `https://api.m.jd.com/`,
    headers,
    body: `functionId=gambleOpenReward&body=${encodeURIComponent(JSON.stringify(body))}&t=${+new Date()}&appid=activities_platform&clientVersion=3.5.0`,
  };
  return new Promise((resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['code'] === 0) {
              console.log(`翻翻乐打开红包 成功，获得：${data.data.rewardValue}元红包\n`);
            } else {
              console.log(`翻翻乐打开红包 失败：${JSON.stringify(data)}\n`);
              if (data.code === 20007) {
                $.canOpenRed = false;
                console.log(`翻翻乐打开红包 失败，今日活动参与次数已达上限`);
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
//翻倍红包
function openRedReward(functionId = 'gambleChangeReward', type) {
  const headers = {
    Host: 'api.m.jd.com',
    Origin: 'https://openredpacket-jdlite.jd.com',
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'jdltapp;iPhone;3.3.2;14.4.1;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    Referer: `https://618redpacket.jd.com/withdraw?activityId=${linkId}&channel=wjicon&lng=&lat=&sid=&un_area=`,
    'Accept-Language': 'zh-cn',
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: cookie,
  };
  const body = { linkId: fflLinkId };
  if (type) body['rewardType'] = type;
  const options = {
    url: `https://api.m.jd.com/`,
    headers,
    body: `functionId=${functionId}&body=${encodeURIComponent(JSON.stringify(body))}&t=${+new Date()}&appid=activities_platform&clientVersion=3.5.0`,
  };
  return new Promise((resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            console.log(`翻翻乐结果：${data}\n`);
            data = JSON.parse(data);
            if (data['code'] === 0) {
              $.rewardData = data.data;
              if (data.data.rewardState === 1) {
                if (data.data.rewardValue >= 0.3) {
                  //已翻倍到0.3元，可以提现了
                  $.canApCashWithDraw = true;
                  $.changeReward = false;
                  // message += `${data.data.rewardValue}元现金\n`
                }
                if (data.data.rewardType === 1) {
                  console.log(`翻翻乐 第${data.data.changeTimes}次翻倍 成功，获得：${data.data.rewardValue}元红包\n`);
                } else if (data.data.rewardType === 2) {
                  console.log(`翻翻乐 第${data.data.changeTimes}次翻倍 成功，获得：${data.data.rewardValue}元现金\n`);
                  // $.canApCashWithDraw = true;
                } else {
                  console.log(`翻翻乐 第${data.data.changeTimes}次翻倍 成功，获得：${JSON.stringify(data)}\n`);
                }
              } else if (data.data.rewardState === 3) {
                console.log(`翻翻乐 第${data.data.changeTimes}次翻倍 失败，奖品溜走了/(ㄒoㄒ)/~~\n`);
                $.changeReward = false;
              } else {
                if (type) {
                  console.log(`翻翻乐领取成功：${data.data.amount}现金\n`);
                  message += `【京东账号${$.index}】${$.nickName || $.UserName}\n${new Date().getHours()}点：${data.data.amount}现金\n`;
                } else {
                  console.log(`翻翻乐 翻倍 成功，获得：${JSON.stringify(data)}\n`);
                }
              }
            } else {
              $.canApCashWithDraw = true;
              $.changeReward = false;
              console.log(`翻翻乐 翻倍 失败：${JSON.stringify(data)}\n`);
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
//翻翻乐提现
function apCashWithDraw(id, poolBaseId, prizeGroupId, prizeBaseId, prizeType) {
  const headers = {
    Host: 'api.m.jd.com',
    Origin: 'https://openredpacket-jdlite.jd.com',
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'jdltapp;iPhone;3.3.2;14.4.1;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    Referer: `https://618redpacket.jd.com/withdraw?activityId=${linkId}&channel=wjicon&lng=&lat=&sid=&un_area=`,
    'Accept-Language': 'zh-cn',
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: cookie,
  };
  const body = {
    businessSource: 'GAMBLE',
    base: {
      id,
      business: 'redEnvelopeDouble',
      poolBaseId,
      prizeGroupId,
      prizeBaseId,
      prizeType,
    },
    linkId: fflLinkId,
  };
  const options = {
    url: `https://api.m.jd.com/`,
    headers,
    body: `functionId=apCashWithDraw&body=${encodeURIComponent(JSON.stringify(body))}&t=${+new Date()}&appid=activities_platform&clientVersion=3.5.0`,
  };
  return new Promise((resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['code'] === 0) {
              if (data['data']['status'] === '310') {
                console.log(`翻翻乐提现 成功🎉，详情：${JSON.stringify(data)}\n`);
                message += `提现至微信钱包成功🎉\n\n`;
              } else {
                console.log(`翻翻乐提现 失败，详情：${JSON.stringify(data)}\n`);
                message += `提现至微信钱包失败\n详情：${JSON.stringify(data)}\n\n`;
              }
            } else {
              console.log(`翻翻乐提现 失败：${JSON.stringify(data)}\n`);
              message += `提现至微信钱包失败\n详情：${JSON.stringify(data)}\n\n`;
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

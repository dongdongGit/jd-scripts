/*
脚本：取关主播
更新时间：2021-08-21
默认：每运行一次脚本取关所有主播
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js, 小火箭
==============Quantumult X===========
[task_local]
#取关所有主播
55 6 * * * jd_unsubscriLive.js, tag=取关所有主播, 
===========Loon============
[Script]
cron "55 6 * * *" script-path=jd_unsubscriLive.js,tag=取关所有主播
============Surge=============
取关所有主播 = type=cron,cronexp="55 6 * * *",wake-system=1,timeout=3600,script-path=jd_unsubscriLive.js
===========小火箭========
取关所有主播 = type=cron,script-path=jd_unsubscriLive.js, cronexpr="55 6 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('取关所有主播');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  allMessage = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  let aid = '';
  if (!cookiesArr[0]) {
    $.msg('【京东账号一】取关所有主播失败', '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {
      'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
    });
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      await $.totalBean();
      console.log(`\n****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      allMessage += `京东账号${$.index} - ${$.nickName}\n`;
      $.succs = 0;
      $.fails = 0;
      $.commlist = [];
      $.olds = '';
      for (let i = 0; i < 100; i++) {
        $.commlist.length = 0;
        await GetRawFollowAuthor();
        if ($.commlist.length == 0) {
          break;
        }
        for (let m = 0; m < $.commlist.length; m++) {
          $.result = false;
          $.authorId = $.commlist[m]['authorId'];
          $.userName = $.commlist[m]['userName'];
          await unsubscribeCartsFun();
          if ($.result) {
            aid = '&' + $.authorId + '&';
            if ($.olds.indexOf(aid) == -1) {
              $.succs += 1;
              $.olds += aid;
            }
            $.fails = 0;
          } else {
            $.fails += 1;
            if ($.fails > 4) {
              break;
            }
          }
          await sleep(randomNum(800, 2200));
        }
        console.log('取关一轮完成，等待3-6秒');
        await sleep(randomNum(3000, 6000));
      }
      allMessage += `成功取关主播数：${$.succs}\n`;
      if ($.fails > 4) {
        allMessage += `❗️❗️取关主播连续五次失败❗️❗️\n`;
      }
      allMessage += '\n';
    }
  }
  if (allMessage) {
    allMessage = allMessage.substring(0, allMessage.length - 1);
    if ($.isNode() && (process.env.CASH_NOTIFY_CONTROL ? process.env.CASH_NOTIFY_CONTROL === 'false' : !!1)) await notify.sendNotify($.name, allMessage);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10);
      break;
    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
      break;
    default:
      return 0;
      break;
  }
}
function unsubscribeCartsFun(author) {
  return new Promise((resolve) => {
    const options = {
      url: `https://m.jingxi.com/jxlive_user/UnFollow?authorId=${$.authorId}&platform=3&_=` + new Date().getTime().toString() + `&sceneval=2&g_login_type=1&callback=jsonpCBKE&g_ty=ls`,
      headers: {
        Host: 'm.jingxi.com',
        Accept: '*/*',
        Connection: 'keep-alive',
        Cookie: cookie,
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://st.jingxi.com/',
      },
    };
    $.get(options, (err, resp, data) => {
      if (data.indexOf('iRet":0') > 0) {
        $.result = true;
        console.log(`取关主播【${$.userName}】成功\n`);
      } else {
        console.log(`取关主播【${$.userName}】失败：` + data + `\n`);
      }
      resolve(data);
    });
  });
}

function getStr(text, start, end) {
  var str = text;
  var aPos = str.indexOf(start);
  if (aPos < 0) {
    return null;
  }
  var bPos = str.indexOf(end, aPos + start.length);
  if (bPos < 0) {
    return null;
  }
  var retstr = str.substr(aPos + start.length, text.length - (aPos + start.length) - (text.length - bPos));
  return retstr;
}
function GetRawFollowAuthor() {
  return new Promise((resolve) => {
    const options = {
      url: `https://m.jingxi.com/jxlive_user/GetRawFollowAuthor?pagesize=10&pageno=1&_=` + (new Date().getTime() - 2000).toString() + `&sceneval=2&g_login_type=1&callback=jsonpCBKB&g_ty=ls`,
      headers: {
        Host: 'm.jingxi.com',
        Accept: '*/*',
        Connection: 'keep-alive',
        Cookie: cookie,
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://st.jingxi.com/',
      },
    };
    //https://m.jingxi.com/jxlive_user/GetRawFollowAuthor?pagesize=10&pageno=1&_=1627380788998&sceneval=2&g_login_type=1&callback=jsonpCBKB&g_ty=ls
    $.get(options, (err, resp, data) => {
      let userInfo = {},
        users = [];
      try {
        data = JSON.parse(getStr(data, 'jsonpCBKB(', ');'));
        if (data.iRet === 0) {
          for (let i = 0; i < data['data']['LiveIng'].length; i++) {
            users.push({ authorId: data['data']['LiveIng'][i]['authorId'], userName: data['data']['LiveIng'][i]['userName'] });
          }
          for (let i = 0; i < data['data']['PRLive'].length; i++) {
            users.push({ authorId: data['data']['PRLive'][i]['authorId'], userName: data['data']['PRLive'][i]['userName'] });
          }
          $.commlist = users;

          console.log(`本轮取消主播数：${$.commlist.length}个\n`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

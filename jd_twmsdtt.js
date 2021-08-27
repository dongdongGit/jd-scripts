const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('柠檬特物Z密室大逃脱');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const randomCount = $.isNode() ? 20 : 5;
const notify = $.isNode() ? require('./sendNotify') : '';
let merge = {};
let codeList = [];
const logs = 0;
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

const JD_API_HOST = `https://api.m.jd.com/client.action`;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
      'open-url': 'https://bean.m.jd.com/',
    });
    return;
  }

  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.beans = 0;
      message = '';

      //await TotalBean();
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

      await dotask('29yKWi6sAPG511Jj3TxnjwxibpK7', 1000010481);
      await dotask('47JV1WyxCcVbwzXrqWW6BEwuiYhc', 1000100813);
      await dotask('352qLFqHdgS6k1K2miiiyUaHnUge', 10397406);
      await dotask('3oaCLGRrD1DjNZD9tLkzkequj1zE', 1000310642);
      await dotask('29yKWi6sAPG511Jj3TxnjwxibpK7', 1000010481);
      for (let i = 0; i < 4; i++) {
        await cj();
      }
    }
  }

  if ($.isNode() && allMessage) {
    await notify.sendNotify(`${$.name}`, `${allMessage}`);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function dotask(encryptAssignmentId, itemId) {
  return new Promise((resolve) => {
    let plant6_url = {
      url: `https://api.m.jd.com/api?functionId=superBrandDoTask&appid=ProductZ4Brand&client=wh5&t=1626368092673&body={"source":"secondfloor","activityId":1000031,"encryptProjectId":"2Yx7XqM9PVo7GJsmSPEjNMvxHMs5","encryptAssignmentId":"${encryptAssignmentId}","assignmentType":3,"itemId":"${itemId}","actionType":0}`,
      headers: {
        Cookie: cookie,
        Origin: 'https://prodev.m.jd.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
      },
    };
    $.post(plant6_url, async (error, response, data) => {
      try {
        const result = JSON.parse(data);

        if (logs) $.log(data);

        if (result.data.bizcode == 'TK000') {
          $.log(result.data.bizMsg);
        } else if (result.data.bizcode !== 'TK000') {
          console.log(result.data.bizMsg);
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}

async function cj() {
  return new Promise((resolve) => {
    let plant6_url = {
      url: 'https://api.m.jd.com/api?functionId=superBrandTaskLottery&appid=ProductZ4Brand&client=wh5&t=1626368639330&body={"source":"secondfloor","activityId":1000031}',
      //headers: JSON.parse(kjjhd),
      headers: {
        Cookie: cookie,
        Origin: 'https://prodev.m.jd.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
      },
    };
    $.post(plant6_url, async (error, response, data) => {
      try {
        const result = JSON.parse(data);
        //console.log(result)
        if (logs) $.log(data);

        if (result.data.bizCode == 'TK000') {
          //await notify.sendNotify(`${$.name} - ${$.UserName}`, `京东账号${$.index} ${$.UserName}`+
          console.log('\n抽奖京豆：' + result.data.result.userAwardInfo.beanNum);
          allMessage += `京东账号${$.index}-${$.nickName || $.UserName}\n抽奖京豆: ${result.data.result.userAwardInfo.beanNum}${$.index !== cookiesArr.length ? '\n\n' : '\n\n'}`;
        } else if (result.data.bizCode !== 'TK000') {
          console.log(result.data.bizMsg);
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}
async function cj1() {
  return new Promise((resolve) => {
    let plant6_url = {
      url: 'https://api.m.jd.com/api?functionId=superBrandTaskLottery&appid=ProductZ4Brand&client=wh5&t=1622650376384&body={"source":"sign","activityId":1000017,"encryptProjectId":"uK2fYitTgioETuevoY88bGEts3U","encryptAssignmentId":"zFayjeUTzZWJGwv2rVNWY4DNAQw"}',
      headers: {
        Cookie: cookie,
        Origin: 'https://prodev.m.jd.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
      },
    };
    $.post(plant6_url, async (error, response, data) => {
      try {
        const result = JSON.parse(data);

        if (logs) $.log(data);

        if (result.data.result.userAwardInfo.beanNum != 0) {
          console.log('\n抽奖京豆：' + result.data.result.userAwardInfo.beanNum);
          //await notify.sendNotify(`${$.name} - ${$.UserName}`, `京东账号${$.index} ${$.UserName}`+'\n抽奖京豆：'+result.data.result.userAwardInfo.beanNum);
          allMessage += `京东账号${$.index}-${$.nickName || $.UserName}\n抽奖京豆: ${result.data.result.userAwardInfo.beanNum}${$.index !== cookiesArr.length ? '\n\n' : '\n\n'}`;
        } else {
          console.log(result.bizMsg);
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}

function taskPostUrl(body) {
  let o = '',
    r = '';
  const time = Date.now();
  o = '07035cabb557f096' + time;
  r = time.toString();
  // let t = "/khc/task/doQuestion";
  // let a = "brandId=555555&questionId=2&result=1"
  return {
    url: 'https://api.m.jd.com/client.action',
    body,
    headers: {
      Accept: 'application/json,text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Referer:
        'https://h5.m.jd.com/babelDiy/Zeus/BryCkeWYJm4YwzVhpTo9RSqzCFz/index.html?ad_od=1&inviteId=jd_68997b52ea865&lng=107.147022&lat=33.255229&sid=e5150a3fdd017952350b4b41294b145w&un_area=27_2442_2444_31912',
      'User-Agent':
        'jdapp;android;9.4.4;10;3b78ecc3f490c7ba;network/UNKNOWN;model/M2006J10C;addressid/138543439;aid/3b78ecc3f490c7ba;oaid/7d5870c5a1696881;osVer/29;appBuild/85576;psn/3b78ecc3f490c7ba|541;psq/2;uid/3b78ecc3f490c7ba;adk/;ads/;pap/JA2015_311210|9.2.4|ANDROID 10;osv/10;pv/548.2;jdv/0|iosapp|t_335139774|appshare|CopyURL|1606277982178|1606277986;ref/com.jd.lib.personal.view.fragment.JDPersonalFragment;partner/xiaomi001;apprpd/MyJD_Main;Mozilla/5.0 (Linux; Android 10; M2006J10C Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045227 Mobile Safari/537.36',
    },
  };
}

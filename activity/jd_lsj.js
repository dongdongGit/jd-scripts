/*
#京东零食街

后续添加自动兑换功能 如入会失败 自行去入会
入口 京东 频道 美食馆
零食街自动兑换变量 
export lsjdh="jdAward1" ##兑换5豆
export lsjdh="jdAward2" ##兑换10豆
export lsjdh="jdAward3" ##兑换100豆
export lsjdh="jdAward4" ##兑换牛奶
[task_local]
0 11 * * *
*/
const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
let $ = jd_env.env('柠檬京东零食街');
const notify = $.isNode() ? require('../sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';
let useInfo = {};

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message;
let newShareCodes = [];
let lsjdh = '';
if (process.env.lsjdh) {
  lsjdh = process.env.lsjdh;
}
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}

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
      $.cookie = cookie;
      $.skuIds = [];
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
      await star();
      await $.clearShoppingCart();
    }
  }
  console.log(`\n开始账号内互助\n`);
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    if (!useInfo[$.UserName]) continue;
    $.canHelp = true;
    for (let j = 0; j < newShareCodes.length && $.canHelp; j++) {
      $.oneCodeInfo = newShareCodes[j];
      if ($.UserName === newShareCodes[j].usr || $.oneCodeInfo.max) {
        continue;
      }
      console.log(`${$.UserName}去助力${newShareCodes[j].usr}`);
      nick = useInfo[$.UserName];
      await dohelp(newShareCodes[j].code);
      await $.wait(3000);
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
async function star() {
  await gettoken();
  $.log('开始入会任务');
  await dojoinMember(1000101562);
  await $.wait(3000);
  await dojoinMember(1000077335);
  await $.wait(3000);
  await dojoinMember(1000008814);
  await $.wait(3000);
  await dojoinMember(1000014803);
  $.log('开始领取首页水滴');
  await dotree(1);
  await $.wait(3000);
  await dotree(2);
  await $.wait(3000);
  await dotree(3);
  await $.wait(3000);
  $.log('开始浏览会场');
  await doliulan(1);
  await $.wait(3000);
  await doliulan(2);
  await $.wait(3000);
  await doliulan(3);
  //await gettask()

  $.log('开始浏览会场');
  await doshop(1000014803);
  await $.wait(3000);
  await doshop(10299171);
  await $.wait(3000);
  await doshop(1000077335);
  await $.wait(3000);
  await doshop(1000008814);
  await $.wait(3000);
  await doshop(1000101562);
  $.log('开始浏览推荐食品商品');
  await doGoods(1);
  await $.wait(3000);
  await doGoods(2);
  await $.wait(3000);
  await doGoods(3);
  await $.wait(3000);
  await doGoods(4);
  $.log('开始加购商品');
  await doadd(1);
  await $.wait(3000);
  await doadd(2);
  await $.wait(3000);
  await doadd(3);
  await $.wait(3000);
  await doadd(4);
  $.log('开始游戏刷分');
  await playgame();
  $.log('开始兑换');
  await duihuan();
  // 获得加购物品skuid
  await getHotGoodsList();
}

function gettoken() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/client.action?functionId=isvObfuscator&clientVersion=10.0.4&build=88641&client=android&d_brand=OPPO&d_model=PCAM00&osVersion=10&screen=2208*1080&partner=oppo&oaid=&openudid=7049442d7e41523&eid=eidAfb0d81231cs3I4yd3GgLRjqcx9qFEcJEmyOMn1BwD8wvLt%2FpM7ENipVIQXuRiDyQ0FYw2aud9%20AhtGqo1Zhp0TsLEgoKZvAWkaXhApgim9hlEyRB&sdkVersion=29&lang=zh_CN&uuid=7049442d7e415232&aid=7049442d7e415232&area=4_48201_54794_0&networkType=4g&wifiBssid=unknown&uts=0f31TVRjBSsqndu4%2FjgUPz6uymy50MQJs2X%2FHz8dwQrKfrmFvPGJYcIhgT3KrbJ2slvZoaufp78QzL4RqQVUgaKH%2Fq7EntlwV7J5l6acE2Wlj2%2Bu6Thwe90cWmtV80fH0yhpOV%2FhYIwvD5N6W1zo3LCVXTcuOw%2BARC%2F6K3bndzn3KzMw%2FpkYzhE2JcXeXiD44r%2BkUMawpn%2Bk7XqSVytdBg%3D%3D&uemps=0-0&st=1624988916642&sign=6a25b389996897b263c70516fc3c71e1&sv=122`,
      body: `body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fjinggengjcq-isv.isvjcloud.com%2Fpaoku%2Findex.html%3Fsid%3D75b413510cb227103e928769818a74ew%26un_area%3D4_48201_54794_0%22%7D&`,
      headers: {
        Host: 'api.m.jd.com',
        'User-Agent': 'okhttp/3.12.1;jdmall;android;version/10.0.4;build/88641;screen/1080x2208;os/10;network/4g;',
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);
        if (result.errcode == 0) {
          token = result.token;
          $.log(token);
          await getnick();
        } else {
          $.log(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function getnick() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com//dm/front/foodRunning/setMixNick?open_id=&mix_nick=&bizExtString=&user_id=10299171`,

      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"ae549c4ddea76787995f262fcedf9fcf","timestamp":1624988916869,"userId":"10299171"},"admJson":{"source":"01","strTMMixNick":"${token}","method":"/foodRunning/setMixNick","actId":"jd_food_running","buyerNick":"","pushWay":1,"userId":"10299171"}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'Sec-Fetch-Site': 'same-origin',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;android;10.0.4;10;7303439343432346-7356431353233323;network/4g;model/PCAM00;addressid/4228801336;aid/7049442d7e415232;oaid/;osVer/29;appBuild/88641;partner/oppo;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 10; PCAM00 Build/QKQ1.190918.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045227 Mobile Safari/537.36',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          nick = result.data.data.msg;
          $.log('邀请码: ' + nick);
          useInfo[$.UserName] = nick;
          newShareCodes.push({ usr: $.UserName, code: nick, max: false });
        } else if (result.errorCode == 500) {
          $.log(result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function doshop(goodsNumId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/complete/mission?open_id=&mix_nick=&bizExtString=&user_id=10299171`,

      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"c80a9253cc1558cbf7f54639198ee751","timestamp":1625029740517,"userId":10299171},"admJson":{"goodsNumId":${goodsNumId},"missionType":"viewShop","method":"/foodRunning/complete/mission","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          $.log(`${result.data.data.remark}\n获得${result.data.data.sendNum}`);
        } else if (result.errorCode == 500) {
          $.log('今日已领取完毕,请明日再来！' + result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function doliulan(goodsNumId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/complete/mission?open_id=&mix_nick=&bizExtString=&user_id=10299171`,

      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"c80a9253cc1558cbf7f54639198ee751","timestamp":1625029740517,"userId":10299171},"admJson":{"goodsNumId":${goodsNumId},"missionType":"viewBanner","method":"/foodRunning/complete/mission","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          $.log(`${result.data.data.remark}\n获得${result.data.data.sendNum}`);
        } else if (result.errorCode == 500) {
          $.log('今日已领取完毕,请明日再来！' + result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function doGoods(goodsNumId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/complete/mission?open_id=&mix_nick=&bizExtString=&user_id=10299171`,

      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"c80a9253cc1558cbf7f54639198ee751","timestamp":1625029740517,"userId":10299171},"admJson":{"goodsNumId":${goodsNumId},"missionType":"viewGoods","method":"/foodRunning/complete/mission","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          $.log(`${result.data.data.remark}\n获得${result.data.data.sendNum}`);
        } else if (result.errorCode == 500) {
          $.log('今日已领取完毕,请明日再来！' + result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function doadd(goodsNumId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/complete/mission?open_id=&mix_nick=&bizExtString=&user_id=10299171`,
      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"c80a9253cc1558cbf7f54639198ee751","timestamp":1625029740517,"userId":10299171},"admJson":{"goodsNumId":${goodsNumId},"missionType":"addCart","method":"/foodRunning/complete/mission","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          $.log(`${result.data.data.remark}\n获得${result.data.data.sendNum}`);
        } else if (result.errorCode == 500) {
          $.log('今日已领取完毕,请明日再来！' + result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function dotree(goodsNumId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/complete/mission?open_id=&mix_nick=&bizExtString=&user_id=10299171`,

      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"c80a9253cc1558cbf7f54639198ee751","timestamp":1625029740517,"userId":10299171},"admJson":{"goodsNumId":${goodsNumId},"missionType":"treeCoin","method":"/foodRunning/complete/mission","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          $.log(`${result.data.data.remark}\n获得${result.data.data.sendNum}`);
        } else if (result.errorCode == 500) {
          $.log('今日已领取完毕,请明日再来！' + result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function dohelp(inviterNick) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/complete/mission?open_id=&mix_nick=&bizExtString=&user_id=10299171`,

      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"61082e10fc24d61235301cd899e4ec5e","timestamp":1625033802865,"userId":10299171},"admJson":{"inviterNick":"${inviterNick}","missionType":"inviteFriend","method":"/foodRunning/complete/mission","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        console.log(data);
        const result = JSON.parse(data);
        if (result.errorCode == 200) {
          if (result.data.data.remark === `好友助力数量已达上限，无法为好友助力！`) {
            $.oneCodeInfo.max = true;
          } else {
            $.canHelp = false;
          }
          $.log(`${result.data.data.remark}`);
        } else if (result.errorCode == 500) {
          $.log(result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function dojoinMember(id) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/complete/mission?open_id=&mix_nick=&bizExtString=&user_id=10299171`,

      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"b0cf8f20b85bca9b2698848ac1c573a5","timestamp":1625034782254,"userId":10299171},"admJson":{"goodsNumId":"${id}","missionType":"joinMember","method":"/foodRunning/complete/mission","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          $.log(`\n如果入会失败 请手动去入会\n`);
          $.log(`${result.data.data.remark}`);
        } else if (result.errorCode == 500) {
          $.log(result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function getHotGoodsList() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/HotGoodsList?open_id=&mix_nick=&bizExtString=&user_id=10299171`,
      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"21be01323d6cdfe80c6291fb7c2d0e8f","timestamp":1629095952268,"userId":10299171},"admJson":{"method":"/foodRunning/HotGoodsList","actId":"jd_food_running","buyerNick":"7E2DC351D7DC1ABDB9FA839BD08A8FEECE2365363337AF8DA7F2735E9DA3BDA149336DE54E26AA8F2834B248E6398CB7A755DF4FDAE585EC3E1ABE26F3DD3CFFC956D12974FF00A045D8E31A84FE84C18A8357DE96A1F617B8AC4D64BC24B689","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          $.hotGoodsList = result.data.data;
          $.skuIds = $.hotGoodsList.map((goods) => goods.skuId);
        } else if (result.errorCode == 500) {
          $.log(result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function playgame() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/SendCoin?open_id=&mix_nick=&bizExtString=&user_id=10299171`,
      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"3a4b12fe8d85b42c2f5defb8d642f043","timestamp":1625035211650,"userId":10299171},"admJson":{"coin":5000,"point":5000,"method":"/foodRunning/SendCoin","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          if (result.data.data.enoughCoin == true) {
            $.log(`刷分成功 刷金币成功${result.data.data.point} 正在前往领取京豆`);
            await ljd('jdRunningBox1');
            await $.wait(3000);
            await ljd('jdRunningBox2');
            await $.wait(3000);
            await ljd('jdRunningBox3');
          } else if (result.data.data.enoughCoin == false) {
            $.log(`${result.data.data.msg}`);
          }
        } else if (result.errorCode == 500) {
          $.log(result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function ljd(awardId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/OpenBox?open_id=&mix_nick=&bizExtString=&user_id=10299171`,

      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"24068838e03a8c538424a146d0c49a27","timestamp":1625035590002,"userId":10299171},"admJson":{"awardId":"${awardId}","method":"/foodRunning/OpenBox","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?sid=75b413510cb227103e928769818a74ew&un_area=4_48201_54794_0',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          jdbean = result.data.data.msg;
          $.log(`${result.data.data.msg}`);
          await showMsg();
        } else if (result.errorCode == 500) {
          $.log(result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function showMsg() {
  return new Promise((resolve) => {
    message += `\n${jdbean}\n`;
    $.msg($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    resolve();
  });
}
function duihuan() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://jinggengjcq-isv.isvjcloud.com/dm/front/foodRunning/exchangeGoods?open_id=&mix_nick=&bizExtString=&user_id=10299171`,

      body: `{"jsonRpc":"2.0","params":{"commonParameter":{"appkey":"51B59BB805903DA4CE513D29EC448375","m":"POST","sign":"8bf72ff9ded8cc22cd9ec407165342e7","timestamp":1625093423768,"userId":10299171},"admJson":{"awardId":"${lsjdh}","method":"/foodRunning/exchangeGoods","actId":"jd_food_running","buyerNick":"${nick}","pushWay":1,"userId":10299171}}}`,
      headers: {
        Origin: 'https://jinggengjcq-isv.isvjcloud.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Host: 'jinggengjcq-isv.isvjcloud.com',
        Referer: 'https://jinggengjcq-isv.isvjcloud.com/paoku/index.html?lng=106.286832&lat=29.969274&sid=1c98c3013bd5808a5977e0f9d5f5272w&un_area=17_1458_1463_43894',
        'User-Agent':
          'jdapp;iPhone;9.5.2;14.3;6898c30638c55142969304c8e2167997fa59eb53;network/4g;ADID/F108E1B6-8E30-477C-BE54-87CF23435488;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone9,2;addressid/390536540;supportBestPay/0;appBuild/167650;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        const result = JSON.parse(data);

        if (result.errorCode == 200) {
          $.log(`${result.data.data.msg}`);
        } else if (result.errorCode == 500) {
          $.log('今日已领取完毕,请明日再来！' + result.errorMessage);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
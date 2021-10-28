/*
  入口>京东极速版>首页>签到免单
  京东极速版,先下单,第二天开始签到
  18 8,12,20 * * * jd_speed_signfree.js 签到免单
*/
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东极速版签到免单');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let notification = false;
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
$.message = '\n';
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
      $.mian_dan_list = [];
      await $.totalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          //await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      $.message += `【京东账号】${$.nickName || $.UserName}\n`;
      await get_order_ids(cookie);
      if ($.mian_dan_list.length > 0) {
        for (let i = 0; i < $.mian_dan_list.length; i++) {
          const orderId = $.mian_dan_list[i];
          await sign(cookie, orderId);
          await $.wait(2000);
        }
      }
    }
  }
  if (notification) {
    notify.sendNotify(`${$.name}`, $.message);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

function get_order_ids(cookie) {
  return new Promise((resolve) => {
    try {
      $.get(
        {
          url: `https://api.m.jd.com/?functionId=signFreeHome&body=%7B%22linkId%22%3A%22PiuLvM8vamONsWzC0wqBGQ%22%7D&_t=${Date.now()}&appid=activities_platform`,
          headers: {
            'User-Agent': $.isNode()
              ? process.env.JD_USER_AGENT
                ? process.env.JD_USER_AGENT
                : require('./USER_AGENTS').USER_AGENT
              : $.getdata('JDUA')
              ? $.getdata('JDUA')
              : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
            Host: 'api.m.jd.com',
            accept: 'application/json, text/plain, */*',
            origin: 'https://signfree.jd.com',
            'sec-fetch-dest': 'empty',
            'x-requested-with': 'com.jd.jdlite',
            'sec-fetch-site': 'same-site',
            'sec-fetch-mode': 'cors',
            referer: 'https://signfree.jd.com/?activityId=PiuLvM8vamONsWzC0wqBGQ&lng=107.647085&lat=30.280608&sid=2c81fdcf0d34f67bacc5df5b2a4add6w&un_area=4_134_19915_0',
            'accept-encoding': 'gzip, deflate',
            'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            cookie: cookie,
          },
        },
        (err, resp, data) => {
          data = JSON.parse(data);
          if (data.success == true) {
            if (data.data.risk == true) {
              console.log('风控用户,跳过');
              $.message += '风控用户,跳过\n';
              resolve();
              return;
            }
            if (!data.data.signFreeOrderInfoList) {
              console.log('没有需要签到的商品,请到京东极速版[签到免单]购买商品');
              $.message += '没有需要签到的商品,请到京东极速版[签到免单]购买商品\n';
              resolve();
            } else {
              notification = true;
              for (let i = 0; i < data.data.signFreeOrderInfoList.length; i++) {
                var respdemo = {
                  success: true,
                  code: 0,
                  errMsg: 'success',
                  data: {
                    newUser: false,
                    backRecord: false,
                    risk: false,
                    surplusCount: 2,
                    sumTotalFreeAmount: '0.00',
                    signFreeOrderInfoList: [
                      {
                        id: 472,
                        productName: '百事可乐 300ml*6瓶',
                        productImg: 'jfs/t1/177052/32/20077/117620/611e1a4cE0065cc54/b19fb6ed2ff59493.jpg',
                        needSignDays: 20,
                        hasSignDays: 0,
                        freeAmount: '6.54',
                        moneyReceiveMode: '3',
                        orderId: 225947891472,
                        surplusTime: 0,
                        combination: 1,
                      },
                    ],
                    interruptInfoList: null,
                  },
                };
                const order = data.data.signFreeOrderInfoList[i];
                $.mian_dan_list.push(order.orderId);
                console.log(`商品名称:${order.productName},商品id:${order.orderId}`);
                $.message += `商品名称:${order.productName}\n`;
              }
            }
          }
          resolve();
        }
      );
    } catch (error) {
      $.logErr(e, resp);
      resolve();
    }
  });
}
function sign(cookie, orderId) {
  return new Promise((resolve) => {
    const options = {
      url: `https://api.m.jd.com?functionId=signFreeSignIn&body=%7B%22linkId%22%3A%22PiuLvM8vamONsWzC0wqBGQ%22%2C%22orderId%22%3A${orderId}%7D&_t=${Date.now()}&appid=activities_platform`,
      headers: {
        Host: 'api.m.jd.com',
        accept: 'application/json, text/plain, */*',
        origin: 'https://signfree.jd.com',
        'sec-fetch-dest': 'empty',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'content-type': 'application/x-www-form-urlencoded',
        'x-requested-with': 'com.jd.jdlite',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        referer: 'https://signfree.jd.com/?activityId=PiuLvM8vamONsWzC0wqBGQ&lng=107.647085&lat=30.280608&sid=2c81fdcf0d34f67bacc5df5b2a4add6w&un_area=4_134_19915_0',
        'accept-encoding': 'gzip, deflate',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        cookie: cookie,
      },
    };
    $.post(options, async (err, resp, data) => {
      try {
        console.log(data);
        data = JSON.parse(data);
        var dataDemo = { success: false, code: 400015, errMsg: '明日签到', data: null };
        if (data.success == false) {
          console.log(data.errMsg);
        } else {
          console.log('签到成功');
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data || '');
      }
    });
  });
}

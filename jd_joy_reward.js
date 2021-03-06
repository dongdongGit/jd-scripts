/*
Last Modified time: 2021-06-06 21:22:37
宠汪汪积分兑换奖品脚本, 目前脚本只兑换京豆，兑换京豆成功，才会发出通知提示，其他情况不通知。
活动入口：京东APP我的-更多工具-宠汪汪
兑换规则：一个账号一天只能兑换一次京豆。
兑换奖品成功后才会有系统弹窗通知
每日京豆库存会在0:00、8:00、16:00更新。
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js
==============Quantumult X==============
[task_local]
#宠汪汪积分兑换奖品
59 7,15,23 * * * jd_joy_reward.js, tag=宠汪汪积分兑换奖品, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jdcww.png, enabled=true

==============Loon==============
[Script]
cron "59 7,15,23 * * *" script-path=jd_joy_reward.js,tag=宠汪汪积分兑换奖品

================Surge===============
宠汪汪积分兑换奖品 = type=cron,cronexp="59 7,15,23 * * *",wake-system=1,timeout=3600,script-path=jd_joy_reward.js

===============小火箭==========
宠汪汪积分兑换奖品 = type=cron,script-path=jd_joy_reward.js, cronexpr="59 7,15,23 * * *", timeout=3600, enable=true
 */
const config = require('./utils/config.js');
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('宠汪汪积分兑换奖品');
const zooFaker = require('./utils/JDJRValidator_Pure');
const MD5 = require('crypto-js/md5');
// $.get = zooFaker.injectToRequest2($.get.bind($));
// $.post = zooFaker.injectToRequest2($.post.bind($));
let allMessage = '';
let joyRewardName = 0; //是否兑换京豆，默认0不兑换京豆，其中20为兑换20京豆,500为兑换500京豆，0为不兑换京豆.数量有限先到先得
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let jdNotify = false; //是否开启静默运行，默认false关闭(即:奖品兑换成功后会发出通知提示)
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
const JD_API_HOST = 'https://jdjoy.jd.com';
Date.prototype.Format = function (fmt) {
  //author: meizz
  var o = {
    'M+': this.getMonth() + 1, //月份
    'd+': this.getDate(), //日
    'h+': this.getHours(), //小时
    'm+': this.getMinutes(), //分
    's+': this.getSeconds(), //秒
    S: this.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o) if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
  return fmt;
};
!(async () => {
  if (!cookiesArr[0]) {
    $.msg('【京东账号一】宠汪汪积分兑换奖品失败', '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {
      'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
    });
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '' || $.UserName;
      await $.totalBean();
      console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}****\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      // console.log(`本地时间与京东服务器时间差(毫秒)：${await get_diff_time()}`);
      $.validate = '';
      $.validate = await zooFaker.injectToRequest();
      console.log(`脚本开始请求时间 ${new Date().Format('yyyy-MM-dd hh:mm:ss | S')}`);
      await joyReward();
    }
  }
  if ($.isNode() && allMessage && $.ctrTemp) {
    await notify.sendNotify(`${$.name}`, `${allMessage}`);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function joyReward() {
  try {
    if (new Date().getMinutes() === 59) {
      let nowtime = new Date().Format('s.S');
      let starttime = process.env.JOY_STARTTIME ? process.env.JOY_STARTTIME : 60;
      if (nowtime < 59) {
        let sleeptime = (starttime - nowtime) * 1000 + 10;
        console.log(`等待时间 ${sleeptime / 1000}`);
        await zooFaker.sleep(sleeptime);
      }
    }
    for (let j = 0; j <= 10; j++) {
      await getExchangeRewards();
      if ($.getExchangeRewardsRes && $.getExchangeRewardsRes.success) {
        // console.log('success', $.getExchangeRewardsRes);
        const data = $.getExchangeRewardsRes.data;
        // const levelSaleInfos = data.levelSaleInfos;
        // const giftSaleInfos = levelSaleInfos.giftSaleInfos;
        // console.log(`当前积分 ${data.coin}\n`);
        // console.log(`宠物等级 ${data.level}\n`);
        let saleInfoId = '',
          giftValue = '',
          extInfo = '',
          leftStock = 0,
          salePrice = 0;
        let rewardNum = 0;
        if ($.isNode() && process.env.JD_JOY_REWARD_NAME) {
          rewardNum = process.env.JD_JOY_REWARD_NAME * 1;
        } else if ($.getdata('joyRewardName')) {
          if ($.getdata('joyRewardName') * 1 === 1) {
            //兼容之前的BoxJs设置
            rewardNum = 20;
          } else {
            rewardNum = $.getdata('joyRewardName') * 1;
          }
        } else {
          rewardNum = joyRewardName;
        }
        let giftSaleInfos = 'beanConfigs0';
        let time = new Date($.getExchangeRewardsRes['currentTime']).getHours();
        if (time >= 0 && time < 8) {
          giftSaleInfos = 'beanConfigs0';
        }
        if (time >= 8 && time < 16) {
          giftSaleInfos = 'beanConfigs8';
        }
        if (time >= 16 && time < 24) {
          giftSaleInfos = 'beanConfigs16';
        }
        console.log(`\ndebug场次:${giftSaleInfos}\n`);
        for (let item of data[giftSaleInfos]) {
          console.log(`${item['giftName']}当前库存:${item['leftStock']}，id：${item.id}`);
          if (item.giftType === 'jd_bean' && item['giftValue'] === rewardNum) {
            saleInfoId = item.id;
            leftStock = item.leftStock;
            salePrice = item.salePrice;
            giftValue = item.giftValue;
          }
        }
        // console.log(`${giftValue}京豆当前京豆库存:${leftStock}`)
        // console.log(`saleInfoId:${saleInfoId}`)
        // 兼容之前BoxJs兑换设置的数据
        if (rewardNum && (rewardNum === 1 || rewardNum === 20 || rewardNum === 50 || rewardNum === 100 || rewardNum === 500 || rewardNum === 1000)) {
          //开始兑换
          if (salePrice) {
            if (leftStock) {
              if (!saleInfoId) return;
              // console.log(`当前账户积分:${data.coin}\n当前京豆库存:${leftStock}\n满足兑换条件,开始为您兑换京豆\n`);
              console.log(`\n您设置的兑换${giftValue}京豆库存充足,开始为您兑换${giftValue}京豆\n`);
              console.log(`脚本开始兑换${rewardNum}京豆时间 ${new Date().Format('yyyy-MM-dd hh:mm:ss | S')}`);
              await exchange(saleInfoId, 'pet');
              console.log(`请求兑换API后时间 ${new Date().Format('yyyy-MM-dd hh:mm:ss | S')}`);
              if ($.exchangeRes && $.exchangeRes.success) {
                if ($.exchangeRes.errorCode === 'buy_success') {
                  // console.log(`兑换${giftValue}成功,【宠物等级】${data.level}\n【消耗积分】${salePrice}个\n【剩余积分】${data.coin - salePrice}个\n`)
                  console.log(`\n兑换${giftValue}成功,【消耗积分】${salePrice}个\n`);
                  if ($.isNode() && process.env.JD_JOY_REWARD_NOTIFY) {
                    $.ctrTemp = `${process.env.JD_JOY_REWARD_NOTIFY}` === 'false';
                  } else if ($.getdata('jdJoyRewardNotify')) {
                    $.ctrTemp = $.getdata('jdJoyRewardNotify') === 'false';
                  } else {
                    $.ctrTemp = `${jdNotify}` === 'false';
                  }
                  if ($.ctrTemp) {
                    $.msg($.name, ``, `【京东账号${$.index}】${$.nickName}\n【${giftValue}京豆】兑换成功🎉\n【积分详情】消耗积分 ${salePrice}`);
                    if ($.isNode()) {
                      allMessage += `【京东账号${$.index}】 ${$.nickName}\n【${giftValue}京豆】兑换成功🎉\n【积分详情】消耗积分 ${salePrice}${$.index !== cookiesArr.length ? '\n\n' : ''}`;
                      // await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】 ${$.nickName}\n【${giftValue}京豆】兑换成功\n【宠物等级】${data.level}\n【积分详情】消耗积分 ${salePrice}, 剩余积分 ${data.coin - salePrice}`);
                    }
                    break;
                  }
                  // if ($.isNode()) {
                  //   await notify.BarkNotify(`${$.name}`, `【京东账号${$.index}】 ${$.nickName}\n【兑换${giftName}】成功\n【宠物等级】${data.level}\n【消耗积分】${salePrice}分\n【当前剩余】${data.coin - salePrice}积分`);
                  // }
                } else if ($.exchangeRes && $.exchangeRes.errorCode === 'buy_limit') {
                  console.log(`\n兑换${rewardNum}京豆失败，原因：兑换京豆已达上限，请把机会留给更多的小伙伴~\n`);
                  //$.msg($.name, `兑换${giftName}失败`, `【京东账号${$.index}】${$.nickName}\n兑换京豆已达上限\n请把机会留给更多的小伙伴~\n`)
                  break;
                } else if ($.exchangeRes && $.exchangeRes.errorCode === 'stock_empty') {
                  console.log(`\n兑换${rewardNum}京豆失败，原因：当前京豆库存为空\n`);
                } else if ($.exchangeRes && $.exchangeRes.errorCode === 'insufficient') {
                  console.log(`\n兑换${rewardNum}京豆失败，原因：当前账号积分不足兑换${giftValue}京豆所需的${salePrice}积分\n`);
                  break;
                } else {
                  console.log(`\n兑奖失败:${JSON.stringify($.exchangeRes)}`);
                }
              } else {
                console.log(`\n兑换京豆异常:${JSON.stringify($.exchangeRes)}`);
              }
            } else {
              console.log(`\n按您设置的兑换${rewardNum}京豆失败，原因：京豆库存不足，已抢完，请下一场再兑换\n`);
            }
          } else {
            // console.log(`兑换${rewardNum}京豆失败，原因：您目前只有${data.coin}积分，已不足兑换${giftValue}京豆所需的${salePrice}积分\n`)
            //$.msg($.name, `兑换${giftName}失败`, `【京东账号${$.index}】${$.nickName}\n目前只有${data.coin}积分\n已不足兑换${giftName}所需的${salePrice}积分\n`)
          }
        } else {
          console.log(`\n您设置了不兑换京豆,如需兑换京豆，请去BoxJs处设置或修改joyRewardName代码或设置环境变量 JD_JOY_REWARD_NAME`);
        }
      } else {
        console.log(`${$.name}getExchangeRewards异常,${JSON.stringify($.getExchangeRewardsRes)}`);
      }
    }
  } catch (e) {
    $.logErr(e);
  }
}
function getExchangeRewards() {
  let opt = {
    url: `//jdjoy.jd.com/common/gift/getBeanConfigs?reqSource=h5&invokeKey=${config.invokeKey}`,
    method: 'GET',
    data: {},
    credentials: 'include',
    header: { 'content-type': 'application/json' },
  };
  return new Promise((resolve) => {
    let lkt = new Date().getTime();
    let lks = MD5('' + config.invokeKey + lkt).toString();
    const option = {
      url: 'https:' + taroRequest(opt)['url'] + $.validate,
      headers: {
        Host: 'jdjoy.jd.com',
        'Content-Type': 'application/json',
        Cookie: cookie,
        reqSource: 'h5',
        Connection: 'keep-alive',
        Accept: '*/*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        Referer: 'https://jdjoy.jd.com/pet/index',
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
        lkt: lkt,
        lks: lks,
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          $.getExchangeRewardsRes = {};
          if (jd_helpers.safeGet(data)) {
            $.getExchangeRewardsRes = JSON.parse(data);
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
function exchange(saleInfoId, orderSource) {
  let body = { buyParam: { orderSource: orderSource, saleInfoId: saleInfoId }, deviceInfo: {} };
  let opt = {
    url: `//jdjoy.jd.com/common/gift/new/exchange?reqSource=h5&invokeKey=${config.invokeKey}`,
    data: body,
    credentials: 'include',
    method: 'POST',
    header: { 'content-type': 'application/json' },
  };
  return new Promise((resolve) => {
    let lkt = new Date().getTime();
    let lks = MD5('' + `${config.invokeKey}` + lkt).toString();
    const option = {
      url: 'https:' + taroRequest(opt)['url'] + $.validate,
      body: `${JSON.stringify(body)}`,
      headers: {
        Host: 'jdjoy.jd.com',
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        'Content-Type': 'application/json',
        Origin: 'https://jdjoy.jd.com',
        reqSource: 'h5',
        Connection: 'keep-alive',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        Referer: 'https://jdjoy.jd.com/pet/index',
        'Content-Length': '10',
        Cookie: cookie,
        lkt: lkt,
        lks: lks,
      },
    };
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          console.log(`兑换结果:${data}`);
          $.exchangeRes = {};
          if (jd_helpers.safeGet(data)) {
            $.exchangeRes = JSON.parse(data);
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
function getJDServerTime() {
  return new Promise((resolve) => {
    // console.log(Date.now())
    $.get(
      {
        url: 'https://a.jd.com//ajax/queryServerData.html',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88',
        },
      },
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} 获取京东服务器时间失败，请检查网路重试`);
          } else {
            data = JSON.parse(data);
            $.jdTime = data['serverTime'];
            // console.log(data['serverTime']);
            // console.log(data['serverTime'] - Date.now())
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve($.jdTime);
        }
      }
    );
  });
}
async function get_diff_time() {
  // console.log(`本机时间戳 ${Date.now()}`)
  // console.log(`京东服务器时间戳 ${await getJDServerTime()}`)
  return Date.now() - (await getJDServerTime());
}
function taroRequest(e) {
  const a = $.isNode() ? require('crypto-js') : CryptoJS;
  const i = '98c14c997fde50cc18bdefecfd48ceb7';
  const o = a.enc.Utf8.parse(i);
  const r = a.enc.Utf8.parse('ea653f4f3c5eda12');
  let _o = {
    AesEncrypt: function AesEncrypt(e) {
      var n = a.enc.Utf8.parse(e);
      return a.AES.encrypt(n, o, {
        iv: r,
        mode: a.mode.CBC,
        padding: a.pad.Pkcs7,
      }).ciphertext.toString();
    },
    AesDecrypt: function AesDecrypt(e) {
      var n = a.enc.Hex.parse(e),
        t = a.enc.Base64.stringify(n);
      return a.AES.decrypt(t, o, {
        iv: r,
        mode: a.mode.CBC,
        padding: a.pad.Pkcs7,
      })
        .toString(a.enc.Utf8)
        .toString();
    },
    Base64Encode: function Base64Encode(e) {
      var n = a.enc.Utf8.parse(e);
      return a.enc.Base64.stringify(n);
    },
    Base64Decode: function Base64Decode(e) {
      return a.enc.Base64.parse(e).toString(a.enc.Utf8);
    },
    Md5encode: function Md5encode(e) {
      return a.MD5(e).toString();
    },
    keyCode: '98c14c997fde50cc18bdefecfd48ceb7',
  };

  const c = function sortByLetter(e, n) {
    if (e instanceof Array) {
      n = n || [];
      for (var t = 0; t < e.length; t++) n[t] = sortByLetter(e[t], n[t]);
    } else
      !(e instanceof Array) && e instanceof Object
        ? ((n = n || {}),
          Object.keys(e)
            .sort()
            .map(function (t) {
              n[t] = sortByLetter(e[t], n[t]);
            }))
        : (n = e);
    return n;
  };
  const s = function isInWhiteAPI(e) {
    for (var n = ['gift', 'pet'], t = !1, a = 0; a < n.length; a++) {
      var i = n[a];
      e.includes(i) && !t && (t = !0);
    }
    return t;
  };

  const d = function addQueryToPath(e, n) {
    if (n && Object.keys(n).length > 0) {
      var t = Object.keys(n)
        .map(function (e) {
          return e + '=' + n[e];
        })
        .join('&');
      return e.indexOf('?') >= 0 ? e + '&' + t : e + '?' + t;
    }
    return e;
  };
  const l = function apiConvert(e) {
    for (var n = r, t = 0; t < n.length; t++) {
      var a = n[t];
      e.includes(a) && !e.includes('common/' + a) && (e = e.replace(a, 'common/' + a));
    }
    return e;
  };

  var n = e,
    t = (n.header, n.url);
  t += (t.indexOf('?') > -1 ? '&' : '?') + 'reqSource=h5';
  var _a = (function getTimeSign(e) {
    var n = e.url,
      t = e.method,
      a = void 0 === t ? 'GET' : t,
      i = e.data,
      r = e.header,
      m = void 0 === r ? {} : r,
      p = a.toLowerCase(),
      g = _o.keyCode,
      f = m['content-type'] || m['Content-Type'] || '',
      h = '',
      u = +new Date();
    return (
      (h =
        'get' !== p && ('post' !== p || ('application/x-www-form-urlencoded' !== f.toLowerCase() && i && Object.keys(i).length))
          ? _o.Md5encode(_o.Base64Encode(_o.AesEncrypt('' + JSON.stringify(c(i)))) + '_' + g + '_' + u)
          : _o.Md5encode('_' + g + '_' + u)),
      s(n) &&
        ((n = d(n, {
          lks: h,
          lkt: u,
        })),
        (n = l(n))),
      Object.assign(e, {
        url: n,
      })
    );
  })(
    (e = Object.assign(e, {
      url: t,
    }))
  );
  return _a;
}

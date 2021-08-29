/*
脚本：取关京东店铺和商品
更新时间：2021-05-08
因种豆得豆和宠汪汪以及NobyDa大佬的京东签到脚本会关注店铺和商品，故此脚本用来取消已关注的店铺和商品
默认：每运行一次脚本全部已关注的店铺与商品
建议此脚本运行时间在 种豆得豆和宠汪汪脚本运行之后 再执行
现有功能: 1、取关商品。2、取关店铺。3、匹配到boxjs输入的过滤关键词后，不再进行此商品/店铺后面(包含输入的关键词商品/店铺)的取关
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js, 小火箭
==============Quantumult X===========
[task_local]
#取关京东店铺商品
55 23 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_unsubscribe.js, tag=取关京东店铺商品, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
===========Loon============
[Script]
cron "55 23 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_unsubscribe.js,tag=取关京东店铺商品
============Surge=============
取关京东店铺商品 = type=cron,cronexp="55 23 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_unsubscribe.js
===========小火箭========
取关京东店铺商品 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_unsubscribe.js, cronexpr="55 23 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('取关京东店铺和商品');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';

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
const jdNotify = $.getdata('jdUnsubscribeNotify'); //是否关闭通知，false打开通知推送，true关闭通知推送
let goodPageSize = $.getdata('jdUnsubscribePageSize') || 100; // 运行一次取消多少个已关注的商品。数字0表示不取关任何商品
let shopPageSize = $.getdata('jdUnsubscribeShopPageSize') || 100; // 运行一次取消多少个已关注的店铺。数字0表示不取关任何店铺
let stopGoods = $.getdata('jdUnsubscribeStopGoods') || ''; //遇到此商品不再进行取关，此处内容需去商品详情页（自营处）长按拷贝商品信息
let stopShop = $.getdata('jdUnsubscribeStopShop') || ''; //遇到此店铺不再进行取关，此处内容请尽量从头开始输入店铺名称
const JD_API_HOST = 'https://wq.jd.com/fav';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg('【京东账号一】取关京东店铺商品失败', '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {
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
      await requireConfig();
      await jdUnsubscribe();
      await showMsg();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function jdUnsubscribe() {
  await Promise.all([goodsMain(), shopMain()]);
  //再次获取还有多少已关注的店铺与商品
  await Promise.all([getFollowGoods(), getFollowShops()]);
}

function showMsg() {
  if (!jdNotify || jdNotify === 'false') {
    $.msg(
      $.name,
      ``,
      `【京东账号${$.index}】${$.nickName}\n【已取消关注店铺】${$.unsubscribeShopsCount}个\n【已取消关注商品】${$.unsubscribeGoodsCount}个\n【还剩关注店铺】${$.shopsTotalNum}个\n【还剩关注商品】${$.goodsTotalNum}个\n`
    );
  } else {
    $.log(
      `\n【京东账号${$.index}】${$.nickName}\n【已取消关注店铺】${$.unsubscribeShopsCount}个\n【已取消关注商品】${$.unsubscribeGoodsCount}个\n【还剩关注店铺】${$.shopsTotalNum}个\n【还剩关注商品】${$.goodsTotalNum}个\n`
    );
  }
}

async function goodsMain() {
  $.unsubscribeGoodsCount = 0;
  if (goodPageSize * 1 !== 0) {
    await unsubscribeGoods();
    const le = Math.ceil($.goodsTotalNum / 20) - 1 >= 0 ? Math.ceil($.goodsTotalNum / 20) - 1 : 0;
    for (let i = 0; i < new Array(le).length; i++) {
      await $.wait(100);
      await unsubscribeGoods();
    }
  } else {
    console.log(`\n您设置的是不取关商品\n`);
  }
}

async function unsubscribeGoods() {
  let followGoods = await getFollowGoods();
  if (followGoods.iRet === '0') {
    if (followGoods.totalNum > 0) {
      for (let item of followGoods['data']) {
        console.log(`是否匹配：：${item.commTitle.indexOf(stopGoods.replace(/\ufffc|\s*/g, ''))}`);
        if (stopGoods && item.commTitle.indexOf(stopGoods.replace(/\ufffc|\s*/g, '')) > -1) {
          console.log(`匹配到了您设定的商品--${stopGoods}，不在进行取消关注商品`);
          break;
        }
        let res = await unsubscribeGoodsFun(item.commId);
        if (res.iRet === 0 && res.errMsg === 'success') {
          console.log(`取消关注商品---${item.commTitle.substring(0, 20).concat('...')}---成功`);
          $.unsubscribeGoodsCount++;
          console.log(`已成功取消关注【商品】：${$.unsubscribeGoodsCount}个\n`);
        } else {
          console.log(`取关商品失败：${JSON.stringify(res)}`);
          console.log(`取消关注商品---${item.commTitle.substring(0, 20).concat('...')}---失败\n`);
        }
        await $.wait(1000);
      }
    }
  } else {
    console.log(`获取已关注商品失败：${JSON.stringify(followGoods)}`);
  }
}

function getFollowGoods() {
  $.goodsTotalNum = 0;
  return new Promise((resolve) => {
    const option = {
      url: `${JD_API_HOST}/comm/FavCommQueryFilter?cp=1&pageSize=20&_=${Date.now()}&category=0&promote=0&cutPrice=0&coupon=0&stock=0&areaNo=1_72_4139_0&sceneval=2&g_login_type=1&callback=jsonpCBKB&g_ty=ls`,
      headers: {
        Host: 'wq.jd.com',
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
        Referer: 'https://wqs.jd.com/my/fav/goods_fav.shtml?ptag=37146.4.1&sceneval=2&jxsid=15963530166144677970',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    };
    $.get(option, async (err, resp, data) => {
      try {
        data = JSON.parse(data.slice(14, -13));
        if (data.iRet === '0') {
          $.goodsTotalNum = data.totalNum;
          console.log(`当前已关注【商品】：${$.goodsTotalNum}个\n`);
        } else {
          $.goodsTotalNum = 0;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function unsubscribeGoodsFun(commId) {
  return new Promise((resolve) => {
    const option = {
      url: `${JD_API_HOST}/comm/FavCommDel?commId=${commId}&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKP&g_ty=ls`,
      headers: {
        Host: 'wq.jd.com',
        Accept: '*/*',
        Connection: 'keep-alive',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        Referer: 'https://wqs.jd.com/my/fav/goods_fav.shtml?ptag=37146.4.1&sceneval=2&jxsid=15963530166144677970',
        Cookie: cookie,
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(data.slice(14, -13).replace(',}', '}'));
        // console.log('data', data);
        // console.log('data', data.errMsg);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

async function shopMain() {
  $.unsubscribeShopsCount = 0;
  if (shopPageSize * 1 !== 0) {
    await unsubscribeShops();
    const le = Math.ceil($.shopsTotalNum / 20) - 1 >= 0 ? Math.ceil($.shopsTotalNum / 20) - 1 : 0;
    for (let i = 0; i < new Array(le).length; i++) {
      await $.wait(100);
      await unsubscribeShops();
    }
  } else {
    console.log(`\n您设置的是不取关店铺\n`);
  }
}

async function unsubscribeShops() {
  let followShops = await getFollowShops();
  if (followShops.iRet === '0') {
    if (followShops.totalNum > 0) {
      for (let item of followShops.data) {
        if (stopShop && item.shopName && item.shopName.indexOf(stopShop.replace(/\s*/g, '')) > -1) {
          console.log(`匹配到了您设定的店铺--${item.shopName}，不在进行取消关注店铺`);
          break;
        }
        let res = await unsubscribeShopsFun(item.shopId);
        if (res.iRet === '0') {
          console.log(`取消已关注店铺---${item.shopName}----成功`);
          $.unsubscribeShopsCount++;
          console.log(`已成功取消关注【店铺】：${$.unsubscribeShopsCount}个\n`);
        } else {
          console.log(`取消已关注店铺---${item.shopName}----失败\n`);
        }
        await $.wait(1000);
      }
    }
  } else {
    console.log(`获取已关注店铺失败：${JSON.stringify(followShops)}`);
  }
}

function getFollowShops() {
  $.shopsTotalNum = 0;
  return new Promise((resolve) => {
    const option = {
      url: `${JD_API_HOST}/shop/QueryShopFavList?cp=1&pageSize=20&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKA&g_ty=ls`,
      headers: {
        Host: 'wq.jd.com',
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
        Referer: 'https://wqs.jd.com/my/fav/shop_fav.shtml?sceneval=2&jxsid=15963530166144677970&ptag=7155.1.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(data.slice(14, -13));
        if (data.iRet === '0') {
          $.shopsTotalNum = data.totalNum;
          console.log(`当前已关注【店铺】：${$.shopsTotalNum}个\n`);
        } else {
          $.shopsTotalNum = 0;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function unsubscribeShopsFun(shopId) {
  return new Promise((resolve) => {
    const option = {
      url: `${JD_API_HOST}/shop/DelShopFav?shopId=${shopId}&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKG&g_ty=ls`,
      headers: {
        Host: 'wq.jd.com',
        Accept: '*/*',
        Connection: 'keep-alive',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        Referer: 'https://wqs.jd.com/my/fav/shop_fav.shtml?sceneval=2&jxsid=15960121319555534107&ptag=7155.1.9',
        Cookie: cookie,
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(data.slice(14, -13));
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function requireConfig() {
  return new Promise((resolve) => {
    if ($.isNode() && process.env.UN_SUBSCRIBES) {
      if (process.env.UN_SUBSCRIBES.indexOf('&') > -1) {
        $.UN_SUBSCRIBES = process.env.UN_SUBSCRIBES.split('&');
      } else if (process.env.UN_SUBSCRIBES.indexOf('\n') > -1) {
        $.UN_SUBSCRIBES = process.env.UN_SUBSCRIBES.split('\n');
      } else if (process.env.UN_SUBSCRIBES.indexOf('\\n') > -1) {
        $.UN_SUBSCRIBES = process.env.UN_SUBSCRIBES.split('\\n');
      } else {
        $.UN_SUBSCRIBES = process.env.UN_SUBSCRIBES.split();
      }
      console.log(`您环境变量 UN_SUBSCRIBES 设置的内容为:\n${JSON.stringify($.UN_SUBSCRIBES)}`);
      goodPageSize = $.UN_SUBSCRIBES[0] || goodPageSize;
      shopPageSize = $.UN_SUBSCRIBES[1] || shopPageSize;
      stopGoods = $.UN_SUBSCRIBES[2] || stopGoods;
      stopShop = $.UN_SUBSCRIBES[3] || stopShop;
    }
    resolve();
  });
}

/*
update 2021/4/11
京东试用：脚本更新地址 https://raw.githubusercontent.com/ZCY01/daily_scripts/main/jd/jd_try.js
脚本兼容: QuantumultX, Node.js

非常耗时的脚本。最多可能执行半小时！
每天最多关注300个商店，但用户商店关注上限为500个。
请配合取关脚本试用，使用 jd_unsubscribe.js 提前取关至少250个商店确保京东试用脚本正常运行。
==========================Quantumultx=========================
[task_local]
# 取关京东店铺商品，请在 boxjs 修改取消关注店铺数量
5 10 * * * https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_unsubscribe.js, tag=取关京东店铺商品, enabled=true

# 京东试用
30 10 * * * https://raw.githubusercontent.com/ZCY01/daily_scripts/main/jd/jd_try.js, tag=京东试用, img-url=https://raw.githubusercontent.com/ZCY01/img/master/jdtryv1.png, enabled=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东试用');

const selfDomain = 'https://api.m.jd.com/client.action';
let allGoodsList = [];

// default params
const args = {
  jdNotify: process.env.TRY_NOTIFY_CONTROL,
  pageSize: 12,
  goodsFilters:
    '教程@流量@软件@英语@辅导@培训小靓美@脚气@文胸@卷尺@种子@档案袋@癣@中年@老太太@妇女@私处@孕妇@卫生巾@卫生条@课@培训@阴道@生殖器@肛门@狐臭@少女内衣@胸罩@洋娃娃@男孩玩具@女孩玩具@益智@少女@女性内衣@女性内裤@女内裤@女内衣@女孩@鱼饵@钓鱼@童装@吊带@黑丝@钢圈@婴儿@儿童@玩具@幼儿@娃娃@网课@网校@电商@手机壳@钢化膜@车载充电器@网络课程@女纯棉@三角裤@美少女@纸尿裤@英语@俄语@四级@六级@四六级@在线网络@在线@阴道炎@宫颈@糜烂@打底裤@手机膜@鱼@狗@看房游@手机卡'.split(
      '@'
    ),
  minPrice: 100,
  maxSupplyCount: 100,
};

const tabIds = {
  精选: 1,
  闪电试: 2,
  家用电器: 3,
  手机数码: 4,
  电脑办公: 5,
  家居家装: 6,
  更多惊喜: 16,
};

!(async () => {
  await requireConfig();
  if (!$.cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
      'open-url': 'https://bean.m.jd.com/',
    });
    return;
  }
  for (let i = 0; i < $.cookiesArr.length; i++) {
    if ($.cookiesArr[i]) {
      $.cookie = $.cookiesArr[i];
      $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      await $.totalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });
        await $.notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        continue;
      }

      $.goodsList = [];
      $.successList = [];
      $.currentPageSuccessList = [];
      if (i == 0) {
        await getGoodsList();
      }
      await filterGoodsList();

      $.totalTry = 0;
      $.totalGoods = $.goodsList.length;
      await tryGoodsList();
      page = 1;
      do {
        await getSuccessList(page);
        page++;
      } while ($.currentPageSuccessList.length == 12);

      await showMsg();
    }
  }
})()
  .catch((e) => {
    console.log(`${$.name} 运行错误！\n${e}`);
  })
  .finally(() => $.done());

function requireConfig() {
  return new Promise((resolve) => {
    console.log('开始获取配置文件\n');
    $.notify = $.isNode() ? require('./sendNotify') : { sendNotify: async () => {} };

    //获取 Cookies
    $.cookiesArr = [];
    if ($.isNode()) {
      //Node.js用户请在jdCookie.js处填写京东ck;
      const jdCookieNode = require('./jdCookie.js');
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          $.cookiesArr.push(jdCookieNode[item]);
        }
      });
      if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
    } else {
      //IOS等用户直接用NobyDa的jd $.cookie
      $.cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
    }
    console.log(`共${$.cookiesArr.length}个京东账号\n`);

    if ($.isNode()) {
      if (process.env.JD_TRY_GOODs_FILTERS) {
        args.goodsFilters = process.env.JD_TRY_GOODs_FILTERS.split('@');
      }
      if (process.env.JD_TRY_MIN_PRICE) {
        args.minPrice = process.env.JD_TRY_MIN_PRICE * 1;
      }
      if (process.env.JD_TRY_PAGE_SIZE) {
        args.pageSize = process.env.JD_TRY_PAGE_SIZE * 1;
      }
      if (process.env.JD_TRY_MAX_SUPPLY_COUNT) {
        args.maxSupplyCount = process.env.JD_TRY_MAX_SUPPLY_COUNT * 1;
      }
    } else {
      if ($.getdata('filter')) args.goodsFilters = $.getdata('filter').split('&');
      if ($.getdata('min_price')) args.minPrice = Number($.getdata('min_price'));
      if ($.getdata('page_size')) args.pageSize = Number($.getdata('page_size'));
      if ($.getdata('max_supply_count')) args.maxSupplyCount = Number($.getdata('max_supply_count'));
      if (args.pageSize == 0) args.pageSize = 12;
    }
    resolve();
  });
}
async function getGoodsList() {
  keys = Object.keys(tabIds);

  for (key of keys) {
    console.log(`获取 ${key} 商品列表`);
    $.totalPages = 1;
    for (let page = 1; page <= $.totalPages; page++) {
      if (page > 1) {
        break;
      }
      await getGoodsListByCond(key, tabIds[key], page);
    }
  }
}
async function getGoodsListByCond(tableName, tabId, page) {
  await $.wait(1000);
  return new Promise((resolve, reject) => {
    body = {
      tabId: tabId,
      page: page,
    };
    let data = {
      functionId: 'try_feedsList',
      body: JSON.stringify(body),
    };
    let option = getPostOption(selfDomain, data);
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.success) {
            $.totalPages = data.data.pages;
            allGoodsList = allGoodsList.concat(data.data.feedList);
          } else {
            console.log(`获得 ${tableName} ${page} 失败: ${data.message}`);
          }
        }
      } catch (e) {
        reject(`${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

async function filterGoodsList() {
  console.log(`过滤商品列表，当前共有${allGoodsList.length}个商品`);
  const now = Date.now();
  const oneMoreDay = now + 24 * 60 * 60 * 1000;
  for (goods of allGoodsList) {
    await $.wait(jd_helpers.randomNumber(2, 5) * 1000 + jd_helpers.randomNumber(1, 3) * 100);
    await getGoodsDetail(goods.trialActivityId).then(function (detail) {
      goodsDetail = detail;
    });
    // 1. goods 有问题
    // 2. goods 距离结束不到10min
    // 3. goods 的结束时间大于一天
    // 4. goods 的价格小于最小的限制
    // 5. goods 的试用数量大于 maxSupplyCount, 视为垃圾商品
    // 6. goods applyState == 1 为已申请
    if (!goods || goods.applyState == 1 || !goodsDetail || goodsDetail.activityEndTime < now + 10 * 60 * 1000 || goodsDetail.activityEndTime > oneMoreDay || goodsDetail.price < args.minPrice) {
      // console.log('goods', goods)
      // console.log('!goods', !goods);
      // console.log('goods.applyState == 1', goods.applyState == 1);
      // console.log('!goodsDetail', !goodsDetail);
      // console.log('goodsDetail.activityEndTime < now + 10 * 60 * 1000', goodsDetail.activityEndTime < now + 10 * 60 * 1000);
      // console.log('goodsDetail.activityEndTime > oneMoreDay', goodsDetail.activityEndTime > oneMoreDay);
      // console.log('goodsDetail.price < args.minPrice', goodsDetail.price < args.minPrice);
      continue;
    }

    for (let item of args.goodsFilters) {
      if (goods.skuTitle.indexOf(item) != -1) {
        // console.log('goods filters', goods)
        continue;
      }
    }

    if (goods.supplyCount > args.maxSupplyCount) {
      // console.log('goods.supplyCount > args.maxSupplyCount', goods.supplyCount > args.maxSupplyCount);
      continue;
    }

    $.goodsList.push(goods);
  }

  $.goodsList = $.goodsList.sort((a, b) => {
    return b.jdPrice - a.jdPrice;
  });
}

async function tryGoodsList() {
  console.log(`即将申请 ${$.goodsList.length} 个商品`);
  $.running = true;
  $.stopMsg = '申请完毕';

  for (let i = 0; i < $.goodsList.length && $.running; i++) {
    let goods = $.goodsList[i];
    await $.wait(5000 + jd_helpers.randomNumber(1, 10) * 100);
    await doTry(goods);
  }
}

async function doTry(goods) {
  return new Promise((resolve, reject) => {
    body = { activityId: goods.trialActivityId };
    let data = {
      functionId: 'try_apply',
      body: JSON.stringify(body),
    };
    let option = getPostOption(selfDomain, data);
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.success) {
            $.totalTry += 1;
            console.log(`${goods.sku} ${goods.skuTitle.substr(0, 15)} ${data.message}`);
          } else if (data.code == '-131') {
            // 每日300个商品
            $.stopMsg = data.message;
            $.running = false;
          } else {
            console.log(`${goods.sku} ${goods.skuTitle.substr(0, 15)} ${JSON.stringify(data)}`);
          }
        }
      } catch (e) {
        reject(`${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

async function getSuccessList(page) {
  // 一页12个商品
  await $.wait(2000);

  return new Promise((resolve, reject) => {
    body = { selected: 2, page: page };
    let data = {
      functionId: 'try_MyTrials',
      body: JSON.stringify(body),
    };
    let option = getPostOption(selfDomain, data);
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.success && data.data) {
            $.currentPageSuccessList = data.data.list;
            $.successList = $.successList.concat(
              data.data.list.filter((item) => {
                return item.text.text.indexOf('请尽快领取') != -1;
              })
            );
          } else {
            console.log(`获得成功列表失败: ${data.message}`);
          }
        }
      } catch (e) {
        reject(`${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

async function getGoodsDetail(activityId) {
  return new Promise((resolve, reject) => {
    body = { activityId: activityId };
    let data = {
      functionId: 'try_detail',
      body: JSON.stringify(body),
    };
    let option = getGetOption(selfDomain, data);

    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);

          if (!data.success) {
            console.log(`获得 ${activityId} 试用商品详情失败: ${data.message}`);
          }
        }
      } catch (e) {
        reject(`${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve(data.data);
      }
    });
  });
}

async function showMsg() {
  let message = `京东账号${$.index} ${$.nickName || $.UserName}\n 本次申请：${$.totalTry}/${$.totalGoods}个商品\n ${$.successList.length}个商品待领取\n 结束原因：${$.stopMsg}`;
  if (!args.jdNotify || args.jdNotify === 'false' || $.successList.length > 0) {
    $.msg($.name, ``, message, {
      'open-url': 'https://try.m.jd.com/user',
    });
    await $.notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, message);
  } else {
    console.log(message);
  }
}

function getPostOption(url, data) {
  default_data = { appid: 'newtry' };
  body = jd_helpers.serializeEncodeURI(Object.assign(default_data, data));

  return {
    url: url,
    body: body,
    headers: {
      Cookie: $.cookie,
      Origin: 'https://prodev.m.jd.com',
    },
  };
}

function getGetOption(url, data) {
  default_data = { appid: 'newtry' };
  body = jd_helpers.serializeEncodeURI(Object.assign(default_data, data));

  return {
    url: `${url}?${body}`,
    headers: {
      Cookie: $.cookie,
      Origin: 'https://prodev.m.jd.com',
    },
  };
}

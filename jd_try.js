/*
update 2021/4/11
京东试用：脚本更新地址 https://raw.githubusercontent.com/ZCY01/daily_scripts/main/jd/jd_try.js
脚本兼容: QuantumultX, Node.js

⚠️ 非常耗时的脚本。最多可能执行半小时！
每天最多关注300个商店，但用户商店关注上限为500个。
请配合取关脚本试用，使用 jd_unsubscribe.js 提前取关至少250个商店确保京东试用脚本正常运行。
==========================Quantumultx=========================
[task_local]
# 取关京东店铺商品，请在 boxjs 修改取消关注店铺数量
5 10 * * * https://raw.githubusercontent.com/lxk0301/jd_scripts/master/jd_unsubscribe.js, tag=取关京东店铺商品, enabled=true

# 京东试用
30 10 * * * https://raw.githubusercontent.com/ZCY01/daily_scripts/main/jd/jd_try.js, tag=京东试用, img-url=https://raw.githubusercontent.com/ZCY01/img/master/jdtryv1.png, enabled=true
 */
const $ = new Env("京东试用");

const selfDomain = "https://try.m.jd.com";
let allGoodList = [];

// default params
const args = {
  jdNotify: false,
  pageSize: 12,
  cidsList: ["家用电器", "手机数码", "电脑办公", "家居家装"],
  typeList: ["普通试用", "闪电试用"],
  goodFilters:
    "教程@流量@软件@英语@辅导@培训小靓美@脚气@文胸@卷尺@种子@档案袋@癣@中年@老太太@妇女@私处@孕妇@卫生巾@卫生条@课@培训@阴道@生殖器@肛门@狐臭@少女内衣@胸罩@洋娃娃@男孩玩具@女孩玩具@益智@少女@女性内衣@女性内裤@女内裤@女内衣@女孩@鱼饵@钓鱼@童装@吊带@黑丝@钢圈@婴儿@儿童@玩具@幼儿@娃娃@网课@网校@电商@手机壳@钢化膜@车载充电器@网络课程@女纯棉@三角裤@美少女@纸尿裤@英语@俄语@四级@六级@四六级@在线网络@在线@阴道炎@宫颈@糜烂@打底裤@手机膜@鱼@狗@看房游@手机卡".split(
      "@"
    ),
  minPrice: 100,
  maxSupplyCount: 10,
};

const cidsMap = {
  全部商品: "0",
  家用电器: "737",
  手机数码: "652,9987",
  电脑办公: "670",
  家居家装: "1620,6728,9847,9855,6196,15248,14065",
  美妆护肤: "1316",
  服饰鞋包: "1315,1672,1318,11729",
  母婴玩具: "1319,6233",
  生鲜美食: "12218",
  图书音像: "1713,4051,4052,4053,7191,7192,5272",
  钟表奢品: "5025,6144",
  个人护理: "16750",
  家庭清洁: "15901",
  食品饮料: "1320,12259",
  更多惊喜: "4938,13314,6994,9192,12473,6196,5272,12379,13678,15083,15126,15980",
};
const typeMap = {
  全部试用: "0",
  普通试用: "1",
  闪电试用: "2",
  "30天试用": "5",
};

!(async () => {
  await requireConfig();
  if (!$.cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/", {
      "open-url": "https://bean.m.jd.com/",
    });
    return;
  }
  for (let i = 0; i < $.cookiesArr.length; i++) {
    if ($.cookiesArr[i]) {
      $.cookie = $.cookiesArr[i];
      $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      await totalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action",
        });
        await $.notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        continue;
      }

      $.goodList = [];
      $.successList = [];
      if (i == 0) {
        await getGoodList();
      }
      await filterGoodList();

      $.totalTry = 0;
      $.totalGoods = $.goodList.length;
      await tryGoodList();
      await getSuccessList();

      await showMsg();
    }
  }
})()
  .catch((e) => {
    console.log(`❗️ ${$.name} 运行错误！\n${e}`);
  })
  .finally(() => $.done());

function requireConfig() {
  return new Promise((resolve) => {
    console.log("开始获取配置文件\n");
    $.notify = $.isNode() ? require("./sendNotify") : { sendNotify: async () => {} };

    //获取 Cookies
    $.cookiesArr = [];
    if ($.isNode()) {
      //Node.js用户请在jdCookie.js处填写京东ck;
      const jdCookieNode = require("./jdCookie.js");
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) {
          $.cookiesArr.push(jdCookieNode[item]);
        }
      });
      if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
    } else {
      //IOS等用户直接用NobyDa的jd $.cookie
      $.cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
    }
    console.log(`共${$.cookiesArr.length}个京东账号\n`);

    if ($.isNode()) {
      if (process.env.JD_TRY_CIDS_KEYS) {
        args.cidsList = process.env.JD_TRY_CIDS_KEYS.split("@").filter((key) => {
          return Object.keys(cidsMap).includes(key);
        });
      }
      if (process.env.JD_TRY_TYPE_KEYS) {
        args.typeList = process.env.JD_TRY_CIDS_KEYS.split("@").filter((key) => {
          return Object.keys(typeMap).includes(key);
        });
      }
      if (process.env.JD_TRY_GOOD_FILTERS) {
        args.goodFilters = process.env.JD_TRY_GOOD_FILTERS.split("@");
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
      let qxCidsList = [];
      let qxTypeList = [];
      const cidsKeys = Object.keys(cidsMap);
      const typeKeys = Object.keys(typeMap);
      for (let key of cidsKeys) {
        const open = $.getdata(key);
        if (open == "true") qxCidsList.push(key);
      }
      for (let key of typeKeys) {
        const open = $.getdata(key);
        if (open == "true") qxTypeList.push(key);
      }
      if (qxCidsList.length != 0) args.cidsList = qxCidsList;
      if (qxTypeList.length != 0) args.typeList = qxTypeList;
      if ($.getdata("filter")) args.goodFilters = $.getdata("filter").split("&");
      if ($.getdata("min_price")) args.minPrice = Number($.getdata("min_price"));
      if ($.getdata("page_size")) args.pageSize = Number($.getdata("page_size"));
      if ($.getdata("max_supply_count")) args.maxSupplyCount = Number($.getdata("max_supply_count"));
      if (args.pageSize == 0) args.pageSize = 12;
    }
    resolve();
  });
}

function getGoodListByCond(cids, page, pageSize, type, state) {
  return new Promise((resolve, reject) => {
    let option = taskurl(`${selfDomain}/activity/list?pb=1&cids=${cids}&page=${page}&pageSize=${pageSize}&type=${type}&state=${state}`);
    delete option.headers["Cookie"];
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.success) {
            $.totalPages = data.data.pages;
            allGoodList = allGoodList.concat(data.data.data);
          } else {
            console.log(`💩 获得 ${cids} ${page} 列表失败: ${data.message}`);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

async function getGoodList() {
  if (args.cidsList.length === 0) args.cidsList.push("全部商品");
  if (args.typeList.length === 0) args.typeList.push("全部试用");
  for (let cidsKey of args.cidsList) {
    for (let typeKey of args.typeList) {
      if (!cidsMap.hasOwnProperty(cidsKey) || !typeMap.hasOwnProperty(typeKey)) continue;
      console.log(`⏰ 获取 ${cidsKey} ${typeKey} 商品列表`);
      $.totalPages = 1;
      for (let page = 1; page <= $.totalPages; page++) {
        await getGoodListByCond(cidsMap[cidsKey], page, args.pageSize, typeMap[typeKey], "0");
      }
    }
  }
}

async function filterGoodList() {
  console.log(`⏰ 过滤商品列表，当前共有${allGoodList.length}个商品`);
  const now = Date.now();
  const oneMoreDay = now + 24 * 60 * 60 * 1000;
  $.goodList = allGoodList.filter((good) => {
    // 1. good 有问题
    // 2. good 距离结束不到10min
    // 3. good 的结束时间大于一天
    // 4. good 的价格小于最小的限制
    // 5. good 的试用数量大于 maxSupplyCount, 视为垃圾商品
    if (!good || good.endTime < now + 10 * 60 * 1000 || good.endTime > oneMoreDay || good.jdPrice < args.minPrice) {
      return false;
    }
    for (let item of args.goodFilters) {
      if (good.trialName.indexOf(item) != -1) return false;
    }
    if (good.supplyCount > args.maxSupplyCount) {
      return false;
    }
    return true;
  });
  await getApplyStateByActivityIds();
  $.goodList = $.goodList.sort((a, b) => {
    return b.jdPrice - a.jdPrice;
  });
}

async function getApplyStateByActivityIds() {
  function opt(ids) {
    return new Promise((resolve, reject) => {
      $.get(taskurl(`${selfDomain}/getApplyStateByActivityIds?activityIds=${ids.join(",")}`), (err, resp, data) => {
        try {
          if (err) {
            console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
          } else {
            data = JSON.parse(data);
            ids.length = 0;
            for (let apply of data) ids.push(apply.activityId);
          }
        } catch (e) {
          reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
        } finally {
          $.goodList = $.goodList.filter((good) => {
            for (let id of ids) {
              if (id == good.id) {
                return false;
              }
            }
            return true;
          });
          resolve();
        }
      });
    });
  }

  let list = [];
  for (let good of $.goodList) {
    list.push(good.id);
    if (list.length == args.pageSize) {
      await opt(list);
      list.length = 0;
    }
  }
  if (list.length) await opt(list);
}

function canTry(good) {
  return new Promise((resolve, reject) => {
    let ret = false;
    $.get(taskurl(`${selfDomain}/activity?id=${good.id}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          ret = data.indexOf("trySku") != -1;
          let result = data.match(/"shopId":(\d+)/);
          if (result) {
            good.shopId = eval(result[1]);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve(ret);
      }
    });
  });
}

function isFollowed(good) {
  return new Promise((resolve, reject) => {
    $.get(taskurl(`${selfDomain}/isFollowed?id=${good.shopId}`, good.id), (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          resolve(data.success && data.data);
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve(false);
      }
    });
  });
}

function followShop(good) {
  return new Promise((resolve, reject) => {
    $.get(taskurl(`${selfDomain}/followShop?id=${good.shopId}`, good.id), (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.code == "F0410") {
            $.running = false;
            $.stopMsg = data.msg || "关注数超过上限了哦~先清理下关注列表吧";
          }
          resolve(data.success && data.data);
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve(false);
      }
    });
  });
}

async function tryGoodList() {
  console.log(`⏰ 即将申请 ${$.goodList.length} 个商品`);
  $.running = true;
  $.stopMsg = "申请完毕";
  for (let i = 0; i < $.goodList.length && $.running; i++) {
    let good = $.goodList[i];
    if (!(await canTry(good))) continue;
    // 如果没有关注且关注失败
    if (good.shopId && !(await isFollowed(good)) && !(await followShop(good))) continue;
    // 两个申请间隔不能太短，放在下面有利于确保 follwShop 完成
    await $.wait(5000);
    // 关注完毕，即将试用
    await doTry(good);
  }
}

async function doTry(good) {
  return new Promise((resolve, reject) => {
    $.get(taskurl(`${selfDomain}/migrate/apply?activityId=${good.id}&source=1&_s=m`, good.id), (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.success) {
            $.totalTry += 1;
            console.log(`🥳 ${good.id} 🛒${good.trialName.substr(0, 15)}🛒 ${data.message}`);
          } else if (data.code == "-131") {
            // 每日300个商品
            $.stopMsg = data.message;
            $.running = false;
          } else {
            console.log(`🤬 ${good.id} 🛒${good.trialName.substr(0, 15)}🛒 ${JSON.stringify(data)}`);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

async function getSuccessList() {
  // 一页12个商品，不会吧不会吧，不会有人一次性中奖12个商品吧？！🤔
  return new Promise((resolve, reject) => {
    const option = {
      url: `https://try.jd.com/my/tryList?selected=2&page=1&tryVersion=2&_s=m`,
      headers: {
        Host: "try.jd.com",
        Connection: "keep-alive",
        UserAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
        Accept: "*/*",
        Referer: "https://try.m.jd.com/",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh,zh-CN;q=0.9,en;q=0.8",
        Cookie: $.cookie,
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.success && data.data) {
            $.successList = data.data.data.filter((item) => {
              return item.text.text.indexOf("请尽快领取") != -1;
            });
          } else {
            console.log(`💩 获得成功列表失败: ${data.message}`);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

async function showMsg() {
  let message = `京东账号${$.index} ${$.nickName || $.UserName}\n🎉 本次申请：${$.totalTry}/${$.totalGoods}个商品🛒\n🎉 ${$.successList.length}个商品待领取🤩\n🎉 结束原因：${$.stopMsg}`;
  if (!args.jdNotify || args.jdNotify === "false") {
    $.msg($.name, ``, message, {
      "open-url": "https://try.m.jd.com/user",
    });
    await $.notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, message);
  } else {
    console.log(message);
  }
}

function taskurl(url, goodId) {
  return {
    url: url,
    headers: {
      Host: "try.m.jd.com",
      "Accept-Encoding": "gzip, deflate, br",
      Cookie: $.cookie,
      Connection: "keep-alive",
      Accept: "*/*",
      UserAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
      "Accept-Language": "zh-cn",
      Referer: goodId ? `https://try.m.jd.com/activity/?id=${goodId}` : undefined,
    },
  };
}

function totalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      headers: {
        Accept: "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        Connection: "keep-alive",
        Cookie: $.cookie,
        Referer: "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require("./USER_AGENTS").USER_AGENT
          : $.getdata("JDUA")
          ? $.getdata("JDUA")
          : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      },
      timeout: 10000,
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data["retcode"] === 13) {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data["retcode"] === 0) {
              $.nickName = (data["base"] && data["base"].nickname) || $.UserName;
            } else {
              $.nickName = $.UserName;
            }
          } else {
            console.log(`京东服务器返回空数据`);
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

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, "", "请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie");
      return [];
    }
  }
}



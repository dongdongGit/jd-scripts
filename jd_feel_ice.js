/*
cron 6  9,12 * * * https://raw.githubusercontent.com/Wenmoux/scripts/wen/jd/jd_mb.js
https://xinrui2-isv.isvjcloud.com/jd-tourism/load_app/load_app.html
更新地址：https://raw.githubusercontent.com/Wenmoux/scripts/wen/jd/jd_ddnc_farmpark.js
============Quantumultx===============
[task_local]
# 入口：京东家电-清凉一夏-摸冰领补贴
6 9,12 * * * https://raw.githubusercontent.com/Wenmoux/scripts/wen/jd/jd_mb.js, tag=全民摸冰, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
*/
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("全民摸冰");
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
const randomCount = $.isNode() ? 20 : 5;
const notify = $.isNode() ? require("./sendNotify") : "";
let merge = {};
let codeList = [];
Exchange = $.isNode() ? (process.env.Cowexchange ? process.env.Cowexchange : false) : $.getdata("Cowexchange") ? $.getdata("Cowexchange") : false;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "";
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_helpers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = `https://api.m.jd.com/client.action`;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/", {
      "open-url": "https://bean.m.jd.com/",
    });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.needhelp = true;
      $.coolcoins = 0;
      $.nickName = "";
      $.Authorization = "Bearer undefined";
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          "open-url": "https://bean.m.jd.com/bean/signIndex.action",
        });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await genToken();
      authres = await taskPostUrl("auth", {
        token: $.token,
        source: "01",
      });
      $.Authorization = `Bearer ${authres.access_token}`;
      user = await taskUrl("get_user_info", "");
      console.log(`昵称：${user.nickname}\n剩余挑战值：${user.coins}\n清凉值：${user.cool_coins}\n今日已抽奖次数：${user.today_lottery_times}`);
      taskList = await taskUrl("task_state", "");
      productList = await taskUrl("shop_products", "");
      for (var o in taskList) {
        switch (o) {
          case "sign_in":
            console.log("每日签到：");
            if (taskList[o] == "1") console.log("  今日已签到");
            else {
              console.log("  去签到");
              await taskUrl(o, "");
            }
            break;
          case "product_view": //浏览商品
            console.log("浏览商品：");
            console.log(`  今日已浏览${taskList[o].length}个商品`);
            if (taskList[o].length != 12) {
              pList = productList.products.filter((x) => taskList[o].indexOf(x.id) == "-1");
              for (product of pList) {
                console.log(`  去浏览${product.name} `);
                await taskUrl("product_view", `?product_id=${product.id}`);
              }
            }
            break;
          case "shop_view": //关注浏览店铺
            console.log("浏览店铺：");
            console.log(`  今日已浏览${taskList[o].length}个商品`);
            if (taskList[o].length < 6) {
              shopList = productList.shops.filter((x) => taskList[o].indexOf(x.id) == "-1");
              for (shop of shopList) {
                console.log(`  去浏览${shop.name} `);
                await taskUrl("shop_view", `?shop_id=${shop.id}`);
              }
            }
            break;
          case "today_invite_num": //邀请
            console.log("邀请助力：");
            console.log(`  已邀请${taskList[o].length}个小伙伴`);
            if (taskList[o].length < 5) codeList.push(user.id);
            break;
          case "meetingplace": //浏览会场
            console.log("浏览会场：");
            console.log(`  今日已浏览${taskList[o].length}会场`);
            if (taskList[o].length < 8) {
              meetingList = productList.meetingplace.filter((x) => taskList[o].indexOf(x.id) == "-1");
              for (meetingplace of meetingList) {
                console.log(`  去浏览${meetingplace.name} `);
                await taskUrl("meetingplace_view", `?meetingplace_id=${meetingplace.id}`);
              }
            }
            break;
          default:
            break;
        }
      }
      user = await taskUrl("get_user_info", "");
      console.log("去玩游戏");
      for (u = 0; u < Math.floor(user.coins / 3); u++) {
        console.log(`  第${u + 1}次游戏中`);
        //开始游戏
        let stares = await taskUrl("start_game", "");
        if (stares.token) {
          console.log("  开始游戏成功");
          await $.wait(10000);
          await taskUrl("game", `?token=${stares.token}&score=110`);
        }
      }
      console.log("去抽奖");
      for (t = 0; t < 5 - user.today_lottery_times; t++) {
        let lotteryes = await taskUrl("to_lottery", "");
        console.log(lotteryes);
        if (lotteryes.gift) {
          console.log(`恭喜你获得 ${lotteryes.gift.prize.name} 类型： ${lotteryes.gift.type.match("coupon") ? "优惠券" : lotteryes.gift.type}`);
        } else {
          console.log("未抽中");
        }
      }
      for (p = 0; p < codeList.length; p++) {
        console.log(`为${codeList[p]}助力中...`);
        await taskUrl("invite", `?inviter_id=${codeList[p]}`);
      }
    }
  }
  if (message?.length != 0 && new Date().getHours() == 11) {
    if ($.isNode()) {
      //    await notify.sendNotify("星系牧场", `${message}\n牧场入口：QQ星儿童牛奶京东自营旗舰店->星系牧场\n\n吹水群：https://t.me/wenmouxx`);
    } else {
      $.msg($.name, "", "全民摸冰" + message);
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());
//获取活动信息

//genToken
function genToken() {
  let config = {
    url: "https://api.m.jd.com/client.action?functionId=isvObfuscator&clientVersion=10.0.8&build=89053&client=android&d_brand=HUAWEI&d_model=FRD-AL10&osVersion=8.0.0&screen=1792*1080&partner=huawei&oaid=7afefff5-fffe-40ee-f3de-ffe2ff2fe001&eid=eidAe19a8122a1s2xg+0aWybTLCCATsD6oJbEcYPteQMa3ttkXFlkcAdMo+uVF++BjcBVVNjMkIoFnW2bzHDBnLN0aukEYW72btJTe2aQ4xqyuZqRExl&sdkVersion=26&lang=zh_CN&uuid=5f3a6b660a7d29be&aid=5f3a6b660a7d29be&area=27_2442_2444_31912&networkType=4g&wifiBssid=unknown&uts=0f31TVRjBSsqndu4%2FjgUPz6uymy50MQJNuUBMiXpghp5mwBH3zhv1rOuSPEwsLjdPic0zNM6Lj6PpFnIuEOquU1jRYinqzNTeY4975Q%2BY0bAj1wlPztJiG9oagIGX5VE2sOe5rDgMdLlMkXFRaAAR9poPzL4f6KOaDmmcpTJFuB%2BkHswe5crq3X4UvjWD8PmvNm8KpDaQmvW6sbcOUE7Vw%3D%3D&uemps=0-0&harmonyOs=0&st=1626874286410&sign=c1bbfde69bd0d06fc19db58dff7291f5&sv=102",
    body: "body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fxinrui2-isv.isvjcloud.com%22%7D&",
    headers: {
      Host: "api.m.jd.com",
      accept: "*/*",
      "user-agent": "JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)",
      "accept-language": "zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6",
      "content-type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
  };
  return new Promise((resolve) => {
    $.post(config, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
          console.log(`${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          $.token = data["token"];
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function taskUrl(url, data) {
  let body = {
    url: `https://xinrui2-isv.isvjcloud.com/api/${url}${data}`,
    headers: {
      Host: "xinrui2-isv.isvjcloud.com",
      //     'Accept': 'application/x.jd-school-raffle.v1+json',
      "X-Requested-With": "XMLHttpRequest",
      Authorization: $.Authorization,
      //    X-Requested-With: "XMLHttpRequest",
      //       source: "01",
      Referer: "https://xinrui2-isv.isvjcloud.com/jd-tourism/loading/?channel=zjyy&sid=ff8ed71432ebffb00b0caf9c6e7673ew&un_area=27_2442_2444_31912",
      "user-agent":
        "jdapp;android;10.0.4;11;2393039353533623-7383235613364343;network/wifi;model/Redmi K30;addressid/138549750;aid/290955c2782e1c44;oaid/b30cf82cacfa8972;osVer/30;appBuild/88641;partner/xiaomi001;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 11; Redmi K30 Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045537 Mobile Safari/537.36",
      //     'content-type': 'application/x-www-form-urlencoded',
      //     'Cookie': `${cookie} ;`,
    },
  };
  //   console.log(body.url)
  return new Promise((resolve) => {
    $.get(body, async (err, resp, data) => {
      try {
        if (err) {
          //     console.log(`${err}`)
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          //      console.log(data)
          data = JSON.parse(data);
          if (data.coins && url != "get_user_info") console.log(`    操作成功,当前挑战值${data.coins}`);
          if (data.get_cool_coins) {
            console.log(`    操作成功,获得清凉值${data.get_cool_coins},当前清凉值${data.user_cool_coins}`);
          }
          resolve(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function taskPostUrl(url, data) {
  let body = {
    url: `https://xinrui2-isv.isvjcloud.com/api/${url}`,
    json: data,
    headers: {
      Host: "xinrui2-isv.isvjcloud.com",
      Accept: "application/x.jd-school-raffle.v1+json",
      //     'X-Requested-With': 'XMLHttpRequest',
      Authorization: $.Authorization,
      Referer: "https://xinrui2-isv.isvjcloud.com/jd-tourism/loading/?channel=zjyy&sid=ff8ed71432ebffb00b0caf9c6e7673ew&un_area=27_2442_2444_31912",
      "user-agent":
        "jdapp;android;10.0.4;11;2393039353533623-7383235613364343;network/wifi;model/Redmi K30;addressid/138549750;aid/290955c2782e1c44;oaid/b30cf82cacfa8972;osVer/30;appBuild/88641;partner/xiaomi001;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 11; Redmi K30 Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045537 Mobile Safari/537.36",
      //     'content-type': 'application/x-www-form-urlencoded',
      //     'Cookie': `${cookie} ;`,
    },
  };
  return new Promise((resolve) => {
    $.post(body, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          resolve(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

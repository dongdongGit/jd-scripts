/*
 * 粉丝互动，没啥水
 * 修改温某的脚本，由于温某不干活，只能自己动手修改了
 * 注意：脚本会加购，脚本会加购，脚本会加购
 * 若发现脚本里没有的粉丝互动活动。欢迎反馈给我
 * cron  34 6,18 * * *
 * */
const $ = new Env("粉丝互动");
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
const notify = $.isNode() ? require("./sendNotify") : "";
let cookiesArr = [];
const activityList = [
  { actid: "4d2f7df45a0e4a1b8d663e7da0fc0d0d", endTime: 1628394029000 },
  { actid: "4776be60946e45b1847bd982e24b4aa9", endTime: 1628438400000 },
  { actid: "c75ae2afd7ff4aec9ed47008b08400f7", endTime: 1630288800000 },
  { actid: "ea52a4da34d34be0a1c6470bd7d92063", endTime: 1628352000000 },
  { actid: "3da50af9e8664746844c5456b8920b7d", endTime: 1630425599000 },
  { actid: "4374884673374f9c883d21ceea5694f1", endTime: 1628524799000 },
  { actid: "162c43699ba945e8adb83b2bd5fe0142", endTime: 1630425599000 },
  { actid: "31073025b8a34de59d8d55faffdd44ab", endTime: 1630425599000 },
  { actid: "5a8aea7f27b84900a14624fe9dcc8fe1", endTime: 1628956799000 },
  { actid: "f61f162f3b9d4e3eb457f2193bf12b80", endTime: 1628611199000 },
  { actid: "58121dee0d84428bbdeb83934ffa1b80", endTime: 1630425599000 },
  { actid: "d3a8802bb5fe442dab38d1deaf2fffd7", endTime: 1630425599000 }, //需要入会
  { actid: "5cd5b2ad1d284ea6bcc4b7e05baf4b7d", endTime: 1628611200000 }, //需要入会
];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    await getUA();
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.oldcookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = "";
    await TotalBean();
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        "open-url": "https://bean.m.jd.com/bean/signIndex.action",
      });
      if ($.isNode()) {
        await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
      }
      continue;
    }
    $.hotFlag = false;
    for (let j = 0; j < activityList.length && !$.hotFlag; j++) {
      $.activityInfo = activityList[j];
      $.activityID = $.activityInfo.actid;
      console.log(`互动ID：${JSON.stringify($.activityInfo)}`);
      if ($.activityInfo.endTime && Date.now() > $.activityInfo.endTime) {
        console.log(`活动已结束`);
        continue;
      }
      await main();
      await $.wait(1000);
      console.log("\n");
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

async function main() {
  $.token = ``;
  await getToken();
  if ($.token === ``) {
    console.log(`获取token失败`);
    return;
  }
  console.log(`token:${$.token}`);
  await $.wait(1000);
  await getActCk();
  $.shopId = ``;
  await takePostRequest("getSimpleActInfoVo");
  if ($.shopid === ``) {
    console.log(`获取shopid失败`);
    return;
  }
  console.log(`shopid:${$.shopid}`);
  await $.wait(1000);
  $.pin = "";
  await takePostRequest("getMyPing");
  if ($.pin === ``) {
    $.hotFlag = true;
    console.log(`获取pin失败,该账号可能是黑号`);
    return;
  }
  $.cookie = $.cookie + `AUTH_C_USER=${$.pin}`;
  await $.wait(1000);
  await accessLogWithAD();
  $.cookie = $.cookie + `AUTH_C_USER=${$.pin}`;
  await $.wait(1000);
  $.activityData = {};
  $.actinfo = "";
  $.actorInfo = "";
  $.nowUseValue = 0;
  await takePostRequest("activityContent");
  if (JSON.stringify($.activityData) === `{}`) {
    console.log(`获取活动详情失败`);
    return;
  }
  let date = new Date($.activityData.actInfo.endTime);
  let endtime = date.getFullYear() + "-" + (date.getMonth() < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1) + "-" + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate());
  console.log(`${$.actinfo.actName},${$.actinfo.shopName},当前积分：${$.nowUseValue},结束时间：${endtime}，${$.activityData.actInfo.endTime}`);
  if ($.actorInfo.prizeOneStatus && $.actorInfo.prizeTwoStatus && $.actorInfo.prizeThreeStatus) {
    console.log(`已完成抽奖`);
    return;
  }
  await $.wait(1000);
  $.memberInfo = {};
  await takePostRequest("getActMemberInfo");
  if ($.memberInfo.actMemberStatus === 1 && !$.memberInfo.openCard) {
    console.log(`\n====================该活动需要入会,如需执行，请先手动入会====================`);
    return;
  }
  await $.wait(1000);
  $.upFlag = false;
  await doTask();
  await luckDraw(); //抽奖
}

async function luckDraw() {
  if ($.upFlag) {
    await takePostRequest("activityContent");
    await $.wait(1000);
  }
  let nowUseValue = Number($.activityData.actorInfo.fansLoveValue) + Number($.activityData.actorInfo.energyValue);
  if (nowUseValue >= $.activityData.actConfig.prizeScoreOne && $.activityData.actorInfo.prizeOneStatus === false) {
    console.log(`开始第一次抽奖`);
    $.drawType = "01";
    await takePostRequest("startDraw");
    await $.wait(1000);
  }
  if (nowUseValue >= $.activityData.actConfig.prizeScoreTwo && $.activityData.actorInfo.prizeTwoStatus === false) {
    console.log(`开始第二次抽奖`);
    $.drawType = "02";
    await takePostRequest("startDraw");
    await $.wait(1000);
  }
  if (nowUseValue >= $.activityData.actConfig.prizeScoreThree && $.activityData.actorInfo.prizeThreeStatus === false) {
    console.log(`开始第三次抽奖`);
    $.drawType = "03";
    await takePostRequest("startDraw");
    await $.wait(1000);
  }
}
async function doTask() {
  $.runFalag = true;
  if ($.activityData.task1Sign && $.activityData.task1Sign.finishedCount === 0) {
    console.log(`执行每日签到`);
    await takePostRequest("doSign");
    await $.wait(2000);
    $.upFlag = true;
  } else {
    console.log(`已签到`);
  }
  let needFinishNumber = 0;
  //浏览货品任务
  if ($.activityData.task2BrowGoods && $.runFalag) {
    if ($.activityData.task2BrowGoods.finishedCount !== $.activityData.task2BrowGoods.upLimit) {
      needFinishNumber = Number($.activityData.task2BrowGoods.upLimit) - Number($.activityData.task2BrowGoods.finishedCount);
      console.log(`开始做浏览商品任务`);
      $.upFlag = true;
      for (let i = 0; i < $.activityData.task2BrowGoods.taskGoodList.length && needFinishNumber > 0 && $.runFalag; i++) {
        $.oneGoodInfo = $.activityData.task2BrowGoods.taskGoodList[i];
        if ($.oneGoodInfo.finished === false) {
          console.log(`浏览:${$.oneGoodInfo.skuName || ""}`);
          await takePostRequest("doBrowGoodsTask");
          await $.wait(2000);
          needFinishNumber--;
        }
      }
    } else {
      console.log(`浏览商品任务已完成`);
    }
  }
  //加购商品任务
  if ($.activityData.task3AddCart && $.runFalag) {
    if ($.activityData.task3AddCart.finishedCount !== $.activityData.task3AddCart.upLimit) {
      needFinishNumber = Number($.activityData.task3AddCart.upLimit) - Number($.activityData.task3AddCart.finishedCount);
      console.log(`开始做加购商品任务`);
      $.upFlag = true;
      for (let i = 0; i < $.activityData.task3AddCart.taskGoodList.length && needFinishNumber > 0 && $.runFalag; i++) {
        $.oneGoodInfo = $.activityData.task3AddCart.taskGoodList[i];
        if ($.oneGoodInfo.finished === false) {
          console.log(`加购:${$.oneGoodInfo.skuName || ""}`);
          await takePostRequest("doAddGoodsTask");
          await $.wait(2000);
          needFinishNumber--;
        }
      }
    } else {
      console.log(`加购商品已完成`);
    }
  }
  //分享任务
  if ($.activityData.task4Share && $.runFalag) {
    if ($.activityData.task4Share.finishedCount !== $.activityData.task4Share.upLimit) {
      needFinishNumber = Number($.activityData.task4Share.upLimit) - Number($.activityData.task4Share.finishedCount);
      console.log(`开始做分享任务`);
      $.upFlag = true;
      for (let i = 0; i < needFinishNumber && $.runFalag; i++) {
        console.log(`执行第${i + 1}次分享`);
        await takePostRequest("doShareTask");
        await $.wait(2000);
      }
    } else {
      console.log(`分享任务已完成`);
    }
  }
  //设置活动提醒
  if ($.activityData.task5Remind && $.runFalag) {
    if ($.activityData.task5Remind.finishedCount !== $.activityData.task5Remind.upLimit) {
      console.log(`执行设置活动提醒`);
      $.upFlag = true;
      await takePostRequest("doRemindTask");
      await $.wait(2000);
    } else {
      console.log(`设置活动提醒已完成`);
    }
  }
  //领取优惠券
  if ($.activityData.task6GetCoupon && $.runFalag) {
    if ($.activityData.task6GetCoupon.finishedCount !== $.activityData.task6GetCoupon.upLimit) {
      needFinishNumber = Number($.activityData.task6GetCoupon.upLimit) - Number($.activityData.task6GetCoupon.finishedCount);
      console.log(`开始做领取优惠券`);
      $.upFlag = true;
      for (let i = 0; i < $.activityData.task6GetCoupon.taskCouponInfoList.length && needFinishNumber > 0 && $.runFalag; i++) {
        $.oneCouponInfo = $.activityData.task6GetCoupon.taskCouponInfoList[i];
        if ($.oneCouponInfo.finished === false) {
          await takePostRequest("doGetCouponTask");
          await $.wait(2000);
          needFinishNumber--;
        }
      }
    } else {
      console.log(`领取优惠券已完成`);
    }
  }
  //逛会场
  if ($.activityData.task7MeetPlaceVo && $.runFalag) {
    if ($.activityData.task7MeetPlaceVo.finishedCount !== $.activityData.task7MeetPlaceVo.upLimit) {
      console.log(`执行逛会场`);
      $.upFlag = true;
      await takePostRequest("doMeetingTask");
      await $.wait(2000);
    } else {
      console.log(`逛会场已完成`);
    }
  }
}

async function takePostRequest(type) {
  let url = "";
  let body = ``;
  switch (type) {
    case "getSimpleActInfoVo":
      url = "https://lzkjdz-isv.isvjcloud.com/customer/getSimpleActInfoVo";
      body = `activityId=${$.activityID}`;
      break;
    case "getMyPing":
      url = "https://lzkjdz-isv.isvjcloud.com/customer/getMyPing";
      body = `userId=${$.shopid}&token=${encodeURIComponent($.token)}&fromType=APP`;
      break;
    case "activityContent":
      url = "https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activityContent";
      body = `activityId=${$.activityID}&pin=${encodeURIComponent($.pin)}`;
      break;
    case "getActMemberInfo":
      url = "https://lzkjdz-isv.isvjcloud.com/wxCommonInfo/getActMemberInfo";
      body = `venderId=${$.shopid}&activityId=${$.activityID}&pin=${encodeURIComponent($.pin)}`;
      break;
    case "doSign":
      url = "https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/doSign";
      body = `activityId=${$.activityID}&uuid=${$.activityData.actorInfo.uuid}`;
      break;
    case "doBrowGoodsTask":
    case "doAddGoodsTask":
      url = `https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/${type}`;
      body = `activityId=${$.activityID}&uuid=${$.activityData.actorInfo.uuid}&skuId=${$.oneGoodInfo.skuId}`;
      break;
    case "doShareTask":
    case "doRemindTask":
    case "doMeetingTask":
      url = `https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/${type}`;
      body = `activityId=${$.activityID}&uuid=${$.activityData.actorInfo.uuid}`;
      break;
    case "doGetCouponTask":
      url = `https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/${type}`;
      body = `activityId=${$.activityID}&uuid=${$.activityData.actorInfo.uuid}&couponId=${$.oneCouponInfo.couponInfo.couponId}`;
      break;
    case "startDraw":
      url = `https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/${type}`;
      body = `activityId=${$.activityID}&uuid=${$.activityData.actorInfo.uuid}&drawType=${$.drawType}`;
      break;
    default:
      console.log(`错误${type}`);
  }
  let myRequest = getPostRequest(url, body);
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        dealReturn(type, data);
      } catch (e) {
        console.log(data);
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function dealReturn(type, data) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    console.log(`执行任务异常`);
    console.log(data);
    $.runFalag = false;
  }
  switch (type) {
    case "getSimpleActInfoVo":
      if (data.result) {
        $.shopid = data.data.venderId;
      }
      break;
    case "getMyPing":
      if (data.data && data.data.secretPin) {
        $.pin = data.data.secretPin;
        $.nickname = data.data.nickname;
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    case "activityContent":
      if (data.data && data.result && data.count === 0) {
        $.activityData = data.data;
        $.actinfo = $.activityData.actInfo;
        $.actorInfo = $.activityData.actorInfo;
        $.nowUseValue = Number($.actorInfo.fansLoveValue) + Number($.actorInfo.energyValue);
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    case "getActMemberInfo":
      if (data.data && data.result && data.count === 0) {
        $.memberInfo = data.data;
      }
      break;
    case "doSign":
      if (data.result === true) {
        console.log("签到成功");
      } else {
        console.log(data.errorMessage);
      }
      break;
    case "doBrowGoodsTask":
    case "doAddGoodsTask":
    case "doShareTask":
    case "doRemindTask":
    case "doGetCouponTask":
    case "doMeetingTask":
      if (data.result === true) {
        console.log("执行成功");
      } else {
        console.log(data.errorMessage);
      }
      break;
    case "startDraw":
      if (data.result && data.data) {
        if (data.data.drawInfoType === 6) {
          console.log(`抽奖获得：${data.data.name || ""}`);
        } else if (data.data.drawInfoType === 0) {
          console.log(`未抽中`);
        } else {
          console.log(`抽奖结果：${data.data.name || ""}`);
        }
      }
      console.log(JSON.stringify(data));
      break;
    default:
      console.log(JSON.stringify(data));
  }
}

function getPostRequest(url, body) {
  let headers = {
    Host: "lzkjdz-isv.isvjcloud.com",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    Referer: "https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activity/" + $.activityID + "?activityId=" + $.activityID + "&shareuserid4minipg=jd_4806fb66e0f3e&shopid=undefined",
    "user-agent": $.UA,
    "content-type": "application/x-www-form-urlencoded",
    Cookie: $.cookie,
  };
  return { url: url, method: `POST`, headers: headers, body: body };
}
function accessLogWithAD() {
  let config = {
    url: `https://lzkjdz-isv.isvjcloud.com/common/accessLogWithAD`,
    headers: {
      Host: "lzkjdz-isv.isvjcloud.com",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "user-agent": $.UA,
      Referer: "https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activity/" + $.activityID + "?activityId=" + $.activityID + "&shareuserid4minipg=jd_4806fb66e0f3e&shopid=undefined",
      "content-type": "application/x-www-form-urlencoded",
      Cookie: $.cookie,
    },
    body: `venderId=${$.shopid}&code=69&pin=${encodeURIComponent($.pin)}&activityId=${$.activityID}&pageUrl=https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activity/${
      $.activityID
    }?activityId=${$.activityID}&shareuserid4minipg=&shopid=undefined&subType=app&adSource=`,
  };
  return new Promise((resolve) => {
    $.post(config, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          $.cookie = $.oldcookie;
          if ($.isNode())
            for (let ck of resp["headers"]["set-cookie"]) {
              $.cookie = `${$.cookie}${ck.split(";")[0]};`;
            }
          else {
            for (let ck of resp["headers"]["Set-Cookie"].split(",")) {
              $.cookie = `${$.cookie}${ck.split(";")[0]};`;
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function getActCk() {
  let config = {
    url: `https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activity/${$.activityID}?activityId=${$.activityID}&shareuserid4minipg=jd_4806fb66e0f3e&shopid=undefined`,
    headers: {
      Host: "lzkjdz-isv.isvjcloud.com",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activity/" + $.activityID + "?activityId=" + $.activityID + "&shareuserid4minipg=jd_4806fb66e0f3e&shopid=undefined",
      "user-agent": $.UA,
      "content-type": "application/x-www-form-urlencoded",
      Cookie: $.cookie,
    },
  };
  return new Promise((resolve) => {
    $.get(config, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          $.cookie = $.oldcookie;
          if ($.isNode())
            for (let ck of resp["headers"]["set-cookie"]) {
              $.cookie = `${$.cookie}${ck.split(";")[0]};`;
            }
          else {
            for (let ck of resp["headers"]["Set-Cookie"].split(",")) {
              $.cookie = `${$.cookie}${ck.split(";")[0]};`;
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function getToken() {
  let config = {
    url: "https://api.m.jd.com/client.action?functionId=isvObfuscator&clientVersion=10.0.6&build=88852&client=android&d_brand=Xiaomi&d_model=RedmiK30&osVersion=11&screen=2175*1080&partner=xiaomi001&oaid=b30cf82cacfa8972&openudid=290955c2782e1c44&eid=eidAef5f8122a0sf2tNlFbi9TV+3rtJ+jl5UptrTZo/Aq5MKUEaXcdTZC6RfEBt5Jt3Gtml2hS+ZvrWoDvkVv4HybKpJJVMdRUkzX7rGPOis1TRFRUdU&sdkVersion=30&lang=zh_CN&uuid=290955c2782e1c44&aid=290955c2782e1c44&area=1_2803_2829_0&networkType=wifi&wifiBssid=unknown&uts=0f31TVRjBSsSbxrSGoN9DgdOSm6pBw5mcERcSRBBxns2PPMfI6n6ccc3sDC5tvqojX6KE6uHJtCmbQzfS%2B6T0ggVk1TfVMHdFhgxdB8xiJq%2BUJPVGAaS5duja15lBdKzCeU4J31903%2BQn8mkzlfNoAvZI7hmcbV%2FZBnR1VdoiUChwWlAxuEh75t18FqkjuqQHvhONIbhrfofUoFzbcriHw%3D%3D&uemps=0-0&harmonyOs=0&st=1625157308996&sign=e5ef32369adb2e4b7024cff612395a72&sv=110",
    body: "body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Flzkjdz-isv.isvjcloud.com%22%7D&",
    headers: {
      Host: "api.m.jd.com",
      accept: "*/*",
      "user-agent": "JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)",
      "accept-language": "zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6",
      "content-type": "application/x-www-form-urlencoded",
      Cookie: $.cookie,
    },
  };
  return new Promise((resolve) => {
    $.post(config, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
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

async function getUA() {
  $.UA = `jdapp;iPhone;10.0.10;14.3;${randomString(
    40
  )};network/wifi;model/iPhone12,1;addressid/3364463029;appBuild/167764;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;
}
function randomString(e) {
  e = e || 32;
  let t = "abcdef0123456789",
    a = t.length,
    n = "";
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

function TotalBean() {
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


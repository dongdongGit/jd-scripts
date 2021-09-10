/**
 粉丝互动，没啥水
 修改温某的脚本，由于温某不干活，只能自己动手修改了
 注意：脚本会加购，脚本会加购，脚本会加购
 若发现脚本里没有的粉丝互动活动。欢迎反馈给我
 cron 34 6,18 * * * jd_fan.js
 * */
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('粉丝互动');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [];
const activityList = [
  { actid: '2aac05400cfb47c1b91cf8152f90b8e7', endTime: 1632931200000 },
  { actid: 'f1f1d34436ec4909aa7903f64205e283', endTime: 1633622400000 },
  { actid: 'dc06b5c5caf742ebb3040e43edf5b85a', endTime: 1631505600000 },
  { actid: 'e9c2a3156dc44c6e9fe59e9d890f694f', endTime: 1631721599000 },
  { actid: 'bf5a0953a44b4cdb95a704a330719534', endTime: 1631635200000 },
  { actid: '2e8a6f983f934eef8ec3da0e6eef6fd2', endTime: 1631894400000 },
  { actid: '7377aba024114ddfa25bad00948a8722', endTime: 1632931200000 },
  { actid: '897876a4bba844adadc3c956c152ca7d', endTime: 1631289600000 },
  { actid: 'b6bd7155cefe443aae1e5a74383008f2', endTime: 1635695999000 },
  { actid: '4368aa3b3c26477dbf8f9a3a45226938', endTime: 1631545200000 },
  { actid: '3651af1ff7194fb3b37235dd15538d58', endTime: 1632067199000 },
  { actid: '6b1fb17eceb047c487537b2deb9694d8', endTime: 1631261565000 },
  { actid: '2bfa9b34365140f8a51293043ca2821f', endTime: 1633017599000 },
  { actid: '3ae867cd253f42b1992ae90598b7549a', endTime: 1632931200000 },
  { actid: '9f90ca09236d4f9b86aca47db4d885f2', endTime: 1631375999000 },
  { actid: '2d2280b86b394cc09d436feecb4e5d3b', endTime: 1632931200000 },
  { actid: '0b8f1d09788947669f75c4bcc4fde4ae', endTime: 1633017599000 },
  { actid: 'e7a53032cfe84b1fb882c3bbf43f5e5e', endTime: 1631203200000 },
  { actid: 'bde48555ac8b41669f516f892f95e21c', endTime: 1633017599000 },
  { actid: '86eab05c547d4d28829d269e2a5c4f1e', endTime: 1633017599000 },
  { actid: '73086c4fed7746e1b911a776d2e8662e', endTime: 1633017599000 },
  { actid: '179e156d768240db84393751fc9c427b', endTime: 1633017599000 },
  { actid: 'fa3c9189473141c0aec883301452e562', endTime: 1633017599000 },
  { actid: 'bed695cfc40941c0a641eba935f9601e', endTime: 1633017599000 },
  { actid: 'eff9c47393be446f9dd576e26d13dd9d', endTime: 1631635200000 },
  { actid: '5622386323bb4a82a2ed4e0158f7c6a7', endTime: 1631289599000 },
];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    await getUA();
    $.index = i + 1;
    $.cookie = cookiesArr[i];
    $.oldcookie = cookiesArr[i];
    $.isLogin = true;
    $.nickName = '';
    await $.totalBean();
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
    if (!$.isLogin) {
      $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
        'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
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
      $.skuIds = [];
      console.log(`互动ID：${JSON.stringify($.activityInfo)}`);
      console.log(`活动地址：https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activity/${$.activityID}?activityId=${$.activityID}`);
      if ($.activityInfo.endTime && Date.now() > $.activityInfo.endTime) {
        console.log(`活动已结束\n`);
        continue;
      }
      await main();
      await $.wait(1000);
      await $.clearShoppingCart();
      console.log('\n');
    }
  }
})()
  .catch((e) => {
    $.log('', `${$.name}, 失败! 原因: ${e}!`, '');
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
  await takePostRequest('getSimpleActInfoVo');
  if ($.shopid === ``) {
    console.log(`获取shopid失败`);
    return;
  }
  console.log(`shopid:${$.shopid}`);
  await $.wait(1000);
  $.pin = '';
  await takePostRequest('getMyPing');
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
  $.actinfo = '';
  $.actorInfo = '';
  $.nowUseValue = 0;
  await takePostRequest('activityContent');
  if (JSON.stringify($.activityData) === `{}`) {
    console.log(`获取活动详情失败`);
    return;
  }
  let date = new Date($.activityData.actInfo.endTime);
  let endtime = date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
  console.log(`${$.actinfo.actName},${$.actinfo.shopName},当前积分：${$.nowUseValue},结束时间：${endtime}，${$.activityData.actInfo.endTime}`);
  if ($.actorInfo.prizeOneStatus && $.actorInfo.prizeTwoStatus && $.actorInfo.prizeThreeStatus) {
    console.log(`已抽过所有奖品`);
    return;
  }
  await $.wait(1000);
  $.memberInfo = {};
  await takePostRequest('getActMemberInfo');
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
    await takePostRequest('activityContent');
    await $.wait(1000);
  }
  let nowUseValue = Number($.activityData.actorInfo.fansLoveValue) + Number($.activityData.actorInfo.energyValue);
  if (nowUseValue >= $.activityData.actConfig.prizeScoreOne && $.activityData.actorInfo.prizeOneStatus === false) {
    console.log(`开始第一次抽奖`);
    $.drawType = '01';
    await takePostRequest('startDraw');
    await $.wait(1000);
  }
  if (nowUseValue >= $.activityData.actConfig.prizeScoreTwo && $.activityData.actorInfo.prizeTwoStatus === false) {
    console.log(`开始第二次抽奖`);
    $.drawType = '02';
    await takePostRequest('startDraw');
    await $.wait(1000);
  }
  if (nowUseValue >= $.activityData.actConfig.prizeScoreThree && $.activityData.actorInfo.prizeThreeStatus === false) {
    console.log(`开始第三次抽奖`);
    $.drawType = '03';
    await takePostRequest('startDraw');
    await $.wait(1000);
  }
}
async function doTask() {
  $.runFalag = true;
  if ($.activityData.actorInfo && !$.activityData.actorInfo.follow) {
    console.log(`关注店铺`);
    await takePostRequest('followShop');
    await $.wait(2000);
    $.upFlag = true;
  } else {
    console.log('已关注');
  }
  if ($.activityData.task1Sign && $.activityData.task1Sign.finishedCount === 0 && $.runFalag) {
    console.log(`执行每日签到`);
    await takePostRequest('doSign');
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
          console.log(`浏览:${$.oneGoodInfo.skuName || ''}`);
          await takePostRequest('doBrowGoodsTask');
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
          console.log(`加购:${$.oneGoodInfo.skuName || ''}`);
          $.skuIds.push($.oneGoodInfo.skuId.toString());
          await takePostRequest('doAddGoodsTask');
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
        await takePostRequest('doShareTask');
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
      await takePostRequest('doRemindTask');
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
          await takePostRequest('doGetCouponTask');
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
      await takePostRequest('doMeetingTask');
      await $.wait(2000);
    } else {
      console.log(`逛会场已完成`);
    }
  }
}

async function takePostRequest(type) {
  let url = '';
  let body = ``;
  switch (type) {
    case 'getSimpleActInfoVo':
      url = 'https://lzkjdz-isv.isvjcloud.com/customer/getSimpleActInfoVo';
      body = `activityId=${$.activityID}`;
      break;
    case 'getMyPing':
      url = 'https://lzkjdz-isv.isvjcloud.com/customer/getMyPing';
      body = `userId=${$.shopid}&token=${encodeURIComponent($.token)}&fromType=APP`;
      break;
    case 'activityContent':
      url = 'https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activityContent';
      body = `activityId=${$.activityID}&pin=${encodeURIComponent($.pin)}`;
      break;
    case 'getActMemberInfo':
      url = 'https://lzkjdz-isv.isvjcloud.com/wxCommonInfo/getActMemberInfo';
      body = `venderId=${$.shopid}&activityId=${$.activityID}&pin=${encodeURIComponent($.pin)}`;
      break;
    case 'doBrowGoodsTask':
    case 'doAddGoodsTask':
      url = `https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/${type}`;
      body = `activityId=${$.activityID}&uuid=${$.activityData.actorInfo.uuid}&skuId=${$.oneGoodInfo.skuId}`;
      break;
    case 'doSign':
    case 'followShop':
    case 'doShareTask':
    case 'doRemindTask':
    case 'doMeetingTask':
      url = `https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/${type}`;
      body = `activityId=${$.activityID}&uuid=${$.activityData.actorInfo.uuid}`;
      break;
    case 'doGetCouponTask':
      url = `https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/${type}`;
      body = `activityId=${$.activityID}&uuid=${$.activityData.actorInfo.uuid}&couponId=${$.oneCouponInfo.couponInfo.couponId}`;
      break;
    case 'startDraw':
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
    case 'getSimpleActInfoVo':
      if (data.result) {
        $.shopid = data.data.venderId;
      }
      break;
    case 'getMyPing':
      if (data.data && data.data.secretPin) {
        $.pin = data.data.secretPin;
        $.nickname = data.data.nickname;
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    case 'activityContent':
      if (data.data && data.result && data.count === 0) {
        $.activityData = data.data;
        $.actinfo = $.activityData.actInfo;
        $.actorInfo = $.activityData.actorInfo;
        $.nowUseValue = Number($.actorInfo.fansLoveValue) + Number($.actorInfo.energyValue);
      } else {
        console.log(JSON.stringify(data));
      }
      break;
    case 'getActMemberInfo':
      if (data.data && data.result && data.count === 0) {
        $.memberInfo = data.data;
      }
      break;
    case 'doSign':
      if (data.result === true) {
        console.log('签到成功');
      } else {
        console.log(data.errorMessage);
      }
      break;
    case 'followShop':
    case 'doBrowGoodsTask':
    case 'doAddGoodsTask':
    case 'doShareTask':
    case 'doRemindTask':
    case 'doGetCouponTask':
    case 'doMeetingTask':
      if (data.result === true) {
        console.log('执行成功');
      } else {
        console.log(data.errorMessage);
      }
      break;
    case 'startDraw':
      if (data.result && data.data) {
        if (data.data.drawInfoType === 6) {
          console.log(`抽奖获得：${data.data.name || ''}`);
        } else if (data.data.drawInfoType === 0) {
          console.log(`未抽中`);
        } else {
          console.log(`抽奖结果：${data.data.name || ''}`);
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
    Host: 'lzkjdz-isv.isvjcloud.com',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activity/' + $.activityID + '?activityId=' + $.activityID + '&shareuserid4minipg=jd_4806fb66e0f3e&shopid=undefined',
    'user-agent': $.UA,
    'content-type': 'application/x-www-form-urlencoded',
    Cookie: $.cookie,
  };
  return { url: url, method: `POST`, headers: headers, body: body };
}
function accessLogWithAD() {
  let config = {
    url: `https://lzkjdz-isv.isvjcloud.com/common/accessLogWithAD`,
    headers: {
      Host: 'lzkjdz-isv.isvjcloud.com',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'user-agent': $.UA,
      Referer: 'https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activity/' + $.activityID + '?activityId=' + $.activityID + '&shareuserid4minipg=jd_4806fb66e0f3e&shopid=undefined',
      'content-type': 'application/x-www-form-urlencoded',
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
            for (let ck of resp['headers']['set-cookie']) {
              $.cookie = `${$.cookie}${ck.split(';')[0]};`;
            }
          else {
            for (let ck of resp['headers']['Set-Cookie'].split(',')) {
              $.cookie = `${$.cookie}${ck.split(';')[0]};`;
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
      Host: 'lzkjdz-isv.isvjcloud.com',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: 'https://lzkjdz-isv.isvjcloud.com/wxFansInterActionActivity/activity/' + $.activityID + '?activityId=' + $.activityID + '&shareuserid4minipg=jd_4806fb66e0f3e&shopid=undefined',
      'user-agent': $.UA,
      'content-type': 'application/x-www-form-urlencoded',
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
            for (let ck of resp['headers']['set-cookie']) {
              $.cookie = `${$.cookie}${ck.split(';')[0]};`;
            }
          else {
            for (let ck of resp['headers']['Set-Cookie'].split(',')) {
              $.cookie = `${$.cookie}${ck.split(';')[0]};`;
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
    url: 'https://api.m.jd.com/client.action?functionId=isvObfuscator&clientVersion=10.0.6&build=88852&client=android&d_brand=Xiaomi&d_model=RedmiK30&osVersion=11&screen=2175*1080&partner=xiaomi001&oaid=b30cf82cacfa8972&openudid=290955c2782e1c44&eid=eidAef5f8122a0sf2tNlFbi9TV+3rtJ+jl5UptrTZo/Aq5MKUEaXcdTZC6RfEBt5Jt3Gtml2hS+ZvrWoDvkVv4HybKpJJVMdRUkzX7rGPOis1TRFRUdU&sdkVersion=30&lang=zh_CN&uuid=290955c2782e1c44&aid=290955c2782e1c44&area=1_2803_2829_0&networkType=wifi&wifiBssid=unknown&uts=0f31TVRjBSsSbxrSGoN9DgdOSm6pBw5mcERcSRBBxns2PPMfI6n6ccc3sDC5tvqojX6KE6uHJtCmbQzfS%2B6T0ggVk1TfVMHdFhgxdB8xiJq%2BUJPVGAaS5duja15lBdKzCeU4J31903%2BQn8mkzlfNoAvZI7hmcbV%2FZBnR1VdoiUChwWlAxuEh75t18FqkjuqQHvhONIbhrfofUoFzbcriHw%3D%3D&uemps=0-0&harmonyOs=0&st=1625157308996&sign=e5ef32369adb2e4b7024cff612395a72&sv=110',
    body: 'body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Flzkjdz-isv.isvjcloud.com%22%7D&',
    headers: {
      Host: 'api.m.jd.com',
      accept: '*/*',
      'user-agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
      'accept-language': 'zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6',
      'content-type': 'application/x-www-form-urlencoded',
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
          $.token = data['token'];
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
  let t = 'abcdef0123456789',
    a = t.length,
    n = '';
  for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

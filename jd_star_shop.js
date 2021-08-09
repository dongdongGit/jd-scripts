/*
 * author:star
/*
明星小店(星店长)
助力逻辑：每个ck随机获取一个明星，然后会先内部助力，然后再助力内置助力码
抽奖：是否中奖没判断，需自行查看
更新时间：2021-06-06
脚本兼容: QuantumultX, Surge,Loon, JSBox, Node.js
=================================Quantumultx=========================
[task_local]
#明星小店
0 1,21 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_star_shop.js, tag=明星小店, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

=================================Loon===================================
[Script]
cron "0 1,21 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_star_shop.js,tag=明星小店

===================================Surge================================
明星小店 = type=cron,cronexp="0 1,21 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_star_shop.js

====================================小火箭=============================
明星小店 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_star_shop.js, cronexpr="0 1,21 * * *", timeout=3600, enable=true
 */

const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("明星小店");
const notify = $.isNode() ? require("./sendNotify") : "";
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
$.inviteCodeList = [];
let cookiesArr = [];
let uniqueIdList = [
  { id: "HY4HCW", name: "陈坤" },
  { id: "637BQA", name: "成毅" },
  { id: "XLDYRJ", name: "白宇" },
  { id: "94FEDQ", name: "任嘉伦" },
  { id: "GN949D", name: "刘宇宁" },
  { id: "WG73ME", name: "李光洁" },
  { id: "5JFCD6", name: "李纹翰" },
  { id: "YCDXNN", name: "蔡徐坤" },
  { id: "CX522V", name: "邓伦" },
  { id: "877JM4", name: "张哲瀚" },
  { id: "D22Q7C", name: "孟美岐" },
  { id: "K6DARX", name: "龚俊" },
  { id: "2SFR44", name: "白茶" },
  { id: "S99D9G", name: "刘浩存" },
  { id: "ET5F23", name: "吴尊" },
  { id: "TXU6GB", name: "刘雨欣" },
  { id: "FBFN48", name: "李宇春" },
  { id: "UK2SUY", name: "虞书欣" },
  { id: "VS4PEM", name: "热依扎" },
  { id: "QE9757", name: "黄弈" },
  { id: "2PFR4L", name: "张云龙" },
  { id: "4A2M7K", name: "张伯芝" },
  { id: "J8UWSP", name: "戚薇" },
  { id: "3FU8S5", name: "周柯宇" },
  { id: "P94VEU", name: "林志玲" },
  { id: "LW4LCK", name: "田鸿杰" },
  { id: "MW9U5Z", name: "吴宇恒" },
  { id: "AVDKNT", name: "张嘉倪" },
  { id: "3PU8SZ", name: "阿云嘎" },
  { id: "ZQ7TQR", name: "马家辉" },
  { id: "VZ4PEY", name: "翟潇闻" },
  { id: "ZH7TQ6", name: "李一桐" },
  { id: "4C2M75", name: "张馨予" },
  { id: "E55F2M", name: "雷米" },
  { id: "M79U5N", name: "无穷小亮" },
  { id: "762GUB", name: "刘昊然" },
  { id: "8K7JM3", name: "止庵" },
  { id: "LQ4LCS", name: "倪妮" },
  { id: "YTDXNL", name: "宫殿君" },
  { id: "5RFCD9", name: "王菲菲" },
];
$.shopId = "94FEDQ";
$.tokenId = "jd6df03bd53f0f292f";
$.xdzHelpCodeList = [];
/**奖品只有优惠券，不做他们家的任务
 *{'id':'TRU6GG','name':'王一博'}
 *{'id':'ND55FR','name':'刘诗诗'}
 * */
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  console.log("明星小店(星店长)\n" + "助力逻辑：每个ck随机获取一个明星，然后会先内部助力，然后再助力内置助力码\n" + "抽奖：是否中奖没判断，需自行查看\n" + "更新时间：2021-06-06\n");

  // console.log(`==================开始执行星店长任务==================`);
  // for (let i = 0; i < cookiesArr.length; i++) {
  //   $.index = i + 1;
  //   $.cookie = cookiesArr[i];
  //   $.isLogin = true;
  //   $.nickName = '';
  //   await TotalBean();
  //   $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
  //   console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
  //   if (!$.isLogin) {
  //     $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
  //
  //     if ($.isNode()) {
  //       await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
  //     }
  //     continue
  //   }
  //   await xdz();
  // }
  // console.log(`开始执行星店长助力\n`);
  // if(cookiesArr.length > 1 && $.xdzHelpCodeList.length > 0){
  //   if($.xdzHelpCodeList.length > 1){
  //     $.xdzHelpCodeList.push($.xdzHelpCodeList.shift());
  //   }
  //   for (let i = 0; i < cookiesArr.length; i++) {
  //     $.cookie = cookiesArr[i];
  //     $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
  //     $.helpCode = $.xdzHelpCodeList[i];
  //     console.log(`${$.UserName},去助力${$.helpCode}`);
  //     await help();
  //     await $.wait(2000);
  //     if($.xdzHelpCodeList[i+1]){
  //       $.helpCode = $.xdzHelpCodeList[i+1];
  //       console.log(`${$.UserName},去助力${$.helpCode}`);
  //       await help();
  //       await $.wait(2000);
  //     }else{
  //       $.helpCode = $.xdzHelpCodeList[0];
  //       console.log(`${$.UserName},去助力${$.helpCode}`);
  //       await help();
  //       await $.wait(2000);
  //     }
  //   }
  // }
  // console.log(`==================星店长任务执行完毕==================\n`);
  console.log(`==================开始执行明星小店任务==================`);
  for (let i = 0; i < cookiesArr.length; i++) {
    $.index = i + 1;
    $.cookie = cookiesArr[i];
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
    await main();
  }

  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookiesArr[i];
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    let sar = Math.floor(Math.random() * uniqueIdList.length);
    $.uniqueId = uniqueIdList[sar].id;
    for (let k = 0; k < $.inviteCodeList.length; k++) {
      $.oneCode = $.inviteCodeList[k];
      console.log(`${$.UserName}去助力：${$.uniqueId} 活动，助力码：${$.oneCode}`);
      await takePostRequest("help");
      await $.wait(2000);
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
  let sendMessage = "";
  uniqueIdList = getRandomArrayElements(uniqueIdList, uniqueIdList.length);
  console.log(`现共查询到${uniqueIdList.length}个明星小店\n`);
  for (let j = 0; j < uniqueIdList.length; j++) {
    try {
      $.uniqueId = uniqueIdList[j].id;
      $.helpCode = "";
      console.log(`开始第${j + 1}个明星小店，ID：${$.uniqueId},明星：${uniqueIdList[j].name}`);
      await starShop();
      await $.wait(1000);
      if (j === 0) {
        console.log(`互助码：${$.helpCode}`);
        $.inviteCodeList.push($.helpCode);
      }
      console.log(`\n`);
    } catch (e) {
      console.log(JSON.stringify(e.message));
    }
  }
  console.log(`=============${$.UserName}：星店长奖励汇总================`);
  await $.wait(1000);
  $.rewards = [];
  await getReward();
  for (let i = 0; i < $.rewards.length; i++) {
    if ($.rewards[i].prizeType === 1) {
      console.log(`获得优惠券`);
    } else if ($.rewards[i].prizeType === 6) {
      console.log(`获得明星照片或者视频`);
    } else if ($.rewards[i].prizeType === 5) {
      if (!$.rewards[i].fillReceiverFlag) {
        console.log(`获得实物：${$.rewards[i].prizeDesc || ""},未填写地址`);
        sendMessage += `【京东账号${$.index}】${$.UserName}，获得实物：${$.rewards[i].prizeDesc || ""}\n`;
      } else {
        console.log(`获得实物：${$.rewards[i].prizeDesc || ""},已填写地址`);
      }
    } else if ($.rewards[i].prizeType === 10) {
      console.log(`获得京豆`);
    } else {
      console.log(`获得其他：${$.rewards[i].prizeDesc || ""}`);
    }
  }
  if (sendMessage) {
    sendMessage += `填写收货地址路径：\n京东首页，搜索明星（蔡徐坤），进入明星小店，我的礼物，填写收货地址`;
    await notify.sendNotify(`星店长`, sendMessage);
  }
}

async function xdz() {
  // $.xdzInfo = {};
  // await getXdzInfo();
  // if(JSON.stringify($.xdzInfo) === '{}'){
  //   console.log(`获取活动数据为空`);
  //   return ;
  // }
  // $.xdzUseInfo = {};
  // await getXdzUseInfo();
  // if(JSON.stringify($.xdzUseInfo) === '{}'){
  //   console.log(`获取用户数据为空`);
  //   return ;
  // }
  // let tasksList =  $.xdzUseInfo.tasks;
  // for (let i = 0; i < tasksList.length; i++) {
  //   $.oneTask = tasksList[i];
  //   if($.oneTask.status !== 1){
  //     continue;
  //   }
  //   if($.oneTask.taskType !== '22' && $.oneTask.taskType !== '6'){
  //     console.log(`执行任务：${$.oneTask.taskName}`);
  //     let subItem = $.oneTask.subItem;
  //     for (let j = 0; j < subItem.length; j++) {
  //       $.subItemInfo = subItem[j];
  //       if(!$.subItemInfo.itemToken &&  $.subItemInfo.status !==1 ){
  //         continue;
  //       }
  //       await doXdzTask();
  //       await $.wait(2000);
  //     }
  //   }else if($.oneTask.taskType === '6'){
  //     if($.oneTask.subItem && $.oneTask.subItem.length>0 && $.oneTask.times === 0){
  //       $.xdzHelpCodeList.push($.oneTask.subItem[0].itemToken);
  //       console.log(`助力码：${$.oneTask.subItem[0].itemToken}`);
  //     }
  //   }
  // }
  // let awardVoList = $.xdzInfo.awardVoList;
  // for (let i = 0; i < awardVoList.length; i++) {
  //   $.oneAwardInfo = awardVoList[i];
  // if($.oneAwardInfo.status === 1 && $.oneAwardInfo.grade === 1){
  //   console.log(`执行抽奖`);
  //   drawAward();
  //   await $.wait(2000);
  // }
  // }

  console.log(`执行瓜分`);
  await guafen();
  await $.wait(2000);
}
async function guafen() {
  let a = new Date().Format("yyyy-MM-ddThh:mm:ss.SZ");
  console.log(a);
  const url = `https://api.m.jd.com/?body=%7B%22shopId%22:%22${$.shopId}%22,%22nowTime%22:%22${a}%22,%22token%22:%22${
    $.tokenId
  }%22%7D&appid=xdz&functionId=mcxhd_starmall_getRedPacketAward&t=${Date.now()}&loginWQBiz=`;
  const method = `GET`;
  const headers = {
    Origin: `https://h5.m.jd.com`,
    Cookie: $.cookie,
    "Accept-Encoding": `gzip, deflate, br`,
    "Accept-Language": `zh-cn`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    Referer: `https://h5.m.jd.com/babelDiy/Zeus/3Vuj8Uw26NEDNRjaT2uspf2pphK/index.html`,
    "Content-Type": `application/x-www-form-urlencoded;charset=UTF-8`,
    Accept: `application/json, text/plain, */*`,
    Host: `api.m.jd.com`,
  };
  const myRequest = { url: url, method: method, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        console.log(data);
        data = JSON.parse(data);
        if (data.retCode === "200") {
          console.log(`瓜分获得：${data.result.quota}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

Date.prototype.Format = function (fmt) {
  //author: meizz
  var o = {
    "M+": this.getUTCMonth() + 1, //月份
    "d+": this.getUTCDate(), //日
    "h+": this.getUTCHours(), //小时
    "m+": this.getUTCMinutes(), //分
    "s+": this.getUTCSeconds(), //秒
    "q+": Math.floor((this.getUTCMonth() + 3) / 3), //季度
    S: this.getUTCMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getUTCFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o) if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
  return fmt;
};
async function help() {
  const url = `https://api.m.jd.com/?body=%7B%22shopId%22:%22${$.shopId}%22,%22itemToken%22:%22${$.helpCode}%22,%22token%22:%22${
    $.tokenId
  }%22%7D&appid=xdz&functionId=mcxhd_starmall_doTask&t=${Date.now()}&loginWQBiz=`;
  const method = `GET`;
  const headers = {
    Origin: `https://h5.m.jd.com`,
    Cookie: $.cookie,
    "Accept-Encoding": `gzip, deflate, br`,
    "Accept-Language": `zh-cn`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    Referer: `https://h5.m.jd.com/babelDiy/Zeus/3Vuj8Uw26NEDNRjaT2uspf2pphK/index.html`,
    "Content-Type": `application/x-www-form-urlencoded;charset=UTF-8`,
    Accept: `application/json, text/plain, */*`,
    Host: `api.m.jd.com`,
  };
  const myRequest = { url: url, method: method, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        console.log(`助力结果`);
        console.log(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function drawAward() {
  const url = `https://api.m.jd.com/?body=%7B%22shopId%22:%22${$.shopId}%22,%22token%22:%22${$.tokenId}%22%7D&appid=xdz&functionId=mcxhd_starmall_drawAward&t=${Date.now()}&loginWQBiz=`;
  const method = `GET`;
  const headers = {
    Origin: `https://h5.m.jd.com`,
    Cookie: $.cookie,
    "Accept-Encoding": `gzip, deflate, br`,
    "Accept-Language": `zh-cn`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    Referer: `https://h5.m.jd.com/babelDiy/Zeus/3Vuj8Uw26NEDNRjaT2uspf2pphK/index.html`,
    "Content-Type": `application/x-www-form-urlencoded;charset=UTF-8`,
    Accept: `application/json, text/plain, */*`,
    Host: `api.m.jd.com`,
  };
  const myRequest = { url: url, method: method, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        console.log(`抽奖结果`);
        console.log(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function doXdzTask() {
  const url = `https://api.m.jd.com/?body=%7B%22shopId%22:%22${$.shopId}%22,%22itemToken%22:%22${$.subItemInfo.itemToken}%22,%22token%22:%22${
    $.tokenId
  }%22%7D&appid=xdz&functionId=mcxhd_starmall_doTask&t=${Date.now()}&loginWQBiz=`;
  const method = `GET`;
  const headers = {
    Origin: `https://h5.m.jd.com`,
    Cookie: $.cookie,
    "Accept-Encoding": `gzip, deflate, br`,
    "Accept-Language": `zh-cn`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    Referer: `https://h5.m.jd.com/babelDiy/Zeus/3Vuj8Uw26NEDNRjaT2uspf2pphK/index.html`,
    "Content-Type": `application/x-www-form-urlencoded;charset=UTF-8`,
    Accept: `application/json, text/plain, */*`,
    Host: `api.m.jd.com`,
  };
  const myRequest = { url: url, method: method, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.retCode === "200") {
          console.log(`任务完成，获得星力值：${data.result.score}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function getXdzUseInfo() {
  const url = `https://api.m.jd.com/?body=%7B%22shopId%22:%22${$.shopId}%22,%22token%22:%22${$.tokenId}%22%7D&appid=xdz&functionId=mcxhd_starmall_taskList&t=${Date.now()}&loginWQBiz=`;
  const method = `GET`;
  const headers = {
    Origin: `https://h5.m.jd.com`,
    Cookie: $.cookie,
    "Accept-Encoding": `gzip, deflate, br`,
    "Accept-Language": `zh-cn`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    Referer: `https://h5.m.jd.com/babelDiy/Zeus/3Vuj8Uw26NEDNRjaT2uspf2pphK/index.html`,
    "Content-Type": `application/x-www-form-urlencoded;charset=UTF-8`,
    Accept: `application/json, text/plain, */*`,
    Host: `api.m.jd.com`,
  };
  const myRequest = { url: url, method: method, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.retCode === "200") {
          $.xdzUseInfo = data.result;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function getXdzInfo() {
  const url = `https://api.m.jd.com/?body=%7B%22shopId%22:%22${$.shopId}%22,%22token%22:%22${$.tokenId}%22%7D&appid=xdz&functionId=mcxhd_starmall_getStarShopPage&t=${Date.now()}&loginWQBiz=`;
  const method = `GET`;
  const headers = {
    Origin: `https://h5.m.jd.com`,
    Cookie: $.cookie,
    "Accept-Encoding": `gzip, deflate, br`,
    "Accept-Language": `zh-cn`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    Referer: `https://h5.m.jd.com/babelDiy/Zeus/3Vuj8Uw26NEDNRjaT2uspf2pphK/index.html`,
    "Content-Type": `application/x-www-form-urlencoded;charset=UTF-8`,
    Accept: `application/json, text/plain, */*`,
    Host: `api.m.jd.com`,
  };
  const myRequest = { url: url, method: method, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.retCode === "200") {
          $.xdzInfo = data.result;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function getReward() {
  const url = `https://api.m.jd.com/?functionId=activityStarBackGetRewardList&body={%22linkId%22:%22Y2aqxng42hZ0eGxGtbCMiQ%22}&_t=${Date.now()}&appid=activities_platform`;
  const method = `GET`;
  const headers = {
    Origin: `https://prodev.m.jd.com`,
    Cookie: $.cookie,
    Connection: `keep-alive`,
    Accept: `application/json, text/plain, */*`,
    Referer: `https://prodev.m.jd.com/mall/active/7s5TYVpp8dKXF4FrDqe55H8esSV/index.html`,
    Host: `api.m.jd.com`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    "Accept-Encoding": `gzip, deflate, br`,
    "Accept-Language": `zh-cn`,
  };

  const myRequest = { url: url, method: method, headers: headers };
  return new Promise(async (resolve) => {
    $.get(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.code === 0) {
          $.rewards = data.data;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function starShop() {
  $.info = {};
  await takePostRequest("activityStarBackGetProgressBarInfo");
  if (JSON.stringify($.info) === "{}") {
    console.log(`获取活动失败，ID：${$.uniqueId}`);
  }
  let prize = $.info.prize;
  let runFlag = false;
  for (let i = 1; i < 5; i++) {
    $.onePrize = prize[i];
    if ($.onePrize.state === 1) {
      console.log(`去抽奖，奖品为：${$.onePrize.name}`);
      await takePostRequest("activityStarBackDrawPrize");
      await $.wait(2000);
    } else if ($.onePrize.state === 0) {
      runFlag = true;
    }
  }
  if (!runFlag) {
    console.log(`该明星小店已完成所有抽奖`);
    return;
  }
  $.taskList = [];
  await takePostRequest("apTaskList");
  await $.wait(2000);
  for (let i = 0; i < $.taskList.length; i++) {
    $.oneTask = $.taskList[i];
    if ($.oneTask.taskFinished) {
      console.log(`任务：${$.oneTask.taskTitle}，已完成`);
      continue;
    }
    if ($.oneTask.taskType === "SHARE_INVITE") {
      continue;
    }
    console.log(`去做任务：${$.oneTask.taskTitle}`);
    if ($.oneTask.taskType === "SIGN") {
      await takePostRequest("SIGN");
      await $.wait(2000);
    } else if ($.oneTask.taskType === "BROWSE_CHANNEL" || $.oneTask.taskType === "FOLLOW_SHOP") {
      $.taskDetail = {};
      $.taskItemList = [];
      await takePostRequest("apTaskDetail");
      $.taskItemList = $.taskDetail.taskItemList || [];
      for (let j = 0; j < $.taskItemList.length; j++) {
        $.oneItemInfo = $.taskItemList[j];
        console.log(`浏览：${$.oneItemInfo.itemName}`);
        await takePostRequest("apDoTask");
        await $.wait(2000);
      }
    }
  }
}

async function takePostRequest(type) {
  let body = ``;
  let myRequest = ``;
  switch (type) {
    case "activityStarBackGetProgressBarInfo":
      body = `functionId=activityStarBackGetProgressBarInfo&body={"starId":"${$.uniqueId}","linkId":"Y2aqxng42hZ0eGxGtbCMiQ"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case "apTaskList":
      body = `functionId=apTaskList&body={"uniqueId":"${$.uniqueId}","linkId":"Y2aqxng42hZ0eGxGtbCMiQ"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case "SIGN":
      body = `functionId=apDoTask&body={"taskType":"${$.oneTask.taskType}","taskId":${$.oneTask.id},"uniqueId":"${
        $.uniqueId
      }","linkId":"Y2aqxng42hZ0eGxGtbCMiQ"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case "apTaskDetail":
      body = `functionId=apTaskDetail&body={"taskType":"${$.oneTask.taskType}","taskId":${$.oneTask.id},"uniqueId":"${
        $.uniqueId
      }","channel":4,"linkId":"Y2aqxng42hZ0eGxGtbCMiQ"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case "apDoTask":
      body = `functionId=apDoTask&body={"taskType":"${$.oneTask.taskType}","taskId":${$.oneTask.id},"uniqueId":"${
        $.uniqueId
      }","channel":4,"linkId":"Y2aqxng42hZ0eGxGtbCMiQ","itemId":"${encodeURIComponent($.oneItemInfo.itemId)}"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case "help":
      body = `functionId=activityStarBackGetProgressBarInfo&body={"starId":"${$.uniqueId}","sharePin":"${
        $.oneCode
      }","taskId":"129","linkId":"Y2aqxng42hZ0eGxGtbCMiQ"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    case "activityStarBackDrawPrize":
      body = `functionId=activityStarBackDrawPrize&body={"starId":"${$.uniqueId}","poolId":${$.onePrize.id},"pos":${
        $.onePrize.pos
      },"linkId":"Y2aqxng42hZ0eGxGtbCMiQ"}&_t=${Date.now()}&appid=activities_platform`;
      myRequest = getPostRequest(body);
      break;
    default:
      console.log(`错误${type}`);
  }
  return new Promise(async (resolve) => {
    $.post(myRequest, (err, resp, data) => {
      try {
        dealReturn(type, data);
      } catch (e) {
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
    console.log(`返回异常：${data}`);
    return;
  }
  switch (type) {
    case "activityStarBackGetProgressBarInfo":
      if (data.code === 0) {
        console.log(`${data.data.shareText}`);
        $.helpCode = data.data.encryptPin;
        $.info = data.data;
      }
      break;
    case "apTaskList":
      if (data.code === 0) {
        $.taskList = data.data;
      }
      break;
    case "SIGN":
      if (data.code === 0) {
        console.log("签到成功");
      }
      break;
    case "apTaskDetail":
      if (data.code === 0) {
        $.taskDetail = data.data;
      }
      break;
    case "apDoTask":
      if (data.code === 0) {
        console.log("成功");
      }
      break;
    case "help":
      console.log("助力结果：" + JSON.stringify(data));
      break;
    case "activityStarBackDrawPrize":
      if (data.code === 0) {
        if (data.data.prizeType === 0) {
          console.log(`未抽中`);
        } else {
          console.log(`恭喜你、抽中了`);
        }
      }
      console.log(JSON.stringify(data));
      break;
    default:
      console.log("异常");
      console.log(JSON.stringify(data));
  }
}

function getPostRequest(body) {
  const url = `https://api.m.jd.com/`;
  const method = `POST`;
  const headers = {
    Accept: `application/json, text/plain, */*`,
    Origin: `https://prodev.m.jd.com`,
    "Accept-Encoding": `gzip, deflate, br`,
    Cookie: $.cookie,
    "Content-Type": `application/x-www-form-urlencoded`,
    Host: `api.m.jd.com`,
    Connection: `keep-alive`,
    "User-Agent": $.isNode()
      ? process.env.JD_USER_AGENT
        ? process.env.JD_USER_AGENT
        : require("./USER_AGENTS").USER_AGENT
      : $.getdata("JDUA")
      ? $.getdata("JDUA")
      : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    Referer: `https://prodev.m.jd.com/mall/active/b68M1tZSjGrMYa64hMKsX5jRdWL/index.html`,
    "Accept-Language": `zh-cn`,
  };

  return { url: url, method: method, headers: headers, body: body };
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
/**
 * 随机从一数组里面取
 * @param arr
 * @param count
 * @returns {Buffer}
 */
function getRandomArrayElements(arr, count) {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - count,
    temp,
    index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

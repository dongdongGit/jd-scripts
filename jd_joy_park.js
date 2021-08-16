/*
入口 极速版 汪汪乐园
新用户第一次想设置主号拉邀请就先分享到QQ查看邀请码 inviter就是
运行脚本查看邀请码
#自定义邀请码变量 
export joyinviterPin=""
====================
*/
// [task_local]
// #汪汪乐园
// 30 2,20 * * * node /scripts/jd_joy_park.js >> /scripts/logs/jd_joy_park.log 2>&1
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("汪汪乐园");
const notify = $.isNode() ? require("./sendNotify") : "";
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  message;

let codeList = [];
let codeList1 = [];

let joyinviterPin = "";
if (process.env.joyinviterPin) {
  joyinviterPin = process.env.joyinviterPin;
}

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false") console.log = () => {};
} else {
  cookiesArr = [$.getdata("CookieJD"), $.getdata("CookieJD2"), ...jd_helpers.jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = "https://api.m.jd.com/client.action";

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }

  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      ck2 = cookiesArr[Math.round(Math.random() * 3)];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      message = "";
      await TotalBean();
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

      await joyBaseInfo();
      await joyList();
      //await joyBuy()
      await tasklist();
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });
function joyBaseInfo() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=joyBaseInfo&body={"taskId":"","inviteType":"","inviterPin":"","linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625484389026&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);

        if (data.errMsg == "success") {
          dj = data.data.level;
          gmdj = data.data.fastBuyLevel;
          jb = data.data.joyCoin;
          yqm = data.data.invitePin;
          $.log(`\n===================================`);
          $.log(`🐶旺财等级:${dj}\n🐶购买旺财等级:${gmdj}\n🐶当前金币:${jb}\n🐶邀请码:${yqm}\n===================================\n`);
        } else if (data.errMsg == "操作失败") {
          console.log("操作失败");
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function joyList() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/?functionId=joyList&body={%22linkId%22:%22LsQNxL7iWDlXUs6cFl-AAg%22}&_t=1625484389027&appid=activities_platform`,

      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.get(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);

        if (data.errMsg == "success") {
          joyNumber = data.data.joyNumber;
          $.log(`\n===================================`);
          $.log(`总共养了:${joyNumber}🐶只旺财\n===================================\n`);
          $.log(`可购买：${10 - joyNumber}`);
          if (joyNumber !== 10) {
            for (let k = 0; k < 10 - joyNumber; k++) {
              await joyBuy();
            }
          }
          workJoyInfoList = data.data.workJoyInfoList;
          for (let i = 0; i < workJoyInfoList.length; i++) {
            location = workJoyInfoList[i].location;
            unlock = workJoyInfoList[i].unlock;
            if (unlock == true) {
              $.log(`${location}号地 此地已开`);
            } else if (unlock == false) {
              $.log(`${location}号地 此地未开 快去邀请好友开采`);
            }
            joyDTO = workJoyInfoList[i].joyDTO;
            if (joyDTO !== null) {
              doid = workJoyInfoList[i].joyDTO.id;
              dolevel = workJoyInfoList[i].joyDTO.level;
              doname = workJoyInfoList[i].joyDTO.name;
              $.log(`🐶正在挖土的旺财:${doname}\n🐶等级:${dolevel}\n🐶旺财ID:${doid}\n===================================\n`);
            } else if (joyDTO == null) {
              $.log(`🐶此地还没旺财去挖土\n`);
              $.log(`\n===================================`);
            }
          }
          activityJoyList = data.data.activityJoyList;
          for (let k = 0; k < activityJoyList.length; k++) {
            wcid = activityJoyList[k].id;
            wcname = activityJoyList[k].name;
            wcdj = activityJoyList[k].level;
            wchs = activityJoyList[k].recoveryPrice;
            codeList[codeList.length] = wcid;
            codeList1[codeList1.length] = wcdj;
            for (l = 0; l < codeList.length && codeList1.length; l++) {
              if (codeList[l] == codeList[l]) {
                await joyMerge(codeList[1], codeList[l]);
                await joyMerge(codeList[2], codeList[l]);
                await joyMerge(codeList[3], codeList[l]);
                await joyMerge(codeList[4], codeList[l]);
                await joyMerge(codeList[5], codeList[l]);
                await joyMerge(codeList[6], codeList[l]);
                await joyMerge(codeList[7], codeList[l]);
                await joyMerge(codeList[8], codeList[l]);
                await joyMerge(codeList[9], codeList[l]);
                await joyMerge(codeList[10], codeList[l]);
                //$.log(`${codeList[l]} ${codeList1[l]}`)
                //$.log(codeList1[l])
              }
            }

            $.log(`🐶旺财:${wcname}\n🐶等级:${wcdj}\n🐶旺财ID:${wcid}\n🐶回收价格:${wchs}\n===================================\n`);
          }
        } else if (data.errMsg == "操作失败") {
          console.log("操作失败");
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function joyMerge(a, b) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=joyMerge&body={"joyOneId":${a},"joyTwoId":${b},"linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625488466557&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);

        if (data.errMsg == "success") {
          hcid = data.data.joyVO.id;
          hcname = data.data.joyVO.name;
          hcdj = data.data.joyVO.level;
          hchs = data.data.joyVO.recoveryPrice;
          $.log(`\n===================================`);
          $.log(`🐶合成旺财:${hcname}\n🐶合成等级:${hcdj}\n🐶合成旺财ID:${hcid}\n🐶合成回收价格:${hchs}\n===================================\n`);
        }
        //else  if(data.errMsg == "操作失败"){

        // console.log("操作失败")

        //}
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function joyBuy() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=joyBuy&body={"level":${gmdj},"linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625536191020&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);

        if (data.errMsg == "success") {
          buyid = data.data.id;
          buyname = data.data.name;
          buydj = data.data.level;
          buyhs = data.data.recoveryPrice;
          $.log(`\n===================================`);
          $.log(`🐶购买旺财:${buyname}\n🐶购买等级:${buydj}\n🐶购买旺财ID:${buyid}\n🐶购买回收价格:${buyhs}\n===================================\n`);
        } else if (data.errMsg == "操作失败") {
          console.log("操作失败");
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function tasklist() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=apTaskList&body={"linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625536971467&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        //"Cookie": cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);

        if (data.success == true) {
          task = data.data;
          signtaskType = task[0].taskType;
          signtaskid = task[0].id;
          $.log(`\n===============签到===============`);
          await dotask(signtaskType, signtaskid);
          await apTaskDrawAward(signtaskType, signtaskid);
          $.log(`\n===============浏览===============`);
          lltaskType = task[3].taskType;
          llsigntaskid = task[3].id;
          await dotask(lltaskType, llsigntaskid, "70409858773");
          await apTaskDrawAward(lltaskType, llsigntaskid, "70409858773");
          await dotask(lltaskType, llsigntaskid, "10029398355348");
          await apTaskDrawAward(lltaskType, llsigntaskid, "10029398355348");
          await dotask(lltaskType, llsigntaskid, "10026179886685");
          await apTaskDrawAward(lltaskType, llsigntaskid, "10026179886685");
          await dotask(lltaskType, llsigntaskid, "10032911040996");
          await apTaskDrawAward(lltaskType, llsigntaskid, "10032911040996");
          await dotask(lltaskType, llsigntaskid, "10033042710323");
          await apTaskDrawAward(lltaskType, llsigntaskid, "10033042710323");
          await dotask(lltaskType, llsigntaskid, "59304295243");
          await apTaskDrawAward(lltaskType, llsigntaskid, "59304295243");
          await dotask(lltaskType, llsigntaskid, "10029677756218");
          await apTaskDrawAward(lltaskType, llsigntaskid, "10029677756218");
          await dotask(lltaskType, llsigntaskid, "10032928241364");
          await apTaskDrawAward(lltaskType, llsigntaskid, "10032928241364");
          await dotask(lltaskType, llsigntaskid, "10032992559557");
          await apTaskDrawAward(lltaskType, llsigntaskid, "10032992559557");
          await dotask(lltaskType, llsigntaskid, "10028926270219");
          await apTaskDrawAward(lltaskType, llsigntaskid, "10028926270219");
          $.log(`\n===============浏览会场===============`);
          ll1taskType = task[2].taskType;
          ll1signtaskid = task[2].id;
          await dotask(ll1taskType, ll1signtaskid, "https://prodev.m.jd.com/jdlite/active/4SuoxWhFFp5P8SpYoMm6iFuFrXxC/index.html");
          await apTaskDrawAward(ll1taskType, ll1signtaskid, "https://prodev.m.jd.com/jdlite/active/4SuoxWhFFp5P8SpYoMm6iFuFrXxC/index.html");
          await dotask(ll1taskType, ll1signtaskid, "https://pro.m.jd.com/jdlite/active/BMvPWMK1RsN4PWh1JksQUnRCxPy/index.html");
          await apTaskDrawAward(ll1taskType, ll1signtaskid, "https://pro.m.jd.com/jdlite/active/BMvPWMK1RsN4PWh1JksQUnRCxPy/index.html");
          await dotask(ll1taskType, ll1signtaskid, "https://pro.m.jd.com/jdlite/active/3H885vA4sQj6ctYzzPVix4iiYN2P/index.html");
          await apTaskDrawAward(ll1taskType, ll1signtaskid, "https://pro.m.jd.com/jdlite/active/3H885vA4sQj6ctYzzPVix4iiYN2P/index.html");
          await dotask(ll1taskType, ll1signtaskid, "https://pro.m.jd.com/jdlite/active/vN4YuYXS1mPse7yeVPRq4TNvCMR/index.html");
          await apTaskDrawAward(ll1taskType, ll1signtaskid, "https://pro.m.jd.com/jdlite/active/vN4YuYXS1mPse7yeVPRq4TNvCMR/index.html");
          await dotask(ll1taskType, ll1signtaskid, "https://pro.m.jd.com/jdlite/active/4AMo3SQzbqAzJgowhXqvt8Dpo8iA/index.html");
          await apTaskDrawAward(ll1taskType, ll1signtaskid, "https://pro.m.jd.com/jdlite/active/4AMo3SQzbqAzJgowhXqvt8Dpo8iA/index.html");
          $.log(`\n===============邀请任务===============`);

          await inviteType();
          await apTaskinviter();

          $.log(`\n===============开地邀请===============`);

          await openinvite();
          //$.log(`\n===============升级奖励===============`)
          //await levelDrawAward()

          console.log("操作失败");
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function openinvite() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=joyBaseInfo&body={"taskId":"","inviteType":"2","inviterPin":"${joyinviterPin}","linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625540360946&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      //$.log(data)
      try {
        data = JSON.parse(data);

        if (data.success == true) {
          $.log(data.errMsg);
        } else if (data.success == false) {
          console.log(data.errMsg + "或者你的CK不足");
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function inviteType() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=joyBaseInfo&body={"taskId":"167","inviteType":"1","inviterPin":"${joyinviterPin}","linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625540360946&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      //$.log(data)
      try {
        data = JSON.parse(data);

        if (data.success == true) {
          $.log(data.errMsg);
        } else if (data.success == false) {
          console.log(data.errMsg + "或者你的CK不足");
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function levelDrawAward() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=joyBaseInfo&body={"taskId":"167","inviteType":"1","inviterPin":"${yqm}","linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625545015696&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      //$.log(data)
      try {
        data = JSON.parse(data);

        if (data.success == true) {
          $.log(data.errMsg);
        } else if (data.success == false) {
          console.log(data.errMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function dotask(taskType, taskid, itemId) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=apDoTask&body={"taskType":"${taskType}","taskId":${taskid},"channel":4,"linkId":"LsQNxL7iWDlXUs6cFl-AAg","itemId":"${itemId}"}&_t=1625537021966&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      //$.log(data)
      try {
        data = JSON.parse(data);

        if (data.success == true) {
          if (data.data.finished == true) {
            $.log("任务完成");
          } else if (data.data.finished == false) {
            $.log(data.errMsg);
          }
        } else if (data.success == false) {
          console.log(data.errMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
//functionId=joyBaseInfo&body={"taskId":"167","inviteType":"1","inviterPin":"IANWqUmbgQVF9ePHGsGFA2m-zSTLKmHFbE-IW-Waarw","linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625543629130&appid=activities_platform
function apTaskinviter() {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=joyBaseInfo&body={"taskId":"167","inviteType":"1","inviterPin":"${yqm}","linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625543629130&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);

        if (data.success == true) {
          data.errMsg;
        } else if (data.success == false) {
          console.log(data.errMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function apTaskDrawAward(taskType, taskid) {
  return new Promise(async (resolve) => {
    let options = {
      url: `https://api.m.jd.com/`,

      body: `functionId=apTaskDrawAward&body={"taskType":"${taskType}","taskId":${taskid},"linkId":"LsQNxL7iWDlXUs6cFl-AAg"}&_t=1625537021966&appid=activities_platform`,
      headers: {
        Origin: "https://joypark.jd.com",
        Host: "api.m.jd.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 UBrowser/5.6.12150.8 Safari/537.36",
        Cookie: cookie,
      },
    };

    $.post(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);

        if (data.success == true) {
          DrawAward = data.data;

          DrawAward = DrawAward[0].awardGivenNumber;
          $.log("获得旺财币：" + DrawAward);
        } else if (data.success == false) {
          console.log(data.errMsg);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function taskPostUrl(functionId, body) {
  return {
    url: `${JD_API_HOST}`,
    body: `functionId=${functionId}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&appid=content_ecology&uuid=6898c30638c55142969304c8e2167997fa59eb54&t=1622588448365`,
    headers: {
      Cookie: cookie,
      Host: "api.m.jd.com",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require("./USER_AGENTS").USER_AGENT
        : $.getdata("JDUA")
        ? $.getdata("JDUA")
        : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      "Accept-Language": "zh-cn",
      "Accept-Encoding": "gzip, deflate, br",
    },
  };
}

async function TotalBean() {
  return new Promise(async (resolve) => {
    const options = {
      url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      headers: {
        Accept: "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        Connection: "keep-alive",
        Cookie: cookie,
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

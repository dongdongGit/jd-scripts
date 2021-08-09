/*
领京豆额外奖励&抢京豆
活动入口：京东APP首页-领京豆
更新地址：jd_bean_home.js
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#领京豆额外奖励
23 1,12,22 * * * jd_bean_home.js, tag=领京豆额外奖励, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_bean_home.png, enabled=true
================Loon==============
[Script]
cron "23 1,12,22 * * *" script-path=jd_bean_home.js, tag=领京豆额外奖励
===============Surge=================
领京豆额外奖励 = type=cron,cronexp="23 1,12,22 * * *",wake-system=1,timeout=3600,script-path=jd_bean_home.js
============小火箭=========
领京豆额外奖励 = type=cron,script-path=jd_bean_home.js, cronexpr="23 1,12,22 * * *", timeout=3600, enable=true
 */
const jd_heplers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("领京豆额外奖励");

const notify = $.isNode() ? require("./sendNotify") : "";
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
const helpAuthor = true; // 是否帮助作者助力，false打开通知推送，true关闭通知推送
const qjd = true; // 抢京豆开关，默认开
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  uuid = "",
  message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === "false")
    console.log = () => {};
} else {
  cookiesArr = [
    $.getdata("CookieJD"),
    $.getdata("CookieJD2"),
    ...jsonParse($.getdata("CookiesJD") || "[]").map((item) => item.cookie),
  ].filter((item) => !!item);
}
const JD_API_HOST = "https://api.m.jd.com/";
!(async () => {
  $.newShareCodes = [];
  $.authorCode = [];
  if (!cookiesArr[0]) {
    $.msg(
      $.name,
      "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取",
      "https://bean.m.jd.com/bean/signIndex.action",
      { "open-url": "https://bean.m.jd.com/bean/signIndex.action" }
    );
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(
        cookie.match(/pt_pin=([^; ]+)(?=;?)/) &&
          cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
      );
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      message = "";
      uuid = randomString();
      await TotalBean();
      console.log(
        `\n******开始【京东账号${$.index}】${
          $.nickName || $.UserName
        }*********\n`
      );
      if (!$.isLogin) {
        $.msg(
          $.name,
          `【提示】cookie已失效`,
          `京东账号${$.index} ${
            $.nickName || $.UserName
          }\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`,
          { "open-url": "https://bean.m.jd.com/bean/signIndex.action" }
        );

        if ($.isNode()) {
          await notify.sendNotify(
            `${$.name}cookie已失效 - ${$.UserName}`,
            `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`
          );
        }
        continue;
      }
      await jdBeanHome();
    }
  }
  if (qjd) {
    for (let i = 0; i < cookiesArr.length; i++) {
      $.index = i + 1;
      if (cookiesArr[i]) {
        cookie = cookiesArr[i];
        $.canHelp = true;
        $.UserName = decodeURIComponent(
          cookie.match(/pt_pin=([^; ]+)(?=;?)/) &&
            cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
        );
        if ($.newShareCodes.length > 1) {
          console.log(`\n【抢京豆】 ${$.UserName} 去助力排名第一的cookie`);
          // let code = $.newShareCodes[(i + 1) % $.newShareCodes.length]
          // await help(code[0], code[1])
          let code = $.newShareCodes[0];
          if (code[2] && code[2] === $.UserName) {
            //不助力自己
          } else {
            await help(code[0], code[1]);
          }
        }
        if (helpAuthor && $.authorCode && $.canHelp) {
          console.log(`\n【抢京豆】${$.UserName} 去帮助作者`);
          for (let code of $.authorCode) {
            const helpRes = await help(code.shareCode, code.groupCode);
            if (helpRes && helpRes["code"] === "0") {
              if (
                helpRes &&
                helpRes.data &&
                helpRes.data.respCode === "SG209"
              ) {
                console.log(`${helpRes.data.helpToast}\n`);
                break;
              }
            } else {
              console.log(`助力异常:${JSON.stringify(helpRes)}\n`);
            }
          }
        }
        for (let j = 1; j < $.newShareCodes.length && $.canHelp; j++) {
          let code = $.newShareCodes[j];
          if (code[2] && code[2] === $.UserName) {
            //不助力自己
          } else {
            console.log(`【抢京豆】${$.UserName} 去助力账号 ${j + 1}`);
            await help(code[0], code[1]);
            await $.wait(2000);
          }
        }
      }
    }
  }
})()
  .catch((e) => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

async function jdBeanHome() {
  try {
    $.doneState = false;
    // for (let i = 0; i < 3; ++i) {
    //   await doTask2()
    //   await $.wait(1000)
    //   if ($.doneState) break
    // }
    do {
      await doTask2();
      await $.wait(3000);
    } while (!$.doneState);
    await $.wait(1000);
    await award("feeds");
    await $.wait(1000);
    await getUserInfo();
    await $.wait(1000);
    await getTaskList();
    await receiveJd2();

    await morningGetBean();
    await $.wait(1000);

    await beanTaskList(1);
    await $.wait(1000);
    await queryCouponInfo();
    $.doneState = false;
    do {
      await $.wait(2000);
      await beanTaskList(2);
    } while (!$.doneState);
    await $.wait(2000);
    if ($.doneState) await beanTaskList(3);

    await showMsg();
  } catch (e) {
    $.logErr(e);
  }
}

// 早起福利
function morningGetBean() {
  return new Promise((resolve) => {
    $.post(
      taskBeanUrl("morningGetBean", {
        fp: "-1",
        shshshfp: "-1",
        shshshfpa: "-1",
        referUrl: "-1",
        userAgent: "-1",
        jda: "-1",
        rnVersion: "3.9",
      }),
      (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} morningGetBean API请求失败，请检查网路重试`);
          } else {
            if (jd_heplers.safeGet(data)) {
              data = JSON.parse(data);
              if (data.data.awardResultFlag === "1") {
                console.log(`早起福利领取成功：${data.data.bizMsg}`);
              } else if (data.data.awardResultFlag === "2") {
                console.log(`早起福利领取失败：${data.data.bizMsg}`);
              } else {
                console.log(`早起福利领取失败：${data.data.bizMsg}`);
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      }
    );
  });
}

// 升级领京豆任务
async function beanTaskList(type) {
  return new Promise((resolve) => {
    $.post(
      taskBeanUrl("beanTaskList", { viewChannel: "myjd" }),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} beanTaskList API请求失败，请检查网路重试`);
          } else {
            if (jd_heplers.safeGet(data)) {
              data = JSON.parse(data);
              switch (type) {
                case 1:
                  console.log(
                    `当前等级:${data.data.curLevel} 下一级可领取:${
                      data.data.nextLevelBeanNum || 0
                    }京豆`
                  );
                  if (!data.data.viewAppHome.takenTask) {
                    console.log(`去做[${data.data.viewAppHome.mainTitle}]`);
                    await beanHomeIconDoTask({
                      flag: "0",
                      viewChannel: "myjd",
                    });
                  }
                  await $.wait(2000);
                  if (!data.data.viewAppHome.doneTask) {
                    console.log(`去领奖[${data.data.viewAppHome.mainTitle}]`);
                    await beanHomeIconDoTask({
                      flag: "1",
                      viewChannel: "AppHome",
                    });
                  } else {
                    console.log(`[${data.data.viewAppHome.mainTitle}]已做完`);
                  }
                  break;
                case 2:
                  $.doneState = true;
                  let taskInfos = data.data.taskInfos;
                  for (let key of Object.keys(taskInfos)) {
                    let vo = taskInfos[key];
                    if (vo.times < vo.maxTimes) {
                      for (let key of Object.keys(vo.subTaskVOS)) {
                        let taskList = vo.subTaskVOS[key];
                        if (taskList.status === 1) {
                          $.doneState = false;
                          console.log(`去做[${vo.taskName}]${taskList.title}`);
                          await $.wait(2000);
                          await beanDoTask(
                            {
                              actionType: 1,
                              taskToken: `${taskList.taskToken}`,
                            },
                            vo.taskType
                          );
                          if (vo.taskType === 9) {
                            await $.wait(3000);
                            await beanDoTask(
                              {
                                actionType: 0,
                                taskToken: `${taskList.taskToken}`,
                              },
                              vo.taskType
                            );
                          }
                        }
                      }
                    }
                  }
                  break;
                case 3:
                  let taskInfos3 = data.data.taskInfos;
                  for (let key of Object.keys(taskInfos3)) {
                    let vo = taskInfos3[key];
                    if (vo.times === vo.maxTimes) {
                      console.log(`[${vo.taskName}]已做完`);
                    }
                  }
                default:
                  break;
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}
function beanDoTask(body, taskType) {
  return new Promise((resolve) => {
    $.post(taskBeanUrl("beanDoTask", body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} beanDoTask API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (body.actionType === 1 && taskType !== 9) {
              if (data.code === "0" && data.data.bizCode === "0") {
                console.log(`完成任务，获得+${data.data.score}成长值`);
              } else {
                console.log(`完成任务失败：${data}`);
              }
            }
            if (body.actionType === 0) {
              if (data.code === "0" && data.data.bizCode === "0") {
                console.log(data.data.bizMsg);
              } else {
                console.log(`完成任务失败：${data}`);
              }
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
function beanHomeIconDoTask(body) {
  return new Promise((resolve) => {
    $.post(taskBeanUrl("beanHomeIconDoTask", body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(
            `${$.name} beanHomeIconDoTask API请求失败，请检查网路重试`
          );
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (body.flag === "0" && data.data.taskResult) {
              console.log(data.data.remindMsg);
            }
            if (body.flag === "1" && data.data.taskResult) {
              console.log(data.data.remindMsg);
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
async function queryCouponInfo() {
  return new Promise(async (resolve) => {
    $.get(
      taskBeanUrl("queryCouponInfo", {
        rnVersion: "4.7",
        fp: "-1",
        shshshfp: "-1",
        shshshfpa: "-1",
        referUrl: "-1",
        userAgent: "-1",
        jda: "-1",
      }),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(
              `${$.name} queryCouponInfo API请求失败，请检查网路重试`
            );
          } else {
            if (jd_heplers.safeGet(data)) {
              data = JSON.parse(data);
              if (data.data && data.data.couponTaskInfo) {
                if (!data.data.couponTaskInfo.awardFlag) {
                  console.log(`去做[${data.data.couponTaskInfo.taskName}]`);
                  await sceneGetCoupon();
                } else {
                  console.log(`[${data.data.couponTaskInfo.taskName}]已做完`);
                }
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}
function sceneGetCoupon() {
  return new Promise((resolve) => {
    $.get(
      taskBeanUrl("sceneGetCoupon", {
        rnVersion: "4.7",
        fp: "-1",
        shshshfp: "-1",
        shshshfpa: "-1",
        referUrl: "-1",
        userAgent: "-1",
        jda: "-1",
      }),
      (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} sceneGetCoupon API请求失败，请检查网路重试`);
          } else {
            if (jd_heplers.safeGet(data)) {
              data = JSON.parse(data);
              if (data.code === "0" && data.data && data.data.bizMsg) {
                console.log(data.data.bizMsg);
              } else {
                console.log(`完成任务失败：${data}`);
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}
function randomString() {
  return (
    Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10)
  );
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
function doTask2() {
  return new Promise((resolve) => {
    const body = {
      awardFlag: false,
      skuId: `${getRandomInt(10000000, 20000000)}`,
      source: "feeds",
      type: "1",
    };
    $.post(taskUrl("beanHomeTask", body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === "0" && data.data) {
              console.log(
                `任务完成进度：${data.data.taskProgress}/${data.data.taskThreshold}`
              );
              if (data.data.taskProgress === data.data.taskThreshold)
                $.doneState = true;
            } else if (data.code === "0" && data.errorCode === "HT201") {
              $.doneState = true;
            } else {
              //HT304风控用户
              $.doneState = true;
              console.log(`做任务异常：${JSON.stringify(data)}`);
            }
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
function getUserInfo() {
  return new Promise((resolve) => {
    $.post(
      taskUrl("signBeanGroupStageIndex", "body"),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`);
            console.log(`${$.name} API请求失败，请检查网路重试`);
          } else {
            if (jd_heplers.safeGet(data)) {
              data = JSON.parse(data);
              if (data.data.jklInfo) {
                $.actId = data.data.jklInfo.keyId;
                let { shareCode, groupCode } = data.data;
                if (!shareCode) {
                  console.log(`未获取到助力码，去开团`);
                  await hitGroup();
                } else {
                  console.log(shareCode, groupCode);
                  // 去做逛会场任务
                  if (
                    data.data.beanActivityVisitVenue &&
                    data.data.beanActivityVisitVenue.taskStatus === "0"
                  ) {
                    await help(shareCode, groupCode, 1);
                  }
                  console.log(
                    `\n京东账号${$.index} ${
                      $.nickName || $.UserName
                    } 抢京豆邀请码：${shareCode}\n`
                  );
                  $.newShareCodes.push([shareCode, groupCode, $.UserName]);
                }
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      }
    );
  });
}

function hitGroup() {
  return new Promise((resolve) => {
    const body = { activeType: 2 };
    $.get(taskGetUrl("signGroupHit", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.respCode === "SG150") {
              let { shareCode, groupCode } = data.data.signGroupMain;
              if (shareCode) {
                $.newShareCodes.push([shareCode, groupCode, $.UserName]);
                console.log("开团成功");
                console.log(
                  `\n京东账号${$.index} ${
                    $.nickName || $.UserName
                  } 抢京豆邀请码：${shareCode}\n`
                );
                await help(shareCode, groupCode, 1);
              } else {
                console.log(
                  `为获取到助力码，错误信息${JSON.stringify(data.data)}`
                );
              }
            } else {
              console.log(`开团失败，错误信息${JSON.stringify(data.data)}`);
            }
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

function help(shareCode, groupCode, isTask = 0) {
  return new Promise((resolve) => {
    const body = {
      activeType: 2,
      groupCode: groupCode,
      shareCode: shareCode,
      activeId: $.actId,
    };
    if (isTask) {
      console.log(`【抢京豆】做任务获取助力`);
      body["isTask"] = "1";
    } else {
      console.log(`【抢京豆】去助力好友${shareCode}`);
      body["source"] = "guest";
    }
    $.get(taskGetUrl("signGroupHelp", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`【抢京豆】${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === "0") {
              console.log(`【抢京豆】${data.data.helpToast}`);
            }
            if (
              data.code === "0" &&
              data.data &&
              data.data.respCode === "SG209"
            ) {
              $.canHelp = false;
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

function showMsg() {
  return new Promise((resolve) => {
    if (message)
      $.msg($.name, "", `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve();
  });
}

function getTaskList() {
  return new Promise((resolve) => {
    const body = { rnVersion: "4.7", rnClient: "2", source: "AppHome" };
    $.post(taskUrl("findBeanHome", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            let beanTask = data.data.floorList.filter(
              (vo) => vo.floorName === "种豆得豆定制化场景"
            )[0];
            if (!beanTask.viewed) {
              await receiveTask();
              await $.wait(3000);
            }

            let tasks = data.data.floorList.filter(
              (vo) => vo.floorName === "赚京豆"
            )[0]["stageList"];
            for (let i = 0; i < tasks.length; ++i) {
              const vo = tasks[i];
              if (vo.viewed) continue;
              await receiveTask(vo.stageId, `4_${vo.stageId}`);
              await $.wait(3000);
            }
            await award();
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

function receiveTask(itemId = "zddd", type = "3") {
  return new Promise((resolve) => {
    const body = {
      awardFlag: false,
      itemId: itemId,
      source: "home",
      type: type,
    };
    $.post(taskUrl("beanHomeTask", body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.data) {
              console.log(
                `完成任务成功，进度${data.data.taskProgress}/${data.data.taskThreshold}`
              );
            } else {
              console.log(`完成任务失败，${data.errorMessage}`);
            }
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

function award(source = "home") {
  return new Promise((resolve) => {
    const body = { awardFlag: true, source: source };
    $.post(taskUrl("beanHomeTask", body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (data.data) {
              console.log(`领奖成功，获得 ${data.data.beanNum} 个京豆`);
              message += `领奖成功，获得 ${data.data.beanNum} 个京豆\n`;
            } else {
              console.log(`领奖失败，${data.errorMessage}`);
              // message += `领奖失败，${data.errorMessage}\n`
            }
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
function receiveJd2() {
  var headers = {
    Host: "api.m.jd.com",
    "content-type": "application/x-www-form-urlencoded",
    accept: "*/*",
    "user-agent": "JD4iPhone/167515 (iPhone; iOS 14.2; Scale/3.00)",
    "accept-language":
      "zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6",
    Cookie: cookie,
  };
  var dataString =
    "body=%7B%7D&build=167576&client=apple&clientVersion=9.4.3&openudid=53f4d9c70c1c81f1c8769d2fe2fef0190a3f60d2&osVersion=14.2&partner=TF&rfs=0000&scope=10&screen=1242%2A2208&sign=19c33b5b9ad4f02c53b6040fc8527119&st=1614701322170&sv=122";
  var options = {
    url: "https://api.m.jd.com/client.action?functionId=sceneInitialize",
    headers: headers,
    body: dataString,
  };
  return new Promise((resolve) => {
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          if (jd_heplers.safeGet(data)) {
            data = JSON.parse(data);
            if (data["code"] === "0" && data["data"]) {
              console.log(
                `强制开启新版领京豆成功,获得${data["data"]["sceneLevelConfig"]["beanNum"]}京豆\n`
              );
              $.msg(
                $.name,
                "",
                `强制开启新版领京豆成功\n获得${data["data"]["sceneLevelConfig"]["beanNum"]}京豆`
              );
            } else {
              console.log(`强制开启新版领京豆结果:${JSON.stringify(data)}\n`);
            }
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
function taskGetUrl(function_id, body) {
  return {
    url: `${JD_API_HOST}client.action?functionId=${function_id}&body=${escape(
      JSON.stringify(body)
    )}&appid=ld&clientVersion=9.2.0`,
    headers: {
      Cookie: cookie,
      Host: "api.m.jd.com",
      Accept: "*/*",
      Connection: "keep-alive",
      "User-Agent": $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require("./USER_AGENTS").USER_AGENT
        : $.getdata("JDUA")
        ? $.getdata("JDUA")
        : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      "Accept-Language": "zh-Hans-CN;q=1,en-CN;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
}

function taskBeanUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}client.action?functionId=${function_id}&body=${escape(
      JSON.stringify(body)
    )}&appid=ld&client=apple&clientVersion=10.0.8&uuid=${uuid}&openudid=${uuid}`,
    headers: {
      Cookie: cookie,
      Host: "api.m.jd.com",
      Accept: "*/*",
      Connection: "keep-alive",
      "User-Agent": $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require("./USER_AGENTS").USER_AGENT
        : $.getdata("JDUA")
        ? $.getdata("JDUA")
        : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      "Accept-Language": "zh-cn",
      "Accept-Encoding": "gzip, deflate, br",
      Referer: "https://h5.m.jd.com/",
    },
  };
}

function taskUrl(function_id, body) {
  body["version"] = "9.0.0.1";
  body["monitor_source"] = "plant_app_plant_index";
  body["monitor_refer"] = "";
  return {
    url: JD_API_HOST,
    body: `functionId=${function_id}&body=${escape(
      JSON.stringify(body)
    )}&appid=ld&client=apple&area=5_274_49707_49973&build=167283&clientVersion=9.1.0`,
    headers: {
      Cookie: cookie,
      Host: "api.m.jd.com",
      Accept: "*/*",
      Connection: "keep-alive",
      "User-Agent": $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require("./USER_AGENTS").USER_AGENT
        : $.getdata("JDUA")
        ? $.getdata("JDUA")
        : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
      "Accept-Language": "zh-Hans-CN;q=1,en-CN;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
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
              $.nickName =
                (data["base"] && data["base"].nickname) || $.UserName;
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



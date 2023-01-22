/*
 * 18 10,18 * * * jd_ppdt.js
 */
const jd_helpers = require("./utils/JDHelpers.js");
const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("超级品牌殿堂");
const notify = $.isNode() ? require("./sendNotify") : "";
const jdCookieNode = $.isNode() ? require("./jdCookie.js") : "";
let jdNotify = true;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = "",
  message = "";
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
    ...jd_helpers
      .jsonParse($.getdata("CookiesJD") || "[]")
      .map((item) => item.cookie),
  ].filter((item) => !!item);
}
!(async () => {
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
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(
        cookie.match(/pt_pin=([^; ]+)(?=;?)/) &&
          cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]
      );
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = "";
      $.UA = require("./USER_AGENTS").UARAM();
      //await TotalBean();
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
      await xxx1();
      await $.wait(500);
      //await xxx2();
      //await $.wait(500);
      //await xxx4();
      //await $.wait(500);
      await xxx3();
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

async function xxx1() {
  let opt = {
    url: `https://api.m.jd.com/api?functionId=superBrandDoTask&appid=ProductZ4Brand&client=wh5&t=1674098907204&body=%7B%22source%22%3A%22hall_1111%22%2C%22activityId%22%3A1012465%2C%22encryptProjectId%22%3A%22JFMx7ke6h6KejTzCXQTfpNi8v1L%22%2C%22completionFlag%22%3A1%2C%22encryptAssignmentId%22%3A%22ZoP5xcMECBmUDGUxCzgEqauHHqw%22%2C%22assignmentType%22%3A0%2C%22actionType%22%3A0%7D`,
    headers: {
      Origin: "https://prodev.m.jd.com",
      "User-Agent": $.UA,
      Cookie: cookie,
    },
  };
  return new Promise(async (resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(` API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code == 0) {
            if (data.data.bizCode == 0) {
              if (data.data?.result?.rewards) {
                if (data.data?.result?.rewards[0].awardType === 3) {
                  console.log(
                    ` 恭喜获得 ${data.data?.result?.rewards[0].beanNum} 京豆`
                  );
                } else {
                  console.log(JSON.stringify(data.data?.result?.rewards));
                }
              } else {
                console.log(JSON.stringify(data.data?.result));
              }
            } else {
              console.log(data.data.bizMsg);
            }
          } else {
            console.log(data.msg);
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
async function xxx2() {
  let opt = {
    url: `https://api.m.jd.com/api?functionId=superBrandDoTask&appid=ProductZ4Brand&client=wh5&t=1673920844810&body=%7B%22source%22%3A%22hall_1111%22%2C%22activityId%22%3A1012333%2C%22encryptProjectId%22%3A%222aZfauURe2aNSkpWhRgJYi2SgSJc%22%2C%22completionFlag%22%3A1%2C%22encryptAssignmentId%22%3A%223S59eXDjPwQAH4QbUkFjJg4KztmC%22%2C%22assignmentType%22%3A0%2C%22actionType%22%3A0%7D`,
    headers: {
      Origin: "https://prodev.m.jd.com",
      "User-Agent": $.UA,
      Cookie: cookie,
    },
  };
  return new Promise(async (resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(` API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code == 0) {
            if (data.data.bizCode == 0) {
              if (data.data?.result?.rewards) {
                if (data.data?.result?.rewards[0].awardType === 3) {
                  console.log(
                    ` 恭喜获得 ${data.data?.result?.rewards[0].beanNum} 京豆`
                  );
                } else {
                  console.log(JSON.stringify(data.data?.result?.rewards));
                }
              } else {
                console.log(JSON.stringify(data.data?.result));
              }
            } else {
              console.log(data.data.bizMsg);
            }
          } else {
            console.log(data.msg);
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

async function xxx4() {
  let opt = {
    url: `https://api.m.jd.com/api?functionId=superBrandDoTask&appid=ProductZ4Brand&client=wh5&t=1673920844963&body=%7B%22source%22%3A%22hall_1111%22%2C%22activityId%22%3A1012333%2C%22encryptProjectId%22%3A%222aZfauURe2aNSkpWhRgJYi2SgSJc%22%2C%22completionFlag%22%3A1%2C%22encryptAssignmentId%22%3A%2231EmJRrCLjTuCVq9caCNfgKKhomF%22%2C%22assignmentType%22%3A0%2C%22actionType%22%3A0%7D`,
    headers: {
      Origin: "https://prodev.m.jd.com",
      "User-Agent": $.UA,
      Cookie: cookie,
    },
  };
  return new Promise(async (resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(` API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code == 0) {
            if (data.data.bizCode == 0) {
              if (data.data?.result?.rewards) {
                if (data.data?.result?.rewards[0].awardType === 3) {
                  console.log(
                    ` 恭喜获得 ${data.data?.result?.rewards[0].beanNum} 京豆`
                  );
                } else {
                  console.log(JSON.stringify(data.data?.result?.rewards));
                }
              } else {
                console.log(JSON.stringify(data.data?.result));
              }
            } else {
              console.log(data.data.bizMsg);
            }
          } else {
            console.log(data.msg);
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

async function xxx3() {
  let opt = {
    url: `https://api.m.jd.com/api?functionId=superBrandDoTask&appid=ProductZ4Brand&client=wh5&t=1673920845164&body=%7B%22source%22%3A%22hall_1111%22%2C%22activityId%22%3A%221012353%22%2C%22encryptProjectId%22%3A%22mCqqcvGW1LKeAWqJtc6NwHGXK2u%22%2C%22completionFlag%22%3A1%2C%22encryptAssignmentId%22%3A%22H8VttZkAwM83dpETucHznqaNGAc%22%2C%22assignmentType%22%3A0%2C%22actionType%22%3A0%7D`,
    headers: {
      Origin: "https://prodev.m.jd.com",
      "User-Agent": $.UA,
      Cookie: cookie,
    },
  };
  return new Promise(async (resolve) => {
    $.post(opt, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(` API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code == 0) {
            if (data.data.bizCode == 0) {
              if (data.data?.result?.rewards) {
                if (data.data?.result?.rewards[0].awardType === 3) {
                  console.log(
                    ` 恭喜获得 ${data.data?.result?.rewards[0].beanNum} 京豆`
                  );
                } else {
                  console.log(JSON.stringify(data.data?.result?.rewards));
                }
              } else {
                console.log(JSON.stringify(data.data?.result));
              }
            } else {
              console.log(data.data.bizMsg);
            }
          } else {
            console.log(data.msg);
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

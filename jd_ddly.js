/*
东东乐园@wenmoux
活动入口：东东农场->东东乐园(点大风车
好像没啥用 就20💧
更新地址：https://raw.githubusercontent.com/Wenmoux/scripts/wen/jd/jd_ddnc_farmpark.js
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#东东乐园
30 7 * * * https://raw.githubusercontent.com/Wenmoux/scripts/wen/jd/jd_ddnc_farmpark.js, tag=东东乐园, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

================Loon==============
[Script]
cron "30 7 * * *" script-path=https://raw.githubusercontent.com/Wenmoux/scripts/wen/jd/jd_ddnc_farmpark.js tag=东东乐园

===============Surge=================
东东乐园 = type=cron,cronexp="30 7 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/Wenmoux/scripts/wen/jd/jd_ddnc_farmpark.js

============小火箭=========
东东乐园 = type=cron,script-path=https://raw.githubusercontent.com/Wenmoux/scripts/wen/jd/jd_ddnc_farmpark.js, cronexpr="30 7 * * *", timeout=3600, enable=true

 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('东东乐园');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

const randomCount = $.isNode() ? 20 : 5;
const notify = $.isNode() ? require('./sendNotify') : '';
let merge = {};
let codeList = [];
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

const JD_API_HOST = `https://api.m.jd.com/client.action`;

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
      'open-url': 'https://bean.m.jd.com/',
    });
    return;
  }

  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.beans = 0;
      $.taskList = [];
      message = '';
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await parkInit();
      for (task of $.taskList) {
        if (task.topResource.task.status == 3) {
          console.log(`任务 ${task.topResource.title} 已完成`);
        } else {
          console.log('去浏览：' + task.topResource.title);
          let index = task.name.match(/\d+/)[0] - 1;
          console.log(task.topResource.task.advertId, index, task.type);
          await browse(task.topResource.task.advertId);
          await $.wait(1000);
          await browseAward(task.topResource.task.advertId, index, task.type);
        }
      }
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());
//获取活动信息

function browseAward(id, index, type) {
  return new Promise(async (resolve) => {
    const options = taskUrl('ddnc_farmpark_browseAward', `{"version":"1","channel":1,"advertId":"${id}","index":${index},"type":${type}}`);
    //  console.log(options)
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          //    console.log(data)
          if (data.result) {
            console.log('领取奖励成功,获得💧' + data.result.waterEnergy);
          } else {
            console.log(JSON.stringify(data));
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

function browse(id) {
  return new Promise(async (resolve) => {
    const options = taskUrl('ddnc_farmpark_markBrowser', `{"version":"1","channel":1,"advertId":"${id}"}`);
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          console.log(`浏览 ${id}  : ${data.success}`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function parkInit() {
  return new Promise(async (resolve) => {
    const options = taskUrl('ddnc_farmpark_Init', `{"version":"1","channel":1}`);
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          //    console.log(data)
          if (data.buildings) {
            $.taskList = data.buildings.filter((x) => x.topResource.task);
          } else {
            console.log('获取任务列表失败,你不会是黑鬼吧');
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

function taskUrl(functionId, body) {
  const time = Date.now();
  return {
    url: 'https://api.m.jd.com/client.action',
    body: `functionId=${functionId}&body=${encodeURIComponent(body)}&client=wh5&clientVersion=1.0.0&uuid=`,
    headers: {
      Accept: 'application/json,text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Referer: 'https://h5.m.jd.com/babelDiy/Zeus/J1C5d6E7VHb2vrb5sJijMPuj29K/index.html?babelChannel=ttt1&lng=107.147086&lat=33.255079&sid=cad74d1c843bd47422ae20cadf6fe5aw&un_area=8_573_6627_52446',
      'User-Agent':
        'jdapp;android;9.4.4;10;3b78ecc3f490c7ba;network/UNKNOWN;model/M2006J10C;addressid/138543439;aid/3b78ecc3f490c7ba;oaid/7d5870c5a1696881;osVer/29;appBuild/85576;psn/3b78ecc3f490c7ba|541;psq/2;uid/3b78ecc3f490c7ba;adk/;ads/;pap/JA2015_311210|9.2.4|ANDROID 10;osv/10;pv/548.2;jdv/0|iosapp|t_335139774|appshare|CopyURL|1606277982178|1606277986;ref/com.jd.lib.personal.view.fragment.JDPersonalFragment;partner/xiaomi001;apprpd/MyJD_Main;Mozilla/5.0 (Linux; Android 10; M2006J10C Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045227 Mobile Safari/537.36',
    },
  };
}

/*
京东排行榜
更新时间：2020-11-20 13:55
脚本说明：京东排行榜签到得京豆
活动入口：找不着了，点击脚本通知进入吧
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#京东排行榜
11 9 * * * https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_rankingList.js, tag=京东排行榜, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/jd.png, enabled=true
// Loon
[Script]
cron "11 9 * * *" script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_rankingList.js,tag=京东排行榜
// Surge
京东排行榜 = type=cron,cronexp=11 9 * * *,wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_rankingList.js
 */
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东排行榜');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const needSum = false; //是否需要显示汇总
const STRSPLIT = '|';
let merge = {};
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
} else {
  cookiesArr.push($.getdata('CookieJD'));
  cookiesArr.push($.getdata('CookieJD2'));
}

const JD_API_HOST = `https://api.m.jd.com/client.action?functionId=`;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    if (cookie) {
      if (i) console.log(`\n***************开始京东账号${i + 1}***************`);
      $.isLogin = true;
      await $.totalBean();
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      $.Nname = `京东账号${i + 1}`;
      initial();
      await QueryJDUserInfo();
      if (!merge.enabled) {
        //cookie不可用
        $.setdata('', `CookieJD${i ? i + 1 : ''}`); //cookie失效，故清空cookie。
        $.msg($.name, `【提示】京东账号${i + 1} cookie已过期！请先获取cookie\n直接使用NobyDa的京东签到获取`, 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
        continue;
      }
      await queryTrumpTask();
      await msgShow();
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());

//获取昵称
function QueryJDUserInfo(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
        headers: {
          Referer: `https://wqs.jd.com/my/iserinfo.html`,
          Cookie: cookie,
        },
      };
      $.get(url, (err, resp, data) => {
        try {
          data = JSON.parse(data);
          //console.log(data)
          if (data.retcode === 13) {
            merge.enabled = false;
            return;
          }
          //merge.nickname = data.base.nickname;
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}

//查询任务
function queryTrumpTask(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}queryTrumpTask&body=%7B%22sign%22%3A2%7D&appid=content_ecology&clientVersion=9.2.0&client=wh5`,
        headers: {
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/3wtN2MjeQgjmxYTLB3YFcHjKiUJj/index.html`,
          Host: `api.m.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
        },
      };
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          let now = $.time('yyyy-MM-dd');
          for (let i in data?.result?.signTask?.taskItemInfo?.signList) {
            //console.log(data.result.signTask.taskItemInfo.signList[i])
            if (data.result.signTask.taskItemInfo.signList[i].match(now)) {
              merge.jdBeans.fail++;
              merge.jdBeans.notify = `${now}已签过`;
              console.log(now + '已签过');
              return;
            }
          }
          for (let i in data?.result?.taskList) {
            console.log(data.result.taskList[i].taskName);
            if (data.result.taskList[i].taskItemInfo.status === 0) {
              await doTrumpTask(data.result.taskList[i].taskId, data.result.taskList[i].taskItemInfo.itemId, 1000);
            } else {
              console.log('已完成');
            }
          }
          console.log('开始签到');
          await doTrumpTask(4, '1', 1000);
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}

//做任务
function doTrumpTask(taskId, itemId, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let url = {
        url: `${JD_API_HOST}doTrumpTask&body=%7B%22taskId%22%3A${taskId}%2C%22itemId%22%3A%22${itemId}%22%2C%22sign%22%3A2%7D&appid=content_ecology&clientVersion=9.2.0&client=wh5`,
        headers: {
          Cookie: cookie,
          Connection: `keep-alive`,
          Accept: `application/json, text/plain, */*`,
          Referer: `https://h5.m.jd.com/babelDiy/Zeus/3wtN2MjeQgjmxYTLB3YFcHjKiUJj/index.html`,
          Host: `api.m.jd.com`,
          'Accept-Encoding': `gzip, deflate, br`,
          'Accept-Language': `zh-cn`,
        },
      };
      $.post(url, async (err, resp, data) => {
        try {
          data = JSON.parse(data);
          console.log(data.msg);
          if (data.code !== '0') {
            merge.jdBeans.fail++;
            merge.jdBeans.notify = `${data.msg}`;
            return;
          } else {
            merge.jdBeans.success++;
            merge.jdBeans.prizeCount += parseInt(data?.result?.lotteryScore);
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    }, timeout);
  });
}

//初始化
function initial() {
  merge = {
    nickname: '',
    enabled: true,
    //blueCoin: {prizeDesc : "收取|蓝币|个",number : true},  //定义 动作|奖励名称|奖励单位   是否是数字
    jdBeans: { prizeDesc: '获得|京豆|个', number: true, fixed: 0 },
  };
  for (let i in merge) {
    merge[i].success = 0;
    merge[i].fail = 0;
    merge[i].prizeCount = 0;
    merge[i].notify = '';
    merge[i].show = true;
  }
}
//通知
function msgShow() {
  let message = '';
  let url = {
    'open-url': `openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/3wtN2MjeQgjmxYTLB3YFcHjKiUJj/index.html%22%20%7D`,
  };
  let title = $.Nname;
  for (let i in merge) {
    if (typeof merge[i] !== 'object' || !merge[i].show) continue;
    if (merge[i].notify.split('').reverse()[0] === '\n') merge[i].notify = merge[i].notify.substr(0, merge[i].notify.length - 1);
    message +=
      `${merge[i].prizeDesc.split(STRSPLIT)[0]}${merge[i].prizeDesc.split(STRSPLIT)[1]}：` +
      (merge[i].success ? `${merge[i].prizeCount.toFixed(merge[i].fixed)}${merge[i].prizeDesc.split(STRSPLIT)[2]}\n` : `失败：${merge[i].notify}\n`);
  }
  //合计
  if (needSum) {
    $.sum = {};
    for (let i in merge) {
      if (typeof merge[i] !== 'object' || !merge[i].show) continue;
      if (typeof $.sum[merge[i].prizeDesc.split(STRSPLIT)[1]] === 'undefined') $.sum[merge[i].prizeDesc.split(STRSPLIT)[1]] = { count: 0 };
      $.sum[merge[i].prizeDesc.split(STRSPLIT)[1]].count += merge[i].prizeCount;
    }
    message += `合计：`;
    for (let i in $.sum) {
      message += `${$.sum[i].count.toFixed($.sum[i].fixed)}${i}，`;
    }
  }
  message += `请点击通知跳转至APP查看`;
  //message = message.substr(0,message.length - 1);
  $.msg($.name, title, message, url);
}

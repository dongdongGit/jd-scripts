/*
5G超级盲盒，可抽奖获得京豆，建议在凌晨0点时运行脚本，白天抽奖基本没有京豆，4小时运行一次收集热力值
活动地址: https://blindbox5g.jd.com
活动时间：2021-06-2到2021-07-31
更新时间：2021-06-3 12:00
脚本兼容: QuantumultX, Surge,Loon, JSBox, Node.js
=================================Quantumultx=========================
[task_local]
#5G超级盲盒
0 0,1-23/3 * * * jd_mohe.js, tag=5G超级盲盒, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

=================================Loon===================================
[Script]
cron "0 0,1-23/3 * * *" script-path=jd_mohe.js,tag=5G超级盲盒

===================================Surge================================
5G超级盲盒 = type=cron,cronexp="0 0,1-23/3 * * *",wake-system=1,timeout=3600,script-path=jd_mohe.js

====================================小火箭=============================
5G超级盲盒 = type=cron,script-path=jd_mohe.js, cronexpr="0 0,1-23/3 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('5G超级盲盒');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true; //是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message,
  allMessage = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}

const JD_API_HOST = 'https://api.m.jd.com/api';
//邀请码一天一变化，已确定
$.shareId = [];
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  console.log(
    '5G超级盲盒，可抽奖获得京豆，建议在凌晨0点时运行脚本，白天抽奖基本没有京豆，3小时运行一次收集热力值\n' +
      '活动地址: https://blindbox5g.jd.com\n' +
      '活动时间：2021-8-2到2021-10-29\n' +
      '更新时间：2021-8-8 19:00'
  );
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await $.totalBean();
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
      await shareUrl();
      await getCoin(); //领取每三小时自动生产的热力值
      await Promise.all([task0()]);
      await taskList();
      await getAward(); //抽奖
    }
  }
  if (allMessage) {
    if ($.isNode() && !process.env.MOHE_NOTIFY_CONTROL) await notify.sendNotify($.name, allMessage);
    $.msg($.name, '', allMessage, { 'open-url': 'https://blindbox5g.jd.com' });
  }
  $.shareId = [...($.shareId || [])];
  for (let v = 0; v < cookiesArr.length; v++) {
    cookie = cookiesArr[v];
    $.index = v + 1;
    $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    console.log(`\n\n自己账号内部互助`);
    for (let item of $.shareId) {
      console.log(`账号 ${$.index} ${$.UserName} 开始给 ${item}进行助力`);
      const res = await addShare(item);
      if (res && res['code'] === 2005) {
        console.log(`次数已用完，跳出助力`);
        break;
      }
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function task0() {
  const confRes = await conf();
  if (confRes.code === 200) {
    const { brandList, skuList } = confRes.data;
    if (skuList && skuList.length > 0) {
      for (let item of skuList) {
        if (item.state === 0) {
          let homeGoBrowseRes = await homeGoBrowse(0, item.id);
          console.log('商品', homeGoBrowseRes);
          await $.wait(1000);
          const taskHomeCoin0Res = await taskHomeCoin(0, item.id);
          console.log('商品领取金币', taskHomeCoin0Res);
          // if (homeGoBrowseRes.code === 200) {
          //   await $.wait(1000);
          //   await taskHomeCoin(0, item.id);
          // }
        } else {
          console.log('精选好物任务已完成');
        }
      }
    }
  }
}
function addShare(shareId) {
  return new Promise((resolve) => {
    const body = { shareId: shareId, apiMapping: '/active/addShare' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data['code'] === 200) {
            console.log(`助力好友【${data.data}】成功\n`);
          } else {
            console.log(`助力失败：${data.msg}`);
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
function conf() {
  return new Promise((resolve) => {
    const body = { apiMapping: '/active/conf' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function homeGoBrowse(type, id) {
  return new Promise((resolve) => {
    const body = { type: type, id: id, apiMapping: '/active/homeGoBrowse' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function taskHomeCoin(type, id) {
  return new Promise((resolve) => {
    const body = { type: type, id: id, apiMapping: '/active/taskHomeCoin' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function getCoin() {
  return new Promise((resolve) => {
    const body = { apiMapping: '/active/getCoin' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.code === 1001) {
          console.log(data.msg);
          $.msg($.name, '领取失败', `${data.msg}`);
          $.done();
        } else {
          console.log(`成功领取${data.data}热力值`);
          resolve(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

async function taskList() {
  return new Promise(async (resolve) => {
    const body = { apiMapping: '/active/taskList' };
    $.post(taskurl(body), async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.code === 200) {
          const { task8, task4, task1, task2, task5 } = data.data;
          //浏览商品
          if (task4.finishNum < task4.totalNum) {
            await browseProduct(task4.skuId);
            await $.wait(2000);
            await taskCoin(task4.type);
            await $.wait(2000);
          }
          //浏览会场
          if (task1.finishNum < task1.totalNum) {
            await strollActive(task1.finishNum + 1);
            await $.wait(2000);
            await taskCoin(task1.type);
            await $.wait(2000);
          }
          //关注或浏览店铺
          if (task2.finishNum < task2.totalNum) {
            await followShop(task2.shopId);
            await $.wait(2000);
            await taskCoin(task2.type);
            await $.wait(2000);
          }
          // if (task5.finishNum < task5.totalNum) {
          //   console.log(`\n\n分享好友助力 ${task5.finishNum}/${task5.totalNum}\n\n`)
          // } else {
          //   console.log(`\n\n分享好友助力 ${task5.finishNum}/${task5.totalNum}\n\n`)
          // }
          if (task4.state === 2 && task1.state === 2 && task2.state === 2) {
            console.log('\n\n----taskList的任务全部做完了---\n\n');
            console.log(`分享好友助力 ${task5.finishNum}/${task5.totalNum}\n\n`);
          } else {
            console.log(`请继续等待,正在做任务,不要退出哦`);
            await taskList();
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
//浏览商品
function browseProduct(skuId) {
  return new Promise((resolve) => {
    const body = { skuId: skuId, apiMapping: '/active/browseProduct' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
// 浏览会场
function strollActive(index) {
  return new Promise((resolve) => {
    const body = { activeId: index, apiMapping: '/active/strollActive' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
//关注或浏览店铺
function followShop(shopId) {
  return new Promise((resolve) => {
    const body = { shopId: shopId, apiMapping: '/active/followShop' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
//领取任务奖励
function taskCoin(type) {
  return new Promise((resolve) => {
    const body = { type: type, apiMapping: '/active/taskCoin' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
async function getAward() {
  const coinRes = await coin();
  if (coinRes.code === 200) {
    const { total, need } = coinRes.data;
    if (total > need) {
      const times = Math.floor(total / need);
      for (let i = 0; i < times; i++) {
        await $.wait(2000);
        let lotteryRes = await lottery();
        if (lotteryRes.code === 200) {
          console.log(`====抽奖结果====,${JSON.stringify(lotteryRes.data)}`);
          console.log(lotteryRes.data.name);
          console.log(lotteryRes.data.beanNum);
          if (lotteryRes.data['prizeId'] && lotteryRes.data['type'] !== '99' && lotteryRes.data['type'] !== '3' && lotteryRes.data['type'] !== '8' && lotteryRes.data['type'] !== '9') {
            message += `抽奖获得：${lotteryRes.data.name}\n`;
          }
        } else if (lotteryRes.code === 4001) {
          console.log(`抽奖失败,${lotteryRes.msg}`);
          break;
        }
      }
      if (message) allMessage += `京东账号${$.index} ${$.nickName}\n${message}抽奖详情查看 https://blindbox5g.jd.com/#/myPrize${$.index !== cookiesArr.length ? '\n\n' : ''}`;
    } else {
      console.log(`目前热力值${total},不够抽奖`);
    }
  }
}
//获取有多少热力值
function coin() {
  return new Promise((resolve) => {
    const body = { apiMapping: '/active/coin' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
//抽奖API
function lottery() {
  return new Promise((resolve) => {
    const body = { apiMapping: '/prize/lottery' };
    $.post(taskurl(body), (err, resp, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function shareUrl() {
  return new Promise((resolve) => {
    const body = { apiMapping: '/active/shareUrl' };
    $.post(taskurl(body), async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data['code'] === 5000) {
          console.log(`尝试多次运行脚本即可获取好友邀请码`);
        }
        if (data['code'] === 200) {
          if (data['data']) $.shareId.push(data['data']);
          console.log(`\n【京东账号${$.index}（${$.nickName || $.UserName}）的${$.name}好友互助码】${data['data']}\n`);
          console.log(`此邀请码一天一变化，旧的不可用`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
function taskurl(body = {}) {
  return {
    url: `${JD_API_HOST}?appid=blind-box&functionId=blindbox_prod&body=${JSON.stringify(body)}&t=${Date.now()}&loginType=2`,
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'zh-cn',
      'content-type': 'application/x-www-form-urlencoded',
      origin: 'https://blindbox5g.jd.com',
      cookie: cookie,
      referer: 'https://blindbox5g.jd.com',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };
}

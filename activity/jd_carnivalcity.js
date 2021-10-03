/*
京东手机狂欢城活动，每日可获得20+以上京豆（其中20京豆是往期奖励，需第一天参加活动后，第二天才能拿到）
活动时间: 2021-9-16至2021-10-1
活动入口：暂无 [活动地址](https://carnivalcity.m.jd.com/)
往期奖励：
a、第1名、第618名可获得实物手机一部
b、 每日第2-10000名，可获得50个京豆
c、 每日第10001-30000名可获得20个京豆
d、 30000名之外，0京豆
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
===================quantumultx================
[task_local]
#京东手机狂欢城
0 0-18/6 * * * https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_carnivalcity.js, tag=京东手机狂欢城, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
=====================Loon================
[Script]
cron "0 0-18/6 * * *" script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_scripts/jd_carnivalcity.js, tag=京东手机狂欢城
====================Surge================
京东手机狂欢城 = type=cron,cronexp=0 0-18/6 * * *,wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/yongyuanlin/jd_scripts/master/jd_carnivalcity.js
============小火箭=========
京东手机狂欢城 = type=cron,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_carnivalcity.js, cronexpr="0 0-18/6 * * *", timeout=3600, enable=true
*/
const jd_helpers = require('../utils/JDHelpers.js');
const jd_env = require('../utils/JDEnv.js');
let $ = jd_env.env('京东手机狂欢城');

const notify = $.isNode() ? require('../sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('../jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '',
  message = '',
  allMessage = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
  if (JSON.stringify(process.env).indexOf('GITHUB') > -1) process.exit(0);
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
let inviteCodes = [];
const JD_API_HOST = 'https://api.m.jd.com/api';
const activeEndTime = '2021/10/02 00:00:00+08:00'; //活动结束时间
let nowTime = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  $.temp = [];
  if (nowTime > new Date(activeEndTime).getTime()) {
    //活动结束后弹窗提醒
    $.msg($.name, '活动已结束', `该活动累计获得京豆：${$.jingBeanNum}个\n请删除此脚本\n咱江湖再见`);
    if ($.isNode()) await notify.sendNotify($.name + '活动已结束', `请删除此脚本\n咱江湖再见`);
    return;
  }
  await requireConfig();
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.jingBeanNum = 0; //累计获得京豆
      $.integralCount = 0; //累计获得积分
      $.integer = 0; //当天获得积分
      $.lasNum = 0; //当天参赛人数
      $.num = 0; //当天排名
      $.beans = 0; //本次运行获得京豆数量
      $.blockAccount = false; //黑号
      message = '';
      await $.totalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await shareCodesFormat();
      await JD818();
    }
  }
  if (allMessage) {
    //NODE端,默认每月一日运行进行推送通知一次
    if ($.isNode()) {
      await notify.sendNotify($.name, allMessage, { url: 'https://carnivalcity.m.jd.com/' });
      $.msg($.name, '', allMessage);
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function JD818() {
  try {
    await indexInfo(); //获取任务
    // await supportList();//助力情况
    // await getHelp();//获取邀请码
    if ($.blockAccount) return;
    await indexInfo(true); //获取任务
    await doHotProducttask(); //做热销产品任务
    await doBrandTask(); //做品牌手机任务
    await doBrowseshopTask(); //逛好货街，做任务
    // await doHelp();
    await myRank(); //领取往期排名奖励
    await getListRank();
    await getListIntegral();
    await getListJbean();
    await check(); //查询抽奖记录(未兑换的，发送提醒通知);
    await showMsg();
  } catch (e) {
    $.logErr(e);
  }
}
async function doHotProducttask() {
  $.hotProductList = $.hotProductList.filter((v) => !!v && v['status'] === '1');
  if ($.hotProductList && $.hotProductList.length) console.log(`开始 【浏览热销手机产品】任务,需等待6秒`);
  for (let item of $.hotProductList) {
    await doBrowse(item['id'], '', 'hot', 'browse', 'browseHotSku');
    await $.wait(1000 * 6);
    if ($.browseId) {
      await getBrowsePrize($.browseId);
    }
  }
}
//做任务 API
function doBrowse(id = '', brandId = '', taskMark = 'hot', type = 'browse', logMark = 'browseHotSku') {
  return new Promise((resolve) => {
    const body = { brandId: brandId, id: id, taskMark: taskMark, type: type, logMark: logMark, apiMapping: '/khc/task/doBrowse' };
    $.post(taskUrl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          console.log(`doBrowse 做${taskMark}任务:${data}`);
          data = JSON.parse(data);
          if (data && data['code'] === 200) {
            $.browseId = data['data']['browseId'] || '';
          } else {
            console.log(`doBrowse异常`);
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
//领取奖励
function getBrowsePrize(browseId, brandId = '') {
  return new Promise((resolve) => {
    const body = { brandId: brandId, browseId: browseId, apiMapping: '/khc/task/getBrowsePrize' };
    $.post(taskUrl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          console.log(`getBrowsePrize 领取奖励 结果:${data}`);
          data = JSON.parse(data);
          if (data && data['code'] === 200) {
            if (data['data']['jingBean']) $.beans += data['data']['jingBean'];
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

async function doBrandTask() {
  for (let brand of $.brandList) {
    await brandTaskInfo(brand['brandId']);
  }
}
function brandTaskInfo(brandId) {
  const body = { brandId: brandId, apiMapping: '/khc/index/brandTaskInfo' };
  $.skuTask = [];
  $.shopTask = [];
  $.meetingTask = [];
  $.questionTask = {};
  return new Promise((resolve) => {
    $.get(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            let brandId = data['data']['brandId'];
            $.skuTask = data['data']['skuTask'] || [];
            $.shopTask = data['data']['shopTask'] || [];
            $.meetingTask = data['data']['meetingTask'] || [];
            $.questionTask = data['data']['questionTask'] || [];
            for (let sku of $.skuTask.filter((vo) => !!vo && vo['status'] !== '4')) {
              console.log(`\n开始做 品牌手机 【${data['data']['brandName']}】 任务`);
              console.log(`开始浏览 1-F 单品区 任务 ${sku['name']}`);
              await doBrowse(sku['id'], brandId, 'brand', 'presell', 'browseSku');
              await $.wait(6000);
              if ($.browseId) await getBrowsePrize($.browseId, brandId);
            }
            for (let sku of $.shopTask.filter((vo) => !!vo && vo['status'] !== '4')) {
              console.log(`\n开始做 品牌手机 【${data['data']['brandName']}】 任务`);
              console.log(`开始浏览 2-F 专柜区 任务 ${sku['name']}，需等待10秒`);
              await doBrowse(sku['id'], brandId, 'brand', 'follow', 'browseShop');
              await $.wait(10100);
              if ($.browseId) await getBrowsePrize($.browseId, brandId);
            }
            for (let sku of $.meetingTask.filter((vo) => !!vo && vo['status'] !== '4')) {
              console.log(`\n开始做 品牌手机 【${data['data']['brandName']}】 任务`);
              console.log(`开始浏览 3-F 综合区 任务 ${sku['name']}，需等待10秒`);
              await doBrowse(sku['id'], brandId, 'brand', 'meeting', 'browseVenue');
              await $.wait(10500);
              if ($.browseId) await getBrowsePrize($.browseId, brandId);
            }
            if ($.questionTask.hasOwnProperty('id') && $.questionTask['result'] === '0') {
              console.log(`\n开始做 品牌手机 【${data['data']['brandName']}】 任务`);
              console.log(`开始做答题任务 ${$.questionTask['question']}`);
              let result = 0;
              for (let i = 0; i < $.questionTask['answers'].length; i++) {
                if ($.questionTask['answers'][i]['right']) {
                  result = i + 1; //正确答案
                }
              }
              if (result !== 0) {
                await doQuestion(brandId, $.questionTask['id'], result);
              }
            }
          } else {
            console.log(`失败：${JSON.stringify(data)}`);
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
function doQuestion(brandId, questionId, result) {
  return new Promise((resolve) => {
    const body = { brandId: brandId, questionId: questionId, result: result, apiMapping: '/khc/task/doQuestion' };
    $.post(taskUrl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          console.log(`doQuestion 领取答题任务奖励 结果:${data}`);
          data = JSON.parse(data);
          if (data && data['code'] === 200) {
            if (data['data']['jingBean']) $.beans += data['data']['jingBean'];
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
//逛好货街，做任务
async function doBrowseshopTask() {
  $.browseshopList = $.browseshopList.filter((v) => !!v && v['status'] === '6');
  if ($.browseshopList && $.browseshopList.length) console.log(`\n开始 【逛好货街，做任务】，需等待10秒`);
  for (let shop of $.browseshopList) {
    await doBrowse(shop['id'], '', 'browseShop', 'browse', 'browseShop');
    await $.wait(10000);
    if ($.browseId) {
      await getBrowsePrize($.browseId);
    }
  }
}
function indexInfo(flag = false) {
  const body = { apiMapping: '/khc/index/indexInfo' };
  $.hotProductList = [];
  $.brandList = [];
  $.browseshopList = [];
  return new Promise((resolve) => {
    $.post(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            $.hotProductList = data['data']['hotProductList'];
            $.brandList = data['data']['brandList'];
            $.browseshopList = data['data']['browseshopList'];
            if (flag) {
              // console.log(`助力情况：${data['data']['supportedNums']}/${data['data']['supportNeedNums']}`);
              // message += `邀请好友助力：${data['data']['supportedNums']}/${data['data']['supportNeedNums']}\n`
            }
          } else {
            console.log(`异常：${JSON.stringify(data)}`);
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
//获取助力信息
function supportList() {
  const body = { apiMapping: '/khc/index/supportList' };
  return new Promise((resolve) => {
    $.get(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            console.log(`助力情况：${data['data']['supportedNums']}/${data['data']['supportNeedNums']}`);
            message += `邀请好友助力：${data['data']['supportedNums']}/${data['data']['supportNeedNums']}\n`;
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
//积分抽奖
function lottery() {
  const body = { apiMapping: '/khc/record/lottery' };
  return new Promise((resolve) => {
    $.get(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            if (data.data.prizeId !== 8) {
              //已中奖
              const url = 'https://carnivalcity.m.jd.com/#/integralDetail';
              console.log(`积分抽奖获得:${data.data.prizeName}`);
              message += `积分抽奖获得：${data.data.prizeName}\n`;
              $.msg($.name, '', `京东账号 ${$.index} ${$.nickName || $.UserName}\n积分抽奖获得：${data.data.prizeName}\n兑换地址：${url}`, { 'open-url': url });
              if ($.isNode()) await notify.sendNotify($.name, `京东账号 ${$.index} ${$.nickName || $.UserName}\n积分抽奖获得：${data.data.prizeName}\n兑换地址：${url}`);
            } else {
              console.log(`积分抽奖结果:${data['data']['prizeName']}}`);
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
//查询抽奖记录(未兑换的)
function check() {
  const body = { pageNum: 1, apiMapping: '/khc/record/convertRecord' };
  return new Promise((resolve) => {
    $.get(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          let str = '';
          if (data.code === 200) {
            for (let obj of data.data) {
              if (obj.hasOwnProperty('fillStatus') && obj.fillStatus !== true) {
                str += JSON.stringify(obj);
              }
            }
          }
          if (str.length > 0) {
            const url = 'https://carnivalcity.m.jd.com/#/integralDetail';
            $.msg($.name, '', `京东账号 ${$.index} ${$.nickName || $.UserName}\n积分抽奖获得：${str}\n兑换地址：${url}`, { 'open-url': url });
            if ($.isNode()) await notify.sendNotify($.name, `京东账号 ${$.index} ${$.nickName || $.UserName}\n积分抽奖获得：${str}\n兑换地址：${url}`);
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
function myRank() {
  return new Promise((resolve) => {
    const body = { apiMapping: '/khc/rank/myPastRanks' };
    $.post(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            if (data.data && data.data.length) {
              for (let i = 0; i < data.data.length; i++) {
                $.date = data.data[i]['date'];
                if (data.data[i].status === '1') {
                  console.log(`开始领取往期奖励【${data.data[i]['prizeName']}】`);
                  let res = await saveJbean($.date);
                  // console.log('领奖结果', res)
                  if (res && res.code === 200) {
                    $.beans += Number(res.data);
                    console.log(`${data.data[i]['date']}日 【${res.data}】京豆奖励领取成功`);
                  } else {
                    console.log(`往期奖励领取失败：${JSON.stringify(res)}`);
                  }
                  await $.wait(500);
                } else if (data.data[i].status === '3') {
                  console.log(`${data.data[i]['date']}日 【${data.data[i]['prizeName']}】往期京豆奖励已领取~`);
                } else {
                  console.log(`${data.data[i]['date']}日 【${data.data[i]['status']}】往期京豆奖励，今日争取进入前30000名哦~`);
                }
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
//领取往期奖励API
function saveJbean(date) {
  return new Promise((resolve) => {
    const body = { date: date, apiMapping: '/khc/rank/getRankJingBean' };
    $.post(taskUrl(body), (err, resp, data) => {
      try {
        // console.log('领取京豆结果', data);
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
async function doHelp() {
  console.log(`\n开始助力好友`);
  for (let item of $.newShareCodes) {
    if (!item) continue;
    const helpRes = await toHelp(item.trim());
    if (helpRes.data.status === 5) {
      console.log(`助力机会已耗尽，跳出助力`);
      break;
    }
  }
}
//助力API
function toHelp(code) {
  return new Promise((resolve) => {
    const body = { shareId: code, apiMapping: '/khc/task/doSupport' };
    $.post(taskUrl(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          console.log(`助力结果:${data}`);
          data = JSON.parse(data);
          if (data && data['code'] === 200) {
            if (data['data']['status'] === 6) console.log(`助力成功\n`);
            if (data['data']['jdNums']) $.beans += data['data']['jdNums'];
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
//获取邀请码API
function getHelp() {
  return new Promise((resolve) => {
    const body = { apiMapping: '/khc/task/getSupport' };
    $.get(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            console.log(`\n\n${$.name}互助码每天都变化,旧的不可继续使用`);
            $.log(`【京东账号${$.index}（${$.UserName}）的${$.name}好友互助码】${data.data.shareId}\n\n`);
            $.temp.push(data.data.shareId);
          } else {
            console.log(`获取邀请码失败：${JSON.stringify(data)}`);
            if (data.code === 1002) $.blockAccount = true;
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
//获取当前活动总京豆数量
function getListJbean() {
  return new Promise((resolve) => {
    const body = { pageNum: '', apiMapping: '/khc/record/jingBeanRecord' };
    $.post(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            $.jingBeanNum = data.data.jingBeanNum || 0;
            message += `累计获得京豆：${$.jingBeanNum}🐶\n`;
          } else {
            console.log(`jingBeanRecord失败：${JSON.stringify(data)}`);
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
//查询累计获得积分
function getListIntegral() {
  return new Promise((resolve) => {
    const body = { pageNum: '', apiMapping: '/khc/record/integralRecord' };
    $.post(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            $.integralCount = data.data.integralNum || 0; //累计活动积分
            message += `累计获得积分：${$.integralCount}\n`;
            console.log(`开始抽奖，当前积分可抽奖${parseInt($.integralCount / 50)}次\n`);
            for (let i = 0; i < parseInt($.integralCount / 50); i++) {
              await lottery();
              await $.wait(500);
            }
          } else {
            console.log(`integralRecord失败：${JSON.stringify(data)}`);
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

//查询今日累计积分与排名
function getListRank() {
  return new Promise((resolve) => {
    const body = { apiMapping: '/khc/rank/dayRank' };
    $.post(taskUrl(body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          if (data.code === 200) {
            if (data.data.myRank) {
              $.integer = data.data.myRank.integral; //当前获得积分
              $.num = data.data.myRank.rank; //当前排名
              message += `当前获得积分：${$.integer}\n`;
              message += `当前获得排名：${$.num}\n`;
            }
            if (data.data.lastRank) {
              $.lasNum = data.data.lastRank.rank; //当前参加活动人数
              message += `当前参赛人数：${$.lasNum}\n`;
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

//格式化助力码
function shareCodesFormat() {
  return new Promise(async (resolve) => {
    // console.log(`第${$.index}个京东账号的助力码:::${$.shareCodesArr[$.index - 1]}`)
    $.newShareCodes = [];
    if ($.shareCodesArr[$.index - 1]) {
      $.newShareCodes = $.shareCodesArr[$.index - 1].split('@');
    } else {
      console.log(`由于您第${$.index}个京东账号未提供shareCode,将采纳本脚本自带的助力码\n`);
      const tempIndex = $.index > inviteCodes.length ? inviteCodes.length - 1 : $.index - 1;
      $.newShareCodes = (inviteCodes[tempIndex] && inviteCodes[tempIndex].split('@')) || [];
      if ($.updatePkActivityIdRes && $.updatePkActivityIdRes.length) $.newShareCodes = [...$.updatePkActivityIdRes, ...$.newShareCodes];
    }
    // const readShareCodeRes = await readShareCode();
    // if (readShareCodeRes && readShareCodeRes.code === 200) {
    //   $.newShareCodes = [...new Set([...$.newShareCodes, ...(readShareCodeRes.data || [])])];
    // }
    // console.log(`第${$.index}个京东账号将要助力的好友${JSON.stringify($.newShareCodes)}`)
    resolve();
  });
}
function requireConfig() {
  return new Promise((resolve) => {
    console.log(`开始获取${$.name}配置文件\n`);
    let shareCodes = [];
    if ($.isNode()) {
      if (process.env.JD818_SHARECODES) {
        if (process.env.JD818_SHARECODES.indexOf('\n') > -1) {
          shareCodes = process.env.JD818_SHARECODES.split('\n');
        } else {
          shareCodes = process.env.JD818_SHARECODES.split('&');
        }
      }
    }
    console.log(`共${cookiesArr.length}个京东账号\n`);
    $.shareCodesArr = [];
    if ($.isNode()) {
      Object.keys(shareCodes).forEach((item) => {
        if (shareCodes[item]) {
          $.shareCodesArr.push(shareCodes[item]);
        }
      });
    }
    console.log(`您提供了${$.shareCodesArr.length}个账号的${$.name}助力码\n`);
    resolve();
  });
}

function taskUrl(body = {}) {
  return {
    url: `${JD_API_HOST}?appid=guardian-starjd&functionId=carnivalcity_jd_prod&body=${JSON.stringify(body)}&t=${Date.now()}&loginType=2`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://carnivalcity.m.jd.com',
      'Accept-Language': 'zh-cn',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('../USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://carnivalcity.m.jd.com/',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: cookie,
    },
  };
}

async function showMsg() {
  if ($.beans) {
    allMessage += `京东账号${$.index} ${$.nickName || $.UserName}\n本次运行获得：${$.beans}京豆\n${message}活动地址：https://carnivalcity.m.jd.com/${$.index !== cookiesArr.length ? '\n\n' : ''}`;
  }
  $.msg($.name, `京东账号${$.index} ${$.nickName || $.UserName}`, `${message}具体详情点击弹窗跳转后即可查看`, { 'open-url': 'https://carnivalcity.m.jd.com/' });
}

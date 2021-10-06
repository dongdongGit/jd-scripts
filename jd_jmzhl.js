/**
 芥么赚豪礼
 入口：微信-芥么小程序-赚豪礼
 cron "37 0,11 * * *" jd_jmzhl.js
 TG频道:https://t.me/sheeplost
 */
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('芥么赚豪礼');

const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [],
  cookie = '';
let appid = 'yX3KNttlA6GbZjHuDz0-WQ',
  typeid = '44782287613952';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || '[]';
  cookiesData = JSON.parse(cookiesData);
  cookiesArr = cookiesData.map((item) => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  UUID = getUUID('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  for (let i = 0; i < cookiesArr.length; i++) {
    UA = `jdapp;iPhone;10.0.8;14.6;${UUID};network/wifi;JDEbook/openapp.jdreader;model/iPhone9,2;addressid/2214222493;appBuild/168841;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16E158;supportJDSHWK/1`;
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
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
      await main();
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function main() {
  $.reg = false;
  $.tasklist = [];
  await task('apTaskList', { linkId: appid, uniqueId: '' });
  await $.wait(500);
  await task('findPostTagList', { typeId: typeid });
  if (!$.reg && $.tasklist) {
    await task('genzTaskCenter');
    if ($.genzTask) {
      $.log(`当前芥么豆：${$.totalPoints}`);
      for (const vo of $.genzTask) {
        if (!vo.completionStatus) {
          $.log(`去完成：${vo.taskName}新手任务！`);
          await task('genzDoNoviceTasks', { taskId: vo.taskId, completionStatus: 1 });
        }
      }
    }
    for (const vo of $.tasklist) {
      if (vo.taskType != 'JOIN_INTERACT_ACT' && vo.taskType != 'SHARE_INVITE') {
        $.log(`去完成：${vo.taskShowTitle}`);
        for (let x = 0; x < vo.taskLimitTimes; x++) {
          if (vo.taskDoTimes != vo.taskLimitTimes) {
            await $.wait(500);
            await task('apDoTask', { linkId: appid, taskType: vo.taskType, taskId: vo.id, channel: '2', itemId: vo.taskSourceUrl });
          }
        }
      }
      if ($.taglist) {
        if (vo.taskType === 'JOIN_INTERACT_ACT') {
          let taglist = $.taglist[random(0, $.taglist.length)];
          await task('findTagPosts', { tagId: taglist.tagId, tagCategoryId: taglist.typeId, page: 1, pageSize: 10 });
          if ($.postlist) {
            if (vo.taskShowTitle === '喜欢帖子') {
              $.log('去完成点赞任务');
              for (let x = 0; x < vo.taskLimitTimes; x++) {
                if (vo.taskDoTimes != vo.taskLimitTimes) {
                  PostId = [];
                  likePostId = $.postlist[random(0, $.postlist.length)];
                  PostId.push(likePostId.postId);
                  PostIdx = PostId[random(0, PostId.length)];
                  await task('likePosts', { likePostId: PostIdx });
                  await $.wait(500);
                  await task('cancelLikePosts', { likePostId: PostIdx });
                }
              }
            }
            if (vo.taskShowTitle === '关注芥么er') {
              $.log('去完成关注任务');
              for (let x = 0; x < vo.taskLimitTimes; x++) {
                if (vo.taskDoTimes != vo.taskLimitTimes) {
                  userId = [];
                  likeuserId = $.postlist[random(0, $.postlist.length)];
                  userId.push(likeuserId.userId);
                  userIdx = userId[random(0, userId.length)];
                  await task('followHim', { forwardUserId: userIdx });
                  await $.wait(500);
                  await task('cancelFollowHim', { forwardUserId: userIdx });
                }
              }
            }
          }
        }
      } else {
        $.log('没有获取到列表，不做此任务');
      }
      if (vo.taskDoTimes === vo.taskLimitTimes) {
        $.log(`任务：${vo.taskShowTitle}，已完成`);
      }
    }
  } else {
    console.log('未注册！请手动进入一次小程序任务\n入口：微信小程序-芥么-赚豪礼');
  }
  return;
}
function task(function_id, body) {
  return new Promise((resolve) => {
    $.get(taskUrl(function_id, body), async (err, resp, data) => {
      try {
        if (err) {
          $.log(err);
        } else {
          data = JSON.parse(data);
          switch (function_id) {
            case 'apTaskList':
              $.tasklist = data.data;
              break;
            case 'apDoTask':
              if (data.success) {
                if (data.code === 0) {
                  console.log('任务完成');
                }
              } else {
                console.log(JSON.stringify(data));
              }
              break;
            case 'findPostTagList':
              if (data.code === 0) {
                $.taglist = data.data;
              } else if (data.code === 4001) {
                $.reg = true;
              } else {
                console.log(JSON.stringify(data));
              }
              break;
            case 'findTagPosts':
              if (data.code === 0) {
                $.postlist = data.data.list;
              }
              break;
            case 'likePosts':
              if (data.code === 0) {
                console.log(data.data);
              } else {
                console.log(JSON.stringify(data));
              }
              break;
            case 'cancelLikePosts':
              if (data.code === 0) {
                console.log(data.data);
              } else {
                console.log(JSON.stringify(data));
              }
              break;
            case 'followHim':
              if (data.code === 0) {
                console.log('关注成功');
              } else {
                console.log(JSON.stringify(data));
              }
              break;
            case 'cancelFollowHim':
              if (data.code === 0) {
                console.log('取消关注');
              } else {
                console.log(JSON.stringify(data));
              }
              break;
            case 'genzTaskCenter':
              $.genzTask = data.data.noviceTaskStatusList;
              $.totalPoints = data.data.totalPoints;
              break;
            case 'genzDoNoviceTasks':
              if (data.success) {
                if (data.data) {
                  console.log('任务完成');
                } else {
                  console.log(JSON.stringify(data));
                }
              } else {
                console.log(JSON.stringify(data));
              }
              break;
            default:
              $.log(JSON.stringify(data));
              break;
          }
        }
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    });
  });
}

function taskUrl(function_id, body) {
  return {
    url: `https://api.m.jd.com/?functionId=${function_id}&body=${escape(JSON.stringify(body))}&_t=${new Date().getTime()}&appid=gen-z`,
    headers: {
      Host: 'api.m.jd.com',
      Connection: 'keep-alive',
      'content-type': 'application/json',
      'Accept-Encoding': 'gzip,compress,br,deflate',
      'User-Agent': UA,
      Cookie: cookie,
      Referer: 'https://servicewechat.com/wx9a412175d4e99f91/42/page-frame.html',
    },
  };
}
function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getUUID(x = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', t = 0) {
  return x.replace(/[xy]/g, function (x) {
    var r = (16 * Math.random()) | 0,
      n = 'x' == x ? r : (3 & r) | 8;
    return (uuid = t ? n.toString(36).toUpperCase() : n.toString(36)), uuid;
  });
}

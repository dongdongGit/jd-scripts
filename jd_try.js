/*
 * 2022-05-27 修复优化版  By https://github.com/6dylan6/jdpro/
 * 如需运行请自行添加环境变量：JD_TRY，值填 true 即可运行
 * X1a0He留
 * 脚本是否耗时只看args_xh.maxLength的大小
 * 上一作者说了每天最多300个商店，总上限为500个，jd_unsubscribe.js我已更新为批量取关版
 * 请提前取关至少250个商店确保京东试用脚本正常运行
 * @Address: https://github.com/X1a0He/jd_scripts_fixed/blob/main/jd_try_xh.js
 参考环境变量配置如下：
export JD_TRY="true"
export JD_TRY_PLOG="true" #是否打印输出到日志
export JD_TRY_PASSZC="true" #过滤种草官类试用
export JD_TRY_MAXLENGTH="50" #商品数组的最大长度
export JD_TRY_APPLYINTERVAL="5000" #商品试用之间和获取商品之间的间隔
export JD_TRY_APPLYNUMFILTER="100000" #过滤大于设定值的已申请人数
export JD_TRY_MINSUPPLYNUM="1" #最小提供数量
export JD_TRY_SENDNUM="10" #每隔多少账号发送一次通知，不需要可以不用设置
export JD_TRY_UNIFIED="false" 默认采用不同试用组
cron "4 1-22/8 * * *" jd_try.js, tag:京东试用

 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
let $ = jd_env.env('京东试用');

const URL = 'https://api.m.jd.com/client.action';
let trialActivityIdList = [];
let trialActivityTitleList = [];
let notifyMsg = '';
let size = 1;
$.isPush = true;
$.isLimit = false;
$.isForbidden = false;
$.wrong = false;
$.giveupNum = 0;
$.successNum = 0;
$.completeNum = 0;
$.getNum = 0;
$.try = true;
$.sentNum = 0;
$.cookiesArr = [];
$.innerKeyWords = [
  '幼儿园',
  '教程',
  '英语',
  '辅导',
  '培训',
  '孩子',
  '小学',
  '成人用品',
  '套套',
  '情趣',
  '自慰',
  '阳具',
  '飞机杯',
  '男士用品',
  '女士用品',
  '内衣',
  '高潮',
  '避孕',
  '乳腺',
  '肛塞',
  '肛门',
  '宝宝',
  '玩具',
  '芭比',
  '娃娃',
  '男用',
  '女用',
  '神油',
  '足力健',
  '老年',
  '老人',
  '宠物',
  '饲料',
  '丝袜',
  '黑丝',
  '磨脚',
  '脚皮',
  '除臭',
  '性感',
  '内裤',
  '跳蛋',
  '安全套',
  '龟头',
  '阴道',
  '阴部',
  '手机卡',
  '电话卡',
  '流量卡',
  '玉坠',
  '和田玉',
  '习题',
  '试卷',
  '手机壳',
  '钢化膜',
];
//下面很重要，遇到问题请把下面注释看一遍再来问
let args_xh = {
  /*
   * 控制是否输出当前环境变量设置，默认为false
   * 环境变量名称：XH_TRY_ENV
   */
  env: process.env.XH_TRY_ENV === 'true' || false,
  /*
   * 跳过某个指定账号，默认为全部账号清空
   * 填写规则：例如当前Cookie1为pt_key=key; pt_pin=pin1;则环境变量填写pin1即可，此时pin1的购物车将不会被清空
   * 若有更多，则按照pin1@pin2@pin3进行填写
   * 环境变量名称：XH_TRY_EXCEPT
   */
  except: (process.env.XH_TRY_EXCEPT && process.env.XH_TRY_EXCEPT.split('@')) || [],
  //以上环境变量新增于2022.01.30
  /*
   * 每个Tab页要便遍历的申请页数，由于京东试用又改了，获取不到每一个Tab页的总页数了(显示null)，所以特定增加一个环境变了以控制申请页数
   * 例如设置 JD_TRY_PRICE 为 30，假如现在正在遍历tab1，那tab1就会被遍历到30页，到31页就会跳到tab2，或下一个预设的tab页继续遍历到30页
   * 默认为20
   */
  totalPages: process.env.JD_TRY_TOTALPAGES * 1 || 20,
  /*
   * 由于每个账号每次获取的试用产品都不一样，所以为了保证每个账号都能试用到不同的商品，之前的脚本都不支持采用统一试用组的
   * 以下环境变量是用于指定是否采用统一试用组的
   * 例如当 JD_TRY_UNIFIED 为 true时，有3个账号，第一个账号跑脚本的时候，试用组是空的
   * 而当第一个账号跑完试用组后，第二个，第三个账号所采用的试用组默认采用的第一个账号的试用组
   * 优点：减少除第一个账号外的所有账号遍历，以减少每个账号的遍历时间
   * 缺点：A账号能申请的东西，B账号不一定有
   * 提示：想每个账号独立不同的试用产品的，请设置为false，想减少脚本运行时间的，请设置为true
   * 默认为false
   */
  unified: process.env.JD_TRY_UNIFIED === 'true' || false,
  //以上环境变量新增于2022.01.25
  /*
   * 商品原价，低于这个价格都不会试用，意思是
   * A商品原价49元，试用价1元，如果下面设置为50，那么A商品不会被加入到待提交的试用组
   * B商品原价99元，试用价0元，如果下面设置为50，那么B商品将会被加入到待提交的试用组
   * C商品原价99元，试用价1元，如果下面设置为50，那么C商品将会被加入到待提交的试用组
   * 默认为0
   * */
  jdPrice: process.env.JD_TRY_PRICE * 1 || 20,
  /*
   * 获取试用商品类型，默认为1
   * 下面有一个function是可以获取所有tabId的，名为try_tabList
   * 可设置环境变量：JD_TRY_TABID，用@进行分隔
   * 默认为 1 到 10
   * */
  tabId: (process.env.JD_TRY_TABID && process.env.JD_TRY_TABID.split('@').map(Number)) || [104, 3, 4, 5, 6, 7, 8, 9, 10],
  /*
   * 试用商品标题过滤，黑名单，当标题存在关键词时，则不加入试用组
   * 当白名单和黑名单共存时，黑名单会自动失效，优先匹配白名单，匹配完白名单后不会再匹配黑名单，望周知
   * 例如A商品的名称为『旺仔牛奶48瓶特价』，设置了匹配白名单，白名单关键词为『牛奶』，但黑名单关键词存在『旺仔』
   * 这时，A商品还是会被添加到待提交试用组，白名单优先于黑名单
   * 已内置对应的 成人类 幼儿类 宠物 老年人类关键词，请勿重复添加
   * 可设置环境变量：JD_TRY_TITLEFILTERS，关键词与关键词之间用@分隔
   * */
  titleFilters: (process.env.JD_TRY_TITLEFILTERS && process.env.JD_TRY_TITLEFILTERS.split('@')) || [],
  /*
   * 试用价格(中了要花多少钱)，高于这个价格都不会试用，小于等于才会试用，意思就是
   * A商品原价49元，现在试用价1元，如果下面设置为10，那A商品将会被添加到待提交试用组，因为1 < 10
   * B商品原价49元，现在试用价2元，如果下面设置为1，那B商品将不会被添加到待提交试用组，因为2 > 1
   * C商品原价49元，现在试用价1元，如果下面设置为1，那C商品也会被添加到带提交试用组，因为1 = 1
   * 可设置环境变量：JD_TRY_TRIALPRICE，默认为0
   * */
  trialPrice: process.env.JD_TRY_TRIALPRICE * 1 || 0,
  /*
   * 最小提供数量，例如试用商品只提供2份试用资格，当前设置为1，则会进行申请
   * 若只提供5分试用资格，当前设置为10，则不会申请
   * 可设置环境变量：JD_TRY_MINSUPPLYNUM
   * */
  minSupplyNum: process.env.JD_TRY_MINSUPPLYNUM * 1 || 1,
  /*
   * 过滤大于设定值的已申请人数，例如下面设置的1000，A商品已经有1001人申请了，则A商品不会进行申请，会被跳过
   * 可设置环境变量：JD_TRY_APPLYNUMFILTER
   * */
  applyNumFilter: process.env.JD_TRY_APPLYNUMFILTER * 1 || 100000,
  /*
   * 商品试用之间和获取商品之间的间隔, 单位：毫秒(1秒=1000毫秒)
   * 可设置环境变量：JD_TRY_APPLYINTERVAL
   * 默认为3000，也就是3秒
   * */
  applyInterval: process.env.JD_TRY_APPLYINTERVAL * 1 || 5000,
  /*
   * 商品数组的最大长度，通俗来说就是即将申请的商品队列长度
   * 例如设置为20，当第一次获取后获得12件，过滤后剩下5件，将会进行第二次获取，过滤后加上第一次剩余件数
   * 例如是18件，将会进行第三次获取，直到过滤完毕后为20件才会停止，不建议设置太大
   * 可设置环境变量：JD_TRY_MAXLENGTH
   * */
  maxLength: process.env.JD_TRY_MAXLENGTH * 1 || 20,
  /*
   * 过滤种草官类试用，某些试用商品是专属官专属，考虑到部分账号不是种草官账号
   * 例如A商品是种草官专属试用商品，下面设置为true，而你又不是种草官账号，那A商品将不会被添加到待提交试用组
   * 例如B商品是种草官专属试用商品，下面设置为false，而你是种草官账号，那A商品将会被添加到待提交试用组
   * 例如B商品是种草官专属试用商品，下面设置为true，即使你是种草官账号，A商品也不会被添加到待提交试用组
   * 可设置环境变量：JD_TRY_PASSZC，默认为true
   * */
  passZhongCao: process.env.JD_TRY_PASSZC === 'true' || true,
  /*
   * 是否打印输出到日志，考虑到如果试用组长度过大，例如100以上，如果每个商品检测都打印一遍，日志长度会非常长
   * 打印的优点：清晰知道每个商品为什么会被过滤，哪个商品被添加到了待提交试用组
   * 打印的缺点：会使日志变得很长
   *
   * 不打印的优点：简短日志长度
   * 不打印的缺点：无法清晰知道每个商品为什么会被过滤，哪个商品被添加到了待提交试用组
   * 可设置环境变量：JD_TRY_PLOG，默认为true
   * */
  printLog: process.env.JD_TRY_PLOG === 'true' || true,
  /*
   * 白名单，是否打开，如果下面为true，那么黑名单会自动失效
   * 白名单和黑名单无法共存，白名单永远优先于黑名单
   * 可通过环境变量控制：JD_TRY_WHITELIST，默认为false
   * */
  whiteList: process.env.JD_TRY_WHITELIST === 'true' || false,
  /*
   * 白名单关键词，当标题存在关键词时，加入到试用组
   * 例如A商品的名字为『旺仔牛奶48瓶特价』，白名单其中一个关键词是『牛奶』，那么A将会直接被添加到待提交试用组，不再进行另外判断
   * 就算设置了黑名单也不会判断，希望这种写得那么清楚的脑瘫问题就别提issues了
   * 可通过环境变量控制：JD_TRY_WHITELIST，用@分隔
   * */
  whiteListKeywords: (process.env.JD_TRY_WHITELISTKEYWORDS && process.env.JD_TRY_WHITELISTKEYWORDS.split('@')) || [],
  /*
   * 每多少个账号发送一次通知，默认为4
   * 可通过环境变量控制 JD_TRY_SENDNUM
   * */
  sendNum: process.env.JD_TRY_SENDNUM * 1 || 4,
};
//上面很重要，遇到问题请把上面注释看一遍再来问
!(async () => {
  await $.wait(500);
  // 如果你要运行京东试用这个脚本，麻烦你把环境变量 JD_TRY 设置为 true
  if (1) {
    await requireConfig();
    if (!$.cookiesArr[0]) {
      $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
        'open-url': 'https://bean.m.jd.com/',
      });
      return;
    }
    for (let i = 0; i < $.cookiesArr.length; i++) {
      if ($.cookiesArr[i]) {
        $.cookie = $.cookiesArr[i];
        $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1]);
        $.index = i + 1;
        $.isLogin = true;
        $.nickName = '';
        await $.totalBean();
        console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
        $.except = false;
        if (args_xh.except.includes($.UserName)) {
          console.log(`跳过账号：${$.nickName || $.UserName}`);
          $.except = true;
          continue;
        }
        if (!$.isLogin) {
          $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
            'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
          });
          await $.notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
          continue;
        }
        $.totalTry = 0;
        $.totalSuccess = 0;
        $.nowTabIdIndex = 0;
        $.nowPage = 1;
        $.nowItem = 1;
        if (!args_xh.unified) {
          trialActivityIdList = [];
          trialActivityTitleList = [];
        }
        $.isLimit = false;
        // 获取tabList的，不知道有哪些的把这里的注释解开跑一遍就行了
        //await try_tabList();
        // return;
        $.isForbidden = false;
        $.wrong = false;
        size = 1;
        while (trialActivityIdList.length < args_xh.maxLength && $.isForbidden === false) {
          if (args_xh.unified && trialActivityIdList.length !== 0) break;
          if ($.nowTabIdIndex === args_xh.tabId.length) {
            console.log(`tabId组已遍历完毕，不在获取商品\n`);
            break;
          } else {
            await try_feedsList(args_xh.tabId[$.nowTabIdIndex], $.nowPage); //获取对应tabId的试用页面
          }
          if (trialActivityIdList.length < args_xh.maxLength) {
            console.log(`间隔等待中，请等待 3 秒\n`);
            await $.wait(3000);
          }
        }
        if ($.isForbidden === false && $.isLimit === false) {
          console.log(`稍后将执行试用申请，请等待 2 秒\n`);
          await $.wait(2000);
          for (let i = 0; i < trialActivityIdList.length && $.isLimit === false; i++) {
            if ($.isLimit) {
              console.log('试用上限');
              break;
            }
            await try_apply(trialActivityTitleList[i], trialActivityIdList[i]);
            //console.log(`间隔等待中，请等待 ${args_xh.applyInterval} ms\n`)
            const waitTime = generateRandomInteger(5000, 8000);
            console.log(`随机等待${waitTime}ms后继续`);
            await $.wait(waitTime);
          }
          console.log('试用申请执行完毕...');
          // await try_MyTrials(1, 1)    //申请中的商品
          $.giveupNum = 0;
          $.successNum = 0;
          $.getNum = 0;
          $.completeNum = 0;
          await try_MyTrials(1, 2); //申请成功的商品
          // await try_MyTrials(1, 3)    //申请失败的商品
          await showMsg();
        }
      }
      if ($.isNode()) {
        if ($.index % args_xh.sendNum === 0) {
          $.sentNum++;
          console.log(`正在进行第 ${$.sentNum} 次发送通知，发送数量：${args_xh.sendNum}`);
          await $.notify.sendNotify(`${$.name}`, `${notifyMsg}`);
          notifyMsg = '';
        }
      }
    }
    if ($.isNode() && $.except === false) {
      if ($.cookiesArr.length - $.sentNum * args_xh.sendNum < args_xh.sendNum) {
        console.log(`正在进行最后一次发送通知，发送数量：${$.cookiesArr.length - $.sentNum * args_xh.sendNum}`);
        await $.notify.sendNotify(`${$.name}`, `${notifyMsg}`);
        notifyMsg = '';
      }
    }
  } else {
    console.log(`\n您未设置运行【京东试用】脚本，结束运行！\n`);
  }
})()
  .catch((e) => {
    console.error(`❗️ ${$.name} 运行错误！\n${e}`);
  })
  .finally(() => $.done());

function requireConfig() {
  return new Promise((resolve) => {
    console.log('开始获取配置文件\n');
    $.notify = $.isNode() ? require('./sendNotify') : { sendNotify: async () => {} };
    //获取 Cookies
    $.cookiesArr = [];
    if ($.isNode()) {
      //Node.js用户请在jdCookie.js处填写京东ck;
      const jdCookieNode = require('./jdCookie.js');
      Object.keys(jdCookieNode).forEach((item) => {
        if (jdCookieNode[item]) $.cookiesArr.push(jdCookieNode[item]);
      });
      if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
    } else {
      //IOS等用户直接用NobyDa的jd $.cookie
      $.cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
    }
    for (let keyWord of $.innerKeyWords) args_xh.titleFilters.push(keyWord);
    console.log(`共${$.cookiesArr.length}个京东账号\n`);
    if (args_xh.env) {
      console.log('=====环境变量配置如下=====');
      console.log(`env: ${typeof args_xh.env}, ${args_xh.env}`);
      console.log(`except: ${typeof args_xh.except}, ${args_xh.except}`);
      console.log(`totalPages: ${typeof args_xh.totalPages}, ${args_xh.totalPages}`);
      console.log(`unified: ${typeof args_xh.unified}, ${args_xh.unified}`);
      console.log(`jdPrice: ${typeof args_xh.jdPrice}, ${args_xh.jdPrice}`);
      console.log(`tabId: ${typeof args_xh.tabId}, ${args_xh.tabId}`);
      console.log(`titleFilters: ${typeof args_xh.titleFilters}, ${args_xh.titleFilters}`);
      console.log(`trialPrice: ${typeof args_xh.trialPrice}, ${args_xh.trialPrice}`);
      console.log(`minSupplyNum: ${typeof args_xh.minSupplyNum}, ${args_xh.minSupplyNum}`);
      console.log(`applyNumFilter: ${typeof args_xh.applyNumFilter}, ${args_xh.applyNumFilter}`);
      console.log(`applyInterval: ${typeof args_xh.applyInterval}, ${args_xh.applyInterval}`);
      console.log(`maxLength: ${typeof args_xh.maxLength}, ${args_xh.maxLength}`);
      console.log(`passZhongCao: ${typeof args_xh.passZhongCao}, ${args_xh.passZhongCao}`);
      console.log(`printLog: ${typeof args_xh.printLog}, ${args_xh.printLog}`);
      console.log(`whiteList: ${typeof args_xh.whiteList}, ${args_xh.whiteList}`);
      console.log(`whiteListKeywords: ${typeof args_xh.whiteListKeywords}, ${args_xh.whiteListKeywords}`);
      console.log('=======================');
    }
    resolve();
  });
}

//获取tabList的，如果不知道tabList有哪些，跑一遍这个function就行了
function try_tabList() {
  return new Promise((resolve, reject) => {
    console.log(`获取tabList中...`);
    const body = JSON.stringify({
      version: 2,
      previewTime: '',
    });
    let option = taskurl_xh('newtry', 'try_tabList', body);
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          if (JSON.stringify(err) === `\"Response code 403 (Forbidden)\"`) {
            $.isForbidden = true;
            console.log('账号被京东服务器风控，不再请求该帐号');
          } else {
            console.log(JSON.stringify(err));
            console.log(`${$.name} API请求失败，请检查网路重试`);
          }
        } else {
          data = JSON.parse(data);
          if (data.success) {
            for (let tabId of data.data.tabList) console.log(`${tabId.tabName} - ${tabId.tabId}`);
          } else {
            console.log('获取失败', data);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

//获取商品列表并且过滤 By X1a0He
function try_feedsList(tabId, page) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      tabId: `${tabId}`,
      page: page,
      version: 2,
      source: 'default',
      client: 'app',
      previewTime: '',
    });
    let option = taskurl_xh('newtry', 'try_feedsList', body);
    $.post(option, (err, resp, data) => {
      try {
        if (err) {
          if (JSON.stringify(err) === `\"Response code 403 (Forbidden)\"`) {
            $.isForbidden = true;
            console.log('账号被京东服务器风控，不再请求该帐号');
          } else {
            console.log(JSON.stringify(err));
            console.log(`${$.name} API请求失败，请检查网路重试`);
          }
        } else {
          data = JSON.parse(data);
          let tempKeyword = ``;
          if (data.success) {
            $.nowPage === args_xh.totalPages ? ($.nowPage = 1) : $.nowPage++;
            console.log(`第 ${size++} 次获取试用商品成功，tabId:${args_xh.tabId[$.nowTabIdIndex]} 的 第 ${page}/${args_xh.totalPages} 页`);
            console.log(`获取到商品 ${data.data.feedList.length} 条`);
            for (let item of data.data.feedList) {
              if (item.applyNum === null) {
                args_xh.printLog ? console.log(`商品未到申请时间：${item.skuTitle}\n`) : '';
                continue;
              }
              if (trialActivityIdList.length >= args_xh.maxLength) {
                console.log('商品列表长度已满.结束获取');
                break;
              }
              if (item.applyState === 1) {
                args_xh.printLog ? console.log(`商品已申请试用：${item.skuTitle}\n`) : '';
                continue;
              }
              if (item.applyState !== null) {
                args_xh.printLog ? console.log(`商品状态异常，未找到skuTitle\n`) : '';
                continue;
              }
              if (args_xh.passZhongCao) {
                $.isPush = true;
                if (item.tagList.length !== 0) {
                  for (let itemTag of item.tagList) {
                    if (itemTag.tagType === 3) {
                      args_xh.printLog ? console.log('商品被过滤，该商品是种草官专属') : '';
                      $.isPush = false;
                      break;
                    } else if (itemTag.tagType === 5) {
                      args_xh.printLog ? console.log('商品被跳过，该商品是付费试用！') : '';
                      $.isPush = false;
                      break;
                    }
                  }
                }
              }
              if (item.skuTitle && $.isPush) {
                args_xh.printLog ? console.log(`检测 tabId:${args_xh.tabId[$.nowTabIdIndex]} 的 第 ${page}/${args_xh.totalPages} 页 第 ${$.nowItem++ + 1} 个商品\n${item.skuTitle}`) : '';
                if (args_xh.whiteList) {
                  if (args_xh.whiteListKeywords.some((fileter_word) => item.skuTitle.includes(fileter_word))) {
                    args_xh.printLog ? console.log(`商品白名单通过，将加入试用组，trialActivityId为${item.trialActivityId}\n`) : '';
                    trialActivityIdList.push(item.trialActivityId);
                    trialActivityTitleList.push(item.skuTitle);
                  }
                } else {
                  tempKeyword = ``;
                  if (parseFloat(item.jdPrice) <= args_xh.jdPrice) {
                    args_xh.printLog ? console.log(`商品被过滤，${item.jdPrice} < ${args_xh.jdPrice} \n`) : '';
                  } else if (parseFloat(item.supplyNum) < args_xh.minSupplyNum && item.supplyNum !== null) {
                    args_xh.printLog ? console.log(`商品被过滤，提供申请的份数小于预设申请的份数 \n`) : '';
                  } else if (parseFloat(item.applyNum) > args_xh.applyNumFilter && item.applyNum !== null) {
                    args_xh.printLog ? console.log(`商品被过滤，已申请试用人数大于预设人数 \n`) : '';
                  } else if (parseFloat(item.jdPrice) < args_xh.jdPrice) {
                    args_xh.printLog ? console.log(`商品被过滤，商品原价低于预设商品原价 \n`) : '';
                  } else if (args_xh.titleFilters.some((fileter_word) => (item.skuTitle.includes(fileter_word) ? (tempKeyword = fileter_word) : ''))) {
                    args_xh.printLog ? console.log(`商品被过滤，含有关键词 ${tempKeyword}\n`) : '';
                  } else {
                    args_xh.printLog ? console.log(`商品通过，将加入试用组，trialActivityId为${item.trialActivityId}\n`) : '';
                    trialActivityIdList.push(item.trialActivityId);
                    trialActivityTitleList.push(item.skuTitle);
                  }
                }
              } else if ($.isPush !== false) {
                console.error('skuTitle解析异常');
                return;
              }
            }
            console.log(`当前试用组长度为：${trialActivityIdList.length}`);
            args_xh.printLog ? console.log(`${trialActivityIdList}`) : '';
            if (page >= args_xh.totalPages && $.nowTabIdIndex < args_xh.tabId.length) {
              //这个是因为每一个tab都会有对应的页数，获取完如果还不够的话，就获取下一个tab
              $.nowTabIdIndex++;
              $.nowPage = 1;
              $.nowItem = 1;
            }
          } else {
            console.log(`💩 获得试用列表失败: ${data.message}`);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

function try_apply(title, activityId) {
  return new Promise((resolve, reject) => {
    console.log(`申请试用商品提交中...`);
    args_xh.printLog ? console.log(`商品：${title}`) : '';
    args_xh.printLog ? console.log(`id为：${activityId}`) : '';
    const body = JSON.stringify({
      activityId: activityId,
      previewTime: '',
    });
    let option = taskurl_xh('newtry', 'try_apply', body);
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          if (JSON.stringify(err) === `\"Response code 403 (Forbidden)\"`) {
            $.isForbidden = true;
            console.log('账号被京东服务器风控，不再请求该帐号');
          } else {
            console.log(JSON.stringify(err));
            console.log(`${$.name} API请求失败，请检查网路重试`);
          }
        } else {
          $.totalTry++;
          data = JSON.parse(data);
          if (data.success && data.code === '1') {
            // 申请成功
            console.log('申请提交成功');
            $.totalSuccess++;
          } else if (data.code === '-106') {
            console.log(data.message); // 未在申请时间内！
          } else if (data.code === '-110') {
            console.log(data.message); // 您的申请已成功提交，请勿重复申请…
          } else if (data.code === '-120') {
            console.log(data.message); // 您还不是会员，本品只限会员申请试用，请注册会员后申请！
          } else if (data.code === '-167') {
            console.log(data.message); // 抱歉，此试用需为种草官才能申请。查看下方详情了解更多。
          } else if (data.code === '-131') {
            console.log(data.message); // 申请次数上限。
            $.isLimit = true;
          } else if (data.code === '-113') {
            console.log(data.message); // 操作不要太快哦！
          } else {
            console.log('申请失败', data);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

function try_MyTrials(page, selected) {
  return new Promise((resolve, reject) => {
    switch (selected) {
      case 1:
        console.log('正在获取已申请的商品...');
        break;
      case 2:
        console.log('正在获取申请成功的商品...');
        break;
      case 3:
        console.log('正在获取申请失败的商品...');
        break;
      default:
        console.log('selected错误');
    }
    let options = {
      url: URL,
      body: `appid=newtry&functionId=try_MyTrials&clientVersion=10.3.4&client=wh5&body=%7B%22page%22%3A${page}%2C%22selected%22%3A${selected}%2C%22previewTime%22%3A%22%22%7D`,
      headers: {
        origin: 'https://prodev.m.jd.com',
        'User-Agent':
          'jdapp;iPhone;10.3.4;;;M/5.0;appBuild/167945;jdSupportDarkMode/1;;;Mozilla/5.0 (iPhone; CPU iPhone OS 15_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;',
        referer: 'https://prodev.m.jd.com/',
        cookie: `${$.cookie} __jda=1.1.1.1.1.1;`,
      },
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.success) {
            //temp adjustment
            if (selected === 2) {
              if (data.success && data.data) {
                for (let item of data.data.list) {
                  item.status === 4 || item.text.text.includes('已放弃') ? ($.giveupNum += 1) : '';
                  item.status === 2 && item.text.text.includes('试用资格将保留') ? ($.successNum += 1) : '';
                  item.status === 2 && item.text.text.includes('请收货后尽快提交报告') ? ($.getNum += 1) : '';
                  item.status === 2 && item.text.text.includes('试用已完成') ? ($.completeNum += 1) : '';
                }
                console.log(`待领取 | 已领取 | 已完成 | 已放弃：${$.successNum} | ${$.getNum} | ${$.completeNum} | ${$.giveupNum}`);
              } else {
                console.log(`获得成功列表失败: ${data.message}`);
              }
            }
          } else {
            console.error(`ERROR:try_MyTrials`);
          }
        }
      } catch (e) {
        reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`);
      } finally {
        resolve();
      }
    });
  });
}

function taskurl_xh(appid, functionId, body = JSON.stringify({})) {
  return {
    url: `${URL}?appid=${appid}&functionId=${functionId}&clientVersion=10.3.4&client=wh5&body=${encodeURIComponent(body)}`,
    headers: {
      Cookie: `${$.cookie} __jda=1.1.1.1.1.1;`,
      'user-agent':
        'jdapp;iPhone;10.1.2;15.0;ff2caa92a8529e4788a34b3d8d4df66d9573f499;network/wifi;model/iPhone13,4;addressid/2074196292;appBuild/167802;jdSupportDarkMode/1;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://prodev.m.jd.com/',
      origin: 'https://prodev.m.jd.com/',
      Accept: 'application/json,text/plain,*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
}

async function showMsg() {
  let message = ``;
  message += `👤 京东账号${$.index} ${$.nickName || $.UserName}\n`;
  if ($.totalSuccess !== 0 && $.totalTry !== 0) {
    message += `🎉 本次提交申请：${$.totalSuccess}/${$.totalTry}个商品🛒\n`;
    message += `🎉 ${$.successNum}个商品待领取\n`;
    message += `🎉 ${$.getNum}个商品已领取\n`;
    message += `🎉 ${$.completeNum}个商品已完成\n`;
    message += `🗑 ${$.giveupNum}个商品已放弃\n\n`;
  } else {
    message += `⚠️ 本次执行没有申请试用商品\n`;
    message += `🎉 ${$.successNum}个商品待领取\n`;
    message += `🎉 ${$.getNum}个商品已领取\n`;
    message += `🎉 ${$.completeNum}个商品已完成\n`;
    message += `🗑 ${$.giveupNum}个商品已放弃\n\n`;
  }
  if (!args_xh.jdNotify || args_xh.jdNotify === 'false') {
    $.msg($.name, ``, message, {
      'open-url': 'https://try.m.jd.com/user',
    });
    if ($.isNode()) notifyMsg += `${message}`;
  } else {
    console.log(message);
  }
}

const generateRandomInteger = (min, max = 0) => {
  if (min > max) {
    let temp = min;
    min = max;
    max = temp;
  }
  var Range = max - min;
  var Rand = Math.random();
  return min + Math.round(Rand * Range);
};
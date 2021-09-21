/* 此脚本为搬运脚本，仅方便自己使用
 * 由ZCY01二次修改：脚本默认不运行
 * 由 X1a0He 修复：依然保持脚本默认不运行
 * 脚本兼容: Node.js
 * X1a0He留
 * 由于没有兼容Qx，原脚本已失效，建议原脚本的兼容Qx注释删了
 * 脚本是否耗时只看args_xh.maxLength的大小
 * 上一作者说了每天最多300个商店，总上限为500个，jd_unsubscribe.js我已更新为批量取关版
 * 请提前取关至少250个商店确保京东试用脚本正常运行
cron "32 6 * * *" jd_try.js
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京东试用');

const URL = 'https://api.m.jd.com/client.action';
let trialActivityIdList = [];
let trialActivityTitleList = [];
let notifyMsg = '';
let size = 1;
$.isPush = true;
$.isLimit = false;
process.env.JD_TRY=true;
//下面很重要，遇到问题请把下面注释看一遍再来问
let args_xh = {
  /*
   * 商品原价，低于这个价格都不会试用，意思是
   * A商品原价49元，试用价1元，如果下面设置为50，那么A商品不会被加入到待提交的试用组
   * B商品原价99元，试用价0元，如果下面设置为50，那么B商品将会被加入到待提交的试用组
   * 默认为0
   * */
  jdPrice: process.env.JD_TRY_PRICE * 1 || 100,
  /*
   * 获取试用商品类型，默认为1，原来不是数组形式，我以为就只有几个tab，结果后面还有我服了
   * 1 - 精选
   * 2 - 闪电试
   * 3 - 家用电器(可能会有变化)
   * 4 - 手机数码(可能会有变化)
   * 5 - 电脑办公(可能会有变化)
   * ...
   * 下面有一个function是可以获取所有tabId的，名为try_tabList
   * 2021-09-06 12:32:00时获取到 tabId 16个
   * 可设置环境变量：JD_TRY_TABID，用@进行分隔
   * 默认为 1 到 5
   * */
  tabId: (process.env.JD_TRY_TABID && process.env.JD_TRY_TABID.split('@').map(Number)) || [1, 2, 3, 4, 5, 6, 7, 8],
  /*
   * 单tab 最大page 0为不限制
   * */
  tabPageLimit: process.env.JD_TAB_PAGE_LIMIT ? process.env.JD_TAB_PAGE_LIMIT * 1 : 8,
  /*
   * 试用商品标题过滤，黑名单，当标题存在关键词时，则不加入试用组
   * 可设置环境变量：JD_TRY_TITLEFILTERS，关键词与关键词之间用@分隔
   * */
  titleFilters:
    (process.env.JD_TRY_TITLEFILTERS && process.env.JD_TRY_TITLEFILTERS.split('@')) ||
    '教程@软件@英语@辅导@培训@燕窝@树苗@看房游@口服液@灸贴@云南旅游@掌之友@金满缘@新兴港隆@拆机@品鉴@咨询@零基础@课@训练营@礼品袋@快狐@疣@包皮@疏通@药@鱼胶@狗狗@幼犬@尿垫@浪潮英信@专家@饲料@代办@美缝剂@体验@遮瑕@洗面奶@洁面乳@抗皱@膏@猫砂@购房@消食@积食@软胶囊@养生茶@驼背@房产@辅食@打印纸@财务管理@进销存@实战@生发液@染发@补血@珍珠粉@玛咖@灰指甲@阿胶@维生素@同仁堂@讲堂@教材@补肾@开发@疹@疮@疥@软膏@真题@模拟题@专车接送@看海@学员@投资@通关@名师@酵素@全国流量@奶粉@香皂@精油@爱犬@教学@猫人@学车@你拍一@宠物@会计@考试@胶原蛋白@鲜花@系统@体检@检查@减肥@玫瑰花@股票@丰胸@大王卡@博仑帅@月租@上网卡@不限流量@日租卡@洗车机@甲醛检测@桨叶@烫发@机油@吸奶器@冰箱底座@胶漆@小靓美@洁面扑@内衣@胸罩@文胸@种子@档案袋@塑料袋@垃圾袋@癣@脚气@阴道@生殖器@肛门@狐臭@老太太@妇女@私处@孕妇@卫生巾@卫生条@培训@洋娃娃@女孩玩具@益智@女性内衣@女性内裤@女内裤@女内衣@女孩@三角裤@鱼饵@钓鱼@尿杯@安全座椅@娃娃@辅导@网校@电商@车载充电器@美少女@纸尿裤@英语@俄语@四级@六级@四六级@在线网络@在线@阴道炎@宫颈@糜烂@猫粮@狗粮@触媒@幼儿园@手机卡@流量卡@电话卡@人参'.split('@'),
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
  applyNumFilter: process.env.JD_TRY_APPLYNUMFILTER * 1 || 1000,
  /*
   * 商品试用之间和获取商品之间的间隔, 单位：毫秒(1秒=1000毫秒)
   * 可设置环境变量：JD_TRY_APPLYINTERVAL
   * 默认为3000，也就是3秒
   * */
  applyInterval: process.env.JD_TRY_APPLYINTERVAL * 1 || 3000,
  /*
   * 商品数组的最大长度，通俗来说就是即将申请的商品队列长度
   * 例如设置为20，当第一次获取后获得12件，过滤后剩下5件，将会进行第二次获取，过滤后加上第一次剩余件数
   * 例如是18件，将会进行第三次获取，直到过滤完毕后为20件才会停止，不建议设置太大
   * 可设置环境变量：JD_TRY_MAXLENGTH
   * 0为不限制
   * */
  maxLength: process.env.JD_TRY_MAXLENGTH ? process.env.JD_TRY_MAXLENGTH * 1 : 10,
  /*
   * 过滤种草官类试用，某些试用商品是专属官专属，考虑到部分账号不是种草官账号
   * 例如A商品是种草官专属试用商品，下面设置为true，而你又不是种草官账号，那A商品将不会被添加到待提交试用组
   * 例如B商品是种草官专属试用商品，下面设置为false，而你是种草官账号，那A商品将会被添加到待提交试用组
   * 例如B商品是种草官专属试用商品，下面设置为true，即使你是种草官账号，A商品也不会被添加到待提交试用组
   * 可设置环境变量：JD_TRY_PASSZC，默认为true
   * */
  passZhongCao: process.env.JD_TRY_PASSZC || true,
  /*
   * 是否打印输出到日志，考虑到如果试用组长度过大，例如100以上，如果每个商品检测都打印一遍，日志长度会非常长
   * 打印的优点：清晰知道每个商品为什么会被过滤，哪个商品被添加到了待提交试用组
   * 打印的缺点：会使日志变得很长
   *
   * 不打印的优点：简短日志长度
   * 不打印的缺点：无法清晰知道每个商品为什么会被过滤，哪个商品被添加到了待提交试用组
   * 可设置环境变量：JD_TRY_PLOG，默认为true
   * */
  printLog: process.env.JD_TRY_PLOG || true,
  /*
   * 白名单
   * 可通过环境变量控制：JD_TRY_WHITELIST，默认为false
   * */
  whiteList: process.env.JD_TRY_WHITELIST || false,
  /*
   * 白名单关键词，当标题存在关键词时，加入到试用组
   * 可通过环境变量控制：JD_TRY_WHITELIST，用@分隔
   * */
  whiteListKeywords: (process.env.JD_TRY_WHITELIST && process.env.JD_TRY_WHITELIST.split('@')) || [],
  /*
   * 试用通知
   * */
  jdNotify: process.env.JD_TRY_NOTIFY || false,
};
//上面很重要，遇到问题请把上面注释看一遍再来问
!(async () => {
  console.log('X1a0He留：遇到问题请把脚本内的注释看一遍再来问，谢谢');
  console.log(`本脚本默认不运行，也不建议运行\n如需运行请自行添加环境变量：JD_TRY，值填：true\n`);
  await $.wait(500);
  if (process.env.JD_TRY && process.env.JD_TRY === 'true') {
    await requireConfig();
    if (!$.cookiesArr[0]) {
      $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
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
        if (!$.isLogin) {
          $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
            'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
          });
          await $.notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
          continue;
        }
        $.totalTry = 0;
        $.totalSuccess = 0;
        trialActivityIdList = [];
        trialActivityTitleList = [];
        $.isLimit = false;
        console.log(`trialActivityIdList长度：${trialActivityIdList.length}`);
        console.log(`trialActivityTitleList长度：${trialActivityTitleList.length}`);
        console.log(`$.isLimit为：${$.isLimit}`);
        // 获取tabList的，不知道有哪些的把这里的注释解开跑一遍就行了
        // await try_tabList();
        // return;

        for (tab of args_xh.tabId) {
          if (trialActivityIdList.length >= args_xh.maxLength && args_xh.maxLength != 0) {
            console.log('商品列表长度已满.结束获取');
            break;
          }

          $.nowPage = 1;
          $.nowItem = 1;
          $.totalPages = 2;

          do {
            if ($.nowPage > args_xh.tabPageLimit && args_xh.tabPageLimit != 0) {
              console.log(`请求页数超过${args_xh.tabPageLimit},跳过该tab进行下一个`);
              break;
            }

            if (trialActivityIdList.length >= args_xh.maxLength && args_xh.maxLength != 0) {
              console.log('商品列表长度已满.结束获取');
              break;
            }

            await $.wait(jd_helpers.randomNumber(1, 3) * 1000 + jd_helpers.randomNumber(100, 300));
            await try_feedsList(tab, $.nowPage++); //获取对应tabId的试用页面
          } while ($.nowPage < $.totalPages);
        }
        for (let i = 0; i < trialActivityIdList.length && $.isLimit === false; i++) {
          if ($.isLimit) {
            console.log('试用上限');
            break;
          }
          await try_apply(trialActivityTitleList[i], trialActivityIdList[i]);
          console.log(`间隔等待中，请等待 ${args_xh.applyInterval} ms\n`);
          await $.wait(args_xh.applyInterval);
        }
        console.log('试用申请执行完毕...');
        // await try_MyTrials(1, 1)    //申请中的商品
        await try_MyTrials(1, 2); //申请成功的商品
        // await try_MyTrials(1, 3)    //申请失败的商品
        await showMsg();
      }
    }
    await $.notify.sendNotify(`${$.name}`, notifyMsg);
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
        if (jdCookieNode[item]) {
          $.cookiesArr.push(jdCookieNode[item]);
        }
      });
      if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
    } else {
      //IOS等用户直接用NobyDa的jd $.cookie
      $.cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
    }
    if (typeof process.env.JD_TRY_WHITELIST === 'undefined') args_xh.whiteList = false;
    else args_xh.whiteList = process.env.JD_TRY_WHITELIST === 'true';
    if (typeof process.env.JD_TRY_PLOG === 'undefined') args_xh.printLog = true;
    else args_xh.printLog = process.env.JD_TRY_PLOG === 'true';
    if (typeof process.env.JD_TRY_PASSZC === 'undefined') args_xh.passZhongCao = true;
    else args_xh.passZhongCao = process.env.JD_TRY_PASSZC === 'true';
    console.log(`共${$.cookiesArr.length}个京东账号\n`);
    console.log('=====环境变量配置如下=====');
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
    // for(const key in args_xh){
    //     if(typeof args_xh[key] == 'string'){
    //         args_xh[key] = Number(args_xh[key])
    //     }
    // }
    // console.debug(args_xh)
    resolve();
  });
}

//获取tabList的，如果不知道tabList有哪些，跑一遍这个function就行了
function try_tabList() {
  return new Promise((resolve, reject) => {
    console.log(`获取tabList中...`);
    const body = JSON.stringify({ previewTime: '' });
    let option = taskurl_xh('newtry', 'try_tabList', body);
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网络\n${JSON.stringify(err)}`);
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
      previewTime: '',
    });
    let option = taskurl_xh('newtry', 'try_feedsList', body);
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.success) {
            $.totalPages = data.data.pages;
            console.log(`第 ${size++} 次获取试用商品成功，tabId:${tabId} 的 第 ${page}/${$.totalPages} 页`);
            console.log(`获取到商品 ${data.data.feedList.length} 条`);

            for (let item of data.data.feedList) {
              if (trialActivityIdList.length >= args_xh.maxLength && args_xh.maxLength != 0) {
                console.log('商品列表长度已满.结束获取');
                break;
              }
              if (item.applyState === 1) {
                args_xh.printLog ? console.log(`商品已申请试用：${item.skuTitle}`) : '';
                continue;
              }
              if (item.applyState !== null) {
                args_xh.printLog ? console.log(`商品状态异常，未找到skuTitle`) : '';
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
                    }
                  }
                }
              }
              if (item.skuTitle && $.isPush) {
                args_xh.printLog ? console.log(`检测 tabId:${tabId} 的 第 ${page}/${$.totalPages} 页 第 ${$.nowItem++ + 1} 个商品\n${item.skuTitle}`) : '';
                if (args_xh.whiteList) {
                  if (args_xh.whiteListKeywords.some((fileter_word) => item.skuTitle.includes(fileter_word))) {
                    args_xh.printLog ? console.log(`商品通过，将加入试用组，trialActivityId为${item.trialActivityId}\n`) : '';
                    trialActivityIdList.push(item.trialActivityId);
                    trialActivityTitleList.push(item.skuTitle);
                  }
                } else {
                  if (parseFloat(item.jdPrice) <= args_xh.jdPrice) {
                    args_xh.printLog ? console.log(`商品被过滤，${item.jdPrice} < ${args_xh.jdPrice} \n`) : '';
                  } else if (parseFloat(item.supplyNum) < args_xh.minSupplyNum && item.supplyNum !== null) {
                    args_xh.printLog ? console.log(`商品被过滤，提供申请的份数小于预设申请的份数 \n`) : '';
                  } else if (parseFloat(item.applyNum) > args_xh.applyNumFilter && item.applyNum !== null) {
                    args_xh.printLog ? console.log(`商品被过滤，已申请试用人数大于预设人数 \n`) : '';
                  } else if (parseFloat(item.jdPrice) < args_xh.jdPrice) {
                    args_xh.printLog ? console.log(`商品被过滤，商品原价低于预设商品原价 \n`) : '';
                  } else if (args_xh.titleFilters.some((fileter_word) => item.skuTitle.includes(fileter_word))) {
                    args_xh.printLog ? console.log('商品被过滤，含有关键词 \n') : '';
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
    console.log('申请试用商品提交中...');
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
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
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
    const body = JSON.stringify({
      page: page,
      selected: selected, // 1 - 已申请 2 - 成功列表，3 - 失败列表
      previewTime: '',
    });
    let option = taskurl_xh('newtry', 'try_MyTrials', body);
    option.headers.Referer = 'https://pro.m.jd.com/';
    $.get(option, (err, resp, data) => {
      try {
        if (err) {
          console.log(`🚫 ${arguments.callee.name.toString()} API请求失败，请检查网路\n${JSON.stringify(err)}`);
        } else {
          data = JSON.parse(data);
          if (data.success) {
            //temp adjustment
            if (selected === 2) {
              if (data.success && data.data) {
                $.successList = data.data.list.filter((item) => {
                  return item.text.text.includes('请尽快领取');
                });
                console.log(`待领取: ${$.successList.length}个`);
              } else {
                console.log(`获得成功列表失败: ${data.message}`);
              }
            }
            // if(data.data.list.length > 0){
            //     for(let item of data.data.list){
            //         console.log(`申请时间：${new Date(parseInt(item.applyTime)).toLocaleString()}`)
            //         console.log(`申请商品：${item.trialName}`)
            //         console.log(`当前状态：${item.text.text}`)
            //         console.log(`剩余时间：${remaining(item.leftTime)}`)
            //         console.log()
            //     }
            // } else {
            //     switch(selected){
            //         case 1:
            //             console.log('无已申请的商品\n')
            //             break;
            //         case 2:
            //             console.log('无申请成功的商品\n')
            //             break;
            //         case 3:
            //             console.log('无申请失败的商品\n')
            //             break;
            //         default:
            //             console.log('selected错误')
            //     }
            // }
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
    url: `${URL}?appid=${appid}&functionId=${functionId}&clientVersion=10.1.2&client=wh5&body=${encodeURIComponent(body)}`,
    headers: {
      Host: 'api.m.jd.com',
      'Accept-Encoding': 'gzip, deflate, br',
      Cookie: $.cookie,
      Connection: 'keep-alive',
      UserAgent:
        'jdapp;iPhone;10.1.2;15.0;ff2caa92a8529e4788a34b3d8d4df66d9573f499;network/wifi;model/iPhone13,4;addressid/2074196292;appBuild/167802;jdSupportDarkMode/1;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      'Accept-Language': 'zh-cn',
      Referer: 'https://prodev.m.jd.com/',
    },
  };
}

async function showMsg() {
  let message = `京东账号${$.index} ${$.nickName || $.UserName}\n🎉 本次申请成功：${$.totalSuccess}/${$.totalTry}个商品🛒\n🎉 ${$.successList.length}个商品待领取`;
  if (args_xh.jdNotify || $.successList.length > 0) {
    $.msg($.name, ``, message, { 'open-url': 'https://try.m.jd.com/user' });
    if ($.isNode()) notifyMsg += `${message}\n\n`;
  } else {
    console.log(message);
  }
}

/*

https://wbbny.m.jd.com/babelDiy/Zeus/2rtpffK8wqNyPBH6wyUDuBKoAbCt/index.html

cron 12 7-14 * * * https://raw.githubusercontent.com/smiek2221/scripts/master/jd_summer_movement_help.js

*/

const $ = new Env('燃动夏季_SH助力');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const https = require('https');
const fs = require('fs/promises');
const { R_OK } = require('fs').constants;
const vm = require('vm');
let smashUtils;

let summer_movement_ShHelpFlag = 1;// 0不开启也不助力 1开启并助力 2开启但不助力
if ($.isNode() && process.env.summer_movement_ShHelpFlag) {
  summer_movement_ShHelpFlag = process.env.summer_movement_ShHelpFlag;
}

const ShHelpAuthorFlag = false;//是否助力作者SH  true 助力，false 不助力
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [];
$.cookie = '';
$.secretpInfo = {};
$.ShInviteList = [];
$.innerShInviteList = [''];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => { };
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}

$.appid = 'o2_act';
const UA = $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : "JD4iPhone/9.3.5 CFNetwork/1209 Darwin/20.2.0") : ($.getdata('JDUA') ? $.getdata('JDUA') : "JD4iPhone/9.3.5 CFNetwork/1209 Darwin/20.2.0")

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  console.log('活动入口：京东APP-》 首页-》 右边小窗口（点我赢千元）\n' +
      'SH互助：内部账号自行互助(排名靠前账号得到的机会多),多余的助力次数会默认助力作者内置助力码\n' +
      '本脚本只助力SH\n' +
      '百元守卫战 开启时间早上8点过后\n' +
      '活动时间：2021-07-08至2021-08-08\n' +
      '脚本更新时间：2021年7月9日 9点00分\n'
      );
      if(Number(summer_movement_ShHelpFlag) === 1){
        console.log('您设置了 【百元守卫战SH】? || 互助?')
      }else if(Number(summer_movement_ShHelpFlag) === 2){
        console.log('您设置了 【百元守卫战SH】? || 互助?')
      }else if(Number(summer_movement_ShHelpFlag) === 0){
        console.log('您设置了 【百元守卫战SH】? || 互助?')
      }else{
        console.log('原 summer_movement_ShHelpFlag 变量不兼容请修改 0不开启也不助力 1开启并助力 2开启但不助力')
      }

  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookiesArr[i];
      $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = $.UserName;
      $.hotFlag = false; //是否火爆
      console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
      console.log(`\n如有未完成的任务，请多执行几次\n`);
      await movement()
      if($.hotFlag)$.secretpInfo[$.UserName] = false;//火爆账号不执行助力
    }
  }

  // 助力
  let res = [];
  if (ShHelpAuthorFlag) {
    $.innerShInviteList = getRandomArrayElements([...$.innerShInviteList, ...res], [...$.innerShInviteList, ...res].length);
    $.ShInviteList.push(...$.innerShInviteList);
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookiesArr[i];
    $.canHelp = true;
    $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    // if (!$.secretpInfo[$.UserName]) {
    //   continue;
    // }
    // $.secretp = $.secretpInfo[$.UserName];
    $.index = i + 1;
    if (new Date().getUTCHours() + 8 >= 8) {
      if(Number(summer_movement_ShHelpFlag) === 1){
        if ($.ShInviteList && $.ShInviteList.length) console.log(`\n******开始内部京东账号【百元守卫战SH】助力*********\n`);
        for (let i = 0; i < $.ShInviteList.length && $.canHelp; i++) {
          console.log(`${$.UserName} 去助力SH码 ${$.ShInviteList[i]}`);
          $.inviteId = $.ShInviteList[i];
          await takePostRequest('shHelp');
          await $.wait(1000);
        }
      }
      $.canHelp = true;
    }
  }
})()
  .catch((e) => {
    $.log('', `? ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function movement() {
  try {
    $.signSingle = {};
    $.homeData = {};
    $.secretp = ``;
    $.taskList = [];
    $.shopSign = ``;
    $.userInfo = ''
    if (new Date().getUTCHours() + 8 >= 8) {
      console.log('\n百元守卫战')
      if(Number(summer_movement_ShHelpFlag) === 1 || Number(summer_movement_ShHelpFlag) === 2){
        $.Shend = false
        await $.wait(1000);
        await takePostRequest('olypicgames_guradHome');
        await $.wait(1000);
        if($.Shend){
          await takePostRequest('olympicgames_receiveCash');
          await $.wait(1000);
        }
      }
    }else{
      console.log('\n百元守卫战开启时间还没到')
    }
  } catch (e) {
    $.logErr(e)
  }
}

async function takePostRequest(type) {
  let body = ``;
  let myRequest = ``;
  switch (type) {
    case 'olympicgames_receiveCash':
      let id = 6
      if ($.Shend) id = 4
      body = `functionId=olympicgames_receiveCash&body={"type":${id}}&client=wh5&clientVersion=1.0.0&appid=${$.appid}`;
      myRequest = await getPostRequest(`olympicgames_receiveCash`, body);
      break
    case 'olypicgames_guradHome':
      body = `functionId=olypicgames_guradHome&body={}&client=wh5&clientVersion=1.0.0&appid=${$.appid}`;
      myRequest = await getPostRequest(`olypicgames_guradHome`, body);
      break
    case 'shHelp':
    case 'help':
      body = await getPostBody(type);
      myRequest = await getPostRequest(`zoo_collectScore`, body);
      break;
    default:
      console.log(`错误${type}`);
  }
  if (myRequest) {
    return new Promise(async resolve => {
      $.post(myRequest, (err, resp, data) => {
        try {
          // console.log(data);
          dealReturn(type, data);
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve();
        }
      })
    })
  }
}

async function dealReturn(type, res) {
  try {
    data = JSON.parse(res);
  } catch (e) {
    console.log(`返回异常：${res}`);
    return;
  }
  switch (type) {
    case 'olympicgames_receiveCash':
      if (data.code === 0 && data.data && data.data.result) {
        if (data.data.result.couponVO) {
          console.log('升级成功')
          let res = data.data.result.couponVO
          console.log(`获得[${res.couponName}]优惠券：${res.usageThreshold} 优惠：${res.quota} 时间：${res.useTimeRange}`);
        }else if(data.data.result.userActBaseVO){
          console.log('结算结果')
          let res = data.data.result.userActBaseVO
          console.log(`当前金额：${res.totalMoney}\n${JSON.stringify(res)}`);
        }
      } else if (data.data && data.data.bizMsg) {
        console.log(data.data.bizMsg);
      } else {
        console.log(res);
      }
      break;
    case 'olypicgames_guradHome':
      console.log(res)
      if (data.data && data.data.bizCode === 0) {
        console.log(`SH互助码：${data.data.result && data.data.result.inviteId || '助力已满，获取助力码失败\n'}`);
        if (data.data.result && data.data.result.inviteId) {
          if (data.data.result.inviteId) $.ShInviteList.push(data.data.result.inviteId);
          console.log(`守护金额：${Number(data.data.result.activityLeftAmount || 0)} 护盾剩余：${timeFn(Number(data.data.result.guardLeftSeconds || 0) * 1000)} 离结束剩：${timeFn(Number(data.data.result.activityLeftSeconds || 0) * 1000)}`)
          if(data.data.result.activityLeftSeconds == 0) $.Shend = true
        }
        $.taskList = data.data.result && data.data.result.taskVos || [];
      } else if (data.data && data.data.bizMsg) {
        console.log(data.data.bizMsg);
      } else {
        console.log(res);
      }
      break;
    case 'shHelp':
    case 'help':
      if (data.data && data.data.bizCode === 0) {
        let cash = ''
        if (data.data.result.hongBaoVO && data.data.result.hongBaoVO.withdrawCash) cash = `，并获得${Number(data.data.result.hongBaoVO.withdrawCash)}红包`
        console.log(`助力成功${cash}`);
      } else if (data.data && data.data.bizMsg) {
        if (data.data.bizMsg.indexOf('今天用完所有') > -1) {
          $.canHelp = false;
        }
        console.log(data.data.bizMsg);
      } else {
        console.log(res);
      }
      break;
    default:
      console.log(`未判断的异常${type}`);
  }
}

async function getPostBody(type) {
  return new Promise(async resolve => {
    let taskBody = '';
    try {
      const log = await getBody()
      if (type === 'help' || type === 'shHelp') {
        taskBody = `functionId=olympicgames_assist&body=${JSON.stringify({"inviteId":$.inviteId,"type": "confirm","ss" :log})}&client=wh5&clientVersion=1.0.0&appid=${$.appid}`
      }
    } catch (e) {
      $.logErr(e)
    } finally {
      resolve(taskBody);
    }
  })
}

async function getPostRequest(type, body) {
  let url = `https://api.m.jd.com/client.action?advId=${type}`;
  const method = `POST`;
  const headers = {
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
    "Content-Type": "application/x-www-form-urlencoded",
    'Cookie': $.cookie,
    "Origin": "https://wbbny.m.jd.com",
    "Referer": "https://wbbny.m.jd.com/",
    "User-Agent": "jdapp;iPhone;9.2.0;14.1;"
  };
  return {url: url, method: method, headers: headers, body: body};
}

/**
 * 随机从一数组里面取
 * @param arr
 * @param count
 * @returns {Buffer}
 */
 function getRandomArrayElements(arr, count) {
  var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

// 随机数
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

// 计算时间
function timeFn(dateBegin) {
  //如果时间格式是正确的，那下面这一步转化时间格式就可以不用了
  var dateEnd = new Date(0);//获取当前时间
  var dateDiff = dateBegin - dateEnd.getTime();//时间差的毫秒数
  var leave1 = dateDiff % (24 * 3600 * 1000)    //计算天数后剩余的毫秒数
  var hours = Math.floor(leave1 / (3600 * 1000))//计算出小时数
  //计算相差分钟数
  var leave2 = leave1 % (3600 * 1000)    //计算小时数后剩余的毫秒数
  var minutes = Math.floor(leave2 / (60 * 1000))//计算相差分钟数
  //计算相差秒数
  var leave3 = leave2 % (60 * 1000)      //计算分钟数后剩余的毫秒数
  var seconds = Math.round(leave3 / 1000)

  var timeFn = hours + ":" + minutes + ":" + seconds;
  return timeFn;
}

var _0xodo='jsjiami.com.v6',_0x3d31=[_0xodo,'aGUP','wpbCmmAa','wq7DlcOpwrHDsm4=','NsK6w7VuwqA=','d8KQbcO7LA==','w4LDl8KQwqEW','Yi3DiTLCgQ==','woTCo8O/FFE=','fXI0wow8wofCgA==','ccO8fsKMw40=','wp4hwoUddw==','JsKlw4s=','wpXCqsKQcMOW','w4DCkVo7wrDCk1PDpDxaDg==','XMKeZsK0Qw==','YhnDly/CrA==','R8Ocw6jCmnk=','asOEw7nCqng=','w4bDkcKhwq8U','McOVRA==','DMOow4rDi8OHw6Q=','f8O6w64=','IyQ+TyvDkiPCqsKAw5nDhjHDnMOewpd3','R8KcSl1nAw==','XwQ2w63Cng==','worDjMOLwpTDrA==','w4Agw6HDocOiwohqwoDDr3Y=','XwrDrg==','wqQPwpbDj8KOwrUZwrnCkQ==','QCAbVcOFZzrDjltFw5Il','YBPDkzbCnQ==','RxsOw5HCsg==','w5rCmkcK','wrHCvcOfEms=','wpt6dirCoQ==','w7ITCMOGTw==','w513Zzpjw5w=','EsOww414wrNGw7Ec','wrjDjDoQEV0zKxfCmMOEw5PCtMK9CQ==','w7bCs8OU','wo3CmmYDHcK7EcO2wqI=','w7EYw67DpcOw','fsKqX8OQEg==','wpfCgH0e','fMK/Y8K3ZcOKw6zDtcK+AwQXwrs=','wrfDnTo/EA5vbz/CiMODw47CuMO/EMKTDsK5wq7Cp2TDkMK5wqxSw4w4McKUH8OyMcKPw5ZUU8ONw5w6NsOWwqZgf8OMOsKhFWXCh8OvKsKzwqDDrMOpwrvCocKQfB9QZn8CbCwOG8KOwrU2KGxNw6U=','woU5cR1e','VcK8GsKHX1LDtMOkW8OsCcKb','wosgwokg','a3MfHsKh','wqXDicO5wqjDsw==','w4LDhcK2wrcx','Zw1dFMK1ah4=','YsOMEcKF','L8Klw4fCtcObwrTDkcKWw6HDhCzDig==','ZwFLdcOKw7E=','bAtMBcKGainDgFJUw59ow7Y=','w7liVklQw6/DkQHDjsK0U8OV','U8KaS1JhEQ==','woE0FCnCnUPDqSoHw5Q=','wqbCrcKQVw==','V1gcUR8=','SClzDsKW','w4fCnUMbwpvCnlg=','w5Ntwrw8ZQ==','wpnCi2AgIMKfF8O+wq8qwqEY','J8O5MzI=','Ty/DuMOiw6jCjsKkwrfCpgHDisO2w7UOw7kMwrbCg8Osw7V7aMOwVXvChMKyw6TCrcO/csKXwoU/NwnCuTNlWTlmwoUf','acKcQUNiA0LCv8KWdkBScirDlcOceA==','w451ajt/w4I=','wq3DjC8rJV0sJQ==','wrdneBXCpw==','w4pHwpEhVA==','w5RBwoc5RCDDgQ==','IcKuw5fCmsOwwrjDmA==','GizDvsO4','IsO8IUPDlw==','PmnDt3R3','w6cWw5TDn8OcwqpI','IyfDvgPCvWhmwp1Y','IMK0w4fCj8OPwpLDig==','w6AHw4LCnsKF','w5V7M0oZ','wrHCmkHCtw==','jsOjiVNamiN.comBe.v6ZVVVHyYw=='];(function(_0x5af799,_0x273026,_0x321581){var _0x44d21f=function(_0x12b919,_0x10b60a,_0x4c1b2d,_0x43f31e,_0xfdc429){_0x10b60a=_0x10b60a>>0x8,_0xfdc429='po';var _0x2cb820='shift',_0x292b5a='push';if(_0x10b60a<_0x12b919){while(--_0x12b919){_0x43f31e=_0x5af799[_0x2cb820]();if(_0x10b60a===_0x12b919){_0x10b60a=_0x43f31e;_0x4c1b2d=_0x5af799[_0xfdc429+'p']();}else if(_0x10b60a&&_0x4c1b2d['replace'](/[OVNNBeZVVVHyYw=]/g,'')===_0x10b60a){_0x5af799[_0x292b5a](_0x43f31e);}}_0x5af799[_0x292b5a](_0x5af799[_0x2cb820]());}return 0x965a4;};return _0x44d21f(++_0x273026,_0x321581)>>_0x273026^_0x321581;}(_0x3d31,0x112,0x11200));var _0x5446=function(_0x12814e,_0x5a65ce){_0x12814e=~~'0x'['concat'](_0x12814e);var _0x42abd8=_0x3d31[_0x12814e];if(_0x5446['yvxJfx']===undefined){(function(){var _0x13f078;try{var _0x7df9f=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x13f078=_0x7df9f();}catch(_0x2ee7cf){_0x13f078=window;}var _0x1d9f1a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x13f078['atob']||(_0x13f078['atob']=function(_0xc37fb){var _0x16ec3f=String(_0xc37fb)['replace'](/=+$/,'');for(var _0x46e2fa=0x0,_0x206439,_0x123774,_0x3ff0ee=0x0,_0x5bc082='';_0x123774=_0x16ec3f['charAt'](_0x3ff0ee++);~_0x123774&&(_0x206439=_0x46e2fa%0x4?_0x206439*0x40+_0x123774:_0x123774,_0x46e2fa++%0x4)?_0x5bc082+=String['fromCharCode'](0xff&_0x206439>>(-0x2*_0x46e2fa&0x6)):0x0){_0x123774=_0x1d9f1a['indexOf'](_0x123774);}return _0x5bc082;});}());var _0x366714=function(_0xfa90c0,_0x5a65ce){var _0x2db237=[],_0x4ede73=0x0,_0x5d279e,_0x4045cb='',_0x5ebc95='';_0xfa90c0=atob(_0xfa90c0);for(var _0x529219=0x0,_0xb39eec=_0xfa90c0['length'];_0x529219<_0xb39eec;_0x529219++){_0x5ebc95+='%'+('00'+_0xfa90c0['charCodeAt'](_0x529219)['toString'](0x10))['slice'](-0x2);}_0xfa90c0=decodeURIComponent(_0x5ebc95);for(var _0x235c7d=0x0;_0x235c7d<0x100;_0x235c7d++){_0x2db237[_0x235c7d]=_0x235c7d;}for(_0x235c7d=0x0;_0x235c7d<0x100;_0x235c7d++){_0x4ede73=(_0x4ede73+_0x2db237[_0x235c7d]+_0x5a65ce['charCodeAt'](_0x235c7d%_0x5a65ce['length']))%0x100;_0x5d279e=_0x2db237[_0x235c7d];_0x2db237[_0x235c7d]=_0x2db237[_0x4ede73];_0x2db237[_0x4ede73]=_0x5d279e;}_0x235c7d=0x0;_0x4ede73=0x0;for(var _0xfe4ae2=0x0;_0xfe4ae2<_0xfa90c0['length'];_0xfe4ae2++){_0x235c7d=(_0x235c7d+0x1)%0x100;_0x4ede73=(_0x4ede73+_0x2db237[_0x235c7d])%0x100;_0x5d279e=_0x2db237[_0x235c7d];_0x2db237[_0x235c7d]=_0x2db237[_0x4ede73];_0x2db237[_0x4ede73]=_0x5d279e;_0x4045cb+=String['fromCharCode'](_0xfa90c0['charCodeAt'](_0xfe4ae2)^_0x2db237[(_0x2db237[_0x235c7d]+_0x2db237[_0x4ede73])%0x100]);}return _0x4045cb;};_0x5446['JzuvBY']=_0x366714;_0x5446['QlLBmx']={};_0x5446['yvxJfx']=!![];}var _0x392b75=_0x5446['QlLBmx'][_0x12814e];if(_0x392b75===undefined){if(_0x5446['SZQjXI']===undefined){_0x5446['SZQjXI']=!![];}_0x42abd8=_0x5446['JzuvBY'](_0x42abd8,_0x5a65ce);_0x5446['QlLBmx'][_0x12814e]=_0x42abd8;}else{_0x42abd8=_0x392b75;}return _0x42abd8;};class MovementFaker{constructor(_0x30658a){var _0x38f14f={'koTUX':function(_0x221965,_0x1943d5){return _0x221965(_0x1943d5);},'LmVUm':_0x5446('0','AR)B')};this[_0x5446('1',')h^H')]=_0x30658a;this['ua']=_0x38f14f[_0x5446('2','Pu^A')](require,_0x38f14f[_0x5446('3','OV4L')])[_0x5446('4','C1Oe')];}async[_0x5446('5','Sr4U')](){var _0x10b126={'MlSUE':_0x5446('6','C1Oe'),'YWxJN':function(_0x34065d,_0x61cd90){return _0x34065d+_0x61cd90;},'KHDdQ':function(_0x12b9cb,_0x5d6bed){return _0x12b9cb*_0x5d6bed;},'dkJVM':function(_0x19555e,_0x342171){return _0x19555e||_0x342171;},'dOwfz':_0x5446('7',')ToM')};var _0x547774=_0x10b126[_0x5446('8','Sr4U')][_0x5446('9','Pu^A')]('|'),_0x4d8cfe=0x0;while(!![]){switch(_0x547774[_0x4d8cfe++]){case'0':return _0x2529cd;case'1':if(!smashUtils){await this[_0x5446('a','*p0I')]();}continue;case'2':var _0x4389e8=Math[_0x5446('b','1eoo')](_0x10b126[_0x5446('c','PWGH')](0x989680,_0x10b126[_0x5446('d','^DuO')](0x55d4a80,Math[_0x5446('e','(FAA')]())))[_0x5446('f','vDHp')]();continue;case'3':var _0x5847d8=smashUtils[_0x5446('10',']*f8')]({'id':_0x4389e8,'data':{'random':_0x4389e8}})[_0x5446('11','Wg*R')];continue;case'4':var _0x2529cd=JSON[_0x5446('12','fc7c')]({'extraData':{'log':_0x10b126[_0x5446('13','C1Oe')](_0x5847d8,-0x1),'sceneid':_0x10b126[_0x5446('14','sQzE')]},'random':_0x4389e8});continue;}break;}}async[_0x5446('15','fc7c')](){var _0x442600={'oXOuf':_0x5446('16','eaW*'),'iaRUa':_0x5446('17',']*f8'),'ZSwMq':_0x5446('18',')E%M'),'GPZjd':_0x5446('19','sQzE')};console[_0x5446('1a','QwwR')](_0x442600[_0x5446('1b','TY1w')]);process[_0x5446('1c','OV4L')](__dirname);const _0x2e6464=_0x442600[_0x5446('1d','Tv69')];const _0x217c9b=/<script type="text\/javascript" src="([^><]+\/(app\.\w+\.js))\">/gm;const _0x34ccdc=await MovementFaker[_0x5446('1e',')ToM')](_0x2e6464);const _0x126d83=_0x217c9b[_0x5446('1f','9mI&')](_0x34ccdc);if(_0x126d83){const [,_0x1b1498,_0x56386e]=_0x126d83;const _0x3f9620=await this[_0x5446('20','ReO7')](_0x56386e,_0x1b1498);const _0x122cb1=new Function();const _0x3ae18e={'window':{'addEventListener':_0x122cb1},'document':{'addEventListener':_0x122cb1,'removeEventListener':_0x122cb1,'cookie':this[_0x5446('21','CwNQ')]},'navigator':{'userAgent':this['ua']}};vm[_0x5446('22',')ToM')](_0x3ae18e);vm[_0x5446('23','Zl$m')](_0x3f9620,_0x3ae18e);smashUtils=_0x3ae18e[_0x5446('24',')h^H')][_0x5446('25','d(wm')];smashUtils[_0x5446('26','5nE(')]({'appid':_0x442600[_0x5446('27','AR)B')],'sceneid':_0x442600[_0x5446('28',')ToM')]});}console[_0x5446('29','*p0I')](_0x442600[_0x5446('2a','mYUG')]);}async[_0x5446('2b','fc7c')](_0x368c4d,_0x41f108){var _0x3672d6={'uJvuH':_0x5446('2c','3BV*'),'vrbhW':_0x5446('2d','Iw2Q'),'pqtIa':function(_0x5e9e09,_0x3828e8){return _0x5e9e09&&_0x3828e8;},'uUHuq':_0x5446('2e',')h^H')};try{await fs[_0x5446('2f','(FAA')](_0x368c4d,R_OK);const _0x1b59eb=await fs[_0x5446('30',']*f8')](_0x368c4d,{'encoding':_0x3672d6[_0x5446('31','PWGH')]});return _0x1b59eb;}catch(_0x4f4c38){const _0x52f456=_0x3672d6[_0x5446('32','mYUG')];const _0x41948a=/(__webpack_require__\(__webpack_require__.s=)(\d+)(?=\)})/;const _0x1c2b72=0x163;let _0x1cab43=await MovementFaker[_0x5446('33','mYUG')](_0x41f108);const _0x4fff48=_0x1cab43[_0x5446('34','ReO7')](_0x52f456,0x1);const _0x39ace2=_0x41948a[_0x5446('35','Iw2Q')](_0x1cab43);if(!_0x3672d6[_0x5446('36','3BV*')](_0x4fff48,_0x39ace2)){throw new Error(_0x3672d6[_0x5446('37','8@id')]);}_0x1cab43=_0x1cab43[_0x5446('38','C1Oe')](_0x41948a,'$1'+_0x1c2b72);fs[_0x5446('39','1qBF')](_0x368c4d,_0x1cab43);return _0x1cab43;}}static[_0x5446('3a','ReO7')](_0x48422f){var _0x3772f9={'wzJVO':_0x5446('3b','C1Oe'),'muEMD':_0x5446('3c',')E%M'),'istCF':_0x5446('3d','1(kO'),'ORIQY':_0x5446('3e','AR)B'),'SrOiH':function(_0x4e2828,_0x39dc0e){return _0x4e2828!==_0x39dc0e;},'AvoTS':_0x5446('3f','fc7c'),'ahaXi':_0x5446('40','OV4L'),'ZiiSK':function(_0x8eb367,_0xbecf21){return _0x8eb367+_0xbecf21;}};return new Promise((_0x58e781,_0x1a36ce)=>{var _0x28b9eb={'mNsfK':_0x3772f9[_0x5446('41','lfxH')],'OfWLt':_0x3772f9[_0x5446('42','sQzE')],'JShyT':_0x3772f9[_0x5446('43','Tv69')],'gKyIU':_0x3772f9[_0x5446('44','Sr4U')]};const _0x3df6f0=_0x3772f9[_0x5446('45','1eoo')](_0x48422f[_0x5446('46','Uj&G')](_0x3772f9[_0x5446('47','xTry')]),0x0)?_0x3772f9[_0x5446('48','QwwR')]:'';const _0x249ba4=https[_0x5446('49','lfxH')](_0x3772f9[_0x5446('4a','5nE(')](_0x3df6f0,_0x48422f),_0x486ab6=>{_0x486ab6[_0x5446('4b','*p0I')](_0x28b9eb[_0x5446('4c','eaW*')]);let _0x2b57ea='';_0x486ab6['on'](_0x28b9eb[_0x5446('4d','Sr4U')],_0x1a36ce);_0x486ab6['on'](_0x28b9eb[_0x5446('4e','HP4n')],_0x4d7e2d=>_0x2b57ea+=_0x4d7e2d);_0x486ab6['on'](_0x28b9eb[_0x5446('4f','HP4n')],()=>_0x58e781(_0x2b57ea));});_0x249ba4['on'](_0x3772f9[_0x5446('50','Tv69')],_0x1a36ce);_0x249ba4[_0x5446('51','5diO')]();});}}async function getBody(){const _0x544114=new MovementFaker($[_0x5446('52','rQqC')]);const _0x4b6420=await _0x544114[_0x5446('53','HP4n')]();return _0x4b6420;};_0xodo='jsjiami.com.v6';

// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`??${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============??系统通知??=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`??${this.name}, 错误!`,t.stack):this.log("",`??${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`??${this.name}, 结束! ?? ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

/*
京享值PK

需手动开宝箱
能用且用
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('京享值PK');

// prettier-ignore
!function(n){"use strict";function r(n,r){var t=(65535&n)+(65535&r);return(n>>16)+(r>>16)+(t>>16)<<16|65535&t}function t(n,r){return n<<r|n>>>32-r}function u(n,u,e,o,c,f){return r(t(r(r(u,n),r(o,f)),c),e)}function e(n,r,t,e,o,c,f){return u(r&t|~r&e,n,r,o,c,f)}function o(n,r,t,e,o,c,f){return u(r&e|t&~e,n,r,o,c,f)}function c(n,r,t,e,o,c,f){return u(r^t^e,n,r,o,c,f)}function f(n,r,t,e,o,c,f){return u(t^(r|~e),n,r,o,c,f)}function i(n,t){n[t>>5]|=128<<t%32,n[14+(t+64>>>9<<4)]=t;var u,i,a,h,g,l=1732584193,d=-271733879,v=-1732584194,C=271733878;for(u=0;u<n.length;u+=16)i=l,a=d,h=v,g=C,d=f(d=f(d=f(d=f(d=c(d=c(d=c(d=c(d=o(d=o(d=o(d=o(d=e(d=e(d=e(d=e(d,v=e(v,C=e(C,l=e(l,d,v,C,n[u],7,-680876936),d,v,n[u+1],12,-389564586),l,d,n[u+2],17,606105819),C,l,n[u+3],22,-1044525330),v=e(v,C=e(C,l=e(l,d,v,C,n[u+4],7,-176418897),d,v,n[u+5],12,1200080426),l,d,n[u+6],17,-1473231341),C,l,n[u+7],22,-45705983),v=e(v,C=e(C,l=e(l,d,v,C,n[u+8],7,1770035416),d,v,n[u+9],12,-1958414417),l,d,n[u+10],17,-42063),C,l,n[u+11],22,-1990404162),v=e(v,C=e(C,l=e(l,d,v,C,n[u+12],7,1804603682),d,v,n[u+13],12,-40341101),l,d,n[u+14],17,-1502002290),C,l,n[u+15],22,1236535329),v=o(v,C=o(C,l=o(l,d,v,C,n[u+1],5,-165796510),d,v,n[u+6],9,-1069501632),l,d,n[u+11],14,643717713),C,l,n[u],20,-373897302),v=o(v,C=o(C,l=o(l,d,v,C,n[u+5],5,-701558691),d,v,n[u+10],9,38016083),l,d,n[u+15],14,-660478335),C,l,n[u+4],20,-405537848),v=o(v,C=o(C,l=o(l,d,v,C,n[u+9],5,568446438),d,v,n[u+14],9,-1019803690),l,d,n[u+3],14,-187363961),C,l,n[u+8],20,1163531501),v=o(v,C=o(C,l=o(l,d,v,C,n[u+13],5,-1444681467),d,v,n[u+2],9,-51403784),l,d,n[u+7],14,1735328473),C,l,n[u+12],20,-1926607734),v=c(v,C=c(C,l=c(l,d,v,C,n[u+5],4,-378558),d,v,n[u+8],11,-2022574463),l,d,n[u+11],16,1839030562),C,l,n[u+14],23,-35309556),v=c(v,C=c(C,l=c(l,d,v,C,n[u+1],4,-1530992060),d,v,n[u+4],11,1272893353),l,d,n[u+7],16,-155497632),C,l,n[u+10],23,-1094730640),v=c(v,C=c(C,l=c(l,d,v,C,n[u+13],4,681279174),d,v,n[u],11,-358537222),l,d,n[u+3],16,-722521979),C,l,n[u+6],23,76029189),v=c(v,C=c(C,l=c(l,d,v,C,n[u+9],4,-640364487),d,v,n[u+12],11,-421815835),l,d,n[u+15],16,530742520),C,l,n[u+2],23,-995338651),v=f(v,C=f(C,l=f(l,d,v,C,n[u],6,-198630844),d,v,n[u+7],10,1126891415),l,d,n[u+14],15,-1416354905),C,l,n[u+5],21,-57434055),v=f(v,C=f(C,l=f(l,d,v,C,n[u+12],6,1700485571),d,v,n[u+3],10,-1894986606),l,d,n[u+10],15,-1051523),C,l,n[u+1],21,-2054922799),v=f(v,C=f(C,l=f(l,d,v,C,n[u+8],6,1873313359),d,v,n[u+15],10,-30611744),l,d,n[u+6],15,-1560198380),C,l,n[u+13],21,1309151649),v=f(v,C=f(C,l=f(l,d,v,C,n[u+4],6,-145523070),d,v,n[u+11],10,-1120210379),l,d,n[u+2],15,718787259),C,l,n[u+9],21,-343485551),l=r(l,i),d=r(d,a),v=r(v,h),C=r(C,g);return[l,d,v,C]}function a(n){var r,t="",u=32*n.length;for(r=0;r<u;r+=8)t+=String.fromCharCode(n[r>>5]>>>r%32&255);return t}function h(n){var r,t=[];for(t[(n.length>>2)-1]=void 0,r=0;r<t.length;r+=1)t[r]=0;var u=8*n.length;for(r=0;r<u;r+=8)t[r>>5]|=(255&n.charCodeAt(r/8))<<r%32;return t}function g(n){return a(i(h(n),8*n.length))}function l(n,r){var t,u,e=h(n),o=[],c=[];for(o[15]=c[15]=void 0,e.length>16&&(e=i(e,8*n.length)),t=0;t<16;t+=1)o[t]=909522486^e[t],c[t]=1549556828^e[t];return u=i(o.concat(h(r)),512+8*r.length),a(i(c.concat(u),640))}function d(n){var r,t,u="";for(t=0;t<n.length;t+=1)r=n.charCodeAt(t),u+="0123456789abcdef".charAt(r>>>4&15)+"0123456789abcdef".charAt(15&r);return u}function v(n){return unescape(encodeURIComponent(n))}function C(n){return g(v(n))}function A(n){return d(C(n))}function m(n,r){return l(v(n),v(r))}function s(n,r){return d(m(n,r))}function b(n,r,t){return r?t?m(r,n):s(r,n):t?C(n):A(n)}$.md5=b}();

$.appId = 'dafbe42d5bff9d82298e5230eb8c3f79';
$.appMD5Key = '34e1e81ae8122ca039ec5738d33b4eee';

const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let timestamp = Date.now();
let cookiesArr = [],
  cookie = '',
  message;

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
//低于4600分PK列表
let txt = [
  '5bcdf85fec891a77d81149feb9a22b89',
  'd36ff2037c6ae1965dc003d71cf975f90f296a206a12473f57d63d95f3be0534',
  '25fa347d005cbf2863f59ebd12b62f7b0f296a206a12473f57d63d95f3be0534',
  '5bcdf85fec891a77d81149feb9a22b89',
  '193fb6902c8e012cd485f0299cc3430d',
  '8c21e09fb7aa09ffc2a7bc63731ffa210f296a206a12473f57d63d95f3be0534',
  '8a34e76abe5306028e52e9519361178d',
  '81dc09b2f3564679d6b0af63acf42d77',
  '34643d40ec720147e946355720e6162d',
  '2b7610ccd85cdfc0f656b2a301bd4e60',
  'c19a22c622fffb444e28c7a1148120b1',
  'e5644262f36bd503cc2c824b001f9eef0f296a206a12473f57d63d95f3be0534',
  '47b5c287bbd5cea4af8ae959eea944560f296a206a12473f57d63d95f3be0534',
  'ea6948d64610ea981079f13120e67e0b0f296a206a12473f57d63d95f3be0534',
  '49dc2496020d6e7945361f3e6410fccf',
  '8397dd56a9a156385cff286c3681a7780f296a206a12473f57d63d95f3be0534',
  '305475d87abdfb239870481c218a82330f296a206a12473f57d63d95f3be0534',
  'f77dac65b29fc25a57235b7a03fdfaeb0f296a206a12473f57d63d95f3be0534',
  '4040a23fff12469222c112105fe2c50e',
  'a5f97b4d1c639c99e6ab06e0a7acc7c30f296a206a12473f57d63d95f3be0534',
  '1f0832f2e1a13a059a89fa50ba6699df',
  '57aebb8471def9f9ad50520c084f4fa3',
  '23a8bcf382c98d358c086597ad021c5e',
  '7af57a52140658ebfe89ddf90378e28e0f296a206a12473f57d63d95f3be0534',
  '5ceb92c5c4543df4d3f5243ebe30beea',
  'a508bdf05e5fdbe891582b0ceb9014040f296a206a12473f57d63d95f3be0534',
  '286432f838990a92c25c3b0557814438',
  '50f58c95307043a44342b7ac09c866ae',
  '5c47f8905ace95d0bfac8297a63a3eec',
  'f7270ddbb3eda8997a2b202d57bb699a',
  'b120c49f1d114ad97e2587fa742a28bc',
  '8943c98340a7b3e420a41a295cca7dac',
  '3a599ff3ce6d21575b570fd412536aeb0f296a206a12473f57d63d95f3be0534',
  '2baff350c4de54b8a3ab3aea8115f2dc',
  '5d086cf9cb49534e0c4fa3bbc19129b9',
  'aef007650ba4e8a35b56e88ab006fc160f296a206a12473f57d63d95f3be0534',
  '1d6c9c6ef8803b57b939fe23de6013010f296a206a12473f57d63d95f3be0534',
  '4c37a06168fb440e39ec7af52c7597c00f296a206a12473f57d63d95f3be0534',
  'd2ecb30d4856dd102eae63cb6ce91a040f296a206a12473f57d63d95f3be0534',
  'f7b0df1b5d7757578c380f6760cd348e',
  '852e7a5e3928765388c123a778208990',
];

const JD_API_HOST = 'https://api.m.jd.com/client.action';
$.helpAuthor = true;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      message = '';
      console.log(`\n******开始【京东账号${$.index}】${$.UserName}*********\n`);
      $.canPk = true;
      $.pin = '';
      $.lkToken = '';
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

function showMsg() {
  return new Promise((resolve) => {
    $.log($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    resolve();
  });
}

async function main() {
  await getToken();
  console.log('当前token：' + $.token);
  if ($.token) {
    await getPin();
    if ($.pin) {
      console.log('当前pin（pk码）：' + $.pin);
    }
    await checkRisk();

    let myScore = await getScore($.pin);
    console.log('我的京享值:' + myScore);
    $.pinList = txt;

    let winCnt = 0;
    if ($.pinList.length > 0) {
      console.log('待pk的pin list:\n' + $.pinList);
      for (let i = 0; i < $.pinList.length; i++) {
        let pin = $.pinList[i];

        //bierenpin = $.pinList[Math.round(Math.random()*5)];
        //console.log('别人的的pin：' + pin);
        let fscore = await getScore(pin);

        console.log('别人的京享值:' + fscore);

        if (fscore < myScore) {
          await sendpk(pin);
          await launchBattleNew(pin);
          await recvpk(pin);
          console.log('======================');

          //await randomStr(pin)
          //await jdShareBattleLaunch(pin)
          if (!$.canPk) {
            break;
          }
          winCnt++;
          // if (winCnt >= 30) {
          //     break;
          // }
        }
        await $.wait(1000);
      }
    }
    $.pinList1 = await getFriendPinList();

    if ($.pinList1.length > 0) {
      console.log('待pk的pin list:\n' + $.pinList1);
      for (let i = 0; i < $.pinList1.length; i++) {
        let pin1 = $.pinList1[i];

        //bierenpin = $.pinList[Math.round(Math.random()*5)];
        //console.log('别人的的pin：' + pin);
        let fscore1 = await getScore(pin1);

        console.log('别人的京享值:' + fscore1);

        if (fscore1 < myScore) {
          await sendpk(pin1);
          await launchBattleNew(pin1);
          await recvpk(pin1);
          console.log('======================');

          //await randomStr(pin)
          //await jdShareBattleLaunch(pin)
          if (!$.canPk) {
            break;
          }
          winCnt++;
          // if (winCnt >= 30) {
          //     break;
          // }
        }
        await $.wait(1000);
      }
    }

    if (winCnt > 0) {
      await getBoxRewardInfo();
    }
    console.log('去开宝箱 检测朋友和胜场达标才能自动开');
    if ($.awards) {
      for (let index = 0; index < $.awards.length; index++) {
        let item = $.awards[index];
        if (item.received == 0) {
          if ($.totalWins >= item.wins && $.friendFrames >= item.friendFrames) {
            await sendBoxReward(item.id);
          }
        }
      }
      // }
    }
  }
}
function sendpk(fpin) {
  console.log(`SendPk: ${fpin}`);
  return new Promise((resolve) => {
    let body = {
      actId: 9,
      recipient: fpin,
      relation: 2,
    };
    let bodyStr = JSON.stringify(body);
    let timestamp = Date.now();
    let sign = pkSign(bodyStr, timestamp);
    let options = {
      url: `https://pengyougou.m.jd.com/open/api/like/jxz/launchBattle?appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=${$.pin}&lkToken=${$.lkToken}&sign=${sign}&t=${timestamp}`,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
      body: bodyStr,
    };

    $.post(options, (err, resp, data) => {
      //console.log(options)
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            console.log(data);
            data = JSON.parse(data);
            let bizData = data.data;
            if (bizData.state === 3 && bizData.msg === '今日次数已耗尽') {
              $.canPk = false; // pk次数耗尽
            }
          } else {
            $.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e);
      } finally {
        resolve();
      }
    });
  });
}
function recvpk(fpin) {
  console.log(`接收挑战: ${fpin}`);
  return new Promise((resolve) => {
    let body = {
      actId: 9,
      sponsor: fpin,
    };
    let bodyStr = JSON.stringify(body);
    let timestamp = Date.now();
    let sign = pkSign(bodyStr, timestamp);
    let options = {
      url: `https://pengyougou.m.jd.com/open/api/like/jxz/receiveBattle?appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=${$.pin}&lkToken=${$.lkToken}&sign=${sign}&t=${timestamp}`,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
      body: bodyStr,
    };

    $.post(options, (err, resp, data) => {
      //console.log(options)
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            console.log(data);
            data = JSON.parse(data);
            let bizData = data.data;
            if (bizData.msg === '今日次数已耗尽') {
              $.canPk = false; // pk次数耗尽
            }
          } else {
            $.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e);
      } finally {
        resolve();
      }
    });
  });
}
function checkRisk() {
  console.log('检查风险');
  return new Promise((resolve) => {
    let options = {
      url: `https://pengyougou.m.jd.com/like/jxz/checkRisk?actId=9&appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=${$.pin}`,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
    };

    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            console.log(data);
          } else {
            $.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e);
      } finally {
        resolve();
      }
    });
  });
}

async function getFriendPinList() {
  console.log('获取好友Pk列表');
  let allFriends = [];
  for (let i = 0; i < 25; i++) {
    let friends = await getUserFriendsPage(i + 1);
    if (friends.length === 0) {
      break;
    }
    for (let j = 0; j < friends.length; j++) {
      let item = friends[j];
      // 可以接受pk, 并且未pk的好友
      if (item.leftAcceptPkNum > 0 && item.pkStatus !== 4) {
        allFriends.push(item.friendPin);
        console.log(allFriends);
      }
    }
  }
  return allFriends;
}

function getUserFriendsPage(pageNo = 1, pageSize = 10) {
  console.log(`获取好友分页列表 pageNo: ${pageNo}, pageSize: ${pageSize}`);
  return new Promise((resolve) => {
    let options = {
      url: `https://pengyougou.m.jd.com/like/jxz/getUserFriendsPage?actId=9&appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=${$.pin}&pageNo=${pageNo}&pageSize=${pageSize}`,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
    };
    let result = [];
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            data = JSON.parse(data);
            result = data.datas;
          } else {
            $.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e);
      } finally {
        resolve(result);
      }
    });
  });
}

function launchBattleNew(fpin) {
  console.log(`发起挑战: ${fpin}`);
  return new Promise((resolve) => {
    let body = {
      actId: 9,
      recipient: fpin,
      relation: 2,
    };
    let bodyStr = JSON.stringify(body);
    let timestamp = Date.now();
    let sign = pkSign(bodyStr, timestamp);
    let options = {
      url: `https://pengyougou.m.jd.com/open/api/like/jxz/launchBattle?appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=${$.pin}&lkToken=${$.lkToken}&sign=${sign}&t=${timestamp}`,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
      body: bodyStr,
    };

    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err);
        } else {
          if (data) {
            console.log(data);
            data = JSON.parse(data);
            let bizData = data.data;
            if (bizData.state === 3 && bizData.msg === '今日次数已耗尽') {
              $.canPk = false; // pk次数耗尽
            }
          } else {
            $.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e);
      } finally {
        resolve();
      }
    });
  });
}

function pkSign(body, timestamp) {
  // timestamp = 1623470148350; // sign=a45cb6667750320e9f5c53102817654d
  let str = `${$.appId}_${$.appMD5Key}_${body}_${timestamp}`;
  return $.md5(str);
}
function shareSign(body) {
  // timestamp = 1623470148350; // sign=a45cb6667750320e9f5c53102817654d
  let str = `${$.appId}_${$.appMD5Key}_{"actId":9,"randomStr":"${body}","relation":2}_${timestamp}`;
  return $.md5(str);
}
function getshareSign() {
  // dafbe42d5bff9d82298e5230eb8c3f79_34e1e81ae8122ca039ec5738d33b4eee__1625308560254
  //https://pengyougou.m.jd.com/open/api/like/jxz/jdShareRandom?actId=9&lkToken=4b670e7bff7c43948c4856712a97c8fa&appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=d65bfc2689d565a93584ce2cdf9f754e0f296a206a12473f57d63d95f3be0534&sign=3e452d9a49c10d874f074325801251c2&t=1625308456790
  let str = `${$.appId}_${$.appMD5Key}__${timestamp}`;
  return $.md5(str);
}
function getScore(fpin) {
  console.log('查询' + fpin + '分数');
  return new Promise((resolve) => {
    let options = {
      url: 'https://pengyougou.m.jd.com/like/jxz/getScore?actId=9&appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=' + fpin,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
    };

    $.get(options, (err, resp, res) => {
      let score = 0;
      try {
        if (res) {
          let data = JSON.parse(res);
          if (data) {
            score = data.data;
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(score);
      }
    });
  });
}
function randomStr(a) {
  console.log('查询randomStr');

  randdomsign = getshareSign();
  return new Promise((resolve) => {
    let options = {
      //https://pengyougou.m.jd.com/open/api/like/jxz/jdShareRandom?actId=9&lkToken=4b670e7bff7c43948c4856712a97c8fa&appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=d65bfc2689d565a93584ce2cdf9f754e0f296a206a12473f57d63d95f3be0534&sign=3e452d9a49c10d874f074325801251c2&t=1625308456790
      url: `https://pengyougou.m.jd.com/open/api/like/jxz/jdShareRandom?actId=9&lkToken=${a}&appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=${$.pin}&sign=${randdomsign}&t=${timestamp}`,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
    };

    $.get(options, (err, resp, res) => {
      try {
        console.log(options);
        if (res) {
          console.log(res);
          let data = JSON.parse(res);
          if (data) {
            console.log(data.data);
            therandom = shareSign(data.data);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(therandom);
      }
    });
  });
}
function getBoxRewardInfo() {
  return new Promise((resolve) => {
    let options = {
      url: 'https://pengyougou.m.jd.com/like/jxz/getBoxRewardInfo?actId=9&appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=' + $.pin,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
    };

    $.get(options, (err, resp, res) => {
      try {
        //console.log(res);
        if (res) {
          let data = JSON.parse(res);
          if (data.success) {
            $.awards = data.data.awards;
            $.totalWins = data.data.totalWins;
            $.friendFrames = data.data.totalFriends;
            console.log('总胜场:' + data.data.totalWins);
            console.log('好朋友:' + data.data.totalFriends);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(res);
      }
    });
  });
}

function sendBoxReward(rewardConfigId) {
  return new Promise((resolve) => {
    let options = {
      url: 'https://pengyougou.m.jd.com/like/jxz/sendBoxReward?rewardConfigId=' + rewardConfigId + '&actId=9&appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=' + $.pin,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
    };

    $.get(options, (err, resp, res) => {
      try {
        console.log(res);
        if (res) {
          let data = JSON.parse(res);
          if (data.success) {
            $.openAwards = data.datas;
            if ($.openAwards) {
              $.openAwards.forEach((item) => {
                console.log('获得奖励:' + JSON.stringify(item));
              });
            }
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(res);
      }
    });
  });
}

function getPin() {
  return new Promise((resolve) => {
    let options = {
      url: 'https://jdjoy.jd.com/saas/framework/encrypt/pin?appId=dafbe42d5bff9d82298e5230eb8c3f79',
      headers: {
        Host: 'jdjoy.jd.com',
        Origin: 'https://prodev.m.jd.com',
        Cookie: cookie,
        Connection: 'keep-alive',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Language': 'zh-cn',
        Referer:
          'https://prodev.m.jd.com/mall/active/4HTqMAvser7ctEBEdhK4yA7fXpPi/index.html?babelChannel=ttt9&tttparams=AeOIMwdeyJnTG5nIjoiMTE3LjAyOTE1NyIsImdMYXQiOiIyNS4wOTUyMDcifQ7%3D%3D&lng=00.000000&lat=00.000000&sid=&un_area=',
      },
    };

    $.post(options, (err, resp, res) => {
      try {
        console.log(res);
        if (res) {
          let data = JSON.parse(res);
          if (data) {
            // $.pin = data.data;
            $.pin = data.data.lkEPin;
            $.lkToken = data.data.lkToken;
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(res);
      }
    });
  });
}
function jdShareBattleLaunch(a) {
  return new Promise((resolve) => {
    //lkEPin=${$.pin}&lkToken=${$.lkToken}&sign=${sign}&t=${timestamp}
    ShareBattlesign = shareSign(a);
    let options = {
      url: `https://pengyougou.m.jd.com/open/api/like/jxz/jdShareBattleLaunch?appId=dafbe42d5bff9d82298e5230eb8c3f79&lkEPin=${$.pin}&lkToken=${$.lkToken}&sign=${ShareBattlesign}&t=${timestamp}`,
      body: `{"actId":9,"randomStr":"${a}","relation":2}`,
      headers: {
        Referer:
          'https://game-cdn.moxigame.cn/ClickEliminate/IntegralPK_jd/thirdapp/index.html?&token=AAFgwYjmADD1CrUNjDlWrIKSUE5xguJH3wmor9ZeStzbDq5cXG2Me0PSQgXJvT5bAgJv_DErW1E&returnurl=https%3A%2F%2Fprodev.m.jd.com%2Fmall%2Factive%2F45njQg88Vym1s2EGp9aV6cPvqecw%2Findex.html%3Ftttparams%3DImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%253D%253D%26babelChannel%3Dttt1%26qdsource%3Dapp%26lng%3D114.362856%26lat%3D30.577543%26sid%3Dab2735c8cec04b1db8d32b4f406fef7w%26un_area%3D17_1381_50717_52133%23%2Findex&tttparams=ImfQnGideyJnTG5nIjoiMTE0LjM3OTc2NiIsImdMYXQiOiIzMC42MDE0NzEifQ8%3D%3D&babelChannel=ttt1&lng=114.362856&lat=30.577543&sid=ab2735c8cec04b1db8d32b4f406fef7w&un_area=17_1381_50717_52133&friendPin=109912ce317991bcdcca46aae737b4f2',
        Host: 'pengyougou.m.jd.com',
        'Content-Type': 'application/json',
        Origin: 'https://game-cdn.moxigame.cn',
        Connection: 'keep-alive',
        Accept: ' */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Encoding': 'gzip,deflate,br',
        'Accept-Language': 'zh-cn',
      },
    };

    $.post(options, (err, resp, res) => {
      try {
        console.log(options);
        if (res) {
          let data = JSON.parse(res);
          if (data) {
            console.log(data);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(res);
      }
    });
  });
}
function getToken() {
  return new Promise((resolve) => {
    let options = {
      url: 'https://jdjoy.jd.com/saas/framework/user/token?appId=dafbe42d5bff9d82298e5230eb8c3f79&client=m&url=pengyougou.m.jd.com',
      headers: {
        Host: 'jdjoy.jd.com',
        Origin: 'https://prodev.m.jd.com',
        Cookie: cookie,
        Connection: 'keep-alive',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': $.isNode()
          ? process.env.JD_USER_AGENT
            ? process.env.JD_USER_AGENT
            : require('./USER_AGENTS').USER_AGENT
          : $.getdata('JDUA')
          ? $.getdata('JDUA')
          : 'jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0',
        'Accept-Language': 'zh-cn',
        Referer:
          'https://prodev.m.jd.com/mall/active/4HTqMAvser7ctEBEdhK4yA7fXpPi/index.html?babelChannel=ttt9&tttparams=AeOIMwdeyJnTG5nIjoiMTE3LjAyOTE1NyIsImdMYXQiOiIyNS4wOTUyMDcifQ7%3D%3D&lng=00.000000&lat=00.000000&sid=&un_area=',
      },
    };
    $.post(options, (err, resp, res) => {
      try {
        if (res) {
          let data = JSON.parse(res);
          if (data) {
            $.token = data.data;
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(res);
      }
    });
  });
}

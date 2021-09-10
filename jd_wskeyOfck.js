/*
wskey自动更新ck
@author LingFeng0918
=================================Quantumultx=========================
 */
var request = require('request');
var querystring = require('querystring');
//开启记录cookie,重定向时自动带上cookie
request = request.defaults({ jar: true });
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('wskey获取ck');
const jdWskeyNode = $.isNode() ? require('./jdWskey.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let optionsA = '';
let wskeysArr = [''];
if ($.isNode()) {
  Object.keys(jdWskeyNode).forEach((item) => {
    wskeysArr.push(jdWskeyNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  wskeysArr = [$.getdata('WskeyJD'), $.getdata('WskeyJD2'), ...jd_helpers.jsonParse($.getdata('WskeyJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!wskeysArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一wskey\n 抓包获取');
    return;
  }
  for (let i = 0; i < wskeysArr.length; i++) {
    $.index = i + 1;
    $.pt_key = '';
    $.tokenKey = '';
    $.wskey = wskeysArr[i];
    $.pt_pin = decodeURIComponent($.wskey.match(/pin=([^; ]+)(?=;?)/) && $.wskey.match(/pin=([^; ]+)(?=;?)/)[1]);
    await wskey_to_pt_key();
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function wskey_to_pt_key() {
  await getToken();
  if ($.tokenKey) {
    await appjmp();
  }
}

function getToken() {
  let config = {
    url: 'https://api.m.jd.com/client.action?functionId=genToken&clientVersion=10.1.2&build=89743&client=android&d_brand=&d_model=&osVersion=&screen=&partner=&oaid=&openudid=a27b83d3d1dba1cc&eid=&sdkVersion=30&lang=zh_CN&uuid=a27b83d3d1dba1cc&aid=a27b83d3d1dba1cc&area=19_1601_36953_50397&networkType=wifi&wifiBssid=&uts=&uemps=0-2&harmonyOs=0&st=1630413012009&sign=ca712dabc123eadd584ce93f63e00207&sv=121',
    body: 'body=%7B%22to%22%3A%22https%253a%252f%252fplogin.m.jd.com%252fjd-mlogin%252fstatic%252fhtml%252fappjmp_blank.html%22%7D&',
    headers: {
      Host: 'api.m.jd.com',
      'user-agent': 'okhttp/3.12.1;jdmall;android;version/10.1.2;build/89743;screen/1080x2293;os/11;network/wifi;',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      cookie: $.wskey,
    },
  };
  return new Promise((resolve) => {
    $.post(config, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试1`);
        } else {
          data = JSON.parse(data);
          if (data && data.code !== '0') {
            console.log(`获取token失败`, data);
            return;
          }
          $.tokenKey = data.tokenKey;

          console.log(`$.tokenKey`, $.tokenKey);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function appjmp() {
  const options = {
    url: `https://un.m.jd.com/cgi-bin/app/appjmp?tokenKey=${$.tokenKey}&to=https%3A%2F%2Fplogin.m.jd.com%2Fcgi-bin%2Fm%2Fthirdapp_auth_page%3Ftoken%3DAAEAIEijIw6wxF2s3bNKF0bmGsI8xfw6hkQT6Ui2QVP7z1Xg%26client_type%3Dandroid%26appid%3D879%26appup_type%3D1'.format(${$.tokenKey})`,
    followRedirect: false,
    verify: false,
    allow_redirects: false,
    headers: {
      'User-Agent':
        'jdapp;android;10.1.2;11;0393465333165363-5333430323261366;network/wifi;model/M2102K1C;addressid/938507929;aid/09d53a5653402b1f;oaid/2acbcab5bb3f0e68;osVer/30;appBuild/89743;partner/lc023;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 11; M2102K1C Build/RKQ1.201112.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045714 Mobile Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
      referer: 'plogin.m.jd.com',
    },
  };
  var req = request(options, function (err, resp, data) {
    ckA = resp.headers['set-cookie'];
    var pt_key = '';
    var pt_pin = '';
    for (var i = 0; i < ckA.length; i++) {
      if (ckA[i].indexOf('pt_key') != -1) {
        pt_key = ckA[i];
      }
      if (ckA[i].indexOf('pt_pin') != -1) {
        pt_pin = ckA[i];
      }
    }
    pt_key = pt_key.split(';')[0];
    pt_pin = pt_pin.split(';')[0];
    ck = pt_key + ';' + pt_pin + ';';
    console.log(ck);
    req.end();
  });
}

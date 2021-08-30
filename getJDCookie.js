/**
 * 扫码获取京东cookie，此方式得到的cookie有效期为30天
 * Modify from FanchangWang https://github.com/FanchangWang
 */

const jd_env = require("./utils/JDEnv.js");
const $ = jd_env.env("扫码获取京东cookie");
const qrcode = require("qrcode-terminal");
const JD_UA = `Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5 UCBrowser/13.4.2.1122`;
let s_token, cookies, guid, lsid, lstoken, okl_token, token;
!(async () => {
  try {
    await loginEntrance();
    await generateQrcode();
    await getCookie();
  } catch (e) {
    $.logErr(e);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    // $.done();
  });

function loginEntrance() {
  return new Promise((resolve) => {
    $.get(taskUrl(), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          $.headers = resp.headers;
          $.data = JSON.parse(data);
          await formatSetCookies($.headers, $.data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function generateQrcode() {
  return new Promise((resolve) => {
    $.post(taskPostUrl(), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          $.stepsHeaders = resp.headers;
          data = JSON.parse(data);
          token = data['token'];
          // $.log('token', token)

          const setCookie = resp.headers['set-cookie'][0];
          okl_token = setCookie.substring(setCookie.indexOf('=') + 1, setCookie.indexOf(';'));
          const url = 'https://plogin.m.jd.com/cgi-bin/m/tmauth?appid=300&client_type=m&token=' + token;
          qrcode.generate(url, { small: true }); // 输出二维码
          console.log('请打开 京东APP 扫码登录(二维码有效期为3分钟)');
          console.error(`注：如上图二维码扫描不到，请使用工具(例如在线二维码工具：https://cli.im)手动生成下面链接的二维码\n\n${url}\n\n`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function checkLogin() {
  return new Promise((resolve) => {
    const options = {
      url: `https://plogin.m.jd.com/cgi-bin/m/tmauthchecktoken?&token=${token}&ou_state=0&okl_token=${okl_token}`,
      body: `lang=chs&appid=300&source=wq_passport&returnurl=https://wqlogin2.jd.com/passport/LoginRedirect?state=${Date.now()}&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action`,
      timeout: 10 * 1000,
      headers: {
        Referer: `https://plogin.m.jd.com/login/login?appid=300&returnurl=https://wqlogin2.jd.com/passport/LoginRedirect?state=${Date.now()}&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport`,
        Cookie: cookies,
        Connection: 'Keep-Alive',
        'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': JD_UA,
      },
    };
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          $.checkLoginHeaders = resp.headers;
          // $.log(`errcode:${data['errcode']}`)
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function getCookie() {
  $.timer = setInterval(async () => {
    try {
      const checkRes = await checkLogin();
      if (checkRes['errcode'] === 0) {
        //扫描登录成功
        $.log(`扫描登录成功\n`);
        clearInterval($.timer);
        await formatCookie($.checkLoginHeaders);
        $.done();
      } else if (checkRes['errcode'] === 21) {
        $.log(`二维码已失效，请重新获取二维码重新扫描\n`);
        clearInterval($.timer);
        $.done();
      } else if (checkRes['errcode'] === 176) {
        //未扫描登录
      } else {
        $.log(`扫描登录失败:其他未知状态异常：${JSON.stringify(checkRes)}\n`);
        clearInterval($.timer);
        $.done();
      }
    } catch (e) {
      $.logErr(e);
    }
  }, 1000);
}

function formatCookie(headers) {
  new Promise((resolve) => {
    let pt_key = headers['set-cookie'][1];
    pt_key = pt_key.substring(pt_key.indexOf('=') + 1, pt_key.indexOf(';'));
    let pt_pin = headers['set-cookie'][2];
    pt_pin = pt_pin.substring(pt_pin.indexOf('=') + 1, pt_pin.indexOf(';'));
    const cookie1 = 'pt_key=' + pt_key + ';pt_pin=' + pt_pin + ';';

    $.UserName = decodeURIComponent(cookie1.match(/pt_pin=([^; ]+)(?=;?)/) && cookie1.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
    $.log(`京东用户：${$.UserName} Cookie获取成功，cookie如下：`);
    $.log(`\n${cookie1}\n`);
    resolve();
  });
}

function formatSetCookies(headers, body) {
  new Promise((resolve) => {
    s_token = body['s_token'];
    guid = headers['set-cookie'][0];
    guid = guid.substring(guid.indexOf('=') + 1, guid.indexOf(';'));
    lsid = headers['set-cookie'][2];
    lsid = lsid.substring(lsid.indexOf('=') + 1, lsid.indexOf(';'));
    lstoken = headers['set-cookie'][3];
    lstoken = lstoken.substring(lstoken.indexOf('=') + 1, lstoken.indexOf(';'));
    cookies = 'guid=' + guid + '; lang=chs; lsid=' + lsid + '; lstoken=' + lstoken + '; ';
    resolve();
  });
}

function taskUrl() {
  return {
    url: `https://plogin.m.jd.com/cgi-bin/mm/new_login_entrance?lang=chs&appid=300&returnurl=https://wq.jd.com/passport/LoginRedirect?state=${Date.now()}&returnurl=https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport`,
    timeout: 10 * 1000,
    headers: {
      Connection: 'Keep-Alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'zh-cn',
      Referer: `https://plogin.m.jd.com/login/login?appid=300&returnurl=https://wq.jd.com/passport/LoginRedirect?state=${Date.now()}&returnurl=https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport`,
      'User-Agent': JD_UA,
      Host: 'plogin.m.jd.com',
    },
  };
}

function taskPostUrl() {
  return {
    url: `https://plogin.m.jd.com/cgi-bin/m/tmauthreflogurl?s_token=${s_token}&v=${Date.now()}&remember=true`,
    body: `lang=chs&appid=300&source=wq_passport&returnurl=https://wqlogin2.jd.com/passport/LoginRedirect?state=${Date.now()}&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action`,
    timeout: 10 * 1000,
    headers: {
      Connection: 'Keep-Alive',
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'zh-cn',
      Referer: `https://plogin.m.jd.com/login/login?appid=300&returnurl=https://wq.jd.com/passport/LoginRedirect?state=${Date.now()}&returnurl=https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport`,
      'User-Agent': JD_UA,
      Host: 'plogin.m.jd.com',
    },
  };
}
function randomWord(randomFlag, min, max) {
  var str = '',
    range = min,
    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  // 随机产生
  if (randomFlag) {
    range = Math.round(Math.random() * (max - min)) + min;
  }
  for (var i = 0; i < range; i++) {
    pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
}

/**
 * 生成随机 iPhoneID
 * @returns {string}
 */
function randPhoneId() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

#!/bin/sh

if [[ -f /usr/bin/jd_bot && -z "$DISABLE_SPNODE" ]]; then
  CMD="spnode"
else
  CMD="node"
fi

echo "处理jd_crazy_joy_coin任务。。。"
if [ ! $CRZAY_JOY_COIN_ENABLE ]; then
   echo "默认启用jd_crazy_joy_coin杀掉jd_crazy_joy_coin任务，并重启"
   eval $(ps -ef | grep "jd_crazy_joy_coin" | grep -v "grep" | awk '{print "kill "$1}')
   echo '' >/scripts/logs/jd_crazy_joy_coin.log
   $CMD /scripts/jd_crazy_joy_coin.js | ts >>/scripts/logs/jd_crazy_joy_coin.log 2>&1 &
   echo "默认jd_crazy_joy_coin重启完成"
else
   if [ $CRZAY_JOY_COIN_ENABLE = "Y" ]; then
      echo "配置启用jd_crazy_joy_coin，杀掉jd_crazy_joy_coin任务，并重启"
      eval $(ps -ef | grep "jd_crazy_joy_coin" | grep -v "grep" | awk '{print "kill "$1}')
      echo '' >/scripts/logs/jd_crazy_joy_coin.log
      $CMD /scripts/jd_crazy_joy_coin.js | ts >>/scripts/logs/jd_crazy_joy_coin.log 2>&1 &
      echo "配置jd_crazy_joy_coin重启完成"
   else
      eval $(ps -ef | grep "jd_crazy_joy_coin" | grep -v "grep" | awk '{print "kill "$1}')
      echo "已配置不启用jd_crazy_joy_coin任务，仅杀掉"
   fi
fi

echo "处理jd_cfd_loop任务。。。"
if [ ! $JD_CFD_LOOP_ENABLE ]; then
   echo "默认启用jd_cfd_loop杀掉jd_cfd_loop任务，并重启"
   eval $(ps -ef | grep "jd_cfd_loop" | grep -v "grep" | awk '{print "kill "$1}')
   echo '' >/scripts/logs/jd_cfd_loop.log
   $CMD /scripts/jd_cfd_loop.js | ts >>/scripts/logs/jd_cfd_loop.log 2>&1 &
   echo "默认jd_cfd_loop重启完成"
else
   if [ $JD_CFD_LOOP_ENABLE = "Y" ]; then
      echo "配置启用jd_cfd_loop，杀掉jd_cfd_loop任务，并重启"
      eval $(ps -ef | grep "jd_cfd_loop" | grep -v "grep" | awk '{print "kill "$1}')
      echo '' >/scripts/logs/jd_cfd_loop.log
      $CMD /scripts/jd_cfd_loop.js | ts >>/scripts/logs/jd_cfd_loop.log 2>&1 &
      echo "配置jd_cfd_loop重启完成"
   else
      eval $(ps -ef | grep "jd_cfd_loop" | grep -v "grep" | awk '{print "kill "$1}')
      echo "已配置不启用jd_cfd_loop任务，仅杀掉"
   fi
fi

echo "处理jd_big_winner_cash任务。。。"
if [ ! $JD_BIG_WINNER_CASH_ENABLE ]; then
   echo "默认启用jd_big_winner_cash杀掉jd_big_winner_cash任务，并重启"
   eval $(ps -ef | grep "jd_big_winner_cash" | grep -v "grep" | awk '{print "kill "$1}')
   echo '' >/scripts/logs/jd_big_winner_cash.log
   python3 /scripts/jd_big_winner_cash.py | ts >>/scripts/logs/jd_big_winner_cash.log 2>&1 &
   echo "默认jd_big_winner_cash重启完成"
else
   if [ $JD_BIG_WINNER_CASH_ENABLE = "Y" ]; then
      echo "配置启用jd_big_winner_cash，杀掉jd_big_winner_cash任务，并重启"
      eval $(ps -ef | grep "jd_big_winner_cash" | grep -v "grep" | awk '{print "kill "$1}')
      echo '' >/scripts/logs/jd_big_winner_cash.log
      python3 /scripts/jd_big_winner_cash.py | ts >>/scripts/logs/jd_big_winner_cash.log 2>&1 &
      echo "配置jd_big_winner_cash重启完成"
   else
      eval $(ps -ef | grep "jd_big_winner_cash" | grep -v "grep" | awk '{print "kill "$1}')
      echo "已配置不启用jd_big_winner_cash任务，仅杀掉"
   fi
fi

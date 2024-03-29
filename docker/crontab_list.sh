# 每3天的23:50分清理一次日志(互助码不清理，proc_file.sh对该文件进行了去重)
50 23 */3 * * find /scripts/logs -name '*.log' | grep -v 'sharecodeCollection' | xargs rm -rf
# 收集助力码
30 * * * * sh +x /scripts/docker/auto_help.sh collect >> /scripts/logs/auto_help_collect.log 2>&1
# 上传助力码到JDHelloWord
40 0 * * * cd /scripts/utils && node JDUploadShareCode.js 2>&1
# 更新joy invokekey 
0 */6 * * * cd /scripts/utils && node JDJoyGetInvokeKey.js >> /scripts/logs/JDJoyGetInvokeKey.log 2>&1

##############短期活动##############
# 女装盲盒 活动时间：2021-05-24到2021-06-22
35 1,22 * * * node /scripts/jd_nzmh.js >> /scripts/logs/jd_nzmh.log 2>&1
# 美食馆-右侧悬浮
31 0,13 26-31,1-16 5,6 * node /scripts/jd_tanwei.js >> /scripts/logs/jd_tanwei.log 2>&1

# 京东极速版红包(活动时间：2021-5-5至2021-5-31)
45 0,23 * * * node /scripts/jd_speed_redpocke.js >> /scripts/logs/jd_speed_redpocke.log 2>&1

# 超级直播间红包雨(活动时间不定期，出现异常提示请忽略。红包雨期间会正常)
1,31 0-23/1 * * * node /scripts/jd_live_redrain.js >> /scripts/logs/jd_live_redrain.log 2>&1

# 每日抽奖(活动时间：2021-05-01至2021-05-31)
13 1,22,23 * * * node /scripts/jd_daily_lottery.js >> /scripts/logs/jd_daily_lottery.log 2>&1
# 金榜创造营 活动时间：2021-05-21至2021-12-31
13 1,22 * * * node /scripts/jd_gold_creator.js >> /scripts/logs/jd_gold_creator.log 2>&1
# 5G超级盲盒
0 0,1-23/3 * * * node /scripts/jd_mohe.js >> /scripts/logs/jd_mohe.log 2>&1&1
# 京喜领88元红包(6.31到期)
4 2,10 * * * node /scripts/jd_jxlhb.js >> /scripts/logs/jd_jxlhb.log 2>&1
# 省钱大赢家之翻翻乐
10,40 * * * * node /scripts/jd_big_winner.js >> /scripts/logs/jd_big_winner.log 2>&1
# 赚钱大赢家-定时提现
# 59,29 0,23,11-18/1 * * * python3 /scripts/jd_big_winner_cash.py >> /scripts/logs/jd_big_winner_cash.log 2>&1
# 明星小店
12 11 10-17 9 * node /scripts/jd_star_shop.js >> /scripts/logs/jd_star_shop.log 2>&1
# 浮窗集卡
30 9,21 1-12 * *  node /scripts/jd_necklace_card.js >> /scripts/logs/jd_necklace_card.log 2>&1
# 内容鉴赏官
15 3,6 * * * node /scripts/jd_connoisseur.js >> /scripts/logs/jd_connoisseur.log 2>&1
# 京喜财富岛合成月饼
# 10 * * * * node /scripts/jd_cfd_mooncake.js >> /scripts/logs/jd_cfd_mooncake.log 2>&1
# 京喜购物返红包助力
# 44 6-23 * * *  node /scripts/jd_jx_cashback.js >> /scripts/logs/jd_jx_cashback.log 2>&1
# 集魔方
16 10,19 * * * node /scripts/jd_rubik_cube.js >> /scripts/logs/jd_rubik_cube.log 2>&1
# 集魔方兑换
# 0 0 * * * node /scripts/jd_rubik_cube_exchage.js >> /scripts/logs/jd_rubik_cube_exchage.log 2>&1
# 芥么签到
11 7,15 * * * node /scripts/jd_zsign.js >> /scripts/logs/jd_zsign.log 2>&1
# 芥么赚豪礼
37 0,11 * * * node /scripts/jd_jmzhl.js >> /scripts/logs/jd_jmzhl.log 2>&1
# 京东小魔方
31 2,8 * * * node /scripts/jd_mf.js >> /scripts/logs/jd_mf.log 2>&1
# 东东超市抢京豆
# 13 0,9 * * * node /scripts/jd_fission.js >> /scripts/logs/jd_fission.log 2>&1
# 跳跳乐瓜分京豆 (什么时候结束)
1 0,9,15,21 * * * node /scripts/jd_jump.js >> /scripts/logs/jd_jump.log 2>&1
# 京东金榜
13 13 * * * node /scripts/jd_gold_sign.js >> /scripts/logs/jd_gold_sign.log 2>&1
# 京东赚京豆一分钱抽奖
30 7 * * * node /scripts/jd_lottery_drew.js >> /scripts/logs/jd_lottery_drew.log 2>&1
# 京东生鲜抽奖
45 0 * * * node /scripts/jd_fresh_lottery.js >> /scripts/logs/jd_fresh_lottery.log 2>&1
# 京喜签到
30 2,9 * * * node /scripts/jx_sign.js >> /scripts/logs/jx_sign.log 2>&1
# 逛京东会场
0 0,20 * * * node /scripts/jd_mall_active.js >> /scripts/logs/jd_mall_active.log 2>&1
# 京东通天塔签到
3 0 * * * node /scripts/jd_m_sign.js >> /scripts/logs/jd_m_sign.log 2>&1
# 魔方红包雨
1 10 * * * node /scripts/jd_mf_red_rain.js >> /scripts/logs/jd_mf_red_rain.log 2>&1
##############长期活动##############
# 签到
0 0,17 * * * cd /scripts && node jd_bean_sign.js >> /scripts/logs/jd_bean_sign.log 2>&1
0 1, * * * node /scripts/jd_sign_graphics.js >> /scripts/logs/jd_sign_graphics.log 2>&1
0 2, * * * node /scripts/jd_sign_flop.js >> /scripts/logs/jd_sign_flop.log 2>&1 
43 1,16 * * * node /scripts/jd_sign_slider.js >> /scripts/logs/jd_sign_slider.log 2>&1 
# 店铺签到
2 1 * * * node /scripts/jd_shop_sign.js >> /scripts/logs/jd_shop_sign.log 2>&1
# 摇京豆
6 0,23 * * * node /scripts/jd_club_lottery.js >> /scripts/logs/jd_club_lottery.log 2>&1
# 东东农场
15 6-18/6 * * * node /scripts/jd_fruit.js >> /scripts/logs/jd_fruit.log 2>&1
# 宠汪汪
45 */3 * * * node /scripts/jd_joy.js >> /scripts/logs/jd_joy.log 2>&1
# 宠汪汪积分兑换京豆
# 59 7,15,23 * * * node /scripts/jd_joy_reward.js >> /scripts/logs/jd_joy_reward.log 2>&1
# 宠汪汪积分兑换有就换版
# 59 7,15,23 * * * node /scripts/jd_joy_reward_mod.js >> /scripts/logs/jd_joy_reward_mod.log 2>&1
# 宠汪汪偷好友积分与狗粮,及给好友喂食
6,10 0-21/3 * * * node /scripts/jd_joy_steal.js >> /scripts/logs/jd_joy_steal.log 2>&1
# 摇钱树
0 */2 * * * node /scripts/jd_moneyTree.js >> /scripts/logs/jd_moneyTree.log 2>&1
# 东东萌宠
5 6-18/6 * * * node /scripts/jd_pet.js >> /scripts/logs/jd_pet.log 2>&1
# 京东种豆得豆
10 7-22/1 * * * node /scripts/jd_plantBean.js >> /scripts/logs/jd_plantBean.log 2>&1
# 京东全民开红包
12 0-23/4 * * * node /scripts/jd_redPacket.js >> /scripts/logs/jd_redPacket.log 2>&1
# 进店领豆
6 0 * * * node /scripts/jd_shop.js >> /scripts/logs/jd_shop.log 2>&1
# 取关京东店铺商品
45-50/1 23 * * * node /scripts/jd_unsubscribe.js >> /scripts/logs/jd_unsubscribe.log 2>&1
# 京豆变动通知
0 14 * * * node /scripts/jd_bean_change.js >> /scripts/logs/jd_bean_change.log 2>&1
# 京东抽奖机
11 0,10 * * * node /scripts/jd_lotteryMachine.js >> /scripts/logs/jd_lotteryMachine.log 2>&1
# 点点券
10 0,20 * * * node /scripts/jd_necklace.js >> /scripts/logs/jd_necklace.log 2>&1
# 东东小窝
# 16 6,23 * * * node /scripts/jd_small_home.js >> /scripts/logs/jd_small_home.log 2>&1
# 东东工厂
# 26 * * * * node /scripts/jd_jdfactory.js >> /scripts/logs/jd_jdfactory.log 2>&1
# 赚京豆(微信小程序)
12 * * * * node /scripts/jd_syj.js >> /scripts/logs/jd_syj.log 2>&1
# 京东快递签到
21 1 * * * node /scripts/jd_kd.js >> /scripts/logs/jd_kd.log 2>&1
# 京东汽车(签到满500赛点可兑换500京豆)
0 0 * * * node /scripts/jd_car.js >> /scripts/logs/jd_car.log 2>&1
# 领京豆额外奖励(每日可获得3京豆)
23 1,12,22 * * * node /scripts/jd_bean_home.js >> /scripts/logs/jd_bean_home.log 2>&1
# 微信小程序京东赚赚
30 11,20 * * * node /scripts/jd_jdzz.js >> /scripts/logs/jd_jdzz.log 2>&1
# 京东汽车旅程赛点兑换金豆
0 0 * * * node /scripts/jd_car_exchange.js >> /scripts/logs/jd_car_exchange.log 2>&1
# 导到所有互助码
49 7 * * * node /scripts/jd_get_share_code.js >> /scripts/logs/jd_get_share_code.log 2>&1
# 京喜农场
0 9,12,18 * * * node /scripts/jd_jxnc.js >> /scripts/logs/jd_jxnc.log 2>&1
# 京喜牧场
20 0-23/3 * * * node /scripts/jd_jxmc.js >> /scripts/logs/jd_jxmc.log 2>&1
# 签到领现金
10 0 * * * node /scripts/jd_cash_windfgg.js >> /scripts/logs/jd_cash_windfgg.log 2>&1
# 微信签到领现金
16 0,5 * * * node /scripts/jd_cash_wx.js >> /scripts/logs/jd_cash_wx.log 2>&1
# 签到领现金兑换
0 0 * * *  node /scripts/jd_cash_exchange.js >> /scripts/logs/jd_cash_exchange.log 2>&1
# 京喜app签到
5 0 * * * node /scripts/jd_jx_sign.js >> /scripts/logs/jd_jx_sign.log 2>&1
# 闪购盲盒
47 8,22 * * * node /scripts/jd_sgmh.js >> /scripts/logs/jd_sgmh.log 2>&1
# 粉丝福利
0 8,22 * * * node /scripts/jd_fuli.js >> /scripts/logs/jd_fuli.log 2>&1
# 京东秒秒币
10 6,21 * * * node /scripts/jd_ms.js >> /scripts/logs/jd_ms.log 2>&1
# 美丽研究院
# 1 7-23/2 * * * node /scripts/jd_beauty.js >> /scripts/logs/jd_beauty.log 2>&1
# 美丽研究院兑换
# 0 8,12 * * * node /scripts/jd_beauty_exchange.js >> /scripts/logs/jd_beauty_exchange.log 2>&1
# 京东保价
41 0,23 * * * node /scripts/jd_price.js >> /scripts/logs/jd_price.log 2>&1
# 京东极速版签到+赚现金任务
1 1,6 * * * node /scripts/jd_speed_sign.js >> /scripts/logs/jd_speed_sign.log 2>&1
# 京东极速版签到免单
18 8,12,20 * * * node /scripts/jd_speed_signfree.js >> /scripts/logs/jd_speed_signfree.log 2>&1
# 京喜财富岛
# 0 * * * * node /scripts/jd_cfd.js >> /scripts/logs/jd_cfd.log 2>&1
# 京喜财富岛提现
# 59 11,12,23 * * * node /scripts/jd_cfd_withdraw.js >> /scripts/logs/jd_cfd_withdraw.log 2>&1
# 京洞察问卷通知
35 9 * * * node /scripts/jd_insight.js >> /scripts/logs/jd_insight.log 2>&1
# 删除优惠券(默认注释，如需要自己开启，如有误删，已删除的券可以在回收站中还原，慎用)
#20 9 * * 6 node /scripts/jd_delCoupon.js >> /scripts/logs/jd_delCoupon.log 2>&1
# 京东直播（又回来了）
50 12-14 * * * node /scripts/jd_live.js >> /scripts/logs/jd_live.log 2>&1
# 京东健康社区
20 0,6,22 * * * node /scripts/jd_health.js >> /scripts/logs/jd_health.log 2>&1
# 京东健康社区收集健康能量
5-45/20 0-5 * * * node /scripts/jd_health_collect.js >> /scripts/logs/jd_health_collect.log 2>&1
# 京东健康社区兑换
0 0 * * * node /scripts/jd_health_exchage.js >> /scripts/logs/jd_health_exchage.log 2>&1z
# 领金贴
5 0 * * * node /scripts/jd_jin_tie.js >> /scripts/logs/jd_jin_tie.log 2>&1
# 京东试用（默认注释，请配合取关脚本使用
10 5 * * *  node /scripts/jd_try.js >> /scripts/logs/jd_try.log 2>&1
# 汪汪乐园
30 2,20 * * * node /scripts/jd_joy_park.js >> /scripts/logs/jd_joy_park.log 2>&1
# 特物Z|万物皆可国创
30 11 * * * node /scripts/jd_superBrand.js >> /scripts/logs/jd_superBrand.log 2>&1
# 特务Zx佳沛
23 0,9 * * * node /scripts/jd_superZ4Brand.js >> /scripts/logs/jd_superZ4Brand.log 2>&1
# 天天优惠大乐透
20 12,14 * * * node /scripts/jd_DrawEntrance.js >> /scripts/logs/jd_DrawEntrance.log 2>&1
# 京东众筹许愿
8 0,8 * * * node /scripts/jd_crowdfunding_wish.js >> /scripts/logs/jd_crowdfunding_wish.log 2>&1
# 京东品牌类活动
20 0,2 * * * node /scripts/jd_wish.js >> /scripts/logs/jd_wish.log 2>&1
# 京享值PK
15 0,6,13,19,21 * * * node /scripts/jd_ddo_pk.js >> /scripts/logs/jd_ddo_pk.log 2>&1
# 关注频道、抽奖
#0 6 * * * node /scripts/jd_focus.js >> /scripts/logs/jd_focus.log 2>&1
# 取关主播
3 5 * * * node /scripts/jd_unsubscribe_live.js >> /scripts/logs/jd_unsubscribe_live.log 2>&1
# 积分换话费
3 5 * * * node /scripts/jd_phone_bill.js >> /scripts/logs/jd_phone_bill.log 2>&1
# 小鸽有礼-京小哥助手（微信小程序）
2 2 * * * node /scripts/jd_mp_deliveryman.js >> /scripts/logs/jd_mp_deliveryman.log 2>&1
# 超级品牌殿堂
18 10,18 * * * node /scripts/jd_ppdt.js >> /scripts/logs/jd_ppdt.log 2>&1
# 半点红包雨
30 21,22 * * * node /scripts/jd_redrain_half.js >> /scripts/logs/jd_redrain_half.log 2>&1
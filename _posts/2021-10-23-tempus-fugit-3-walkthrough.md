---
layout: post
title: "Tempus-Fugit-3 walkthrough"
date: 2021-10-23
author: 2hanx
toc: true
categories: [Vulnhub]
tags: []
---

### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机         | IP                |
| -------------- | ----------------- |
| 本机（Win10）  | `192.168.174.1`   |
| Kali           | `192.168.174.128` |
| Tempus-Fugit-3 | `192.168.174.143` |

### 扫描端口和版本信息

`nmap -A -p- 192.168.174.143`

```shell
┌──(root💀kali)-[~]
└─# nmap -p- -A 192.168.174.143
Starting Nmap 7.91 ( https://nmap.org ) at 2021-10-23 03:21 EDT
Nmap scan report for 192.168.174.143
Host is up (0.00018s latency).
Not shown: 65533 closed ports
PORT   STATE    SERVICE VERSION
22/tcp filtered ssh
80/tcp open     http    nginx 1.14.2
|_http-server-header: nginx/1.14.2
|_http-title: Tempus Fugit
```

### Getshell

### 提权

### 总结

---
title: Kali 配置 SS 代理
date: 2019-08-31T18:43:59+08:00
author: 2hanx
layout: post
categories:
  - Kali
tags:
  - software
---
### 安装

`apt install python-pip && pip install shadowsocks`

### 修改配置文件

`/etc/shadowsocks/server.json`

```json
{
    "server":"my_server_ip", #服务器公网IP
    "server_port":8388, #服务器对外提供的端口，用来给客户端连接。
    "local_address": "127.0.0.1",
    "local_port":1080,
    "password":"mypassword", #设置连接密码
    "timeout":300, 
    "method":"aes-256-cfb",
    "fast_open": false
}
```

### Proxychains设置

`vim /etc/proxychains.conf`

```
dynamic_chain
socks5 127.0.0.1 1080
```

### 测试/开启/关闭/重启连接

`sslocal -c /etc/shadowsocks/server.json [-d [start|stop|restart]]`

### 设置代理

  * System：`Network Proxy` →`Manual` → `Socks Host` : `127.0.0.1:1080`
  * Firefox：`Preferences` → `Network Proxy` → `Manual Proxy configuration`→`Socks Host` ：`127.0.0.1：1080`
  * 在需要代理的应用前加 `proxychains`

### 添加为系统服务

`vim /etc/systemd/system/shadowsocks.service` [^1]
```conf
[Unit]
Description=Shadowsocks Client Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/sslocal -c /etc/shadowsocks/server.json

[Install]
WantedBy=multi-user.target
```

### 开机自启动

```shell
systemctl enable /etc/systemd/system/shadowsocks.service #设置开机自启命令
systemctl start shadowsocks.service #启动命令
systemctl status shadowsocks.service #查看状态命令
```

### 终端全局使用代理

`export ALL_PROXY=socks5://127.0.0.1:1080`

### 验证代理

  * `curl cip.cc`
  * `curl ip.sb`

---
[^1]: `type -a sslocal` 查看命令具体位置
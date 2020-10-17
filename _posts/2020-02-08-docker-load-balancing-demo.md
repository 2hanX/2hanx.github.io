---
title: Docker Load Balancing Demo
date: 2020-02-08T17:06:00+08:00
author: 2hanx
layout: post
categories:
  - Note
tags:
  - note
---
### Network Topology

![load-balancing_net_top.png](https://i.loli.net/2020/02/08/IfwpbU9Zt3R86ON.png) 

### Base Image

```
docker pull ubuntu:latest
apt-get install vim curl wget tree net-tools iputils-ping nginx
```

### Container config

```
Docker Network:
    docker network create -d bridge mybridge --gateway=10.0.2.1 --subnet=10.0.2.1/24
WFE1:
    docker run --name WFE1 --network mybridge --ip 10.0.2.6 -dit ubuntu     
WFE2:
    docker run --name WFE2 --network mybridge --ip 10.0.2.7 -dit ubuntu
NLB:
    docker run --name NLB --network mybridge --ip 10.0.2.9 -dit ubuntu
```

### Nginx config（`/etc/nginx/nginx.conf`）

```
user  nginx;
worker_processes  1;
error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log  /var/log/nginx/access.log  main;
    
    sendfile        on;
    #tcp_nopush     on;
    
    keepalive_timeout  65;
    
    #gzip  on;
    
    include /etc/nginx/conf.d/*.conf;
}
```

### Server config（`/etc/nginx/conf.d/main.conf`）

```
# WFE1 and WFE2
server {
    listen       80;
    server_name  localhost;
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
# -----------nlb_conf.d/main.conf-----------------
# NLB
upstream backend{
        server 10.0.2.6;
        server 10.0.2.7;
}
server {
    listen       80;
    location / {
        proxy_pass http://backend;
    }
}
```

### Web Content（`/usr/share/nginx/html/index.html`）

```
# WFE1 and WFE2
echo `uname -n` &gt; /usr/share/nginx/html/index.html
```

### Test Load Balancing with Nginx

```
# NLB
curl localhost

root@12bea68e0069:~# curl localhost
dd746ca75c65
root@12bea68e0069:~# curl localhost
38b8540073f9
root@12bea68e0069:~# curl localhost
dd746ca75c65
root@12bea68e0069:~# curl localhost
38b8540073f9
```

### Load Balancing Algorithms

  1. Round Robin 
```
# NLB
upstream backend{
       server 10.0.2.6 weight=3;
       server 10.0.2.7 weight=1;
}
server {
      listen       80;
      location / {
       proxy_pass http://backend;
} }
```

`nginx -s reload` （重新加载nginx配置文件）
    
```
root@12bea68e0069:~# curl localhost
dd746ca75c65
root@12bea68e0069:~# curl localhost
dd746ca75c65
root@12bea68e0069:~# curl localhost
dd746ca75c65
root@12bea68e0069:~# curl localhost
38b8540073f9
```

  2. Least Connected, Optionally Weighted（最少连接，可选加权） 
```
# NLB
upstream backend{
       least_conn;
       server 10.0.2.6 weight=1;
       server 10.0.2.7 weight=1;
}
```

  3. IP Hash 
```
# NLB
upstream backend{
       ip_hash;
       server 10.0.2.6;
       server 10.0.2.7;
}
```

  4. Generic Hash 
```
# NLB
upstream backend{
       hash $scheme$request_uri;
       server 10.0.2.6;
       server 10.0.2.7;
}
```

  5. Least Time (Nginx PLUS), Optionally Weighted 
```
# NLB
upstream backend{
       least_time (header | last_byte);
       server 10.0.2.6 weight=1;
       server 10.0.2.7 weight=1;
}
```

### Docker-compose encapsulate

#### Docker-compose.yml

```
version: '3'

networks:
  mybridge:
    driver: bridge
    ipam:
        driver: default
        config:
            - subnet: 10.0.2.0/24 

services:
  nginx1:
    container_name: WFE1
    build: .
    volumes:
        # - /opt/Docker-load_balancing-nginx/nginx/config:/etc/nginx
        # 上一条指令这样挂载的话，会把容器里原来的该 /etc/nginx 路径下的文件全部替换掉，因此正确的做法则是配置完成后
        # 在终端执行 docker cp nginx.conf xxx:/etc/nginx/
        - /opt/Docker-load_balancing-nginx/nginx/conf.d:/etc/nginx/conf.d
    stdin_open: true
    tty: true
    expose:
        - 80
    networks:
        mybridge:
            ipv4_address: 10.0.2.6


  nginx2:
    container_name: WFE2
    build: .
    volumes:
        # - /opt/Docker-load_balancing-nginx/nginx/config:/etc/nginx
        - /opt/Docker-load_balancing-nginx/nginx/conf.d:/etc/nginx/conf.d
    expose:
        - 80
    stdin_open: true
    tty: true
    networks:
        mybridge:
            ipv4_address: 10.0.2.7

  nginx3:
    container_name: NLB
    build: .
    volumes:
        # - /opt/Docker-load_balancing-nginx/nginx/config:/etc/nginx
        - /opt/Docker-load_balancing-nginx/nginx/nlb_conf.d:/etc/nginx/conf.d
    ports:
        - 3003:80
    stdin_open: true
    tty: true
    networks:
        mybridge:
            ipv4_address: 10.0.2.9
```

#### Dockerfile

```
# 基础镜像
FROM ubuntu:latest

WORKDIR /code

RUN groupadd -r nginx
RUN useradd -r nginx -g nginx
RUN apt-get update
RUN apt-get install -y vim curl wget tree net-tools iputils-ping 
RUN apt-get install -y nginx 

# ENV 设置环境,将在 镜像内保留
ENV NGINX_SITE_DIR=/usr/share/nginx/html \
    NGINX_LOG_DIR=/var/log/nginx \
    NGINX_CONF_DIR=/etc/nginx/ \
    NGINX_SER_CONF_DIR=/etc/nginx/conf.d

RUN rm -rf ${NGINX_SER_CONF_DIR}/*.conf
```

### F&Q

1 . 修改运行中的容器名称别名?

2 . 复制一个运行中的容器？

3 . Mac 不能ping 容器？

  > docker手册上写明是 Mac 系统限制导致不能ping容器 

4 . commit 创建容器添加 Commit 时不能保留原来的信息？

5 . Docker commit 命令保存的镜像文件太大的问题

   > docker history cb43 

6 . docker-compose 构建容器后 `exited with code 0` 
在 yml 文件的 Ubuntu镜像参数中加上`stdin_open: true tty: true `

```
stdin_open 相当于 run 命令中的 -d
tty 相当于 run 命令中的 -i 
```

```
docker-compose up -d
```

7 . 如何在 docke-compose.yml 中使用该配置文件环境变量? 

* env_file 和 environment 中定义的环境变量是传给 container 用的，而不是用在docker-compose.yml 文件中的变量
* docker-compose.yml 中的环境变量`${VARIABLE:-default}`引用的是在 .env 中定义的或者同个shell export 出来的

8 . volumes 挂载出错 

* volumes 只能挂载文件夹，不能挂载文件
* volumes 挂载文件夹后会替换掉原来容器里的所有文件
* 容器对挂载文件进行操作，宿主主机上的文件也会变化

### Ref.

  * 《Nginx From Beginner to Pro》
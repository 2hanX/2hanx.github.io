---
title: HTTP基础
date: 2019-09-18T16:03:30+08:00
author: 2hanx
layout: post
categories:
  - Network
tags:
  - note
---
最近在进行 Web 方向的练习时，总对 HTTP 协议中的字段和意义不清不楚，因此有必要拿出时间补补基础知识，弥补一下缺陷

### 1、HTML编码

  * 实体编码：`&quot`代表`"`
  * 任何字符都可以使用它的十进制或十六进制的ASCII码进行HTML编码：`&#34`代表`"` `&#x22` 也代表 `"`

### 2、HTTP请求或响应

一次完整的请求或响应由：消息头、一个空白行和消息主体构成

```http
GET / HTTP/1.1
Host: www.github.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:52.0) Gecko/20100101 Firefox/52.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate
Upgrade-Insecure-Requests: 1
Cookie: logged_in=yes;
Connection: close


```

第一行是请求方法，请求的资源路径和使用的 HTTP 协议版本，第二行之后是消息头键值对

```http
HTTP/1.1 200 OK
Date: Tue, 26 Dec 2017 02:28:53 GMT
Content-Type: text/html; charset=utf-8
Connection: close
Server: GitHub.com
Status: 200 OK
Cache-Control: no-cache
Vary: X-PJAX
X-UA-Compatible: IE=Edge,chrome=1
Set-Cookie: user_session=37Q; path=/;
X-Request-Id: e341
X-Runtime: 0.538664
Content-Security-Policy: default-src 'none';
Strict-Transport-Security: max-age=31536000; includeSubdomains;preload
Public-Key-Pins: max-age=0;
X-Content-Type-Options: nosniff
X-Frame-Options: deny
X-XSS-Protection: 1; mode=block
X-Runtime-rack: 0.547600
Vary: Accept-Encoding
X-GitHub-Request-Id: 7400
Content-Length: 128504

&lt;!DOCTYPE html&gt;
......
```

第一行为协议版本、状态号和对应状态的信息，第二至二十二为返回头键值对，紧接着是一个空行和返回的内容实体

| 请求方法    | 描述                  |
| ------- | ------------------- |
| GET     | 请求获取URL资源           |
| POST    | 执行操作，请求URL资源后附加新的数据 |
| HEAD    | 只获取资源响应消息报头         |
| PUT     | 请求服务器存储一个资源         |
| DELETE  | 请求服务器删除资源           |
| TRACE   | 请求服务器回送收到的信息        |
| OPTIONS | 查询服务器的支持选项          |

### 3、HTTP 消息头

HTTP 支持许多不同的消息头，一些有着特殊作用，而另一些则特定出现在请求或者响应中

| 消息头              | 描述                                    | 备注 |
| ---------------- | ------------------------------------- | -- |
| Connection       | 告知通信另一端，在完成HTTP传输后是关闭 TCP 连接，还是保持连接开放 |    |
| Content-Encoding | 规定消息主体内容的编码形式                         |    |
| Content-Length   | 规定消息主体的字节长度                           |    |
| Content-Type     | 规定消息主体的内容类型                           |    |
| Accept           | 告知服务器客户端愿意接受的内容类型                     | 请求 |
| Accept-Encoding  | 告知服务器客户端愿意接受的内容编码                     | 请求 |
| Authorization    | 进行内置 HTTP 身份验证                        | 请求 |
| Cookie           | 用于向服务器提交 cookie                       | 请求 |
| Host             | 指定所请求的完整 URL 中的主机名称                   | 请求 |
| Oringin          | 跨域请求中的请求域                             | 请求 |
| Referer          | 指定提出当前请求的原始 URL                       | 请求 |
| User-Agent       | 提供浏览器或者客户端软件的有关信息                     | 请求 |
| Cache-Control    | 向浏览器发送缓存指令                            | 响应 |
| Location         | 重定向响应                                 | 响应 |
| Server           | 提供所使用的服务器软件信息                         | 响应 |
| Set-Cookie       | 向浏览器发布 cookie                         | 响应 |
| WWW-Authenticate | 提供服务器支持的验证信息                          | 响应 |

Cookie 是一组键值对，另外还包括以下信息：

  * expires，用于设定 cookie 的有效时间
  * domain，用于指定 cookie 的有效域
  * path，用于指定 cookie 的有效 URL 路径
  * secure，指定仅在 HTTPS 中提交 cookie
  * HttpOnly，指定无法通过客户端 JavaScript 直接访问 cookie

### 状态码

状态码表明资源的请求结果状态，由三位十进制数组成，第一位代表基本的类别：

  * `1xx`：提供信息
  * `2xx`：请求成功提交
  * `3xx`：客户端重定向其他资源
  * `4xx`：请求包含错误
  * `5xx`：服务端执行遇到错误

| 状态码 | 短语                       | 描述                   |
| --- | ------------------------ | -------------------- |
| 100 | Continue                 | 服务端已收到请求并要求客户端继续发送主体 |
| 200 | Ok                       | 已成功提交，且响应主体中包含请求结果   |
| 201 | Created                  | PUT 请求方法的返回状态，请求成功提交 |
| 301 | Moved Permanently        | 请求永久重定向              |
| 302 | Found                    | 暂时重定向                |
| 304 | Not Modified             | 指示浏览器使用缓存中的资源副本      |
| 400 | Bad Request              | 客户端提交请求无效            |
| 401 | Unauthorized             | 服务端要求身份验证            |
| 403 | Forbidden                | 禁止访问被请求资源            |
| 404 | Not Found                | 所请求的资源不存在            |
| 405 | Method Not Allowed       | 请求方法不支持              |
| 413 | Request Entity Too Large | 请求主体过长               |
| 414 | Request URI Too Long     | 请求URL过长              |
| 500 | Internal Server Error    | 服务器执行请求时遇到错误         |
| 503 | Service Unavailable      | Web 服务器正常，但请求无法被响应   |

`401`状态支持的 HTTP 身份认证：

  * Basic：以 Base64 编码的方式发送证书
  * NTLM：一种质询-响应机制
  * Digest：一种质询-响应机制，随同证书一起使用一个随机的 MD5 校验和

### Origin

  * 《ctf-all-in-one》
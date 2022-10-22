---
title: curl 命令行工具使用
date: 2019-12-08T17:59:07+08:00
author: 2hanx
layout: post
categories:
  - Note
tags:
  - note
  - software
---
### 0x0 前言

近期看到这样一篇文章[《21 个 curl 命令练习》](https://linux.cn/article-11648-1.html)很有意思，同时也想到自己对这款工具了解不多，只是个初级使用者。我们知道熟练的使用一类工具可以无需使用其他同类工具，同时可以减少学习成本，一劳永逸，况且`curl`命令行工具支持许多协议，十分强大，可以替代 Postman 这一类的图形界面工具（虽然我也安装了它 (〃&#8217;▽&#8217;〃)，咳咳）  
本篇文章包括对上篇文章的解答，仅属学习记录，如有错误敬请批评指正

### 0x1 练习解答

| 问题序号（摘要）                                       | 命令                                                                                                        | 注解                                                                                                                                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                                              | `curl https://httpbin.org`                                                                                |                                                                                                                                                                                                     |
| 2                                              | `curl https://httpbin.org/anything`                                                                       | 该网站会解析发起的请求，并且在响应中回显；`curl`默认发起的请求是`GET`                                                                                                                                                            |
| 3：发起`GET`请求                                    | `curl -X GET https://httpbin.org/anything`                                                                |                                                                                                                                                                                                     |
| 4：添加查询参数                                       | `curl -G https://httpbin.org/anything -d "value=panda"`                                                   | `-G`参数用来构造 URL 的查询字符串，并且发出的是`GET`请求                                                                                                                                                                 |
| 5                                              | `curl https://www.google.com/robots.txt`                                                                  |                                                                                                                                                                                                     |
| 6：设置请求头`User-Agent`                            | `curl -X GET -A elephant https://httpbin.org/anything`                                                    | `-A`参数设置用户代理                                                                                                                                                                                        |
| 7：发起 `DELETE` 请求                               | `curl -X DELETE https://httpbin.org/anything`                                                             |                                                                                                                                                                                                     |
| 8：获取响应头信息                                      | `curl -I https://httpbin.org/anything`                                                                    |                                                                                                                                                                                                     |
| 9：发起请求体为 JSON `{"value": "panda"}` 的 `POST` 请求 | `curl -d '{ "value" : "panda" }' https://httpbin.org/anything`                                            | 注意：Windows平台下==里反义，里外都双==（括号内的引号需要`\`转义），Linux平台下==里双外单==（内部字符串使用双引号，括号外使用单引号）；此外使用`-d`参数以后，HTTP 请求默认会自动加上标头`Content-Type : application/x-www-form-urlencoded`，并且会自动将请求转为 `POST` 方法，因此可以省略`-X POST` |
| 10                                             | `curl -X POST -H "Content-Type:application/json" -d '{ "value" : "panda" }' https://httpbin.org/anything` |                                                                                                                                                                                                     |
| 11                                             | `curl -H "Accept-Encoding: gzip" https://httpbin.org/anything`                                            | 出现警告信息，提示添加`--output`参数保存压缩文件                                                                                                                                                                       |
| 12：使用文件传输形式传`JSON`                             | `curl -d @test.json -X POST https://httpbin.org/anything`                                                 |                                                                                                                                                                                                     |
| 13                                             | `curl -H "Accept:image/png" https://httpbin.org/image -o test.png`                                        |                                                                                                                                                                                                     |
| 14                                             | `curl -X PUT https://httpbin.org/anything`                                                                |                                                                                                                                                                                                     |
| 15                                             | `curl https://httpbin.org/image/jpeg -o test1.jpeg`                                                       |                                                                                                                                                                                                     |
| 16                                             | `curl -I https://www.twitter.com`                                                                         |                                                                                                                                                                                                     |
| 17                                             | `curl -H "panda:elephant" https://httpbin.org/anything`                                                   |                                                                                                                                                                                                     |
| 18                                             | `curl -I https://httpbin.org/status/404`                                                                  |                                                                                                                                                                                                     |
| 19：设置用户名和密码                                    | `curl -u "username:password" https://httpbin.org/anything`                                                |                                                                                                                                                                                                     |
| 20                                             | `curl -H "Accept-Language:es-ES" https://twitter.com`                                                     |                                                                                                                                                                                                     |

### 0x2其他

| 命令                                                             | 注解       |
| -------------------------------------------------------------- | -------- |
| `curl --cookie "name=eric" https://httpbin.org/anything`       | 设置cookie |
| `curl -x socks5://{proxy_server} https://httpbin.org/anything` | 设置代理     |
| …                                                              |          |

### 0x3 Ref.

  * [curl_tool&library](https://curl.haxx.se/)
  * [everything-curl-gitbook](https://legacy.gitbook.com/download/pdf/book/bagder/everything-curl)
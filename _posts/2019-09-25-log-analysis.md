---
title: 日志分析
date: 2019-09-25T00:19:08+08:00
author: 2hanx
layout: post
categories:
  - Linux
tags:
  - ctf
---
### 0x0 题目

BugkuCTF [日志分析](https://ctf.bugku.com/files/195eea16a36594dcb1b0ea7015d68973/5b0b08e0-31aa-4a8d-ae19-89b843554506.zip)

### 0x1 分析

`head access.log`

粗看文件内容是进行本地SQL盲注，并且日志格式规范，大致想法也就是进行格式匹配输出

`cat access.log | grep flag > flag`

果然出现`dvwa.flag_is_here`字段，经过URL解码后我们明显可以看出是字符暴力破解

```python
from urllib import parse
import os

os.system("cat access.log | grep flag | grep -v 404 | awk -F '\"' '{print $2}' &gt; flag")

with open('flag1','w',encoding='utf-8') as f1:
  with open('flag',encoding='utf-8') as f2:
    while True:
      tmp = f2.read()
      if tmp:
        tmp = parse.unquote(tmp)
        f1.write(tmp)
      else: 
        break
```

```shell
GET /vulnerabilities/sqli_blind/?id=2' AND ORD(MID((SELECT IFNULL(CAST(flag AS CHAR),0x20) FROM dvwa.flag_is_here ORDER BY flag LIMIT 0,1),1,1))&gt;64 AND 'RCKM'='RCKM&Submit=Submit HTTP/1.1
GET /vulnerabilities/sqli_blind/?id=2' AND ORD(MID((SELECT IFNULL(CAST(flag AS CHAR),0x20) FROM dvwa.flag_is_here ORDER BY flag LIMIT 0,1),1,1))&gt;96 AND 'RCKM'='RCKM&Submit=Submit HTTP/1.1
GET /vulnerabilities/sqli_blind/?id=2' AND ORD(MID((SELECT IFNULL(CAST(flag AS CHAR),0x20) FROM dvwa.flag_is_here ORDER BY flag LIMIT 0,1),1,1))&gt;100 AND 'RCKM'='RCKM&Submit=Submit HTTP/1.1
GET /vulnerabilities/sqli_blind/?id=2' AND ORD(MID((SELECT IFNULL(CAST(flag AS CHAR),0x20) FROM dvwa.flag_is_here ORDER BY flag LIMIT 0,1),1,1))&gt;101 AND 'RCKM'='RCKM&Submit=Submit HTTP/1.1
GET /vulnerabilities/sqli_blind/?id=2' AND ORD(MID((SELECT IFNULL(CAST(flag AS CHAR),0x20) FROM dvwa.flag_is_here ORDER BY flag LIMIT 0,1),2,1))&gt;96 AND 'RCKM'='RCKM&Submit=Submit HTTP/1.1
GET /vulnerabilities/sqli_blind/?id=2' AND ORD(MID((SELECT IFNULL(CAST(flag AS CHAR),0x20) FROM dvwa.flag_is_here ORDER BY flag LIMIT 0,1),2,1))&gt;104 AND 'RCKM'='RCKM&Submit=Submit HTTP/1.1
......
```

### 0x2 取键

```shell
cat flag1 | awk -F ',' '{print $4}' | tail -n +2
```

### 0x3 取值

```shell
cat flag1 | awk -F '&gt;' '{print $2}' | awk -F ' ' '{print $1}'
```

### 0x4 结果

取相同的键中最高的值再加1，也就是破解的ASCII对应的十进制值，将其转换成ASCII值即可

### 总结

本来想写一个完整的 python 脚本，把键和值放在 `dict`字典里，多次尝试无果，最后发现自己实在太菜了…… 🙁
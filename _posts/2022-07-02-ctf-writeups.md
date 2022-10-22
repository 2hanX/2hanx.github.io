---
layout: post
title: "CTF Writeups - Reverse"
date: 2022-07-02
author: 2hanx
toc: true
categories: [CTF]
tags: [writeups,reverse]
---

## 2016全国大学生信息安全竞赛-珍贵资料

### 分析

下载的两个文件中一个是android backup文件，一个是apk。分析apk包定位到密码加密的地方，发现是移位加密，并且加密后的字符串是在android backup文件里，我们参考[这篇文章](https://android.stackexchange.com/questions/28481/how-do-you-extract-an-apps-data-from-a-full-backup-made-through-adb-backup)中提到的命令将它提取出来。

`( printf "\x1f\x8b\x08\x00\x00\x00\x00\x00" ; tail -c +25 unknown.ab ) |  tar xfvz -`

![1]({{ '/ctf-reverse/1.png' | prepend: site.url }})

### exp

```python
e = "dudqlvqrero1"
c = "ijklmstuvwxyz0123abcdenopqrfgh456789"
flag = ""
for a in e:
    index = c.index(a)
    flag += c[index-3]
print(flag)
```

### flag

`flag{amanisnobody}`

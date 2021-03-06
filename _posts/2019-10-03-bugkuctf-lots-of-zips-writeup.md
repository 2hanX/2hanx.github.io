---
title: 'BugkuCTF 好多压缩包 Writeup'
date: 2019-10-03T16:25:57+08:00
author: 2hanx
layout: post
categories:
  - Tech
tags:
  - ctf
  - note
---
网络中有许多对于这个题目完整解析的WP，由于我是第一次使用python脚本来获取压缩文件的信息并且感到比较新颖（新手而言），因此做个笔记记录一下 🙂 。文中使用的源码主要也来源于网络

### 0x0 分析

第一次拿到压缩包进行解压后发现里面有许多压缩包，并且每个压缩包里面只有一个相同的文件名`data.txt`，此外还注意到文件中只有`4`个字节数（使用脚本构造字符串碰撞时就需要4个字符），同时使用 Bandizip 压缩软件可以看到文件的CRC码，这时我的想法就是`CRC碰撞`

### 0x1 py3 脚本

```python
import zipfile
import string
import binascii

def CrackCrc(crc):
    for i in dic:
        for j in dic:
            for p in dic:
                for q in dic:
                    s = i + j + p + q
                    if crc == (binascii.crc32(s.encode('utf-8')) & 0xffffffff):
                        f.write(s)
                        return

def CrackZip():
    for i in range(68):
        file = '.\\123\\out'+str(i)+'.zip'
        f=zipfile.ZipFile(file,'r')
        GetCrc = f.getinfo('data.txt')
        crc = GetCrc.CRC #crc32的十进制表示
        # print(hex(crc)) 十六进制表示的CRC32
        CrackCrc(crc)

dic = string.ascii_letters + string.digits + '+/='

f=open('.\\123\\out.txt','w')
CrackZip()
f.close()
```

### 0x2 步骤

  1. Base64解码 
    为了节约时间，我这里给出 CRC32 碰撞得到的文件内容
    
    `z5BzAAANAAAAAAAAAKo+egCAIwBJAAAAVAAAAAKGNKv+a2MdSR0zAwABAAAAQ01UCRUUy91BT5UkSNPoj5hFEVFBRvefHSBCfG0ruGnKnygsMyj8SBaZHxsYHY84LEZ24cXtZ01y3k1K1YJ0vpK9HwqUzb6u9z8igEr3dCCQLQAdAAAAHQAAAAJi0efVT2MdSR0wCAAgAAAAZmxhZy50eHQAsDRpZmZpeCB0aGUgZmlsZSBhbmQgZ2V0IHRoZSBmbGFnxD17AEAHAA==`
    
判断某段信息是Base家族的哪种编码时，观察其中使用的字符集就可以判断

| 编码类型   | 字符集              |
| ------ | ---------------- |
| Base16 | `[0-9A-F]`       |
| Base32 | `[2-7A-Z=]`      |
| Base64 | `[0-9a-zA-Z+/=]` |

  2.补全压缩文件数据信息
    使用 010editor 编辑器打开，补上 RAR 的文件头`526172211A0700`
    > 查看注释得到 flag


### 0x3 总结

使用 Python 脚本进行解题可以大大提高效率，学好python还是好处多多，之前还傻乎乎的手动获取压缩文件中的CRC32校验码 🙁 ……

### Ref.

  * [BugkuCTF &#8211; 好多压缩包 &#8211; WP](https://www.cnblogs.com/WangAoBo/p/6951160.html)
  * [CRC在线计算](http://www.ip33.com/crc.html)
  * [RAR Format](https://ctf-wiki.github.io/ctf-wiki/misc/archive/rar-zh/)
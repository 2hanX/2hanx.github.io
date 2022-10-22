---
layout: post
title: "BUUOJ reverse Writeups"
date: 2021-01-14
author: 2hanx
toc: true
categories: [reverse]
tags: [writeups,reverse]
---

## [V&N2020 公开赛]strangeCpp

### 分析

正常的流程走一遭， 终端执行程序后发现打印出系统环境变量和几个字符串。根据字符串，定位到关键函数

```shell
  sub_1400110AA(&unk_140027033);
  GetSystemInfo(&SystemInfo);
  putchar(byte_140021004);                      // w
  putchar(byte_140021005);                      // e
  putchar(byte_140021006);                      // l
  putchar(byte_140021007);                      // c
  putchar(byte_140021019);                      // o
  putchar(byte_14002101A);                      // m
  putchar(byte_140021005);                      // e
  putchar(10);
  puts("Let me have a look at your computer...");
```

并且在这几个字符间，出现其他字符

```shell
data:0000000140021004 byte_140021004  db 'w'                  ; DATA XREF: sub_140013AA0+59↑r
.data:0000000140021005 byte_140021005  db 'e'                  ; DATA XREF: sub_140013AA0+68↑r
.data:0000000140021005                                         ; sub_140013AA0+B3↑r
.data:0000000140021006 byte_140021006  db 'l'                  ; DATA XREF: sub_140013AA0+77↑r
.data:0000000140021007 byte_140021007  db 'c'                  ; DATA XREF: sub_140013AA0+86↑r
.data:0000000140021008 unk_140021008   db  26h ; &             ; DATA XREF: sub_140013580+81↑o
.data:0000000140021009                 db  2Ch ; ,
.data:000000014002100A                 db  21h ; !
.data:000000014002100B                 db  27h ; '
.data:000000014002100C                 db  3Bh ; ;
.data:000000014002100D                 db  0Dh
.data:000000014002100E                 db    4
.data:000000014002100F                 db  75h ; u
.data:0000000140021010                 db  68h ; h
.data:0000000140021011                 db  34h ; 4
.data:0000000140021012                 db  28h ; (
.data:0000000140021013                 db  25h ; %
.data:0000000140021014                 db  0Eh
.data:0000000140021015                 db  35h ; 5
.data:0000000140021016                 db  2Dh ; -
.data:0000000140021017                 db  69h ; i
.data:0000000140021018                 db  3Dh ; =
.data:0000000140021019 byte_140021019  db 'o'                  ; DATA XREF: sub_140013AA0+95↑r
.data:000000014002101A byte_14002101A  db 'm'                  ; DATA XREF: sub_140013AA0+A4↑r
```

通过xref引用，找到使用未知字符串的函数：`sub_140013580`，截取关键代码

```cpp
  result = sub_140011384((unsigned int)dword_140021190);
  v4 = result;
  if ( (_DWORD)result == 607052314 && dword_140021190 <= 14549743 )
  {
    for ( j = 0; j < 17; ++j )
    {
      putchar((unsigned __int8)(dword_140021190 ^ byte_140021008[j]));
      result = (unsigned int)(j + 1);
    }
  }
  return result;
}
```

再进入`sub_140013890`函数简易分析后得知，只要求得`v8`，即`dword_140021190`值即可得到flag

![1]({{ '/buuoj_reverse/1.png' | prepend: site.url }})

### exp

```python
import hashlib

result = 0
for v8 in range(14549743):
    v7 = (((v8 << 8) ^ (v8 >> 12)) * 291) & 0xffffffff
    if v7 == 607052314:
        result = v8
        break

c = [0x26, 0x2C, 0x21, 0x27, 0x3B, 0x0D, 4, 0x75, 0x68, 0x34, 0x28,
     0x25, 0x0E, 0x35, 0x2D, 0x69, 0x3D]

flag = ""

for char in c:
    flag += chr((char ^ result) & 0xff)

print(flag) 
# flag{MD5(theNum)}

hash = hashlib.md5()
hash.update(str(result).encode('utf-8'))
print('flag{'+hash.hexdigest()+"}")
```

### flag

`flag{e10adc3949ba59abbe56e057f20f883e}`

---

> update: 2021-01-15


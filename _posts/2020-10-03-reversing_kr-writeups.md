---
layout: post
title: "Reversing_kr Writeups"
date: 2020-10-03
author: 2hanx
categories: [reverse]
tags: [writeups,reverse]
---

## Easy Crack

### 分析

使用 ExeinfoPE 工具分析没有进行加壳
使用 file 工具得知是 32 位 windows GUI 程序
运行程序发现是注册码破解，并且输错后会有错误信息提示，因此是常见的入门级逆向题目

### exp

使用 IDA 打开分析，首先查看 string 字符串，找到 `Congratulation !!`字符串，通过调用关系定位到 `sub_401080()` 函数处，因此我们的目的就是逆向该函数即可得到flag

![1]({{ '/reversing_kr/easy_crack.png' | prepend: site.url }})

根据 IDA 的逆向结果可以清楚分析代码逻辑：if 语句通过4个判断来输出正确或错误结果，其中
`strncmp()`函数功能是比较两个字符串，`MessageBoxA` 函数是输出结果。

### flag

`Ea5yR3versing`

## Easy Keygen

### 分析

题目的提示信息
```
ReversingKr KeygenMe
Find the Name when the Serial is 5B134977135E7D13
```

使用 file 工具得知是 32 位 windows console 程序
看来是需要我们找到 `Name` 才能拿到 flag

### exp

![2]({{ '/reversing_kr/easy_keygen.png' | prepend: site.url }})

```python
v13 = [0x5B, 0x13, 0x49, 0x77, 0x13, 0x5E, 0x7D, 0x13]

v6 = [16, 32, 48, 0]
flag = ""

for i in range(len(v13)):
    flag += chr(v13[i] ^ v6[i % 3])

print(flag)
```

### flag

`K3yg3nm3`

---

> *update: 2020-10-04*


## Easy Unpack

### 分析

使用 ExeinfoPE 工具分析发现程序加了壳，但不确定是哪种，此外根据题目的提示信息

```
ReversingKr UnpackMe
Find the OEP
ex) 00401000
```

目的是需要我们找到程序的 OEP。 用 OD 打开，并用单步跟踪法找到 OEP

### exp

```shell
00401150  /.  55            PUSH EBP
00401151  |.  8BEC          MOV EBP,ESP
00401153  |.  6A FF         PUSH -1
00401155  |.  68 D0504000   PUSH Easy_Unp.004050D0
0040115A  |.  68 1C1E4000   PUSH Easy_Unp.00401E1C                   ;  SE 处理程序安装
0040115F  |.  64:A1 0000000>MOV EAX,DWORD PTR FS:[0]
00401165  |.  50            PUSH EAX
00401166  |.  64:8925 00000>MOV DWORD PTR FS:[0],ESP
0040116D  |.  83EC 58       SUB ESP,58
00401170  |.  53            PUSH EBX
00401171  |.  56            PUSH ESI
00401172  |.  57            PUSH EDI
00401173  |.  8965 E8       MOV DWORD PTR SS:[EBP-18],ESP
00401176  |.  FF15 3C504000 CALL DWORD PTR DS:[40503C]               ;  KERNEL32.GetVersion
0040117C  |.  33D2          XOR EDX,EDX
0040117E  |.  8AD4          MOV DL,AH
00401180  |.  8915 E8844000 MOV DWORD PTR DS:[4084E8],EDX
```
### flag

`00401150`

## Music Player

### 分析

根据题目提供的信息得知

```
This MP3 Player is limited to 1 minutes.
You have to play more than one minute.

There are exist several 1-minute-check-routine.
After bypassing every check routine, you will see the perfect flag.
```

需要我们破解这个MP3播放器，使其能够播放一分钟以上，此外每播放一分钟会有一次check。试着播放音频，果然一分钟后会出现弹窗

![3]({{ '/reversing_kr/music_player.png' | prepend: site.url }})

注意到弹窗中信息有个数字 `1`，后续定位弹窗时搜索字符串试试

### exp

1. 破解第一个弹窗

    使用 OD 插件中的 `超级字串参考插件` 搜索ASCII字符串 `1` 后找到两个地方，但第一个才是正确的，接着我们在该地址下个断点，并且在后面发现 `rtcMsgBox` 函数

    ![4]({{ '/reversing_kr/music_player_1.png' | prepend: site.url }})

    ![5]({{ '/reversing_kr/music_player_2.png' | prepend: site.url }})

    此外在上面找到跳转函数 `JL Music_Pl.004045FE`，因为我们需要将程序流程跳过该弹窗，因此修改指令为`jmp 004045FE` 无条件跳转。
    之后选择修改区域，右键 `复制到可执行文件` 后保存文件，运行后出现第二个弹窗

    ![6]({{ '/reversing_kr/music_player_3.png' | prepend: site.url }})

2. 破解第二个弹窗

    使用 OD 打开修改后的程序，在原先跳转的地方下断点。 并且在将歌曲播放至59秒时暂停，这个程序暂停，再次点击播放按钮后会运行至断点处。后面相同的操作找到第二个弹窗位置，将代码修改为 `jmp 004046BF` 即可。保存文件点击运行即可看到 flag

### flag

`LIstenCare`


## Ref.

- [题目地址](http://www.reversing.kr/challenge.php)




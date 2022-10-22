---
title: Nmap 指纹识别
date: 2020-01-23T12:35:43+08:00
author: 2hanx
layout: post
math: true
categories:
  - Network
  - Note
tags:
  - note
---

### 什么是OS指纹？

生活中，我们可以根据人的音色判断他是哪一个人（前提是你熟悉的人）。在我们网络世界中，判断与之通信的计算机上运行的操作系统类型十分重要，这一工作主要应用在信息收集阶段。这里使用nmap工具进行操作系统指纹识别，不同的工具（Xprobe2）进行指纹识别使用的格式略有差异

Nmap通过TCP/IP协议栈的指纹信息来识别目标主机的操作系统信息，其主要是利用了RFC标准中，没有强制规范TCP/IP的某些实现,于是不同的系统中TCP/IP的实现方案可能都有其特定的方式，这些细节上的差异，给nmap识别操作系统信息提供了方案。通过 Nmap 进行操作系统检测时，会从数据库（nmap-os-db）中读取数千个序列化指纹并对其进行匹配，根据匹配结果判断出该操作系统类型是最高概率的那一种

  * Nmap的工作原理 
    使用 TCP/IP 协议栈指纹来判断目标主机的操作系统类型
    
      1. 进行端口扫描：找出一个开放的TCP端口、一个关闭的TCP端口和一个关闭的UDP端口 
      2. 构造不同的数据包发送给目标主机
    
      3. 根据测试结果建立相应的目标主机的 Nmap 指纹，再与指纹库进行查找匹配
      4. 得出目标主机的OS类型

  * OS指纹是其一系列特征的取值
    
    Nmap格式
    
      * `OS标识（参量）=（特征段1，特征段2，...，特征段n)`
      * `特征段i = (特征元1，特征元2，...，特征元n)`
   * OS指纹类型 
      * 参考指纹（_reference fingerprints_）：数据库中已知的操作系统指纹
      * 主体指纹（_subject fingerprint_）：实际进行检测的操作系统指纹

### OS指纹中特征段含义

| 特征段                                   | 原理                                         | 作用                                                |
| ------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| SCAN                                  |                                            | 不是描述目标系统测试的值，而是本地使用的Nmap信息，帮助整合未知指纹并提交给Nmap.org网站 |
| SEQ                                   | 连续发送6项TCP探测                                | 描述顺序产生方式                                          |
| OPS                                   | 记录返回的6个TCP探测中字段信息                          | 描述TCP包中可选字段的值                                     |
| WIN                                   |                                            | 描述TCP包中初始窗口大小                                     |
| ECN（Explicit Congestion Notification） | 发送一个TCP/SYN 探测（设置ECN的CWR和ECE拥塞控制标签）        | 描述TCP明确指定拥塞通知时的特征                                 |
| T1                                    | 响应报文ISN值与ACK值的关系                           | 描述TCP回复包的字段信息                                     |
| T2                                    | 发送一个TCP探测包（无flag值）到开放的TCP端口上               | 描述TCP回复包的字段信息                                     |
| T3                                    | 发送一个TCP探测包（flag=SYN,URG,PSH,FIN）到开放的TCP端口上 | 描述TCP回复包的字段信息                                     |
| T4                                    | 发送一个TCP探测包（flag=ACK）到开放的TCP端口上             | 描述TCP回复包的字段信息                                     |
| T5                                    | 发送一个TCP探测包（flag=SYN）到关闭的TCP端口上             | 描述TCP回复包的字段信息                                     |
| T6                                    | 发送一个TCP探测包（flag=ACK）到关闭的TCP端口上             | 描述TCP回复包的字段信息                                     |
| T7                                    | 发送一个TCP探测包（flag=URG,PSH,FIN）到关闭的TCP端口上     | 描述TCP回复包的字段信息                                     |
| U1                                    | 发送一个UDP探测包到关闭的端口上                          | 描述向关闭的UDP发包产生的回复的特征                               |
| IE（ICMP Echo）                         | ICMP Echo探测                                | 描述向目标机发送ICMP包产生的特征                                |

### OS指纹实例

  * 参照指纹 

```conf
Fingerprint Apple iOS 5.1.1
Class Apple | iOS | 5.X | media device
CPE cpe:/o:apple:iphone_os:5.1.1 auto
Class Apple | iOS | 5.X | phone
CPE cpe:/o:apple:iphone_os:5.1.1 auto
SEQ(SP=FE-108%GCD=1-6%ISR=104-10E%TI=RD%CI=RI%II=RI%TS=A)
OPS(O1=M56CNW4NNT11SLL%O2=M56CNW4NNT11SLL%O3=M56CNW4NNT11%O4=M56CNW4NNT11SLL%O5=M56CNW4NNT11SLL%O6=M56CNNT11SLL)
WIN(W1=FFFF%W2=FFFF%W3=FFFF%W4=FFFF%W5=FFFF%W6=FFFF)
ECN(R=Y%DF=Y%T=3B-45%TG=40%W=FFFF%O=M56CNW4SLL%CC=N%Q=)
T1(R=Y%DF=Y%T=3B-45%TG=40%S=O%A=S+%F=AS%RD=0%Q=)
T2(R=N)
T3(R=N)
T4(R=N)
T5(R=Y%DF=N%T=3B-45%TG=40%W=0%S=Z%A=S+%F=AR%O=%RD=0%Q=)
T6(R=Y%DF=Y%T=3B-45%TG=40%W=0%S=A%A=Z%F=R%O=%RD=0%Q=)
T7(R=N)
U1(DF=N%T=3B-45%TG=40%IPL=38%UN=0%RIPL=G%RID=G%RIPCK=G%RUCK=0%RUD=G)
IE(DFI=S%T=3B-45%TG=40%CD=S)
```
    
  -  参照指纹结构解释

| 字段                                      | 说明                                                                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fingerprint                             | 指明该指纹名称                                                                                                                                                               |
| Class                                   | 生产厂家&#124;OS家族&#124;版本&#124;设备类型                                                                                                                                      |
| CPE（Common Platform Enumeration，通用平台枚举） | 使用CPE标椎格式描述该操作系统的信息，便于很快从网上开源库中找到CPE描述的OS具体信息  
格式：`cpe:/<part>:<vendor>:<product>:<version>:<update>:<edition>:<language>` |

  * 主体指纹 [^1]
```conf
OS:SCAN(V=5.05BETA1%D=8/23%OT=22%CT=1%CU=42341%PV=N%DS=0%DC=L%G=Y%TM=4A91CB
OS:90%P=i686-pc-linux-gnu)SEQ(SP=C9%GCD=1%ISR=CF%TI=Z%CI=Z%II=I%TS=A)OPS(O1
OS:=M400CST11NW5%O2=M400CST11NW5%O3=M400CNNT11NW5%O4=M400CST11NW5%O5=M400CS
OS:T11NW5%O6=M400CST11)WIN(W1=8000%W2=8000%W3=8000%W4=8000%W5=8000%W6=8000)
OS:ECN(R=Y%DF=Y%T=40%W=8018%O=M400CNNSNW5%CC=N%Q=)T1(R=Y%DF=Y%T=40%S=O%A=S+
OS:%F=AS%RD=0%Q=)T2(R=N)T3(R=Y%DF=Y%T=40%W=8000%S=O%A=S+%F=AS%O=M400CST11NW
OS:5%RD=0%Q=)T4(R=Y%DF=Y%T=40%W=0%S=A%A=Z%F=R%O=%RD=0%Q=)T5(R=Y%DF=Y%T=40%W
OS:=0%S=Z%A=S+%F=AR%O=%RD=0%Q=)T6(R=Y%DF=Y%T=40%W=0%S=A%A=Z%F=R%O=%RD=0%Q=)
OS:T7(R=Y%DF=Y%T=40%W=0%S=Z%A=S+%F=AR%O=%RD=0%Q=)U1(R=Y%DF=N%T=40%IPL=164%U
OS:N=0%RIPL=G%RID=G%RIPCK=G%RUCK=G%RUD=G)IE(R=Y%DFI=N%T=40%CD=S)
```

  * 整理过后 [^2]
```conf
SCAN(V=5.05BETA1%D=8/23%OT=22%CT=1%CU=42341%PV=N%DS=0%DC=L%G=Y%TM=4A91CB90%P=i686-pc-linux-gnu)
SEQ(SP=C9%GCD=1%ISR=CF%TI=Z%CI=Z%II=I%TS=A)
OPS(O1=M400CST11NW5%O2=M400CST11NW5%O3=M400CNNT11NW5%O4=M400CST11NW5%O5=M400CST11NW5%O6=M400CST11)
WIN(W1=8000%W2=8000%W3=8000%W4=8000%W5=8000%W6=8000)
ECN(R=Y%DF=Y%T=40%W=8018%O=M400CNNSNW5%CC=N%Q=)
T1(R=Y%DF=Y%T=40%S=O%A=S+%F=AS%RD=0%Q=)
T2(R=N)
T3(R=Y%DF=Y%T=40%W=8000%S=O%A=S+%F=AS%O=M400CST11NW5%RD=0%Q=)
T4(R=Y%DF=Y%T=40%W=0%S=A%A=Z%F=R%O=%RD=0%Q=)
T5(R=Y%DF=Y%T=40%W=0%S=Z%A=S+%F=AR%O=%RD=0%Q=)
T6(R=Y%DF=Y%T=40%W=0%S=A%A=Z%F=R%O=%RD=0%Q=)
T7(R=Y%DF=Y%T=40%W=0%S=Z%A=S+%F=AR%O=%RD=0%Q=)
U1(R=Y%DF=N%T=40%IPL=164%UN=0%RIPL=G%RID=G%RIPCK=G%RUCK=G%RUD=G)
IE(R=Y%DFI=N%T=40%CD=S)
```

### OS指纹匹配计算

#### 算法：匹配特征段

$$特征元匹配率=\frac{累计特征元匹配总数}{并集元素总个数}$$

$$指纹匹配度=\frac{\sum 特征元匹配率}{特征段总个数(13)}$$

#### 原则

  1. 如对象与目标的特征元组的某特征元素相同，则匹配判断为1，否则判断为0
  2. 首先遵循”优先排他“原则

  * 首先匹配上某一个特征元，其余特征元才存在可匹配的理由；否则忽略并跳过此特征段的其余特征元
  
  3. 其次遵循”最大匹配“原则
  
  * 合取参照特征段与目标特征段内所有特征元的并集 
      * 求并集的模数（并集的总个数）作为分母

#### 注意

  1. 这种 `O=%RD=0%Q=` 情况表示`O=`和`Q=`两个测试元被赋予”空“值
  2. 一个空白的测试值匹配另一个空白值

#### 实例

```
参考指纹：T1(R=Y%DF=Y%T=3B-45%TG=40%S=O%A=S+%F=AS%RD=0)
主体指纹：T1(R=Y%DF=N%T=FA-104%TG=FF%S=O%A=S+%F=AS%RD=0%Q=)
T1中特征元匹配率：5/9 = 55.56%
```

```
参考指纹：T2(R=N)
主体指纹：T2(R=Y%DF=N%T=FA-104%TG=FF%W=0%S=A%A=S%F=APR%O=%RD=0%Q=)
T2中特征元匹配率：0%
```

### Ref.

  * [nmap-os-db](https://svn.nmap.org/nmap/nmap-os-db)
  * [特征段含义](https://nmap.org/book/osdetect.html)
  * [自定义flag扫描](https://nmap.org/book/scan-methods-custom-scanflags.html)

---

[^1]: `nmap -O -vv 192.168.1.55 --fuzzy`
[^2]: `OS`：操作系统特征；`:`：开始；`%`：分隔符；`=`：赋值符号

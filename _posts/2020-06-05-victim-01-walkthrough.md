---
title: 'Victim-01 : Walkthrough'
date: 2020-06-05T02:12:50+08:00
author: 2hanx
layout: post
categories:
  - Vulnhub

---
### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机       | IP              |
| --------- | --------------- |
| 本机（Win10） | `192.168.1.105` |
| Kali      | `192.168.1.112` |
| Victim-01 | `192.168.1.101` |

### 扫描端口和版本信息

`nmap -A 192.168.1.101`

![1.png](https://i.loli.net/2020/06/05/hTAYsLiBx6z9WgG.png) 

### 访问 Web 并确定 Web 应用

根据 Nmap 扫描结果可知，该虚拟机开启了多个端口，并且每个端口都运行不同的 Web 应用程序

![2.png](https://i.loli.net/2020/06/05/xIUXyhjsbRg2oJQ.png) 

![3.png](https://i.loli.net/2020/06/05/x79blMDAwvH6Tdg.png) 

通过作者的提示：

<pre><code class="line-numbers">Enumeration is key and bruteforcing SSH will get you banned.
</code></pre>

因此使用 `dirb` 工具来进行目录枚举，一段时间后我们得到了许多信息

```
`80`	`http://192.168.1.101/administrator/`  
		`http://192.168.1.101/plugins/`  
		`http://192.168.1.101/php.ini (CODE:403|SIZE:278)`  
		`http://192.168.1.101/index.php (CODE:200|SIZE:74)`  
		`http://192.168.1.101/.config (CODE:403|SIZE:278)`  
		
`8080` 	`http://192.168.1.101:8080/.bash_history (CODE:200|SIZE:0)`  
		`http://192.168.1.101:8080/.bashrc (CODE:200|SIZE:3771)`  
		`http://192.168.1.101:8080/file.php (CODE:200|SIZE:93)`  

`9000`  `http://192.168.1.101:9000/.htaccess (CODE:200|SIZE:2956)`  
```

虽然看似暴露的信息挺多，但我们还是要过滤一番，因为总有浑水摸鱼的 ( •̀ ω •́ )

经过一段时间的探索还是找不到可利用的点，此时想到虚拟机开了这么多端口，并且运行不同的程序，想必就是来混淆视听的，因此我们应该看看还有没有开放的端口（重开了虚拟机，IP 地址变成了 `192.168.1.107` ）

![5.png](https://i.loli.net/2020/06/05/9mUOzqfyrHW3BYG.png) 

果然，我们漏掉了 **8999** 端口

![6.png](https://i.loli.net/2020/06/05/uOGjtZ7n5Taxwgb.png) 

其中 _WPA-01.cap_ 文件可疑，并且用户所有者是 _root_

使用 Wireshark 分析，发现该数据包是捕获的采用 IEEE 802.11 协议工作的 WLAN，因此我们可以使用下面的命令来破解密码

<pre><code class="language-bash line-numbers">aircrack-ng -w /usr/share/wordlists/rockyou.txt WPA-01.cap
</code></pre>

![7.png](https://i.loli.net/2020/06/05/v9yuP2BtORS1rfK.png) 

使用 SSID （`dlink`）作为账户， Key （`p4ssword`）作为密码尝试登录系统，发现可以登录

### Getshell

上传 _LinEnum.sh_ 收集信息，知道该系统有三个用户 `ck-00`、`victim01`和 `dlink`，并且 `ck-00` 在 sudo 用户组

![8.png](https://i.loli.net/2020/06/05/ZETIoMcGydfVF58.png) 

![9.png](https://i.loli.net/2020/06/05/MueP5X4mJQaZ6Tt.png) 

![10.png](https://i.loli.net/2020/06/05/Pm7AjLSTakEn8zI.png) 

很不幸 ，`/tmp/script.sh`不存在，并且 `/usr/bin/TryHarder!` 也是假的。为了收集更多信息，上传 `pspy64` 程序查看下当前系统进程

![14.png](https://i.loli.net/2020/06/05/N8s4Jn3v6dGBfaE.png) 

### 提权

虽然知道 _root_ 账户下有定时任务，但是对于执行的脚本我们并没有写权限。既然对于运行的脚本没有写权限，那么我们找一下当前账户下可以写入的目录

<pre><code class="language-bash line-numbers">find / -writable -type d 2&gt;/dev/null
</code></pre>

![11.png](https://i.loli.net/2020/06/05/zfd26RDZs1ik7rN.png) 

看来我们可以在网站目录下写入文件，并且该目录用户组是 _root_，这样就可以写入 PHP 文件来拿到更高权限

![13.png](https://i.loli.net/2020/06/05/biJhGsyzOtWIQxK.png) 

Kali 端监听 **5566** 端口，一旦浏览器访问 `http://192.168.1.107:9000/files/getshell.php`就会反弹 shell

![12.png](https://i.loli.net/2020/06/05/zvE3oO2qVnIyetf.png)
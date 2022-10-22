---
layout: post
title: "AES ECB 模式攻击"
date: 2020-09-28
author: 2hanx
categories: [Note]
tags: [ctf]
---

对称/分组密码一般分为流加密(如OFB、CFB等)和块加密(如ECB、CBC等)，对于流加密，需要将分组密码转化为流模式工作；对于块加密(或称分组加密)，如果要加密超过块大小的数据，就需要涉及填充和链加密模式

**Advanced Encryption Standard（AES）**高级加密标准，是典型的块加密，有5种加密模式，其中使用最广泛的是 ECB 模式

## ECB 模式加密过程

电码本模式（Electronic Codebook Book (ECB)）：这种模式是将整个明文分成若干段相同的小段，每组的大小跟加密密钥长度相同，然后每组都用相同的密钥进行加密

![1]({{ '/aes-ecb-attack/aes-ecb-attack_1.png' | prepend: site.url }})


其中明文分块长度一般为**16**,或16的倍数，并且当文明长度不足16，或16的倍数时，将会进行填充

## 本地测试

使用 python twisted 库构建一个服务器程序

### 服务器端代码 

```python
#!/usr/bin/env python2
# -*- coding: utf-8 -*-
# filename: server.py
from twisted.internet import reactor, protocol
from Crypto.Cipher import AES

PORT = 8001
KEY = "@Ecb_aTTack>esew"
SECRET = "flag{ese@qq!hooray}"


def encrypt_block(key, plaintext):
    """
    key: 相同的加密秘钥
    plaintext: 相同长度的明文块
    """
    encobj = AES.new(key, AES.MODE_ECB)
    return encobj.encrypt(plaintext).encode('hex')


def encrypt(key, ptxt):
    """
    ptxt: 输入的明文
    如果明文块不满16B，则使用 * 号填充
    """
    if (len(ptxt) % 16 != 0):
        ptxt = ptxt + "*" * (16 - (len(ptxt) % 16))
    return encrypt_block(key, ptxt)

class Server(protocol.Protocol):

    def connectionMade(self):
        msg = '''
        Welcome to the AES_ECB Cryptography System
        To encrypt, enter "encrypt [plaintext]". Ex, encrypt 123
        1. cliphertext = plaintext + SECRET
        2. this padding is *      
        \r\n>'''
        self.transport.write(msg)

    def dataReceived(self, data):
        try:
            data = data.strip().split(" ")
            print(data)
            if data[0] == "encrypt":
                # 在用户输入的数据后面加上变量SECRET的值
                response = encrypt(KEY, data[1] + SECRET)
            else:
                raise
            self.transport.write(">" + response + "\r\n>")
        except:
            self.transport.write(">Something is wrong here\r\n>")


def main():
    factory = protocol.ServerFactory()
    factory.protocol = Server
    reactor.listenTCP(PORT, factory)
    reactor.run()


if __name__ == '__main__':
    main()
```

### 确定 SECRET 长度

根据 ECB 的加密原理可以知道，相同的明文块加密后得到的也是相同的密文块。因此我们输入 `encrypt aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` ，得到的密文中 `4f41ee8a60e859118bd54bcfe6a23fc04f41ee8a60e859118bd54bcfe6a23fc04a4c43aa0d91f3a4906047558d0d55900a4ee9a08b34507e1440c7a261cd26a6`中`[1-32]`位与 `[33-64]` 位是相同的，并且可以知道 `SECRET ` 的长度在 17-32 位之间，大致如下：

![2]({{ '/aes-ecb-attack/aes-ecb-attack_2.png' | prepend: site.url }})

当输入的 `a` 达到 14 位时，密文长度首次比之前增加了32位，可以得知明文块比之前多了一块，并且我们知道分块的明文长度是16位，因此在第3块明文块中的第一个即是 `SECRET `的最后一位，因此可以确认 `SECRET`长度为 **19**

### 爆破 SECRET 字符串

之前提到相同的明文块加密后的密文块相同，反应到密文就是会出现相同的一串字符。因此通过枚举加密，只要在密文首尾出现两段相同的字符串，我们就可以爆破出 `SECRET`。图示如下

![3]({{ '/aes-ecb-attack/aes-ecb-attack_3.png' | prepend: site.url }})

### exp

```python
import socket
import re

host = '127.0.0.1'
port = 8001


def Tostr(st):
    return st.encode(encoding='UTF8')


def connect():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    return s


def getCliphertext(data):
    p1 = r"(>)(.*?)(\r\n)"
    pattern1 = re.compile(p1)
    data = pattern1.findall(data)[0][1]
    return data


def get_pad_len(s):
    s.recv(1024)
    for i in range(1, 16):
        payload1 = "encrypt " + 'a' * i
        s.send(Tostr(payload1))
        data = (s.recv(1024)).decode('utf-8')
        data = getCliphertext(data)
        if i == 1:
            slen = len(data)
        if len(data) > slen:
            break
    return i - 1


def forcerFlag(s, slen):
    padd = 'a' * (slen + 1)
    plaintext = ""
    print("start...")
    array = "`1234567890-=+qwertyuiop[]asdfghjkl;'zxcvbnm,./?<>!@#$%^&*()QWERTYUIOP{}ASDFGHJKLZXCVBNM:"
    for i in range(19):
        for ch in array:
            payload2 = "encrypt " + ch + plaintext + '*' * 15 + padd
            s.send(Tostr(payload2))
            data = (s.recv(1024)).decode('utf-8')
            data = getCliphertext(data)
            bp = data[:32]
            sec = data[96:128]
            if bp == sec:
                plaintext = ch + plaintext
                print(plaintext)
                break
    return plaintext


def exp():
    s = connect()
    slen = get_pad_len(s)
    plaintext = forcerFlag(s, slen)
    print(plaintext)


if __name__ == '__main__':
    exp()
```

## 实例： DownUnderCTF 2020（Extra Cool Block Chaining ）

> Everyone knows ECB is broken because it lacks diffusion. That's why I've
> come up with my own variant that uses IVs and chaining and all that 
> cool stuff! It solves all the problems ECB had... I think

### 源码分析

```python
#!/usr/bin/env python3
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Util.strxor import strxor
from os import urandom

flag = open('./flag.txt', 'rb').read().strip()
KEY = urandom(16)
IV = urandom(16)

def encrypt(msg, key, iv):
    # 填充16个字符
    msg = pad(msg, 16)
    blocks = [msg[i:i+16] for i in range(0, len(msg), 16)]
    out = b''
    for i, block in enumerate(blocks):
        # 分块加密
        cipher = AES.new(key, AES.MODE_ECB)
        enc = cipher.encrypt(block)
        if i > 0:
            enc = strxor(enc, out[-16:])
        out += enc
    # 与 iv 异或
    return strxor(out, iv*(i+1))

def decrypt(ct, key, iv):
    blocks = [ct[i:i+16] for i in range(0, len(ct), 16)]
    out = b''
    for i, block in enumerate(blocks):
        dec = strxor(block, iv)
        if i > 0:
            dec = strxor(dec, ct[(i-1)*16:i*16])
        cipher = AES.new(key, AES.MODE_ECB)
        dec = cipher.decrypt(dec)
        out += dec
    return out

flag_enc = encrypt(flag, KEY, IV).hex()

print('Welcome! You get 1 block of encryption and 1 block of decryption.')
print('Here is the ciphertext for some message you might like to read:', flag_enc)

try:
    pt = bytes.fromhex(input('Enter plaintext to encrypt (hex): '))
    pt = pt[:16] # only allow one block of encryption
    enc = encrypt(pt, KEY, IV)
    print(enc.hex())
except:
    print('Invalid plaintext! :(')
    exit()

try:
    ct = bytes.fromhex(input('Enter ciphertext to decrypt (hex): '))
    ct = ct[:16] # only allow one block of decryption
    dec = decrypt(ct, KEY, IV)
    print(dec.hex())
except:
    print('Invalid ciphertext! :(')
    exit()

print('Goodbye! :)')
```

#### 加密过程

根据 `encrypt(msg, key, iv)`加密函数，可以绘制出加密流程图

![4]({{ '/aes-ecb-attack/aes-ecb-attack_4.png' | prepend: site.url }})

#### 解密过程

同理根据 `decrypt(ct, key, iv)`解密函数绘制解密流程图

![5]({{ '/aes-ecb-attack/aes-ecb-attack_5.png' | prepend: site.url }})

但是根据加密流程可以发现解密流程有误，正确的解密流程应该是

![6]({{ '/aes-ecb-attack/aes-ecb-attack_6.png' | prepend: site.url }})

但幸运的是，我们可以解密首 **16** 字节的 flag，剩下的 flag 则需要知道 **IV** 才能破解出来。那么如何知道 **IV** 的值呢，我们把目光放在加密函数上，首先将传入的明文传入 `pad()`函数里来填充16个字符，并且 `pad()`函数使用 [PCKS#7](https://en.wikipedia.org/wiki/Padding_(cryptography)#PKCS#5_and_PKCS#7) 填充

>  每个添加的字节的值是添加的字节数，即 N 个字节，每个值 N 被添加，并且添加的字节数将取决于消息需要扩展到的块边界

简而言之，AES 明文块为 16 位，填充的字节则是 `\x10`，大致如下

![7]({{ '/aes-ecb-attack/aes-ecb-attack_7.png' | prepend: site.url }})

得到 **IV** 后根据正确的解密流程解密即可

### exp

```python
from pwn import remote, xor
from Crypto.Util.Padding import unpad

def connect():
    return remote('chal.duc.tf', 30201)

def recv(conn):
    o = conn.recvline().decode()
    print('[<]', o)
    return o

def send(conn, data):
    print('[>]', data)
    conn.sendline(data)

flag = b''

### retrieve first 16 bytes of the flag
conn = connect()
recv(conn)
ciphertext = recv(conn).split('read: ')[1]
num_blocks = len(ciphertext)//32
send(conn, 'aa'*16)
recv(conn)
send(conn, ciphertext[:32])
flag += bytes.fromhex(recv(conn).split(': ')[1])
conn.close()

### retrieve rest of the flag
for i in range(1, num_blocks):
    conn = connect()
    recv(conn)
    ciphertext = bytes.fromhex(recv(conn).split('read: ')[1])
    # recover IV by sending b'\x10'*16
    send(conn, (b'\x10'*16).hex())
    IV = bytes.fromhex(recv(conn).strip()[-32:])
    print(IV)
    to_decrypt = xor(xor(IV, ciphertext[(i-1)*16:i*16]), ciphertext[i*16:(i+1)*16])
    send(conn, to_decrypt.hex())
    flag += bytes.fromhex(recv(conn).split(': ')[1])
    conn.close()

print('[*]', unpad(flag, 16).decode())
```

#### 脚本执行过程

{% raw %}
```bash
[+] Opening connection to chal.duc.tf on port 30201: Done
[<] Welcome! You get 1 block of encryption and 1 block of decryption.

[<] Here is the ciphertext for some message you might like to read: 5d830ed3e280998bb807d0f60013bad6f27ab6b27107976b34e4107cb22f5a266cfe50e975a9bec1131f0284db895b677142208f29429abcb3785213e5b32f3cafa9704586c7761921aa811d44f883fd384af5de40245506bfc4b8e64cc5ffa0

[>] aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
[<] Enter plaintext to encrypt (hex): b9570fb1e832c231e14288169866205c01491412b3f905c1eaa439f11e2d1484

[>] 5d830ed3e280998bb807d0f60013bad6
[<] Enter ciphertext to decrypt (hex): 44554354467b346444316e475f72346e

[*] Closed connection to chal.duc.tf port 30201
[+] Opening connection to chal.duc.tf on port 30201: Done
[<] Welcome! You get 1 block of encryption and 1 block of decryption.

[<] Here is the ciphertext for some message you might like to read: a4c59f634603d276b78ac5fd03f4aeb93805e1b6e379d4fa2d36629aa91877341fdafa4f6b1db7f6a3b48810a6510a447f28b748421c84be8fac982b41fe4344c1c43d4503f56189cdef5d1c51817521f81247c4a8faa8dc5e191fb5465479a7

[>] 10101010101010101010101010101010
[<] Enter plaintext to encrypt (hex): e15de94fbf1b73d852631f679c4a25e5767722292750512a01ebd5c24b1f8c51

b'vw")\'PQ*\x01\xeb\xd5\xc2K\x1f\x8cQ'
[>] eab75cfc822a57a69b5772a5e1f355dc
[<] Enter ciphertext to decrypt (hex): 64304d5f3472523077735f344e445f78

[*] Closed connection to chal.duc.tf port 30201
[+] Opening connection to chal.duc.tf on port 30201: Done
[<] Welcome! You get 1 block of encryption and 1 block of decryption.

[<] Here is the ciphertext for some message you might like to read: 6ccbcd71d29a531e5be6cd1ad0551783072d281648132d5b1ba9cd29a742372d57bfa05002c691942a4f9f3d21bc644f24c5d4bb3ea06d9829c45073dec95ad0eefcbaee5c6f5cec990fa9293450994209246fd62c5030bc6567dcc3192918e5

[>] 10101010101010101010101010101010
[<] Enter plaintext to encrypt (hex): 9cc7bc6077827143dc026a61119b8f660b3171339bc1596d6097c4dadb7c55da

b'\x0b1q3\x9b\xc1Ym`\x97\xc4\xda\xdb|U\xda'
[>] 5ba3f975d114e5a2517196ce5d8206b8
[<] Enter ciphertext to decrypt (hex): 3052535f683372335f346e445f746833

[*] Closed connection to chal.duc.tf port 30201
[+] Opening connection to chal.duc.tf on port 30201: Done
[<] Welcome! You get 1 block of encryption and 1 block of decryption.

[<] Here is the ciphertext for some message you might like to read: eac44cf5ec0ddada0a33f9aa72ca89b32fbed72da06c33f3ca1ce02a58566ce9db97b3e8385089f7b42d3dbb492954ce03961c825cc50e67212611fbd76db1737d8d4c7f71d43a23680270916f02c376d4f6a9ec8946e55fba894d5af13e52fe

[>] 10101010101010101010101010101010
[<] Enter plaintext to encrypt (hex): aef912b471b823b529b3f115e988bd530312603bc0a2c7609026a1a979457d44

b'\x03\x12`;\xc0\xa2\xc7`\x90&\xa1\xa9yE}D'
[>] db13cf51a43740f0052d8de9e70198f9
[<] Enter ciphertext to decrypt (hex): 52335f553575344c6c795f48336c7073

[*] Closed connection to chal.duc.tf port 30201
[+] Opening connection to chal.duc.tf on port 30201: Done
[<] Welcome! You get 1 block of encryption and 1 block of decryption.

[<] Here is the ciphertext for some message you might like to read: a0ffe77a7c43995c6ee97a8bca3e97800a64e049e1b03792969cbab552fb0e0c2f36d41670c79a598e96efc3776906db4afc789c3e34b41f4c46cd3026391c3c367a6b16c3b545187186c8fe478b7b52dac9bd057fe2f034657c13a2f04b95c7

[>] 10101010101010101010101010101010
[<] Enter plaintext to encrypt (hex): 102f9320f56a35b473e1438e570c19281fe0709c507b44a7b8d8e5c660a592f2

b'\x1f\xe0p\x9cP{D\xa7\xb8\xd8\xe5\xc6`\xa5\x92\xf2'
[>] 63666316adfab5a08518e0080117f59c
[<] Enter ciphertext to decrypt (hex): 5f4275375f6e30545f374831735f7431

[*] Closed connection to chal.duc.tf port 30201
[+] Opening connection to chal.duc.tf on port 30201: Done
[<] Welcome! You get 1 block of encryption and 1 block of decryption.

[<] Here is the ciphertext for some message you might like to read: 3f374fd9618743d1df13984a4b6447fde1e6d4b559db7e892ae7c36bb13a2d0bcbaaf9414c272e0f29a9a0bc6f9612101da89c989372c4ec7797ce9249d444ed1d2508544d46ec6ca3ef15a5684563f32a38eba5fc8d98e69b49ca74f04b17c6

[>] 10101010101010101010101010101010
[<] Enter plaintext to encrypt (hex): b7a06d05443fd44ff3dd5671d1f36e8e81807c524889c4ceedd00e4962fe42f5

b'\x81\x80|RH\x89\xc4\xce\xed\xd0\x0eIb\xfeB\xf5'
[>] b69d9fa3f942b044d576d198faf036c0
[<] Enter ciphertext to decrypt (hex): 6d335f69375f7333336d7321217d0202

[*] Closed connection to chal.duc.tf port 30201
[*] DUCTF{4dD1nG_r4nd0M_4rR0ws_4ND_x0RS_h3r3_4nD_th3R3_U5u4Lly_H3lps_Bu7_n0T_7H1s_t1m3_i7_s33ms!!}
```
{% endraw %}

## Ref.

- [本地测试原文](https://www.jianshu.com/p/8aef410a2eae)
- [ecbc writeup](https://www.josephsurin.me/posts/2020-09-20-downunderctf-2020-writeups#ecbc)
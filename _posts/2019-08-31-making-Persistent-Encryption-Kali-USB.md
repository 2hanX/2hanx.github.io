---
title: 制作持久加密Kali USB
date: 2019-08-31T18:36:18+08:00
author: 2hanx
layout: post
categories:
  - Kali
tags:
  - software
---
### 1. 使用工具将镜像刻录到U盘

  * [win32diskimager](https://sourceforge.net/projects/win32diskimager/)

### 2.启动kali进入 Live USB Persistence模式

```shell
# 新建新分区
fdisk -l
fdisk /dev/sda
n
p
w
fdisk -l
```

### 3. 在新创建的分区上初始化LUKS加密

```bash
cryptsetup --verbose --verify-passphrase luksFormat /dev/sda3
cryptsetup luksOpen /dev/sda3 my_usb
```

### 4.创建 ext4 文件系统，并将其标记为“持久性“

```bash
mkfs.ext4 -L persistence /dev/mapper/my_usb 
e2label /dev/mapper/my_usb persistence
```

### 5. 挂载新加密分区，设置**persistence.conf**文件

```bash
mkdir -p /mnt/my_usb 
mount /dev/mapper /my_usb /mnt/my_usb 
echo "/ union" &gt; /mnt/my_usb/persistence.conf 
umount /dev/mapper/my_usb
```

### 6. 关闭加密通道

`cryptsetup luksClose /dev/mapper/my_usb`

#### Ref.

  * [Kali official docs](https://docs.kali.org/downloading/kali-linux-live-usb-persistence)
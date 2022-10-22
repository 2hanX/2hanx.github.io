---
layout: post
title: "TokyoWesterns CTF Writeups"
date: 2020-09-25
author: 2hanx
categories: [Writeups]
tags: [ctf]
---

## urlcheck v1

### 源码分析

{% raw %}
```python
import os, re, requests, flask
from urllib.parse import urlparse

app = flask.Flask(__name__)
app.flag = '***CENSORED***'
app.re_ip = re.compile('\A(\d+)\.(\d+)\.(\d+)\.(\d+)\Z')

def valid_ip(ip):
	matches = app.re_ip.match(ip)
	if matches == None:
		return False

	ip = list(map(int, matches.groups()))
	if any(i > 255 for i in ip) == True:
		return False
	# Stay out of my private!
	if ip[0] in [0, 10, 127] \
		or (ip[0] == 172 and (ip[1] > 15 or ip[1] < 32)) \
		or (ip[0] == 169 and ip[1] == 254) \
		or (ip[0] == 192 and ip[1] == 168):
		return False
	return True

def get(url, recursive_count=0):
	r = requests.get(url, allow_redirects=False)
	if 'location' in r.headers:
		if recursive_count > 2:
			return '&#x1f914;'
		url = r.headers.get('location')
		if valid_ip(urlparse(url).netloc) == False:
			return '&#x1f914;'
		return get(url, recursive_count + 1) 
	return r.text

@app.route('/admin-status')
def admin_status():
	if flask.request.remote_addr != '127.0.0.1':
		return '&#x1f97a;'
	return app.flag

@app.route('/check-status')
def check_status():
	url = flask.request.args.get('url', '')
	if valid_ip(urlparse(url).netloc) == False:
		return '&#x1f97a;'
	return get(url)

@app.route('/')
def index():
	return '''
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css">
  <script src="https://cdn.jsdelivr.net/npm/vue"></script>
</head>
<body>
	<div id="app" class="container">
	  <h1>urlcheck v1</h1>
	  <div class="input-group input-group-lg mb-3">
		<input v-model="url" placeholder="e.g.) http://11.45.148.93/" class="form-control">
		<div class="input-group-append">
		  <button v-on:click="checkStatus" class="btn btn-primary">check</button>
		</div>
	  </div>
	  <div v-if="status" class="alert alert-info">{{ d(status) }}</div>
	</div>
	<script>
	  new Vue({
		el: '#app',
		data: {url: '', status: ''},
		methods: {
		  d: function (s) {
			let t = document.createElement('textarea')
			t.innerHTML = s
			return t.value
		  },
		  checkStatus: function () {
			fetch('/check-status?url=' + this.url)
			  .then((r) => r.text())
			  .then((r) => {
				this.status = r
			  })
		  }
		}
	  })
	</script>
</body>
</html>
'''
```
{% endraw %}

经过分析，用户输入框输入的 url 传递给 `/check-status?url=` 参数，服务端接收到 url ，进行 `valid_ip(urlparse(url).netloc) == False` 判断，因此只需要绕过 `valid_ip()` 函数，使得执行后面的 `get()` 函数即可获得 flag。此外，`valid_ip()` 函数中对 IP 地址进行了严格过滤，并且在 `admin-status()` 函数中明确 IP 地址为 `127.0.0.1`，因此使用**IP地址的八进制表示法**即可绕过

### payload

![3]({{ '/tokyowesterns/tokyowesterns_3.png' | prepend: site.url }})

## urlcheck v2

### 源码分析


{% raw %}
```python
import os, re, time, ipaddress, socket, requests, flask
from urllib.parse import urlparse

app = flask.Flask(__name__)
app.flag = '***CENSORED***'

def valid_ip(ip):
	try:
		result = ipaddress.ip_address(ip)
		# Stay out of my private!
		return result.is_global
	except:
		return False

def valid_fqdn(fqdn):
	return valid_ip(socket.gethostbyname(fqdn))

def get(url, recursive_count=0):
	r = requests.get(url, allow_redirects=False)
	if 'location' in r.headers:
		if recursive_count > 2:
			return '&#x1f914;'
		url = r.headers.get('location')
		if valid_fqdn(urlparse(url).netloc) == False:
			return '&#x1f914;'
		return get(url, recursive_count + 1)
	return r.text

@app.route('/admin-status')
def admin_status():
	print('Remote Address:', flask.request.remote_addr)
	if flask.request.remote_addr != '127.0.0.1':
		return '&#x1f97a;'
	return app.flag

@app.route('/check-status')
def check_status():
	url = flask.request.args.get('url', '')
	if valid_fqdn(urlparse(url).netloc) == False:
		return '&#x1f97a;'
	return get(url)

@app.route('/')
def index():
	return '''
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css">
  <script src="https://cdn.jsdelivr.net/npm/vue"></script>
</head>
<body>
	<div id="app" class="container">
	  <h1>urlcheck v2</h1>
	  <div class="input-group input-group-lg mb-3">
		<input v-model="url" placeholder="e.g.) http://westerns.tokyo/" class="form-control">
		<div class="input-group-append">
		  <button v-on:click="checkStatus" class="btn btn-primary">check</button>
		</div>
	  </div>
	  <div v-if="status" class="alert alert-info">{{ d(status) }}</div>
	</div>
	<script>
	  new Vue({
		el: '#app',
		data: {url: '', status: ''},
		methods: {
		  d: function (s) {
			let t = document.createElement('textarea')
			t.innerHTML = s
			return t.value
		  },
		  checkStatus: function () {
			fetch('/check-status?url=' + this.url)
			  .then((r) => r.text())
			  .then((r) => {
				this.status = r
			  })
		  }
		}
	  })
	</script>
</body>
</html>
'''
```
{% endraw %}

前面部分与 urlcheck v1 相同，不同的地方在于服务器端做了 DNS 查询，并且只支持公网地址，另外想要获取 flag，必须访问 `127.0.0.1/admin-status` 私有地址。因此该题主要考查的是 **DNS Rebinding（DNS重绑定）**攻击

Google 查询找到已经部署好的[地址](https://lock.cmpxchg8b.com/rebinder.html)，将题目地址的IP地址填在 **B** 中

![1]({{ '/tokyowesterns/tokyowesterns_1.png' | prepend: site.url }})

### payload

![2]({{ '/tokyowesterns/tokyowesterns_2.png' | prepend: site.url }})

## easy-hash 

### 源码分析

```python
import struct
import os

MSG = b'twctf: please give me the flag of 2020'

assert os.environ['FLAG']

def easy_hash(x):
    m = 0
    for i in range(len(x) - 3):
        m += struct.unpack('<I', x[i:i + 4])[0]
        m = m & 0xffffffff

    return m

def index(request):
    message = request.get_data()
    if message[0:7] != b'twctf: ' or message[-4:] != b'2020':
        return b'invalid message format: ' + message

    if message == MSG:
        return b'dont cheet'

    msg_hash = easy_hash(message)
    expected_hash = easy_hash(MSG)
    if msg_hash == expected_hash:
        return 'Congrats! The flag is ' + "HERE IS THE FLAG"
    return 'Failed: easy_hash({}) is {}. but expected value is {}.'.format(message, msg_hash, expected_hash)
```

分析源码可以知道，只要 `easy_hash(message) == easy_hash(MSG)` 即可，但是 `message` 不能和 `MSG(twctf: please give me the flag of 2020)`字符串相同

此外，`easy_hash()` 函数将字符串分割为每**4**个字符一组，循环相加每4个字符的十进制值，最后再判断是否相等。因此修改其中两个字符，使得相加结果不变即可

### payload

`curl https://crypto01.chal.ctf.westerns.tokyo -d 'twctf: oleate give me the flag of 2020'`

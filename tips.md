### jekyll 支持代码高亮种类

- console
- conf
- json
- python
- shell
- http
- javascript

Ref.
 - [supported languages](https://github.com/rouge-ruby/rouge/wiki/List-of-supported-languages-and-lexers)


### POST 页面编辑

1. 启用 latex

`math: true`

2. 置顶文章

`pin: true`

3. 启用 Toc

`toc: true`

4. 使用分类

`categories` 分类里需要**首字母大写**, `tags`使用小写


```
---
title: helloworld
author: 2hanx
date: 2020-08-08 11:33:00 +0800
categories: [Crypto]
tags: [typography]
math: true
pin: true
toc: true
image: /assets/img/sample/devices-mockup.png
---
```

### 启用latex需要注意的地方

在latex代码首位出添加如下代理可以实现换行

```latex
\begin{aligned}
...
\end{aligned}
```

此外单行渲染需要添加两个`$$`,并且上下文需隔开一个空行

每次上传到 GitHub 时，最好删除 `.jekyll-cache` 文件夹
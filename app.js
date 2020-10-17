---
layout: compress
# Chirpy v2.2
# https://github.com/cotes2020/jekyll-theme-chirpy
# 漏 2020 Cotes Chung
# MIT Licensed
---

/* Registering Service Worker */
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('{{ "/sw.js" | relative_url }}');
};
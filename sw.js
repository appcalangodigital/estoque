// Service worker do Controle de Obras
// Estratégia: sempre tenta a internet primeiro (assim as atualizações chegam logo);
// se estiver sem sinal, usa a última cópia guardada. Os dados do servidor NÃO passam por aqui.
var V = "obras-v8";
var ARQUIVOS = ["./", "index.html", "config.js", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== self.location.origin) return; // servidor e bibliotecas externas: direto da internet
  e.respondWith(
    fetch(r).then(function (res) {
      if (res && res.ok && res.type === "basic") {
        var copia = res.clone();
        caches.open(V).then(function (c) { c.put(r, copia); });
      }
      return res;
    }).catch(function () {
      return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match("index.html"); });
    })
  );
});

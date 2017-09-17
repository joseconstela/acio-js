---
title: Introduction
keywords: sample homepage
sidebar: main_sidebar
permalink: index.html
summary: 
---

## What is Acio.js?

It's an open source JavaScript distributed computing system for browsers. It allows run JavaScript tasks across multiple browsers via its library.

The jobs run securely and goes unnoticeable for the browser's final user.

Acio.js library can run multiple jobs in multiple processors making the most of each browser captabilities.

## How does it work?

Apart from the database - where the jobs and their results are stored - Acio-js is formed by other elements: the library, the jobs server and the admin panel.

The library uses web sockets [1] to deliver jobs and collect results, web workers [2] for client-side secure code execution and indexedDB [3] for storage.

When a browser loads the library, configured to point to an specific server address:

1. It connects to the jobs server.
2. Loads pending jobs from the browser storage system - or asks for a new job to the server.
3. Performs the job in the browser.
4. Sends the results back to the jobs server via result
5. Depending on result parameters, the server can send another job to the client, or the client can be added to an available pool of clients waiting for new jobs.

## Things to know

**Database:** It uses MongoDB. The schemas for the collections are available at acio-js-panel/common/collections.

**Jobs server:** It's a NodeJS web server using express[4]. Available at acio-js repository.

**Web Workers:** on the browsers, JavaScript jobs code runs inside web workers, a browsers feature to run DOM-independent javascript code with the security and performance improvements that entails.

**Web Sockets:** used for low-latency communication. Acio-js uses socket.io.

**Web Storage:** Acio-js uses a disponibility fallback for choosing a storage system. In most cases - as of modern browsers - the solution to use is indexedDB [3].

## How to embed the library?

Simple. Just add the following code to the website or web application:

```
<script>
  var worker = new Worker('/lib.js');
  worker.postMessage('endpoint.http://localhost:3000');
  worker.postMessage('start');
</script>
```

## How to manage jobs?

Jobs and results can be managed via acio-js-panel, an administration panel built in MeteorJS. Visit its repository for instructions on how to install.

## Where can I ready about the topic?

- Collaborative Map-Reduce in the Browser
- MRJS: A JavaScript MapReduce Framework for Web Browse - Sandy Ryza & Tom Wall
- Data-Intensive Scalable Computing - Brown University Course resources
# 介绍
最简单大文件上传demo，尽量地优化缩减逻辑。

# 使用说明
1. 运行node服务：进入server目录的终端，运行 node index.js
2. 运行前端服务：进入project目录的终端，运行 npm run dev

# 前置知识
1. spark-md5这个库是用来计算文件hash值的，服务端靠这个hash值来对比是否同一个文件
2. input上传框选择后，得到的是files文件，并不能直接上传到服务器，file基于blob
3. blob才是原始的文件对象，二进制对象，用来存储图象音频等，通过请求的formdata传递给服务端的就是这个blob，而不是file
4. 调用blob.slice，可能像数组一样，进行切割
5. Web Worker，HTML5给出的api，主要是开启一个独立线程去处理任务，不会阻塞主线程任务，例如超大文件需要hash计算，可能需要用到webworker

```javascript
// webworker简单案例
// 主线程代码
const worker = new Worker('worker.js');

// 向 Web Worker 发送消息
worker.postMessage({ type: 'sort', data: [5, 3, 8, 1, 4] });

// 监听来自 Web Worker 的消息
worker.onmessage = function(event) {
  console.log('排序结果：', event.data);
};

// worker.js 中的 Web Worker 代码
// worker.js
self.onmessage = function(event) {
  if (event.data.type === 'sort') {
    const sortedData = event.data.data.sort((a, b) => a - b);
    self.postMessage(sortedData);
  }
};
```

# 单文件/大文件上传逻辑
这里面包含秒传、断点续传的基本功能了，只是大致理解整个流程，更完事复杂的，看别人的demo

1. 选择文件
2. 对文件进行切割，并计算文件hash值，这一步有些人用webwork，有的用promise，看情况超大文件下肯定是webwork更好
 - 2.1 进行文件切割分片
 - 2.2 准备空的blob数组存储新的分片，新分片才是用来计算hash的，如果用整个旧分片数组进行hash计算，可能会很耗时，所以新分片只计算头尾的切片，中间的分片
 - 2.3 使用FileReader对新分片进行读取，读取完成就使用spark-md5进行hash值计算，
3. 得到文件hash，进行服务端查询是否有上传记录，
 - 3.1 有且完成上传，则是秒传，
 - 3.2 有记录但没完成则得到已上传的切片记录，过滤已上传的切片
4. 对切片进行循环上传，这里要用到队列和最大上传数，因为浏览器是最大6个并行请求
 - 4.1 根据切片，创建请求，推进队列
 - 4.2 使用Promise.race监听队列完成进度，剔除完成的任务
5. 所有的切片完成后，通知服务端合并文件，整个流程完成

# 多文件/大文件
多文件上传过于复杂，理解上面的单文件上传的整体逻辑，平时使用到项目中cv修改就可以了，过于深究业务问题没有必要。
案例一： https://juejin.cn/post/7385098943942934582?searchId=202407102104304ED248465FEBA828B00F#heading-1 有web worker
案例二：https://juejin.cn/post/7200033099752407097 有逻辑图
更多案例代码，上掘金
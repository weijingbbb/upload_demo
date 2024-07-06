<script setup lang="ts">
import SparkMd5 from 'spark-md5';
import { ref } from 'vue';

const baseUrl = 'http://localhost:3000'
// 限定的大小为 1M
const CHUNK_SIZE = 1024 * 1024
const fileHash = ref('')
const fileName = ref('')


const handleUpload = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if(!files) return

  // 文件分片
  const chunks = createChunks(files[0])
  // 计算hash值
  const hash = await calculateHash(chunks)
  fileHash.value = hash as string
  fileName.value = files[0].name
  console.log(hash)

  const { data: { shouldUpload, existChnks = [] } } = await verifyUpload()
  console.log('shouldUpload，是否上传过了：', shouldUpload)
  if(shouldUpload) {
    alert('上传成功')
    return
  } 
  // 上传
  uploadChunks(chunks, existChnks)
}

// 进行文件分片
const createChunks = (file: File) => {
  let cur = 0
  let chunks = []

  while (cur < file.size) {
    const blob = file.slice(cur, cur + CHUNK_SIZE)
    chunks.push(blob)
    cur += CHUNK_SIZE
  }
  return chunks
}

// 计算hash值
// 1. 第一个和最后一个的切片全部参与计算
// 2. 中间的切片，只计算前面两个字节，中间两个字节，最后两个字节
const calculateHash = (chunks: Blob[]) => {
 return new Promise((resolve) => {
   // 存储计算的切片
   const targets: Blob[] = []
  const spark = new SparkMd5.ArrayBuffer()
  const fileReader = new FileReader()

  chunks.forEach((chunk, index)=> {
    if(index === 0 || index === chunks.length -1){
      //  第一个和最后一个的切片全部参与计算
      targets.push(chunk)
    }else {
      // 中间的切片，前面、中间、最后两个字节
      targets.push(chunk.slice(0, 2))
      targets.push(chunk.slice(CHUNK_SIZE / 2, CHUNK_SIZE / 2 + 2))
      targets.push(chunk.slice(CHUNK_SIZE - 2, CHUNK_SIZE))
    }
  })

  fileReader.readAsArrayBuffer(new Blob(targets))
  fileReader.onload = (e) => {
    spark.append((e.target as FileReader).result as unknown as ArrayBuffer)
    // 拿到计算出来的hash值
    resolve(spark.end())
  }
 })
}

// 上传文件, chunks原始切片，existChnks服务上存在的切片
const uploadChunks = async (chunks: Blob[], existChnks: any []) => {
  const data = chunks.map((chunk, index)=> {
    return {
      fileHash: fileHash.value,
      // fileName: fileName.value,
      chunkHash: fileHash.value + '_' + index,
      chunk
    }
  })

  console.log(data, existChnks)

  // filter，过滤掉已经上传的切片，就是断点续传
  const formDatas = data.filter((item) => !existChnks.includes(item.chunkHash)).map(item => {
    const formData = new FormData()

    formData.append('fileHash', item.fileHash)
    formData.append('chunkHash', item.chunkHash)
    formData.append('chunk', item.chunk)

    return formData
  })

  // 最大并发请求数
  const max = 6
  let index = 0
  // 请求池，最多6个
  const taskPool: any = []
  while (index < formDatas.length) {
    const task = fetch(baseUrl + '/upload', {
      method: 'POST',
      body: formDatas[index]
    })
    taskPool.slice(taskPool.findIndex((item: any) => item === task))
    taskPool.push(task)
    if(taskPool.length === max){
      await Promise.race(taskPool)
    }
    index ++
  }

  await Promise.all(taskPool)
  // 所有切片上传完成后，通知服务器合并文件
  mergeRequest()

}

const mergeRequest = () => {
  fetch(baseUrl + '/merge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        fileHash: fileHash.value,
        fileName: fileName.value,
        size: CHUNK_SIZE
      })
    }).then(()=> {
      console.log('合并成功')
    })
}

// 验证该文件是否需要上传，文件通过hash生成唯一，即使改名后也是不需要再上传的，也就相当于秒传
const verifyUpload = async () => {
  return fetch(baseUrl + '/verify', {
    method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        fileHash: fileHash.value,
        fileName: fileName.value,
      })
  })
  .then(res => res.json())
  .then(data => data)
}

</script>

<template>
  <h1>大文件上传</h1>
  <input
    placeholder="选择文件"
    @change="handleUpload"
    type="file"
  />
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>

const express = require('express')
const path = require('path')
const multiparty = require('multiparty');
const fse = require('fs-extra');
const cors = require('cors');
const bodyParser = require('body-parser');

// 上传的文件存放到目录下
const UPLOAD_DIR = path.resolve(__dirname, 'upload')
// 提取文件后缀名
const extractExt = fileName => fileName.slice(fileName.lastIndexOf('.', fileName.length))

const app = express();

app.use(bodyParser.json());
app.use(cors());

// 处理上传的分片
app.post('/upload',  function(req, res) {
    const form = new multiparty.Form()
    form.parse(req, async (err, fileds, files) => {
        if(err) {
            console.log('错误信息：',err);
            res.status(401).json({
                ok: false,
                msg: '上传失败，请重新上传'
            })
            return
        }
        // console.log('fileds---:',fileds);
        // console.log('files---:',files);
        const fileHash = fileds['fileHash'][0]
        const chunkHash = fileds['chunkHash'][0]

        // 临时存放目录
        const chunkDir = path.resolve(UPLOAD_DIR, fileHash)
        console.log('是否有目录：', fse.existsSync(chunkDir));
        // 如果没有此目录，则创建
        // if (!fse.existsSync(chunkDir)) {
        //     await fse.mkdir(chunkDir)
        // }
        fse.ensureDirSync(chunkDir)
        const oldPath = files['chunk'][0]['path']
        // 将切片放到这个文件夹中
        await fse.move(oldPath, path.resolve(chunkDir, chunkHash))

        res.status(200).json({
            ok: true,
            msg: '上传成功'
        })
    })
})

app.post('/merge', async (req, res) => {
    const { fileHash, fileName, size } = req.body
    console.log(fileHash, fileName, size);

    // 如果文件已存在，没必要合并了
    const filePath = path.resolve(UPLOAD_DIR, fileHash + extractExt(fileName))

    if(fse.pathExistsSync(filePath)){
        res.status(200).json({
            ok: true,
            msg: '文件合并成功'
        })
        return
    }

    // 文件不存在，合并
    const chunkDir =  path.resolve(UPLOAD_DIR, fileHash)
    if (!fse.existsSync(chunkDir)) {
        res.status(200).json({
            ok: true,
            msg: '合并失败，请重新上传。'
        })
        return
    }

    // 合并操作
    const chunkPaths = await fse.readdir(chunkDir)
    chunkPaths.sort((a, b)=>{
        return a.split('-')[1] - b.split('-')[1];
    })
    const list = chunkPaths.map((chunkName, index) => {
       return new Promise(resolve => {
        const chunkpath = path.resolve(chunkDir, chunkName)
        const readStream = fse.createReadStream(chunkpath)
        const writeStream = fse.createWriteStream(filePath, {
            start: index * size,
            end: (index + 1) * size
        })
        readStream.on('end', async () => {
            await fse.unlink(chunkpath)
            resolve()
        })
        readStream.pipe(writeStream)
       })
    })

    await Promise.all(list)
    // 移除临时文件
    await fse.remove(chunkDir)
    res.status(200).json({
        ok: true,
        msg: '文件合并成功'
    })
})

app.post('/verify', async (req, res) => {
    const { fileHash, fileName } = req.body

    const filePath = path.resolve(UPLOAD_DIR, fileHash + extractExt(fileName))

    // 返回服务器上，已经上传成功的切片
    const chunkDir = path.join(UPLOAD_DIR, fileHash)
     
    // 如果存在对应的临时文件夹，才去读取
    let chunkPaths = []
    if(fse.existsSync(chunkDir)){
        chunkPaths = await fse.readdir(chunkDir)
    }

    // 如果存在，不用上传了
    if(fse.existsSync(filePath)){
        res.status(200).json({
            ok: true,
            data: {
                shouldUpload: true,
            }
        })
    }else {
        res.status(200).json({
            ok: true,
            data: {
                shouldUpload: false,
                existChnks: chunkPaths
            }
        })
    }
})


app.listen(3000, () => {
    console.log('开启了服务');
})
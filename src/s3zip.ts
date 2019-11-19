import archiver from 'archiver'
import stream from 'stream'
import fs from 'fs'
import util from 'util'


function checkFileAccess(path: string) {
  return util.promisify(fs.access)(path, fs.constants.F_OK)
}

export async function zipDirToBuffer(dirPath: string): Promise<Buffer> {
  await checkFileAccess(dirPath)
  return new Promise(resolve => {
    const chunks: any[] = []
    const output = new stream.Writable({
      write(chunk, encoding, next) {
        chunks.push(chunk)
        next();
      }
    })
    output.on('finish', () => {
      resolve(Buffer.concat(chunks))
    })
    const archive = archiver('zip')
    archive.pipe(output)
    archive.directory(dirPath, false)
    archive.finalize()
  })
}


import { S3 } from 'aws-sdk'
const s3 = new S3()

export async function zipAndPushToS3(localDir: string, bucket: string, key: string) {
  console.log('Zipping dir', localDir)
  const buffer = await zipDirToBuffer(localDir)
  console.log('Uploading to S3 bucket', bucket, 'key', key)
  const req = {
    Body: buffer,
    Bucket: bucket,
    Key: key
  }
  return await s3.putObject(req).promise()
}

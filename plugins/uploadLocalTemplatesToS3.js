const fs = require('fs')
const util = require('util')
const { S3 } = require('aws-sdk')
const crypto = require('crypto')

function sha1hash(bytes) {
  const buf = crypto.createHash('sha1').update(bytes).digest()
  const sar = []
  for (let i = 0; i < buf.length; i++) {
    const c = buf[i].toString(16)
    sar.push(`00${c}`.substr(-2))
  }
  return sar.join('')
}

async function uploadFileToS3(file, bucket, key) {
  const data = await util.promisify(fs.readFile)(file)
  const req = {
    Body: data,
    Bucket: bucket,
    Key: key
  }
  return s3.putObject(req).promise()
}

const s3 = new S3()
module.exports = function uploadLocalTemplatesToS3(bucket, prefix) {
  const tplNs = prefix || sha1hash(crypto.randomBytes(l16))
  return {
    beforeDeploy(doc) {
      const uploads = Object.keys(doc.Resources).map(async k => {
        const res = doc.Resources[k]
        if (res.Type == 'AWS::CloudFormation::Stack') {
          const file = res.Properties.TemplateURL
          const key = `${tplNs}/${file}`
          await uploadFileToS3(file, bucket, key)
          res.Properties.TemplateURL = `http://${bucket}.s3.amazonaws.com/${key}`
        }
      })
      return Promise.all(uploads)
    }
  }
}
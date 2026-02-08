const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios').default

const PORT = process.env.PORT || 80
const HOST = '0.0.0.0'

const APPID = process.env.WX_APPID
const APPSECRET = process.env.WX_APPSECRET

let tokenCache = { access_token: '', expire_at: 0 }

async function fetchAccessToken() {
  if (tokenCache.access_token && Date.now() < tokenCache.expire_at - 60_000) {
    return tokenCache.access_token
  }
  if (!APPID || !APPSECRET) {
    throw new Error('Missing WX_APPID or WX_APPSECRET env')
  }
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`
  const { data } = await axios.get(url)
  if (!data.access_token) {
    throw new Error(`Get access_token failed: ${JSON.stringify(data)}`)
  }
  tokenCache = {
    access_token: data.access_token,
    expire_at: Date.now() + (data.expires_in || 7200) * 1000
  }
  return tokenCache.access_token
}

const app = express()

app.use(bodyParser.raw({ type: '*/*' }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

function parseBody(req) {
  const ct = (req.headers['content-type'] || '').toLowerCase()
  if (ct.includes('application/json')) return req.body
  if (ct.includes('application/xml') || ct.includes('text/xml')) {
    return { xml: req.body.toString('utf-8') }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf-8'))
    } catch {
      return { raw: req.body.toString('utf-8') }
    }
  }
  return req.body
}

app.all('/foo/bar', async (req, res) => {
  try {
    const headers = req.headers
    const body = parseBody(req)

    if (body && body.action === 'CheckContainerPath') {
      res.send('success')
      return
    }

    const openid = headers['x-wx-openid']
    if (!openid) {
      res.send('success')
      return
    }

    const payload = {
      touser: openid,
      msgtype: 'text',
      text: {
        content: `云托管接收消息推送成功，内容如下：\n${JSON.stringify(body, null, 2)}`
      }
    }

    async function sendOnce() {
      const access_token = await fetchAccessToken()
      const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`
      return axios.post(url, payload)
    }

    let result = await sendOnce()
    if (result.data && (result.data.errcode === 40001 || result.data.errcode === 41001)) {
      tokenCache = { access_token: '', expire_at: 0 }
      result = await sendOnce()
    }

    res.send('success')
  } catch (err) {
    res.send('success')
  }
})

app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`)
})

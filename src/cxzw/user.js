const superagent = require('superagent')
const md5 = require('md5')
const moment = require('moment')

const servicecode = 'cxwxgz'
const servicepwd = 'cxwxgzpwd'
const BASE_URL = `https://puser.zjzwfw.gov.cn/sso/servlet/simpleauth?servicecode=${servicecode}&datatype=json`

function md5sign () {
  const time = moment(new Date()).format('YYYYMMDDHHmmss')
  const sign = md5(servicecode + servicepwd + time)
  
  return {
    time,
    sign
  }
}

function stringify (params = {}) {
  return Object.keys(params).map(key => {
    let value = params[key]
    if (value == null) {
      value = ''
    }
    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
  }).join('&')
}

function handleResult (res) {
  res = JSON.parse(res)

  const result = {
    code: 0,
    msg: 'success',
    data: ''
  }
  
  if (res.result !== '0') {
    result.code = res.result
    result.msg = res.errmsg
  } else {
    result.data = res
  }

  return result
}

function getApi (params = {}) {
  const api = BASE_URL + '&' + stringify(params)
  console.log(api)
  return api
}

exports.ticketValidation = async st => {
  const { time, sign } = md5sign()

  const api = getApi({
    time,
    sign,
    method: 'ticketValidation',
    st
  })

  const res = await superagent.get(api)
  return handleResult(res.text)
}

exports.idValidation = async (loginname, password) => {
  const { time, sign } = md5sign()

  const api = getApi({
    time,
    sign,
    method: 'idValidation',
    encryptiontype: 1,
    loginname,
    password
  })

  const res = await superagent.get(api)
  return handleResult(res.text)
}

exports.getUserInfo = async token => {
  const { time, sign } = md5sign()

  const api = getApi({
    time,
    sign,
    method: 'getUserInfo',
    token
  })

  const res = await superagent.get(api)
  return handleResult(res.text)
}
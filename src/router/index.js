const Router = require('@koa/router')
const superagent = require('superagent')
const wxconfig = require('../config/wx.config')
const pkg = require('../../package.json')
const db = require('../db/query')
const cxzw = require('../cxzw')

const router = new Router()

const APP_NAME = pkg.name.split('-')[0]
const APP_ID = wxconfig.appid
const APP_SECRET = wxconfig.appsecret
const WXCALLBAK_URL = '//localhost:3000/wxcallbak'

// test
router.get('/', async (ctx, next) => {
	const res = await db.query('select * from tab_news where id = 1 and status = 1')
  ctx.body = 'hello ' + APP_NAME + ' ' + res[0].title
})

// 获取首页区块信息
router.get('/getMenuList', async (ctx, next) => {
  const { type } = ctx.query
  try {
    const res = await db.query(`select * from tab_home where type = '${type}' and status = 1`)
    ctx.success(res)
  } catch (error) {
    ctx.failed(error)
  }
})

// 获取首页新闻
router.get('/getNewsList', async (ctx, next) => {
  try {
    const res = await db.query(`select * from tab_news where status = 1`)
    ctx.success(res)
  } catch (error) {
    ctx.failed(error)
  }
})

// 查询办事事件详情
router.get('/getProjectByFlowSN', async (ctx, next) => {
  const { id } = ctx.query
  try {
    const res = await cxzw.getProjectByFlowSN(id)
    if (res.code === 0) {
      ctx.success(res.data)
    } else {
      ctx.failed(res.msg)
    }
  } catch (error) {
    ctx.failed(error)
  }
})

// 查询办事事件详情
router.get('/getProjectDetail', async (ctx, next) => {
  const { id } = ctx.query
  try {
    const res = await cxzw.getProjectDetail(id)
    if (res.code === 0) {
      ctx.success(res.data)
    } else {
      ctx.failed(res.msg)
    }
  } catch (error) {
    ctx.failed(error)
  }
})

// 获取微信用户信息
router.get('/appUserInfo', (ctx, next) => {
	if (ctx.session.user) {
		ctx.success(ctx.session.user)
	} else {
    ctx.failed()
  }
})

// 微信授权
router.get('/wxoauth', (ctx, next) => {
  const { from = '' } = ctx.query
  const redirect = encodeURIComponent(WXCALLBAK_URL + '?from=' + from)
  const url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + APP_ID +
    '&redirect_uri=' + redirect +
    '&response_type=code' +
    '&scope=snsapi_userinfo' +
    '&state=STATE#wechat_redirect'

  ctx.response.redirect(url)
})

// 微信授权回调
router.get('/wxcallback', async (ctx, next) => {
  const { from, code } = ctx.query
  if (!from) from = '/'

  // 1.通过code换取网页授权access_token
  const result = await superagent.get('https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + APP_ID +
    '&secret=' + APP_SECRET +
    '&code=' + code +
    '&grant_type=authorization_code')

  const { access_token, openid } = JSON.parse(result)

  // 2.拉取微信用户信息
  const res = await superagent.get(
    'https://api.weixin.qq.com/sns/userinfo?access_token=' + access_token +
      '&openid=' + openid +
      '&lang=zh_CN')

	const wxUserInfo = JSON.parse(res)
	if (wxUserInfo) {
		const { openid, nickname, headimgurl, sex } = wxUserInfo
		const appUserInfo = {
			openid,
			nickname,
			headimgurl,
			sex
		}
		// 3.缓存用户信息
		ctx.session.user = appUserInfo
	}
	
	// 重定向到来源页
	ctx.response.redirect(from)
})

module.exports = router
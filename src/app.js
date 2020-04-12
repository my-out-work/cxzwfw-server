const Koa = require('koa')
const Router = require('@koa/router')
const superagent = require('superagent')
const Koa_Session = require('koa-session')
const middleware_response = require('./middlewares/response')
const pkg = require('../package.json')
const wxconfig = require('../../config/cxzwfw.wx.config')


const app = new Koa()
const router = new Router()
const db = require('./db/query')

const APP_NAME = pkg.name.split('-')[0]
const APP_ID = wxconfig.appid
const APP_SECRET = wxconfig.appsecret
const WXCALLBAK_URL = '//localhost:3000/wxcallbak'

// test
router.get('/', async (ctx, next) => {
	const res = await db.query('select * from tab_news where id = 1 and status = 1')
  ctx.body = 'hello ' + APP_NAME + ' ' + res[0].title
})

// 获取微信登陆状态
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

// 配置session
app.keys = [pkg.name]
const session_config = {
  key: 'koa:' + APP_NAME, /**  cookie的key。 (默认是 koa:sess) */
  maxAge: 3 * 24 * 60 * 60 * 1000,   /**  session 过期时间，以毫秒ms为单位计算 。*/
  autoCommit: true, /** 自动提交到响应头。(默认是 true) */
  overwrite: true, /** 是否允许重写 。(默认是 true) */
  httpOnly: true, /** 是否设置HttpOnly，如果在Cookie中设置了"HttpOnly"属性，那么通过程序(JS脚本、Applet等)将无法读取到Cookie信息，这样能有效的防止XSS攻击。  (默认 true) */
  signed: true, /** 是否签名。(默认是 true) */
  rolling: true, /** 是否每次响应时刷新Session的有效期。(默认是 false) */
  renew: false, /** 是否在Session快过期时刷新Session的有效期。(默认是 false) */
}
const session = Koa_Session(session_config, app)

app.use(session)
	.use(middleware_response)
  .use(router.routes())
  .listen(1001)

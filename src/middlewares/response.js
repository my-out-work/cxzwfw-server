module.exports = async function (ctx, next) {
  ctx.success = data => {
    ctx.body = {
      code: 0,
      msg: 'success',
      data
    }
  }

  ctx.failed = (msg = 'failed', code = 1, data = '') => {
    ctx.body = {
      code,
      msg,
      data
    }
  }
  
  await next()
}
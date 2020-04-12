module.exports = async function (ctx, next) {
  ctx.success = data => {
    ctx.body = {
      code: 0,
      msg: 'success',
      data
    }
  }

  ctx.failed = (msg = 'failed', data = '') => {
    ctx.body = {
      code: -1,
      msg,
      data
    }
  }
  
  await next()
}
const superagent = require('superagent')

const BASE_URL = 'https://yc.huzhou.gov.cn:8088/wsdt/rest/hzqueueAppointment'

function handleResult (res) {
  res = JSON.parse(res)

  const result = {
    code: 0,
    msg: 'success',
    data: ''
  }

  if (res.ReturnInfo && res.ReturnInfo.Code != 1) {
    result.code = 101
    result.msg = res.ReturnInfo.Description
  } else if (res.BusinessInfo && res.BusinessInfo.Code != 1) {
    result.code = 102
    result.msg = res.BusinessInfo.Description
  } else {
    result.data = res.UserArea
  }

  return result
}
/**
 * 办事查询编号
 * "FlowSN": "办件流水号",
 */
const getProjectByFlowSN = BASE_URL + '/AuditProject/GetProjectByFlowSN'

exports.getProjectByFlowSN = async FlowSN => {
  const res = await superagent.post(getProjectByFlowSN).send({
    FlowSN
  }).set('Accept', 'application/json')
  console.log(res)
  return handleResult(res.text)
}

/**
 *办事查询详情
  *"ProjectGuid": "办件guid",  //上一个接口的返回
  */
const getProjectDetail = BASE_URL + '/AuditProject/getProjectDetail'

exports.getProjectDetail = async ProjectGuid => {
  const res = await superagent.post(getProjectDetail).send({
    ProjectGuid
  }).set('Accept', 'application/json')
  return handleResult(res.text)
}

const _ = require('lodash')
const httpUtils = require('../../utils/commons')
const ctp = require('../../utils/ctp')
const {
  processNotification,
} = require('../../handler/notification/notification.handler')
const config = require('../../config/config')
const logger = require('../../utils/logger').getLogger()

// TODO: add JSON schema validation:
// https://github.com/commercetools/commercetools-adyen-integration/issues/9
async function handleNotification(request, response) {
  if (request.method !== 'POST') return httpUtils.sendResponse(response)
  const body = await httpUtils.collectRequestData(request)
  try {
    const notifications = _.get(JSON.parse(body), 'notificationItems', [])
    for (const notification of notifications) {
      const ctpProjectKey =
        notification.NotificationRequestItem.additionalData[
          'metadata.commercetoolsProjectKey'
        ]
      const adyenMerchantAccount =
        notification.NotificationRequestItem.merchantAccountCode
      const ctpProjectConfig = config.getCtpConfig(ctpProjectKey)
      const adyenConfig = config.getAdyenConfig(adyenMerchantAccount)
      const ctpClient = ctp.get(ctpProjectConfig)

      await processNotification(
        notification,
        adyenConfig.enableHmacSignature,
        ctpClient
      )
    }
    return sendAcceptedResponse(response)
  } catch (err) {
    logger.error(
      { adyenRequestBody: `${body}`, err },
      'Unexpected exception occurred.'
    )
    return httpUtils.sendResponse(response, 500)
  }
}

function sendAcceptedResponse(response) {
  // From the Adyen docs:
  // To ensure that your server is properly accepting notifications,
  // we require you to acknowledge every notification of any type with an [accepted] response.

  return httpUtils.sendResponse(
    response,
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({ notificationResponse: '[accepted]' })
  )
}

module.exports = { handleNotification }

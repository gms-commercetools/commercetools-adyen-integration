/**
 * If you are deploying extension module as a serverless function,
 * this will be the main javascript file.
 *
 * This function has tested as Google Cloud Function
 *
 * Entry point: notificationTrigger
 */

const ctp = require('./src/utils/ctp')
const handler = require('./src/handler/notification/notification.handler')
const config = require('./src/config/config')()
const logger = require('./src/utils/logger').getLogger()
const { getNotificationForTracking } = require('./src/utils/commons')

const ctpClient = ctp.get(config)

exports.notificationTrigger = async (request, response) => {
  try {
    await handler.processNotifications(
      request.body.notificationItems,
      ctpClient
    )
    response.status(200).send({
      notificationResponse: '[accepted]',
    })
  } catch (e) {
    logger.error(
      {
        notification: getNotificationForTracking(
          request.body.notificationItems
        ),
        err: e,
      },
      'Unexpected error when processing event'
    )
    throw e
  }
}

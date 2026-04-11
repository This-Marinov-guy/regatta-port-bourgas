import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { getAwsRegion, getRegistrationEventsTopicArn } from './config'
import type { RegistrationCreatedMessage } from './types'

const snsClient = new SNSClient({ region: getAwsRegion() })

export async function publishRegistrationCreated(
  message: RegistrationCreatedMessage
) {
  const topicArn = getRegistrationEventsTopicArn()

  if (!topicArn) {
    console.warn(
      'AWS_REGISTRATION_EVENTS_TOPIC_ARN is not configured; registration jobs were not enqueued.'
    )
    return
  }

  await snsClient.send(
    new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(message),
      Subject: 'registration.created',
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: 'registration.created',
        },
      },
    })
  )
}


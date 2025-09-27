const { Expo } = require('expo-server-sdk');

// Create new Expo SDK client
let expo = new Expo();

async function sendPushNotification(tokens, title, body, data = {}) {
  // Ensure tokens is always an array
  if (!Array.isArray(tokens)) tokens = [tokens];

  // Build messages
  let messages = [];
  for (let pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    });
  }

  // Send chunks
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  try {
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }

  return tickets;
}

module.exports = { sendPushNotification };

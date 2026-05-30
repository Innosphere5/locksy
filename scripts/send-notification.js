/**
 * SEND NOTIFICATION SCRIPT (Node.js)
 * 
 * This script uses the Firebase Admin SDK to send a push notification to a specific device.
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const registrationToken = process.argv[2];
const customTitle = process.argv[3] || 'Locksy';
const customBody = process.argv[4] || 'how are you sohel?';

if (!registrationToken) {
  console.error('Error: Please provide a registration token as an argument.');
  console.log('Usage: node scripts/send-notification.js <YOUR_FCM_TOKEN> [TITLE] [BODY]');
  process.exit(1);
}

const message = {
  notification: {
    title: customTitle,
    body: customBody
  },
  data: {
    screen: 'Chats',
    userId: '12345'
  },
  android: {
    notification: {
      channelId: 'default',
      priority: 'high',
      sound: 'default'
    }
  },
  token: registrationToken
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Successfully sent message:', response);
    console.log(`Message: "${customTitle}: ${customBody}" sent to token: ${registrationToken}`);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });

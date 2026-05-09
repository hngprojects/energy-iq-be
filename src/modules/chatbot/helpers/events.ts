/**
 * `ChatbotSocketEvents` can be sent from the client to the server and in the reverse direction.
 * Some events
 */
export const ChatbotSocketEvents = {
  EDITING_MESSAGE_START: 'edit_message_start',
  EDITING_MESSAGE_STOP: 'edit_message_stop',
  NEW_SYSTEM_MESSAGE: 'new_system_msg', // sent to the client when the user gets a reply from the chatbot
  SEND_MESSAGE: 'send_msg', // sent from the client to the server when the uer sends a message
};

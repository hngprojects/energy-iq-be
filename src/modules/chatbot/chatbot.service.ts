import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatbotService {
  constructor() {}

  /**
   * Tools the chatbot should be able to use:
   *
   * fetch and display alert details
   * read, understand, summarize and communicate alert details
   * recommend steps to take to fix an alert problem
   * infer the language the user is using
   */
  fetchMostRecentAlertDetails() {}

  recommendFixesForAlert() {}

  inferUserLanguage() {}
}

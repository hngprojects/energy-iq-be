import { tool } from 'langchain';
import { z } from 'zod';

export const fetchAlertDetails = tool(
  (): Promise<string> => Promise.resolve('json object input'),
  {
    name: 'fetch_text_from_url',
    description: 'Fetch the document from a URL.',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the document to fetch.',
          format: 'uri',
        },
      },
      required: ['url'],
    },
  },
);

export const summarizeAlertDetails = tool(() => `normal object input`, {
  name: 'fetch_text_from_url',
  description: 'Fetch the document from a URL.',
  schema: z.object({ url: z.string().url() }),
});

export const recommendFixes = tool(() => `normal object input`, {
  name: 'fetch_text_from_url',
  description: 'Fetch the document from a URL.',
  schema: z.object({ url: z.string().url() }),
});

export const inferLanguageFromMessage = tool(() => `normal object input`, {
  name: 'fetch_text_from_url',
  description: 'Fetch the document from a URL.',
  schema: z.object({ url: z.string().url() }),
});

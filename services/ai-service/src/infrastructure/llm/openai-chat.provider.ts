import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatProvider } from '../../domain/qa/ports';

@Injectable()
export class OpenAiChatProvider implements ChatProvider {
  private readonly client: OpenAI;
  private readonly chatModel: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
      baseURL: this.configService.get<string>('OPENAI_BASE_URL') || undefined,
    });

    this.chatModel = this.configService.get<string>('OPENAI_CHAT_MODEL', 'gpt-4o-mini');
  }

  async answerQuestion(input: {
    systemPrompt: string;
    userPrompt: string;
  }): Promise<{ answer: string; inputTokens: number; outputTokens: number; model: string }> {
    const completion = await this.client.chat.completions.create({
      model: this.chatModel,
      temperature: 0.1,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userPrompt },
      ],
    });

    const firstMessage = completion.choices[0]?.message?.content;
    const answer = typeof firstMessage === 'string' ? firstMessage.trim() : '';

    return {
      answer,
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
      model: completion.model,
    };
  }
}

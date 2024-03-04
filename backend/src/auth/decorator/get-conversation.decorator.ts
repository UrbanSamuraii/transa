import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetConversationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.params.conversationId as string;
  },
);
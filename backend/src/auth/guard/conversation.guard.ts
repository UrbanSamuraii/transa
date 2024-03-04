// import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
// import { ConversationsService } from 'src/conversations/conversations.service';

// @Injectable()
// export class ConversationGuard implements CanActivate {

//   constructor(private readonly conversationsService: ConversationsService) { }

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
// 	  console.log({"REQUEST USER from Guard":request.user});
// 	  const userId = request.user.sub;
// 	  const conversationId = request.params.id;
// 	  console.log({"CONV ID GUARD ": conversationId});
// 	  return (this.conversationsService.isOwnerOfTheConversation(Number(userId), Number(conversationId)));
//   }

//   handleRequest(err: any, user: any, info: any) {
//     if (err || !user) {
//       throw err || new UnauthorizedException("You can't set up a Password on this conversation as your not its owner mtf");
//     }
//     return user;
//   }
// }
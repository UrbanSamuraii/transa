import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { MembersService } from 'src/members/members.service';

@Injectable()
export class AdminGuard implements CanActivate {

  constructor(private readonly memberService: MembersService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // console.log({"REQUEST USER from Guard":request.user});
    const userId = request.user.sub;
    const conversationId = request.params.id;
    // console.log({"CONV ID GUARD ": conversationId});
    return (this.memberService.isAdmin(Number(conversationId), Number(userId)));
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
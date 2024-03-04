import { WsException } from '@nestjs/websockets';

type WsExceptionType = 'BadRequest' | 'Unauthorized' | 'Not Found' | 'Unknown';

export class WsTypeException extends WsException {
  readonly type: WsExceptionType;

  constructor(
    type: WsExceptionType,
    message: string | unknown,
    data?: { chatroomId: string },
  ) {
    const error = {
      type,
      message,
      data,
    };
    super(error);
    this.type = type;
  }
}

export class WsBadRequestException extends WsTypeException {
  constructor(message: string | unknown, data?: { chatroomId: string }) {
    super('BadRequest', message, data);
  }
}

export class WsUnauthorizedException extends WsTypeException {
  constructor(message: string | unknown, data?: { chatroomId: string }) {
    super('Unauthorized', message, data);
  }
}

export class WsNotFoundException extends WsTypeException {
  constructor(message: string | unknown, data?: { chatroomId: string }) {
    super('Not Found', message, data);
  }
}

export class WsUnknownException extends WsTypeException {
  constructor(message: string | unknown, data?: { chatroomId: string }) {
    super('Unknown', message, data);
  }
}

export class WsUserNotFoundException extends WsNotFoundException {
  constructor(data?: { chatroomId: string }) {
    super('User Not Found', data);
  }
}

export class WsChatroomNotFoundException extends WsNotFoundException {
  constructor(data?: { chatroomId: string }) {
    super('Chatroom Not Found', data);
  }
}

export class WsGameNotFoundException extends WsNotFoundException {
  constructor(data?: { chatroomId: string }) {
    super('Game Not Found', data);
  }
}
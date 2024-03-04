import { Injectable } from "@nestjs/common";
import { AuthenticatedSocket } from "../utils/interfaces";


export interface IGatewaySessionManager {
    getUserSocket(userId: Number): AuthenticatedSocket;
    setUserSocket(userId: Number, socket: AuthenticatedSocket): void;
    removeUserSocket(userId: Number): void;
    getSockets(): Map<Number, AuthenticatedSocket>;
}

@Injectable()
export class GatewaySessionManager implements IGatewaySessionManager {

    private readonly sessions: Map<Number, AuthenticatedSocket> = new Map();

    getUserSocket(userId: Number) {
        return this.sessions.get(userId);
    }

    setUserSocket(userId: Number, socket: AuthenticatedSocket) {
        this.sessions.set(userId, socket);
    }

    removeUserSocket(userId: Number) {
        this.sessions.delete(userId);
    }

    getSockets(): Map<Number, AuthenticatedSocket> {
        return this.sessions;
    }
}
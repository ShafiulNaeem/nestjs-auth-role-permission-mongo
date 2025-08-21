import { Injectable } from '@nestjs/common';
import { Request } from 'express';

interface AuthDataType {
    userId: string,
    name: string,
    email: string
}

export class Auth {
    private static _request: Request;

    public static setRequest(req: Request) {
        this._request = req;
    }

    public static getRequest(): Request {
        return this._request;
    }

    public static check() {
        return !!this._request?.user;
    }

    public static user() {
        return this._request?.user;
    }

    public static id() {
        const userData = this._request?.user as AuthDataType;
        return userData?.userId;
    }
}

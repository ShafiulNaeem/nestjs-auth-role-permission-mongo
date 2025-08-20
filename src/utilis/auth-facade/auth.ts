import { Injectable } from '@nestjs/common';
import { Request } from 'express';

export class Auth {
    private static _request: Request;

    public static setRequest(req: Request) {
        this._request = req;
    }

    public static getRequest(): Request {
        return this._request;
    }

    public static user() {
        return this._request?.user;
    }

    public static check() {
        return !!this._request?.user;
    }
}

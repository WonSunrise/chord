'use strict';

import * as r from 'request';

export type CookieJar = r.CookieJar;
export type Cookie = r.Cookie;


export function makeCookieJar(): CookieJar {
    return r.jar();
}

export function makeCookies(rawCookies: Array<string>, jar?: CookieJar): Array<Cookie> {
    let cookies = rawCookies.map(rawCookie => makeCookieFrom(rawCookie));
    return cookies;
}

export function makeCookie(key: string, value: string, domain?: string): Cookie {
    let s = `${key}=${value}; domain=${domain ? domain : ''}`;
    return makeCookieFrom(s);
}

export function makeCookieFrom(input: string): Cookie {
    return r.cookie(input);
}

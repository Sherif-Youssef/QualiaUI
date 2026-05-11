export type SameSite = 'Lax' | 'None' | 'Strict';

export interface Cookie {
    id?: number;
    name: string;
    value: string;
    url?: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: SameSite;
    partitionKey?: string;
}

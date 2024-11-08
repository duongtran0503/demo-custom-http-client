import http from 'http';
export interface RequestOptions<T> extends http.RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    queryParameters?: Record<string, string>;
    body?: T;
}

export interface httpResponse<T> {
    data: T;
    status?: number;
    statusMessage?: string;
    headers: Record<string, string>;
}

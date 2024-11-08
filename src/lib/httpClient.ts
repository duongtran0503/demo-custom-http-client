import https from 'https';
import http from 'http';
import { RequestOptions, httpResponse } from '@/lib/httpType';

export class HttpClient {
    private baseURL?: string;

    constructor(baseURL?: string) {
        this.baseURL = baseURL;
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    private buildUrl(path: string, queryParameters?: Record<string, string>) {
        let url = this.baseURL || '';
        if (url && !url.endsWith('/')) {
            url += '/';
        }
        url += path;
        if (queryParameters) {
            const queryParams = new URLSearchParams(
                Object.entries(queryParameters)
            );
            url += `?${queryParams.toString()}`;
        }
        return url;
    }

    private buildRequestOptions<T>(
        method: RequestOptions<T>['method'],
        options: RequestOptions<T>
    ): RequestOptions<T> {
        const requestOptions: RequestOptions<T> = {
            method,
            headers: { ...options.headers, 'Content-Type': 'application/json' },
        };

        if (options.body) {
            requestOptions.headers!['Content-Type'] = 'application/json';
        }

        return requestOptions;
    }

    private async sendRequest<T>(
        url: string,
        options: RequestOptions<T>
    ): Promise<httpResponse<T>> {
        if (!this.isValidUrl(url)) {
            return Promise.reject(new Error(`Invalid URL provided: ${url}`));
        }

        const protocol = url.startsWith('http:') ? http : https;
        return new Promise((resolve, reject) => {
            try {
                const request = protocol.request(url, options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        if (
                            res.statusCode &&
                            res.statusCode >= 200 &&
                            res.statusCode < 300
                        ) {
                            const headers = Object.fromEntries(
                                Object.entries(res.headers).map(
                                    ([key, value]) => [
                                        key,
                                        Array.isArray(value)
                                            ? value.join(', ')
                                            : value || '',
                                    ]
                                )
                            ) as Record<string, string>;

                            const response: httpResponse<T> = {
                                data: JSON.parse(data),
                                status: res.statusCode,
                                statusMessage: res.statusMessage,
                                headers: headers,
                            };
                            resolve(response);
                        } else {
                            reject(
                                new Error(
                                    `Request failed with status: ${res.statusCode} ${res.statusMessage}`
                                )
                            );
                        }
                    });
                });

                request.on('error', (error) => {
                    reject(new Error(`Request error: ${error.message}`));
                });

                // Viết body nếu có
                if (options.body) {
                    request.write(JSON.stringify(options.body));
                }

                request.end();
            } catch (error) {
                reject(new Error(`Request Error: ${error}`));
            }
        });
    }

    private async send<T>(
        method: RequestOptions<T>['method'],
        path: string,
        options: RequestOptions<T>,
        body?: T
    ): Promise<httpResponse<T>> {
        const url = this.buildUrl(path, options.queryParameters);

        if (body) {
            options.body = body;
        }

        const requestOptions = this.buildRequestOptions(method, options);
        try {
            return await this.sendRequest<T>(url, requestOptions);
        } catch (error) {
            throw error;
        }
    }

    public async get<T>(
        path: string,
        options: RequestOptions<T> = { method: 'GET' }
    ) {
        return this.send<T>('GET', path, options);
    }

    public async post<T>(
        path: string,
        body: T,
        options: RequestOptions<T> = { method: 'POST' }
    ) {
        return this.send<T>('POST', path, options, body);
    }

    public async put<T>(
        path: string,
        body: T,
        options: RequestOptions<T> = { method: 'PUT' }
    ) {
        return this.send<T>('PUT', path, options, body);
    }

    public async patch<T>(
        path: string,
        body: T,
        options: RequestOptions<T> = { method: 'PATCH' }
    ) {
        return this.send<T>('PATCH', path, options, body);
    }

    public async delete<T>(
        path: string,
        options: RequestOptions<T> = { method: 'DELETE' }
    ) {
        return this.send<T>('DELETE', path, options);
    }
}

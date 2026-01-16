import type { Hook, HookOptions, RequestWithResponse, Webhook, WebhookOptions } from '../create-hook.js';
export declare function createHook<T = any>(options?: HookOptions): Hook<T>;
export declare function createWebhook(options: WebhookOptions & {
    respondWith: 'manual';
}): Webhook<RequestWithResponse>;
export declare function createWebhook(options?: WebhookOptions): Webhook<Request>;
//# sourceMappingURL=create-hook.d.ts.map
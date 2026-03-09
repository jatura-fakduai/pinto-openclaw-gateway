import type { ChannelPlugin, RuntimeEnv } from "openclaw/plugin-sdk";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk";
import { PintoPluginConfig, PintoWebhookReceiveRequest } from "./types.js";

let runtime: RuntimeEnv;

export const setPintoRuntime = (r: RuntimeEnv) => {
  runtime = r;
};

export const pintoPlugin: ChannelPlugin<any, any> & { configSchema?: any } = {
  id: "pinto",
  meta: {
    id: "pinto",
    name: "Pinto",
    label: "Pinto",
    selectionLabel: "Pinto (Chat Bot)",
    blurb: "Pinto App Thailand",
    aliases: ["pinto"],
    detailLabel: "Pinto Chat via API",
    description: "Adapter for Pinto Chat platform",
  } as any,
  configSchema: buildChannelConfigSchema({
    type: "object",
    additionalProperties: true,
    properties: {
      enabled: {
        type: "boolean",
      },
      pintoApiUrl: {
        type: "string",
        title: "Pinto API URL",
        default: "http://localhost:1323",
      },
      pintoWebhookSecret: {
        type: "string",
        title: "Webhook Secret",
      },
    },
  } as any),
  capabilities: {
    chatTypes: ["direct"],
    media: true,
    nativeCommands: false,
    reactions: false,
    threads: false,
  },

  config: {
    listAccountIds: (cfg: any) => {
      return Object.keys(cfg.channels?.pinto?.accounts || {});
    },
    resolveAccount: (cfg: any, accountId: string) => {
      const account = cfg.channels?.pinto?.accounts?.[accountId];
      return {
        id: accountId,
        config: account,
        enabled: account?.enabled ?? true,
      };
    },
    inspectAccount: (cfg: any, accountId: string) => {
      const account = cfg.channels?.pinto?.accounts?.[accountId];
      if (!account || !account.pintoApiUrl) {
        return { configured_unavailable: true };
      }
      return {
        tokenSource: "config",
        tokenStatus: "available",
      };
    },
  } as any,

  outbound: {
    deliveryMode: "direct",
    sendText: async ({ to, text, accountId, cfg }) => {
      const pintoConfig = (cfg as any)?.channels?.pinto as PintoPluginConfig;
      const pintoApiUrl = pintoConfig?.pintoApiUrl ?? "http://localhost:1323";

      const payload: PintoWebhookReceiveRequest = {
        bot_id: accountId!,
        chat_id: to,
        reply_message: text,
      };

      const res = await fetch(`${pintoApiUrl}/v1/bots/webhook/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Pinto API error: ${res.status} ${res.statusText}`);
      }

      return { channel: "pinto", messageId: Date.now().toString() };
    },

    sendMedia: async ({ to, text, mediaUrl, accountId, cfg }) => {
      const pintoConfig = (cfg as any)?.channels?.pinto as PintoPluginConfig;
      const pintoApiUrl = pintoConfig?.pintoApiUrl ?? "http://localhost:1323";

      const payload: PintoWebhookReceiveRequest = {
        bot_id: accountId!,
        chat_id: to,
        reply_message: text,
        media_url: mediaUrl,
      };

      const res = await fetch(`${pintoApiUrl}/v1/bots/webhook/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Pinto API error: ${res.status} ${res.statusText}`);
      }

      return { channel: "pinto", messageId: Date.now().toString() };
    },
  },
};

# Pinto OpenClaw Gateway Plugin

[ภาษาไทย](#ภาษาไทย) | [English](#english)

This plugin connects Pinto Chat with OpenClaw through a channel plugin. It receives inbound webhooks from Pinto, forwards them to an OpenClaw agent, and sends the agent response back to Pinto.

## ภาษาไทย

### ภาพรวม

ปลั๊กอินนี้ใช้สำหรับเชื่อมต่อ Pinto Chat เข้ากับ OpenClaw โดยมี flow หลักดังนี้

1. ผู้ใช้ส่งข้อความใน Pinto
2. Pinto API เรียก Webhook ของ OpenClaw ที่ `/plugins/pinto/webhook`
3. ปลั๊กอินส่งข้อความเข้า OpenClaw agent
4. เมื่อ agent ตอบกลับ ปลั๊กอินจะส่งข้อความกลับไปที่ Pinto API ผ่าน `POST /v1/bots/webhook/receive`

ปลั๊กอินรองรับ:

- ข้อความแบบ direct chat
- ส่งข้อความกลับพร้อม `media_url`
- การใช้ `Webhook Secret` ผ่าน header `X-Pinto-Secret`
- การตั้งค่าใน OpenClaw UI ผ่านหน้า `Channels`

### สิ่งที่ต้องมี

- OpenClaw ที่รันใช้งานได้แล้ว
- Node.js 20+ และ npm
- Pinto bot ที่สร้างไว้แล้ว
- Pinto bot ต้องมีค่าเหล่านี้
  - Bot UUID จริงในฐานข้อมูล เช่น `_id`
  - Webhook URL ที่ Pinto จะยิงเข้ามา
  - ถ้าเปิดใช้ secret ต้องมีค่าเดียวกันทั้งสองฝั่ง
- URL ที่ Pinto เข้าถึง OpenClaw ได้จริง
  - ตัวอย่าง `https://your-host.example.com/plugins/pinto/webhook`
  - หรือ Tailscale / reverse proxy ที่ชี้เข้า OpenClaw gateway

### การติดตั้ง

#### แบบพัฒนาในเครื่อง

```bash
git clone https://github.com/fakduai-logistics-and-digital-platform/pinto-openclaw-gateway.git
cd pinto-openclaw-gateway
npm install
npm run build
```

#### ติดตั้งเข้า OpenClaw

ติดตั้งจาก package name:

```bash
openclaw plugins install @fakduai/pinto-app-openclaw
```

ติดตั้งจาก local path:

```bash
openclaw plugins install .
```

ถ้าคุณใช้งานแบบคัดลอกปลั๊กอินเอง ให้แน่ใจว่าไฟล์เหล่านี้ถูกคัดลอกไปยัง extension directory ของ OpenClaw:

- `dist/`
- `openclaw.plugin.json`
- `package.json`
- `README.md`

ตัวอย่าง path:

```bash
~/.openclaw/extensions/@fakduai/pinto-app-openclaw
```

### การตั้งค่าใน OpenClaw

ตั้งค่าได้ 2 แบบ:

- ผ่าน OpenClaw UI ที่หน้า `Channels > Pinto Chat`
- ผ่าน config file ของ OpenClaw

ค่าที่ต้องกรอกมีดังนี้:

- `Api Url`
  - URL ของ Pinto API
  - ใส่ได้ทั้งแบบมี `/` ท้ายหรือไม่มี `/` ท้าย
  - ตัวอย่าง `https://api-dev.pinto-app.com`
- `Bot Id`
  - ต้องเป็น Bot UUID จริงของ Pinto
  - ไม่ใช่ `bot_id` แบบ readable เช่น `this_a_bot`
- `Enabled`
  - เปิดหรือปิด channel นี้
- `Webhook Secret`
  - ใช้ร่วมกับ header `X-Pinto-Secret`
  - ถ้าไม่ได้ตั้งค่า ระบบจะไม่บังคับตรวจ inbound secret

ตัวอย่าง config:

```json
{
  "channels": {
    "pinto": {
      "enabled": true,
      "apiUrl": "https://api-dev.pinto-app.com",
      "botId": "20387880-7934-40c3-b7d4-9fa6557697cf",
      "webhookSecret": "pinto-oc-9f3a1b7c5d2e8k4m"
    }
  }
}
```

### การตั้งค่าฝั่ง Pinto

สำหรับ Pinto bot แต่ละตัว ให้ตั้งค่าดังนี้

- `webhook_url`
  - ตัวอย่าง:
  - `https://your-host.example.com/plugins/pinto/webhook`
- Bot UUID
  - ใช้ค่า `_id` ของ bot เป็น `Bot Id` ใน OpenClaw

### เรื่อง Webhook Secret

ปลั๊กอินนี้รองรับ `X-Pinto-Secret` แบบนี้

#### Inbound: Pinto -> OpenClaw

ถ้ามีการตั้ง `Webhook Secret` ใน OpenClaw:

- Pinto ต้องส่ง header:

```http
X-Pinto-Secret: <your-secret>
```

- ถ้าค่าไม่ตรง ปลั๊กอินจะตอบ `401`

ถ้า OpenClaw ไม่มีการตั้ง `Webhook Secret`:

- ปลั๊กอินจะไม่บังคับตรวจ header นี้

#### Outbound: OpenClaw -> Pinto

เวลา OpenClaw ส่งผลลัพธ์กลับไปที่ Pinto API endpoint:

```http
POST /v1/bots/webhook/receive
```

ปลั๊กอินจะส่ง header นี้ให้อัตโนมัติ ถ้ามีการตั้งค่า secret:

```http
X-Pinto-Secret: <your-secret>
```

### Endpoint ที่เกี่ยวข้อง

#### Inbound Webhook

Pinto จะเรียก:

```http
POST /plugins/pinto/webhook
```

ตัวอย่าง request body:

```json
{
  "bot_id": "20387880-7934-40c3-b7d4-9fa6557697cf",
  "chat_id": "5f315d4e-cf22-4054-bbb0-2fe074bd3892",
  "message": "hello",
  "user_id": "a7c3fe36-cf41-42b5-a290-ca98e6129fac",
  "username": "demo-user"
}
```

#### Outbound Webhook Receive

ปลั๊กอินจะส่งกลับไปยัง Pinto:

```http
POST <apiUrl>/v1/bots/webhook/receive
```

ตัวอย่าง body:

```json
{
  "bot_id": "20387880-7934-40c3-b7d4-9fa6557697cf",
  "chat_id": "5f315d4e-cf22-4054-bbb0-2fe074bd3892",
  "reply_message": "สวัสดีจาก OpenClaw"
}
```

หรือถ้ามี media:

```json
{
  "bot_id": "20387880-7934-40c3-b7d4-9fa6557697cf",
  "chat_id": "5f315d4e-cf22-4054-bbb0-2fe074bd3892",
  "reply_message": "ดูรูปนี้",
  "media_url": "https://example.com/image.png"
}
```

### วิธีทดสอบ

#### 1. ทดสอบ inbound แบบ local

```bash
curl -i -X POST http://127.0.0.1:18789/plugins/pinto/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Pinto-Secret: pinto-oc-9f3a1b7c5d2e8k4m' \
  -d '{
    "bot_id":"20387880-7934-40c3-b7d4-9fa6557697cf",
    "chat_id":"5f315d4e-cf22-4054-bbb0-2fe074bd3892",
    "message":"hello",
    "user_id":"a7c3fe36-cf41-42b5-a290-ca98e6129fac"
  }'
```

ผลลัพธ์ที่คาดหวัง:

```json
{"message":"Message forwarded to agent"}
```

#### 2. ทดสอบ inbound แบบ public URL

```bash
curl -i -X POST https://your-host.example.com/plugins/pinto/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Pinto-Secret: pinto-oc-9f3a1b7c5d2e8k4m' \
  -d '{
    "bot_id":"20387880-7934-40c3-b7d4-9fa6557697cf",
    "chat_id":"5f315d4e-cf22-4054-bbb0-2fe074bd3892",
    "message":"hello",
    "user_id":"a7c3fe36-cf41-42b5-a290-ca98e6129fac"
  }'
```

#### 3. ทดสอบ outbound ตรงไปที่ Pinto API

```bash
curl -i -X POST https://api-dev.pinto-app.com/v1/bots/webhook/receive \
  -H 'Content-Type: application/json' \
  -H 'X-Pinto-Secret: pinto-oc-9f3a1b7c5d2e8k4m' \
  -d '{
    "bot_id":"20387880-7934-40c3-b7d4-9fa6557697cf",
    "chat_id":"5f315d4e-cf22-4054-bbb0-2fe074bd3892",
    "reply_message":"OpenClaw outbound test"
  }'
```

### ขั้นตอนเชื่อมต่อแบบแนะนำ

1. ติดตั้งปลั๊กอินและรัน `npm run build`
2. ติดตั้งปลั๊กอินเข้า OpenClaw หรือคัดลอกไปที่ extension path
3. รีสตาร์ต OpenClaw gateway
4. เปิดหน้า `Channels > Pinto Chat`
5. กรอก `Api Url`, `Bot Id`, `Webhook Secret`
6. กด `Save`
7. ตั้ง `webhook_url` ของ Pinto bot ให้ชี้มาที่ `/plugins/pinto/webhook`
8. ทดสอบด้วย `curl` ก่อน
9. ส่งข้อความจริงจาก Pinto
10. ตรวจว่าปลั๊กอินสามารถตอบกลับเข้า Pinto ได้

### Troubleshooting

#### 404 Not Found ที่ public URL

สาเหตุที่พบบ่อย:

- ยิงผิด method เช่นเปิดผ่าน browser เป็น `GET`
- reverse proxy ไม่ได้ forward มาที่ OpenClaw gateway
- path ไม่ถูก ต้องใช้ `/plugins/pinto/webhook`

#### 401 Unauthorized

สาเหตุที่พบบ่อย:

- Pinto ส่ง `X-Pinto-Secret` มาไม่ตรงกับ `Webhook Secret` ใน OpenClaw
- OpenClaw ส่ง `X-Pinto-Secret` กลับไป Pinto ไม่ตรงกับค่าที่ Pinto คาดไว้

#### 400 Invalid request body

สาเหตุที่พบบ่อย:

- ใช้ `bot_id` ผิดค่า
- ใช้ `chat_id` ผิด environment
- payload ที่ส่งไป `/v1/bots/webhook/receive` ไม่ตรงกับ spec ฝั่ง Pinto

#### ไม่เห็นข้อความตอบกลับใน Pinto

ตรวจตามนี้:

- `Api Url` ชี้ environment ถูกหรือไม่
- `Bot Id` เป็น UUID จริงหรือไม่
- `chat_id` เป็นห้องจริงหรือไม่
- Pinto API รับ `POST /v1/bots/webhook/receive` สำเร็จหรือไม่
- `X-Pinto-Secret` ตรงกันทั้งสองฝั่งหรือไม่

### พัฒนาและทดสอบ

```bash
npm install
npm run build
npm test
```

### เวอร์ชันและ dependency

- Node.js 20+
- OpenClaw `>=2026.0.0`
- TypeScript
- Zod
- Vitest

## English

### Overview

This plugin connects Pinto Chat to OpenClaw using a channel plugin flow:

1. A user sends a message in Pinto
2. Pinto API calls the OpenClaw webhook at `/plugins/pinto/webhook`
3. The plugin forwards the message to an OpenClaw agent
4. The plugin sends the agent response back to Pinto via `POST /v1/bots/webhook/receive`

Supported features:

- Direct chat messages
- Replies with optional `media_url`
- `Webhook Secret` support through `X-Pinto-Secret`
- OpenClaw UI configuration through `Channels`

### Requirements

- A working OpenClaw instance
- Node.js 20+ and npm
- An existing Pinto bot
- The Pinto bot must have:
  - A real bot UUID from the database
  - A reachable webhook URL
  - A shared secret if webhook security is enabled
- A public or reachable URL that Pinto can call

### Installation

```bash
git clone https://github.com/fakduai-logistics-and-digital-platform/pinto-openclaw-gateway.git
cd pinto-openclaw-gateway
npm install
npm run build
```

Install into OpenClaw:

Install from package name:

```bash
openclaw plugins install @fakduai/pinto-app-openclaw
```

Install from local path:

```bash
openclaw plugins install .
```

If you deploy by copying files manually, copy:

- `dist/`
- `openclaw.plugin.json`
- `package.json`
- `README.md`

Typical runtime location:

```bash
~/.openclaw/extensions/@fakduai/pinto-app-openclaw
```

### OpenClaw Configuration

You can configure the plugin either:

- In the OpenClaw UI under `Channels > Pinto Chat`
- In the OpenClaw config file

Fields:

- `Api Url`
  - Pinto API base URL
  - With or without a trailing slash is fine
- `Bot Id`
  - Must be the real Pinto bot UUID
  - Do not use the readable `bot_id` slug
- `Enabled`
  - Enables or disables the channel
- `Webhook Secret`
  - Shared secret used with `X-Pinto-Secret`

Example:

```json
{
  "channels": {
    "pinto": {
      "enabled": true,
      "apiUrl": "https://api-dev.pinto-app.com",
      "botId": "20387880-7934-40c3-b7d4-9fa6557697cf",
      "webhookSecret": "pinto-oc-9f3a1b7c5d2e8k4m"
    }
  }
}
```

### Pinto Bot Configuration

Configure your Pinto bot with:

- `webhook_url`
  - Example:
  - `https://your-host.example.com/plugins/pinto/webhook`
- Bot UUID
  - Use the bot `_id` as `Bot Id` in OpenClaw

### Webhook Secret

The plugin supports `X-Pinto-Secret` as follows.

#### Inbound: Pinto -> OpenClaw

If `Webhook Secret` is configured in OpenClaw:

- Pinto must send:

```http
X-Pinto-Secret: <your-secret>
```

- If the value does not match, the plugin returns `401`

If no secret is configured in OpenClaw:

- The plugin does not enforce inbound secret validation

#### Outbound: OpenClaw -> Pinto

When the plugin sends a response back to Pinto via:

```http
POST /v1/bots/webhook/receive
```

it automatically sends:

```http
X-Pinto-Secret: <your-secret>
```

when `Webhook Secret` is configured.

### Relevant Endpoints

#### Inbound Webhook

Pinto calls:

```http
POST /plugins/pinto/webhook
```

Example request body:

```json
{
  "bot_id": "20387880-7934-40c3-b7d4-9fa6557697cf",
  "chat_id": "5f315d4e-cf22-4054-bbb0-2fe074bd3892",
  "message": "hello",
  "user_id": "a7c3fe36-cf41-42b5-a290-ca98e6129fac",
  "username": "demo-user"
}
```

#### Outbound Reply to Pinto

The plugin sends:

```http
POST <apiUrl>/v1/bots/webhook/receive
```

Example request body:

```json
{
  "bot_id": "20387880-7934-40c3-b7d4-9fa6557697cf",
  "chat_id": "5f315d4e-cf22-4054-bbb0-2fe074bd3892",
  "reply_message": "Hello from OpenClaw"
}
```

Media example:

```json
{
  "bot_id": "20387880-7934-40c3-b7d4-9fa6557697cf",
  "chat_id": "5f315d4e-cf22-4054-bbb0-2fe074bd3892",
  "reply_message": "See this image",
  "media_url": "https://example.com/image.png"
}
```

### Testing

#### 1. Local inbound test

```bash
curl -i -X POST http://127.0.0.1:18789/plugins/pinto/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Pinto-Secret: pinto-oc-9f3a1b7c5d2e8k4m' \
  -d '{
    "bot_id":"20387880-7934-40c3-b7d4-9fa6557697cf",
    "chat_id":"5f315d4e-cf22-4054-bbb0-2fe074bd3892",
    "message":"hello",
    "user_id":"a7c3fe36-cf41-42b5-a290-ca98e6129fac"
  }'
```

Expected response:

```json
{"message":"Message forwarded to agent"}
```

#### 2. Public inbound test

```bash
curl -i -X POST https://your-host.example.com/plugins/pinto/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Pinto-Secret: pinto-oc-9f3a1b7c5d2e8k4m' \
  -d '{
    "bot_id":"20387880-7934-40c3-b7d4-9fa6557697cf",
    "chat_id":"5f315d4e-cf22-4054-bbb0-2fe074bd3892",
    "message":"hello",
    "user_id":"a7c3fe36-cf41-42b5-a290-ca98e6129fac"
  }'
```

#### 3. Direct outbound test to Pinto API

```bash
curl -i -X POST https://api-dev.pinto-app.com/v1/bots/webhook/receive \
  -H 'Content-Type: application/json' \
  -H 'X-Pinto-Secret: pinto-oc-9f3a1b7c5d2e8k4m' \
  -d '{
    "bot_id":"20387880-7934-40c3-b7d4-9fa6557697cf",
    "chat_id":"5f315d4e-cf22-4054-bbb0-2fe074bd3892",
    "reply_message":"OpenClaw outbound test"
  }'
```

### Recommended Setup Flow

1. Install the plugin and run `npm run build`
2. Install or copy the plugin into the OpenClaw extension directory
3. Restart the OpenClaw gateway
4. Open `Channels > Pinto Chat`
5. Fill in `Api Url`, `Bot Id`, and `Webhook Secret`
6. Save the channel config
7. Set the Pinto bot `webhook_url` to `/plugins/pinto/webhook`
8. Test with `curl`
9. Send a real message from Pinto
10. Verify the reply is delivered back to Pinto

### Troubleshooting

#### 404 Not Found

Common causes:

- Using `GET` in a browser instead of `POST`
- Reverse proxy is not forwarding to the OpenClaw gateway
- Wrong path. Use `/plugins/pinto/webhook`

#### 401 Unauthorized

Common causes:

- Pinto sends the wrong `X-Pinto-Secret`
- OpenClaw sends the wrong `X-Pinto-Secret` back to Pinto

#### 400 Invalid request body

Common causes:

- Wrong `bot_id`
- Wrong `chat_id` for the current environment
- Payload mismatch for `/v1/bots/webhook/receive`

#### No reply in Pinto

Check:

- `Api Url` points to the correct environment
- `Bot Id` is a real UUID
- `chat_id` exists
- Pinto API accepts `POST /v1/bots/webhook/receive`
- `X-Pinto-Secret` matches on both sides

### Development

```bash
npm install
npm run build
npm test
```

### Stack

- Node.js 20+
- OpenClaw `>=2026.0.0`
- TypeScript
- Zod
- Vitest

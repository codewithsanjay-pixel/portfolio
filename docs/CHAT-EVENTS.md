# Chat events (protocol version 1)

`POST /api/chat` answers with JSON by default. A client that sends `Accept: text/event-stream` gets the same answer as server-sent events, so it can show each step as it passes. This page is enough to build a client.

## Request
- `POST /api/chat`, `Content-Type: application/json`, body `{"question": "..."}` (1 to 500 characters, no other fields).
- Add `Accept: text/event-stream` to ask for events.

## Before the stream starts
The rate limit, content type, body size and body checks run first. If one fails, the response is the normal JSON error and no stream starts:

| Status | Body |
| --- | --- |
| 400 | `{"error": "Please send a question of up to 500 characters."}` |
| 413 | same message |
| 429 | `{"error": "Too many questions. Please try again later."}` |
| 503 | `{"error": "The assistant is not available right now. Please try again later."}` |

Check the response `Content-Type`. `text/event-stream` means read events. `application/json` means handle it exactly like a normal JSON response. A client must handle both, because a server may not support streaming.

## Format
Each event is `event: <type>` and one `data: <json>` line, ended by a blank line. Every data object has `"v": 1`. Responses use `Cache-Control: no-store`.

## Events
1. `stage`: `{"v":1,"key":"<step>","ms":123}`. Sent when a step passes. `key` is one of `rate`, `input`, `retrieve`, `scope`, `model`, `checks`. `ms` is present only for `retrieve` and `model`. Stage events arrive in that order and each key at most once. A step that stops the flow is never sent. The `checks` stage covers every check after the model and is sent only if all of them passed, so a stream never says which check failed.
2. `final`: `{"v":1,"refused":bool,"answer":"...","citations":[{"id":"...","section":"..."}],"trace":{...}}`. The same body as the JSON response, plus `v`. `trace` has `steps` (all six keys, each `pass`, `stop` or `skipped`, with the stop revealed only here), `retrieval` and `totalMs`. A refused answer is still a `final` event.
3. `error`: `{"v":1,"message":"..."}`. `message` is one of the route's fixed messages, currently "Something went wrong. Please try again later."

## Order and the end of the stream
`stage` events (zero or more), then exactly one terminal event, `final` or `error`, then the stream closes. Stop reading after the terminal event.

## Client rules
- Ignore events with an unknown type, an unknown `key`, a `v` other than 1, or data that is not a JSON object.
- Cap sizes. The reference client drops an event over 16 KB and a stream over 64 KB.
- Render everything as plain text. Show the fixed refusal wording itself rather than the `answer` of a refused event, and show only known error messages.
- If the stream ends without a terminal event, or the read fails or times out, show a generic failure. Do not retry automatically.
- Send one request at a time.

## Versioning
`v` is the protocol version. New fields may be added to a version 1 event, so ignore fields you do not know. A change that removes or renames anything gets `v: 2`, and clients must ignore events with a version they do not know.

Code: `lib/chat/stream.ts` (encoder, parser), `app/api/chat/route.ts` (server), `components/chat-panel.tsx` (client). Decision: `docs/adr/012-streaming-chat-events.md`.

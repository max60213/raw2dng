import { createWorkerHandler } from "@worker-runtime";

const handler = createWorkerHandler((message) => {
  self.postMessage(message);
});

self.onmessage = async (event: MessageEvent) => {
  await handler(event.data);
};

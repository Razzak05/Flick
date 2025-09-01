import { createApi } from "./axios";

export const apiUser = createApi(
  process.env.NEXT_PUBLIC_BACKEND_URL_USER_SERVICE!
);
export const apiChat = createApi(
  process.env.NEXT_PUBLIC_BACKEND_URL_CHAT_SERVICE!
);

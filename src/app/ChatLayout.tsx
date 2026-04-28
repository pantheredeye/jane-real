import type { LayoutProps } from "rwsdk/router";
import type { AppContext } from "../worker";
import { ChatShell } from "./ChatShell";

export function ChatLayout({ children, requestInfo }: LayoutProps) {
  const ctx = requestInfo?.ctx as AppContext | undefined;
  const showChat = Boolean(ctx?.user);
  return <ChatShell showChat={showChat}>{children}</ChatShell>;
}

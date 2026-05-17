export { auth as proxy } from "@/auth";

export const config = {
  // Protect all routes except Next.js internals and auth APIs
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

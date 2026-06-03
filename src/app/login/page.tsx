import LoginClient from "./LoginClient";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const isPasswordSet = !!process.env.APP_PASSWORD;
  return <LoginClient isPasswordSet={isPasswordSet} />;
}

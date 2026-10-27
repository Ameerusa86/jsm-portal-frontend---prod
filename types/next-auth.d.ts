import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    cloudId?: string;
    siteUrl?: string;
    error?: string;
    accessibleResources?: Array<{ id: string; url: string; name: string }>;
    user: {
      id?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    accountId?: string;
    cloudId?: string;
    siteUrl?: string;
    error?: string;
    accessibleResources?: Array<{ id: string; url: string; name: string }>;
  }
}

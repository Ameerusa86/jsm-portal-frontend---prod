import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Image URL is missing", { status: 400 });
    }

    const session = await auth();
    const rawBaseUrl =
      session?.siteUrl ||
      process.env.JIRA_BASE_URL ||
      "";

    const { JIRA_USER_EMAIL, JIRA_API_TOKEN } = process.env;

    if (!rawBaseUrl || !JIRA_USER_EMAIL || !JIRA_API_TOKEN) {
      return new NextResponse("System Account API token is missing.", { status: 501 });
    }

    const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, "").replace(/\/wiki$/, "");

    // If requested with full resolution (or for lightbox view), convert thumbnail URLs to full attachments
    const isFull =
      searchParams.get("full") === "1" ||
      searchParams.get("full") === "true";

    if (isFull) {
      imageUrl = imageUrl
        .replace(/\/thumbnails\//g, "/attachments/")
        .replace(/([?&])(width|height|maxWidth|maxHeight)=\d+(&?)/gi, "$1")
        .replace(/[?&]$/, "");
    }

    // If the image URL is relative (starts with /), append it to the base URL
    if (imageUrl.startsWith("/")) {
      imageUrl = `${cleanBaseUrl}${imageUrl}`;
    }

    // Only allow fetching from authorized Atlassian domains for security
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return new NextResponse("Invalid image URL", { status: 400 });
    }

    const isAtlassianDomain =
      parsedUrl.hostname.endsWith(".atlassian.net") ||
      imageUrl.startsWith(cleanBaseUrl);

    if (!isAtlassianDomain) {
      return new NextResponse("Unauthorized image domain", { status: 403 });
    }

    const basicAuthHeader = `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

    // Fetch the image stream from Atlassian
    const response = await fetch(imageUrl, {
      method: "GET",
      headers: {
        Authorization: basicAuthHeader,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image ${imageUrl}. Status:`, response.status);
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    // Pass the content type through (e.g. image/png, image/jpeg)
    const contentType = response.headers.get("Content-Type") || "application/octet-stream";
    
    // Get the raw binary stream
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable", // Cache images in browser for 1 day
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

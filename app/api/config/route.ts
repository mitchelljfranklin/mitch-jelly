export async function GET() {
  return Response.json({
    defaultServerUrl: process.env.DEFAULT_SERVER_URL ?? "",
    seerrServerUrl: process.env.SEERR_SERVER_URL ?? "",
    seerrAuthType: process.env.SEERR_AUTH_TYPE ?? "",
    appName: process.env.APP_NAME ?? "",
  });
}

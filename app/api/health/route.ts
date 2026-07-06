export async function GET() {
  return Response.json({
    status: "ok",
    service: "price-journey-app",
    timestamp: new Date().toISOString(),
  });
}


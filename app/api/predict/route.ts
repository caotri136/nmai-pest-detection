import { NextResponse } from "next/server";

export const runtime = "nodejs";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000/predict";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ message: "File is required." }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(backendUrl, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    return NextResponse.json({ message: "Unable to reach backend." }, { status: 502 });
  }

  const contentType = response.headers.get("content-type") || "application/json";
  const payload = await response.text();

  return new NextResponse(payload, {
    status: response.status,
    headers: {
      "content-type": contentType,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/validate-car-image
 *
 * Uses Groq's Llama 4 Scout vision model to:
 * 1. Describe the uploaded image
 * 2. Check if it's a real car/vehicle exterior
 * 3. Verify it matches the user's claimed vehicle model
 *
 * Accepts: multipart/form-data with "file" and "vehicleModel" fields
 * Returns: { valid: boolean, reason: string, description: string, matchesModel: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const vehicleModel = (formData.get("vehicleModel") as string) || "";

    if (!file) {
      return NextResponse.json({ valid: false, reason: "No file provided" }, { status: 400 });
    }
    if (!vehicleModel.trim()) {
      return NextResponse.json({ valid: false, reason: "Enter vehicle model first" }, { status: 400 });
    }

    // Basic file checks
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ valid: false, reason: "Invalid file type. Upload JPG, PNG, or WebP." });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ valid: false, reason: "File too large (max 5MB)." });
    }

    // Convert image to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // ── Call Groq Vision API (Llama 4 Scout) ────────────
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ valid: false, reason: "Vision API key not configured" }, { status: 500 });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a strict vehicle verification AI for a carpooling app. The user claims their vehicle model is: "${vehicleModel}".

Analyze this image and determine:
1. Is this image an EXTERIOR photo of a real car/vehicle? (NOT an interior, NOT a random object, NOT a person, NOT a document)
2. What is the EXACT vehicle make and model visible in the image? (e.g., "Maruti Suzuki Ertiga", "Hyundai Creta", "Tata Nexon")
3. Does the user's input "${vehicleModel}" contain the SPECIFIC MODEL NAME of the detected vehicle?
4. What is the maximum physical seating capacity for this specific vehicle model? (e.g., 5 for a Swift/Creta, 7 for an Ertiga/Innova)

IMPORTANT MATCHING RULES:
- The user MUST provide the specific model name (e.g., "Ertiga", "Creta", "Swift", "Nexon", "Innova")
- Just a brand/company name like "Suzuki", "Hyundai", "Tata", "Maruti" is NOT enough — set matches_claimed_model to FALSE
- "Maruti Ertiga", "Ertiga", "Suzuki Ertiga" are all valid for a Maruti Suzuki Ertiga
- "Suzuki" alone is NOT valid for a Suzuki Ertiga — the model name is missing
- "Hyundai" alone is NOT valid for a Hyundai Creta — need "Creta"

Reply ONLY with valid JSON (no markdown, no code blocks, no explanation):
{"is_car_exterior": true/false, "detected_vehicle": "Full Make Model", "matches_claimed_model": true/false, "vehicle_capacity": number, "confidence": "high/medium/low", "reason": "Brief explanation"}`,
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_completion_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errText);
      return NextResponse.json({ valid: false, reason: "Vision AI service error. Try again." });
    }

    const groqData = await groqRes.json();
    const content = groqData?.choices?.[0]?.message?.content || "";

    console.log("Groq Vision response:", content);

    // Parse the JSON response
    try {
      const parsed = JSON.parse(content);

      const isCarExterior = !!parsed.is_car_exterior;
      const matchesModel = !!parsed.matches_claimed_model;
      const detectedVehicle = parsed.detected_vehicle || "Unknown";
      const vehicleCapacity = typeof parsed.vehicle_capacity === "number" ? parsed.vehicle_capacity : 4;
      const reason = parsed.reason || "";

      if (!isCarExterior) {
        return NextResponse.json({
          valid: false,
          reason: reason || "This doesn't look like a car exterior photo",
          description: detectedVehicle,
          matchesModel: false,
          vehicleCapacity: 4,
        });
      }

      if (!matchesModel) {
        return NextResponse.json({
          valid: false,
          reason: `Image shows "${detectedVehicle}" but you entered "${vehicleModel}".`,
          description: detectedVehicle,
          matchesModel: false,
          vehicleCapacity: 4,
        });
      }

      // ✅ Valid car exterior that matches the claimed model
      return NextResponse.json({
        valid: true,
        reason: `✓ ${detectedVehicle} verified — ${reason}`,
        description: detectedVehicle,
        matchesModel: true,
        vehicleCapacity,
      });
    } catch {
      console.error("Failed to parse Groq response:", content);
      return NextResponse.json({
        valid: false,
        reason: "AI verification failed. Please try again.",
        description: "",
        matchesModel: false,
      });
    }
  } catch (error) {
    console.error("validate-car-image error:", error);
    return NextResponse.json(
      { valid: false, reason: "Server error during validation" },
      { status: 500 }
    );
  }
}

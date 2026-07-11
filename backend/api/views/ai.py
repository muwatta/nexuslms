import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, JSONParser
from PIL import Image
import io
from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"🔑 Gemini API key is {'set' if GEMINI_API_KEY else 'NOT set'}")

class AIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, JSONParser]

    def post(self, request):
        try:
            message = request.data.get("message", "").strip()
            image_file = request.FILES.get("image")

            if not GEMINI_API_KEY:
                return Response({
                    "content": "⚠️ Gemini API key not configured. Please set GEMINI_API_KEY in your environment."
                }, status=400)

            if not message and not image_file:
                return Response({"error": "Provide a message or an image"}, status=400)

            # Build contents list
            contents = []
            if message:
                contents.append(message)
            else:
                contents.append("Describe this image in detail.")

            if image_file:
                try:
                    img_bytes = image_file.read()
                    contents.append(types.Part.from_bytes(
                        data=img_bytes,
                        mime_type=image_file.content_type
                    ))
                except Exception as e:
                    return Response({"error": f"Image processing error: {str(e)}"}, status=400)

            # Use the new client
            client = genai.Client(api_key=GEMINI_API_KEY)

            # Try the model that is definitely available
            model_name = "gemini-2.0-flash"  # or "gemini-1.5-flash"

            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents
                )
                ai_reply = response.text.strip()
                return Response({"content": ai_reply})
            except genai.errors.ClientError as e:
                # Check if it's a quota error (429) or model not found (404)
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    return Response({
                        "content": "🔴 The AI assistant is currently busy (daily limit reached). Please try again later."
                    }, status=429)
                elif "404" in str(e) or "not found" in str(e):
                    # Fallback to another model if available
                    fallback_models = ["gemini-1.5-flash", "gemini-1.0-pro"]
                    for fallback in fallback_models:
                        try:
                            response = client.models.generate_content(
                                model=fallback,
                                contents=contents
                            )
                            ai_reply = response.text.strip()
                            return Response({"content": ai_reply})
                        except:
                            continue
                    return Response({
                        "error": "No available AI model found. Please try again later."
                    }, status=500)
                else:
                    return Response({"error": str(e)}, status=500)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Internal error: {str(e)}"}, status=500)
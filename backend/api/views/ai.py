import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, JSONParser
from PIL import Image
import io
from google import genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    client = None

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
                })

            if not message and not image_file:
                return Response({"error": "Provide a message or an image"}, status=400)

            # Build contents
            contents = []
            if message:
                contents.append(message)
            else:
                contents.append("Describe this image.")

            if image_file:
                try:
                    img_bytes = image_file.read()
                    contents.append(genai.types.Part.from_bytes(
                        data=img_bytes,
                        mime_type=image_file.content_type
                    ))
                except Exception as e:
                    return Response({"error": f"Image processing error: {str(e)}"}, status=400)

            # Generate response with error handling
            try:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=contents
                )
                ai_reply = response.text.strip()
                return Response({"content": ai_reply})
            except genai.errors.ClientError as e:
                # Handle quota exceeded (429)
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    return Response({
                        "content": "🔴 The AI assistant is currently at full capacity due to daily usage limits. Please try again in a few hours, or contact support to increase your quota."
                    }, status=429)
                else:
                    return Response({"error": f"AI error: {str(e)}"}, status=500)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Internal error: {str(e)}"}, status=500)
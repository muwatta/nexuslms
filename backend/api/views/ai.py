import os
import base64
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image
import io
import google.generativeai as genai


genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_NAME = "gemini-2.0-flash"

class AIChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Get text and image
        message = request.data.get("message", "").strip()
        image_file = request.FILES.get("image")

        if not message and not image_file:
            return Response(
                {"error": "Please provide a message or an image."},
                status=400
            )

        # If image provided, read and convert to bytes
        image_data = None
        if image_file:
            try:
                img = Image.open(image_file)
                img.thumbnail((1024, 1024))
                # Convert to PNG bytes
                buffer = io.BytesIO()
                img.save(buffer, format="PNG")
                image_data = buffer.getvalue()
            except Exception as e:
                return Response(
                    {"error": f"Failed to process image: {str(e)}"},
                    status=400
                )

        try:
            model = genai.GenerativeModel(MODEL_NAME)

            parts = [message if message else "Describe this image in detail."]

            if image_data:
                img_pil = Image.open(io.BytesIO(image_data))
                parts.append(img_pil)

            response = model.generate_content(parts)
            ai_reply = response.text

            return Response({"content": ai_reply})

        except Exception as e:
            return Response(
                {"error": f"AI request failed: {str(e)}"},
                status=500
            )
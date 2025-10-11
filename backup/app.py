from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image
import io
import base64
import os

print("--- Server starting with updated code (v2). Please ensure you have replaced the placeholder API key. ---")

# --- Configuration ---
# IMPORTANT: You MUST replace the placeholder string below with your actual Google AI API key.
# The application will not work without a valid key.
# Get your key from Google AI Studio.
API_KEY = os.getenv("GOOGLE_API_KEY")  # Replace this with your key!

try:
    genai.configure(api_key=API_KEY)
    print("Google AI SDK configured successfully.")
except Exception as e:
    print(f"Error configuring Google AI: {e}")

# --- Model Initialization ---
model = genai.GenerativeModel('gemini-2.5-pro')

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)  # Allow requests from your HTML file

# --- API Endpoint Definition ---
@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    print("Received a request on /ask-ai")

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON input"}), 400

    prompt = data.get('prompt', '')
    image_data_url = data.get('image', None)

    img = None
    content_parts = []

    # --- Image Processing ---
    if image_data_url:
        try:
            # Split the header from the base64 encoded string
            header, encoded = image_data_url.split(",", 1)
            
            # Decode the base64 string
            image_bytes = base64.b64decode(encoded)
            
            # Open the image from bytes
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            print("Image processed successfully.")
        except Exception as e:
            print(f"Error processing image: {e}")
            return jsonify({"error": f"Could not process image: {e}"}), 400

    # --- Prepare Content for Gemini ---
    if not prompt and not img:
        return jsonify({"error": "A prompt or an image is required"}), 400

    # Add the text prompt first, if it exists
    if prompt:
        content_parts.append(prompt)
    # Add the image second, if it exists
    if img:
        content_parts.append(img)

    # --- Call Gemini API ---
    try:
        print("Sending request to Gemini model...")
        response = model.generate_content(content_parts)
        print("Received response from Gemini.")
        # Make sure to access the text part of the response
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": f"An error occurred with the AI model: {e}"}), 500

# --- Start the Server ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)


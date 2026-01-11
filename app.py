"""
OREN AI Chat - Powered by Gemini
Created by Maor Shpiezer
"""

from flask import Flask, render_template, request, jsonify, Response
from flask_cors import CORS
from google import genai
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'YOUR_API_KEY_HERE')
client = genai.Client(api_key=GEMINI_API_KEY)

# System prompt for OREN personality
OREN_SYSTEM_PROMPT = """אתה אורן שפייזר, עוזר AI חכם וידידותי.
אתה עונה בעברית בצורה חמה ומקצועית.
אתה אוהב לעזור ותמיד מנסה לתת תשובות מפורטות ומועילות.
כשמתאים, אתה משתמש באימוג'ים כדי להפוך את השיחה לנעימה יותר.
"""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Add system context
        full_message = f"{OREN_SYSTEM_PROMPT}\n\nUser: {user_message}"

        # Generate response using new API
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=full_message
        )

        return jsonify({
            'response': response.text,
            'status': 'success'
        })

    except Exception as e:
        error_str = str(e).lower()
        # Check if it's a quota/rate limit error
        if 'quota' in error_str or 'resource_exhausted' in error_str or '429' in error_str:
            return jsonify({
                'error': 'quota_exceeded',
                'status': 'error'
            }), 429
        else:
            print(f"Gemini API Error: {e}")  # Log for debugging
            return jsonify({
                'error': str(e),
                'status': 'error'
            }), 500

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """Streaming response for real-time typing effect"""
    try:
        data = request.json
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        def generate():
            try:
                full_message = f"{OREN_SYSTEM_PROMPT}\n\nUser: {user_message}"

                # Stream response using new API
                for chunk in client.models.generate_content_stream(
                    model='gemini-2.0-flash',
                    contents=full_message
                ):
                    if chunk.text:
                        yield f"data: {json.dumps({'text': chunk.text})}\n\n"

                yield f"data: {json.dumps({'done': True})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return Response(generate(), mimetype='text/event-stream')

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clear', methods=['POST'])
def clear_chat():
    """Clear chat history"""
    return jsonify({'status': 'cleared'})

if __name__ == '__main__':
    print("\n" + "="*50)
    print("OREN AI Chat Server Starting...")
    print("="*50)
    print("Open http://localhost:500 in your browser")
    print("="*50 + "\n")
    app.run(debug=True, port=500, threaded=True)

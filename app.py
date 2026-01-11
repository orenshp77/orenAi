"""
OREN AI Chat - Powered by Groq
Created by Maor Shpiezer
"""

from flask import Flask, render_template, request, jsonify, Response
from flask_cors import CORS
from groq import Groq
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Groq API
GROQ_API_KEY = os.getenv('GROQ_API_KEY', 'YOUR_API_KEY_HERE')
client = Groq(api_key=GROQ_API_KEY)

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
    print(f"=== CHAT REQUEST RECEIVED ===")
    print(f"API Key configured: {bool(GROQ_API_KEY and GROQ_API_KEY != 'YOUR_API_KEY_HERE')}")
    print(f"API Key starts with: {GROQ_API_KEY[:10]}..." if GROQ_API_KEY else "NO KEY")
    try:
        data = request.json
        user_message = data.get('message', '')
        print(f"User message: {user_message[:50]}...")

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Generate response using Groq
        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {"role": "system", "content": OREN_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=2048
        )

        return jsonify({
            'response': response.choices[0].message.content,
            'status': 'success'
        })

    except Exception as e:
        error_str = str(e).lower()
        error_type = type(e).__name__

        # Detailed logging
        print(f"="*50)
        print(f"GROQ ERROR:")
        print(f"  Type: {error_type}")
        print(f"  Message: {e}")
        print(f"  Full error: {repr(e)}")
        print(f"="*50)

        # Check if it's a quota/rate limit error
        if 'quota' in error_str or 'rate_limit' in error_str or '429' in error_str or 'too many' in error_str:
            return jsonify({
                'error': 'quota_exceeded',
                'status': 'error'
            }), 429
        else:
            return jsonify({
                'error': str(e),
                'error_type': error_type,
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
                # Stream response using Groq
                stream = client.chat.completions.create(
                    model='llama-3.3-70b-versatile',
                    messages=[
                        {"role": "system", "content": OREN_SYSTEM_PROMPT},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.7,
                    max_tokens=2048,
                    stream=True
                )

                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield f"data: {json.dumps({'text': chunk.choices[0].delta.content})}\n\n"

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

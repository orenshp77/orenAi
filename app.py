"""
OREN AI Chat - Powered by Groq
Created by Maor Shpiezer
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
import time
import logging
from collections import defaultdict, deque
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("oren")

app = Flask(__name__)

# CORS: only the allowed origins (comma separated in ALLOWED_ORIGINS)
ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    'ALLOWED_ORIGINS', 'https://orenai.onrender.com').split(',') if o.strip()]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    log.warning("GROQ_API_KEY is not set - chat requests will fail")
client = Groq(api_key=GROQ_API_KEY or 'missing')

# Models offered in the UI (id -> label). Add new Groq-hosted models here.
MODELS = {
    'openai/gpt-oss-120b': 'GPT-OSS 120B',
    'openai/gpt-oss-20b': 'GPT-OSS 20B (מהיר)',
    'qwen/qwen3.8-27b': 'Qwen 3.8 27B',
}
DEFAULT_MODEL = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
if DEFAULT_MODEL not in MODELS:
    DEFAULT_MODEL = 'openai/gpt-oss-120b'

MAX_MESSAGE_CHARS = 4000
MAX_HISTORY_MESSAGES = 20

# Simple in-memory rate limit: N requests per window per IP
RATE_LIMIT = int(os.getenv('RATE_LIMIT', '20'))
RATE_WINDOW = 60
_hits = defaultdict(deque)

OREN_SYSTEM_PROMPT = """אתה אורן שפייזר, עוזר AI חכם וידידותי.
אתה עונה בעברית בצורה חמה ומקצועית.
אתה אוהב לעזור ותמיד מנסה לתת תשובות מפורטות ומועילות.
כשמתאים, אתה משתמש באימוג'ים כדי להפוך את השיחה לנעימה יותר.
אם שואלים אותך מי אתה או איזה מודל אתה, ענה שאתה אורן, עוזר AI של OREN AI. אל תציג את עצמך כ-ChatGPT, GPT, Qwen או כל מודל אחר, ואל תנחש איזה מודל פועל מאחורי הקלעים.
כתוב בצורה קריאה: כותרות קצרות, רשימות ופסקאות. השתמש בטבלה רק כשהמשתמש מבקש השוואה או טבלה.
"""


def rate_limited(ip):
    now = time.time()
    q = _hits[ip]
    while q and now - q[0] > RATE_WINDOW:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        return True
    q.append(now)
    return False


def clean_history(raw):
    """Validate client-supplied history: only user/assistant roles, bounded size."""
    out = []
    if not isinstance(raw, list):
        return out
    for m in raw[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(m, dict):
            continue
        role, content = m.get('role'), m.get('content')
        if role in ('user', 'assistant') and isinstance(content, str) and content.strip():
            out.append({'role': role, 'content': content[:MAX_MESSAGE_CHARS]})
    return out


@app.route('/')
def index():
    return render_template('index.html', models=MODELS, default_model=DEFAULT_MODEL)


@app.route('/api/chat', methods=['POST'])
def chat():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip()
    if rate_limited(ip):
        return jsonify({'error': 'rate_limited', 'status': 'error'}), 429

    data = request.get_json(silent=True) or {}
    user_message = data.get('message')
    if not isinstance(user_message, str) or not user_message.strip():
        return jsonify({'error': 'No message provided', 'status': 'error'}), 400
    if len(user_message) > MAX_MESSAGE_CHARS:
        return jsonify({'error': 'message_too_long', 'status': 'error'}), 400

    model = data.get('model')
    if model not in MODELS:
        model = DEFAULT_MODEL

    messages = [{"role": "system", "content": OREN_SYSTEM_PROMPT}]
    messages += clean_history(data.get('history'))
    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=4096
        )
        return jsonify({
            'response': response.choices[0].message.content,
            'status': 'success'
        })
    except Exception as e:
        # Log details server-side only; never leak them to the client
        log.error("Groq error (%s): %s", type(e).__name__, e)
        error_str = str(e).lower()
        if 'quota' in error_str or 'rate_limit' in error_str or '429' in error_str or 'too many' in error_str:
            return jsonify({'error': 'quota_exceeded', 'status': 'error'}), 429
        return jsonify({'error': 'server_error', 'status': 'error'}), 500


@app.route('/api/clear', methods=['POST'])
def clear_chat():
    """History lives in the browser; nothing to clear server-side."""
    return jsonify({'status': 'cleared'})


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    debug = os.getenv('FLASK_DEBUG', '0') == '1'
    print(f"OREN AI Chat running at http://localhost:{port}")
    app.run(debug=debug, port=port, threaded=True)

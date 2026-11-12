# 🌟 OREN AI Chat

צ'אט AI מרשים ומודרני מבוסס Groq, נוצר על ידי מאור שפייזר.

![OREN AI](https://img.shields.io/badge/OREN-AI%20Chat-8b5cf6?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-3.0-green?style=for-the-badge)

## ✨ תכונות

- 🎨 עיצוב מודרני ואנימטיבי בסגנון ChatGPT
- 📱 מותאם לחלוטין למובייל (Responsive)
- 🌈 צבעוניות סגול-שחור מרשימה
- 🎭 אנימציות חלקות ורקעים דינמיים
- ⚡ תגובות בזמן אמת (Streaming)
- 🔮 נופים מהעולם ברקע
- 💬 ממשק צ'אט אינטואיטיבי

---

## 🚀 התקנה והפעלה מקומית

### 1. הורדת הפרויקט
```bash
cd OREN-AI-Chat
```

### 2. יצירת סביבה וירטואלית (מומלץ)
```bash
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate
```

### 3. התקנת תלויות
```bash
pip install -r requirements.txt
```

### 4. הגדרת מפתח API
1. קבל מפתח חינמי מ-[Google AI Studio](https://makersuite.google.com/app/apikey)
2. צור קובץ `.env`:
```bash
copy .env.example .env
```
3. ערוך את הקובץ והכנס את המפתח שלך:
```
GROQ_API_KEY=your_api_key_here
```

### 5. הפעלת השרת
```bash
python app.py
```

### 6. פתיחה בדפדפן
```
http://localhost:5000
```

---

## 🌐 העלאה לשרת חינמי

### אפשרות 1: Render (מומלץ - הכי קל!)

1. צור חשבון ב-[render.com](https://render.com)
2. צור קובץ `render.yaml` בתיקיה:
```yaml
services:
  - type: web
    name: oren-ai-chat
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    envVars:
      - key: GROQ_API_KEY
        sync: false
```
3. חבר את ה-GitHub repo שלך
4. הוסף את ה-GROQ_API_KEY ב-Environment Variables
5. Deploy!

### אפשרות 2: Railway

1. צור חשבון ב-[railway.app](https://railway.app)
2. צור פרויקט חדש מ-GitHub
3. הוסף את המשתנים הסביבתיים
4. Deploy אוטומטי!

### אפשרות 3: PythonAnywhere (חינמי לחלוטין)

1. צור חשבון ב-[pythonanywhere.com](https://www.pythonanywhere.com)
2. העלה את הקבצים
3. צור Web App עם Flask
4. הגדר את הנתיב לקובץ app.py

### אפשרות 4: Vercel (עם Serverless)

צור קובץ `vercel.json`:
```json
{
  "builds": [{"src": "app.py", "use": "@vercel/python"}],
  "routes": [{"src": "/(.*)", "dest": "app.py"}]
}
```

---

## 📁 מבנה הפרויקט

```
OREN-AI-Chat/
├── app.py              # שרת Flask הראשי
├── requirements.txt    # תלויות Python
├── .env               # מפתחות API (לא להעלות!)
├── .env.example       # דוגמה לקובץ env
├── templates/
│   └── index.html     # דף הבית
└── static/
    ├── css/
    │   └── style.css  # עיצוב מלא
    └── js/
        └── main.js    # לוגיקת הצ'אט
```

---

## 🔑 קבלת מפתח Groq (חינם!)

1. היכנס ל-[Google AI Studio](https://makersuite.google.com/app/apikey)
2. לחץ על "Get API Key"
3. צור מפתח חדש
4. העתק את המפתח לקובץ `.env`

**המפתח חינמי** עם מגבלות נדיבות:
- 60 בקשות לדקה
- 1,500 בקשות ביום

---

## 🎨 התאמה אישית

### שינוי צבעים
ערוך את המשתנים ב-`static/css/style.css`:
```css
:root {
    --accent: #8b5cf6;        /* סגול ראשי */
    --accent-light: #a78bfa;  /* סגול בהיר */
    --primary-dark: #0d0015;  /* רקע כהה */
}
```

### שינוי הטקסט
ערוך את `templates/index.html` ואת `OREN_SYSTEM_PROMPT` ב-`app.py`

---

## 📝 רישיון

MIT License - מאור שפייזר 2024

---

נוצר באהבה 💜 על ידי מאור שפייזר

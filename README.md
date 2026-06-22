# ClearPath AI – Student Benefits Navigator

AI-powered assistant that matches students to scholarships, fee reimbursements,
and skill-development programs, then generates a personalized action plan.

## Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Python, Flask
- AI: Gemini API (`gemini-1.5-flash`)
- Data: `programs.json` (5 programs)

## Setup

```bash
cd clearpath-ai
pip install -r requirements.txt
```

Get a free Gemini API key from https://aistudio.google.com/app/apikey, then:

```bash
export GEMINI_API_KEY="your_key_here"   # Windows: set GEMINI_API_KEY=your_key_here
python app.py
```

Open http://127.0.0.1:5000 in your browser.

**Note:** the app runs fully without a Gemini key too — it falls back to
template-based explanations and a generic action plan, so the eligibility
engine and UI always work even without AI configured (useful for demoing
quickly or if the API quota runs out).

## How it works

1. Student fills in: name, age, education level, caste category, family
   income, state, Class 12 marks.
2. `check_eligibility()` in `app.py` runs the student against every rule
   in `programs.json` (income, education, category, age, state, marks) and
   records exactly which rule failed for transparency.
3. Gemini is prompted with the student's profile and matched programs to
   produce a plain-language explanation and a 6-step action plan.
4. Results page shows: eligible programs (with documents, deadline, portal
   link, source), why-you-qualify reasons for non-matches, action plan, and
   a disclaimer.

## Project structure

```
clearpath-ai/
├── app.py              # Flask routes + eligibility engine + Gemini calls
├── programs.json        # 5 program definitions (edit to add more)
├── requirements.txt
├── templates/
│   └── index.html       # Form + results UI
└── static/
    ├── style.css
    └── script.js         # Form validation + render results
```

## Adding a new program

Add an object to `programs.json` with the same fields as the existing
entries (`income_limit`, `education_levels`, `categories`, `min_age`,
`max_age`, `states`, `min_marks_percent`, `benefit`, `portal`, `deadline`,
`documents`, `source`, `short_desc`). No code changes needed — the
eligibility engine reads the file dynamically.

## Disclaimer shown in-app

This tool provides guidance only. Eligibility shown is based on the
information provided and may not reflect the latest government rules.
Final eligibility decisions are made by the relevant authorities.

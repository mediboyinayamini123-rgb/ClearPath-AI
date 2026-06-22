# ClearPath AI – Student Benefits Navigator

AI-powered assistant that helps students discover scholarships, fee reimbursements, and skill-development programs based on their profile and eligibility.

## Overview

ClearPath AI simplifies access to student support systems by matching users with relevant educational benefits and generating a personalized action plan.

The platform analyzes student details such as:

* Age
* Education level
* Caste category
* Family income
* State
* Academic performance

It then identifies eligible programs and explains:

* Why the student qualifies
* Required documents
* Application deadlines
* Official portal links
* Recommended next steps

The project is designed to make public support systems easier to understand and navigate, especially for students who may find eligibility rules confusing.

---

# Features

* AI-powered eligibility guidance
* Scholarship and reimbursement matching
* Personalized action plans
* Transparent eligibility checking
* Dynamic program database using JSON
* Responsive and clean user interface
* Works even without AI API configuration
* Easy to expand with new programs

---

# Tech Stack

## Frontend

* HTML
* CSS
* JavaScript

## Backend

* Python
* Flask

## AI Integration

* Gemini API (`gemini-1.5-flash`)

## Data Storage

* `programs.json`

---

# How It Works

1. Student enters personal and academic details.
2. The eligibility engine checks all available programs.
3. The system evaluates:

   * Income limits
   * Education requirements
   * Category eligibility
   * Age limits
   * State restrictions
   * Minimum marks
4. Eligible programs are displayed with detailed guidance.
5. Gemini AI generates:

   * Plain-language explanations
   * Personalized action plans
6. Results are shown with transparency and supporting details.

---

# Run the Application

Open in browser:

```bash
https://website-update--myamini810.replit.app
```

---

# AI Fallback Support

The application works even without a Gemini API key.

If AI is unavailable:

* Eligibility checking still works
* Template-based explanations are used
* Generic action plans are generated

---
# Example Use Cases

* Scholarship discovery
* Fee reimbursement assistance
* Skill-development guidance
* Student welfare navigation
* Educational support awareness

---









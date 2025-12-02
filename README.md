# Digital Resume Reviewer

## Overview
The **Digital Resume Reviewer** is a platform designed for the Vanderbilt University Career Center to streamline the resume review process for students and career advisors. The system allows students to upload resumes, share them with advisors, and receive real-time feedback in a centralized platform. By replacing email-based workflows, the platform improves efficiency, reduces version confusion, and enhances the overall review experience.

Key features include:
- Secure student and advisor authentication
- Resume upload and version control
- Real-time commenting and feedback
- Notifications and approval workflows
- Possible future support for AI-assisted resume editing and generation

---

## Technologies and Frameworks

### Frontend
- **React** – Component-based UI development
- **Tailwind CSS** – Modern, utility-first styling
- **Firebase SDK** – Integration with hosting, authentication, and database

### Backend & Hosting
- **Netlify** – Fast deployment with SSL security
- **Firebase Firestore** – Real-time NoSQL database for storing resumes, comments, and user data
- **Firebase Authentication** – Role-based access for students and advisors

### Development & Collaboration
- **GitHub** – Version control, issue tracking, and project management
- **Load Testing Tools** – Ensuring scalability and performance
- **Group Chat & Standups** – Team communication and progress alignment

---

## Installation
To run this project locally, you should have Node.js installed with the npm package manager. You can find the version for your system [here](https://nodejs.org/en/download). Once you've cloned this repository to your system, you can do `npm install` there to install all required dependencies, `npm run dev` to run it locally on your system, and `npm test` to run our test suites made with Jest.

## Deployment
Our deployment uses **Netlify**, which we have set up to auto-deploy when the main branch of this repository is updated.

---

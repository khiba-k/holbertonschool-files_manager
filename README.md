# 📁 Files Manager

> A lightweight file management API built with Node.js, Express, MongoDB, and Redis.

Author: **Khiba Koenane**

---

## 🚀 Description

**Files Manager** is a backend application that allows users to:

- Authenticate via API token
- Upload and manage files (folders, documents, images)
- List all uploaded files with pagination
- View public or private files
- Change the visibility of a file
- Generate image thumbnails (via background workers)

This project combines key backend concepts learned throughout the Holberton backend trimester — authentication, background processing, database storage, caching, and RESTful API design.

---

## 📚 Learning Objectives

By completing this project, you should be able to:

- Create RESTful APIs using Express.js
- Authenticate users using basic headers and tokens
- Store persistent data in MongoDB
- Use Redis to store temporary/session data
- Implement background job processing using Bull
- Manage file uploads and thumbnail generation
- Handle pagination and folder structures

---

## 🛠️ Technologies

- **Node.js** (v20.x)
- **Express.js**
- **MongoDB** & Mongoose
- **Redis**
- **Bull** (Redis-based job queue)
- **ImageMagick** (for thumbnail processing)
- **Mocha** (for testing)
- **Nodemon** (for development)
- **ESLint** (code linting)

---

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/files_manager.git
   cd files_manager

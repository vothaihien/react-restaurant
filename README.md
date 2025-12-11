# 🍽️ Restaurant Management System

A modern, full-stack web application designed to streamline restaurant operations. This system manages the flow between customers, employees, and administrators, handling everything from food ordering to employee management.

## 🚀 Technologies Used

This project is built using the following technologies:

* **Core:** [React](https://reactjs.org/) with **TypeScript** (TSX) - For a robust and type-safe frontend.
* **Build Tool:** [Vite](https://vitejs.dev/) - For fast development and optimized production builds.
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) - For rapid, responsive UI development.
* **Package Manager:** NPM

## ✨ Key Features

Based on the current development progress:

### 👤 Customer Features
* **Menu Browsing:** View food items with detailed cards (including size selection options).
* **Food Booking:** Feature to book food and add items to an order.
* **Routing:** Dedicated routes specifically for customer interactions.

### 👨‍🍳 Employee & Admin Features
* **Dashboard:** Updated interfaces specifically designed for Employees and Admins.
* **Order Management:**
    * View active orders.
    * dedicated pages for **Completed** and **Cancelled** orders.
* **Employee Management:** A dedicated `EmployeesView` for managing staff data.

## 🛠️ Installation & Setup

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/vothaihien/react-restaurant.git](https://github.com/vothaihien/react-restaurant.git)
    cd react-restaurant
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the app:**
    Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## 📂 Project Structure

```text
react-restaurant/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── App.tsx          # Main application component
│   ├── index.css        # Global styles (Tailwind imports)
│   └── main.tsx         # Entry point
├── .gitignore           # Git ignore rules
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
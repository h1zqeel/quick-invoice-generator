# **Invoice Generator Application**

An Electron-based desktop application to generate, manage, and store invoices. The app allows users to fill in client and trader details, select templates, add invoice items dynamically, and generate professional-looking invoices in **PDF format**. 

Invoices are stored locally in a **SQLite database** for future retrieval and management.

---

## **🚀 Features**

- **Dynamic Invoice Creation**:  
   - Add trader and client details.
   - Enter invoice metadata (Invoice Number, Date, Payment Terms, etc.).
   - Add multiple invoice items dynamically (Description, Hours, Rate, Subtotal).  
- **Template Support**:  
   - Select pre-defined templates to auto-fill fields.  
- **PDF Generation**:  
   - Generate high-quality PDFs using `wkhtmltopdf`.  
- **Invoice Management**:  
   - View, download, and manage all previously generated invoices.  
- **Persistent Storage**:  
   - Store PDF files and metadata securely in a **SQLite database**.

---

## **🛠️ Technologies Used**

| **Technology**      | **Purpose**                               |
|----------------------|-------------------------------------------|
| **Electron**         | Cross-platform desktop application.      |
| **Node.js**          | Backend logic and server-side scripting. |
| **wkhtmltopdf**      | Generate PDFs from dynamic HTML content. |
| **SQLite**           | Local database for storing invoices.     |
| **Tailwind CSS**     | Styling and layout for a clean UI.       |
| **EJS**              | Templating engine for dynamic content.   |

---

## **📦 Installation**

Follow these steps to clone and run the project locally:

### **Prerequisites**
- **Node.js** and **npm** installed.  
- **wkhtmltopdf** installed ([Installation Instructions](https://wkhtmltopdf.org/downloads.html)).

### **Steps**
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/invoice-generator.git
   cd invoice-generator
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Application**:
   ```bash
   npm start
   ```

---

## **🛠️ Project Structure**

```
invoice-generator/
├── main.js                 # Electron main process
├── renderer.js             # Frontend JS for handling UI
├── templates/
│   └── invoice.ejs         # EJS template for invoices
├── assets/
│   ├── css/
│   │   └── output.css      # Tailwind CSS file
│   └── images/             # Placeholder for images
├── database.sqlite         # SQLite database
├── package.json            # Project configuration
└── README.md               # Project documentation
```

---

## **📜 License**

This project is licensed under the **MIT License**.

---

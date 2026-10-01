# 💱 Forexia

**Forexia** is a full-stack currency exchange and digital wallet application that allows users to view real-time exchange rates, convert currencies, manage multi-currency wallets, and track exchange transactions.

The project combines a responsive **HTML/CSS/JavaScript frontend** with a **Java 17 + Spring Boot REST API** and **MySQL** for persistent data storage.

---

## ✨ Features

* 💱 Currency conversion between supported currencies
* 📈 Real-time exchange rates through an external exchange-rate API
* 💰 Multi-currency digital wallets
* 🌍 Support for currencies including INR, USD, EUR, and GBP
* 🔄 Currency exchange transactions
* 📜 Transaction history
* 👤 User management and authentication
* 🗄️ Persistent data storage with MySQL
* 🔐 Spring Boot backend security
* 📱 Responsive and user-friendly interface

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Fetch API

### Backend

* Java 17
* Spring Boot
* Spring Web
* Spring Data JPA
* Hibernate
* Maven
* REST APIs

### Database

* MySQL 8

### External Services

* Exchange-rate API for real-time currency rates

### Development Tools

* Git
* GitHub
* IntelliJ IDEA / VS Code
* Postman

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │    Forexia UI       │
                    │  HTML / CSS / JS    │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   Spring Boot API   │
                    │      Java 17        │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐       ┌──────────────────┐
        │     MySQL       │       │ Exchange Rate API│
        │   Database      │       │   External API   │
        └─────────────────┘       └──────────────────┘
```

---

## 📂 Project Structure

```text
Forexia/
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── login.html
│   ├── dashboard.html
│   └── ...
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/
│   │       │       └── forexia/
│   │       │           └── backend/
│   │       │               ├── controller/
│   │       │               ├── service/
│   │       │               ├── repository/
│   │       │               ├── entity/
│   │       │               └── ...
│   │       └── resources/
│   │
│   └── pom.xml
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed:

* Java 17+
* Maven
* MySQL 8+
* Git
* A modern web browser

---

## 1. Clone the Repository

```bash
git clone https://github.com/777Ishaan/Forexia.git
cd Forexia
```

---

## 2. Configure MySQL

Create a MySQL database:

```sql
CREATE DATABASE forexia;
```

Update the Spring Boot database configuration in:

```text
backend/src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/forexia
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

> Never commit real database passwords, API keys, JWT secrets, or other credentials to GitHub.

---

## 3. Start the Backend

Open a terminal:

```bash
cd backend
mvn spring-boot:run
```

The Spring Boot backend will start on:

```text
http://localhost:8080
```

---

## 4. Start the Frontend

The Forexia frontend is built using HTML, CSS, and JavaScript.

Open:

```text
frontend/login.html
```

in your browser.

Alternatively, use a local development server such as the VS Code Live Server extension.

---

## 🔌 API Endpoints

Forexia exposes REST APIs through the Spring Boot backend.

### Currency Rate

```http
GET /api/currency/rate?from=USD&to=INR
```

Example response:

```json
{
  "from": "USD",
  "to": "INR",
  "rate": 95.83
}
```

### Currency Conversion

```http
GET /api/currency/convert?from=USD&to=INR&amount=100
```

The conversion endpoint uses the authenticated user's context and the current exchange rate.

---

## 💱 Supported Currencies

Forexia currently works with major currencies such as:

| Currency      | Code |
| ------------- | ---- |
| Indian Rupee  | INR  |
| US Dollar     | USD  |
| Euro          | EUR  |
| British Pound | GBP  |

Additional currencies can be integrated through the exchange-rate service.

---

## 🗄️ Database

MySQL is used for persistent application data.

The backend uses:

* Spring Data JPA
* Hibernate
* Entity relationships
* Repository-based data access

This allows users, wallets, and transaction data to persist between application sessions.

---

## 🔐 Security

The backend includes authentication and protected API endpoints using Spring Security.

Authentication is used to protect user-specific operations such as currency conversion and wallet-related functionality.

---

## 📸 Screenshots

Screenshots of the Forexia application will be added here.

### Login

*Add login screen screenshot here.*

### Dashboard

*Add dashboard screenshot here.*

### Currency Conversion

*Add currency conversion screenshot here.*

### Wallet

*Add wallet screenshot here.*

### Transaction History

*Add transaction history screenshot here.*

---

## 🔮 Future Improvements

Planned improvements include:

* [ ] Improved authentication and authorization
* [ ] JWT-based authentication
* [ ] Enhanced wallet management
* [ ] Transaction filtering and search
* [ ] Improved dashboard analytics
* [ ] Currency trend charts
* [ ] More supported currencies
* [ ] Better error handling and validation
* [ ] Docker support
* [ ] Cloud deployment
* [ ] Automated testing
* [ ] CI/CD pipeline

---

## 🎯 Project Goals

Forexia was developed to demonstrate practical full-stack development concepts including:

* Frontend development
* REST API development
* Spring Boot architecture
* Database integration
* API consumption
* Authentication
* CRUD operations
* Financial transaction handling
* Git and GitHub workflow

---

## 👨‍💻 Author

**Ishaan**

Computer Science & Engineering Student

GitHub: [@777Ishaan](https://github.com/777Ishaan)

---

## 📄 License

This project is intended for educational and portfolio purposes.

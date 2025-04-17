# Anvil Test Case Specification with Jest

This document describes the structure and usage of our Jest test cases for Anvil API testing. The test framework follows a consistent pattern for validating API responses, focusing on both positive and negative test scenarios.

## Test Case Structure
Each test case is defined as a JavaScript object with the following structure:

```javascript
{
    name: 'Descriptive Test Case Name',
    variables: {
        payload: {
            // API request payload
        }
    },
    expectedIncludes: [
        // Array of strings/documents-names that MUST appear in response
    ],
    expectedExcludes: [
        // Array of strings/documents-names that MUST NOT appear in response
    ]
}

```


## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### ✅ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (vXX.X.X or later)
- [npm](https://www.npmjs.com/)

### 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. ** Create environment file**
    ```bash
    ANVIL_DEVELOPER_ACCESS_TOKEN=your_anvil_token_here
    FORGE_EID=your_forge_eid_here
    ```

4. **Running the Testing Service**
    ```bash
    npm run test
    ```
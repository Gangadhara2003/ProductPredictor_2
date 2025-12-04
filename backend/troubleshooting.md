# Contact Form Troubleshooting

The contact form is currently failing with a 500 Internal Server Error. This indicates a problem with the backend server when trying to send an email.

The most likely cause is an incorrect configuration of the email-sending service (`nodemailer`) in the `backend/.env` file.

## How to Fix

1.  **Open `backend/.env`:** Locate the `.env` file in the `backend` directory.
2.  **Verify Credentials:** Ensure the following variables are set correctly:
    *   `EMAIL_USER`: Your full Gmail address (e.g., `your.email@gmail.com`).
    *   `EMAIL_PASS`: A Gmail "App Password". This is **not** your regular Google account password. You need to generate a specific password for this application.
    *   `EMAIL_RECIPIENT`: The email address where you want to receive contact form submissions.

3.  **Generate a Gmail App Password:**
    *   Go to your Google Account settings: [https://myaccount.google.com/](https://myaccount.google.com/)
    *   Navigate to **Security**.
    *   Under "Signing in to Google," click on **2-Step Verification** and enable it if you haven't already.
    *   Go back to the Security page and click on **App passwords**.
    *   Select "Mail" for the app and "Other (Custom name)" for the device. Give it a name like "ProductPredictor" and click **Generate**.
    *   Copy the 16-character password and paste it into the `EMAIL_PASS` field in your `.env` file.

**Example `backend/.env` file:**

```
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=yourgeneratedapppassword
EMAIL_RECIPIENT=your.receiving.email@example.com
OPENAI_API_KEY=your-openai-api-key
```

After updating the `.env` file, you will need to **restart the backend server** for the changes to take effect.

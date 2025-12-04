const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: [
    'https://product-predictor-2.vercel.app',
    'http://localhost:5173' // Or whatever your local dev port is
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Nodemailer transporter setup
// IMPORTANT: You need to configure your email provider details in the .env file.
// For Gmail, you may need to use an "App Password" instead of your regular password.
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API endpoint for sending emails from the contact form
app.post('/api/contact', (req, res) => {
  const { firstName, lastName, email, phone, company, subject, message } = req.body;

  if (!firstName || !lastName || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mailOptions = {
    from: `"${firstName} ${lastName}" <${email}>`,
    to: process.env.EMAIL_RECIPIENT,
    subject: `New Contact Form Submission: ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Company:</strong> ${company || 'Not provided'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send message.' });
    }
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Message sent successfully!' });
  });
});

// The existing estimate endpoint (with a placeholder for fetch)
// You might need to install 'node-fetch' if you are using an older version of Node.js
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
app.post('/api/estimate', async (req, res) => {
    const { formData, prompt } = req.body;
    
    try {
      // Assuming 'fetch' is available (Node.js 18+)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // Make sure OPENAI_API_KEY is in your .env
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a construction cost estimation expert...'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });
      
      const data = await response.json();
      res.json({ content: data.choices[0].message.content });
    } catch (error) {
      console.error('AI estimation failed:', error);
      res.status(500).json({ error: 'AI estimation failed' });
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

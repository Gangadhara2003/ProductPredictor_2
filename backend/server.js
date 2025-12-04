// Backend API endpoint (Node.js/Express example)
app.post('/api/estimate', async (req, res) => {
  const { formData, prompt } = req.body;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
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
    res.status(500).json({ error: 'AI estimation failed' });
  }
});
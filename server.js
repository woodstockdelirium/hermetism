const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // нужно для Render
  },
});

app.use(cors());
app.use(express.json());

// Отримати всі гілки
app.get('/api/threads', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, created_at FROM threads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching threads:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Створити нову гілку
app.post('/api/threads', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  try {
    const threadRes = await pool.query(
      'INSERT INTO threads (title) VALUES ($1) RETURNING id',
      [title]
    );
    const threadId = threadRes.rows[0].id;

    await pool.query(
      'INSERT INTO posts (thread_id, content) VALUES ($1, $2)',
      [threadId, content]
    );

    res.status(201).json({ id: threadId });
  } catch (err) {
    console.error('Error creating thread:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Отримати гілку з постами
app.get('/api/threads/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const threadRes = await pool.query(
      'SELECT title, created_at FROM threads WHERE id = $1',
      [id]
    );

    if (threadRes.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const postsRes = await pool.query(
      'SELECT content, created_at FROM posts WHERE thread_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      title: threadRes.rows[0].title,
      content: postsRes.rows[0]?.content || '',
      createdAt: threadRes.rows[0].created_at,
      comments: postsRes.rows.slice(1)
    });
  } catch (err) {
    console.error('Error fetching thread:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Додати коментар
app.post('/api/threads/:id/comments', async (req, res) => {
  const id = parseInt(req.params.id);
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const threadCheck = await pool.query('SELECT id FROM threads WHERE id = $1', [id]);
    if (threadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const result = await pool.query(
      'INSERT INTO posts (thread_id, content) VALUES ($1, $2) RETURNING *',
      [id, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error posting comment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Пам'ятне зберігання
let threads = [];
let threadId = 1;
let postId = 1;

// Отримати всі гілки
app.get('/api/threads', (req, res) => {
  const result = threads.map(t => ({
    id: t.id,
    title: t.title,
    createdAt: t.createdAt
  }));
  res.json(result);
});

// Створити нову гілку (з першим постом)
app.post('/api/threads', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  const newThread = {
    id: threadId++,
    title,
    createdAt: new Date(),
    posts: [
      {
        id: postId++,
        content,
        createdAt: new Date()
      }
    ]
  };

  threads.push(newThread);
  res.status(201).json({ id: newThread.id });
});

// Отримати гілку з усіма постами
app.get('/api/threads/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const thread = threads.find(t => t.id === id);
  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }
  res.json(thread);
});

// Додати пост у гілку
app.post('/api/threads/:id/posts', (req, res) => {
  const id = parseInt(req.params.id);
  const thread = threads.find(t => t.id === id);
  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const newPost = {
    id: postId++,
    content,
    createdAt: new Date()
  };

  thread.posts.push(newPost);
  res.status(201).json(newPost);
});

app.listen(PORT, () => {
  console.log("Server is running on port ${PORT}");
});

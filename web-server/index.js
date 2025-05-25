//Základní nastavení pro server
const PORT = process.env.PORT || 3000;
const express = require('express');
require('dotenv').config({ path: './app.env' });
const cors = require('cors');
// Pro zpracování JSON a URL kódovaných dat
const Joi = require('joi');
// BCrypt pro hashování hesel
const bcrypt = require('bcrypt');
// Pro práci se session
const session = require('express-session');
// Pro práci s databází PostgreSQL - Client(zatím se nepoužívá) a Pool(aktivní připojení)
const { Client,Pool } = require('pg');
//----------------Use App-------------------
const app = express();
app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
//CORS nastavení
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
// Test spuštění serveru
app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
});
// Nastavení session --- aktuální relace
app.use(session({
  secret: process.env.SECRET_KEY || 'tajny_klic',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // pro HTTP, pro HTTPS nastav na true
}));
// Nastavení připojení k databázi PostgreSQL
// Použití Pool pro správu připojení
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Test připojení k databázi při startu serveru
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Chyba při připojení k databázi:', err);
  } else {
    console.log('Připojeno k databázi, čas:', res.rows[0].now);
  }
});

//---------------------------------------------------------
//Joi schéma pro validaci dat section --- pro sekce článků
const validateSection = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().allow(''),
  author: Joi.string().max(100).required(),
  last_updated: Joi.date().optional()
});
//schéma pro validaci dat article/posts - články
const validatePost = Joi.object({
  section_id: Joi.number().integer().required(),
  title: Joi.string().max(255).required(),
  content: Joi.string().required(),
  author: Joi.string().max(100).required(),
  created_at: Joi.date().optional()
});
// schéma pro validaci dat user - uživatelé
const validateUser = Joi.object({
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    email: Joi.string().email().required()});
// schéma pro validaci dat login - přihlášení
const validateLogin = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required()});
//----------------------------------------------------------
//Hashování hesel pomocí bcrypt
function hashPassword(password, saltRounds = 10) {
    return bcrypt.hash(password, saltRounds);
}
// Porovnání hesla s hashem
function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
//-----------------------------------------------------------
// Public session middleware pro přístup k session
function getPublicSessionData(sessionData) {
    const allowedKeys = ["_id", "email", "isAdmin"];
    const entries = allowedKeys
        .map(key => [key, sessionData[key]]);
    return Object.fromEntries(entries);
}
//-----------------------------------------------------------
const requireAuthHandler = (req, res, next) => {
    const user = req.session.user;
    if (!user) {
        res.status(401).send("Nejprve se přihlaste");
        return;
    }
    User.findById(user._id)
        .then((user) => {
            if (user === null) {
                req.session.destroy((err) => {
                    if (err) {
                        res.status(500).send("Nastala chyba při autentizaci");
                        return;
                    }
                    res.status(401).send("Nejprve se přihlaste");
                });
                return;
            }
            next();
        })
        .catch(() => {
            res.status(500).send("Nastala chyba při autentizaci");
        });
}
const requireAdminHandlers = [
    requireAuthHandler,
    (req, res, next) => {
        const user = req.session.user;
        if (!user.isAdmin) {
            res.status(403).send("Nemáte dostatečná práva");
            return;
        }
        next();
    }
];
// Výpis URL pro přístup k serveru --- ctrl + click
console.log(`http://localhost:${process.env.PORT} click+ctrl to navigate server`);
// Zkušební výpis v prohlížeči
app.get('/', (req, res) => {
  res.send('Server běží a je připraven přijímat požadavky.&#128517;');
});
console.log('DB_USER:', process.env.DB_USER);
//console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('Use ctrl+c to stop the server');
//----------------------USERS------------------------------------
//----------GET Auth-------------------
app.get("/api/auth", requireAuthHandler, (req, res) => {
    res.send(getPublicSessionData(req.session.user));
});
// ----------POST User-------------------
app.post("/api/user", (req, res) => {
    const userData = req.body;
    const {error} = validateUser(userData);
    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }

    const userCreateData = {
        email: userData.email,
        passwordHash: hashPassword(userData.password),
        isAdmin: false
    };

    User.create(userCreateData)
        .then(savedUser => {
            const result = savedUser.toObject();
            delete result.passwordHash;
            res.send(result);
        })
        .catch(e => {
            if (e.code === 11000) { // pokud email v databázi již existuje
                res.status(400).send("Účet se zadaným emailem již existuje");
                return;
            }
            res.status(500).send("Nastala chyba při registraci");
        });
});
//----------POST Auth-------------------
app.post("/api/auth", (req, res) => {
    const loginData = req.body;
    const {error} = validateLogin(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    User.findOne({email: loginData.email})
        .then(user => {
            if (!user || !comparePassword(user.passwordHash, loginData.password)) {
                res.status(400).send("Email nebo heslo nenalezeno");
                return;
            }
            const sessionUser = user.toObject();
            delete sessionUser.passwordHash;
            req.session.user = sessionUser;
            req.session.save((err) => {
                if (err) {
                    res.status(500).send("Nastala chyba při přihlašování");
                    return;
                }
                res.send(getPublicSessionData(sessionUser));
            });
        })
        .catch(() => res.status(500).send("Nastala chyba při hledání uživatele"));
});
//----------DELETE User-------------------
app.delete("/api/auth", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).send("Nastala chyba při mazání session");
            return;
        }
        res.send("Uživatel odhlášen");
    });
});
//----------------------------------------------------------
// Endpoint pro získání všech sekcí - GET
app.get('/api/sections', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sections ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Chyba při získávání sekcí:', err);
    res.status(500).json({ error: 'Chyba při získávání sekcí' });
  }
});
// Endpoint pro získání sekce podle ID
app.get('/api/sections/:id', async (req, res) => {
  const sectionId = parseInt(req.params.id);
  if (isNaN(sectionId)) {
    return res.status(400).json({ error: 'Neplatné ID sekce' });
  }
  try {
    const result = await pool.query('SELECT * FROM sections WHERE id = $1', [sectionId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sekce nenalezena' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Chyba při získávání sekce:', err);
    res.status(500).json({ error: 'Chyba při získávání sekce' });
  }
});

// Endpoint pro vytvoření nové sekce-----POST------
app.post('/api/sections', async (req, res) => {
  const { error } = validateSection.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const { name, description, author } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO sections (name, description, author) VALUES ($1, $2, $3) RETURNING *',
      [name, description, author]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Chyba při vytváření sekce:', err);
    res.status(500).json({ error: 'Chyba při vytváření sekce' });
  }
});

// Endpoint pro aktualizaci sekce -----PUT------
app.put('/api/sections/:id', async (req, res) => {
  const sectionId = parseInt(req.params.id);
  if (isNaN(sectionId)) {
    return res.status(400).json({ error: 'Neplatné ID sekce' });
  }
  const { error } = validateSection.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const { name, description, author } = req.body;
  try {
    const result = await pool.query(
      'UPDATE sections SET name = $1, description = $2, author = $3, last_updated = NOW() WHERE id = $4 RETURNING *',
      [name, description, author, sectionId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sekce nenalezena' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Chyba při aktualizaci sekce:', err);
    res.status(500).json({ error: 'Chyba při aktualizaci sekce' });
  }
});
// Endpoint pro smazání sekce  -----DELETE------
app.delete('/api/sections/:id', async (req, res) => {
  const sectionId = parseInt(req.params.id);
  if (isNaN(sectionId)) {
    return res.status(400).json({ error: 'Neplatné ID sekce' });
  }
  try {
    const result = await pool.query('DELETE FROM sections WHERE id = $1 RETURNING *', [sectionId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sekce nenalezena' });
    }
    res.json({ message: 'Sekce úspěšně smazána' });
  } catch (err) {
    console.error('Chyba při mazání sekce:', err);
    res.status(500).json({ error: 'Chyba při mazání sekce' });
  }
});

//----------End of CRUD pro sekce článků-------------------
// Endpoint CRUD pro získání všech článků ----GET------
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Chyba při získávání článků:', err);
    res.status(500).json({ error: 'Chyba při získávání článků' });
  }
});
// Endpoint pro získání článku podle ID   -----GET------
app.get('/api/posts/:id', async (req, res) => {
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Neplatné ID článku' });
  }
  try {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Článek nenalezen' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Chyba při získávání článku:', err);
    res.status(500).json({ error: 'Chyba při získávání článku' });
  }
});
// Endpoint pro vytvoření nového článku  -----POST------
app.post('/api/posts', async (req, res) => {
  const { error } = validatePost.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const { section_id, title, content, author } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO posts (section_id, title, content, author) VALUES ($1, $2, $3, $4) RETURNING *',
      [section_id, title, content, author]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Chyba při vytváření článku:', err);
    res.status(500).json({ error: 'Chyba při vytváření článku' });
  }
});
// Endpoint pro aktualizaci článku -----PUT------
app.put('/api/posts/:id', async (req, res) => {
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Neplatné ID článku' });
  }
  const { error } = validatePost.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const { section_id, title, content, author } = req.body;
  try {
    const result = await pool.query(
      'UPDATE posts SET section_id = $1, title = $2, content = $3, author = $4, created_at = NOW() WHERE id = $5 RETURNING *',
      [section_id, title, content, author, postId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Článek nenalezen' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Chyba při aktualizaci článku:', err);
    res.status(500).json({ error: 'Chyba při aktualizaci článku' });
  }
});
// Endpoint pro smazání článku   -----DELETE------
app.delete('/api/posts/:id', async (req, res) => {
  const postId = parseInt(req.params.id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Neplatné ID článku' });
  }
  try {
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [postId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Článek nenalezen' });
    }
    res.json({ message: 'Článek úspěšně smazán' });
  } catch (err) {
    console.error('Chyba při mazání článku:', err);
    res.status(500).json({ error: 'Chyba při mazání článku' });
  }
});
//--------Rozšíření CRUD operací pro články a sekce----------------
// Endpoint pro získání článků podle sekce -----GET------
app.get('/api/sections/:id/posts', async (req, res) => {
  const sectionId = parseInt(req.params.id);
  if (isNaN(sectionId)) {
    return res.status(400).json({ error: 'Neplatné ID sekce' });
  }
  try {
    const result = await pool.query('SELECT * FROM posts WHERE section_id = $1 ORDER BY id', [sectionId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Chyba při získávání článků podle sekce:', err);
    res.status(500).json({ error: 'Chyba při získávání článků podle sekce' });
  }
});
// Endpoint pro získání článků podle autora -----GET------
app.get('/api/posts/author/:author', async (req, res) => {
  const author = req.params.author;
  try {
    const result = await pool.query('SELECT * FROM posts WHERE author = $1 ORDER BY id', [author]);
    res.json(result.rows);
  } catch (err) {
    console.error('Chyba při získávání článků podle autora:', err);
    res.status(500).json({ error: 'Chyba při získávání článků podle autora' });
  }
});
// Endpoint pro získání článků podle názvu  -----GET------
app.get('/api/posts/title/:title', async (req, res) => {
  const title = req.params.title;
  try {
    const result = await pool.query('SELECT * FROM posts WHERE title ILIKE $1 ORDER BY id', [`%${title}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error('Chyba při získávání článků podle názvu:', err);
    res.status(500).json({ error: 'Chyba při získávání článků podle názvu' });
  }
});
// Endpoint pro získání článků podle data vytvoření -----GET------
app.get('/api/posts/created_at/:date', async (req, res) => {
  const date = req.params.date;
  try {
    const result = await pool.query('SELECT * FROM posts WHERE created_at::date = $1 ORDER BY id', [date]);
    res.json(result.rows);
  } catch (err) {
    console.error('Chyba při získávání článků podle data vytvoření:', err);
    res.status(500).json({ error: 'Chyba při získávání článků podle data vytvoření' });
  }
});
// Endpoint pro získání článků podle data aktualizace -----GET------
app.get('/api/posts/updated_at/:date', async (req, res) => {
  const date = req.params.date;
  try {
    const result = await pool.query('SELECT * FROM posts WHERE last_updated::date = $1 ORDER BY id', [date]);
    res.json(result.rows);
  } catch (err) {
    console.error('Chyba při získávání článků podle data aktualizace:', err);
    res.status(500).json({ error: 'Chyba při získávání článků podle data aktualizace' });
  }
});
//------------To jsou všechny CRUD operace pro sekce a články----------------
// Zde můžete přidat další endpointy nebo middleware podle potřeby

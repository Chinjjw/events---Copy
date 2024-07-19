require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

// MySQL Connection Pooling
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Get all events (GET request)
app.get('/events', (req, res) => {
    const selectQuery = 'SELECT * FROM events';

    db.query(selectQuery, (err, results) => {
        if (err) {
            console.error('Error fetching events:', err);
            return res.status(500).json({ error: 'Failed to fetch events' });
        }
        res.status(200).json(results);
    });
});

// Get single event by ID (GET request)
app.get('/events/:id', (req, res) => {
    const eventId = req.params.id;
    const selectQuery = 'SELECT * FROM events WHERE id = ?';

    db.query(selectQuery, [eventId], (err, results) => {
        if (err) {
            console.error(`Error fetching event with ID ${eventId}:`, err);
            return res.status(500).json({ error: 'Failed to fetch event details' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: `Event with ID ${eventId} not found` });
        }

        res.status(200).json(results[0]);
    });
});

// Add an event (POST request)
app.post('/events', (req, res) => {
    const { name, description, date, location, pin } = req.body;

    // Validate PIN (staff pin is '1234')
    if (pin !== '1234') {
        return res.status(403).json({ error: 'Incorrect staff pin' });
    }

    // Validate required fields
    if (!name || !description || !date || !location) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const insertQuery = 'INSERT INTO events (name, description, date, location, created_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
    const createdBy = 1; // Example staff user id

    db.query(insertQuery, [name, description, date, location, createdBy], (err, result) => {
        if (err) {
            console.error('Error adding event:', err);
            return res.status(500).json({ error: 'Failed to add event' });
        }
        const eventId = result.insertId;
        console.log(`Event added with ID: ${eventId}`);

        // Send Discord notification
        axios.post(discordWebhookUrl, {
            content: `New event added: **${name}**\nDescription: ${description}\nDate: ${date}\nLocation: ${location}`
        }).then(response => {
            console.log('Discord notification sent successfully');
        }).catch(error => {
            console.error('Error sending Discord notification:', error);
        });

        // Fetch and return the newly added event
        const selectQuery = 'SELECT * FROM events WHERE id = ?';
        db.query(selectQuery, [eventId], (err, results) => {
            if (err) {
                console.error('Error fetching newly added event:', err);
                return res.status(500).json({ error: 'Failed to fetch newly added event' });
            }
            res.status(201).json({ message: 'Event added successfully', event: results[0] });
        });
    });
});

// Update an event (PUT request)
app.put('/events/:id', (req, res) => {
    const eventId = req.params.id;
    const { name, description, date, location, pin } = req.body;

    // Validate PIN (staff pin is '1234')
    if (pin !== '1234') {
        return res.status(403).json({ error: 'Incorrect staff pin' });
    }

    // Validate required fields
    if (!name || !description || !date || !location) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const updateQuery = 'UPDATE events SET name=?, description=?, date=?, location=? WHERE id=?';
    const values = [name, description, date, location, eventId];

    db.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error(`Error updating event with ID ${eventId}:`, err);
            return res.status(500).json({ error: 'Failed to update event' });
        }
        console.log(`Event updated with ID: ${eventId}`);
        res.status(200).json({ message: 'Event updated successfully' });
    });
});

// Delete an event (DELETE request)
app.delete('/events/:id', (req, res) => {
    const eventId = req.params.id;

    const deleteQuery = 'DELETE FROM events WHERE id = ?';

    db.query(deleteQuery, [eventId], (err, result) => {
        if (err) {
            console.error(`Error deleting event with ID ${eventId}:`, err);
            return res.status(500).json({ error: 'Failed to delete event' });
        }
        console.log(`Event deleted with ID: ${eventId}`);
        res.status(200).json({ message: 'Event deleted successfully' });
    });
});

// Handle 404 - Not Found
app.use((req, res, next) => {
    res.status(404).send('404 - Not Found');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('500 - Server Error');
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

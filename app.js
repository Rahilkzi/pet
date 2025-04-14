// Import Express
const express = require('express');
const app = express();
const path = require('path');
app.set('view engine', "ejs");
const db = require ("./database/database.ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Import admin routes
const adminRoutes = require("./routes/admin");


const session = require('express-session');


app.use(
  session({
    secret: 'your_secret_key', // 🔐 Change this to a secure random string in production
    resave: false,
    saveUninitialized: false,
  })
);


// For protecting user routes
function isUserAuthenticated(req, res, next) {
    console.log(req.session.user);
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// For protecting admin routes
function isAdminAuthenticated(req, res, next) {
    if (req.session.admin) {
        return next();
    }
    res.redirect('/admin/login');
}
// Use admin routes
app.use("/admin", adminRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ GET Route for Login Page
app.get('/login', (req, res) => {
    res.render('signin');  
});

// ✅ POST Route for Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('email' + email);

    if (!email || !password) {
        return res.status(400).json({ message: '❌ Please enter both email and password.' });
    }

    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
      if (err) {
        return res.status(500).json({ message: '❌ Database error.' });
      }
      if (!user) {
        return res.status(401).json({ message: '❌ Invalid credentials.' });
      }

      req.session.user = user; // Store user session
      res.json({ message: '✅ Login successful!', user });
    });
});

// ✅ GET Route for Signup Page
app.get('/signup', (req, res) => {
    res.render('signin');  
});

// ✅ POST Route for Signup
// ✅ POST Route for Signup (Simple version, no bcrypt)
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: '❌ All fields are required.' });
    }

    db.run(
        `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        [username, email, password],
        function (err) {
            if (err) {
                console.error("DB Error:", err.message);
                return res.status(500).json({ message: '❌ User already exists or database error.' });
            }
            res.json({ message: '✅ Signup successful!', userId: this.lastID });
        }
    );
});





// ✅ GET Route for Admin Login Page
app.get('/admin/login', (req, res) => {
    res.render('adminlogin'); 
});

// ✅ POST Route for Admin Login
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: '❌ Please enter both username and password.' });
    }

    db.get(`SELECT * FROM admins WHERE username = ? AND password = ?`, [username, password], (err, user) => {
        if (err) {
            return res.status(500).json({ message: '❌ Database error.' });
        }
        if (!user) {
            return res.status(401).json({ message: '❌ Invalid credentials.' });
        }
        // res.json({ message: '✅ Login successful!', user });
        res.redirect("/dashboard");
    });
});


// Add a new pet
app.post("/pets", (req, res) => {
    const { pet_name, category, breed, age, description, image } = req.body;
    console.log(req.body)
    const sql = `INSERT INTO pets (pet_name, category, breed, age, description, image) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [pet_name, category, breed, age, description, image], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
});

// Get all pets
app.get("/pets", (req, res) => {
    const sql = `SELECT * FROM pets`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Update a pet
app.put("/pets/:id", (req, res) => {
    const { pet_name, category, breed, age, description, image } = req.body;
    const sql = `UPDATE pets SET pet_name = ?, category = ?, breed = ?, age = ?, description = ?, image = ? WHERE id = ?`;
    db.run(sql, [pet_name, category, breed, age, description, image, req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ changes: this.changes });
    });
});

// Delete a pet
app.delete("/pets/:id", (req, res) => {
    const sql = `DELETE FROM pets WHERE id = ?`;
    db.run(sql, [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ changes: this.changes });
    });
});





// ✅ GET Route for Admin Signup Page
app.get('/admin/signup', (req, res) => {

    res.render('adminsignup');  
});

// ✅ POST Route for Admin Signup (Without bcrypt)
app.post('/admin/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send("❌ All fields are required.");
    }

    
    

    db.run(
        `INSERT INTO admins (username, email, password) VALUES (?, ?, ?)`,
        [username, email, password],
        (err) => {
            if (err) {
                return res.send("❌ Error: " + err.message);
            }
            res.send(`
                <script>
                    alert('✅ Admin signup successful! Redirecting to login page...');
                    window.location.href = '/admin/login';
                </script>
            `);
        }
    );
});




// ✅ GET Route for Admin Dashboard (After Login)
app.get('/admin/dashboard', (req, res) => {
    res.send('<h1>Welcome to the Admin Dashboard!</h1>');
});


app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    // Dummy authentication (replace with actual user authentication logic)
    if (username === 'admin' && password === 'password') {
        // Redirect to the admin dashboard after successful login
        res.redirect('/admin/dashboard');
    } else {
        res.send('Invalid credentials! <a href="/login">Try again</a>');
    }
});









// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'assets')));

// Define a route
app.get('/', (req, res) => res.render('home'));
app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/adopt', (req, res) => {
    res.render('adopt');
});

// Get single pet for adoption page
app.get('/adopt/:id', (req, res) => {
    const petId = req.params.id;
    db.get(`SELECT * FROM pets WHERE id = ?`, [petId], (err, pet) => {
        if (err || !pet) {
            return res.status(404).render('404', { message: 'Pet not found' });
        }
        res.render('adopt', { pet }); // Create this view file
    });
});

// Handle adoption form submission
// In your Express server (app.js or similar)
// app.post('/adopt/:id', async (req, res) => {
//     const petId = parseInt(req.params.id);
//     const { name, email, phone, housing, yard, why_pet, terms } = req.body;

//     // Validate input
//     if (!petId || isNaN(petId)) {
//         return res.status(400).json({ error: 'Invalid pet ID' });
//     }

//     // Validate required fields
//     const requiredFields = { name, email, phone, housing, yard, why_pet, terms };
//     const missingFields = Object.entries(requiredFields)
//         .filter(([_, value]) => !value)
//         .map(([key]) => key);

//     if (missingFields.length > 0) {
//         return res.status(400).json({ 
//             error: 'Missing required fields',
//             missingFields 
//         });
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//         return res.status(400).json({ error: 'Invalid email format' });
//     }

//     try {
//         // Verify pet exists and is available
//         const pet = await new Promise((resolve, reject) => {
//             db.get('SELECT id, status FROM pets WHERE id = ?', [petId], (err, row) => {
//                 if (err) reject(err);
//                 resolve(row);
//             });
//         });

//         if (!pet) {
//             return res.status(404).json({ error: 'Pet not found' });
//         }

//         if (pet.status !== 'available') {
//             return res.status(400).json({ error: 'Pet is not available for adoption' });
//         }

//         // Process adoption
//         const result = await new Promise((resolve, reject) => {
//             db.run(
//                 `INSERT INTO adoptions (
//                     pet_id, 
//                     adopter_name, 
//                     adopter_email, 
//                     adopter_phone, 
//                     housing_type, 
//                     has_yard, 
//                     adoption_reason, 
//                     status
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
//                 [petId, name, email, phone, housing, yard, why_pet],
//                 function(err) {
//                     if (err) reject(err);
//                     resolve(this);
//                 }
//             );
//         });

//         // Generate reference number
//         const refNumber = `ADOPT-${petId.toString().padStart(4, '0')}-${result.lastID.toString().padStart(6, '0')}`;

//         // Update pet status to pending
//         await new Promise((resolve, reject) => {
//             db.run(
//                 'UPDATE pets SET status = ? WHERE id = ?',
//                 ['pending', petId],
//                 (err) => {
//                     if (err) reject(err);
//                     resolve();
//                 }
//             );
//         });

//         // Send success response
//         res.status(201).json({
//             success: true,
//             refNumber,
//             message: 'Application submitted successfully',
//             petId,
//             adoptionId: result.lastID
//         });

//     } catch (err) {
//         console.error('Adoption error:', err);
//         res.status(500).json({ 
//             error: 'Internal server error',
//             details: process.env.NODE_ENV === 'development' ? err.message : undefined
//         });
//     }
// });
// In your Express server (app.js or similar)
// Fix the adoption route to handle both logged-in and guest adoptions
app.post('/adopt/:id', async (req, res) => {
    try {
        const petId = parseInt(req.params.id);
        const { name, email, phone, housing, yard, why_pet, terms } = req.body;
        console.log(name, email, phone, housing, yard, why_pet, terms)

        // Validate input
        if (!petId || isNaN(petId)) {
            return res.status(400).json({ error: 'Invalid pet ID' });
        }

        // Check required fields
        if (!name || !email || !phone || !housing || !yard || !why_pet || !terms) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Verify pet exists and is available
        const pet = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM pets WHERE id = ?', [petId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!pet) return res.status(404).json({ error: 'Pet not found' });
        if (pet.status !== 'available') {
            return res.status(400).json({ error: 'Pet not available' });
        }

        // Process adoption
        const result = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO adoptions (
                    pet_id, 
                    adopter_name, 
                    adopter_email, 
                    adopter_phone,
                    housing_type, 
                    has_yard, 
                    adoption_reason,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [petId, name, email, phone, housing, yard, why_pet],
                function(err) {
                    if (err) reject(err);
                    resolve(this);
                }
            );
        });

        // Generate reference number
        const refNumber = `ADOPT-${petId}-${result.lastID}`;

        // Update pet status
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE pets SET status = ? WHERE id = ?',
                ['pending', petId],
                (err) => err ? reject(err) : resolve()
            );
        });

        res.json({ 
            success: true,
            refNumber,
            petId,
            adoptionId: result.lastID
        });

    } catch (err) {
        console.error('Adoption error:', err);
        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Add to your server
const cors = require('cors');
app.use(cors());

// View Routes
app.get('/browse_pet', isUserAuthenticated, (req, res) => {
    db.all(`SELECT * FROM pets`, [], (err, pets) => {
        if (err) return res.status(500).send("Database error");
        res.render('browse_pet', { pets });
    });
});

app.get('/get_involved', (req, res) => {
    res.render('get_involved');
});

app.get('/pet_care', (req, res) => {
    res.render('pet_care');
});


app.get('/success_stories', (req, res) => {
    res.render('success_stories');
});

app.get('/signin', (req, res) => {
    res.render('signin');  
  });
  

app.get('/donate', (req, res) => {
    res.render('donate');
});

app.get('/meet', (req, res) => {
    res.render('meet');
});

// Route to render the dashboard
app.get("/dashboard", (req, res) => {
    const sql = `SELECT * FROM pets`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Render the dashboard view and pass the pets data
        res.render("dashboard", { pets: rows });
    });
});




app.get('/adopet', (req, res) => {
    res.render('adopet');
});

app.get('/user_panel', (req, res) => {
    res.render('user_panel');
});

app.get('/add_pet', (req, res) => {
    res.render('add_pet');
});


app.get('/track_application', (req, res) => {
    res.render('track_application');
});


// Start the server
app.listen(3001, () => {
    console.log('Server is running on http:/localhost:3001');
});
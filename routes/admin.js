const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

const db = require ("../database/database.ejs");

const multer = require('multer');
const fs = require('fs');
const path = require('path');


// Set up multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'admin/uploads/'); // Store images in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Generate unique file name
    }
});
const upload = multer({ storage: storage });

// Route for the admin dashboard
router.get("/dashboard", (req, res) => {
    res.render("layout", { component: "dashboard.ejs" });
});

// Route for pet listings
router.get("/pet-listings", (req, res) => {
    const sql =
      'SELECT id, pet_name, category, breed, age, description, image FROM pets'; // Modify according to your DB schema
    
    db.all(sql, [], (err, pets) => {
        console.log(pets)
        if (err) {
            console.error(err.message);
            return res.status(500).send("Database error");
        }
        res.render("layout", { component: "pet-listings", pets });
    });
});

// Route for adding a new pet
router.post("/add-pet", upload.single("petImage"), (req, res) => {
    const { petName, petCategory, petBreed, petAge, petDescription } = req.body;
    const petImage = req.file ? req.file.filename : null;

    if (!petName || !petCategory || !petBreed || !petAge || !petDescription) {
        return res.status(400).send("All fields are required.");
    }

    // SQL query to insert the new pet into the database
    const sql = `INSERT INTO pets (pet_name, category, breed, age, description, image) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [petName, petCategory, petBreed, petAge, petDescription, petImage];

    db.run(sql, params, function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Database error");
        }
        console.log(`New pet added with ID: ${this.lastID}`);
        res.redirect("/admin/pet-listings"); // Redirect back to the pet listings page
    });
});


// Route for deleting a pet
router.delete("/delete-pet/:id", (req, res) => {
    const petId = req.params.id;

    // Step 1: Get pet info from the database (to get image file name)
    const selectQuery = "SELECT image_url FROM pets WHERE id = ?";
    db.get(selectQuery, [petId], (err, pet) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Database error");
        }

        if (!pet) {
            return res.status(404).send("Pet not found");
        }

        // Step 2: Delete the pet record from the database
        const deleteQuery = "DELETE FROM pets WHERE id = ?";
        db.run(deleteQuery, [petId], function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Failed to delete pet");
            }

            // Step 3: Delete the image file (if exists)
            if (pet.image_url) {
                const imagePath = path.join(__dirname, "uploads", pet.image_url);
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error("Error deleting image:", err);
                    }
                    // Log the successful deletion
                    console.log(`Pet with ID ${petId} and image deleted`);
                });
            }

            res.send("Pet deleted successfully");
        });
    });
});


// Route for adoption requests
router.get("/adoption-requests", (req, res) => {
    res.render("layout", { component: "adoption-requests.ejs" });
});

// Route for donations
router.get("/donations", (req, res) => {
    res.render("layout", { component: "donations.ejs" });
});

// Route for analytics
router.get("/analytics", (req, res) => {
    res.render("layout", { component: "analytics.ejs" });
});

// Route for messaging
router.get("/messaging", (req, res) => {
    res.render("layout", { component: "messaging.ejs" });
});

// Route for get involved
router.get("/get-involved", (req, res) => {
    res.render("layout", { component: "get-involved.ejs" });
});

// Route for settings
router.get("/settings", (req, res) => {
    res.render("layout", { component: "settings.ejs" });
});

// Route for user management
router.get("/user-management", (req, res) => {
    res.render("layout", { component: "user-management.ejs" });
});

module.exports = router;





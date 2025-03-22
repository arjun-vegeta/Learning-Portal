const db = require('./database');
const bcrypt = require('bcrypt');

// Set your desired admin credentials
const username = 'admin';
const password = 'adminpassword'; // Change to a strong password
const name = 'Admin';
const role = 'admin';

// Hash the password using bcrypt
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  // Insert the admin user into the database
  const sql = `INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)`;
  db.run(sql, [username, hash, role, name], function(err) {
    if (err) {
      console.error('Error inserting admin:', err);
    } else {
      console.log('Admin account created successfully with username:', username);
    }
    process.exit();
  });
});

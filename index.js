const express = require('express');
const mysql = require('mysql');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const { register } = require('module');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();

app.use(session({secret: 'keyboard cat',
resave: false,
saveUninitialized: true,
// cookie: { secure: true }
}))

// Set up Handlebars as the view engine
app.engine('hbs', exphbs.engine({ extname: 'hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '905331',
    database: 'details'
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());


app.get('/',(req,res)=>{
    res.render('login',{title:'Login'});
});
app.get('/register',(req,res)=>{
    res.render('register',{title:'register'})
});
// app.get('/details',(req,res)=>{
//     res.render('/details',{title:'details'});
// })
// Handle POST request to register a student
// app.post('/register',  (req, res) => {
//     const { username, email, password } = req.body;

//     const sql = 'INSERT INTO user (username, email, password) VALUES (?, ?, ?)';
//     connection.query(sql, [username, email, password], (err, result) => {
//         if (err) {
//             console.error('Error registering student:', err);
//             return res.status(500).send('Error registering student');
//         }
//         console.log('registered successfully');

//         // Redirect to home page after registration
//         res.redirect('/');
//     });
// });

app.post('/register', function (req, res) {

    const { username,email, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            res.send('Hashing error');
            return;
        }
        const data = [username,email, hash];
        const sql = "INSERT INTO user(username,email,password) VALUES (?,?,?)"
        connection.query(sql, data, (err, result) => {
            if (err) { throw err; }
            console.log('User data stored successfully');
            res.redirect('/');
        });
    });
});

// Route to handle login form submission

app.post('/login', (req, res) => {
    // Implement login logic
    const { username, password } = req.body;
    connection.query('SELECT * FROM user WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const user = results[0];
            // Compare passwords
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) throw err;
                if (result) {
                    // Passwords match, login successful
                    // -------------------------------------------------
                    req.session.user_visit = 1;
//--------------------------------------------------
                    res.redirect('/details'); // Redirect to dashboard page
                } else {
                    res.send('Invalid username or password');
                }
            });
        } else {
            res.send('Invalid username or password');
        }
    });

  // Serve the HTML form
app.get('/details', (req, res) => {

    if(req.session.user_visit)
    {
    // Retrieve all user information from the database
    const sql = 'SELECT * FROM information';
    connection.query(sql, (err, rows) => {
        if (err) {
            console.error('Error fetching information:', err);
            return res.status(500).send('Error fetching information');
        }
        // Render the form and table with data
        res.render('details', { students: rows });
    });
}
else{
    res.redirect('/error');
}
});
});

app.get('/error',(req,res)=>{
    res.render('error',{title:'unauthorized acces'});
});

// Route to handle logout
// app.get('/logout', (req, res) => {
//     // Clear the session data
//     req.session.destroy((err) => {
//       if (err) {
//         console.error('Error destroying session:', err);
//         res.status(500).send('Internal server error');
//         return;
//       }
//       // Redirect the user to the login page after logout
//       res.redirect('/');
//     });
//   });

//----
function logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Error destroying session");
      }
      res.redirect('/');
    });
  }
  
  app.get('/logout', (req, res) => {
    logout(req, res);
  });
//----
// Route to handle downloading profile images
app.get('/download/:id', (req, res) => {
    const userId = req.params.id;
// console.log('hello');
    // Retrieve the profile image filename from the database
    const sql = 'SELECT profile_image FROM information WHERE id = ?';
    connection.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching profile image filename:', err);
            return res.status(500).send('Error fetching profile image');
        }

        // Check if a profile image exists for the user
        if (results.length === 0 || !results[0].profile_image) {
            return res.status(404).send('Profile image not found');
        }

        const profileImageFileName = results[0].profile_image;
        const profileImagePath = path.join(__dirname, 'uploads', profileImageFileName);

        // Check if the file exists
        if (!fs.existsSync(profileImagePath)) {
            return res.status(404).send('Profile image not found');
        }

        // Serve the profile image file for download with its original filename
        res.download(profileImagePath, profileImageFileName);
    });
});

app.listen(8001,()=>console.log("server started"));
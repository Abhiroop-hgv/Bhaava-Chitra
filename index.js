arr=[]
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Destination folder for uploaded files

// Set up MongoDB connection
// Set up MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


// User schema and model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Configure Passport.js
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }

      const result = await bcrypt.compare(password, user.password);
      if (!result) {
        return done(null, false, { message: 'Incorrect password' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

// Express middlewares
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.get('/upload', isAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/upload.html');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;

  bcrypt
    .hash(password, 10)
    .then((hash) => {
      const user = new User({
        username: username,
        password: hash,
      });

      return user.save();
    })
    .then(() => {
      res.redirect('/'); // Redirect to login page after successful registration
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error registering user');
    });
});

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/upload', // Redirect to upload page after successful login
    failureRedirect: '/', // Redirect back to login page if authentication fails
  })
);

app.post('/', isAuthenticated, upload.single('image'), (req, res) => {
  // Check if an image was uploaded
  if (!req.file) {
    res.status(400).send('No image file uploaded');
    return;
  }

  const imagePath = req.file.path; // Path to the uploaded image
  console.log(imagePath);

  sharp(imagePath)
    .resize(48, 48) // Resize the image to 48x48 pixels
    .grayscale() // Convert the image to grayscale
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const { width, height } = info;
      const pixels = [];

      // Extract the pixel values
      for (let i = 0; i < data.length; i++) {
        pixels.push(data[i]);
      }

      res.send(pixels); // Send the grayscale pixel values as the response
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error processing the image');
    });
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/');
}

app.listen(7000, () => {
  console.log('Server started on port 7000');
});
console.log(arr);

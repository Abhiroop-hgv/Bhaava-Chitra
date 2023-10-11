const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const path = require('path');
const feedForward = require('./ann'); // Import the feed forward module
const app = express();
const upload = multer({ dest: 'uploads/' }); // Destination folder for uploaded files
app.use(express.static(path.join(__dirname, 'public')));
mongoose.connect('mongodb://127.0.0.1:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema and model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  uploadedImages: [String], // Array to store the paths or filenames of uploaded images
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

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('C:\\Users\\Admin\\OneDrive\\Desktop\\restapi\\gpt\\uploads')); // Serve uploaded images from the specified directory
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.get('/upload', isAuthenticated, (req, res) => {
  const uploadedImages = req.user.uploadedImages; // Retrieve the uploaded images from the user object

  res.render('upload', { user: req.user, images: uploadedImages }); // Pass the uploaded images to the upload.ejs file
});

app.get('/previous', isAuthenticated, (req, res) => {
  const uploadedImages = req.user.uploadedImages.map((filename) => {
    return req.protocol + '://' + req.get('host') + '/uploads' + filename; // Generate the full URL for each uploaded image
  });

  res.render('previous-images', { images: uploadedImages }); // Render the "previous-images" view and pass the uploaded images
});

app.get('/previous-images', isAuthenticated, (req, res) => {
  const uploadedImages = req.user.uploadedImages; // Retrieve the uploaded images from the user object

  res.render('previous-images', { images: uploadedImages }); // Render the "previous-images" view and pass the uploaded images
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;

  bcrypt
    .hash(password, 10)
    .then((hash) => {
      const user = new User({
        username: username,
        password: hash,
        uploadedImages: [], // Initialize the uploadedImages array as empty for a new user
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

  const filename = req.file.filename; // Filename of the uploaded image
  const imagePath = '/uploads/' + filename; // URL of the uploaded image

  sharp(req.file.path)
    .resize(48, 48) // Resize the image to 48x48 pixels
    .grayscale() // Convert the image to grayscale
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data }) => {
      // Perform the feed forward computation
      const result = feedForward(data);

      // Save the image URL to the user's uploadedImages array
      req.user.uploadedImages.push(imagePath);
      req.user.save();

      res.send(result.toString()); // Send the grayscale pixel values as the response
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

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

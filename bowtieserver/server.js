
const dotenv = require('dotenv')
dotenv.config()

const PORT = process.env.PORT || 5000

const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const flash = require('connect-flash')
const session = require('express-session')
const passport = require('passport')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

//DB Config
const db = require(path.join(__dirname, 'config', 'keys')).MongoURI

//Connect to Mongo
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

//Most important middleware for cors warning to reset
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
}));

//Express session
app.use(session({
  secret: 'bowtieproject',
  resave: true,
  saveUninitialized: true,
}))

app.use(cookieParser('bowtieproject'))

//To avoid going back to the logged out pages via browser back button after logging out
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
  });


  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    sessionConfig.cookie.secure = true; // serve secure cookies
  }

//Passport middleware and config
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport)

//Connect flash
app.use(flash())

//Global Variables (our own middleware)
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
})

//Routes
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))

app.listen(PORT, console.log(`Server started on port ${PORT}`))

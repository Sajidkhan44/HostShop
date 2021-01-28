if(process.env.NODE_ENV !=="production"){
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const campgrounds = require('./routes/campgrounds')
const Review = require('./models/review');
const Campground = require('./models/campground');
const reviews = require('./routes/reviews')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const localStrategy = require('passport-local')
const User = require('./models/user')
const userRoutes = require('./routes/user')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet');
const { contentSecurityPolicy } = require('helmet');
const {MongoStore} = require('connect-mongo')
const  MongoDbStore = require("connect-mongo")(session)


const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
    mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify:false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')))
app.use(mongoSanitize())

const secret = process.env.SECRET || 'thisistobebettersecret'
 const store = new MongoDbStore({
     url: dbUrl,
     secret,
     touchAfter: 24 * 60 * 60
 })
 store.on("error" ,function (e) {
     console.log("error",e)   
 })
const sessionconfig = {
    store,
    name:'session',
    secret,
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:Date.now()+1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(helmet())
app.use(session(sessionconfig))
app.use(flash())
app.use(passport.initialize());
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())



const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com",
    "https://api.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://kit.fontawesome.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://source.unsplash.com/random"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com",
    "https://stackpath.bootstrapcdn.com",
    "https://api.mapbox.com",
    "https://api.tiles.mapbox.com",
    "https://fonts.googleapis.com",
    "https://use.fontawesome.com",
    "https://source.unsplash.com/random"
];
const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://*.tiles.mapbox.com",
    "https://events.mapbox.com",
    "https://source.unsplash.com/random"
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dxflvagfb/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com",
                "https://source.unsplash.com/random"
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


///     -------sessions-----------    ///
app.use((req,res,next)=>{

    res.locals.currentUser = req.user
    res.locals.success= req.flash('success')
    res.locals.error= req.flash('error')
    next();
})

app.use('/',userRoutes)
app.use('/campgrounds',campgrounds)
app.use('/campgrounds/:id/reviews',reviews)


app.get('/', (req, res) => {
    res.render('home')
})


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`serving on ${port}`)
})



if(process.env.Node_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const { Client } = require('pg');
const pgCamelCase = require('pg-camelcase');
pgCamelCase.inject(require('pg'));
const { pool } = require('./dbConfig');

    const initializePassport = require('./passport-config')
initializePassport(passport);


app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req,res) => {
    res.render('index.ejs', { name: req.user.name })
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated,(req, res) => {
    res.render('register.ejs')
})

app.post('/register', async (req, res) => {
    let { name, email, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
       pool.query(`INSERT INTO public.accounts (name, email, password) 
       VALUES ($1, $2, $3)
       RETURNING id, password`, [name, email, hashedPassword],  
       (err, results) => {
               if (err) {
                throw err;
               }
               req.flash('success_msg', "You are now registered. Please log in");
               res.redirect('/login');
           })
       
        });
       
    


app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
       return res.redirect('/')
    }
    next()
}
app.listen(3000, () => {
    console.log('Listening on port 3000');
});
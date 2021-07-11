const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const passport = require('passport')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
dotenv.config()

//Models
const User = require('../models/User')

const usertypes = ['free', 'individual', 'teammember', 'teamadmin']
//Register Page
router.post('/register', (req, res) => {
    const {name, email, password, password2, usertype} = req.body
    let errors = []

    //Check required fields
    if(!name || !email || !password || !password2 || !usertype){
        errors.push({msg: 'Please fill in all fields'})
    }

    //Check user type
    if(!usertypes.includes(usertype)){
      errors.push({msg: 'Wrong user type'})
    }

    //Check password match
    if(password !== password2){
        errors.push({msg: 'Passwords do not match'})
    }

    //Check pass length
    if(password.length < 8){
        errors.push({msg: 'Password should be at least 8 characteres'})
    }

    if(errors.length > 0){
        res.json(...errors)
    }else{
        //Data passes validation
        User.findOne({email: email})
        .then(user => {
            if(user){
                //User exists
                errors.push({msg: 'Email is already registered'})
                res.json(...errors)
            }else{
                const newUser = new User({name, email, password, usertype})
                bcrypt.hash(newUser.password, 10, (err, hashedPassword) => {
                    if(err) throw err
                    newUser.password = hashedPassword
                    newUser.save()
                    .then(savedUser => {
                      if(savedUser != null){
                        res.json(true)
                      }
                    })
                    .catch(err => {
                      if(err != null){
                        res.json('Error in registering. Please contact the admin')
                        console.log('Error in saving:', err)
                      }
                    })
                })
            }
        })
    }
})


// Login handle
router.post('/login', (req, res, next) => {
    const {email, password} = req.body   
    let errors = []

    //Check required fields
    if(!email || !password){
        errors.push({msg: 'Please fill in all fields'})
    }

    if(errors.length > 0){
        res.json(...errors)
    }else {
      passport.authenticate('local', {
        successRedirect: '/loginSuccess',
        failureRedirect: '/loginFailed',
        failureFlash: true
      })(req, res, next)
    }
})

router.get('/loggedin', (req, res) =>{
  if(req.session.passport && Object.keys(req.session.passport).length != 0 ){
    res.json(true)
  }else{
    res.json(false)
  }
  
})
//Logout handle
router.get('/logout', (req, res) => {
    req.logout()
    req.session.destroy()
    res.json(true)
})

//Forget password
router.post('/forget', (req, res) => {
    let token = crypto.randomBytes(16).toString('hex')

    User.findOne({email: req.body.email}).then(user => {
        if(!user){
            res.json('This email is not registered')
            // res.redirect('/users/forgot')
        }else{
            //Save reset password token
            user.resetPasswordToken = token
            user.resetPasswordExpires = Date.now() + 3600000
            user.save().then(user => {
                //Send reset password email
                let smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: process.env.APP_EMAIL,
                        pass: process.env.APP_PASS
                    }
                })
                let mailOptions = {
                    to: user.email,
                    from: process.env.APP_EMAIL,
                    subject: 'Bowtie App Password Reset',
                    text:   'You are receiving this email because you (or someone else) have requested to reset the password for your account.\n\n' +
                            'Please click on the following link, or copy and paste it into your browser to complete the process:\n\n' +
                            'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
                            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                }

                smtpTransport.sendMail(mailOptions, (err, data) => {
                    if(err){
                        console.log(err)
                    }else{
                        res.json('An email has been sent to ' + user.email + ' with further instructions')
                        // res.redirect('/users/forgot')
                    }
                })
            }).catch(err => console.log(err))
        }
    })
})

router.get('/reset/:token', (req, res) => {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}})
    .then(user => {
        if(!user){
            res.json('Password reset token is invalid or has expired')
            // res.redirect('/users/forgot')
        }else {
          res.json('Password reset')
            // res.render('reset', {token: req.params.token})
        }
    })
})

router.post('/reset/:token', (req, res) => {
    const {password, password2, token} = req.body
    let errors = []

    //Check required fields
    if(!password || !password2){
        errors.push({msg: 'Please fill in all fields'})
    }

    //Check password match
    if(password !== password2){
        errors.push({msg: 'Passwords do not match'})
    }

    //Check pass length
    if(password.length < 6){
        errors.push({msg: 'Password should be at least 6 characteres'})
    }

    if(errors.length > 0){
      res.json(...errors)
        // res.render('reset',{errors, password, password2, token: req.params.token})
    }else{
        //Data pass validation
        User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}})
        .then(user => {
            if(!user){
                res.json('Password reset token is invalid or has expired')
                // res.redirect('/users/forgot')
            }else {                
                user.resetPasswordToken = ''
                user.password = password
                bcrypt.hash(user.password, 10, (err, hashedPassword) => {
                    if(err) throw err
                    user.password = hashedPassword
                    user.save()
                    .then(user => res.json('Your password has been reset'))
                    .catch(err => console.log(err))
                })
            }
        })
    }
})

module.exports = router
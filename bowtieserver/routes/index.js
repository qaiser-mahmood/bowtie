const express = require('express')
const bcrypt = require('bcryptjs')
const router = express.Router()
const {ensureAuthenticated} = require('../config/auth')

//Models
const User = require('../models/User')
const Team = require('../models/Team')

//Welcome page
router.get('/', (req, res) => res.json('welcome\nFree Licence\nIndividual Licence\nTeam Licence'))

// Login Page
router.get('/loginSuccess', ensureAuthenticated, (req, res) => {
  if(req.user.usertype == 'free'){
    res.redirect('/freeuser')
  }else if(req.user.usertype == 'individual'){
    res.redirect('/individualuser')
  }else if(req.user.usertype == 'teammember'){
    res.redirect('/teammember')
  }else{
    res.json('teamadmin')
  }
})

router.get('/loginFailed', (req, res) => res.json('username or password incorrect'))

//Dashboard page
router.get('/teamadmin', ensureAuthenticated, (req, res) => {
  if(req.user.usertype == 'free'){
    res.redirect('/freeuser')
  }else if(req.user.usertype == 'individual'){
    res.redirect('/individualuser')
  }else if(req.user.usertype == 'teammember'){
    res.redirect('/teammember')
  }else{
    res.json('Team admin dashboard')
  }
})

router.get('/teammember', ensureAuthenticated, (req, res) => {
  if(req.user.usertype == 'free'){
    res.redirect('/freeuser')
  }else if(req.user.usertype == 'individual'){
    res.redirect('/individualuser')
  }else if(req.user.usertype == 'teamadmin'){
    res.redirect('/teamadmin')
  }else{
    res.json('teammember')
  }
})

router.get('/individualuser', ensureAuthenticated, (req, res) => {
  if(req.user.usertype == 'free'){
    res.redirect('/freeuser')
  }else if(req.user.usertype == 'teammember'){
    res.redirect('/teammember')
  }else if(req.user.usertype == 'teamadmin'){
    res.redirect('/teamadmin')
  }else{
    res.json('individual')
  }
})

router.get('/freeuser', ensureAuthenticated, (req, res) => {
  res.send('free')
})

//Save Team
router.post('/addmember', ensureAuthenticated, (req, res) => {
  if(req.user.usertype == 'teamadmin'){
    let {teamname, name, email, password, usertype} = req.body
    let errors = []

    //Check required fields
    if(!teamname || !name || !email || !password){
        errors.push({msg: 'Please fill in all fields'})
    }

    //Check member type
    if(!usertype){
      usertype = 'teammember'
    }else{
      usertype = 'teamadmin'
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
                      Team.findOneAndUpdate({name: teamname}, {$push: {members: savedUser}}, {useFindAndModify: false}, (err, doc)=>{
                        if(err){
                          res.json('Error in adding the member')
                          console.log(err);
                        }else{
                          res.json('Member added to the team')
                        }
                      })
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
  }else{
    res.redirect('/loginSuccess')
  }
  
    // const {teamname, membername, memberemail, company, membertype} = req.body
    // let errors = []

    // //Check required fields
    // if(!teamname || !membername || !memberemail || !company || !membertype){
    //     errors.push({msg: 'Please fill in all fields'})
    // }

    // if(errors.length > 0){
    //     res.json(...errors)
    // }else{
    //     //Data passes validation
    //     User.findOne({email: req.user.memberemail})
    //     .then(user => {
    //         if(user){
    //             //Create member and save it in the current user
    //             const newMember = new Member({name, email})
    //             newMember.save().then(member => {
    //                 //New member created and saved in Member model. Now reference it in current user
    //                 user.members.push(member)
    //                 user.save()
    //                 .then(user => res.json('Your member has been saved'))
    //                 .catch(err => console.log(err))
    //             })
    //         }else{
    //             //error msg
    //         }
    //     })
    // }
})

module.exports = router
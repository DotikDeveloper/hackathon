import mongoose from 'mongoose';
import passport from 'passport';

import settings from './auth.config';
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router ();
import Users from "/modules/account/Users";

router.post ('/api/auth/register', function (req, res) {
    if (!req.body.login || !req.body.password) {
        res.json ({success: false, msg: 'Please pass login and password.'});
    } else {
        let newUser = new Users ({
            login: req.body.login,
            password: req.body.password,
            type: 'password'
        });
        // save the user
        newUser.save (function (err) {
            if (err) {
                return res.json ({success: false, msg: 'Login already exists.'});
            }
            res.json ({success: true, msg: 'Successful created new user.'});
        });
    }
});

router.post ('/api/auth/login',
    function (req, res) {
        Users.findOne ({
            login: req.body.login
        }, function (err, user) {
            if (err) throw err;

            if (!user) {
                res.status (401).send ({success: false, msg: 'Authentication failed. User not found.'});
            } else {
                // check if password matches
                user.comparePassword (req.body.password, function (err, isMatch) {
                    if (isMatch && !err) {
                        //passport.authenticate('jwt',function(err, user, info) {
                            var token = jwt.sign (user.toJSON (), settings.secret);
                            req.session.user = user.toJSON();
                            req.session.save (function (err) {
                                console.error(err);
                                res.json ({success: true, token: 'JWT ' + token});
                            });
                        //});

                    } else {
                        res.status (401).send ({success: false, msg: 'Authentication failed. Wrong password.'});
                    }
                });
            }
        });
    });

router.get ('/auth/vk',
    passport.authenticate ('vkontakte'),
    function (req, res) {
        // The request will be redirected to vk.com for authentication, so
        // this function will not be called.
    });

router.get ('/_oauth/vk',
    passport.authenticate ('vkontakte', {failureRedirect: '/login'}),
    function (req, res) {
        if (req.user && req.session.save) {
            req.session.user = req.user.toJSON?req.user.toJSON():req.user;
            req.session.save (function (err) {
                if (err) {
                    // ... panic!
                }
                res.redirect ('/');
            });
            return;
        }
        res.redirect ('/');
    });

export default router;
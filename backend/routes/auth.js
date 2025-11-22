// import express from 'express';
// import passport from 'passport';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import auth from '../middleware/auth.js';

// const router = express.Router();

// /* -------------------------------------------
//    GOOGLE AUTH STRATEGY
// --------------------------------------------*/
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: '/auth/google/callback',
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ googleId: profile.id });

//         if (!user) {
//           user = await User.create({
//             googleId: profile.id,
//             name: profile.displayName,
//             email: profile.emails?.[0]?.value,
//             photo: profile.photos?.[0]?.value,
//           });
//         }

//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//           expiresIn: '1d',
//         });

//         return done(null, { user, token });
//       } catch (err) {
//         return done(err);
//       }
//     }
//   )
// );

// /* -------------------------------------------
//    GOOGLE LOGIN ROUTES
// --------------------------------------------*/
// router.get(
//   '/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// router.get(
//   '/google/callback',
//   passport.authenticate('google', {
//     session: false,
//     failureRedirect: 'http://localhost:3000/login',
//   }),
//   (req, res) => {
//     res.redirect(`http://localhost:3000/dashboard?token=${req.user.token}`);
//   }
// );

// /* -------------------------------------------
//    GET CURRENT LOGGED USER
// --------------------------------------------*/
// router.get('/me', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-googleId -__v');
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });

// /* -------------------------------------------
//    GET SPECIFIC USER (needed for chat)
// --------------------------------------------*/
// router.get('/user/:id', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select('name photo email online');

//     if (!user) return res.status(404).json({ msg: 'User not found' });

//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });

// /* -------------------------------------------
//    GET FRIEND DETAILS
// --------------------------------------------*/
// router.get('/me/friends/:friendId', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).populate(
//       'friends',
//       'name photo online'
//     );

//     const friend = user.friends.find(
//       (f) => f._id.toString() === req.params.friendId
//     );

//     if (!friend) return res.status(404).json({ msg: 'Not a friend' });

//     res.json(friend);
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });

// export default router;

import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// FRONTEND URL (Production or Local)
const FRONTEND_URL = process.env.FRONTEND_URL.replace(/\/$/, "");

/* -------------------------------------------
   GOOGLE AUTH STRATEGY
--------------------------------------------*/
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://social-app-backend-5l4i.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            photo: profile.photos?.[0]?.value,
          });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: '1d',
        });

        return done(null, { user, token });
      } catch (err) {
        return done(err);
      }
    }
  )
);

/* -------------------------------------------
   GOOGLE LOGIN ROUTES
--------------------------------------------*/
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/dashboard?token=${req.user.token}`);
  }
);

/* -------------------------------------------
   GET CURRENT USER
--------------------------------------------*/
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-googleId -__v');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* -------------------------------------------
   GET USER BY ID
--------------------------------------------*/
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name photo email online');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/* -------------------------------------------
   GET FRIEND DETAILS
--------------------------------------------*/
router.get('/me/friends/:friendId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      'friends',
      'name photo online'
    );

    const friend = user.friends.find(
      (f) => f._id.toString() === req.params.friendId
    );

    if (!friend) return res.status(404).json({ msg: 'Not a friend' });

    res.json(friend);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;

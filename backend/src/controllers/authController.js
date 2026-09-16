const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegisterInput, validateLoginInput } = require('../utils/validators');
const { ValidationError, AuthError } = require('../utils/errors');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    validateRegisterInput({ name, email, password });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ValidationError('An account with this email already exists');
    }

    const validRoles = ['reporter', 'responder', 'admin'];
    const user = await User.create({
      name,
      email,
      password,
      role: validRoles.includes(role) ? role : 'reporter'
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    validateLoginInput({ email, password });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AuthError('Invalid email or password');
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = { register, login, me };

import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userExists = await User.findOne({ username });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      email, 
      password: hashedPassword 
    });

    // Create session instead of JWT
    req.session.userId = user._id;

    res.status(201).json({ 
      success: true,
      message: 'User registered',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Use session instead of JWT
    req.session.userId = user._id;

    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const logout = async (req, res) => {
  // Clear session instead of JWT
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error logging out'
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  });
};

export const getMe = async (req, res) => {
  try {
    // Get user ID from session
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message 
    });
  }
};

export const addFavorite = async (req, res) => {
  try {
    // Get user ID from session
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const { countryCode, countryName, flagUrl } = req.body;
    const userId = req.session.userId;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if already in favorites
    if (user.favorites.includes(countryCode)) {
      return res.status(400).json({ 
        success: false,
        message: 'Country already in favorites' 
      });
    }

    // Add to favorites
    user.favorites.push(countryCode);
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'Favorite added', 
      favorite: {
        _id: new mongoose.Types.ObjectId(),
        countryCode,
        countryName,
        flagUrl,
        user: userId
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const getFavorites = async (req, res) => {
  try {
    // Get user ID from session
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Get countries data for the favorites
    const favoriteCountries = [];
    
    for (const code of user.favorites) {
      try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0]) {
            favoriteCountries.push({
              _id: new mongoose.Types.ObjectId(), // Generate an ID for frontend use
              countryCode: code,
              countryName: data[0].name.common,
              flagUrl: data[0].flags.svg,
              user: userId
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching country ${code}:`, error);
      }
    }

    res.status(200).json({ 
      success: true,
      favorites: favoriteCountries 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: err.message 
    });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    // Get user ID from session
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const favoriteId = req.params.id;
    const userId = req.session.userId;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const countryCode = req.params.code;

    // Check if in favorites
    if (!user.favorites.includes(countryCode)) {
      return res.status(400).json({ 
        success: false,
        message: 'Country not in favorites' 
      });
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(code => code !== countryCode);
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'Favorite removed' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: err.message 
    });
  }
};

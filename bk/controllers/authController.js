const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const moment = require('moment');
const crypto = require('crypto');


async function register(req, res) {
  const { username, password, mobile_number, organization, role } = req.body;

  // Check if all required fields are provided
  if (!username || !password || !mobile_number || !organization || !role) {
    return res.status(400).json({ message: 'All fields are required', success : false });
  }

  try {
    // Check if the username already exists
    const [existingUser] = await db.execute('SELECT * FROM users WHERE username = ? OR mobile_number = ?', [username, mobile_number]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Username or mobile number already exists', success : false });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    await db.execute('INSERT INTO users (username, password, mobile_number, organization, role) VALUES (?, ?, ?, ?, ?)', [
      username, hashedPassword, mobile_number, organization, role
    ]);

    // Create a JWT token for the new user
    const token = jwt.sign({ username, mobile_number, role }, process.env.JWT_SECRET, { expiresIn: '8h' }, { data : req.body});

    res.status(201).json({ message: 'User registered successfully', token, success : true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', success : false });
  }
}

// async function login(req, res) {
//   const { username, password, organization } = req.body;

//   if (!username || !password || !organization) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   try {
//     const [rows] = await db.execute(
//       'SELECT * FROM users WHERE username = ? AND organization = ?',
//       [username, organization]
//     );

//     if (rows.length === 0) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await bcrypt.compare(password, rows[0].password);

//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.status(200).json({ token });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// }

// async function login(req, res) {
//   const { username, password, mobile_number, organization } = req.body;

//   // Check that either username or mobile_number is provided
//   if (!username && !mobile_number) {
//     return res.status(400).json({ message: "Username or Mobile number is required" });
//   }

//   // Check that password and organization are provided
//   if (!password || !organization) {
//     return res.status(400).json({ message: "Password and organization are required" });
//   }

//   try {
//     // If username is provided, check against username, else check against mobile_number
//     const loginField = username ? 'username' : 'mobile_number';
//     const loginValue = username || mobile_number;

//     // Query the database with the provided login field (either username or mobile_number)
//     const query = `SELECT * FROM users WHERE ${loginField} = ? AND organization = ?`;
//     const [rows] = await db.execute(query, [loginValue, organization]);

//     if (rows.length === 0) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Compare the password with the hashed password stored in the database
//     const isMatch = await bcrypt.compare(password, rows[0].password);

//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Extract user details and role
//     const user = rows[0];
//     const role = user.role;

//     // Generate a JWT token, include the role in the payload
//     const token = jwt.sign(
//       { userId: user.id, role: role },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     // Return the token as a response
//     res.status(200).json({ token });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// }

async function login(req, res) {
  const { username, password, mobile_number } = req.body;

  // Ensure at least one of username or mobile number is provided
  if (!username && !mobile_number) {
    return res.status(400).json({ message: 'Username or mobile number is required', success : false });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required', success : false });
  }
  // if (!organization) {
  //   return res.status(400).json({ message: 'Organization is required' });
  // }

  try {
    let query = '';
    let params = [];
    
    // Determine if we are using username or mobile_number to search for the user
    if (username) {
      query = 'SELECT * FROM users WHERE username';
      params = [username];
    } else {
      query = 'SELECT * FROM users WHERE mobile_number';
      params = [mobile_number];
    }

    // Query database to find user by username or mobile number
    const [rows] = await db.execute(query, params);

    // If user is not found
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials', success : false });
    }

    // Compare the provided password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials', success : false });
    }

    // Generate JWT token including user id, username, mobile number, and role
    const token = jwt.sign(
      {
        userId: rows[0].id,
        username: rows[0].username,
        mobile_number: rows[0].mobile_number,
        role: rows[0].role // Include role in the token
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send response with token
    res.status(200).json({
      token,
      success : true,
      user: {
        userId: rows[0].id,
        username: rows[0].username,
        mobile_number: rows[0].mobile_number,
        role: rows[0].role,
        organization: rows[0].organization // If you want to include organization in the response
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', success : false });
  }
}



async function generateOTP(req, res) {
  const { mobile_number } = req.body;

  if (!mobile_number) {
    return res.status(400).json({ message: 'Mobile number is required', success : false });
  }

  try {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expiry time (valid for 10 minutes)
    const otpExpiresAt = moment().add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    // Save OTP to the database (using async/await)
    const [rows] = await db.execute(
      'INSERT INTO otp (mobile_number, otp, otp_expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, otp_expires_at = ?',
      [mobile_number, otp, otpExpiresAt, otp, otpExpiresAt]
    );

    console.log('OTP saved successfully:', rows);

    // You would typically send the OTP to the user's mobile number here (e.g., via SMS)
    console.log(`Sending OTP ${otp} to mobile number ${mobile_number}`);

    // Respond with success message
    return res.status(200).json({ success : true, message: 'OTP sent successfully', "otp" : otp });

  } catch (err) {
    console.error('Error inserting OTP into the database:', err);
    return res.status(500).json({ message: 'Server error', success : false });
  }
}

// Verify OTP entered by the user
async function verifyOTP(req, res) {
  const { mobile_number, otp } = req.body;

  // Ensure that mobile_number and otp are provided in the request
  if (!mobile_number || !otp) {
    return res.status(400).json({ message: 'Mobile number and OTP are required', success : false });
  }

  try {
    // Query the OTP table to get the stored OTP for the given mobile number
    const [rows] = await db.execute('SELECT * FROM otp WHERE mobile_number = ?', [mobile_number]);

    // Check if the user is found
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Mobile number not found', success : false });
    }

    const userOtp = rows[0];

    // Check if the OTP provided by the user matches the one stored in the database
    if (userOtp.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP', success : false });
    }

    // Check if the OTP has expired
    const otpExpiresAt = moment(userOtp.otp_expires_at);
    if (moment().isAfter(otpExpiresAt)) {
      return res.status(400).json({ message: 'OTP has expired', success : false });
    }

    // OTP is valid, generate a token for the user (You could use JWT here as well)
    const token = crypto.randomBytes(16).toString('hex');

    // Respond with the token
    return res.status(200).json({ message: 'OTP verified successfully', success : true, token });

  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ message: 'Server error',success : false });
  }
}

async function resetPassword(req, res) {
  const { mobile_number, new_password } = req.body;

  if (!mobile_number || !new_password) {
    return res.status(400).json({ message: 'Mobile number and new password are required',success : false });
  }

  try {
    // Query the database to find the user by mobile number
    const [rows] = await db.execute('SELECT * FROM users WHERE mobile_number = ?', [mobile_number]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Mobile number not found',success : false });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update the user's password in the database
    const [updateResult] = await db.execute(
      'UPDATE users SET password = ? WHERE mobile_number = ?',
      [hashedPassword, mobile_number]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({ message: 'Failed to reset password',success : false });
    }

    // After resetting the password, get user details
    const [userDetails] = await db.execute('SELECT * FROM users WHERE mobile_number = ?', [mobile_number]);

    // Generate JWT token including user details
    const token = jwt.sign(
      {
        userId: userDetails[0].id,
        username: userDetails[0].username,
        mobile_number: userDetails[0].mobile_number,
        role: userDetails[0].role, // Include role in the token
        organization: userDetails[0].organization // Optional, if needed
      },
      process.env.JWT_SECRET, // Replace with your secret
      { expiresIn: '1h' } // Token expiration time
    );

    // Send back the user details along with the generated token
    return res.status(200).json({
      message: 'Password reset successfully',
      success : true,
      user: {
        id: userDetails[0].id,
        username: userDetails[0].username,
        mobile_number: userDetails[0].mobile_number,
        role: userDetails[0].role,
        organization: userDetails[0].organization,
      },
      token,
    });
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateConfirm(req, res) {
  const { user_id } = req.body; // Expecting user_id in the payload to update the confirm column

  // Validate input
  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required', success : false  });
  }

  try {
    // Query the database to find the user by ID
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [user_id]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'User not found', success : false });
    }

    // Update the 'confirm' column to true for the given user
    const [updateResult] = await db.execute(
      'UPDATE users SET confirm = true WHERE id = ?',
      [user_id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({ message: 'Failed to update confirmation status', success : false });
    }

    // Return success response
    res.status(200).json({ message: 'User confirmation status updated to true', success : true, });

  } catch (err) {
    console.error('Error updating user confirmation:', err);
    res.status(500).json({ message: 'Server error' });
  }
}


module.exports = {
    generateOTP,
    verifyOTP,
    register,
    resetPassword,
    updateConfirm,
    login
};

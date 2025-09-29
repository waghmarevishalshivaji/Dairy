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
    // const token = await jwt.sign({ username, mobile_number, role }, process.env.JWT_SECRET, { expiresIn: '8h' }, { data : req.body});

    const token = jwt.sign(
      { username, mobile_number, role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({ message: 'User registered successfully', token, success : true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', success : false });
  }
}




async function login(req, res) {
  const { username, password, mobile_number, role } = req.body;

  // Ensure at least one of username or mobile number is provided
  if (!username && !mobile_number) {
    return res.status(400).json({ message: 'Username or mobile number is required', success: false });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password is required', success: false });
  }

  try {
    let query = '';
    let params = [];
    
    // Determine if we are using username or mobile_number to search for the user
    if (username) {
      query = 'SELECT * FROM users WHERE username = ? AND role = ?';  // Corrected query
      params = [username, role];
    } else if (mobile_number) {
      query = 'SELECT * FROM users WHERE mobile_number = ? AND role = ?';  // Corrected query
      params = [mobile_number, role];
    }

    console.log(query, params);

    // Query database to find user by username or mobile number
    const [rows] = await db.execute(query, params);
    console.log(rows.length);

    // If user is not found
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials', success: false });
    }

    // Compare the provided password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials', success: false });
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
      { expiresIn: '8h' }
    );


    let dairydata = {}
    if(rows[0].role == 'Dairymgr'){
      // dairyquery = 'SELECT * FROM userDairy WHERE user_id = ?';  // Corrected query
      // dairyparams = [rows[0].user_id];
      // const [dairyrows] = await db.execute(dairyquery, dairyparams);

      const dairyquery = `
        SELECT 
          udairy.*, dairy.*
        FROM 
          userDairy as udairy
        JOIN 
          dairy as dairy 
        ON 
          udairy.dairy_id = dairy.id 
        WHERE 
          udairy.user_id = ?`;
          
      const dairyparams = [rows[0].id];
      const [dairyrows] = await db.execute(dairyquery, dairyparams);
      dairydata.id = dairyrows[0].id
      dairydata.name = dairyrows[0].name
      dairydata.branchname = dairyrows[0].branchname
      dairydata.ownername = dairyrows[0].ownername
      dairydata.days = dairyrows[0].days
      dairydata.villagename = dairyrows[0].villagename
      dairydata.address = dairyrows[0].address
    }

    console.log("here===",rows[0])

    // Send response with token
    res.status(200).json({
      token,
      success: true,
      user: {
        userId: rows[0].id,
        username: rows[0].username,
        mobile_number: rows[0].mobile_number,
        role: rows[0].role,
        confirm: rows[0].confirm,
        is_mobile: rows[0].is_mobile,
        organization: rows[0].organization, // If you want to include organization in the response
      },
      userAll: rows[0],
      dairydata : dairydata
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', success: false });
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
  const { mobile_number, otp, role } = req.body;

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

     const [updateResult] = await db.execute(
      'UPDATE users SET is_mobile = ? WHERE mobile_number = ?',
      [1, mobile_number]
    );

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



    if (mobile_number && role == 'Dairyadmin') {
      if (mobile_number && role) {
        query = 'SELECT * FROM users WHERE mobile_number = ? AND role = ?';  // Filter by both mobile_number and role
        params = [mobile_number, role];
      } 
      // Query database to find user by mobile number and role
      const [userrows] = await db.execute(query, params);
      if (userrows.length === 1) {

        console.log(userrows)

        const [rowsdairy] = await db.execute('SELECT d.*, usr.username FROM dairy as d LEFT JOIN userDairy as ud ON ud.dairy_id = d.id LEFT JOIN users as usr on usr.id = ud.user_id  WHERE d.createdby = ?', [userrows[0]['id']]);
        return res.status(200).json({ message: 'List of dairy', success: true, data : rowsdairy });
      }
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

async function resetPasswordUsername(req, res) {
  const { username, new_password } = req.body;

  if (!username || !new_password) {
    return res.status(400).json({ message: 'Mobile number and new password are required',success : false });
  }

  try {
    // Query the database to find the user by mobile number
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Username number not found',success : false });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update the user's password in the database
    const [updateResult] = await db.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, username]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({ message: 'Failed to reset password',success : false });
    }

    // After resetting the password, get user details
    const [userDetails] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

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
  const { user_id, role } = req.body; // Expecting user_id in the payload to update the confirm column

  // Validate input
  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required', success : false  });
  }

  try {
    // Query the database to find the user by ID
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ? AND role = ?', [user_id, role]);

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


async function registefarmer(req, res) {
  const { username, fullName, mobile_number, email, address, milkType, rateChart, panCard, aadhaarCard, bankName, accountNumber, ifscCode, role, dairy_id } = req.body;

  // Check if all required fields are provided
  if (!username || !fullName || !mobile_number || !address || !milkType || !rateChart || !role) {
    return res.status(400).json({ message: 'All fields are required', success : false });
  }

  try {
    // Check if the username already exists
    //const [existingUser] = await db.execute('SELECT * FROM users WHERE username = ? OR mobile_number = ?', [username, mobile_number]);
    let roleuser = 'Farmer';
    const [existingUser] = await db.execute(
      'SELECT * FROM users WHERE (username = ? OR mobile_number = ?) AND role = ? AND dairy_id = ?',
      [username, mobile_number, roleuser, dairy_id]
    );


    if (existingUser.length > 0) {
      return res.status(200).json({ message: 'Username or mobile number already exists', success : false });
    }

    // Hash the password before storing it in the database
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    // await db.execute('INSERT INTO users (username, fullName, mobile_number, email, address, milkType, rateChart, panCard, aadhaarCard, bankName, accountNumber, ifscCode, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    //   username, fullName, mobile_number, email, address, milkType, rateChart, panCard, aadhaarCard, bankName, accountNumber, ifscCode, role
    // ]);


    const allowedFields = [
      'username',
      'fullName',
      'mobile_number',
      'email',
      'address',
      'milkType',
      'rateChart',
      'panCard',
      'aadhaarCard',
      'bankName',
      'accountNumber',
      'ifscCode',
      'role',
      'dairy_id'
    ];

    // Only include fields that exist in the request
    const fieldsToInsert = allowedFields.filter(field => field in req.body);

    // Extract values in same order
    const values = fieldsToInsert.map(field => req.body[field]);

    // Debug (you asked for this)
    console.log('Fields:', fieldsToInsert);
    console.log('Values:', values);

    // Build dynamic query
    const placeholders = fieldsToInsert.map(() => '?').join(', ');
    const query = `INSERT INTO users (${fieldsToInsert.join(', ')}) VALUES (${placeholders})`;

    await db.execute(query, values);

    const token = jwt.sign(
      { username, mobile_number, role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({ message: 'User registered successfully', token, success : true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', success : false });
  }
}


function generateUniqueTimeNumber() {
    return Date.now();
}

async function registefarmerid(req, res) {
  const { branchname } = req.body;
  let mgrname = branchname+"_"+generateUniqueTimeNumber();
  res.status(200).json({ message: 'Success', success : true, id : mgrname });
} 


// GET Next Farmer ID
async function getNextFarmerId(req, res) {
    try {
        const { dairy_id, dairy_name } = req.query;

        if (!dairy_id || !dairy_name) {
            return res.status(400).json({ success: false, message: "Missing dairy_id or dairy_name" });
        }

        // Get last inserted farmer_id for this dairy
        const [rows] = await db.execute(
            "SELECT * FROM users WHERE dairy_id = ? AND role = ? ORDER BY id DESC LIMIT 1",
            [dairy_id, 'Farmer']
        );

        let nextNumber = 1; // default first farmer
        if (rows.length > 0) {
            // Extract last 4 digits from farmer_id
            console.log(rows[0])
            const lastId = rows[0].username;
            console.log(lastId)
            // const lastNumber = parseInt(lastId.match(/\d+$/)[0]); // get number from end
            const match = lastId.match(/(\d+)$/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
            // nextNumber = lastNumber + 1;
        }

        // Format new farmer id
        const prefix = dairy_name.replace(/\s+/g, '').toUpperCase();
        const nextFarmerId = `${prefix}${String(nextNumber).padStart(4, '0')}`;

        return res.status(200).json({
            success: true,
            next_farmer_id: nextFarmerId
        });

    } catch (err) {
        console.error("Error generating next farmer id:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}



async function updateUser(req, res) {
  const { id, ...updateFields } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'formatted_user_id is required' });
  }

  // No fields to update
  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ message: 'No fields provided to update' });
  }

  try {
    // Build dynamic SET clause
    const setClause = Object.keys(updateFields)
      .map(field => `${field} = ?`)
      .join(', ');

    const values = Object.values(updateFields);
    values.push(id); // for WHERE clause

    const sql = `UPDATE users SET ${setClause} WHERE id  = ?`;

    const [result] = await db.query(sql, values);

    const sqlget = `Select * from users WHERE id  = ?`;

    const [resultget] = await db.query(sqlget, id);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'User updated successfully', data : resultget  });
    } else {
      res.status(404).json({ success: false, message: 'User not found or no changes made'});
    }

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


// Logout API
async function logout(req, res) {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }

    // Clear expo_token
    const [result] = await db.execute(
      `UPDATE users SET expo_token = '' WHERE id = ?`,
      [user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully. Expo token cleared."
    });
  } catch (err) {
    console.error("Error during logout:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}




module.exports = {
    generateOTP,
    verifyOTP,
    register,
    resetPassword,
    updateConfirm,
    login, 
    registefarmer,
    registefarmerid,
    updateUser,
    getNextFarmerId,
    resetPasswordUsername,
    logout
};

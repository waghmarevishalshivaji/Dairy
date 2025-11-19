const db = require('../../config/db');

// Get settings by VLC
async function getSettings(req, res) {
  const { vlc } = req.body;
  if (!vlc) {
    return res.status(400).json({ success: false, message: 'VLC is required' });
  }
  try {
    const [rows] = await db.execute('SELECT * FROM settings WHERE vlc = ?', [vlc]);
    if (rows.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: {
          vlc,
          add_farmer: 0,
          rate_chart: 0,
          deduction: 0,
          payment_receipt: 0,
          generate_bill: 0,
          analyser: 0,
          weight_tier: 0,
          weight: 0,
          printer: 0,
          language: 'English',
          report_language: 'English'
        }
      });
    }
    return res.status(200).json({ 
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Update settings
async function updateSettings(req, res) {
  const { vlc, add_farmer, rate_chart, deduction, payment_receipt, generate_bill, analyser, weight_tier, weight, printer, language, report_language } = req.body;
  if (!vlc) {
    return res.status(400).json({ success: false, message: 'VLC is required' });
  }
  try {
    const [existing] = await db.execute('SELECT id FROM settings WHERE vlc = ?', [vlc]);
    if (existing.length > 0) {
      await db.execute(
        'UPDATE settings SET add_farmer = ?, rate_chart = ?, deduction = ?, payment_receipt = ?, generate_bill = ?, analyser = ?, weight_tier = ?, weight = ?, printer = ?, language = ?, report_language = ? WHERE vlc = ?',
        [add_farmer || 0, rate_chart || 0, deduction || 0, payment_receipt || 0, generate_bill || 0, analyser || 0, weight_tier || 0, weight || 0, printer || 0, language || 'English', report_language || 'English', vlc]
      );
    } else {
      await db.execute(
        'INSERT INTO settings (vlc, add_farmer, rate_chart, deduction, payment_receipt, generate_bill, analyser, weight_tier, weight, printer, language, report_language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [vlc, add_farmer || 0, rate_chart || 0, deduction || 0, payment_receipt || 0, generate_bill || 0, analyser || 0, weight_tier || 0, weight || 0, printer || 0, language || 'English', report_language || 'English']
      );
    }
    return res.status(200).json({ 
      success: true, 
      message: 'Settings updated successfully'
    });
  } catch (err) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getSettings, updateSettings };

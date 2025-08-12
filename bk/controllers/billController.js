const pdf = require('html-pdf');
    
// async function download(req, res) {
//     const htmlContent = `
//         <html>
//         <head>
//             <style>
//                 body { font-family: Arial, sans-serif; }
//                 .bill-container { width: 80%; margin: auto; padding: 20px; border: 1px solid #ddd; }
//                 h1 { text-align: center; }
//                 table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//                 th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//                 th { background: #f2f2f2; }
//             </style>
//         </head>
//         <body>
//             <div class="bill-container">
//                 <h1>Invoice</h1>
//                 <p><strong>Bill No:</strong> 12345</p>
//                 <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                
//                 <table>
//                     <tr>
//                         <th>Item</th>
//                         <th>Qty</th>
//                         <th>Price</th>
//                         <th>Total</th>
//                     </tr>
//                     <tr>
//                         <td>Item 1</td>
//                         <td>2</td>
//                         <td>₹100</td>
//                         <td>₹200</td>
//                     </tr>
//                     <tr>
//                         <td>Item 2</td>
//                         <td>1</td>
//                         <td>₹150</td>
//                         <td>₹150</td>
//                     </tr>
//                     <tr>
//                         <th colspan="3">Grand Total</th>
//                         <th>₹350</th>
//                     </tr>
//                 </table>
//             </div>
//         </body>
//         </html>
//     `;

//     pdf.create(htmlContent).toStream((err, stream) => {
//         if (err) return res.status(500).send('Error generating PDF');
//         res.setHeader('Content-type', 'application/pdf');
//         res.setHeader('Content-disposition', 'attachment; filename=bill.pdf');
//         stream.pipe(res);
//     });
// // });
// }

async function download(req, res) {
    const htmlContent = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; font-size: 14px; }
                .bill-container {
                    width: 90%;
                    margin: auto;
                    padding: 20px;
                    border: 1px solid #000;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 22px;
                }
                .bill-info {
                    margin-top: 10px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 6px;
                    text-align: center;
                }
                th {
                    background: #f2f2f2;
                    font-weight: bold;
                }
                .total-row th {
                    text-align: right;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 12px;
                    border-top: 1px solid #000;
                    padding-top: 5px;
                }
            </style>
        </head>
        <body>
            <div class="bill-container">
                <div class="header">
                    <h1>My Shop Name</h1>
                    <p>Address line 1, City, State - Pincode</p>
                    <p>Phone: +91-9876543210</p>
                </div>

                <div class="bill-info">
                    <div><strong>Bill No:</strong> 12345</div>
                    <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                </div>

                <table>
                    <tr>
                        <th>Sr No.</th>
                        <th>Item Name</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Total</th>
                    </tr>
                    <tr>
                        <td>1</td>
                        <td>Item 1</td>
                        <td>2</td>
                        <td>₹100</td>
                        <td>₹200</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Item 2</td>
                        <td>1</td>
                        <td>₹150</td>
                        <td>₹150</td>
                    </tr>
                    <tr class="total-row">
                        <th colspan="4">Grand Total</th>
                        <th>₹350</th>
                    </tr>
                </table>

                <div class="footer">
                    <p>Thank you for your purchase!</p>
                </div>
            </div>
        </body>
        </html>
    `;

    pdf.create(htmlContent, { format: 'A4', border: '10mm' }).toStream((err, stream) => {
        if (err) return res.status(500).send('Error generating PDF');
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-disposition', 'attachment; filename=bill.pdf');
        stream.pipe(res);
    });
}

module.exports = {
    download
};
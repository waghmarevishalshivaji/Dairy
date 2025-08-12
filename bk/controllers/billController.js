const puppeteer = require('puppeteer');

async function downloadBill(req, res) {
    // You can dynamically pass data from DB or request here
    const invoiceData = {
        invoiceNo: "INV-2025-001",
        date: new Date().toLocaleDateString(),
        shopName: "Vishal's Store",
        shopAddress: "123 Main Street, Pune, India",
        phone: "+91 9876543210",
        gst: "27ABCDE1234F1Z5",
        items: [
            { name: "Cold Drink", qty: 2, price: 30 },
            { name: "Sandwich", qty: 1, price: 50 },
            { name: "Water Bottle", qty: 3, price: 15 }
        ]
    };

    const total = invoiceData.items.reduce((sum, item) => sum + (item.qty * item.price), 0);

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    margin: 0;
                    padding: 0;
                }
                .invoice-box {
                    width: 100%;
                    padding: 20px;
                    box-sizing: border-box;
                }
                h2 {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .shop-details {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .shop-details p {
                    margin: 2px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 6px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .total {
                    text-align: right;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 10px;
                    color: gray;
                }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <h2>Invoice</h2>
                <div class="shop-details">
                    <p><strong>${invoiceData.shopName}</strong></p>
                    <p>${invoiceData.shopAddress}</p>
                    <p>Phone: ${invoiceData.phone}</p>
                    <p>GST: ${invoiceData.gst}</p>
                </div>
                
                <table>
                    <tr>
                        <th>Invoice No</th>
                        <td>${invoiceData.invoiceNo}</td>
                        <th>Date</th>
                        <td>${invoiceData.date}</td>
                    </tr>
                </table>

                <table style="margin-top: 10px;">
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                    ${invoiceData.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.qty}</td>
                            <td>₹${item.price}</td>
                            <td>₹${item.qty * item.price}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td colspan="3" class="total">Grand Total</td>
                        <td>₹${total}</td>
                    </tr>
                </table>

                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>This is a computer-generated invoice.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    res.send(pdfBuffer);
}

module.exports = { downloadBill };

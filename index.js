const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const SMTP_USER = 'e.jagomotion@gmail.com';
const SMTP_PASS = 'pocw xumx jkgu azev';
const ADMIN_EMAIL = 'halozacxstore@gmail.com';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

app.post('/send-receipt', async (req, res) => {
    const { 
        to_email, 
        customer_phone, 
        order_id, 
        product_name, 
        amount, 
        account_email, 
        inbox_url 
    } = req.body;

    if (!to_email || !order_id || !account_email) {
        return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap.' });
    }

    const cleanOrderId = String(order_id).replace(/[^a-zA-Z0-9-]/g, '');
    const cleanAmount = Number(amount).toLocaleString('id-ID');

    const plainText = `
Konfirmasi Transaksi - Jagomotion Store
Nomor Pesanan: ${cleanOrderId}

Yth. Pelanggan,
Pembayaran Anda telah diverifikasi dan pesanan Anda telah berhasil diselesaikan.

Rincian:
- Nomor Referensi: ${cleanOrderId}
- Layanan: ${product_name}
- Total: Rp ${cleanAmount}
- Status: Lunas

Data Akses:
- Email Akun: ${account_email}
- Tautan Verifikasi: ${inbox_url || '-'}

Hormat kami,
Jagomotion Store
    `.trim();

    const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <tr>
                <td style="padding: 20px 24px; background: #0891b2; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 18px;">Jagomotion Store</h2>
                    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Konfirmasi Transaksi Digital</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 24px;">
                    <p style="font-size: 14px; margin-top: 0;">Yth. Pelanggan,</p>
                    <p style="font-size: 14px;">Pembayaran Anda telah diverifikasi oleh sistem. Berikut adalah rincian layanan Anda:</p>
                    
                    <table width="100%" cellpadding="6" cellspacing="0" style="background: #f8fafc; border: 1px solid #edf2f7; border-radius: 6px; font-size: 13px; margin: 16px 0;">
                        <tr><td style="color: #64748b; width: 40%;">ID Transaksi</td><td style="font-weight: bold;">${cleanOrderId}</td></tr>
                        <tr><td style="color: #64748b;">Produk</td><td style="font-weight: bold;">${product_name}</td></tr>
                        <tr><td style="color: #64748b;">Total</td><td style="font-weight: bold;">Rp ${cleanAmount}</td></tr>
                        <tr><td style="color: #64748b;">Status</td><td style="color: #16a34a; font-weight: bold;">Lunas</td></tr>
                    </table>

                    <div style="background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 6px; padding: 16px; margin: 16px 0;">
                        <div style="font-size: 11px; font-weight: bold; color: #0e7490; text-transform: uppercase;">Email Akun Akses</div>
                        <div style="font-size: 15px; font-weight: bold; color: #0891b2; word-break: break-all; margin: 6px 0 12px 0;">${account_email}</div>
                        ${inbox_url ? `<a href="${inbox_url}" target="_blank" style="display: inline-block; background: #0891b2; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 4px; font-size: 12px; font-weight: bold;">Buka Kotak Masuk Verifikasi</a>` : ''}
                    </div>
                </td>
            </tr>
            <tr>
                <td style="padding: 16px; background: #f8fafc; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    Pesan otomatis dari Jagomotion Store.
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        await transporter.sendMail({
            from: `"Jagomotion Store" <${SMTP_USER}>`,
            to: to_email,
            replyTo: SMTP_USER,
            subject: `Konfirmasi Akses Layanan Digital ${cleanOrderId}`,
            text: plainText,
            html: html
        });

        await transporter.sendMail({
            from: `"Notifikasi Sistem" <${SMTP_USER}>`,
            to: ADMIN_EMAIL,
            subject: `[PESANAN SUKSES] ${cleanOrderId} - Rp ${cleanAmount}`,
            text: `Transaksi ${cleanOrderId} atas produk ${product_name} senilai Rp ${cleanAmount} telah selesai. Email pembeli: ${to_email}.`
        });

        return res.json({ status: 'success', message: 'Notifikasi berhasil dikirim.' });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/send-cancellation', async (req, res) => {
    const { to_email, order_id, product_name } = req.body;

    if (!to_email || !order_id) {
        return res.status(400).json({ status: 'error', message: 'Parameter tidak lengkap.' });
    }

    const cleanOrderId = String(order_id).replace(/[^a-zA-Z0-9-]/g, '');

    try {
        await transporter.sendMail({
            from: `"Jagomotion Store" <${SMTP_USER}>`,
            to: to_email,
            subject: `Pemberitahuan Pembatalan Pesanan ${cleanOrderId}`,
            text: `Yth. Pelanggan, pesanan Anda dengan ID ${cleanOrderId} untuk produk ${product_name || 'Layanan Digital'} telah dibatalkan. Anda dapat membuat pesanan baru kapan saja melalui portal kami.`
        });
        return res.json({ status: 'success', message: 'Notifikasi pembatalan terkirim.' });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Layanan notifikasi aktif di port ${PORT}`);
});
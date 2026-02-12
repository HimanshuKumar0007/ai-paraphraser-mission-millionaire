import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import sql from "../config/db.js";

export const signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password too short" });
        }

        // 2. Check if user already exists
        const existing =
            await sql`select id from users where email = ${email}`;

        if (existing.length > 0) {
            return res.status(409).json({ error: "User already exists" });
        }

        // 3. Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. Insert user
        const user =
            await sql`
        insert into users (email, password_hash)
        values (${email}, ${passwordHash})
        returning id, email, plan
      `;

        // 5. Generate JWT
        const token = jwt.sign(
            {
                userId: user[0].id,
                plan: user[0].plan
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 6. Return response
        res.status(201).json({
            message: "Signup successful",
            token,
            user: {
                id: user[0].id,
                email: user[0].email,
                plan: user[0].plan
            }
        });

    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.status(500).json({ error: "Signup failed" });
    }
};

export const login = async (req, res) => {
    console.log("Login request received:", req.body);
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        // 1. Find user
        const users =
            await sql`select id, email, password_hash, plan from users where email = ${email}`;

        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = users[0];

        // 2. Compare password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { userId: user.id, plan: user.plan },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 4. Return
        console.log("Login successful, sending response for user:", user.email);
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                plan: user.plan
            }
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);

        res.status(500).json({ error: "Login failed" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        console.log("Forgot password requested for:", email);

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // 1. Check if user exists (Case Insensitive)
        const users = await sql`SELECT id, email FROM users WHERE LOWER(email) = LOWER(${email})`;

        if (users.length === 0) {
            console.log("User not found for email:", email);
            // Return success even if user not found to prevent enumeration
            return res.json({ message: "If an account exists, a reset link has been sent." });
        }

        const user = users[0];
        console.log("User found:", user.email);

        // 2. Generate reset token
        const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

        // 3. Save token to DB
        await sql`
            UPDATE users 
            SET reset_password_token = ${resetToken}, 
                reset_password_expires = ${resetExpires} 
            WHERE id = ${user.id}
        `;
        console.log("Reset token saved to DB for user:", user.id);

        // 4. Send email (MOCK)
        const resetLink = `http://localhost:5173/reset-password.html?token=${resetToken}`;
        console.log("GENERATED RESET LINK:", resetLink); // KEEP THIS FOR DEBUGGING

        // Send email via Nodemailer
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: process.env.EMAIL_PORT || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            console.log("Attempting to send email to:", user.email);
            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER, // sender address
                to: user.email, // list of receivers
                subject: "Password Reset Request - WordlyAi", // Subject line
                html: `
                    <p>You requested a password reset.</p>
                    <p>Click this link to reset your password:</p>
                    <a href="${resetLink}">${resetLink}</a>
                    <p>This link expires in 1 hour.</p>
                `, // html body
            });
            console.log("Reset email sent. MessageId:", info.messageId);
        } catch (emailError) {
            console.error("Failed to send email:", emailError);
            // Fallback for development if no creds
            console.log("fallback link:", resetLink);
            // We still return success to user/frontend dev doesn't break
        }


        res.json({ message: "If an account exists, a reset link has been sent." });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token and new password required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // 1. Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        // 2. Check token in DB and expiry
        const users = await sql`
            SELECT id FROM users 
            WHERE id = ${decoded.userId} 
            AND reset_password_token = ${token} 
            AND reset_password_expires > NOW()
            `;

        if (users.length === 0) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        const user = users[0];

        // 3. Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // 4. Update user password and clear token
        await sql`
            UPDATE users 
            SET password_hash = ${passwordHash},
        reset_password_token = NULL,
            reset_password_expires = NULL 
            WHERE id = ${user.id}
        `;

        res.json({ message: "Password reset successful. You can now login." });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        res.status(500).json({ error: "Reset password failed" });
    }
};

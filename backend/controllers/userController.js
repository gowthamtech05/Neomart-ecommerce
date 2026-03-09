import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import SibApiV3Sdk from "sib-api-v3-sdk";
import asyncHandler from "express-async-handler";

let otpStore = {};

// ─── BREVO HELPER ─────────────────────────────────────────────────────────────
const getBrevoInstance = () => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  return new SibApiV3Sdk.TransactionalEmailsApi();
};

// ─── EMAIL SHELL ──────────────────────────────────────────────────────────────
const GREEN = "#6FAF8E";
const DARK = "#1A1A1A";
const BG = "#F4F7F6";

const emailShell = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td align="center" style="padding-bottom:20px;">
            <span style="font-size:26px;font-weight:900;letter-spacing:-1px;color:${DARK};">
              NEO<span style="color:${GREEN};">MART</span>
            </span>
          </td>
        </tr>
        ${bodyContent}
        <tr>
          <td style="padding:20px 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#bbb;">
              © ${new Date().getFullYear()} NeoMart · All rights reserved
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── REGISTER OTP HTML ────────────────────────────────────────────────────────
const buildRegisterOtpHtml = (otp) =>
  emailShell(`
  <tr>
    <td style="background:${DARK};border-radius:20px 20px 0 0;
      padding:36px 32px 28px;text-align:center;">
      <div style="font-size:38px;margin-bottom:10px;">🔐</div>
      <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
        Verify Your Email
      </h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.55);">
        NeoMart Account Registration
      </p>
    </td>
  </tr>
  <tr>
    <td style="background:#fff;border-radius:0 0 20px 20px;padding:32px 32px 36px;">
      <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;text-align:center;">
        Use the code below to complete your registration.<br/>
        This code expires in <strong>5 minutes</strong>.
      </p>

      <div style="background:${BG};border:2px dashed ${GREEN};border-radius:18px;
        padding:30px 24px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;text-transform:uppercase;
          letter-spacing:2.5px;color:#999;">Your OTP Code</p>
        <p style="margin:0;font-size:54px;font-weight:900;letter-spacing:16px;
          color:${DARK};font-family:monospace;">${otp}</p>
        <p style="margin:12px 0 0;font-size:11px;color:#bbb;">
          ⏱ Expires in <strong style="color:#555;">5 minutes</strong>
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:${BG};border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <tr>
          <td colspan="2" style="font-size:11px;font-weight:800;text-transform:uppercase;
            color:#999;letter-spacing:1px;padding-bottom:14px;">How to use</td>
        </tr>
        <tr>
          <td style="font-size:18px;padding:5px 12px 5px 0;vertical-align:top;">1️⃣</td>
          <td style="font-size:13px;color:#555;padding:6px 0;vertical-align:top;line-height:1.5;">Go back to the NeoMart registration page</td>
        </tr>
        <tr>
          <td style="font-size:18px;padding:5px 12px 5px 0;vertical-align:top;">2️⃣</td>
          <td style="font-size:13px;color:#555;padding:6px 0;vertical-align:top;line-height:1.5;">Enter the 6-digit OTP shown above</td>
        </tr>
        <tr>
          <td style="font-size:18px;padding:5px 12px 5px 0;vertical-align:top;">3️⃣</td>
          <td style="font-size:13px;color:#555;padding:6px 0;vertical-align:top;line-height:1.5;">Complete your profile &amp; start shopping 🛒</td>
        </tr>
      </table>

      <div style="background:#FFF8E7;border:1px solid #FFE082;border-radius:12px;
        padding:13px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:12px;color:#856404;line-height:1.6;">
          🔒 <strong>Never share this OTP</strong> with anyone. NeoMart will never ask for your OTP over call or chat.
        </p>
      </div>

      <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;">
        Didn't request this? You can safely ignore this email.<br/>
        Need help? Reply to this email.
      </p>
    </td>
  </tr>
`);

// ─── FORGOT PASSWORD OTP HTML ─────────────────────────────────────────────────
const buildForgotPasswordOtpHtml = (otp) =>
  emailShell(`
  <tr>
    <td style="background:${DARK};border-radius:20px 20px 0 0;
      padding:36px 32px 28px;text-align:center;">
      <div style="font-size:38px;margin-bottom:10px;">🔑</div>
      <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
        Reset Your Password
      </h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.55);">
        NeoMart Account Recovery
      </p>
    </td>
  </tr>
  <tr>
    <td style="background:#fff;border-radius:0 0 20px 20px;padding:32px 32px 36px;">
      <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;text-align:center;">
        We received a request to reset your NeoMart password.<br/>
        Use the code below — it expires in <strong>5 minutes</strong>.
      </p>

      <div style="background:${BG};border:2px dashed #e05c5c;border-radius:18px;
        padding:30px 24px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;text-transform:uppercase;
          letter-spacing:2.5px;color:#999;">Password Reset OTP</p>
        <p style="margin:0;font-size:54px;font-weight:900;letter-spacing:16px;
          color:${DARK};font-family:monospace;">${otp}</p>
        <p style="margin:12px 0 0;font-size:11px;color:#bbb;">
          ⏱ Expires in <strong style="color:#555;">5 minutes</strong>
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:${BG};border-radius:14px;padding:18px 20px;margin-bottom:24px;">
        <tr>
          <td colspan="2" style="font-size:11px;font-weight:800;text-transform:uppercase;
            color:#999;letter-spacing:1px;padding-bottom:14px;">Next steps</td>
        </tr>
        <tr>
          <td style="font-size:18px;padding:5px 12px 5px 0;vertical-align:top;">1️⃣</td>
          <td style="font-size:13px;color:#555;padding:6px 0;vertical-align:top;line-height:1.5;">Go back to the NeoMart forgot password page</td>
        </tr>
        <tr>
          <td style="font-size:18px;padding:5px 12px 5px 0;vertical-align:top;">2️⃣</td>
          <td style="font-size:13px;color:#555;padding:6px 0;vertical-align:top;line-height:1.5;">Enter the 6-digit OTP shown above</td>
        </tr>
        <tr>
          <td style="font-size:18px;padding:5px 12px 5px 0;vertical-align:top;">3️⃣</td>
          <td style="font-size:13px;color:#555;padding:6px 0;vertical-align:top;line-height:1.5;">Set your new password &amp; log back in 🔓</td>
        </tr>
      </table>

      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;
        padding:13px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:12px;color:#991B1B;line-height:1.6;">
          ⚠️ <strong>Didn't request this?</strong> Someone may be trying to access your account.
          Ignore this email and your password will remain unchanged.
        </p>
      </div>

      <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;">
        Need help? Reply to this email and we'll assist you.
      </p>
    </td>
  </tr>
`);

// ─── SEND OTP (REGISTER) ──────────────────────────────────────────────────────
export const sendOTP = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    const apiInstance = getBrevoInstance();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "NeoMart" };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = `${otp} is your NeoMart verification code`;
    sendSmtpEmail.htmlContent = buildRegisterOtpHtml(otp);

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`📧 Register OTP sent → ${email}`);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Brevo error:", error?.response?.body || error.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ─── SEND OTP (FORGOT PASSWORD) ───────────────────────────────────────────────
export const sendForgotPasswordOTP = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    const apiInstance = getBrevoInstance();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "NeoMart" };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = `${otp} — NeoMart Password Reset Code`;
    sendSmtpEmail.htmlContent = buildForgotPasswordOtpHtml(otp);

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`📧 Forgot password OTP sent → ${email}`);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Brevo error:", error?.response?.body || error.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ─── REGISTER USER ────────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    const stored = otpStore[email];
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      password,
      loyaltyPoints: 0,
      streaks: 0,
      isPlusMember: false,
      firstOrderCompleted: false,
    });

    delete otpStore[email];
    generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
      isPlusMember: false,
      plusExpiryDate: null,
      loyaltyPoints: 0,
      streaks: 0,
      firstOrderCompleted: false,
      token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      }),
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

// ─── LOGIN USER ───────────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateTokenAndSetCookie(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
      isPlusMember: user.isPlusMember || false,
      plusExpiryDate: user.plusExpiryDate || null,
      loyaltyPoints: user.loyaltyPoints || 0,
      firstOrderCompleted: user.firstOrderCompleted || false,
      streaks: user.streaks || 0,
      token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      }),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

// ─── LOGOUT USER ──────────────────────────────────────────────────────────────
export const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const stored = otpStore[email];
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();
    delete otpStore[email];

    res.status(200).json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ message: "Reset failed" });
  }
};

// ─── GET USER PROFILE ─────────────────────────────────────────────────────────
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      user.isPlusMember &&
      user.plusExpiryDate &&
      new Date() > user.plusExpiryDate
    ) {
      user.isPlusMember = false;
      user.plusExpiryDate = null;
      await user.save();
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: "Profile fetch failed" });
  }
};

// ─── UPGRADE TO PLUS ──────────────────────────────────────────────────────────
export const upgradeToPlus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    user.isPlusMember = true;
    user.plusExpiryDate = expiry;
    await user.save();

    res.json({
      message: "Plus activated for 1 month",
      isPlusMember: user.isPlusMember,
      plusExpiryDate: user.plusExpiryDate,
    });
  } catch {
    res.status(500).json({ message: "Upgrade failed" });
  }
};

// ─── ADD ADDRESS ──────────────────────────────────────────────────────────────
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.addresses.length >= 2) {
    res.status(400);
    throw new Error(
      "Maximum 2 addresses allowed. Please edit an existing one.",
    );
  }

  const { fullAddress, pinCode, phone, district } = req.body;

  if (!district?.trim()) {
    res.status(400);
    throw new Error("District is required");
  }

  user.addresses.push({
    fullAddress,
    pinCode,
    phone,
    district: district.trim(),
  });
  await user.save();
  res.status(201).json(user.addresses);
});

// ─── UPDATE ADDRESS ───────────────────────────────────────────────────────────
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  console.log("📍 updateAddress id:", req.params.id, "body:", req.body);
  const address = user.addresses.id(req.params.id);
  if (!address) {
    console.log(
      "❌ not found. IDs:",
      user.addresses.map((a) => String(a._id)),
    );
    res.status(404);
    throw new Error("Address not found");
  }

  address.fullAddress = req.body.fullAddress ?? address.fullAddress;
  address.pinCode = req.body.pinCode ?? address.pinCode;
  address.phone = req.body.phone ?? address.phone;
  address.district = req.body.district ?? address.district;

  await user.save();
  res.json(user.addresses);
});

// ─── GENERATE TOKEN ───────────────────────────────────────────────────────────
function generateTokenAndSetCookie(res, userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return token;
}

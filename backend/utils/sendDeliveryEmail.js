import SibApiV3Sdk from "sib-api-v3-sdk";

const getBrevoInstance = () => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  return new SibApiV3Sdk.TransactionalEmailsApi();
};

const canSendEmail = () => {
  if (!process.env.BREVO_API_KEY) {
    console.warn("⚠️  BREVO_API_KEY not set — skipping email");
    return false;
  }
  return true;
};

const GREEN = "#6FAF8E";
const DARK = "#1A1A1A";
const BG = "#F4F7F6";
const BORDER = "#f0f0f0";

const itemRowsHTML = (orderItems = []) =>
  orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid ${BORDER};font-size:13px;color:#333;">
        ${item.name}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid ${BORDER};font-size:13px;color:#888;text-align:center;">
        ×${item.qty}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid ${BORDER};font-size:13px;font-weight:700;color:#333;text-align:right;">
        ₹${item.price * item.qty}
      </td>
    </tr>`,
    )
    .join("");

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

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:20px;">
            <span style="font-size:26px;font-weight:900;letter-spacing:-1px;color:${DARK};">
              NEO<span style="color:${GREEN};">MART</span>
            </span>
          </td>
        </tr>

        ${bodyContent}

        <!-- Footer -->
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

const orderMetaHTML = (order, extraRows = "") => {
  const orderId = String(order._id).slice(-8).toUpperCase();
  return `
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background:${BG};border-radius:14px;padding:16px 20px;margin-bottom:24px;">
    <tr>
      <td colspan="2" style="font-size:11px;font-weight:800;text-transform:uppercase;
        color:#999;letter-spacing:1px;padding-bottom:12px;">Order Info</td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#888;padding:4px 0;">Order ID</td>
      <td style="font-size:12px;font-weight:800;color:${DARK};text-align:right;font-family:monospace;">
        #${orderId}
      </td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#888;padding:4px 0;">Payment</td>
      <td style="font-size:12px;font-weight:700;color:${GREEN};text-align:right;">
        ${order.paymentMethod || "Paid"} ✓
      </td>
    </tr>
    <tr>
      <td style="font-size:12px;color:#888;padding:4px 0;">Delivery To</td>
      <td style="font-size:12px;font-weight:600;color:#333;text-align:right;">
        ${order.shippingAddress?.address || ""}, ${order.shippingAddress?.city || ""}
      </td>
    </tr>
    ${extraRows}
  </table>`;
};

const itemsAndTotalHTML = (order) => `
  <p style="margin:0 0 10px;font-size:11px;font-weight:800;text-transform:uppercase;
    color:#999;letter-spacing:1px;">Items</p>
  <table width="100%" cellpadding="0" cellspacing="0"
    style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden;margin-bottom:20px;">
    <thead>
      <tr style="background:#f9f9f9;">
        <th style="padding:10px 14px;font-size:10px;font-weight:800;text-transform:uppercase;
          color:#999;text-align:left;">Item</th>
        <th style="padding:10px 14px;font-size:10px;font-weight:800;text-transform:uppercase;
          color:#999;text-align:center;">Qty</th>
        <th style="padding:10px 14px;font-size:10px;font-weight:800;text-transform:uppercase;
          color:#999;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemRowsHTML(order.orderItems)}</tbody>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background:${DARK};border-radius:14px;padding:16px 20px;margin-bottom:28px;">
    <tr>
      <td style="font-size:13px;font-weight:700;color:${GREEN};
        text-transform:uppercase;letter-spacing:1px;">Amount</td>
      <td style="font-size:20px;font-weight:900;color:${GREEN};
        text-align:right;font-style:italic;">₹${order.totalPrice}</td>
    </tr>
  </table>`;

const ctaButton = (label, path) => `
  <div style="text-align:center;margin-bottom:24px;">
    <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}${path}"
      style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;
        font-weight:900;font-size:13px;padding:13px 32px;border-radius:50px;">
      ${label}
    </a>
  </div>`;

// ─── REGISTER / LOGIN OTP EMAIL ───────────────────────────────────────────────
export const sendRegisterOtpEmail = async ({ to, otp }) => {
  if (!canSendEmail()) return;

  const body = `
    <!-- Banner -->
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

    <!-- Card body -->
    <tr>
      <td style="background:#fff;border-radius:0 0 20px 20px;padding:32px 32px 36px;">
        <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;text-align:center;">
          Use the code below to complete your registration.<br/>
          This code expires in <strong>5 minutes</strong>.
        </p>

        <!-- OTP Box -->
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

        <!-- Steps -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:${BG};border-radius:14px;padding:18px 20px;margin-bottom:24px;">
          <tr>
            <td colspan="2" style="font-size:11px;font-weight:800;text-transform:uppercase;
              color:#999;letter-spacing:1px;padding-bottom:14px;">How to use</td>
          </tr>
          ${[
            ["1️⃣", "Go back to the NeoMart registration page"],
            ["2️⃣", "Enter the 6-digit OTP shown above"],
            ["3️⃣", "Complete your profile & start shopping 🛒"],
          ]
            .map(
              ([num, text]) => `
          <tr>
            <td style="font-size:18px;padding:5px 12px 5px 0;vertical-align:top;">${num}</td>
            <td style="font-size:13px;color:#555;padding:6px 0;vertical-align:top;line-height:1.5;">${text}</td>
          </tr>`,
            )
            .join("")}
        </table>

        <!-- Security warning -->
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
    </tr>`;

  const apiInstance = getBrevoInstance();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "NeoMart" };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = `${otp} is your NeoMart verification code`;
  sendSmtpEmail.htmlContent = emailShell(body);
  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`📧 Register OTP email → ${to}`);
};

// ─── FORGOT PASSWORD OTP EMAIL ────────────────────────────────────────────────
export const sendForgotPasswordOtpEmail = async ({ to, otp }) => {
  if (!canSendEmail()) return;

  const body = `
    <!-- Banner -->
    <tr>
      <td style="background:linear-gradient(135deg,#1A1A1A 0%,#2d2d2d 100%);border-radius:20px 20px 0 0;
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

    <!-- Card body -->
    <tr>
      <td style="background:#fff;border-radius:0 0 20px 20px;padding:32px 32px 36px;">
        <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.7;text-align:center;">
          We received a request to reset your NeoMart password.<br/>
          Use the code below — it expires in <strong>5 minutes</strong>.
        </p>

        <!-- OTP Box -->
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

        <!-- Steps -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:${BG};border-radius:14px;padding:18px 20px;margin-bottom:24px;">
          <tr>
            <td colspan="2" style="font-size:11px;font-weight:800;text-transform:uppercase;
              color:#999;letter-spacing:1px;padding-bottom:14px;">Next steps</td>
          </tr>
          ${[
            ["1️⃣", "Go back to the NeoMart forgot password page"],
            ["2️⃣", "Enter the 6-digit OTP shown above"],
            ["3️⃣", "Set your new password & log back in 🔓"],
          ]
            .map(
              ([num, text]) => `
          <tr>
            <td style="font-size:18px;padding:5px 12px 5px 0;vertical-align:top;">${num}</td>
            <td style="font-size:13px;color:#555;padding:6px 0;vertical-align:top;line-height:1.5;">${text}</td>
          </tr>`,
            )
            .join("")}
        </table>

        <!-- Security warning -->
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
    </tr>`;

  const apiInstance = getBrevoInstance();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "NeoMart" };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = `${otp} — NeoMart Password Reset Code`;
  sendSmtpEmail.htmlContent = emailShell(body);
  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`📧 Forgot password OTP email → ${to}`);
};

// ─── ORDER SUCCESS EMAIL ──────────────────────────────────────────────────────
export const sendOrderSuccessEmail = async ({ to, name, order }) => {
  if (!canSendEmail()) return;

  const orderId = String(order._id).slice(-8).toUpperCase();
  const placedAt = new Date(order.createdAt || Date.now()).toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const isCOD = order.paymentMethod === "COD";

  const body = `
    <!-- Banner -->
    <tr>
      <td style="background:${GREEN};border-radius:20px 20px 0 0;
        padding:32px 32px 24px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">🛒</div>
        <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
          Order Placed!
        </h1>
        <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">
          We've received your order and it's being prepared
        </p>
      </td>
    </tr>

    <!-- Card body -->
    <tr>
      <td style="background:#fff;border-radius:0 0 20px 20px;padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#333;">
          Hi <strong>${name || "there"}</strong>, 👋
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
          ${
            isCOD
              ? "Your order has been placed successfully! Please keep <strong>₹" +
                order.totalPrice +
                "</strong> ready to pay the delivery partner at the door."
              : "Your payment was confirmed and your order is now being processed."
          }
        </p>

        ${orderMetaHTML(
          order,
          `
          <tr>
            <td style="font-size:12px;color:#888;padding:4px 0;">Placed On</td>
            <td style="font-size:12px;font-weight:700;color:${DARK};text-align:right;">${placedAt}</td>
          </tr>
        `,
        )}

        ${itemsAndTotalHTML(order)}

        ${
          isCOD
            ? `
        <div style="background:#FFF8E7;border:1px solid #FFE082;border-radius:14px;
          padding:14px 18px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#856404;font-weight:700;">
            💵 Cash on Delivery — pay <strong>₹${order.totalPrice}</strong> when your order arrives.
          </p>
        </div>`
            : ""
        }

        <!-- Delivery journey -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#F4F7F6;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
          <tr>
            <td colspan="5" style="font-size:11px;font-weight:800;text-transform:uppercase;
              color:#999;letter-spacing:1px;padding-bottom:16px;">Your Delivery Journey</td>
          </tr>
          <tr>
            ${[
              { icon: "🛒", label: "Order<br/>Placed", done: true },
              { icon: "📦", label: "In<br/>Transit", done: false },
              { icon: "🛵", label: "Out for<br/>Delivery", done: false },
              { icon: "✅", label: "Delivered", done: false },
            ]
              .map(
                (s, i, arr) => `
              <td align="center" style="padding:0;width:${100 / arr.length}%;vertical-align:top;">
                <div style="width:28px;height:28px;border-radius:50%;margin:0 auto 6px;
                  background:${s.done ? "#6FAF8E" : "#e5e7eb"};
                  font-size:13px;line-height:28px;text-align:center;">
                  ${s.icon}
                </div>
                <p style="margin:0;font-size:9px;font-weight:800;color:${s.done ? "#374151" : "#d1d5db"};
                  text-align:center;text-transform:uppercase;letter-spacing:0.3px;line-height:1.3;">
                  ${s.label}
                </p>
              </td>
            `,
              )
              .join("")}
          </tr>
        </table>

        ${ctaButton("Track My Order →", "/myorders")}

        <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;">
          Thank you for shopping with NeoMart 💚<br/>
          Questions? Just reply to this email.
        </p>
      </td>
    </tr>`;

  const apiInstance = getBrevoInstance();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "NeoMart" };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = `🛒 Order Confirmed! #${orderId} — NeoMart`;
  sendSmtpEmail.htmlContent = emailShell(body);
  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`📧 Order success email → ${to} [#${orderId}]`);
};

// ─── OUT FOR DELIVERY EMAIL ───────────────────────────────────────────────────
export const sendOutForDeliveryEmail = async ({
  to,
  name,
  order,
  partnerName,
}) => {
  if (!canSendEmail()) return;

  const orderId = String(order._id).slice(-8).toUpperCase();

  const body = `
    <tr>
      <td style="background:${GREEN};border-radius:20px 20px 0 0;
        padding:32px;text-align:center;">
        <div style="font-size:36px;">🛵</div>
        <h1 style="margin:10px 0 0;color:#fff;">
          Out For Delivery!
        </h1>
      </td>
    </tr>

    <tr>
      <td style="background:#fff;padding:28px;border-radius:0 0 20px 20px;">
        <p style="margin:0 0 20px;font-size:15px;color:#333;">
          Hi <strong>${name}</strong>, 👋
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
          Great news! Your delivery partner <strong>${partnerName}</strong>
          is on the way with your order. Stay nearby!
        </p>

        ${orderMetaHTML(order)}
        ${itemsAndTotalHTML(order)}

        ${ctaButton("Track My Order →", "/myorders")}

        <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;">
          Thank you for shopping with NeoMart 💚<br/>
          Questions? Just reply to this email.
        </p>
      </td>
    </tr>
  `;

  const apiInstance = getBrevoInstance();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "NeoMart" };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = `🛵 Out for Delivery — Order #${orderId}`;
  sendSmtpEmail.htmlContent = emailShell(body);
  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`📧 Out for delivery email → ${to} [#${orderId}]`);
};

// ─── ORDER DELIVERED EMAIL ────────────────────────────────────────────────────
export const sendDeliveryEmail = async ({ to, name, order }) => {
  if (!canSendEmail()) return;

  const orderId = String(order._id).slice(-8).toUpperCase();
  const deliveredAt = new Date(order.deliveredAt || Date.now()).toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const body = `
    <!-- Banner -->
    <tr>
      <td style="background:${GREEN};border-radius:20px 20px 0 0;
        padding:32px 32px 24px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">✅</div>
        <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
          Order Delivered!
        </h1>
        <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">
          Your package has arrived safely
        </p>
      </td>
    </tr>

    <!-- Card body -->
    <tr>
      <td style="background:#fff;border-radius:0 0 20px 20px;padding:28px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#333;">
          Hi <strong>${name || "there"}</strong>, 👋
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
          Your NeoMart order has been successfully delivered. We hope you love your purchase!
        </p>

        ${orderMetaHTML(
          order,
          `
          <tr>
            <td style="font-size:12px;color:#888;padding:4px 0;">Delivered On</td>
            <td style="font-size:12px;font-weight:700;color:${DARK};text-align:right;">${deliveredAt}</td>
          </tr>
        `,
        )}

        ${itemsAndTotalHTML(order)}

        ${ctaButton("View My Orders →", "/myorders")}

        <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;">
          Thank you for shopping with NeoMart 💚<br/>
          If you have any issues, reply to this email.
        </p>
      </td>
    </tr>`;

  const apiInstance = getBrevoInstance();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "NeoMart" };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = `✅ Delivered! Your NeoMart order #${orderId} has arrived`;
  sendSmtpEmail.htmlContent = emailShell(body);
  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`📧 Delivery email → ${to} [#${orderId}]`);
};

// ─── DELIVERY OTP EMAIL ───────────────────────────────────────────────────────
export const sendOtpEmail = async ({ to, name, otp, order, partnerName }) => {
  if (!canSendEmail()) return;

  const orderId = String(order._id).slice(-8).toUpperCase();
  const itemCount = order.orderItems?.length || 0;

  const body = `
    <!-- Banner -->
    <tr>
      <td style="background:${DARK};border-radius:20px 20px 0 0;
        padding:32px 32px 28px;text-align:center;">
        <div style="font-size:34px;margin-bottom:10px;">🛵</div>
        <h1 style="margin:0;font-size:21px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
          Your Delivery is On the Way!
        </h1>
        <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">
          NeoMart Order #${orderId}
        </p>
      </td>
    </tr>

    <!-- Card body -->
    <tr>
      <td style="background:#fff;border-radius:0 0 20px 20px;padding:28px 32px 32px;">
        <p style="margin:0 0 6px;font-size:15px;color:#333;">
          Hi <strong>${name || "there"}</strong>, 👋
        </p>
        <p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.6;">
          Your delivery partner <strong>${partnerName || "our agent"}</strong> is heading
          to your location right now with your ${itemCount} item${itemCount !== 1 ? "s" : ""}.
        </p>

        <!-- Big OTP block -->
        <div style="background:#F4F7F6;border:2px dashed ${GREEN};border-radius:20px;
          padding:28px 24px;text-align:center;margin-bottom:28px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:800;text-transform:uppercase;
            letter-spacing:2px;color:#888;">Your Delivery OTP</p>
          <p style="margin:0;font-size:52px;font-weight:900;letter-spacing:14px;
            color:${DARK};font-family:monospace;">${otp}</p>
          <p style="margin:10px 0 0;font-size:11px;color:#aaa;">
            ⏱ Valid for <strong>15 minutes</strong>
          </p>
        </div>

        <!-- Instruction steps -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#F4F7F6;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
          <tr>
            <td colspan="2" style="font-size:11px;font-weight:800;text-transform:uppercase;
              color:#999;letter-spacing:1px;padding-bottom:14px;">How it works</td>
          </tr>
          ${[
            ["🛒", "Order placed & confirmed"],
            ["📦", "In transit — your order is being prepared"],
            ["🛵", "Out for delivery — partner is at your door"],
            ["🔐", "Share your OTP → collect package ✅"],
          ]
            .map(
              ([num, text]) => `
          <tr>
            <td style="font-size:16px;padding:5px 10px 5px 0;vertical-align:top;">${num}</td>
            <td style="font-size:13px;color:#555;padding:6px 0;vertical-align:top;">${text}</td>
          </tr>`,
            )
            .join("")}
        </table>

        <!-- Order info -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="border:1px solid #f0f0f0;border-radius:12px;padding:12px 16px;margin-bottom:24px;">
          <tr>
            <td style="font-size:12px;color:#888;padding:3px 0;">Order</td>
            <td style="font-size:12px;font-weight:800;color:${DARK};text-align:right;font-family:monospace;">
              #${orderId}
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#888;padding:3px 0;">Amount</td>
            <td style="font-size:12px;font-weight:800;color:${GREEN};text-align:right;">
              ₹${order.totalPrice}
              ${order.paymentMethod === "COD" ? " <span style='color:#888;font-weight:600;'>(Pay on delivery)</span>" : " ✓ Paid"}
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#888;padding:3px 0;">Address</td>
            <td style="font-size:12px;font-weight:600;color:#333;text-align:right;">
              ${order.shippingAddress?.address || ""}, ${order.shippingAddress?.city || ""}
            </td>
          </tr>
        </table>

        <!-- Security note -->
        <div style="background:#FFF8E7;border:1px solid #FFE082;border-radius:12px;
          padding:12px 16px;margin-bottom:24px;">
          <p style="margin:0;font-size:12px;color:#856404;line-height:1.5;">
            🔒 <strong>Keep this OTP private.</strong> Share it only with the NeoMart delivery
            partner at your door. Never share it over the phone or with anyone else.
          </p>
        </div>

        <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;">
          Thank you for shopping with NeoMart 💚<br/>
          If you didn't place this order, reply to this email.
        </p>
      </td>
    </tr>`;

  const apiInstance = getBrevoInstance();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "NeoMart" };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = `🔐 Your NeoMart delivery OTP: ${otp} (Order #${orderId})`;
  sendSmtpEmail.htmlContent = emailShell(body);
  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log(`📧 OTP email → ${to} [#${orderId}] OTP: ${otp}`);
};

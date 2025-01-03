const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid"); // For generating OTPs
const twilio = require("twilio");
require("dotenv").config(); // Load environment variables

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Replace with your Account SID from .env
const authToken = process.env.TWILIO_AUTH_TOKEN; // Replace with your Auth Token from .env
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Replace with your Twilio phone number from .env

const client = twilio(accountSid, authToken);

// Temporary in-memory storage for OTPs
const otpStorage = new Map();

// Route to send OTP
app.post("/sendOtp", async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // Send SMS via Twilio
        await client.messages.create({
            body: `Your OTP is ${otp}. It will expire in 5 minutes.`,
            from: twilioPhoneNumber,
            to: phoneNumber
        });

        // Store OTP temporarily (5 minutes)
        otpStorage.set(phoneNumber, otp);
        setTimeout(() => otpStorage.delete(phoneNumber), 300000);

        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({ message: "Error sending OTP", error: error.message });
    }
});

// Route to verify OTP
app.post("/verifyOtp", (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    const storedOtp = otpStorage.get(phoneNumber);

    if (storedOtp === otp) {
        otpStorage.delete(phoneNumber); // Remove OTP after successful verification
        return res.status(200).json({ message: "OTP verified successfully" });
    } else {
        return res.status(400).json({ message: "Invalid OTP" });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

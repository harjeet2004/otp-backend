const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Temporary in-memory storage for OTPs
const otpStorage = new Map();

// SMS Alert API credentials
const SMS_ALERT_API_KEY = "67724b859e0eb"; // Replace with your API key

// Route to send OTP
app.post("/sendOtp", async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const smsUrl = `https://www.smsalert.co.in/api/push.json?apikey=${SMS_ALERT_API_KEY}&mobileno=${phoneNumber}&sender=SMSALERT&text=Your OTP is ${otp}. It will expire in 5 minutes.`;

    try {
        const response = await axios.get(smsUrl);

        if (response.data.status === "success") {
            otpStorage.set(phoneNumber, otp);
            setTimeout(() => otpStorage.delete(phoneNumber), 300000);

            return res.status(200).json({ message: "OTP sent successfully" });
        } else {
            return res.status(500).json({ message: "Failed to send OTP", error: response.data });
        }
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
        otpStorage.delete(phoneNumber);
        return res.status(200).json({ message: "OTP verified successfully" });
    } else {
        return res.status(400).json({ message: "Invalid OTP" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

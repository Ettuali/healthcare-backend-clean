const crypto = require("crypto");

const getTurnCredentials = async (req, res) => {
  try {
    const secret =
      process.env.TURN_SECRET ||
      "Day2DayHealthcareSecret123";

    const ttl = 24 * 60 * 60;

    const username = (
      Math.floor(Date.now() / 1000) + ttl
    ).toString();

    const credential = crypto
      .createHmac("sha1", secret)
      .update(username)
      .digest("base64");

    return res.json({
      success: true,
      username,
      credential,
      urls: [
        "turn:13.201.120.64:3478?transport=udp",
        "turn:13.201.120.64:3478?transport=tcp",
      ],
    });
  } catch (error) {
    console.error(
      "[TURN CREDENTIAL ERROR]",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate TURN credentials",
    });
  }
};

module.exports = {
  getTurnCredentials,
};
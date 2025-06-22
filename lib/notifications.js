export const sendSms = async (phone, message) => {
    console.log(`📲 [Mock SMS] Sending to ${phone}: ${message}`);
};

export const sendEmail = async (email, subject, message) => {
    console.log(`📧 [Mock Email] To: ${email} | Subject: ${subject} | Body: ${message}`);
};
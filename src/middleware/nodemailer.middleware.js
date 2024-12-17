import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'kathlyn.dach3@ethereal.email',
        pass: 'egp4yjRkg1GGzBp5RK'
    }
});


const sendVerificationEmail = async (user, token) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const mailOptions = {
        from: "socailmediaapi@gmail.com",
        to: user.email, 
        subject: 'Please Verify Your Email Address', 
        text: `Hello ${user.firstname},\n\nPlease click the link below to verify your email address and activate your account:\n\n${verifyUrl}\n\nIf you did not register, please ignore this email.`, 
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


const sendPasswordResetEmail = async (user, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
        from: "socialmediaapi@gmail.com",  // Sender's address
        to: user.email,  // Recipient's email
        subject: 'Reset Your Password',  // Subject of the email
        text: `Hello ${user.firstname},

       Please click the link below to reset your password:

        ${resetUrl}

        If you did not request a password reset, please ignore this email.`,  // Body of the email
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export { sendVerificationEmail ,sendPasswordResetEmail}
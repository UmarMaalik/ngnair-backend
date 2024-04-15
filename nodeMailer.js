

const nodemailer = require('nodemailer');

 async function Mailto(body, attach, filePaths, to) {
    console.log("there ",to);
    
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'umar.maalik@codeupscale.com',
                pass: 'yaim tapx bdtr nhbl'
            }
        });

    

        const mail = await transporter.sendMail({
            from: '"NGnair"<Hamzayousaf775@gmail.com>', // sender address
            to: to || "muhammad.ukkasha@codeupscale.com", // list of receivers
            cc: "hamzayousaf775@gmail.com",
            subject: "Application Submition is completed", // Subject line
            html: body, // html body
            attachments: []
        });

        // console.log("Email sent:", mail.response);
    } catch (error) {
        console.log("Error sending email:", error);
    }
}



// Example usage:


module.exports = Mailto;
import { body, validationResult } from "express-validator";

const validator = ()=>{
    return [
        body("email").isEmail().withMessage("Invalid email type"),
        body("password").matches(/\d/).matches(/[A-Z]/).withMessage("password should contain number and uppercase characters"),
        body("username").isLength({min:6}).withMessage("Username should be at least 6 characters long").custom((value)=>{
            if(value !== value.toLowerCase()){
                throw new Error("Username should be in lowercase")
            }
        })
    ]
}

const handleValidationErrors = (req,res,next)=>{
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array()
        })
    }
    next()
}

export {validator,handleValidationErrors}
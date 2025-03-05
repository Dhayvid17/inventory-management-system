import { Request, Response, NextFunction } from "express";
import { check, validationResult } from "express-validator";

const validateUser = [
  // Username validation
  check("username", "Username is required").not().isEmpty(),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),

  // Error handling middleware
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export default validateUser;

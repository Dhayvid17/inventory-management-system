import { Request, Response, NextFunction } from "express";
import { check, validationResult } from "express-validator";

const validateUser = [
  check("username", "Username is required").not().isEmpty(),
  check(
    "password",
    "Password is required and be 6 or more characters"
  ).isLength({ min: 6 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export default validateUser;

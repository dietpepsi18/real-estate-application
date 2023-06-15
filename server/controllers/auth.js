import * as config from "../config.js";
import jwt from "jsonwebtoken";
import { emailTemplate } from "../helpers/email.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import User from "../models/user.js"; //import User model to manipulate User collection in database
import { nanoid } from "nanoid"; //for assigning each user a unique user id
import validator from "email-validator";

//function for refactoring code:
const tokenAndUserResponse = (req, res, user) => {
  //create a new token, so after registration, user can login immediately
  //token created by using user document's id: (user._id) which is automatically created by MongoDB
  const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
    expiresIn: "1h",
  });

  //create another token, so user don't need to log in again after 1 hour
  const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
    expiresIn: "7d",
  });

  //before returning data to front-end, remove the hashed paaword from "user" object
  user.password = undefined;
  user.resetCode = undefined;
  //return data:
  return res.json({
    token,
    refreshToken,
    user,
  });
};

//=========================== callback function ====================================================//
export const welcome = (req, res) => {
  res.json({
    data: "hello",
  });
};

export const preRegister = async (req, res) => {
  try {
    //get imformation from request
    const { email, password } = req.body;

    //make sure email is in the right format
    if (!validator.validate(email)) {
      return res.json({ error: "A valid email is required" });
    }
    //make sure user has set the password
    if (!password) {
      return res.json({ error: "Password is required" });
    }
    //make sure password is at least 6 letters longå
    if (password && password.length < 6) {
      return res.json({
        error: "Password should be at least 6 characters long",
      });
    }

    //check if the email has already existed
    const user = User.findOne({ email: email });
    if (user) {
      return res.json({ error: "This email has been taken, try log in" });
    }

    //generate a token:
    const token = jwt.sign({ email, password }, config.JWT_SECRET, {
      expiresIn: "1h",
    });
    // => send confirmation email by using AWS SES
    config.AWSSES.sendEamil(
      emailTemplate(
        email,
        `
          <p>Please click the link below to activate the account</p>
          <a href="${config.CLIENT_URL}/auth/account-activate/${token}">Activate My Account</a>
        `,
        config.REPLY_TO,
        "Activate you Account"
      ),
      (err, data) => {
        if (err) {
          return res.json({ ok: false });
        } else {
          return res.json({ ok: true });
        }
      }
    );

    // => no confirmation email
    const emailSent = true;
    if (emailSent) {
      return res.json({ ok: true });
    } else {
      return res.json({ ok: false });
    }
  } catch (error) {
    return res.json({ error: "Something went wrong. Try again" });
  }
};

export const register = async (req, res) => {
  try {
    /* ============================== for email confirmation ===================================
    //decode JWT
    const decoded = jwt.verify(req.body.token, config.JWT_SECRET, {
      expiresIn: "1h",
    });
    const { email, password } = decoded;
    */
    const { email, password } = req.body; //registration directly, don't need email confirmation

    //hash the password
    const hashedPassword = await hashPassword(password);

    //create a new user document
    const user = await new User({
      username: nanoid(6), //to make sure have unique username/userid
      email,
      password: hashedPassword,
    });
    // save the document to the User collection
    await user.save();

    /*   refactoring the code, puy this logic in tokenAndUserResponse() function

    //create a new token, so after registration, user can login immediately
    //token created by using user document's id: (user._id) which is automatically created by MongoDB
    const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "1h",
    });

    //create another token, so user don't need to log in again after 1 hour
    const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    //before returning data to front-end, remove the hashed paaword from "user" object
    user.password = undefined;
    user.resetCode = undefined;

    //return data:
    return res.json({
      token,
      refreshToken,
      user,
    });
    */

    tokenAndUserResponse(req, res, user);
  } catch (error) {
    return res.json({ error: "Something went wrong. Try again" });
  }
};

export const login = async (req, res) => {
  try {
    //1) get email and password from request body
    const { email, password } = req.body;

    //2) Find user by email
    const user = await User.findOne({ email: email });

    //3) Compare password with the hashed password stored in database
    const match = await comparePassword(password, user.password);

    //4) Create jwt token（initial access token and refresh token）
    if (!match) {
      //if doesn't match
      return res.json({ error: "Wrong password" });
    } else {
      /* refactoring the code, puy this logic in tokenAndUserResponse() function

      const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
        expiresIn: "1h",
      });

      //create refresh token
      const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
        expiresIn: "7d",
      });

      //5）Send the response
      //before returning data to front-end, remove the hashed paaword from "user" object
      user.password = undefined;
      user.resetCode = undefined;

      //return data:
      return res.json({
        token,
        refreshToken,
        user,
      });
      */

      tokenAndUserResponse(req, res, user);
    }
  } catch (error) {
    return res.json({ error: "Something went wrong. Try again" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    //get email address from the user
    const { email } = req.body;

    //find the user in the database
    const user = await User.findOne({ email: email });

    if (!user) {
      //if user not found
      return res.json({ error: "Could not find user with the Email" });
    } else {
      //if user is found, send a email with link
      const resetCode = nanoid(); //generate a temporary id, so can verify the user using the email
      //save this temporary id to the database, so later it can be used to find the same user
      user.resetCode = resetCode;
      await user.save();
      //generate a token
      const token = jwt.sign({ resetCode }, config.JWT_SECRET, {
        expiresIn: "1h",
      });

      config.AWSSES.sendEmail(
        emailTemplate(
          email,
          `
          <p>Please click the link below to access your account and reset your password</p>
          <a href-"${config.CLIENT_URL}/auth/access-acount/${token}">Access my Account</a>
        `,
          config.REPLY_TO,
          "Access your Account"
        ),
        (err, data) => {
          if (err) {
            return res.json({ ok: false });
          } else {
            return res.json({ ok: true });
          }
        }
      );
    }
  } catch (error) {
    return res.json({ error: "Something went wrong. Try again" });
  }
};

export const accessAccount = async (req, res) => {
  try {
    //decode the token
    const { resetCode } = jwt.verify(req.body.resetCode, config.JWT_SECRET);

    //find the user by using resetCode, and then reset the value to empty string
    const user = await User.findOneAndUpdate(
      { resetCode: resetCode },
      {
        resetCode: "",
      }
    );

    /* refactoring the code, puy this logic in tokenAndUserResponse() function

    //create a new token, so after click the link, user can login immediately
    //token created by using user document's id: (user._id) which is automatically created by MongoDB
    const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "1h",
    });

    //create another token, so user don't need to log in again after 1 hour
    const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    //before returning data to front-end, remove the hashed paaword from "user" object
    user.password = undefined;
    user.resetCode = undefined;

    //return data:
    return res.json({
      token,
      refreshToken,
      user,
    });
    */

    tokenAndUserResponse(req, res, user);
  } catch (error) {
    return res.json({ error: "Something went wrong. Try again" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    //get _id value from refresh token sent in headers
    const { _id } = jwt.verify(req.headers.refresh_token, config.JWT_SECRET);
    //get user from databse by using _id
    const user = await User.findById(_id);

    /* refactoring the code, puy this logic in tokenAndUserResponse() function
    //create a new token
    const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "1h",
    });

    //create another token, so user don't need to log in again after 1 hour
    const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    //before returning data to front-end, remove the hashed paaword from "user" object
    user.password = undefined;
    user.resetCode = undefined;

    //return data:
    return res.json({
      token,
      refreshToken,
      user,
    });
    */

    tokenAndUserResponse(req, res, user);
  } catch (error) {
    return res.status(403).json({ error: "Refresh token failed" }); //403: forbidden
  }
};

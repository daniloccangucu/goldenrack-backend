import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import Joi from "joi";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { JwtProperty } from "../types/JwtProperty";
import { DecodedJwtPayload } from "../types/DecodedJwtPayload";
import User, { UserDocument } from "../models/User";
import { UserData } from "../types/UserData";
import { RoleData } from "../types/RoleData";
import { OrderListData } from "../types/OrderData";

const saltRounds = 10;
const secret = crypto.randomBytes(32).toString("hex");

interface PayloadWithOptionalStore {
  userId: string;
  userRole: string;
  isUserBanned: boolean;
  currentOrderList: string | Types.ObjectId | OrderListData;
  store?: string;
}

export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error("Error hashing password: " + error.message);
    } else {
      throw new Error("Unknown error occurred while hashing password.");
    }
  }
}

export async function isUserNameUnique(userName: string): Promise<boolean> {
  try {
    const existingUser: UserDocument | null = await User.findOne({
      userName,
    });
    return !existingUser;
  } catch (error) {
    console.error("Error checking username uniqueness:", error);
    throw error;
  }
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  try {
    const existingUser: UserDocument | null = await User.findOne({ email });
    return !existingUser;
  } catch (error) {
    console.error("Error checking email availability:", error);
    throw error;
  }
}

export function validateRequestBody(schema: Joi.ObjectSchema) {
  return function (request: Request, response: Response, next: NextFunction) {
    const { error } = schema.validate(request.body);
    if (error) {
      return response.status(400).json({
        status: "fail",
        message: error.details[0].message,
      });
    }
    next();
  };
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateAuthToken(user: UserData): string {
  let payload: PayloadWithOptionalStore = {
    userId: user.id,
    userRole: user.role,
    isUserBanned: user.banned,
    currentOrderList: user.orderHistory[user.orderHistory.length - 1],
  };

  if (user.store) {
    payload.store = user.store;
  }
  const token = jwt.sign(payload, secret, {
    expiresIn: "24h",
  });
  return token;
}

export function extractJwtToken(authorizationHeader: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const tokenParts = authorizationHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return null;
  }

  return tokenParts[1];
}

export function verifyJwtToken(jwtToken: string): DecodedJwtPayload | null {
  try {
    const decodedToken = jwt.verify(jwtToken, secret);
    return decodedToken as DecodedJwtPayload;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

export function extractPropertyFromJwt<T extends DecodedJwtPayload>(
  decodedToken: T,
  property: JwtProperty
): DecodedJwtPayload[keyof DecodedJwtPayload] | undefined {
  return decodedToken[property];
}

export function checkAuthorization(req: Request) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    throw new Error("Authorization header is missing");
  }

  const jwtToken = extractJwtToken(authorizationHeader);

  if (!jwtToken) {
    throw new Error("Invalid JWT token");
  }

  const decodedToken = verifyJwtToken(jwtToken);

  if (!decodedToken) {
    throw new Error("Invalid or expired JWT token");
  }

  if (decodedToken.userRole !== RoleData.Admin && decodedToken.isUserBanned) {
    throw new Error("You are banned, please contact an admin.");
  }

  return decodedToken;
}

export function sanitizeUserData(
  user: UserDocument
): Omit<UserData, "password" | "hashedPassword"> {
  const sanitizedUser: Omit<UserData, "password" | "hashedPassword"> = {
    id: user._id,
    email: user.email,
    userName: user.userName,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    banned: user.banned,
    orderHistory: user.orderHistory,
  };

  if (user.store) {
    sanitizedUser.store = user.store;
  }

  return sanitizedUser;
}

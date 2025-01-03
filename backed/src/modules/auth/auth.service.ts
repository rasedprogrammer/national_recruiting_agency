import jwt from "jsonwebtoken";
import { ErrorCode } from "../../common/enums/error.code.enum";
import { VerificationEnum } from "../../common/enums/verification-code.enum";
import { LoginDto, RegisterDto } from "../../common/interface/auth.interface";
import {
  BadRequestException,
  UnauthorizedException,
} from "../../common/utils/catch.error";
import {
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
} from "../../common/utils/date-time";
import SessionModel from "../../database/models/session.model";
import UserModel from "../../database/models/user.model";
import VerificationCodeModel from "../../database/models/verification.model";
import { config } from "../../config/app.config";
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from "../../common/utils/jwt";

export class AuthService {
  public async register(registerData: RegisterDto) {
    const { name, email, password, confirmPassword, userAgent } = registerData;

    const existingUser = await UserModel.exists({
      email,
    });
    if (existingUser) {
      throw new BadRequestException(
        "User already exists!!!",
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      );
    }
    const newUser = await UserModel.create({
      name,
      email,
      password,
    });
    const userId = newUser._id;

    const verificationCode = await VerificationCodeModel.create({
      userId,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiredAt: fortyFiveMinutesFromNow(),
    });

    return {
      user: newUser,
    };
  }

  public async login(loginData: LoginDto) {
    const { email, password, userAgent } = loginData;

    const user = await UserModel.findOne({
      email: email,
    });
    if (!user) {
      throw new BadRequestException(
        "Invalid Email and Password Provide",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new BadRequestException(
        "Invalid Email and Password Provide",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }
    // Check if the user enable 2fa return = null
    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });
    const accessToken = signJwtToken({
      userId: user._id,
      sessionId: session._id,
    });

    // jwt.sign({ userId: user._id, sessionId: session._id }, config.JWT.SECRET, {
    //   audience: ["user"],
    //   expiresIn: config.JWT.EXPIRES_IN,
    // });
    const refreshToken = signJwtToken(
      {
        sessionId: session._id,
      },
      refreshTokenSignOptions
    );

    // jwt.sign({ sessionId: session._id }, config.JWT.REFRESH_SECRET, {
    //   audience: ["user"],
    //   expiresIn: config.JWT.REFRESH_EXPIRES_IN,
    // });
    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
    };
  }

  public async refreshToken(refreshToken: string) {
    const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret,
    });
    if (!payload) {
      throw new UnauthorizedException("Invalid refresh token.");
    }
    const session = await SessionModel.findById(payload.sessionId);
    const now = Date.now();
    if (!session) {
      throw new UnauthorizedException("Session dose not exist.");
    }
    if (session.expiredAt.getTime() <= now) {
      throw new UnauthorizedException("Session expired.");
    }
    const sessionRequireRefresh =
      session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;
    if (sessionRequireRefresh) {
      session.expiredAt = calculateExpirationDate(
        config.JWT.REFRESH_EXPIRES_IN
      );
      await session.save();
    }
    const newRefreshToken = sessionRequireRefresh
      ? signJwtToken(
          {
            sessionId: session._id,
          },
          refreshTokenSignOptions
        )
      : undefined;
    const accessToken = signJwtToken(
      {
        userId: session.userId,
        sessionId: session._id,
      },
      refreshTokenSignOptions
    );
    return {
      accessToken,
      newRefreshToken,
    };
  }
}

import { Injectable } from '@nestjs/common'
import { authenticator } from 'otplib'
import { toFileStream } from 'qrcode'
import { Response } from 'express'

import { UserService } from '../user/user.service'
import { User } from '../user/entities/user.entity'
import { AppLoggerService } from '../logger/logger.service'
import {
  TWO_FACTOR_AUTHENTICATION_APP_NAME,
} from '../common/constants'

@Injectable()
export class TwoFactorAuthService {
  constructor(
    private userService: UserService,
    private readonly logger: AppLoggerService
  ) { }

  async generateTwoFactorAuthenticationSecret(user: User) {
    const secret = authenticator.generateSecret()
    const otpauthUrl = authenticator.keyuri(user.id, TWO_FACTOR_AUTHENTICATION_APP_NAME, secret)

    await this.userService.update(user.id, {
      twoFactorAuthenticationSecret: secret,
    })

    return {
      secret,
      otpauthUrl,
    }
  }

  async pipeQrCodeStream(stream: Response, otpauthUrl: string) {
    return toFileStream(stream, otpauthUrl)
  }

  isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, user: User) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.twoFactorAuthenticationSecret,
    })
  }
}

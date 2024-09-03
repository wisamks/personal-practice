import { ReqUser } from "@_/customTypes/express";
import { BadRequestException } from "@_/utils/customError.util";
import { plainToInstance } from "class-transformer";
import { validateOrReject } from "class-validator";
import { Request, Response, NextFunction } from 'express';

const validationPipe = (schema: { new (): any }) => async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as ReqUser | undefined;
    const userId = user?.userId;
    const target = plainToInstance(schema, {...req.body, userId, ...req.params, ...req.query});
    try {
        await validateOrReject(target);
        req.body = target;
        return next();
    } catch(errs) {
        if (errs instanceof Array) {
            const messageArray = Object.values(errs[0].constraints) as [string];
            return next(new BadRequestException(...messageArray));
        }
        return next(errs);
    }
}

export default validationPipe;
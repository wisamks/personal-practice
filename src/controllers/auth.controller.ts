import { CreateUserReqDto } from "@_/routes/reqDto/create-user.req.dto";
import { AuthService } from "@_/services/auth.service";
import { NextFunction, Request, Response } from "express";

export class AuthController {
    static async getUsers(req: Request, res: Response, next: NextFunction) {
        const { page, perPage } = req.body;
        try {
            const foundUsers = await AuthService.getUsers();
            return res.status(200).json(foundUsers);
        } catch(err) {
            return next(err);
        }
    }

    static async getUser(req: Request, res: Response, next: NextFunction) {
        const { userId } = req.body;
        try {
            const foundUser = await AuthService.getUser(userId);
            return res.status(200).json(foundUser);
        } catch(err) {
            return next(err);
        }
    }

    static async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const createUserReqDto: CreateUserReqDto = req.body;
            const createdUserId = await AuthService.createUser(createUserReqDto);
            return res.status(201).json({ userId: createdUserId });
        } catch(err) {
            return next(err);
        }
    }

    static async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.body;
            await AuthService.deleteUser(userId);
            return res.status(204).end();
        } catch(err) {
            return next(err);
        }
    }
}

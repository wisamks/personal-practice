import { Db } from "@_/configs/db.config";
import { CreateUserReqDto } from "@_/routes/reqDto/create-user.req.dto";
import { plainToInstance } from "class-transformer";
import { User } from "./entities/user.entity";

export class UserModel extends Db {
    static async getUsers(): Promise<User[]> {
        const sql = 
        `
        SELECT *
        FROM user
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        `;
        const page = 1;
        const perPage = 10;
        const offset = perPage * (page-1)
        const values = [String(perPage), String(offset)];

        const results = await this.query(sql, values);
        return results[0].map(result => plainToInstance(User, result));
    }

    static async getUser(userId: number = 1): Promise<User> {
        const sql = 
        `
        SELECT *
        FROM user
        WHERE id = ?
            AND deleted_at IS NULL
        `;
        const values = [userId];
        const results = await this.query(sql, values);
        return plainToInstance(User, results[0][0]);
    }

    static async createUser(createUserReqDto: CreateUserReqDto): Promise<number> {
        const { email, password, name } = createUserReqDto;
        const sql = 
        `
        INSERT
        INTO user(email, password, name)
        VALUES(?, ?, ?)
        `;
        const values = [email, password, name];
        const results = await this.query(sql, values);
        return results[0].insertId;
    }

    static async updateUser() {}

    static async deleteUser(userId: number): Promise<void> {
        const sql = 
        `
        UPDATE user
        SET deleted_at = CURRENT_TIMESTAMP(3)
        WHERE deleted_at IS NULL
            AND id = ?
        `;
        const values = [userId];
        await this.query(sql, values);
        return;
    }
}
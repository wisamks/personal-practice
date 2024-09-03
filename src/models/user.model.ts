import { Db } from "@_/configs/db.config";
import { CreateUserReqDto } from "@_/routes/reqDto/create-user.req.dto";
import { plainToInstance } from "class-transformer";
import { User } from "./entities/user.entity";
import { UpdateUserReqDto } from "@_/routes/reqDto/update-user.req.dto";
import { GetUsersReqDto } from "@_/routes/reqDto/get-users.req.dto";

export class UserModel extends Db {
    static async getUsers({page, perPage}: GetUsersReqDto): Promise<User[]> {
        const sql = 
        `
        SELECT *
        FROM user
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        `;
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

    static async updateUser(updateUserReqDto: UpdateUserReqDto, userId: number): Promise<void> {
        if (!updateUserReqDto) {
            return;
        }
        const { email, password, name } = updateUserReqDto;
        const values = [];
        const subSql = [];
        if (email) {
            values.push(email);
            subSql.push('email = ? ');
        }
        if (password) {
            values.push(password);
            subSql.push('password = ? ');
        }
        if (name) {
            values.push(name);
            subSql.push('name = ? ');
        }
        const sql =
        `
        UPDATE user
        SET ${subSql.join('AND ')}
        WHERE deleted_at IS NULL
            AND id = ?
        `;
        values.push(userId);
        await this.query(sql, values);
        return;
    }

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
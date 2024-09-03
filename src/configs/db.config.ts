// mysql db 설정
import mysql, { PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';
import { InternalServerErrorException } from '@_/utils/customError.util';
dotenv.config();

const dbConfig: PoolOptions = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    port: 3306,
    password: process.env.MYSQL_PW,
    database: process.env.MYSQL_NAME,
    waitForConnections: true,
};

export class Db {
    static pool: mysql.Pool = mysql.createPool(dbConfig);

    static async query(sql: string, values:any[] = []): Promise<any> {
        const connection = await this.pool.getConnection();
        try {
            const results = await connection.execute(sql, values);
            return results;
        } catch (err) {
            console.error('쿼리 실패: ', err);
            throw new InternalServerErrorException(err.message);
        } finally {
            connection.release();
        }
    }
}

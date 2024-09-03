import express, { Application, NextFunction, Request, Response,  } from 'express';
import cookieParser from 'cookie-parser';
import mainRouter from '@_routes/main.router';
import { NotFoundException } from './utils/customError.util';

const PORT: number = 8080;

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', mainRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
    throw new NotFoundException('페이지를 찾을 수 없습니다.');
})

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.statusCode >= 500 || !err.statusCode) {
        console.error(err);
        return res.status(500).json({ error: '서버에 문제가 발생했습니다.' });
    }
    return res.status(err.statusCode).json({ error: err.message });
})

app.listen(PORT, (): void => {
    console.log(`서버가 ${PORT}번 포트에서 시작되었습니다.`);
})
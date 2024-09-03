import { Expose } from "class-transformer";

export class User {
    readonly id: number;

    readonly email: string;

    readonly password: string;

    readonly name: string;

    @Expose({ name: 'created_at' })
    readonly createdAt: Date;

    @Expose({ name: 'updated_at' })
    readonly updatedAt: Date;

    @Expose({ name: 'deleted_at' })
    readonly deletedAt: Date;
}
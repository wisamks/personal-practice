import { CommonEntity } from "@_/common/common-entity.abstract";
import { User } from "@_/user/user.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

@Entity('post')
export class Post extends CommonEntity {
    @Column({ type: "varchar", length: 50})
    title: string;

    @Column({ type: 'text' })
    content: string;
    
    @ManyToOne(type => User, user => user.posts, { eager: true, nullable: false })
    @JoinColumn({ name: 'author_id' })
    author: User;
    
    @Column({ name: 'author_id', unsigned: true })
    authorId: number;
}
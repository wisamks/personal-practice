import { CommonEntity } from "@_/common/entities/common-entity.abstract";
import { Tag } from "@_/tag/entities/tag.entity";
import { User } from "@_/user/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

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

    @OneToMany(type => Tag, tag => tag.post, { eager: true })
    tags: Tag[]
}
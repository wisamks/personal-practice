import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "@_/post/entities/post.entity";

@Entity('tag')
export class Tag extends BaseEntity {
    @PrimaryGeneratedColumn({ unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 30 })
    name: string;

    @ManyToOne(type => Post, post => post.tags, { nullable: false })
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @Column({ name: 'post_id', unsigned: true })
    postId: number;
}
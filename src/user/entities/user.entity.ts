import { CommonEntity } from '@_/common/entities/common-entity.abstract';
import { Post } from '@_/post/entities/post.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('user')
export class User extends CommonEntity {
  @Column({ type: 'varchar', length: 500 })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @OneToMany((type) => Post, (post) => post.author)
  posts: Post[];
}

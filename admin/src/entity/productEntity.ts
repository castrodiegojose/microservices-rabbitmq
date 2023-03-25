import { Entity, PrimaryGeneratedColumn, Column, ObjectID } from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column("text")
    title: string | undefined;

    @Column("text")
    image: string | undefined;

    @Column({type: 'int', default: 0 })
    likes: number | undefined;  
}

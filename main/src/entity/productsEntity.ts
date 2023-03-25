import { Column, Entity, ObjectIdColumn  } from "typeorm";
import { ObjectId } from "mongodb";

@Entity()
export class Product {
    @ObjectIdColumn({ type: "string", unique: true })
    _id!: ObjectId;

    @Column({ unique: true })
    admin_id: number | undefined;

    @Column("text")
    title: string | undefined;

    @Column("text")
    image: string | undefined;

    @Column({ type: 'int', default: 0 })
    likes!: number;  

} 
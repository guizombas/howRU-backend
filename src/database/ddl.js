export default async function ddlComands( db ){
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user(
            id INTEGER NOT NULL,
            name TEXT NOT NULL,
            tel TEXT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
        
            CONSTRAINT PK_user PRIMARY KEY (id)
        );
        
        CREATE TABLE IF NOT EXISTS friend(
            id_f1 INTEGER NOT NULL,
            id_f2 INTEGER NOT NULL,
        
            CONSTRAINT PK_friend PRIMARY KEY (id_f1, id_f2),
            CONSTRAINT FK_friend FOREIGN KEY (id_f1, id_f2) REFERENCES user (id,id)
        );
        
        CREATE TABLE IF NOT EXISTS message(
            id INTEGER NOT NULL,
            texto TEXT NOT NULL,
            id_sender INTEGER NOT NULL,
            id_receiver INTEGER NOT NULL,
            send_time TEXT NOT NULL,
        
            CONSTRAINT PK_message PRIMARY KEY (id),
            CONSTRAINT FK_message FOREIGN KEY (id_sender,id_receiver) REFERENCES user (id,id) 
        );
    `)
    return db;
} 
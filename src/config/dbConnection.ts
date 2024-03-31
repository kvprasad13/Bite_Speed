import mysql from 'mysql'; // Import MySQL library
import dotenv from 'dotenv';
dotenv.config();

  const db = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });


// Connect to MySQL database
const connectDb = ()=>{
    
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to MySQL database:', err);
        } else {
            console.log('Connected to MySQL database');
        }
    });
}
export  {connectDb,db};
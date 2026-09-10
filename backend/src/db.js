import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
dotenv.config();
const dir=path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(dir,"../data"),{recursive:true});
fs.mkdirSync(path.join(dir,"../uploads"),{recursive:true});
export const db=new Database(path.join(dir,"../data/ibglobal.sqlite"));
export function initDb(){
 db.pragma("journal_mode=WAL");
 db.exec(`
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,name TEXT NOT NULL,phone TEXT,role TEXT NOT NULL DEFAULT 'CUSTOMER',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS categories(id TEXT PRIMARY KEY,name TEXT UNIQUE NOT NULL,slug TEXT UNIQUE NOT NULL);
 CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,category_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,description TEXT,fabric TEXT,quality TEXT,care TEXT,price INTEGER NOT NULL CHECK(price>=0),inventory_status TEXT NOT NULL DEFAULT 'IN_STOCK',stock INTEGER NOT NULL DEFAULT 0,sizes TEXT NOT NULL DEFAULT '[]',size_chart TEXT NOT NULL DEFAULT '{}',images TEXT NOT NULL DEFAULT '[]',rating REAL NOT NULL DEFAULT 0,review_count INTEGER NOT NULL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(category_id) REFERENCES categories(id));
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT,customer_name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,items TEXT NOT NULL,subtotal INTEGER NOT NULL,delivery_fee INTEGER NOT NULL,total INTEGER NOT NULL,fulfillment TEXT NOT NULL,address TEXT,payment_method TEXT NOT NULL,payment_status TEXT NOT NULL DEFAULT 'PENDING',status TEXT NOT NULL DEFAULT 'NEW',tracking_code TEXT UNIQUE NOT NULL,note TEXT,payment_reference TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS custom_orders(id TEXT PRIMARY KEY,user_id TEXT,customer_name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,garment TEXT NOT NULL,fabric TEXT,measurements TEXT NOT NULL,notes TEXT,status TEXT NOT NULL DEFAULT 'NEW',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY,product_id TEXT NOT NULL,user_id TEXT NOT NULL,name TEXT NOT NULL,rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),comment TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(product_id) REFERENCES products(id));
 `);
}
export function seedAdmin(){
 const email=(process.env.ADMIN_EMAIL||"admin@ibglobalfashion.com").toLowerCase();
 if(!db.prepare("SELECT id FROM users WHERE email=?").get(email)){
  db.prepare("INSERT INTO users(id,email,password_hash,name,role) VALUES(?,?,?,?,?)")
    .run("admin-001",email,bcrypt.hashSync(process.env.ADMIN_PASSWORD||"CHANGE_THIS_ADMIN_PASSWORD",12),"IBGLOBAL Administrator","ADMIN");
 }
 const q=db.prepare("INSERT OR IGNORE INTO categories(id,name,slug) VALUES(?,?,?)");
 [["cat-native","Native Wear","native-wear"],["cat-suits","Suits","suits"],["cat-casual","Casual Wear","casual-wear"],["cat-kids","Kids","kids"]].forEach(x=>q.run(...x));
}
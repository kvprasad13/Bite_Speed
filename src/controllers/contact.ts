import { Request, Response, response } from 'express';
import { db } from '../config/dbConnection';

import {isValidEmail,isValidPhoneNumber,getContactsByEmail,getContactsByPhoneNumber,getContactsByBoth,insertByParameterizedSQLQuery,getResult,getContactId,getRootContact,makeParent,getContactsByParameterizedSQLQuery } from '../constants';

export const createContact = async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body;
    console.log(email + " " + phoneNumber);
    if (!email && !phoneNumber) {
        return res.status(400).json({ "success": false, "message": "Both fields could not be null" });
    }
    if (email&&!isValidEmail(email)) { 
          return res.status(400).json({ "success": false, "message": "Email is not valid" });
 
    }
    if (phoneNumber&&!isValidPhoneNumber(phoneNumber)) { 
          return res.status(400).json({ "success": false, "message": "Phone Number is not valid" });
 
    }
   
    const contactsByEmail = email && await getContactsByEmail( email);
    const contactsByPhoneNumber = phoneNumber && await getContactsByPhoneNumber( phoneNumber);
    
    const contactsByBoth = email && phoneNumber && await getContactsByBoth(email, phoneNumber);

   
    if (email && phoneNumber) {
        
        if (contactsByBoth.length === 0) { 
          
            if (contactsByEmail.length === 0 && contactsByPhoneNumber.length === 0) { 

                const sql = 'insert into contact (email, phoneNumber,createdAt,updatedAt,linkPrecedence) values(?,?,?,?,?)';
                const insertId:number = (await insertByParameterizedSQLQuery(sql, [email, phoneNumber, new Date(), new Date(), 'primary']));
               
                const result = await getResult(insertId);
                res.status(201).json(result);

            }
            else if (contactsByPhoneNumber.length > 0 && contactsByEmail.length > 0) {
                const emailRootContact = await getRootContact(getContactId(await getContactsByEmail(email)));
                const phoneNumberRootContact = await getRootContact(getContactId(await getContactsByPhoneNumber(phoneNumber)));
                
                if (emailRootContact.id === phoneNumberRootContact.id) {

                    const result = getResult(emailRootContact.id);
                    res.status(200).json(result);

                }
                else {
                    if (new Date(emailRootContact.createdAt).getTime() <= new Date(phoneNumberRootContact.createdAt).getTime()) {
                
                        if (await makeParent(phoneNumberRootContact, emailRootContact)) {

                            const result =await getResult(emailRootContact.id);
                            res.status(200).json(result);
                    
                        }
                        else {
                            console.log("Error at making parent")
                        }
                    }
                    else {
                        if (await makeParent(emailRootContact, phoneNumberRootContact)) {
                            const result = await getResult(phoneNumberRootContact.id);
                            res.status(200).json(result);
                        }
                        else {
                            console.log("Error at making parent");
                        }
                    }
                }
            }
            else if (contactsByEmail.length > 0 && contactsByPhoneNumber.length === 0) {

                const rootContact = await getRootContact(contactsByEmail[0].id);

                const sql ='insert into contact (email, phoneNumber,linkedId,linkPrecedence,createdAt,updatedAt) values(?,?,?,?,?,?)';
                const contacts = await getContactsByParameterizedSQLQuery(sql, [email, phoneNumber, rootContact.id, 'secondary', new Date().toISOString(), new Date().toISOString()]);
                
                const result = await getResult(rootContact.id);
                res.status(201).json(result);
                
            }
            else {
                   const rootContact = await getRootContact(contactsByPhoneNumber[0].id);

                const sql ='insert into contact (email, phoneNumber,linkedId,linkPrecedence,createdAt,updatedAt) values(?,?,?,?,?,?)';
                const contacts = await getContactsByParameterizedSQLQuery(sql, [email, phoneNumber, rootContact.id, 'secondary', new Date().toISOString(), new Date().toISOString()]);
                
                const result = await getResult(rootContact.id);
                res.status(201).json(result);
            }
        }
        else {
            
          

              const result = await getResult((await getRootContact(contactsByBoth[0].id)).id);
                res.status(200).json(result);
        }

     }
    else if (email) {
        if (contactsByEmail.length === 0) {

            const sql = 'insert into contact (email, linkPrecedence,createdAt,updatedAt) values (?,?,?,?)';
            
            const contacts = await getContactsByParameterizedSQLQuery(sql, [email, 'primary', new Date().toISOString(), new Date().toISOString()]);
        }
        
        const rootContact = await getRootContact(await getContactId(await getContactsByEmail(email)));
        const result = await getResult(rootContact.id);
        
                res.status(200).json(result);


        
    }
    else if(phoneNumber) {
          if (contactsByPhoneNumber.length === 0) {

            const sql = 'insert into contact (phoneNumber, linkPrecedence,createdAt,updatedAt) values (?,?,?,?)';
            
            const contacts = await getContactsByParameterizedSQLQuery(sql, [phoneNumber, 'primary', new Date().toISOString(), new Date().toISOString()]);
        }
        
            const rootContact = await getRootContact(await getContactId(await getContactsByPhoneNumber(phoneNumber)));
            const result = await getResult(rootContact.id);
            res.status(200).json(result);
        
    }
    else {
        res.status(500).json({ "message":"Server error"})
    }
  
};

export const getAllContacts = (req: Request, res: Response) => {
    try {
        const sql = "select * from contact";
        db.query(sql, (err, data) => {
            if (err) return res.status(500).send(err);

            res.status(200).json({ "success": true, "data": data });
        });
    }
    catch (err) { 
        console.log(err);
        res.status(500).send(err);
    }
};

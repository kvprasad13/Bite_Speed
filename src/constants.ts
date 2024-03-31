import { db } from './config/dbConnection';

interface Contact{
    id: number;
    email: string;
    phoneNumber: string;
    linkedId: number;
    linkPrecedence: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
export const isValidEmail = (email: string): boolean => {
   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export const isValidPhoneNumber = (phoneNumber: string): boolean => {
   
    const phoneRegex = /^\d+$/; 
    return phoneRegex.test(phoneNumber);
}

export const getContactsByParameterizedSQLQuery = async(sql: string, values: any[])=>{
      try {
        const data: Contact[] = await new Promise((resolve, reject) => {
            db.query(sql,values, (err, data) => {
                if (err) reject(err);
                else resolve(data as Contact[]);
            });
        });
       
        return data ;
    } catch (error) {
        console.log(error);
        return [];
    }
}
export const getContactsByEmail = async (property: string): Promise<Contact[]> => {
    const sql = `select * from contact where email=? `;
    return (await getContactsByParameterizedSQLQuery(sql, [property]));
   
};

export  const getContactsByPhoneNumber = async (property: string): Promise<Contact[]> => {
    const sql = `select * from contact where phoneNumber=? `;
     return (await getContactsByParameterizedSQLQuery(sql,[property]));
};

export const getContactsByBoth =async (email:string, phoneNumber:string): Promise<Contact[]>=>{
    const sql = `select * from contact where email=? and phoneNumber=?`;
    return (await getContactsByParameterizedSQLQuery(sql,[email,phoneNumber]));
}

export const getRootContact = async(contactId: Number):Promise<Contact >=> {

    try {
        const sql = `select * from contact where id=?`;
        const contacts = await getContactsByParameterizedSQLQuery(sql,[contactId]);
        const contact = contacts[0];
        if (contact.linkedId === null) return contact;
        return getRootContact(contact.linkedId);
    }
    catch (err) { 
        console.log(err);
       
    }
   
}
export const getContactId = (contacts: Contact[]) => {
    
    const contact = contacts[0];
    return contact.id;

}

export const makeParent =async (child: Contact, parent: Contact) => {
    //child.linkedId =parent.id;
    // child.linkPrecedence = "secondary";
    // child.updatedAt = new Date();

     try {
        const sql = `UPDATE contact SET linkedId = ?, linkPrecedence = ?, updatedAt = ? WHERE id = ?`;
        const values = [parent.id, "secondary", new Date(), child.id];

       
         const result  = await new Promise((resolve, reject) => {
            db.query(sql, values,(err, data) => {
                if (err) reject(err);
                else resolve(data );
            });
        }); 
        
        console.log('Contact updated successfully:', result);
        return true; // Indicate successful update
    } catch (error) {
        console.error('Error updating contact:', error);
        return false; // Indicate failed update
    }
    
}
export const getAllChildContacts = async (contactId: number): Promise<{ emails: string[], phoneNumbers: string[], secondaryContactIds: number[] }> => {
    const res: { emails: string[], phoneNumbers: string[], secondaryContactIds: number[] } = {
        emails: [],
        phoneNumbers: [], 
        secondaryContactIds: []
    };
    try {
        const sql = 'select * from contact where linkedId=?';
       

        const contacts = await getContactsByParameterizedSQLQuery(sql, [contactId]);
     
        for (const contact of contacts) {
            
            if (contact.id)
                res.secondaryContactIds.push(contact.id)
            
            if (contact.phoneNumber)
                res.phoneNumbers.push(contact.phoneNumber)
            
            if (contact.email)
                res.emails.push(contact.email)
            

            const childObj = await getAllChildContacts(contact.id);
            res.emails.push(...childObj.emails);
            res.phoneNumbers.push(...childObj.phoneNumbers);
            res.secondaryContactIds.push(...childObj.secondaryContactIds);
            
            
        }
    } catch (err) {
        console.log(err);
    }
    return res;
}

export const getResult = async (contactId: number) => {
      const res: { contact: { primaryContactId: number, emails: string[], phoneNumbers: string[], secondaryContactIds: number[] } } = {
            contact: {
                primaryContactId: contactId,
                emails: [], // first element being email of primary contact 
                phoneNumbers: [], // first element being phoneNumber of primary contact
                secondaryContactIds: [] // Array of all Contact IDs that are "secondary" to the primary contact
            }
        };
    try {
      
        const sql = `select * from contact where id=?`;
   
        const contact = (await getContactsByParameterizedSQLQuery(sql, [contactId]))[0];
        
        if (contact.email)
            res.contact.emails.push(contact.email);

        if (contact.phoneNumber)
            res.contact.phoneNumbers.push(contact.phoneNumber);


        const obj = await getAllChildContacts(contactId);
       

        res.contact.emails =[ ...new Set([...res.contact.emails, ...obj.emails])];
        res.contact.phoneNumbers =[ ...new Set([...res.contact.phoneNumbers, ...new Set(obj.phoneNumbers)])];
        res.contact.secondaryContactIds = [...new Set(obj.secondaryContactIds)];

  

        
    }
    catch (err) { 
        console.log(err);
        
    }
    return res;
}

export const insertByParameterizedSQLQuery =  async(sql: string, values: any[]):Promise<number>=>{
      try {
        const data:{insertId:number} = await new Promise((resolve, reject) => {
            db.query(sql,values, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
           console.log("New Contact created:");
                console.log(data.insertId);
        return data.insertId ;
    } catch (error) {
        console.log(error);
        return null;
    }
}


